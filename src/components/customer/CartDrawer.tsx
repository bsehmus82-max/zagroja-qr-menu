import React, { useState } from 'react';
import { CartItem } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { X, Trash2, Plus, Minus, Send, ShoppingBag, CreditCard, Banknote } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: string;
  tableNumber: number;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onSubmitOrder: (notes: string, paymentMethod: 'cash' | 'credit_card') => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  tableNumber,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmitOrder,
}) => {
  const { t, tDynamic } = useLanguage();
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>('credit_card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleSubmit = () => {
    if (cartItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    // Fire celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f97316', '#fbbf24', '#10b981', '#6366f1'],
    });

    setTimeout(() => {
      onSubmitOrder(orderNotes, paymentMethod);
      setIsSubmitting(false);
      setOrderNotes('');
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-up sm:animate-none">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{t('Masa')} {tableNumber} {t('Siparişi', 'Siparişi')}</h3>
              <p className="text-xs text-slate-500">{cartItems.length} {t('çeşit ürün', 'çeşit ürün')}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {cartItems.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs text-rose-500 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 font-medium transition-colors"
                title={t("Sepeti Temizle", "Sepeti Temizle")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-700 text-base">{t('Sepetiniz boş')}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {t('Masaya özel sipariş vermek için ürün ekleyin.')}
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product.id}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex gap-3 items-center"
              >
                <img
                  src={item.product.image_url}
                  alt={tDynamic(item.product.name)}
                  className="w-14 h-14 rounded-xl object-cover bg-slate-200 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 text-xs truncate">
                    {tDynamic(item.product.name)}
                  </h4>
                  <div className="text-orange-600 font-bold text-xs mt-0.5">
                    {(item.product.price * item.quantity).toFixed(2)} {currency}
                  </div>
                  {item.notes && (
                    <p className="text-[10px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1 line-clamp-1 border border-amber-200/50">
                      Not: {item.notes}
                    </p>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Order Placement */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/90 space-y-3.5">
            {/* General Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Masa Sipariş Notu
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Örn: Servis hızlı olursa seviniriz, peçete rica ederiz."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ödeme Tercihi (Masa Başında)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all ${
                    paymentMethod === 'credit_card'
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{t('Kredi Kartı')}ı</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Nakit Ödeme</span>
                </button>
              </div>
            </div>

            {/* Total summary */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-xs font-medium text-slate-500">Toplam Tutar</span>
              <div className="text-xl font-extrabold text-slate-900">
                {totalAmount.toFixed(2)} <span className="text-orange-600 text-sm">{currency}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-orange-500/25 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Sipariş İletiliyor...' : 'Siparişi Onayla & Mutfağa Gönder'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
