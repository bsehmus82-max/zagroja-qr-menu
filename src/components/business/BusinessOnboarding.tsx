import React, { useState } from 'react';
import { Sparkles, Store, Phone, MapPin, Wifi, Clock, Check, ArrowRight } from 'lucide-react';
import { Business } from '../../types';
import { supabase } from '../../lib/supabase';
import { DEFAULT_CATALOG, DefaultCatalogCategory } from '../../data/defaultCatalog';

interface BusinessOnboardingProps {
  business: Business;
  onComplete: (updated: Business) => void;
}

export const BusinessOnboarding: React.FC<BusinessOnboardingProps> = ({ business, onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  const [workingHours, setWorkingHours] = useState(business.working_hours || '09:00 - 00:00');
  const [wifiSSID, setWifiSSID] = useState(business.wifi_ssid || '');
  const [wifiPassword, setWifiPassword] = useState(business.wifi_password || '');

  // Pre-selected categories
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>(
    DEFAULT_CATALOG.map((c) => c.id) // Default all selected
  );
  const [saving, setSaving] = useState(false);

  const toggleCategory = (id: string) => {
    setSelectedCatIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // 1. Update business info
      const { data: updatedBiz, error: bizErr } = await supabase
        .from('businesses')
        .update({
          phone: phone.trim(),
          address: address.trim(),
          working_hours: workingHours.trim(),
          wifi_ssid: wifiSSID.trim(),
          wifi_password: wifiPassword.trim(),
          is_onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)
        .select()
        .single();

      if (bizErr || !updatedBiz) {
        alert('Ýþletme bilgileri güncellenirken hata oluþtu.');
        return;
      }

      // 2. Insert selected categories and products
      const selectedCats = DEFAULT_CATALOG.filter((c) => selectedCatIds.includes(c.id));

      for (let i = 0; i < selectedCats.length; i++) {
        const cat = selectedCats[i];
        const { data: newCat } = await supabase
          .from('categories')
          .insert([
            {
              business_id: business.id,
              name: cat.name,
              image_url: cat.image_url,
              order_index: i,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (newCat) {
          const productsToInsert = cat.products.map((p, pIdx) => ({
            business_id: business.id,
            category_id: newCat.id,
            name: p.name,
            description: p.description,
            price: p.price,
            is_frozen: false,
            is_active: true,
            order_index: pIdx,
          }));

          await supabase.from('products').insert(productsToInsert);
        }
      }

      onComplete(updatedBiz as Business);
    } catch {
      alert('Kurulum tamamlanamadý.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-brand-500 selection:text-white">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400 mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white">{business.name}</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Zagroja QR Menü Hýzlý Baþlangýç & Kurulum Sihirbazý
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border ${
              step === 1
                ? 'bg-brand-600 text-white border-brand-500'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800'
            }`}
          >
            <span>1. Ýþletme Bilgileri</span>
          </div>
          <div
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border ${
              step === 2
                ? 'bg-brand-600 text-white border-brand-500'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800'
            }`}
          >
            <span>2. Menü Kategorileri</span>
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-brand-400" />
                  Telefon Numarasý
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0532 000 00 00"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-400" />
                  Çalýþma Saatleri
                </label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="09:00 - 00:00"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                Ýþletme Adresi
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Örn: Baðdat Caddesi No: 42 Kadýköy / Ýstanbul"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-brand-400" />
                  Müþteri Wi-Fi Adý (SSID)
                </label>
                <input
                  type="text"
                  value={wifiSSID}
                  onChange={(e) => setWifiSSID(e.target.value)}
                  placeholder="Zagroja_Guest"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-brand-400" />
                  Müþteri Wi-Fi Þifresi
                </label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="wifi2026"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Müþteriler QR menüden tek týkla kopyalayabilir.
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-brand-600/30 transition"
              >
                Kategori Seçimine Geç
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-400">
              Ýþletmenizde sunmak istediðiniz kategorileri seçiniz. Seçilen kategoriler ve zengin ürün içerikleri menünüze otomatik olarak hazýr yüklenecektir. Dilediðiniz zaman düzenleyebilirsiniz.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {DEFAULT_CATALOG.map((cat) => {
                const isSelected = selectedCatIds.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-600/10 border-brand-500 text-white'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{cat.name}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">
                        {cat.products.length} Hazýr Ürün & Ýçerik
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-xl border flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : 'border-neutral-700 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-6 border-t border-neutral-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-neutral-800 text-neutral-300 rounded-2xl text-xs font-bold"
              >
                Geri
              </button>
              <button
                type="button"
                disabled={saving || selectedCatIds.length === 0}
                onClick={handleFinish}
                className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold px-8 py-3.5 rounded-2xl text-xs shadow-lg shadow-brand-600/30 transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? 'Menü Oluþturuluyor...' : 'Kurulumu Tamamla & Paneli Aç'}
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
