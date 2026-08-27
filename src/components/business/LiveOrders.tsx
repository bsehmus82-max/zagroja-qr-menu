import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Printer, CheckCircle2, Clock, 
  Hand, Banknote, RefreshCw, Volume2, Sparkles, AlertCircle
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

    // Subscribe to new orders & waiter calls
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
            // Automatically print ticket on new incoming order
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

  // Status changers
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Canlı Mutfak & Sipariş Paneli</h2>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Canlı Dinleniyor
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Masalardan gelen siparişlerde zil çalar ve adisyon fişi yazdırılır.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => sound.playOrderBell()}
            className="px-3.5 py-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 transition flex items-center gap-1.5"
            title="Ses Testi"
          >
            <Volume2 className="w-4 h-4 text-brand-400" />
            Zil Testi
          </button>
        </div>
      </div>

      {/* Active Service Calls Banner */}
      {serviceRequests.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 px-1">
            <Hand className="w-4 h-4 animate-bounce" />
            Bekleyen Masalar ({serviceRequests.length} Çağrı)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {serviceRequests.map((req) => (
              <div
                key={req.id}
                className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2"
              >
                <div>
                  <div className="font-black text-sm text-white">{req.table_no}</div>
                  <div className="text-xs text-amber-300 font-bold mt-0.5">
                    {req.type === 'waiter' ? '🛎️ Garson Çağrısı' : `💳 Hesap İste (${req.details || 'Belirtilmedi'})`}
                  </div>
                </div>

                <button
                  onClick={() => completeServiceRequest(req.id)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs shadow-md transition"
                >
                  İlgilenildi
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Orders Grid */}
      {loading ? (
        <div className="py-20 text-center text-neutral-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-500" />
          <span>Siparişler yükleniyor...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-24 text-center bg-neutral-900/40 border border-dashed border-neutral-800 rounded-3xl p-8 space-y-2">
          <ChefHat className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
          <h3 className="font-bold text-white text-base">Aktif Sipariş Bulunmuyor</h3>
          <p className="text-xs text-neutral-400">
            Masalardan QR ile sipariş verildiğinde burada anında zille birlikte listelenecektir.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => {
            const isPending = order.status === 'pending';
            const isPreparing = order.status === 'preparing';

            return (
              <div
                key={order.id}
                className={`bg-neutral-900 border rounded-3xl p-5 flex flex-col justify-between shadow-xl transition ${
                  isPending
                    ? 'border-amber-500/50 shadow-amber-500/5 ring-1 ring-amber-500/30'
                    : isPreparing
                    ? 'border-brand-500/50 shadow-brand-500/5 ring-1 ring-brand-500/30'
                    : 'border-neutral-800'
                }`}
              >
                <div>
                  {/* Order Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-neutral-800 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white">{order.table_no}</span>
                        {isPending && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                            Yeni Sipariş
                          </span>
                        )}
                        {isPreparing && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/30">
                            Hazırlanıyor 👨‍🍳
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <button
                      onClick={() => printKitchenTicket(business, order)}
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
                      title="Adisyon Fişi Yazdır"
                    >
                      <Printer className="w-4 h-4 text-purple-400" />
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs">
                        <div className="flex items-start gap-2">
                          <span className="font-black text-brand-400 bg-brand-500/10 w-5 h-5 rounded flex items-center justify-center text-[11px] shrink-0">
                            {item.quantity}
                          </span>
                          <span className="font-bold text-white">{item.name}</span>
                        </div>
                        <span className="text-neutral-400 font-mono font-bold">
                          {(item.price * item.quantity).toFixed(2)} ₺
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Customer Notes */}
                  {order.customer_notes && (
                    <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] text-amber-300/90 mb-4">
                      <strong>Müşteri Notu:</strong> {order.customer_notes}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-semibold">Toplam Tutar:</span>
                    <span className="font-black text-base text-brand-400">
                      {order.total_amount.toFixed(2)} ₺
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {isPending && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="col-span-2 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-1.5 transition"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Mutfakta Hazırla (Müşteriye Bildir)</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        className="col-span-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Masaya Servis Edildi</span>
                      </button>
                    )}

                    {order.status === 'served' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'paid')}
                        className="col-span-2 py-2.5 bg-neutral-800 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition"
                      >
                        Ödendi & Hesabı Kapat
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
