import React, { useState } from 'react';
import { ShoppingBag, X, Plus, Minus, Send, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Business, CartItem, Order } from '../../types';
import { supabase } from '../../lib/supabase';

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

      const sessionToken = localStorage.getItem('zagroja_session_token') || `ses_${Date.now()}_${Math.random()}`;
      localStorage.setItem('zagroja_session_token', sessionToken);

      const payload = {
        business_id: business.id,
        table_no: tableNo || 'Genel',
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
        // Save to active customer orders in localStorage
        const existing = JSON.parse(localStorage.getItem('zagroja_my_orders') || '[]');
        localStorage.setItem('zagroja_my_orders', JSON.stringify([data.id, ...existing]));

        // Fireworks celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // fallback
        }

        onOrderPlaced(data as Order);
        onClose();
      } else {
        alert('Sipariş iletilirken bir hata oluştu.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl p-6 max-h-[85vh] flex flex-col justify-between animate-in slide-in-from-bottom">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">Sipariş Sepetim</h3>
                <span className="text-[10px] text-neutral-400 font-bold">{tableNo || 'Masa Seçilmedi'}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items */}
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-xs">
                Sepetinizde ürün bulunmuyor.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between text-xs"
                >
                  <div className="flex-1 pr-2 truncate">
                    <div className="font-bold text-white truncate">{item.product.name}</div>
                    <div className="text-[11px] text-brand-400 font-bold mt-0.5">
                      {(item.product.price * item.quantity).toFixed(2)} ₺
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onUpdateQty(item.product.id, -1)}
                      className="w-7 h-7 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-bold text-white text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.product.id, 1)}
                      className="w-7 h-7 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Notes */}
          {cart.length > 0 && (
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                Özel Sipariş Notu (İsteğe Bağlı)
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Örn: İçecekler buzsuz olsun lütfen..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="pt-4 border-t border-neutral-800 space-y-3">
            <div className="flex items-center justify-between text-base font-black text-white">
              <span>Toplam:</span>
              <span className="text-brand-400">{totalAmount.toFixed(2)} ₺</span>
            </div>

            <button
              disabled={sending}
              onClick={handleSendOrder}
              className="w-full py-4 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition transform active:scale-98 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sipariş İletiliyor...' : 'Siparişi Mutfağa / Kasaya Gönder'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
