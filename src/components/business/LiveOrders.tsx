import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Printer, CheckCircle2, Clock, 
  Hand, Banknote, RefreshCw, Volume2, CreditCard,
  Plus, ShoppingBag, Check, X, BellRing
} from 'lucide-react';
import { Business, Order, ServiceRequest } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../lib/audio';
import { printKitchenTicket } from '../../lib/thermalPrinter';
import { sendNativeNotification } from '../../lib/notifications';
import { useToast } from '../../context/ToastContext';

interface LiveOrdersProps {
  business: Business;
  onNavigatePos?: () => void;
}

export const LiveOrders: React.FC<LiveOrdersProps> = ({ business, onNavigatePos }) => {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'preparing' | 'requests'>('all');
  const [isSoundActive, setIsSoundActive] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, requestsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('business_id', business.id)
          .in('status', ['pending', 'preparing', 'served'])
          .order('created_at', { ascending: false }),
        supabase
          .from('service_requests')
          .select('*')
          .eq('business_id', business.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (requestsRes.data) setServiceRequests(requestsRes.data as ServiceRequest[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel(`live-kitchen-${business.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            setOrders((prev) => [newOrder, ...prev]);
            if (isSoundActive) {
              sound.playOrderBell();
            }
            printKitchenTicket(business, newOrder);
            toast.info(`${newOrder.table_no} için yeni sipariş geldi (${newOrder.total_amount.toFixed(2)} ₺)`);
            
            // Background Push Notification
            sendNativeNotification({
              title: `Yeni Sipariş: ${newOrder.table_no}`,
              body: `${newOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ')} (${newOrder.total_amount.toFixed(2)} ₺)`,
              url: '/admin',
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order;
            setOrders((prev) =>
              updated.status === 'paid' || updated.status === 'cancelled'
                ? prev.filter((o) => o.id !== updated.id)
                : prev.map((o) => (o.id === updated.id ? updated : o))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReq = payload.new as ServiceRequest;
            setServiceRequests((prev) => [newReq, ...prev]);
            if (isSoundActive) {
              sound.playWaiterCall();
            }
            
            const reqLabel =
              newReq.request_type === 'waiter'
                ? 'Garson Çağrısı'
                : newReq.request_type === 'bill_cash'
                ? 'Hesap İste (Nakit)'
                : 'Hesap İste (POS / Kart)';

            toast.warning(`${newReq.table_no}: ${reqLabel}`);

            // Background Push Notification
            sendNativeNotification({
              title: `${newReq.table_no}: ${reqLabel}`,
              body: `${newReq.table_no} masası servis personeli bekliyor.`,
              url: '/admin',
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as ServiceRequest;
            setServiceRequests((prev) =>
              updated.status === 'resolved'
                ? prev.filter((r) => r.id !== updated.id)
                : prev.map((r) => (r.id === updated.id ? updated : r))
            );
          }
        }
      )
      .subscribe();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('focus', handleSync);
    window.addEventListener('online', handleSync);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('online', handleSync);
    };
  }, [business.id, isSoundActive]);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (!error) {
      if (status === 'paid' || status === 'cancelled') {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
      toast.success('Sipariş güncellendi.');
    }
  };

  const resolveServiceRequest = async (reqId: string) => {
    const { error } = await supabase
      .from('service_requests')
      .update({ status: 'resolved' })
      .eq('id', reqId);

    if (!error) {
      setServiceRequests((prev) => prev.filter((r) => r.id !== reqId));
      toast.success('Çağrı tamamlandı.');
    }
  };

  const [closingOrder, setClosingOrder] = useState<Order | null>(null);
  const [isClosingPayment, setIsClosingPayment] = useState(false);

  const handleCloseOrderWithPayment = async (orderId: string, paymentMethod: 'cash' | 'credit_card') => {
    try {
      setIsClosingPayment(true);
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'paid', 
          payment_method: paymentMethod, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success(`Hesap ${paymentMethod === 'credit_card' ? 'POS / Kredi Kartı' : 'Nakit'} ile başarıyla kapatıldı.`);
      setClosingOrder(null);
    } catch (err: any) {
      toast.error('Hesap kapatılırken hata oluştu: ' + err.message);
    } finally {
      setIsClosingPayment(false);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'pending') return o.status === 'pending';
    if (activeFilter === 'preparing') return o.status === 'preparing';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 1. MASA ÇAĞRILARI & GARSON İSTEKLERİ (ÖNE ÇIKAN CANLI BİLDİRİM ALANI) */}
      {serviceRequests.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-orange-500/10 border-2 border-rose-400/80 rounded-2xl p-4 shadow-md animate-in fade-in space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-rose-600" />
                <span>Bekleyen Masa & Garson Çağrıları ({serviceRequests.length})</span>
              </h3>
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
              Canlı Çağrı
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {serviceRequests.map((req) => {
              const isWaiter = req.request_type === 'waiter';
              const isCard = req.request_type === 'bill_card';
              const isCash = req.request_type === 'bill_cash';

              return (
                <div
                  key={req.id}
                  className="bg-white border border-rose-200 rounded-xl p-3 shadow-xs flex flex-col justify-between space-y-2 hover:border-rose-400 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900 bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                      {req.table_no}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        isWaiter
                          ? 'bg-orange-50 text-orange-800 border-orange-200'
                          : isCard
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {isWaiter && <BellRing className="w-3 h-3 text-orange-600" />}
                      {isCard && <CreditCard className="w-3 h-3 text-emerald-600" />}
                      {isCash && <Banknote className="w-3 h-3 text-amber-600" />}
                      <span>
                        {isWaiter ? 'Garson Çağrısı' : isCard ? 'Hesap (POS / Kart)' : 'Hesap (Nakit)'}
                      </span>
                    </span>
                  </div>

                  {/* Customer Reason / Note */}
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs text-slate-700 font-medium">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase mb-0.5">
                      Talep Nedeni:
                    </span>
                    <p className="font-semibold text-slate-800">
                      {req.notes || (isWaiter ? 'Personel masaya çağrılıyor' : 'Hesap kapatma talebi')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => resolveServiceRequest(req.id)}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Tamamlandı / Yanıtla</span>
                    </button>

                    {!isWaiter && onNavigatePos && (
                      <button
                        onClick={onNavigatePos}
                        className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition"
                        title="POS Kasa Ekranında Aç"
                      >
                        POS
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Action Bar & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeFilter === 'all'
                ? 'bg-[#0B0F17] text-white shadow-sm'
                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Aktif Siparişler ({orders.length})
          </button>

          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Bekleyenler ({pendingOrders.length})
          </button>

          <button
            onClick={() => setActiveFilter('preparing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeFilter === 'preparing'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100'
            }`}
          >
            Hazırlananlar ({preparingOrders.length})
          </button>

          <button
            onClick={() => setActiveFilter('requests')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 relative flex items-center gap-1.5 ${
              activeFilter === 'requests'
                ? 'bg-rose-600 text-white shadow-sm'
                : serviceRequests.length > 0
                ? 'bg-rose-50 border border-rose-300 text-rose-900 hover:bg-rose-100 font-extrabold'
                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Garson & Hesap Çağrıları ({serviceRequests.length})</span>
            {serviceRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onNavigatePos && (
            <button
              onClick={onNavigatePos}
              className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Sipariş Ekle</span>
            </button>
          )}

          <button
            onClick={() => setIsSoundActive(!isSoundActive)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              isSoundActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
            title="Sesli Bildirim"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isSoundActive ? 'Ses Açık' : 'Sessiz'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-xs font-bold">
          Siparişler yükleniyor...
        </div>
      ) : activeFilter === 'requests' ? (
        /* Service Requests Detailed View */
        serviceRequests.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-14 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
              <Hand className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">Bekleyen Çağrı Bulunmuyor</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Müşteriler masadaki QR menüden Garson Çağır veya Hesap İste butonuna bastığında çağrılar canlı olarak buraya düşer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceRequests.map((req) => {
              const isWaiter = req.request_type === 'waiter';
              const isCard = req.request_type === 'bill_card';
              const isCash = req.request_type === 'bill_cash';

              return (
                <div
                  key={req.id}
                  className="bg-white border-2 border-rose-300 rounded-2xl p-4 shadow-sm space-y-3 hover:border-rose-400 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900 bg-slate-900 text-white px-3 py-1 rounded-xl">
                      {req.table_no}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 border ${
                        isWaiter
                          ? 'bg-orange-50 text-orange-800 border-orange-200'
                          : isCard
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {isWaiter && <BellRing className="w-3 h-3 text-orange-600" />}
                      {isCard && <CreditCard className="w-3 h-3 text-emerald-600" />}
                      {isCash && <Banknote className="w-3 h-3 text-amber-600" />}
                      <span>
                        {isWaiter ? 'Garson Çağrısı' : isCard ? 'Hesap (POS / Kart)' : 'Hesap (Nakit)'}
                      </span>
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Talep / Not:
                    </span>
                    <p className="text-xs font-bold text-slate-800">
                      {req.notes || (isWaiter ? 'Personel masaya çağrılıyor' : 'Hesap kapatma talebi')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => resolveServiceRequest(req.id)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Çağrıyı Tamamla</span>
                    </button>

                    {!isWaiter && onNavigatePos && (
                      <button
                        onClick={onNavigatePos}
                        className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                      >
                        POS
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filteredOrders.length === 0 ? (
        /* Empty Orders */
        <div className="bg-white border border-slate-200/80 rounded-2xl p-14 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-800">Aktif Sipariş Bulunmuyor</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            QR menüden veya Garson terminalinden verilen siparişler anında burada belirecektir.
          </p>
        </div>
      ) : (
        /* Orders List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'pending';
            const isPreparing = order.status === 'preparing';

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl">
                        {order.table_no}
                      </span>
                      {order.order_source === 'waiter' && (
                        <span className="text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded">
                          Garson
                        </span>
                      )}
                      {order.order_source === 'pos' && (
                        <span className="text-[9px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded">
                          Kasa POS
                        </span>
                      )}
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      isPending
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}>
                      {isPending ? 'Bekliyor' : 'Hazırlanıyor'}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-1.5 py-2.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-black text-orange-600 bg-orange-50 w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0">
                            {item.quantity}x
                          </span>
                          <span className="font-bold text-slate-800 truncate">{item.name}</span>
                        </div>
                        <span className="font-extrabold text-slate-700 shrink-0">
                          {(item.price * item.quantity).toFixed(2)} ₺
                        </span>
                      </div>
                    ))}

                    {order.customer_notes && (
                      <div className="p-2 bg-amber-50/70 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 mt-2 font-medium">
                        <strong>Not:</strong> {order.customer_notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Total & Actions */}
                <div className="space-y-2.5 pt-2.5 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Toplam:</span>
                    <span className="font-black text-base text-orange-600">
                      {order.total_amount.toFixed(2)} ₺
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {isPending ? (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
                      >
                        Hazırla
                      </button>
                    ) : null}

                    <button
                      onClick={() => setClosingOrder(order)}
                      className={`py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition ${
                        !isPending ? 'col-span-1' : ''
                      }`}
                    >
                      Hesabı Kapat
                    </button>

                    <button
                      onClick={() => printKitchenTicket(business, order)}
                      className={`py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 ${
                        !isPending ? 'col-span-1' : 'col-span-2'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Yazdır</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* HESABI KAPAT POP-UP / MODAL */}
      {closingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Hesabı Kapat — {closingOrder.table_no}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ödeme türünü seçerek masanın hesabını kapatınız.
                </p>
              </div>
              <button
                onClick={() => setClosingOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order Items Breakdown */}
            <div className="bg-slate-50 rounded-2xl p-3.5 max-h-48 overflow-y-auto space-y-2 border border-slate-100">
              {closingOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-bold truncate">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-slate-900 font-black shrink-0">
                    {(item.price * item.quantity).toFixed(2)} ₺
                  </span>
                </div>
              ))}

              {closingOrder.customer_notes && (
                <div className="pt-2 border-t border-slate-200 text-[11px] text-amber-900">
                  <strong>Not:</strong> {closingOrder.customer_notes}
                </div>
              )}
            </div>

            {/* Total Amount Banner */}
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200/80 flex items-center justify-between">
              <span className="text-xs font-bold text-orange-950">Ödenecek Tutar:</span>
              <span className="text-xl font-black text-orange-600">
                {closingOrder.total_amount.toFixed(2)} ₺
              </span>
            </div>

            {/* Payment Method Action Buttons */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={isClosingPayment}
                  onClick={() => handleCloseOrderWithPayment(closingOrder.id, 'credit_card')}
                  className="p-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/20 transition flex flex-col items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>POS / Kredi Kartı</span>
                </button>

                <button
                  disabled={isClosingPayment}
                  onClick={() => handleCloseOrderWithPayment(closingOrder.id, 'cash')}
                  className="p-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition flex flex-col items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Banknote className="w-5 h-5" />
                  <span>Nakit Ödeme</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setClosingOrder(null)}
                className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
