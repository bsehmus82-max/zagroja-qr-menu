import React, { useState } from 'react';
import { 
  Phone, MapPin, Clock, Wifi, Sparkles, 
  CheckCircle2, ArrowRight, Shield, Image as ImageIcon, Check
} from 'lucide-react';
import { Business } from '../../types';
import { supabase } from '../../lib/supabase';
import { DEFAULT_CATEGORIES } from '../../data/defaultCatalog';
import { useToast } from '../../context/ToastContext';

interface BusinessOnboardingProps {
  business: Business;
  onComplete: (updated: Business) => void;
}

export const BusinessOnboarding: React.FC<BusinessOnboardingProps> = ({
  business,
  onComplete,
}) => {
  const toast = useToast();
  const [logoUrl, setLogoUrl] = useState(business.logo_url || '');
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  
  // Working Hours State & Presets
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('00:00');
  const [is24Hours, setIs24Hours] = useState(false);

  const [wifiSsid, setWifiSsid] = useState(business.wifi_ssid || '');
  const [wifiPassword, setWifiPassword] = useState(business.wifi_password || '');
  const [loadDefaultMenu, setLoadDefaultMenu] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  const workingHoursDisplay = is24Hours ? '24 Saat Açık' : `${openTime} - ${closeTime}`;

  const applyPresetHours = (preset: string) => {
    if (preset === '24') {
      setIs24Hours(true);
    } else {
      setIs24Hours(false);
      const [start, end] = preset.split('-');
      setOpenTime(start);
      setCloseTime(end);
    }
  };

  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Update Business Settings (Phone, Address, Logo, Working Hours, Wi-Fi)
      const { data: updatedBiz, error: bizError } = await supabase
        .from('businesses')
        .update({
          logo_url: logoUrl.trim() || null,
          phone: phone.trim(),
          address: address.trim(),
          working_hours: workingHoursDisplay,
          wifi_ssid: wifiSsid.trim(),
          wifi_password: wifiPassword.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)
        .select()
        .single();

      if (bizError) throw bizError;

      // 2. Load Rich Default Catalog if checked
      if (loadDefaultMenu) {
        for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
          const catTemplate = DEFAULT_CATEGORIES[i];
          const { data: catData, error: catError } = await supabase
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

          if (!catError && catData) {
            const prodsToInsert = catTemplate.products.map((p, pIdx) => ({
              business_id: business.id,
              category_id: catData.id,
              name: p.name,
              description: p.description,
              price: p.price,
              is_frozen: false,
              is_active: true,
              order_index: pIdx,
            }));

            await supabase.from('products').insert(prodsToInsert);
          }
        }
      }

      toast.success('İşletme kurulumunuz tamamlandı! Yönetim paneline hoş geldiniz.');
      onComplete(updatedBiz as Business);
    } catch {
      toast.error('Kurulum kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B10] flex items-center justify-center p-4 selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="w-full max-w-2xl bg-[#111622] border border-[#1E2638] rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">İşletme Kurulum Sihirbazı</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            <strong className="text-slate-200">{business.name}</strong> için temel bilgileri girerek sisteminizi 1 dakikada hazır hale getirin.
          </p>
        </div>

        <form onSubmit={handleFinishOnboarding} className="space-y-4">
          {/* Logo Field */}
          <div className="p-4 bg-[#0B0E14] border border-[#1E2638] rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#151C2C] border border-[#212C42] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo Önizleme"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '';
                  }}
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-500" />
              )}
            </div>

            <div className="flex-1 w-full space-y-1">
              <label className="block text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                İşletme Logosu (Görsel URL)
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://... /logo.png (İsteğe bağlı)"
                className="w-full bg-[#111622] border border-[#1E2638] focus:border-indigo-500/60 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Phone */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-400" />
                İşletme Telefonu
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0 (212) 000 00 00"
                className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>

            {/* Working Hours with buttons */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Çalışma Saatleri
                </span>
                <span className="text-[10px] font-bold text-indigo-400">{workingHoursDisplay}</span>
              </label>

              {/* Time pickers or 24h toggle */}
              {!is24Hours ? (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    title="Açılış Saati"
                  />
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    title="Kapanış Saati"
                  />
                </div>
              ) : (
                <div className="w-full bg-[#0B0E14] border border-indigo-500/30 rounded-xl py-2 px-3 text-xs text-indigo-300 font-semibold mb-2 text-center">
                  24 Saat Açık Hizmet
                </div>
              )}

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: '09:00 - 00:00', val: '09:00-00:00' },
                  { label: '08:00 - 22:00', val: '08:00-22:00' },
                  { label: '11:00 - 02:00', val: '11:00-02:00' },
                  { label: '24 Saat', val: '24' },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => applyPresetHours(preset.val)}
                    className="py-1 px-1 rounded-lg bg-[#0B0E14] hover:bg-[#182030] text-[10px] text-slate-400 hover:text-slate-200 border border-[#1E2638] transition truncate text-center"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              Açık Adres
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Mahalle, Cadde, No, İlçe / Şehir"
              className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Wi-Fi SSID */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                Müşteri Wi-Fi Adı (İsteğe Bağlı)
              </label>
              <input
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="Restoran_Guest_Wifi"
                className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>

            {/* Wi-Fi Password */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Wi-Fi Şifresi
              </label>
              <input
                type="text"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="Misafir1234"
                className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Load Default Catalog Checkbox */}
          <label className="p-4 bg-[#0B0E14] border border-[#1E2638] rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:border-indigo-500/30 transition">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-white">Hazır Zengin Menü Kataloğunu Yükle</h3>
                <p className="text-[10px] text-slate-400">Kahvaltı, Kahve, Burger, Pizza, Izgara ve Tatlı kategorileri hazır gelsin</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={loadDefaultMenu}
              onChange={(e) => setLoadDefaultMenu(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-[#111622] border-[#1E2638]"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <span>{loading ? 'Kurulum Tamamlanıyor...' : 'Kurulumu Tamamla ve Panele Geç'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
