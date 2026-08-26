import React from 'react';
import { Order } from '../../types';
import { X, Clock, ChefHat, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  currency: string;
  tableNumber: number;
}

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  isOpen,
  onClose,
  orders,
  currency,
  tableNumber,
}) => {
  if (!isOpen) return null;

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500 animate-spin" /> Sipariş Alındı
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ChefHat className="w-3 h-3 text-blue-500 animate-bounce" /> Mutfakta Hazırlanıyor
          </span>
        );
      case 'served':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Masanıza Servis Edildi
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Tamamlandı
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
            <AlertCircle className="w-3 h-3 text-rose-500" /> İptal Edildi
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl z-10 max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Masa {tableNumber} Sipariş Durumu</h3>
            <p className="text-xs text-slate-500">Mutfak ve servis canlı takip akışı</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Henüz Siparişiniz Bulunmuyor</p>
              <p className="text-xs text-slate-400 mt-1">
                Menüden sipariş verdiğinizde mutfaktaki durumunu buradan anbean izleyebilirsiniz.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {new Date(order.created_at).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {getStatusBadge(order.status)}
                </div>

                <div className="space-y-1 pt-1">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-slate-800 font-medium">
                        {item.quantity}x {item.product_name}
                      </span>
                      <span className="text-slate-600 font-semibold">
                        {item.total_price.toFixed(2)} {currency}
                      </span>
                    </div>
                  ))}
                </div>

                {order.customer_notes && (
                  <p className="text-[10px] text-amber-700 bg-amber-50/80 p-1.5 rounded-lg border border-amber-100">
                    Masa Notu: {order.customer_notes}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs font-bold text-slate-900">
                  <span>Toplam</span>
                  <span className="text-orange-600 text-sm">
                    {order.total_amount.toFixed(2)} {currency}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
