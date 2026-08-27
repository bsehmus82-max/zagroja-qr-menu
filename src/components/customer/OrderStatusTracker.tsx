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

  // Load orders stored in localStorage or for this table
  useEffect(() => {
    const savedOrderIds: string[] = JSON.parse(localStorage.getItem('zagroja_my_orders') || '[]');

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

    // Subscribe to realtime status changes
    const channel = supabase
      .channel(`customer-orders-${tableNo}`)
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
          title: 'Sipariþiniz Alýndý',
          subtitle: 'Mutfak onaylamasý bekleniyor...',
          badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: Clock,
        };
      case 'preparing':
        return {
          title: 'Yemekleriniz Hazýrlanýyor ?????',
          subtitle: 'Þeflerimiz sipariþinizi özenle hazýrlýyor.',
          badgeClass: 'bg-brand-500/20 border-brand-500/50 text-brand-300 animate-pulse',
          icon: ChefHat,
        };
      case 'served':
        return {
          title: 'Sipariþiniz Masanýzda ?',
          subtitle: 'Afiyet olsun!',
          badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: CheckCircle2,
        };
      default:
        return {
          title: 'Sipariþ Durumu',
          subtitle: '',
          badgeClass: 'bg-neutral-800 text-neutral-300',
          icon: Clock,
        };
    }
  };

  const statusInfo = getStatusDisplay(latestOrder.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-3xl p-4 shadow-xl mb-6 transition">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${statusInfo.badgeClass}`}>
            <StatusIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">{statusInfo.title}</h4>
            <p className="text-[11px] text-neutral-400">{statusInfo.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-brand-400">
            {latestOrder.total_amount.toFixed(2)} ?
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-neutral-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="pt-3 mt-3 border-t border-neutral-800/80 space-y-2">
          <div className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
            Sipariþ Detayý ({latestOrder.table_no})
          </div>
          <div className="space-y-1.5 text-xs">
            {latestOrder.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-neutral-300">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span className="font-bold">{(item.price * item.quantity).toFixed(2)} ?</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
