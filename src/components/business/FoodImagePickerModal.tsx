import React, { useState } from 'react';
import { 
  X, ExternalLink, Sparkles, Check, Image as ImageIcon, 
  Search, Link as LinkIcon, Smartphone, Monitor, AlertCircle
} from 'lucide-react';

interface FoodImagePickerModalProps {
  isOpen: boolean;
  currentImageUrl?: string;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}

const STOCK_PLATFORMS = [
  {
    name: 'Unsplash Lezzet Galerisi',
    desc: 'Milyonlarca yüksek çözünürlüklü, telifsiz ve ücretsiz yemek fotoğrafı',
    url: 'https://unsplash.com/s/photos/food',
    tag: 'En Çok Tercih Edilen',
    categories: [
      { label: 'Kebap & Izgara', query: 'kebab' },
      { label: 'Burgerler', query: 'burger' },
      { label: 'Pizzalar', query: 'pizza' },
      { label: 'Pideler & Lahmacun', query: 'flatbread' },
      { label: 'Kahvaltı', query: 'turkish-breakfast' },
      { label: 'Tatlılar & Cheesecake', query: 'dessert' },
      { label: 'Kahveler & Latte', query: 'coffee-latte' },
      { label: 'Soğuk İçecekler', query: 'cocktail-drink' },
    ],
  },
  {
    name: 'Pexels Restoran Koleksiyonu',
    desc: 'Restoran ve kafe menüleri için profesyonel çekilmiş lezzet fotoğrafları',
    url: 'https://www.pexels.com/search/food/',
    tag: 'Hızlı & Kolay',
    categories: [
      { label: 'Et Yemekleri', query: 'steak' },
      { label: 'Makarnalar', query: 'pasta' },
      { label: 'Çorbalar', query: 'soup' },
      { label: 'Salatalar', query: 'salad' },
      { label: 'Deniz Ürünleri', query: 'seafood' },
      { label: 'Sandviçler', query: 'sandwich' },
    ],
  },
  {
    name: 'Pixabay Yemek & İçecek',
    desc: 'Telif hakkı gerektirmeyen temiz ve markasız yemek görselleri',
    url: 'https://pixabay.com/images/search/food/',
    tag: 'Geniş Arşiv',
    categories: [
      { label: 'Fast Food', query: 'fast-food' },
      { label: 'Tatlı & Pasta', query: 'cake' },
      { label: 'Meyve Suları', query: 'juice' },
    ],
  },
];

export const FoodImagePickerModal: React.FC<FoodImagePickerModalProps> = ({
  isOpen,
  currentImageUrl,
  onClose,
  onSelectImage,
}) => {
  const [inputUrl, setInputUrl] = useState<string>(currentImageUrl || '');
  const [testSuccess, setTestSuccess] = useState<boolean>(false);
  const [testError, setTestError] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onSelectImage(inputUrl.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-orange-500" />
              <span>Ücretsiz Stok Görsel Bul & URL Ekle</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Depolama alanı doldurmadan, dünya çapındaki ücretsiz fotoğraf sitelerinden dilediğiniz görselin linkini kopyalayıp ekleyin.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Step-by-Step Practical Guide Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 space-y-3 shadow-md">
            <h4 className="font-black text-xs sm:text-sm text-orange-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Fotoğraf Linki Nasıl Alınır? (3 Basit Adım)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/10 rounded-xl p-3 space-y-1 border border-white/10">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                  1
                </span>
                <strong className="block font-bold text-white text-[11px]">Siteye Git & Ara</strong>
                <p className="text-[10px] text-slate-300">
                  Aşağıdaki butonlardan birine basarak Unsplash veya Pexels&apos;te yemeğinizi aratın.
                </p>
              </div>

              <div className="bg-white/10 rounded-xl p-3 space-y-1 border border-white/10">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                  2
                </span>
                <strong className="block font-bold text-white text-[11px]">Resim Adresini Kopyala</strong>
                <p className="text-[10px] text-slate-300">
                  <span className="font-semibold text-orange-300">Telefonda:</span> Resme basılı tutup <em>&quot;Resim Bağlantısını Kopyala&quot;</em> deyin.<br />
                  <span className="font-semibold text-orange-300">PC&apos;de:</span> Sağ tık <em>&quot;Resim Adresini Kopyala&quot;</em>.
                </p>
              </div>

              <div className="bg-white/10 rounded-xl p-3 space-y-1 border border-white/10">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                  3
                </span>
                <strong className="block font-bold text-white text-[11px]">Buraya Yapıştır</strong>
                <p className="text-[10px] text-slate-300">
                  Kopyaladığınız linki aşağıdaki kutucuğa yapıştırıp <em>&quot;Kaydet&quot;</em> butonuna basın.
                </p>
              </div>
            </div>
          </div>

          {/* Quick-Access Stock Platforms */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-orange-500" />
              <span>Ücretsiz Stok Görsel Siteleri (Tek Tıkla Git)</span>
            </h4>

            <div className="space-y-3">
              {STOCK_PLATFORMS.map((platform) => (
                <div
                  key={platform.name}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-xs text-slate-900">{platform.name}</h5>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                          {platform.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{platform.desc}</p>
                    </div>

                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0 shadow-xs active:scale-95"
                    >
                      <span>Siteyi Aç</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Fast Category Search Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
                    {platform.categories.map((cat) => (
                      <a
                        key={cat.label}
                        href={
                          platform.name.includes('Unsplash')
                            ? `https://unsplash.com/s/photos/${cat.query}`
                            : platform.name.includes('Pexels')
                            ? `https://www.pexels.com/search/${cat.query}/`
                            : `https://pixabay.com/images/search/${cat.query}/`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 text-[10px] font-bold rounded-lg transition shrink-0 flex items-center gap-1"
                      >
                        <span>{cat.label}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: Live URL Input & Instant Test Preview */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 space-y-3">
          <form onSubmit={handleApply} className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700">
              Kopyaladığınız Görsel Bağlantısı (URL):
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... veya https://images.pexels.com/..."
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    setTestError(false);
                    setTestSuccess(false);
                  }}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shrink-0 shadow-md shadow-orange-500/20 active:scale-95"
              >
                Görseli Kaydet
              </button>
            </div>
          </form>

          {/* Instant Test Preview Thumbnail */}
          {inputUrl && (
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                <img
                  src={inputUrl}
                  alt="Önizleme"
                  onLoad={() => setTestSuccess(true)}
                  onError={() => setTestError(true)}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 text-xs">
                {testError ? (
                  <span className="text-red-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Görsel yüklenemedi. Lütfen doğrudan resim adresi (URL) kopyaladığınızdan emin olun.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Görsel başarıyla doğrulandı! Kaydet butonuna basabilirsiniz.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
