import React, { useState, useEffect, useRef } from 'react';
import { 
  ChefHat, Printer, CheckCircle2, Clock, 
  Hand, Banknote, RefreshCw, Volume2, CreditCard, Landmark,
  Plus, ShoppingBag, Check, X, BellRing
} from 'lucide-react';
import { Business, Order, ServiceRequest } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../lib/audio';
import { printKitchenTicket, isWebAutoPrintEnabled, setWebAutoPrintEnabled } from '../../lib/thermalPrinter';
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
  const [isAutoPrintActive, setIsAutoPrintActive] = useState(() => isWebAutoPrintEnabled());

  const isFirstLoadRef = useRef(true);

  // Close Order / Payment Modal State
  const [closingOrder, setClosingOrder] = useState<Order | null>(null);
  const [isClosingPayment, setIsClosingPayment] = useState(false);

  // Cancel Order Modal State
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const loadData = async (isSilent = false) => {
    if (!isSilent && isFirstLoadRef.current && orders.length === 0) {
      setLoading(true);
    }
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
      isFirstLoadRef.current = false;
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
              sound.playOrderBell(business.sound_preference);
            }
            
            // Automatic Web & POS Receipt Print
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
              sound.playWaiterCall(business.sound_preference);
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
      loadData(true);
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

    if (error) {
      toast.error('Sipariş güncellenirken hata oluştu.');
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      toast.success(status === 'preparing' ? 'Sipariş hazırlanıyor olarak işaretlendi.' : 'Sipariş güncellendi.');
    }
  };

  const resolveServiceRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('service_requests')
      .update({ status: 'resolved', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      toast.error('Çağrı yanıtlanırken hata oluştu.');
    } else {
      setServiceRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success('Çağrı tamamlandı.');
    }
  };

  const handleCloseOrderWithPayment = async (orderId: string, paymentMethod: 'cash' | 'credit_card' | 'other') => {
    setIsClosingPayment(true);
    try {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder) return;

      const { error: orderErr } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_method: paymentMethod,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (orderErr) throw orderErr;

      // Free the table if table_no is present
      if (targetOrder.table_no && targetOrder.table_no !== 'Kasa Satışı') {
        await supabase
          .from('tables')
          .update({ is_occupied: false })
          .eq('business_id', business.id)
          .eq('table_no', targetOrder.table_no);
      }

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      const methodLabel = paymentMethod === 'credit_card' ? 'Kredi Kartı' : paymentMethod === 'cash' ? 'Nakit' : 'Diğer / Havale';
      toast.success(`${targetOrder.table_no} hesabı başarıyla kapatıldı (${methodLabel}).`);
      setClosingOrder(null);
    } catch (err: any) {
      toast.error('Hesap kapatılırken hata oluştu: ' + err.message);
    } finally {
      setIsClosingPayment(false);
    }
  };

  const handleConfirmCancelOrder = async (orderId: string) => {
    setIsCancelling(true);
    try {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder) return;

      const { error: orderErr } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (orderErr) throw orderErr;

      // Free table if no other active orders remain for this table
      if (targetOrder.table_no && targetOrder.table_no !== 'Kasa Satışı') {
        const otherActiveOrders = orders.filter(
          (o) => o.id !== orderId && o.table_no === targetOrder.table_no && (o.status === 'pending' || o.status === 'preparing')
        );
        if (otherActiveOrders.length === 0) {
          await supabase
            .from('tables')
            .update({ is_occupied: false })
            .eq('business_id', business.id)
            .eq('table_no', targetOrder.table_no);
        }
      }

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success(`${targetOrder.table_no} siparişi iptal edildi.`);
      setCancellingOrder(null);
    } catch (err: any) {
      toast.error('Sipariş iptal edilirken hata oluştu: ' + err.message);
    } finally {
      setIsCancelling(false);
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
    <div className="space-y-5">
      {/* 1. MASA ÇAĞRILARI & GARSON İSTEKLERİ (Tonal depth without hard lines) */}
      {serviceRequests.length > 0 && (
        <div className="bg-[#141A26] rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-slate-200" />
                <span>Bekleyen Masa & Garson Çağrıları ({serviceRequests.length})</span>
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-300 bg-[#222E42] px-2.5 py-0.5 rounded-full">
              Canlı Çağrı
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {serviceRequests.map((req) => {
              const isWaiter = req.request_type === 'waiter';
              const isCard = req.request_type === 'bill_card';

              return (
                <div
                  key={req.id}
                  onMouseMove={handleSpotlightMove}
                  className="bg-[#111622] rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-2.5 transition spotlight-card spotlight-glow"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-100 bg-[#1C2433] px-2.5 py-1 rounded-lg">
                      {req.table_no}
                    </span>

                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-[#1C2433] text-slate-300">
                      {isWaiter && <BellRing className="w-3 h-3 text-slate-300" />}
                      {isCard && <CreditCard className="w-3 h-3 text-slate-300" />}
                      {!isWaiter && !isCard && <Banknote className="w-3 h-3 text-slate-300" />}
                      <span>
                        {isWaiter ? 'Garson Çağrısı' : isCard ? 'Hesap (POS / Kart)' : 'Hesap (Nakit)'}
                      </span>
                    </span>
                  </div>

                  {/* Customer Reason / Note */}
                  <div className="bg-[#0C1017] rounded-xl p-2.5 text-xs text-slate-300 font-medium">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase mb-0.5">
                      Talep Nedeni:
                    </span>
                    <p className="font-semibold text-slate-200">
                      {req.notes || (isWaiter ? 'Personel masaya çağrılıyor' : 'Hesap kapatma talebi')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => resolveServiceRequest(req.id)}
                      className="flex-1 py-2 bg-[#1C2433] hover:bg-[#253043] text-slate-100 hover:text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5 text-slate-300" />
                      <span>Tamamlandı / Yanıtla</span>
                    </button>

                    {!isWaiter && onNavigatePos && (
                      <button
                        onClick={onNavigatePos}
                        className="py-2 px-3 bg-[#1C2433] hover:bg-[#253043] text-slate-200 hover:text-white font-bold text-xs rounded-xl transition active:scale-95"
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

      {/* Top Action Bar & Filter Row (Tonal background without hard box outlines) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111622] p-3 rounded-2xl shadow-md">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            onMouseMove={handleSpotlightMove}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeFilter === 'all'
                ? 'bg-white/20 text-white shadow-sm'
                : 'bg-[#182030] text-slate-400 hover:text-slate-200 hover:bg-[#1C2433]'
            }`}
          >
            Aktif Siparişler ({orders.length})
          </button>

          <button
            onClick={() => setActiveFilter('pending')}
            onMouseMove={handleSpotlightMove}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeFilter === 'pending'
                ? 'bg-white/20 text-white shadow-sm'
                : 'bg-[#182030] text-slate-400 hover:text-slate-200 hover:bg-[#1C2433]'
            }`}
          >
            Bekleyenler ({pendingOrders.length})
          </button>

          <button
            onClick={() => setActiveFilter('preparing')}
            onMouseMove={handleSpotlightMove}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeFilter === 'preparing'
                ? 'bg-white/20 text-white shadow-sm'
                : 'bg-[#182030] text-slate-400 hover:text-slate-200 hover:bg-[#1C2433]'
            }`}
          >
            Hazırlananlar ({preparingOrders.length})
          </button>

          <button
            onClick={() => setActiveFilter('requests')}
            onMouseMove={handleSpotlightMove}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 relative flex items-center gap-1.5 ${
              activeFilter === 'requests'
                ? 'bg-white/20 text-white shadow-sm'
                : serviceRequests.length > 0
                ? 'bg-[#222E42] text-slate-200 font-extrabold'
                : 'bg-[#182030] text-slate-400 hover:text-slate-200 hover:bg-[#1C2433]'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Çağrılar ({serviceRequests.length})</span>
            {serviceRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onNavigatePos && (
            <button
              onClick={onNavigatePos}
              className="px-3.5 py-2 bg-white hover:bg-slate-200 text-slate-900 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Sipariş Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-[#111622] rounded-2xl p-12 text-center text-slate-400 text-xs font-bold shadow-md">
          Siparişler yükleniyor...
        </div>
      ) : activeFilter === 'requests' ? (
        /* Service Requests Detailed View */
        serviceRequests.length === 0 ? (
          <div className="bg-[#111622] rounded-2xl p-14 text-center shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-[#1C2433] flex items-center justify-center mx-auto mb-2 text-slate-400 shadow-sm">
              <Hand className="w-5 h-5" />
            </div>
            <h3 className="font-black text-sm text-slate-200">Bekleyen Çağrı Bulunmuyor</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Müşteriler masadaki QR menüden Garson Çağır veya Hesap İste butonuna bastığında çağrılar canlı olarak buraya düşer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceRequests.map((req) => {
              const isWaiter = req.request_type === 'waiter';
              const isCard = req.request_type === 'bill_card';

              return (
                <div
                  key={req.id}
                  onMouseMove={handleSpotlightMove}
                  className="bg-[#111622] rounded-2xl p-4 shadow-lg space-y-3 transition spotlight-card spotlight-glow"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-white">
                      {req.table_no}
                    </span>
                    <span className="text-xs font-bold flex items-center gap-1 text-slate-300">
                      {isWaiter && <BellRing className="w-3 h-3 text-slate-300" />}
                      {isCard && <CreditCard className="w-3 h-3 text-slate-300" />}
                      {!isWaiter && !isCard && <Banknote className="w-3 h-3 text-slate-300" />}
                      <span>
                        {isWaiter ? 'Garson Çağrısı' : isCard ? 'Hesap (POS / Kart)' : 'Hesap (Nakit)'}
                      </span>
                    </span>
                  </div>

                  <div className="bg-[#0C1017] rounded-2xl p-3 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      Talep / Not:
                    </span>
                    <p className="text-xs font-bold text-slate-200">
                      {req.notes || (isWaiter ? 'Personel masaya çağrılıyor' : 'Hesap kapatma talebi')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => resolveServiceRequest(req.id)}
                      className="flex-1 py-2.5 bg-white hover:bg-slate-200 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Çağrıyı Tamamla</span>
                    </button>

                    {!isWaiter && onNavigatePos && (
                      <button
                        onClick={onNavigatePos}
                        className="py-2.5 px-3.5 bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold text-xs rounded-xl transition"
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
        <div className="bg-[#111622] rounded-2xl p-14 text-center shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-[#1C2433] flex items-center justify-center mx-auto mb-2 text-slate-400 shadow-sm">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="font-black text-sm text-slate-200">Aktif Sipariş Bulunmuyor</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            QR menüden veya Garson terminalinden verilen siparişler anında burada belirecektir.
          </p>
        </div>
      ) : (
        /* Orders List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'pending';

            return (
              <div
                key={order.id}
                onMouseMove={handleSpotlightMove}
                className="bg-[#111622] rounded-2xl p-4 shadow-lg transition flex flex-col justify-between space-y-3 spotlight-card spotlight-glow"
              >
                <div>
                  <div className="flex items-center justify-between pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-white">
                        {order.table_no}
                      </span>
                      {order.order_source === 'waiter' && (
                        <span className="text-[9px] font-bold bg-white/10 text-slate-200 px-1.5 py-0.5 rounded">
                          Garson
                        </span>
                      )}
                      {order.order_source === 'pos' && (
                        <span className="text-[9px] font-bold bg-[#1C2433] text-slate-300 px-1.5 py-0.5 rounded">
                          Kasa POS
                        </span>
                      )}
                      {order.order_source === 'trendyol' && (
                        <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30">
                          Trendyol Yemek {order.external_order_id || ''}
                        </span>
                      )}
                      {order.order_source === 'yemeksepeti' && (
                        <span className="text-[9px] font-black bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md border border-rose-500/30">
                          Yemeksepeti {order.external_order_id || ''}
                        </span>
                      )}
                      {order.order_source === 'getir' && (
                        <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
                          GetirYemek {order.external_order_id || ''}
                        </span>
                      )}
                      {order.order_source === 'migros' && (
                        <span className="text-[9px] font-black bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-md border border-orange-500/30">
                          Migros Yemek {order.external_order_id || ''}
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-bold text-slate-300 shrink-0">
                      {isPending ? 'Bekliyor' : order.status === 'served' ? 'Kuryede / Hazır' : 'Hazırlanıyor'}
                    </span>
                  </div>

                  {/* Translucent Separator */}
                  <div className="h-[1px] bg-white/[0.06] my-1" />

                  {/* Platform Delivery Address & Courier Meta if Available */}
                  {order.platform_metadata && (
                    <div className="bg-[#0C1017] p-2.5 rounded-xl space-y-1 text-xs border border-white/[0.04]">
                      {order.platform_metadata.customer_name && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-bold">Müşteri:</span>
                          <span className="font-extrabold text-white">{order.platform_metadata.customer_name}</span>
                        </div>
                      )}
                      {order.platform_metadata.delivery_address && (
                        <div className="text-[11px] text-slate-300 leading-snug">
                          <span className="text-slate-400 font-bold block">Teslimat Adresi:</span>
                          <p className="text-slate-200 mt-0.5 line-clamp-2">{order.platform_metadata.delivery_address}</p>
                        </div>
                      )}
                      {order.platform_metadata.courier_name && (
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>Kurye Durumu:</span>
                          <span className="text-emerald-400 font-bold">{order.platform_metadata.courier_name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="space-y-1.5 py-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-xs text-slate-400 shrink-0 min-w-[18px]">
                            {item.quantity}x
                          </span>
                          <span className="font-bold text-slate-200 truncate">{item.name}</span>
                        </div>
                        <span className="font-extrabold text-slate-300 shrink-0">
                          {(item.price * item.quantity).toFixed(2)} ₺
                        </span>
                      </div>
                    ))}

                    {order.customer_notes && (
                      <div className="p-2 bg-[#0C1017] rounded-xl text-[11px] text-slate-300 mt-2 font-medium">
                        <strong className="text-slate-200">Not:</strong> {order.customer_notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Total & Actions */}
                <div className="space-y-2.5 pt-2">
                  <div className="h-[1px] bg-white/[0.06] my-1" />

                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-slate-400 font-bold">Toplam:</span>
                    <span className="font-black text-base text-white">
                      {order.total_amount.toFixed(2)} ₺
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {isPending ? (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        onMouseMove={handleSpotlightMove}
                        className="py-2.5 bg-[#1C2433] hover:bg-[#253043] text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95"
                      >
                        Siparişi Onayla
                      </button>
                    ) : order.status === 'preparing' ? (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        onMouseMove={handleSpotlightMove}
                        className="py-2.5 bg-[#1C2433] hover:bg-[#253043] text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95"
                      >
                        Hazırlandı
                      </button>
                    ) : null}

                    <button
                      onClick={() => setClosingOrder(order)}
                      onMouseMove={handleSpotlightMove}
                      className={`py-2.5 bg-[#1C2433] hover:bg-[#253043] text-slate-200 hover:text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 ${
                        !isPending && order.status !== 'preparing' ? 'col-span-1' : ''
                      }`}
                    >
                      {['trendyol', 'yemeksepeti', 'getir', 'migros'].includes(order.order_source)
                        ? 'Teslim Edildi'
                        : 'Hesabı Kapat'}
                    </button>

                    <div className="grid grid-cols-2 gap-1.5 col-span-2 pt-0.5">
                      <button
                        onClick={() => printKitchenTicket(business, order, true)}
                        onMouseMove={handleSpotlightMove}
                        className="py-2.5 bg-[#1C2433] hover:bg-[#253043] text-slate-200 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                        title="Termal Fiş Yazdır (Web & POS)"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Fiş Yazdır</span>
                      </button>

                      <button
                        onClick={() => setCancellingOrder(order)}
                        onMouseMove={handleSpotlightMove}
                        className="py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                        title="Siparişi İptal Et"
                      >
                        <X className="w-3.5 h-3.5 text-rose-400" />
                        <span>İptal Et</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SİPARİŞİ İPTAL ET POP-UP / MODAL */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#111622] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-base font-black text-white">
                Siparişi İptal Et
              </h3>
              <button
                onClick={() => setCancellingOrder(null)}
                className="p-1 text-slate-400 hover:text-white transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#0C1017] rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-400">Masa / Adisyon:</span>
                <span className="text-white font-extrabold">{cancellingOrder.table_no}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-400">Toplam Tutar:</span>
                <span className="text-rose-300 font-extrabold">{cancellingOrder.total_amount.toFixed(2)} ₺</span>
              </div>
              <div className="pt-2 text-[11px] text-slate-400">
                Bu siparişi iptal etmek istediğinize emin misiniz? Sipariş listeden kaldırılacak ve masa hesabı sıfırlanacaktır.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setCancellingOrder(null)}
                disabled={isCancelling}
                className="py-3 bg-[#1C2433] hover:bg-[#253043] text-slate-300 hover:text-white font-bold text-xs rounded-xl transition"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleConfirmCancelOrder(cancellingOrder.id)}
                disabled={isCancelling}
                className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {isCancelling ? 'İptal Ediliyor...' : 'İptali Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HESABI KAPAT POP-UP / MODAL */}
      {closingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#111622] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-black text-white">
                  Hesabı Kapat — {closingOrder.table_no}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ödeme türünü seçerek masanın hesabını kapatınız.
                </p>
              </div>
              <button
                onClick={() => setClosingOrder(null)}
                className="p-1 text-slate-400 hover:text-white transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order Items Breakdown */}
            <div className="bg-[#0C1017] rounded-xl p-3.5 max-h-48 overflow-y-auto space-y-2">
              {closingOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold truncate">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-white font-black shrink-0">
                    {(item.price * item.quantity).toFixed(2)} ₺
                  </span>
                </div>
              ))}

              {closingOrder.customer_notes && (
                <div className="pt-2 text-[11px] text-slate-300">
                  <strong className="text-white">Not:</strong> {closingOrder.customer_notes}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-3.5 bg-[#0C1017] rounded-xl">
              <span className="font-extrabold text-xs text-slate-400 uppercase">Ödenecek Tutar:</span>
              <span className="font-black text-lg text-white">
                {closingOrder.total_amount.toFixed(2)} ₺
              </span>
            </div>

            {/* Payment Method Action Buttons (Harmonious #1C2433 / #253043 palette) */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <button
                onClick={() => handleCloseOrderWithPayment(closingOrder.id, 'cash')}
                disabled={isClosingPayment}
                className="p-3.5 bg-[#1C2433] hover:bg-[#253043] text-slate-100 hover:text-white rounded-xl font-bold text-xs transition flex flex-col items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-95 group"
              >
                <Banknote className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
                <span>Nakit</span>
              </button>

              <button
                onClick={() => handleCloseOrderWithPayment(closingOrder.id, 'credit_card')}
                disabled={isClosingPayment}
                className="p-3.5 bg-[#1C2433] hover:bg-[#253043] text-slate-100 hover:text-white rounded-xl font-bold text-xs transition flex flex-col items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-95 group"
              >
                <CreditCard className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
                <span>POS / Kart</span>
              </button>

              <button
                onClick={() => handleCloseOrderWithPayment(closingOrder.id, 'other')}
                disabled={isClosingPayment}
                className="p-3.5 bg-[#1C2433] hover:bg-[#253043] text-slate-100 hover:text-white rounded-xl font-bold text-xs transition flex flex-col items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-95 group"
              >
                <Landmark className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
                <span>Diğer (IBAN)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
