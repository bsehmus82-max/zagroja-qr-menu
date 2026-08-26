import React from 'react';
import { Product } from '../../types';
import { Plus, Ban, Flame } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  currency: string;
  onOpenDetail: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  onOpenDetail,
  onQuickAdd,
}) => {
  return (
    <div
      onClick={() => onOpenDetail(product)}
      className={`group relative bg-white rounded-2xl p-3 border border-slate-100/80 shadow-xs hover:shadow-md transition-all duration-300 flex gap-3.5 cursor-pointer ${
        !product.is_available ? 'opacity-65 grayscale-[0.3]' : 'hover:-translate-y-0.5'
      }`}
    >
      {/* Product Image Thumbnail */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';
          }}
        />
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider text-center flex items-center gap-0.5 bg-rose-600 px-1.5 py-0.5 rounded">
              <Ban className="w-2.5 h-2.5" /> Tükendi
            </span>
          </div>
        )}
        {product.is_featured && product.is_available && (
          <span className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
            Popüler
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-orange-600 transition-colors">
              {product.name}
            </h4>
          </div>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description || 'Özel malzemeler ile hazırlanmaktadır.'}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold text-orange-600">
              {product.price.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">{currency}</span>
            {product.calories && (
              <span className="ml-1.5 hidden sm:inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                <Flame className="w-2.5 h-2.5 text-rose-400" /> {product.calories}k
              </span>
            )}
          </div>

          {/* Quick Add Button */}
          {product.is_available ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(product);
              }}
              className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-colors shadow-xs active:scale-90"
              title="Sepete Ekle"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">
              Tükendi
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
