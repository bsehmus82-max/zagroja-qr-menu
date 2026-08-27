import React, { useState } from 'react';
import { ShoppingBag, X, Plus, Minus, Send, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Business, CartItem, Order } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface CartDrawerProps {
  business: Business;
  tableNo: string;
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQty: (prodId: string, delta: number) => void;
  onOrderPlaced: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  business,
  tableNo,
  cart,
  isOpen,
  onClose,
  onUpdateQty,
  onOrderPlaced,
}) => {
  const toast = useToast();
  const [customerNotes, setCustomerNotes] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleSendOrder = async () => {
    if (cart.length === 0) return;

    setSending(true);
    try {
      const orderItems = cart.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        notes: item.notes || '',
      }));

      const sessionToken = localStorage.getItem('user_session_token') || `ses_${Date.now()}_${Math.random()}`;
      localStorage.setItem('user_session_token', sessionToken);

      const payload = {
        business_id: business.id,
        table_no: tableNo || 'Genel Masa',
        session_token: sessionToken,
        order_source: 'qr',
        items: orderItems,
        total_amount: totalAmount,
        status: 'pending',
        payment_method: 'unpaid',
        customer_notes: customerNotes.trim(),
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        const existing = JSON.parse(localStorage.getItem('my_active_orders') || '[]');
        localStorage.setItem('my_active_orders', JSON.stringify([data.id, ...existing]));

        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {
          // fallback
        }

        toast.success('Siparişiniz mutfağa iletildi! Şeflerimiz hazırlamaya başlıyor.');
        onOrderPlaced(data as Order);
        onClose();
      } else {
        toast.error('Sipariş iletilirken bir hata oluştu. Lütfen tekrar deneyiniz.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl p-5 max-h-[85vh] flex flex-col justify-between animate-in slide-in-from-bottom text-slate-800">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Sipariş Sepetiniz</h3>
                <span className="text-[11px] text-slate-400 font-semibold">{tableNo ? tableNo : 'Genel Masa'}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="overflow-y-auto max-h-[40vh] space-y-2.5 pr-1 divide-y divide-slate-100">
            {cart.map((item) => (
              <div key={item.product.id} className="pt-2 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-xs text-slate-900 truncate">
                    {item.product.name}
                  </h4>
                  <span className="text-[11px] font-extrabold text-orange-600">
                    {(item.product.price * item.quantity).toFixed(2)} ₺
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => onUpdateQty(item.product.id, -1)}
                    className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 font-bold hover:bg-slate-50 transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="text-xs font-black w-4 text-center text-slate-900">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => onUpdateQty(item.product.id, 1)}
                    className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 font-bold hover:bg-slate-50 transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Notes Input */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Sipariş Notu (Opsiyonel)
            </label>
            <input
              type="text"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Örn: Az şekerli olsun, acısız olsun..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Footer & Submit */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Toplam Sepet Tutarı:</span>
            <span className="font-black text-lg text-orange-600">
              {totalAmount.toFixed(2)} ₺
            </span>
          </div>

          <button
            onClick={handleSendOrder}
            disabled={sending || cart.length === 0}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-orange-500/25 transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Mutfağa İletiliyor...' : 'Siparişi Onayla & Mutfağa Gönder'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
