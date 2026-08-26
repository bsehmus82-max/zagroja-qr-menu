import React, { useState } from 'react';
import { Product } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { X, Plus, Minus, Clock, Flame, ShoppingBag, Ban } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  currency: string;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, notes: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currency,
  onClose,
  onAddToCart,
}) => {
  const { t, tDynamic } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  if (!product) return null;

  const handleAdd = () => {
    if (!product.is_available) return;
    onAddToCart(product, quantity, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Banner */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-100 flex-shrink-0">
          <img
            src={product.image_url}
            alt={tDynamic(product.name)}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
            }}
          />
          {!product.is_available && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
              <span className="px-4 py-2 rounded-full bg-rose-600 text-white font-bold text-sm tracking-wider uppercase shadow-lg flex items-center gap-2">
                <Ban className="w-4 h-4" /> Tükendi / Stokta Yok
              </span>
            </div>
          )}
          {product.is_featured && product.is_available && (
            <div className="absolute top-3.5 left-3.5 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
              Şefin Önerisi ⭐
            </div>
          )}
        </div>

        {/* Content Scrollable */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">{product.name}</h3>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                {product.prep_time_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {product.prep_time_minutes} dk
                  </span>
                )}
                {product.calories && (
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    {product.calories} kcal
                  </span>
                )}
              </div>
            </div>
            <div className="text-2xl font-extrabold text-orange-600 whitespace-nowrap">
              {product.price.toFixed(2)} {currency}
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            {product.description || 'Özenle seçilmiş taze malzemeler ile usta eller tarafından hazırlanmaktadır.'}
          </p>

          {/* Sipariş Notu */}
          {product.is_available && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Özel Sipariş Notu (İsteğe bağlı)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('Örn: Az pişmiş, buzsuz...')}
                rows={2}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50 resize-none"
              />
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        {product.is_available ? (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-40"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold text-slate-800 text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAdd}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-orange-500/25 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                {t('Sepete Ekle')}
              </span>
              <span>{(product.price * quantity).toFixed(2)} {currency}</span>
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
            <p className="text-xs text-rose-500 font-semibold flex items-center justify-center gap-1.5">
              <Ban className="w-4 h-4" /> Bu ürün şu anda mutfakta tükendiği için sipariş verilememektedir.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
