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
    product.image_url ||
    categoryImage ||
    '';

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
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
    >
      <div className="bg-[#111622] text-slate-100 rounded-t-3xl sm:rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in slide-in-from-bottom flex flex-col max-h-[90vh]">
        {/* Food Cover (If photo exists) or Clean Compact Header */}
        {photoUrl ? (
          <div className="relative h-52 sm:h-60 w-full bg-[#0C1017] shrink-0">
            <img
              src={photoUrl}
              alt={product.name}
              className="w-full h-full object-cover opacity-80"
            />

            {/* Vignette Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111622] via-[#111622]/30 to-black/60" />

            {/* Sol Üst Geri / Kapat Butonu */}
            <button
              onClick={onClose}
              className="absolute top-3.5 left-3.5 w-9 h-9 rounded-full bg-[#141A26]/80 hover:bg-[#1C2433] text-white backdrop-blur-md flex items-center justify-center transition active:scale-95 shadow-md z-10"
              title="Geri"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Sağ Üst Kapat Butonu */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-[#141A26]/80 hover:bg-[#1C2433] text-white backdrop-blur-md flex items-center justify-center transition active:scale-95 shadow-md z-10"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Category Tag on Image */}
            {translatedCatName && (
              <div className="absolute bottom-3 left-4 z-10">
                <span className="bg-[#1C2433]/90 backdrop-blur-md text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {translatedCatName}
                </span>
              </div>
            )}

            {product.is_frozen && (
              <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white gap-1 z-20">
                <Snowflake className="w-6 h-6 text-sky-400" />
                <span className="font-bold text-xs">{t.soldOut}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-[#141A26] flex items-center justify-between">
            {translatedCatName ? (
              <span className="bg-[#1C2433] text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                {translatedCatName}
              </span>
            ) : <span />}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1C2433] hover:bg-[#253043] text-white flex items-center justify-center transition active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
              {product.name}
            </h2>
            <div className="text-right shrink-0">
              <span className="text-base sm:text-lg font-bold text-slate-100">
                {product.price.toFixed(2)} ₺
              </span>
            </div>
          </div>

          {/* Detailed Ingredients / Description */}
          {translatedDesc ? (
            <div className="bg-[#141A26] rounded-2xl p-3.5 text-xs text-slate-300 leading-relaxed font-normal">
              <p>{translatedDesc}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              {product.name} için lezzet açıklaması.
            </p>
          )}

          {/* Quantity Stepper & Price Calculation */}
          {!product.is_frozen && (
            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-[#141A26] p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-xl bg-[#1C2433] text-slate-200 font-bold hover:bg-[#253043] active:scale-95 transition flex items-center justify-center"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="text-xs font-bold text-slate-100 w-6 text-center">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-7 h-7 rounded-xl bg-white text-[#0F172A] font-bold hover:bg-slate-200 active:scale-95 transition flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block font-medium">Toplam</span>
                <span className="text-sm font-bold text-slate-100">
                  {(product.price * quantity).toFixed(2)} ₺
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA Button */}
        <div className="p-4 bg-[#0C1017]">
          <button
            onClick={handleAdd}
            disabled={product.is_frozen}
            className={`w-full py-3.5 px-5 rounded-2xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:pointer-events-none ${
              added
                ? 'bg-emerald-600 text-white'
                : 'bg-white hover:bg-slate-200 text-[#0F172A]'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Sepete Eklendi!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-[#0F172A]" />
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
