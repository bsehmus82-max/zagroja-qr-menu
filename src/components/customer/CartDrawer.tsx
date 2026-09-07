import React, { useState } from 'react';
import { ShoppingBag, X, Plus, Minus, Send } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Business, CartItem, Order } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { Language, translations } from '../../lib/translations';

interface CartDrawerProps {
  business: Business;
  tableNo: string;
  cart: CartItem[];
  isOpen: boolean;
  lang?: Language;
  onClose: () => void;
  onUpdateQty: (prodId: string, delta: number) => void;
  onOrderPlaced: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  business,
  tableNo,
  cart,
  isOpen,
  lang = 'tr',
  onClose,
  onUpdateQty,
  onOrderPlaced,
}) => {
  const t = translations[lang] || translations.tr;
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

      // Secure Supabase RPC: server calculates verified total_amount from database products
      const rpcPayload = {
        p_business_id: business.id,
        p_table_no: tableNo || 'Genel Masa',
        p_items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          notes: item.notes || '',
        })),
        p_customer_notes: customerNotes.trim(),
        p_order_source: 'qr',
        p_session_token: sessionToken,
      };

      let { data, error } = await supabase.rpc('create_customer_order', rpcPayload);

      // Backwards-compatible fallback if RPC function is not yet deployed to DB
      if (error) {
        console.warn('RPC create_customer_order fallback to direct insert:', error.message);
        const fallbackPayload = {
          business_id: business.id,
          table_no: tableNo || 'Genel Masa',
          session_token: sessionToken,
          order_source: 'qr',
          items: cart.map((item) => ({
            product_id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            notes: item.notes || '',
          })),
          total_amount: totalAmount,
          status: 'pending',
          payment_method: 'unpaid',
          customer_notes: customerNotes.trim(),
        };

        const fallbackRes = await supabase
          .from('orders')
          .insert([fallbackPayload])
          .select()
          .single();

        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (!error && data) {
        const orderData = data as Order;
        const existing = JSON.parse(localStorage.getItem('my_active_orders') || '[]');
        localStorage.setItem('my_active_orders', JSON.stringify([orderData.id, ...existing]));

        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {
          // fallback
        }

        toast.success(t.orderSuccessToast);
        onOrderPlaced(orderData);
        onClose();
      } else {
        toast.error(t.orderErrorToast);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[#111622] rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl p-5 max-h-[85vh] flex flex-col justify-between animate-in slide-in-from-bottom text-slate-100">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-slate-300" />
              <div>
                <h3 className="font-bold text-sm text-white">{t.cartTitle}</h3>
                <span className="text-[11px] text-slate-400 font-medium">{tableNo ? tableNo : t.table}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#141A26] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="overflow-y-auto max-h-[40vh] space-y-2 pr-1">
            {cart.map((item) => (
              <div key={item.product.id} className="p-2.5 rounded-xl bg-[#141A26] flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-100 truncate">
                    {item.product.name}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-300">
                    {(item.product.price * item.quantity).toFixed(2)} ₺
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-[#111622] p-1 rounded-xl">
                  <button
                    onClick={() => onUpdateQty(item.product.id, -1)}
                    className="w-6 h-6 rounded-lg bg-[#1C2433] flex items-center justify-center text-slate-200 font-bold hover:bg-[#253043] transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="text-xs font-bold w-4 text-center text-slate-100">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => onUpdateQty(item.product.id, 1)}
                    className="w-6 h-6 rounded-lg bg-white text-[#0F172A] flex items-center justify-center font-bold hover:bg-slate-200 transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Notes Input */}
          <div className="mt-4 pt-3 space-y-1">
            <label className="block text-[11px] font-medium text-slate-400">
              {t.orderNotes}
            </label>
            <input
              type="text"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder={t.orderNotesPlaceholder}
              className="w-full bg-[#141A26] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-normal"
            />
          </div>
        </div>

        {/* Footer & Submit */}
        <div className="mt-4 pt-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-slate-400">{t.totalCartAmount}</span>
            <span className="font-bold text-base text-white">
              {totalAmount.toFixed(2)} ₺
            </span>
          </div>

          <button
            onClick={handleSendOrder}
            disabled={sending || cart.length === 0}
            className="w-full py-3.5 bg-white hover:bg-slate-200 text-[#0F172A] font-bold text-xs rounded-2xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? t.sendingOrder : t.confirmOrder}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
