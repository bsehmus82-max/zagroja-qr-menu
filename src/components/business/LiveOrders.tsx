import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Printer, CheckCircle2, Clock, 
  Hand, Banknote, RefreshCw, Volume2
} from 'lucide-react';
import { Business, Order, ServiceRequest } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../lib/audio';
import { printKitchenTicket } from '../../lib/thermalPrinter';

interface LiveOrdersProps {
  business: Business;
}

export const LiveOrders: React.FC<LiveOrdersProps> = ({ business }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

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
          .eq('is_completed', false)
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
            sound.playOrderBell();
            printKitchenTicket(business, newOrder);
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
            sound.playWaiterCall();
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as ServiceRequest;
            setServiceRequests((prev) =>
              updated.is_completed ? prev.filter((r) => r.id !== updated.id) : prev
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business.id]);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (!error) {
      setOrders((prev) =>
        status === 'paid' || status === 'cancelled'
          ? prev.filter((o) => o.id !== orderId)
          : prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    }
  };

  const completeServiceRequest = async (reqId: string) => {
    const { error } = await supabase
      .from('service_requests')
      .update({ is_completed: true, updated_at: new Date().toISOString() })
      .eq('id', reqId);

    if (!error) {
      setServiceRequests((prev) => prev.filter((r) => r.id !== reqId));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111622] border border-[#1E2638] p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Canlı Mutfak & Siparişler</h2>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Canlı
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Yeni siparişlerde otomatik adisyon yazdırılır ve sesli uyarı verilir.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => sound.playOrderBell()}
            className="px-3 py-1.5 rounded-xl bg-[#182030] hover:bg-[#222E45] text-xs font-semibold text-slate-300 transition flex items-center gap-1.5"
            title="Ses Testi"
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            Zil Testi
          </button>
        </div>
      </div>

      {/* Active Waiter/Bill Calls */}
      {serviceRequests.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 px-1">
            <Hand className="w-3.5 h-3.5 animate-bounce" />
            Masa Çağrıları ({serviceRequests.length})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {serviceRequests.map((req) => (
              <div
                key={req.id}
                className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-sm animate-in slide-in-from-top-1"
              >
                <div>
                  <div className="font-bold text-xs text-white">{req.table_no}</div>
                  <div className="text-[11px] text-amber-300 font-medium mt-0.5">
                    {req.type === 'waiter' ? '🛎️ Garson Çağrısı' : `💳 Hesap İste (${req.details || 'Belirtilmedi'})`}
                  </div>
                </div>

                <button
                  onClick={() => completeServiceRequest(req.id)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition"
                >
                  Tamamla
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
          <span>Yükleniyor...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center bg-[#111622]/40 border border-dashed border-[#1E2638] rounded-2xl p-8 space-y-1.5">
          <ChefHat className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="font-semibold text-slate-200 text-sm">Aktif Sipariş Bulunmuyor</h3>
          <p className="text-xs text-slate-400">
            Masalardan QR ile sipariş verildiğinde anında burada listelenecektir.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {orders.map((order) => {
            const isPending = order.status === 'pending';
            const isPreparing = order.status === 'preparing';

            return (
              <div
                key={order.id}
                className={`bg-[#111622] border rounded-2xl p-4 flex flex-col justify-between shadow-lg transition ${
                  isPending
                    ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                    : isPreparing
                    ? 'border-indigo-500/40 ring-1 ring-indigo-500/20'
                    : 'border-[#1E2638]'
                }`}
              >
                <div>
                  {/* Order Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-[#1E2638] mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{order.table_no}</span>
                        {isPending && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                            Yeni
                          </span>
                        )}
                        {isPreparing && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Hazırlanıyor 👨‍🍳
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <button
                      onClick={() => printKitchenTicket(business, order)}
                      className="p-1.5 rounded-lg bg-[#182030] hover:bg-[#222E45] text-slate-300 hover:text-white transition"
                      title="Adisyon Fişi Yazdır"
                    >
                      <Printer className="w-3.5 h-3.5 text-purple-400" />
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 mb-3.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs">
                        <div className="flex items-start gap-1.5">
                          <span className="font-bold text-indigo-400 bg-indigo-500/10 w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0">
                            {item.quantity}
                          </span>
                          <span className="font-medium text-slate-200">{item.name}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {(item.price * item.quantity).toFixed(2)} ₺
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Customer Notes */}
                  {order.customer_notes && (
                    <div className="p-2 bg-[#0B0E14] rounded-xl border border-[#1A2234] text-[11px] text-amber-300 mb-3">
                      <strong>Not:</strong> {order.customer_notes}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-[#1E2638] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Toplam:</span>
                    <span className="font-bold text-sm text-indigo-400">
                      {order.total_amount.toFixed(2)} ₺
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {isPending && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="col-span-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Mutfakta Hazırla</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        className="col-span-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Masaya Servis Edildi</span>
                      </button>
                    )}

                    {order.status === 'served' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'paid')}
                        className="col-span-2 py-2 bg-[#182030] hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs transition"
                      >
                        Ödendi & Kapat
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
