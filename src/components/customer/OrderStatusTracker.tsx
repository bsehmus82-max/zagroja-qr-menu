import React, { useState } from 'react';
import { ChefHat, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Order } from '../../types';

interface OrderStatusTrackerProps {
  orders: Order[];
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ orders }) => {
  const [expanded, setExpanded] = useState(false);

  if (orders.length === 0) return null;

  const latestOrder = orders[0];

  const getStatusDisplay = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Siparişiniz Alındı',
          subtitle: 'Mutfak onaylaması bekleniyor...',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Clock,
        };
      case 'preparing':
        return {
          title: 'Mutfakta Hazırlanıyor',
          subtitle: 'Şeflerimiz siparişinizi özenle hazırlıyor.',
          badgeClass: 'bg-sky-100 text-sky-800 border-sky-200 animate-pulse',
          icon: ChefHat,
        };
      case 'served':
        return {
          title: 'Siparişiniz Masanızda',
          subtitle: 'Afiyet olsun! İlave istekleriniz için çağrı butonunu kullanabilirsiniz.',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
        };
      default:
        return {
          title: 'Sipariş Durumu',
          subtitle: '',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Clock,
        };
    }
  };

  const statusInfo = getStatusDisplay(latestOrder.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-4 space-y-3">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${statusInfo.badgeClass}`}>
            <StatusIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-900">{statusInfo.title}</h4>
            <p className="text-[10px] text-slate-500">{statusInfo.subtitle}</p>
          </div>
        </div>

        <button className="text-slate-400 p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between font-bold text-slate-700">
            <span>Sipariş Tutarı:</span>
            <span className="text-orange-600 font-extrabold">{latestOrder.total_amount.toFixed(2)} ₺</span>
          </div>

          <div className="divide-y divide-slate-100">
            {latestOrder.items.map((item, i) => (
              <div key={i} className="py-1.5 flex justify-between text-[11px] text-slate-600">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-bold">{(item.price * item.quantity).toFixed(2)} ₺</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
