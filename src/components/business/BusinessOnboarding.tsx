import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Link2, Trash2, Camera, 
  ArrowRight, Wifi, Utensils
} from 'lucide-react';
import { Business } from '../../types';
import { supabase } from '../../lib/supabase';
import { DEFAULT_CATEGORIES } from '../../data/defaultCatalog';
import { useToast } from '../../context/ToastContext';

interface BusinessOnboardingProps {
  business: Business;
  onComplete: (updated: Business) => void;
}

const ALL_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const BusinessOnboarding: React.FC<BusinessOnboardingProps> = ({
  business,
  onComplete,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');
  const [logoUrl, setLogoUrl] = useState(business.logo_url || '');
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  
  // Working Schedule State
  const [selectedDays, setSelectedDays] = useState<string[]>(ALL_DAYS);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('00:00');
  const [is24Hours, setIs24Hours] = useState(false);

  // Wi-Fi State & Toggle
  const [showWifi, setShowWifi] = useState<boolean>(true);
  const [wifiSsid, setWifiSsid] = useState(business.wifi_ssid || '');
  const [wifiPassword, setWifiPassword] = useState(business.wifi_password || '');

  // Sample Catalog State
  const [loadDefaultMenu, setLoadDefaultMenu] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  // 24 Hours Auto-Sync
  useEffect(() => {
    if (is24Hours) {
      setSelectedDays(ALL_DAYS);
    }
  }, [is24Hours]);

  const toggleDay = (day: string) => {
    if (is24Hours) {
      toast.info('24 Saat Açık seçildiğinde çalışma günleri otomatik olarak "Her Gün"dür.');
      return;
    }
    setSelectedDays((prev) =>
      prev.includes(day) ? (prev.length > 1 ? prev.filter((d) => d !== day) : prev) : [...prev, day]
    );
  };

  const getDaysSummary = () => {
    if (selectedDays.length === 7) return 'Her Gün';
    if (
      selectedDays.length === 5 &&
      ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'].every((d) => selectedDays.includes(d))
    ) {
      return 'Hafta İçi';
    }
    if (
      selectedDays.length === 6 &&
      ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].every((d) => selectedDays.includes(d))
    ) {
      return 'Pzt - Cmt';
    }
    return selectedDays.join(', ');
  };

  const workingHoursDisplay = is24Hours ? 'Her Gün: 7/24 Açık' : `${getDaysSummary()}: ${openTime} - ${closeTime}`;

  const applyPresetHours = (preset: string) => {
    if (preset === '24') {
      setIs24Hours(true);
      setSelectedDays(ALL_DAYS);
    } else {
      setIs24Hours(false);
      const [start, end] = preset.split('-');
      setOpenTime(start);
      setCloseTime(end);
    }
  };

  const applyDaysPreset = (type: 'all' | 'weekdays' | 'mon_sat') => {
    if (is24Hours && type !== 'all') {
      setIs24Hours(false);
    }
    if (type === 'all') setSelectedDays(ALL_DAYS);
    if (type === 'weekdays') setSelectedDays(['Pzt', 'Sal', 'Çar', 'Per', 'Cum']);
    if (type === 'mon_sat') setSelectedDays(['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']);
  };

  // Image Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir görsel formatı (PNG, JPG, WEBP) seçiniz.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.88);
        setLogoUrl(optimizedBase64);
        toast.success('Logo başarıyla yüklendi!');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        phone: phone.trim(),
        address: address.trim(),
        working_hours: workingHoursDisplay,
        wifi_ssid: showWifi ? wifiSsid.trim() : '',
        wifi_password: showWifi ? wifiPassword.trim() : '',
        updated_at: new Date().toISOString(),
      };

      if (logoUrl) {
        payload.logo_url = logoUrl.trim();
      }

      const { data: updatedBiz, error: bizError } = await supabase
        .from('businesses')
        .update(payload)
        .eq('id', business.id)
        .select()
        .single();

      if (bizError) {
        console.error('Onboarding update error:', bizError);
        throw bizError;
      }

      // Load Rich Default Catalog if checked
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
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 sm:p-6 selection:bg-orange-500/30 selection:text-orange-200">
      <div className="w-full max-w-xl bg-[#1E293B] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Top Decorative Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-3xl" />

        {/* Clean Header */}
        <div className="text-center space-y-1.5 pb-2 border-b border-slate-800 pt-2">
          <h1 className="text-xl font-black tracking-tight text-white">İşletmeniz İçin Gerekli Bilgiler</h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            <strong className="text-orange-400 font-semibold">{business.name}</strong> misafirlerine kusursuz bir dijital menü deneyimi sunmak için temel bilgileri tamamlayın.
          </p>
        </div>

        <form onSubmit={handleFinishOnboarding} className="space-y-4">
          {/* Logo Section */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">İşletme Logosu</span>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-[#1E293B] p-1 rounded-xl border border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setLogoMode('upload')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    logoMode === 'upload'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  Fotoğraf Yükle
                </button>
                <button
                  type="button"
                  onClick={() => setLogoMode('url')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    logoMode === 'url'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Link2 className="w-3 h-3" />
                  Görsel Linki
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Seamless Round Badge Preview */}
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-slate-600" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                {logoMode === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-slate-700 hover:border-orange-500 bg-[#1E293B] rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs text-slate-300 hover:text-white w-full"
                    >
                      <Upload className="w-3.5 h-3.5 text-orange-400" />
                      <span className="font-semibold">Logo Görseli Seç (PNG, JPG)</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://site.com/logo.png"
                      className="w-full bg-[#1E293B] border border-slate-700/80 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
                    />
                  </div>
                )}

                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3 h-3" /> Logoyu Kaldır
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                İşletme Telefonu
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0212 000 00 00"
                className="w-full bg-[#0F172A] border border-slate-700/80 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Adres & Konum
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Kadıköy, İstanbul"
                className="w-full bg-[#0F172A] border border-slate-700/80 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Working Schedule Section */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Çalışma Saatleri & Günleri</span>
              <span className="text-[10px] font-bold text-orange-400 font-mono">{workingHoursDisplay}</span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-medium mr-1">Hızlı Ayarla:</span>
              <button
                type="button"
                onClick={() => applyPresetHours('24')}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                  is24Hours
                    ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                    : 'bg-[#1E293B] border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                7/24 Açık
              </button>
              <button
                type="button"
                onClick={() => applyPresetHours('09:00-00:00')}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#1E293B] border border-slate-700 text-slate-400 hover:text-white transition"
              >
                09:00 - 00:00
              </button>
              <button
                type="button"
                onClick={() => applyPresetHours('08:00-22:00')}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#1E293B] border border-slate-700 text-slate-400 hover:text-white transition"
              >
                08:00 - 22:00
              </button>
              <button
                type="button"
                onClick={() => applyDaysPreset('weekdays')}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#1E293B] border border-slate-700 text-slate-400 hover:text-white transition"
              >
                Hafta İçi
              </button>
            </div>

            {/* Day Selectors */}
            <div className="flex items-center gap-1.5 justify-between pt-1">
              {ALL_DAYS.map((d) => {
                const isSelected = selectedDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition border ${
                      isSelected
                        ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                        : 'bg-[#1E293B] border-slate-700/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Time Selectors */}
            {!is24Hours && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Açılış Saati</label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700/80 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Kapanış Saati</label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700/80 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Wi-Fi Section */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-slate-200">Mekan Wi-Fi Paylaşımı</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWifi}
                  onChange={(e) => setShowWifi(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-[#1E293B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 peer-checked:after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 border border-slate-700" />
              </label>
            </div>

            {showWifi && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Wi-Fi Ağ Adı (SSID)</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="Restoran Wi-Fi"
                    className="w-full bg-[#1E293B] border border-slate-700/80 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Wi-Fi Şifresi</label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="Şifre"
                    className="w-full bg-[#1E293B] border border-slate-700/80 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sample Catalog Checkbox */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Utensils className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Örnek Menü & Kategorileri Yükle</span>
                <span className="text-[10px] text-slate-400">
                  Kahvaltı, Burger, İçecek vb. hazır ürünleri menünüze ekler.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={loadDefaultMenu}
                onChange={(e) => setLoadDefaultMenu(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#1E293B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 peer-checked:after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 border border-slate-700" />
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-orange-500/25 disabled:opacity-50 active:scale-98"
          >
            <span>{loading ? 'Kurulum Kaydediliyor...' : 'Kurulumu Tamamla & Yönetim Paneline Başla'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
