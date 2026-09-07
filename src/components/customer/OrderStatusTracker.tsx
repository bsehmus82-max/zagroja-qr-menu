import React, { useState } from 'react';
import { ChefHat, CheckCircle2, Clock, ChevronDown, ChevronUp, BellRing } from 'lucide-react';
import { Order } from '../../types';
import { requestNotificationPermission, getNotificationPermissionStatus } from '../../lib/notifications';

interface OrderStatusTrackerProps {
  orders: Order[];
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ orders }) => {
  const [expanded, setExpanded] = useState(false);
  const [notifPermission, setNotifPermission] = useState(getNotificationPermissionStatus());

  if (orders.length === 0) return null;

  const latestOrder = orders[0];

  const handleEnableNotifs = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
  };

  const getStatusDisplay = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Siparişiniz Alındı',
          subtitle: 'Mutfak onaylaması bekleniyor...',
          badgeClass: 'bg-[#141A26] text-amber-400',
          icon: Clock,
        };
      case 'preparing':
        return {
          title: 'Mutfakta Hazırlanıyor',
          subtitle: 'Şeflerimiz siparişinizi özenle hazırlıyor.',
          badgeClass: 'bg-[#141A26] text-sky-400 animate-pulse',
          icon: ChefHat,
        };
      case 'served':
        return {
          title: 'Siparişiniz Masanızda',
          subtitle: 'Afiyet olsun! İlave istekleriniz için çağrı butonunu kullanabilirsiniz.',
          badgeClass: 'bg-[#141A26] text-emerald-400',
          icon: CheckCircle2,
        };
      default:
        return {
          title: 'Sipariş Durumu',
          subtitle: '',
          badgeClass: 'bg-[#141A26] text-slate-300',
          icon: Clock,
        };
    }
  };

  const statusInfo = getStatusDisplay(latestOrder.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-[#111622] rounded-2xl shadow-sm p-4 space-y-3 text-slate-100">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${statusInfo.badgeClass}`}>
            <StatusIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">{statusInfo.title}</h4>
            <p className="text-[10px] text-slate-400 font-normal">{statusInfo.subtitle}</p>
          </div>
        </div>

        <button className="text-slate-400 p-1 hover:text-white">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Notification Permission Mini Banner */}
      {notifPermission === 'default' && (
        <div className="bg-[#141A26] rounded-xl p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BellRing className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] font-medium text-slate-300 truncate">
              Yemek hazırlandığında bildirim al
            </span>
          </div>
          <button
            onClick={handleEnableNotifs}
            className="px-2.5 py-1 bg-white hover:bg-slate-200 text-[#0F172A] text-[10px] font-bold rounded-lg transition active:scale-95 shrink-0 shadow-xs"
          >
            İzin Ver
          </button>
        </div>
      )}

      {expanded && (
        <div className="pt-3 space-y-2 text-xs">
          <div className="flex justify-between font-bold text-slate-300">
            <span>Sipariş Tutarı:</span>
            <span className="text-white font-bold">{latestOrder.total_amount.toFixed(2)} ₺</span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {latestOrder.items.map((item, i) => (
              <div key={i} className="py-1.5 flex justify-between text-[11px] text-slate-400">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-bold text-slate-200">{(item.price * item.quantity).toFixed(2)} ₺</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
