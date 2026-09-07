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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in font-medium text-slate-200">
      <div className="bg-[#111622] rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-[#1F293D] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1F293D] flex items-center justify-between bg-[#111622]">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-slate-300" />
              <span>Ücretsiz Stok Görsel Bul & URL Ekle</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Depolama alanı doldurmadan, dünya çapındaki ücretsiz fotoğraf sitelerinden dilediğiniz görselin linkini kopyalayıp ekleyin.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#1C2433] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-[#0C1017]">
          {/* Step-by-Step Practical Guide Card */}
          <div className="bg-[#111622] text-white rounded-2xl p-4 sm:p-5 space-y-3 shadow-md border border-[#1F293D]">
            <h4 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-slate-300" />
              <span>Fotoğraf Linki Nasıl Alınır? (3 Basit Adım)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#0C1017] rounded-xl p-3 space-y-1 border border-[#1F293D]">
                <span className="w-5 h-5 rounded-full bg-white text-slate-900 text-[10px] font-extrabold flex items-center justify-center">
                  1
                </span>
                <strong className="block font-bold text-white text-[11px]">Siteye Git & Ara</strong>
                <p className="text-[10px] text-slate-400">
                  Aşağıdaki butonlardan birine basarak Unsplash veya Pexels'te yemeğinizi aratın.
                </p>
              </div>

              <div className="bg-[#0C1017] rounded-xl p-3 space-y-1 border border-[#1F293D]">
                <span className="w-5 h-5 rounded-full bg-white text-slate-900 text-[10px] font-extrabold flex items-center justify-center">
                  2
                </span>
                <strong className="block font-bold text-white text-[11px]">Resim Adresini Kopyala</strong>
                <p className="text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-200">Telefonda:</span> Resme basılı tutup <em>"Resim Bağlantısını Kopyala"</em> deyin.<br />
                  <span className="font-semibold text-slate-200">PC'de:</span> Sağ tık <em>"Resim Adresini Kopyala"</em>.
                </p>
              </div>

              <div className="bg-[#0C1017] rounded-xl p-3 space-y-1 border border-[#1F293D]">
                <span className="w-5 h-5 rounded-full bg-white text-slate-900 text-[10px] font-extrabold flex items-center justify-center">
                  3
                </span>
                <strong className="block font-bold text-white text-[11px]">Buraya Yapıştır</strong>
                <p className="text-[10px] text-slate-400">
                  Kopyaladığınız linki aşağıdaki kutucuğa yapıştırıp <em>"Kaydet"</em> butonuna basın.
                </p>
              </div>
            </div>
          </div>

          {/* Quick-Access Stock Platforms */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
              <span>Ücretsiz Stok Görsel Siteleri (Tek Tıkla Git)</span>
            </h4>

            <div className="space-y-3">
              {STOCK_PLATFORMS.map((platform) => (
                <div
                  key={platform.name}
                  className="bg-[#111622] border border-[#1F293D] rounded-2xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-xs text-white">{platform.name}</h5>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#1C2433] text-slate-300 border border-[#2B384E]">
                          {platform.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{platform.desc}</p>
                    </div>

                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#1C2433] hover:bg-[#253043] text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0 shadow-sm active:scale-95 border border-[#2B384E]"
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
                        className="px-2.5 py-1 bg-[#0C1017] hover:bg-[#1C2433] border border-[#1F293D] hover:border-slate-500 text-slate-300 text-[10px] font-bold rounded-lg transition shrink-0 flex items-center gap-1"
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
        <div className="p-4 border-t border-[#1F293D] bg-[#111622] space-y-3">
          <form onSubmit={handleApply} className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-300">
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
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0C1017] border border-[#1F293D] rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-500 font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-white hover:bg-slate-200 text-slate-900 text-xs font-extrabold rounded-xl transition shrink-0 shadow-sm active:scale-95"
              >
                Görseli Kaydet
              </button>
            </div>
          </form>

          {/* Instant Test Preview Thumbnail */}
          {inputUrl && (
            <div className="p-2.5 bg-[#0C1017] rounded-xl border border-[#1F293D] flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#111622] overflow-hidden shrink-0 border border-[#1F293D] relative">
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
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Görsel yüklenemedi. Lütfen doğrudan resim adresi (URL) kopyaladığınızdan emin olun.
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
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
