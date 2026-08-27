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

  // Image Upload Handler (Auto-compress & resize client-side)
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
    <div className="min-h-screen bg-[#07090E] flex items-center justify-center p-4 sm:p-6 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-xl bg-[#0D111A]/95 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative z-10 space-y-6">
        {/* Clean Header */}
        <div className="text-center space-y-1.5 pb-2 border-b border-white/[0.06]">
          <h1 className="text-xl font-bold tracking-tight text-white">İşletmeniz İçin Gerekli Bilgiler</h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            <strong className="text-slate-200 font-semibold">{business.name}</strong> misafirlerine kusursuz bir dijital menü deneyimi sunmak için temel bilgileri tamamlayın.
          </p>
        </div>

        <form onSubmit={handleFinishOnboarding} className="space-y-4">
          {/* Logo Section (Frameless, Pure Clean Logo Display) */}
          <div className="bg-[#121724]/60 border border-white/[0.06] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">İşletme Logosu</span>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-[#090C12] p-1 rounded-xl border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setLogoMode('upload')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition flex items-center gap-1 ${
                    logoMode === 'upload'
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  Fotoğraf Yükle
                </button>
                <button
                  type="button"
                  onClick={() => setLogoMode('url')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition flex items-center gap-1 ${
                    logoMode === 'url'
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Link2 className="w-3 h-3" />
                  Görsel URL
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Pure Logo without clumsy border boxes */}
              {logoUrl ? (
                <div className="relative group shrink-0">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-14 h-14 object-contain rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-lg transition"
                    title="Logoyu Kaldır"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-12 h-12 flex items-center justify-center text-slate-500 shrink-0">
                  <Camera className="w-6 h-6" />
                </div>
              )}

              {logoMode === 'upload' ? (
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-white/[0.12] hover:border-indigo-500/60 bg-[#090C12]/80 rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs text-slate-300 hover:text-white"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{logoUrl ? 'Logoyu Değiştir' : 'Cihazdan Fotoğraf Seç'}</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://... /logo.png"
                    className="w-full bg-[#090C12] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                İşletme Telefonu
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0 (212) 000 00 00"
                className="w-full bg-[#121724]/60 border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Açık Adres
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Mahalle, Cadde, No, İlçe"
                className="w-full bg-[#121724]/60 border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Working Schedule */}
          <div className="bg-[#121724]/60 border border-white/[0.06] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Çalışma Günleri & Saatleri</span>
              <span className="text-[10px] font-bold text-indigo-400 font-mono">{workingHoursDisplay}</span>
            </div>

            {/* Days Pills */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-400">Haftalık Günler</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyDaysPreset('all')}
                    className="text-[9px] px-2 py-0.5 rounded-lg bg-[#090C12] hover:bg-white/5 text-slate-300 border border-white/[0.08] transition"
                  >
                    Her Gün
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDaysPreset('weekdays')}
                    className="text-[9px] px-2 py-0.5 rounded-lg bg-[#090C12] hover:bg-white/5 text-slate-300 border border-white/[0.08] transition"
                  >
                    Hafta İçi
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDaysPreset('mon_sat')}
                    className="text-[9px] px-2 py-0.5 rounded-lg bg-[#090C12] hover:bg-white/5 text-slate-300 border border-white/[0.08] transition"
                  >
                    Pzt - Cmt
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {ALL_DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`py-1.5 rounded-xl text-xs font-semibold transition border text-center ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                          : 'bg-[#090C12] border-white/[0.06] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Pickers or 24h Message */}
            <div>
              {!is24Hours ? (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <span className="block text-[10px] text-slate-400 mb-1">Açılış Saati</span>
                    <input
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="w-full bg-[#090C12] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 mb-1">Kapanış Saati</span>
                    <input
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="w-full bg-[#090C12] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full bg-indigo-600/10 border border-indigo-500/25 rounded-xl py-2 px-3 text-xs text-indigo-300 font-semibold mb-2 text-center">
                  24 Saat Açık Hizmet (Haftanın 7 Günü)
                </div>
              )}

              {/* Quick Hours Presets */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: '09:00 - 00:00', val: '09:00-00:00' },
                  { label: '08:00 - 22:00', val: '08:00-22:00' },
                  { label: '11:00 - 02:00', val: '11:00-02:00' },
                  { label: '7/24 Açık', val: '24' },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => applyPresetHours(p.val)}
                    className="bg-[#090C12] hover:bg-indigo-600/20 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-300 border border-white/[0.06] rounded-lg py-1 text-[9px] font-medium transition active:scale-95"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Wi-Fi Section (Frameless Icon) */}
          <div className="bg-[#121724]/60 border border-white/[0.06] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                  Müşteri Wi-Fi Bilgisi
                </span>
                <p className="text-[10px] text-slate-400">QR menüde misafirlere gösterilsin mi?</p>
              </div>

              {/* iOS Style Pill Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWifi}
                  onChange={(e) => setShowWifi(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-[#090C12] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 peer-checked:after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 border border-white/[0.08]"></div>
              </label>
            </div>

            {showWifi && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/[0.06] animate-in fade-in duration-200">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Wi-Fi Ağ Adı (SSID)</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="Restoran_Misafir"
                    className="w-full bg-[#090C12] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Wi-Fi Şifresi</label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="Misafir1234"
                    className="w-full bg-[#090C12] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sample Menu Template Section (Frameless Icon) */}
          <div className="bg-[#121724]/60 border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Utensils className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <h3 className="font-semibold text-xs text-white">Örnek Menü Şablonunu Dahil Et</h3>
                <p className="text-[10px] text-slate-400">16 resmi restoran kategorisi ve zengin lezzetlerle anında başlayın</p>
              </div>
            </div>

            {/* iOS Style Pill Switch */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={loadDefaultMenu}
                onChange={(e) => setLoadDefaultMenu(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#090C12] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 peer-checked:after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 border border-white/[0.08]"></div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <span>{loading ? 'Kaydediliyor...' : 'Kurulumu Tamamla ve Yönetim Paneline Geç'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
