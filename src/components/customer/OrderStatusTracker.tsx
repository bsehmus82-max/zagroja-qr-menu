import React, { useState, useEffect } from 'react';
import { ChefHat, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Order } from '../../types';
import { supabase } from '../../lib/supabase';

interface OrderStatusTrackerProps {
  businessId: string;
  tableNo: string;
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ businessId, tableNo }) => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const savedOrderIds: string[] = JSON.parse(localStorage.getItem('my_active_orders') || '[]');

    const fetchOrders = async () => {
      if (savedOrderIds.length === 0) return;

      const { data } = await supabase
        .from('orders')
        .select('*')
        .in('id', savedOrderIds)
        .in('status', ['pending', 'preparing', 'served'])
        .order('created_at', { ascending: false });

      if (data) {
        setActiveOrders(data as Order[]);
      }
    };

    fetchOrders();

    const channel = supabase
      .channel(`cust-tracker-${tableNo}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          setActiveOrders((prev) =>
            updated.status === 'paid' || updated.status === 'cancelled'
              ? prev.filter((o) => o.id !== updated.id)
              : prev.map((o) => (o.id === updated.id ? updated : o))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, tableNo]);

  if (activeOrders.length === 0) return null;

  const latestOrder = activeOrders[0];

  const getStatusDisplay = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Siparişiniz Alındı',
          subtitle: 'Mutfak onaylaması bekleniyor...',
          badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: Clock,
        };
      case 'preparing':
        return {
          title: 'Mutfakta Hazırlanıyor 👨‍🍳',
          subtitle: 'Şeflerimiz siparişinizi hazırlıyor.',
          badgeClass: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 animate-pulse',
          icon: ChefHat,
        };
      case 'served':
        return {
          title: 'Siparişiniz Masanızda ✨',
          subtitle: 'Afiyet olsun!',
          badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: CheckCircle2,
        };
      default:
        return {
          title: 'Sipariş Durumu',
          subtitle: '',
          badgeClass: 'bg-[#182030] text-slate-300',
          icon: Clock,
        };
    }
  };

  const statusInfo = getStatusDisplay(latestOrder.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-[#111622]/90 backdrop-blur-md border border-[#1E2638] rounded-2xl p-3.5 shadow-lg mb-4 transition">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${statusInfo.badgeClass}`}>
            <StatusIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">{statusInfo.title}</h4>
            <p className="text-[10px] text-slate-400">{statusInfo.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-400">
            {latestOrder.total_amount.toFixed(2)} ₺
          </span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="pt-2.5 mt-2.5 border-t border-[#1E2638] space-y-1.5">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Sipariş İçeriği ({latestOrder.table_no})
          </div>
          <div className="space-y-1 text-xs">
            {latestOrder.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-slate-300 text-[11px]">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span className="font-semibold">{(item.price * item.quantity).toFixed(2)} ₺</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
