import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, Check, Snowflake, ShoppingBag, X } from 'lucide-react';
import { Product } from '../../types';
import { Language, translations, getTranslatedDescription, getCategoryTitle } from '../../lib/translations';

interface ProductDetailModalProps {
  product: Product | null;
  categoryName?: string;
  categoryImage?: string;
  isOpen: boolean;
  lang?: Language;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  categoryName,
  categoryImage,
  isOpen,
  lang = 'tr',
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const t = translations[lang] || translations.tr;

  if (!isOpen || !product) return null;

  const translatedDesc = getTranslatedDescription(product.description, lang);
  const translatedCatName = categoryName ? getCategoryTitle(categoryName, lang) : '';
  const photoUrl =
    categoryImage ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';

  const handleAdd = () => {
    if (product.is_frozen) return;
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
      setQuantity(1);
    }, 600);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in slide-in-from-bottom border-t sm:border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Big Food Cover with Sol Üst Geri Butonu & Vignette */}
        <div className="relative h-56 sm:h-64 w-full bg-slate-950 shrink-0">
          <img
            src={photoUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60" />

          {/* Sol Üst Geri / Kapat Butonu */}
          <button
            onClick={onClose}
            className="absolute top-3.5 left-3.5 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition active:scale-95 shadow-md z-10"
            title="Geri"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Sağ Üst Kapat Butonu */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition active:scale-95 shadow-md z-10"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Category Tag on Image */}
          {translatedCatName && (
            <div className="absolute bottom-3 left-4 z-10">
              <span className="bg-orange-500/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs">
                {translatedCatName}
              </span>
            </div>
          )}

          {product.is_frozen && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white gap-1 z-20">
              <Snowflake className="w-6 h-6 text-sky-400" />
              <span className="font-black text-xs">{t.soldOut}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {product.name}
            </h2>
            <div className="text-right shrink-0">
              <span className="text-base sm:text-lg font-black text-orange-600">
                {product.price.toFixed(2)} ₺
              </span>
            </div>
          </div>

          {/* Detailed Ingredients / Description */}
          {translatedDesc ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-600 leading-relaxed font-medium">
              <p>{translatedDesc}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {product.name} için lezzet açıklaması.
            </p>
          )}

          {/* Quantity Stepper & Price Calculation */}
          {!product.is_frozen && (
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-xl bg-white shadow-xs flex items-center justify-center text-slate-800 font-bold hover:bg-slate-50 active:scale-95 transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="text-xs font-black text-slate-900 w-6 text-center">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-7 h-7 rounded-xl bg-slate-900 shadow-xs flex items-center justify-center text-white font-bold hover:bg-slate-800 active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold">Toplam</span>
                <span className="text-sm font-black text-slate-900">
                  {(product.price * quantity).toFixed(2)} ₺
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleAdd}
            disabled={product.is_frozen}
            className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs shadow-xl transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:pointer-events-none ${
              added
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-slate-900 hover:bg-orange-600 text-white shadow-slate-900/25'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Sepete Eklendi!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-orange-400" />
                <span>
                  {t.addToCart} • {(product.price * quantity).toFixed(2)} ₺
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
