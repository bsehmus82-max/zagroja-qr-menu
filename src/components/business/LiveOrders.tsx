import React, { useState, useEffect } from 'react';
import { 
  Bell, ChefHat, CheckCircle2, Clock, Printer, 
  Hand, Receipt, CreditCard, Banknote, RefreshCw, XCircle
} from 'lucide-react';
import { Business, Order, OrderStatus, ServiceRequest } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../lib/audio';
import { printThermalReceipt } from '../../lib/thermalPrinter';

interface LiveOrdersProps {
  business: Business;
}

export const LiveOrders: React.FC<LiveOrdersProps> = ({ business }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'services'>('orders');
  const [loading, setLoading] = useState(true);

  // Load active orders and pending service requests
  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, servicesRes] = await Promise.all([
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
      if (servicesRes.data) setServiceRequests(servicesRes.data as ServiceRequest[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  // Realtime subscription for live orders and calls
  useEffect(() => {
    const ordersChannel = supabase
      .channel('business-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          const newOrder = payload.new as Order;
          sound.playOrderBell();
          setOrders((prev) => [newOrder, ...prev]);

          // Trigger instant thermal adisyon printing
          printThermalReceipt(newOrder, business);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) =>
            updated.status === 'paid' || updated.status === 'cancelled'
              ? prev.filter((o) => o.id !== updated.id)
              : prev.map((o) => (o.id === updated.id ? updated : o))
          );
        }
      )
      .subscribe();

    const serviceChannel = supabase
      .channel('business-services-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          sound.playServiceChime();
          setServiceRequests((prev) => [payload.new as ServiceRequest, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          const updated = payload.new as ServiceRequest;
          if (updated.status === 'resolved') {
            setServiceRequests((prev) => prev.filter((s) => s.id !== updated.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(serviceChannel);
    };
  }, [business]);

  // Change Order Status
  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (!error) {
      setOrders((prev) =>
        nextStatus === 'paid' || nextStatus === 'cancelled'
          ? prev.filter((o) => o.id !== orderId)
          : prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
    }
  };

  // Resolve Service Request
  const handleResolveService = async (serviceId: string) => {
    const { error } = await supabase
      .from('service_requests')
      .update({ status: 'resolved' })
      .eq('id', serviceId);

    if (!error) {
      setServiceRequests((prev) => prev.filter((s) => s.id !== serviceId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Canlý Mutfak & Kasa Sipariþ Ekraný</h2>
          <p className="text-xs text-neutral-400">
            Masalardan gelen anlýk sipariþler, adisyon fiþleri ve garson/hesap çaðrýlarý.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'orders' ? 'bg-brand-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            Aktif Sipariþler ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'services' ? 'bg-brand-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            Masa Çaðrýlarý ({serviceRequests.length})
          </button>
        </div>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <>
          {loading ? (
            <div className="py-20 text-center text-neutral-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
              <span className="text-xs">Sipariþler yükleniyor...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center bg-neutral-900/40 border border-dashed border-neutral-800 rounded-3xl p-8">
              <ChefHat className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h4 className="font-bold text-sm text-white">Þu Anda Bekleyen Sipariþ Yok</h4>
              <p className="text-xs text-neutral-400 mt-1">
                Masalardan veya kasadan yeni bir sipariþ verildiðinde bu ekrana sesli bildirimle anýnda düþecektir.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => {
                return (
                  <div
                    key={order.id}
                    className={`bg-neutral-900 border ${
                      order.status === 'pending'
                        ? 'border-brand-500/60 shadow-lg shadow-brand-500/10'
                        : order.status === 'preparing'
                        ? 'border-amber-500/50'
                        : 'border-neutral-800'
                    } rounded-3xl p-5 flex flex-col justify-between transition`}
                  >
                    <div>
                      {/* Order Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white px-3 py-1 bg-neutral-800 rounded-xl">
                            {order.table_no}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 px-2 py-0.5 bg-neutral-950 rounded-md">
                            {order.order_source === 'manual_pos' ? 'KASA' : 'QR MENÜ'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => printThermalReceipt(order, business)}
                            title="Adisyon Yazdýr"
                            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2 mb-4 bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800/60 max-h-48 overflow-y-auto">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between text-xs">
                            <div className="flex-1">
                              <span className="font-bold text-white">{item.quantity}x</span>{' '}
                              <span className="text-neutral-200">{item.name}</span>
                              {item.notes && (
                                <div className="text-[10px] text-amber-400 mt-0.5 italic">
                                  ? {item.notes}
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-neutral-400 shrink-0 ml-2">
                              {(item.price * item.quantity).toFixed(2)} ?
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.customer_notes && (
                        <div className="mb-4 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 p-2.5 rounded-xl">
                          <strong>Müþteri Notu:</strong> {order.customer_notes}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm font-black text-white pt-2 border-t border-neutral-800">
                        <span>Toplam:</span>
                        <span className="text-brand-400">{order.total_amount.toFixed(2)} ?</span>
                      </div>
                    </div>

                    {/* Status Action Buttons */}
                    <div className="pt-4 mt-4 border-t border-neutral-800/80 space-y-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 transition active:scale-98"
                        >
                          <ChefHat className="w-4 h-4" />
                          Sipariþi Onayla & Hazýrlanýyor Bildir
                        </button>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'served')}
                          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Masaya Teslim Edildi
                        </button>
                      )}

                      {order.status === 'served' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'paid')}
                            className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            Ödendi (Kapat)
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            className="py-2.5 bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Ýptal Et
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* SERVICE REQUESTS TAB */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {serviceRequests.length === 0 ? (
            <div className="py-20 text-center bg-neutral-900/40 border border-dashed border-neutral-800 rounded-3xl p-8">
              <Bell className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h4 className="font-bold text-sm text-white">Bekleyen Masa Çaðrýsý Yok</h4>
              <p className="text-xs text-neutral-400 mt-1">
                Müþteriler masadan garson çaðýrdýðýnda veya hesap istediðinde burada listelenir.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceRequests.map((req) => {
                const isWaiter = req.request_type === 'waiter';
                const isCash = req.request_type === 'bill_cash';

                return (
                  <div
                    key={req.id}
                    className="bg-neutral-900 border border-amber-500/40 rounded-3xl p-5 flex items-center justify-between shadow-lg shadow-amber-500/5 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                        isWaiter ? 'bg-amber-600' : isCash ? 'bg-emerald-600' : 'bg-brand-600'
                      }`}>
                        {isWaiter ? <Hand className="w-6 h-6" /> : isCash ? <Banknote className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-black text-base text-white">{req.table_no}</div>
                        <div className="text-xs text-amber-300 font-bold">
                          {isWaiter ? 'Garson Çaðýrýyor' : isCash ? 'Nakit Hesap Ýstiyor' : 'POS / Kart Hesap Ýstiyor'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleResolveService(req.id)}
                      className="px-4 py-2 bg-neutral-800 hover:bg-emerald-600 text-neutral-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Tamamlandý
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
