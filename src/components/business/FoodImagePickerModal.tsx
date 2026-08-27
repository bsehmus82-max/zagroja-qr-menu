import React, { useState, useRef } from 'react';
import { Search, X, Upload, Image as ImageIcon, Check, Sparkles, Plus } from 'lucide-react';
import { 
  FOOD_IMAGE_INVENTORY, 
  FOOD_IMAGE_CATEGORIES, 
  FoodImageItem 
} from '../../data/foodImageInventory';

interface FoodImagePickerModalProps {
  isOpen: boolean;
  currentImageUrl?: string;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}

export const FoodImagePickerModal: React.FC<FoodImagePickerModalProps> = ({
  isOpen,
  currentImageUrl,
  onClose,
  onSelectImage,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter items by category & search query
  const filteredItems = FOOD_IMAGE_INVENTORY.filter((item) => {
    const matchesCat = selectedCategory === 'Tümü' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCat;

    const matchesQuery =
      item.title.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.tags.some((t) => t.toLowerCase().includes(query));

    return matchesCat && matchesQuery;
  });

  // Handle Local File Upload (from gallery / camera / computer)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Lütfen 5MB boyutundan küçük bir görsel seçiniz.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        onSelectImage(base64Url);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onSelectImage(customUrl.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-orange-500" />
              <span>Hazır Lezzet Fotoğraf Envanteri & Galeri</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Yüksek kaliteli, reklamsız hazır yemek fotoğraflarından seçin veya cihazınızdan yükleyin.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Controls: Search, Category Filters & Upload Button */}
        <div className="p-3 sm:p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Yemek veya içecek adı arayın (Örn: Köfte, Burger, Çorba, Cheesecake, Latte)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 font-medium"
              />
            </div>

            {/* Direct Device Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
              title="Kendi Çektiğiniz Fotoğrafı Yükleyin"
            >
              <Upload className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Cihazdan Yükle</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {FOOD_IMAGE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition shrink-0 ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Image Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-[300px]">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 font-medium space-y-2">
              <p>Aramanıza uygun görsel bulunamadı.</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-orange-600 font-bold hover:underline"
              >
                Cihazınızdan kendi fotoğrafınızı yükleyebilirsiniz
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.map((item) => {
                const isSelected = currentImageUrl === item.url;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectImage(item.url);
                      onClose();
                    }}
                    className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-[1.02] shadow-xs ${
                      isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/30'
                        : 'border-slate-200 hover:border-orange-400'
                    }`}
                  >
                    {/* Image Aspect 4:3 */}
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Image Title & Category Tag */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                      <h4 className="font-extrabold text-[11px] leading-tight truncate drop-shadow-xs">
                        {item.title}
                      </h4>
                      <span className="text-[9px] font-semibold text-slate-300 drop-shadow-xs">
                        {item.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: Fallback Custom URL Input */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleApplyCustomUrl} className="w-full sm:w-auto flex-1 flex items-center gap-2">
            <input
              type="url"
              placeholder="Veya harici görsel linki yapıştırın (https://...)"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
            />
            {customUrl && (
              <button
                type="submit"
                className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shrink-0 shadow-xs"
              >
                Uygula
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition shrink-0"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
