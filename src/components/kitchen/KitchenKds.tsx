import React, { useState, useEffect } from 'react';
import { ChefHat, Check, RefreshCw, Clock, AlertCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Business, Order } from '../../types';
import { sound } from '../../lib/audio';
import { useToast } from '../../context/ToastContext';

interface KitchenKdsProps {
  business: Business;
}

export const KitchenKds: React.FC<KitchenKdsProps> = ({ business }) => {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('business_id', business.id)
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setOrders(data as Order[]);
    } catch (err: any) {
      console.error('Mutfak siparişleri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel(`kitchen-live-sync-${business.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          fetchOrders();
          if (payload.eventType === 'INSERT') {
            sound.playOrderBell(business.sound_preference);
            toast.info(`Mutfak: ${payload.new.table_no} için yeni sipariş geldi.`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business.id]);

  // Start Preparing Order (Move from Bekleyen to Hazırlanan)
  const handleStartPreparing = async (orderId: string, tableNo: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'preparing', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'preparing' } : o))
      );
      toast.success(`${tableNo} siparişi hazırlanmaya başlandı.`);
    } catch (err: any) {
      toast.error('İşlem başarısız: ' + err.message);
    }
  };

  // Mark Order Ready / Served (Complete kitchen process)
  const handleMarkReady = async (orderId: string, tableNo: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'served', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      sound.playSuccessTone();
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success(`${tableNo} siparişi hazır! Servise iletildi.`);
    } catch (err: any) {
      toast.error('İşlem başarısız: ' + err.message);
    }
  };

  // Cancel Order from Kitchen
  const handleCancelKitchenOrder = async (orderId: string, tableNo: string) => {
    if (!window.confirm(`${tableNo} siparişini iptal etmek istediğinize emin misiniz?`)) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success(`${tableNo} siparişi mutfaktan iptal edildi.`);
    } catch (err: any) {
      toast.error('İptal işlemi başarısız: ' + err.message);
    }
  };

  const getElapsedMinutes = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diffMs / 60000);
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');

  if (loading && orders.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
        <p className="text-xs font-bold">Mutfak siparişleri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] space-y-5 select-none">
      {/* 1. BÖLÜM: İŞLETMEDEN GELEN BEKLEYEN SİPARİŞLER */}
      <div className="bg-[#111622] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-slate-300" />
          <h3 className="font-extrabold text-sm text-white">
            Bekleyen Yeni Siparişler ({pendingOrders.length})
          </h3>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#0C1017] text-center">
            <p className="text-xs text-slate-400 font-medium">
              Bekleyen yeni sipariş bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {pendingOrders.map((order) => {
              const elapsed = getElapsedMinutes(order.created_at);

              return (
                <div
                  key={order.id}
                  className="bg-[#0C1017] rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-white">
                        {order.table_no}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {elapsed} dk
                      </span>
                    </div>

                    {order.customer_notes && (
                      <div className="p-2.5 rounded-lg bg-[#141A26] text-slate-300 text-[11px] flex items-start gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                        <span>Not: {order.customer_notes}</span>
                      </div>
                    )}

                    <div className="space-y-1.5 pt-1">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between text-xs text-slate-200 py-0.5"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="font-mono text-slate-400 shrink-0">
                              {item.quantity}x
                            </span>
                            <span className="truncate">{item.name}</span>
                          </div>
                          {item.notes && (
                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                              ({item.notes})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      onClick={() => handleStartPreparing(order.id, order.table_no)}
                      className="col-span-2 py-2.5 bg-white hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl transition active:scale-95 cursor-pointer shadow-xs"
                    >
                      Hazırlamaya Başla
                    </button>
                    <button
                      onClick={() => handleCancelKitchenOrder(order.id, order.table_no)}
                      className="py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs rounded-xl transition active:scale-95 flex items-center justify-center gap-1"
                      title="Siparişi İptal Et"
                    >
                      <X className="w-3.5 h-3.5 text-rose-400" />
                      <span>İptal</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. BÖLÜM: MUTFAĞIN ONAYLAYIP HAZIRLADIĞI SİPARİŞLER */}
      <div className="bg-[#111622] rounded-2xl p-5 sm:p-6 shadow-md flex-1 flex flex-col justify-start space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-300" />
          <h3 className="font-extrabold text-sm text-white">
            Hazırlanan Siparişler ({preparingOrders.length})
          </h3>
        </div>

        {preparingOrders.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#0C1017] text-center flex-1 flex items-center justify-center">
            <p className="text-xs text-slate-400 font-medium">
              Şu anda hazırlanan sipariş bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {preparingOrders.map((order) => {
              const elapsed = getElapsedMinutes(order.created_at);

              return (
                <div
                  key={order.id}
                  className="bg-[#0C1017] rounded-xl p-3.5 flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-white">
                        {order.table_no}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {elapsed} dk
                      </span>
                    </div>

                    {/* Customer Notes if Any */}
                    {order.customer_notes && (
                      <div className="p-1.5 rounded-lg bg-[#141A26] text-[10px] text-amber-300 font-medium">
                        <strong>Not:</strong> {order.customer_notes}
                      </div>
                    )}

                    {/* Items checklist */}
                    <div className="space-y-1 pt-1">
                      {order.items.map((item, idx) => {
                        const itemKey = `${order.id}_${idx}`;
                        const isChecked = !!checkedItems[itemKey];

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setCheckedItems((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }));
                            }}
                            className={`flex items-start justify-between text-xs py-1 px-1.5 rounded-lg cursor-pointer transition select-none ${
                              isChecked
                                ? 'line-through text-slate-500 bg-[#141A26]/50'
                                : 'text-slate-200 hover:bg-[#141A26]'
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="font-mono text-slate-400 shrink-0">
                                {item.quantity}x
                              </span>
                              <span className="truncate">{item.name}</span>
                            </div>

                            <div className="shrink-0 pt-0.5 pl-1">
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                                  isChecked ? 'bg-slate-300 text-slate-900' : 'bg-[#1C2433]'
                                }`}
                              >
                                {isChecked && <Check className="w-2.5 h-2.5" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      onClick={() => handleMarkReady(order.id, order.table_no)}
                      className="col-span-2 py-2 bg-white hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-lg transition active:scale-95 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Sipariş Hazır</span>
                    </button>
                    <button
                      onClick={() => handleCancelKitchenOrder(order.id, order.table_no)}
                      className="py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs rounded-lg transition active:scale-95 flex items-center justify-center gap-1"
                      title="Siparişi İptal Et"
                    >
                      <X className="w-3.5 h-3.5 text-rose-400" />
                      <span>İptal</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
