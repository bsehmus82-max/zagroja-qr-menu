import React from 'react';
import { Category } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { 
  Coffee, 
  GlassWater, 
  UtensilsCrossed, 
  Sandwich, 
  Egg, 
  Cake, 
  Sparkles, 
  Utensils,
  Pizza,
  Salad,
  Wine,
  Beer,
  Flame,
  Wind,
  Soup,
  Martini,
  Citrus,
  IceCream
} from 'lucide-react';

interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const getCategoryIcon = (iconName: string, className = "w-4 h-4") => {
  switch (iconName?.toLowerCase()) {
    case 'coffee':
      return <Coffee className={className} />;
    case 'glasswater':
    case 'drink':
      return <GlassWater className={className} />;
    case 'utensilscrossed':
    case 'food':
    case 'dinner':
      return <UtensilsCrossed className={className} />;
    case 'sandwich':
    case 'snack':
      return <Sandwich className={className} />;
    case 'egg':
    case 'breakfast':
      return <Egg className={className} />;
    case 'cake':
    case 'dessert':
      return <Cake className={className} />;
    case 'icecream':
      return <IceCream className={className} />;
    case 'pizza':
      return <Pizza className={className} />;
    case 'salad':
      return <Salad className={className} />;
    case 'wine':
      return <Wine className={className} />;
    case 'beer':
    case 'alcohol':
      return <Beer className={className} />;
    case 'martini':
    case 'cocktail':
      return <Martini className={className} />;
    case 'flame':
    case 'burger':
      return <Flame className={className} />;
    case 'wind':
    case 'nargile':
    case 'hookah':
    case 'shisha':
      return <Wind className={className} />;
    case 'soup':
    case 'meze':
      return <Soup className={className} />;
    case 'citrus':
    case 'mocktail':
      return <Citrus className={className} />;
    case 'sparkles':
    case 'special':
      return <Sparkles className={className} />;
    default:
      return <Utensils className={className} />;
  }
};

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const { t, tDynamic } = useLanguage();
  return (
    <div className="sticky top-[64px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm py-2.5 px-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {/* All Products pill */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
            selectedCategoryId === 'all'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-[1.02]'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tümü</span>
        </button>

        {/* Dynamic categories */}
        {categories
          .filter((c) => c.is_active)
          .map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95'
                }`}
              >
                {getCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                <span>{tDynamic(cat.name)}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
};
