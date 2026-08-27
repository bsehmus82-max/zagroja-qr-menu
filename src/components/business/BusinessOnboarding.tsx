import React, { useState } from 'react';
import { 
  Building2, Phone, MapPin, Clock, Wifi, 
  Sparkles, Check, ArrowRight, Layers
} from 'lucide-react';
import { Business } from '../../types';
import { supabase } from '../../lib/supabase';
import { DEFAULT_CATEGORIES } from '../../data/defaultCatalog';

interface BusinessOnboardingProps {
  business: Business;
  onComplete: (updated: Business) => void;
}

export const BusinessOnboarding: React.FC<BusinessOnboardingProps> = ({
  business,
  onComplete,
}) => {
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  const [workingHours, setWorkingHours] = useState(business.working_hours || '09:00 - 00:00');
  const [wifiSSID, setWifiSSID] = useState(business.wifi_ssid || '');
  const [wifiPassword, setWifiPassword] = useState(business.wifi_password || '');

  // Select which default categories to auto-create
  const [selectedCats, setSelectedCats] = useState<string[]>(
    DEFAULT_CATEGORIES.map((c) => c.name)
  );

  const [loading, setLoading] = useState(false);

  const toggleCat = (catName: string) => {
    setSelectedCats((prev) =>
      prev.includes(catName) ? prev.filter((n) => n !== catName) : [...prev, catName]
    );
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Update business info
      const { data: updatedBiz, error: updateErr } = await supabase
        .from('businesses')
        .update({
          phone,
          address,
          working_hours: workingHours,
          wifi_ssid: wifiSSID,
          wifi_password: wifiPassword,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // 2. Insert selected default categories and products
      const categoriesToCreate = DEFAULT_CATEGORIES.filter((c) =>
        selectedCats.includes(c.name)
      );

      for (let i = 0; i < categoriesToCreate.length; i++) {
        const catTemplate = categoriesToCreate[i];
        const { data: catData, error: catErr } = await supabase
          .from('categories')
          .insert([
            {
              business_id: business.id,
              name: catTemplate.name,
              image_url: catTemplate.image_url,
              order_index: i,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (!catErr && catData) {
          // Insert sample products for this category
          const prodRows = catTemplate.products.map((p, pIdx) => ({
            business_id: business.id,
            category_id: catData.id,
            name: p.name,
            description: p.description,
            price: p.price,
            is_frozen: false,
            is_active: true,
            order_index: pIdx,
          }));

          await supabase.from('products').insert(prodRows);
        }
      }

      onComplete(updatedBiz as Business);
    } catch {
      alert('Kurulum kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-brand-500 selection:text-white">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-bold border border-brand-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Hızlı Kurulum Sihirbazı
          </div>
          <h1 className="text-2xl font-black text-white">Hoş Geldiniz, {business.name}!</h1>
          <p className="text-xs text-neutral-400">
            İşletmenizin iletişim bilgilerini ve menü kategorilerinizi tek adımda ayarlayalım.
          </p>
        </div>

        <form onSubmit={handleFinish} className="space-y-6">
          {/* Section 1: Business Profile */}
          <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-4">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-400" />
              İşletme Bilgileri
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-brand-400" />
                  Telefon Numarası
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0 (5xx) xxx xx xx"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-brand-400" />
                  Çalışma Saatleri
                </label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="09:00 - 00:00"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-brand-400" />
                Açık Adres
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Örn: Moda Cad. No:14 Kadıköy / İstanbul"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Section 2: Wi-Fi Credentials */}
          <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-4">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <Wifi className="w-4 h-4 text-purple-400" />
              Müşteri Wi-Fi Bilgileri (İsteğe Bağlı)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Wi-Fi Adı (SSID)
                </label>
                <input
                  type="text"
                  value={wifiSSID}
                  onChange={(e) => setWifiSSID(e.target.value)}
                  placeholder="Zagroja_Guest_Wifi"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Wi-Fi Şifresi
                </label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Misafir Şifresi"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Select Ready Categories */}
          <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Hazır Menü Kategorileri
              </h3>
              <span className="text-[10px] text-neutral-400">
                Seçili: {selectedCats.length} Kategori
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              İşletmenize uygun kategorileri seçin. Her kategori profesyonel kapak görseli ve örnek lezzet içerikleriyle birlikte hazır oluşturulacaktır.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {DEFAULT_CATEGORIES.map((cat) => {
                const isSelected = selectedCats.includes(cat.name);
                return (
                  <div
                    key={cat.name}
                    onClick={() => toggleCat(cat.name)}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-600/20 border-brand-500 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-xs font-bold truncate pr-1">{cat.name}</span>
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 ${
                        isSelected
                          ? 'bg-brand-500 border-brand-400 text-white'
                          : 'border-neutral-700 bg-neutral-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition transform active:scale-98 disabled:opacity-50 text-xs"
          >
            <span>{loading ? 'Kurulum Tamamlanıyor...' : 'Kurulumu Tamamla ve Yönetim Paneline Başla'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
