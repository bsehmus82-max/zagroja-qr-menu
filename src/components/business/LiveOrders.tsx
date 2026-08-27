import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Printer, CheckCircle2, Clock, 
  Hand, Banknote, RefreshCw, Volume2, CreditCard,
  Plus, ShoppingBag, Check, X
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

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'pending') return o.status === 'pending';
    if (activeFilter === 'preparing') return o.status === 'preparing' || o.status === 'served';
    return true;
  });

  return (
    <div className="space-y-4">
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
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeFilter === 'requests'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Garson & Hesap ({serviceRequests.length})
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
        /* Service Requests */
        serviceRequests.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-14 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
              <Hand className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">Bekleyen Çağrı Yok</h3>
            <p className="text-xs text-slate-400 mt-0.5">Garson veya hesap çağrıları anında buraya düşer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white border-2 border-rose-200 rounded-2xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                    {req.table_no}
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                    {req.request_type === 'waiter'
                      ? 'Garson Çağrısı'
                      : req.request_type === 'bill_cash'
                      ? 'Nakit Hesap'
                      : 'POS / Kart Hesap'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {req.table_no} masası personel bekliyor.
                </p>
                <button
                  onClick={() => resolveServiceRequest(req.id)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Tamamlandı
                </button>
              </div>
            ))}
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
            QR menüden veya POS masasından verilen siparişler anında burada belirecektir.
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
                      {order.order_source === 'pos' && (
                        <span className="text-[9px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded">
                          POS
                        </span>
                      )}
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      isPending
                        ? 'bg-amber-100 text-amber-800'
                        : isPreparing
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isPending ? 'Bekliyor' : isPreparing ? 'Hazırlanıyor' : 'Teslim Edildi'}
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
                    {isPending && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
                      >
                        Hazırla
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
                      >
                        Teslim Et
                      </button>
                    )}

                    <button
                      onClick={() => updateOrderStatus(order.id, 'paid')}
                      className={`py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition ${
                        !isPending && !isPreparing ? 'col-span-2' : ''
                      }`}
                    >
                      Hesabı Kapat
                    </button>

                    {(isPending || isPreparing) && (
                      <button
                        onClick={() => printKitchenTicket(business, order)}
                        className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Yazdır</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
