import React, { useState } from 'react';
import { ShoppingBag, X, Plus, Minus, Send, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#121622] border border-[#1E2638] rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl p-5 max-h-[85vh] flex flex-col justify-between animate-in slide-in-from-bottom">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#1E2638] mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Sipariş Sepetiniz</h3>
                <span className="text-[10px] text-slate-400 font-semibold">{tableNo || 'Genel Masa'}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1A2234] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mb-3.5">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Sepetinizde ürün bulunmuyor.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 bg-[#0B0E14] rounded-xl border border-[#1A2234] flex items-center justify-between text-xs"
                >
                  <div className="flex-1 pr-2 truncate">
                    <div className="font-semibold text-slate-200 truncate">{item.product.name}</div>
                    <div className="text-[11px] text-indigo-400 font-bold mt-0.5">
                      {(item.product.price * item.quantity).toFixed(2)} ₺
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onUpdateQty(item.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-[#182030] hover:bg-[#222E45] text-white flex items-center justify-center transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-slate-200 text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.product.id, 1)}
                      className="w-6 h-6 rounded-lg bg-[#182030] hover:bg-[#222E45] text-white flex items-center justify-center transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Notes */}
          {cart.length > 0 && (
            <div className="mb-3">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Sipariş Notu
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Özel bir isteğiniz varsa belirtebilirsiniz..."
                className="w-full bg-[#0B0E14] border border-[#1A2234] focus:border-indigo-500/50 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="pt-3 border-t border-[#1E2638] space-y-2.5">
            <div className="flex items-center justify-between text-sm font-bold text-white">
              <span>Toplam:</span>
              <span className="text-indigo-400">{totalAmount.toFixed(2)} ₺</span>
            </div>

            <button
              disabled={sending}
              onClick={handleSendOrder}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? 'İletiliyor...' : 'Siparişi Mutfağa İlet'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
