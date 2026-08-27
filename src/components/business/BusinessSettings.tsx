import React, { useState, useRef, useEffect } from 'react';
import { 
  Wifi, Lock, Check, Save, KeyRound, 
  AlertCircle, Eye, EyeOff, Upload, Link2, Trash2, 
  Camera, Calendar, Settings
} from 'lucide-react';
import { Business } from '../../types';
import { supabase, hashPassword } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface BusinessSettingsProps {
  business: Business;
  onUpdate: (updated: Business) => void;
}

const ALL_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const COVER_PRESETS = [
  {
    name: 'Bistro & Kafe',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Kahve & Fırın',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Burger & Izgara',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Şık Restoran & Lounge',
    url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
  },
];

export const BusinessSettings: React.FC<BusinessSettingsProps> = ({ business, onUpdate }) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');
  const [logoUrl, setLogoUrl] = useState(business.logo_url || '');

  const [bannerMode, setBannerMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [bannerUrl, setBannerUrl] = useState(business.banner_url || business.cover_image_url || '');

  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  
  // Working Schedule State
  const [selectedDays, setSelectedDays] = useState<string[]>(ALL_DAYS);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('00:00');
  const [is24Hours, setIs24Hours] = useState(
    business.working_hours?.toLowerCase().includes('24 saat') || false
  );

  // Wi-Fi State & Toggle
  const [showWifi, setShowWifi] = useState<boolean>(business.show_wifi ?? (business.wifi_ssid ? true : false));
  const [wifiSsid, setWifiSsid] = useState(business.wifi_ssid || '');
  const [wifiPassword, setWifiPassword] = useState(business.wifi_password || '');

  // Password Change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
      toast.error('Lütfen geçerli bir görsel seçiniz (PNG, JPG, WEBP).');
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
        toast.success('Logo yüklendi!');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Banner / Cover Photo Upload Handler (Auto compressed via Canvas)
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir görsel seçiniz (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
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

        const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setBannerUrl(optimizedBase64);
        toast.success('Kapak fotoğrafı yüklendi!');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const finalWifiSsid = showWifi ? wifiSsid.trim() : '';
      const finalWifiPassword = showWifi ? wifiPassword.trim() : '';

      const payload: Record<string, unknown> = {
        phone: phone.trim(),
        address: address.trim(),
        working_hours: workingHoursDisplay,
        wifi_ssid: finalWifiSsid,
        wifi_password: finalWifiPassword,
        logo_url: logoUrl ? logoUrl.trim() : null,
        banner_url: bannerUrl ? bannerUrl.trim() : null,
        cover_image_url: bannerUrl ? bannerUrl.trim() : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('businesses')
        .update(payload)
        .eq('id', business.id)
        .select()
        .single();

      if (!error && data) {
        sessionStorage.setItem('restiva_biz_session', JSON.stringify(data));
        localStorage.setItem('restiva_biz_session', JSON.stringify(data));
        onUpdate(data as Business);
        setSavedSuccess(true);
        toast.success('Ayarlar başarıyla kaydedildi!');
        setTimeout(() => setSavedSuccess(false), 2500);
      } else {
        toast.error('Ayarlar kaydedilirken bir hata oluştu: ' + (error?.message || ''));
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);

    if (newPassword.length < 6) {
      setPassError('Yeni şifre en az 6 karakter olmalıdır.');
      toast.warning('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Şifreler birbiriyle eşleşmiyor.');
      toast.error('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setSavingPass(true);
    try {
      const newHash = await hashPassword(newPassword.trim());

      const { data, error } = await supabase
        .from('businesses')
        .update({
          password_hash: newHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        sessionStorage.setItem('restiva_biz_session', JSON.stringify(data));
        onUpdate(data as Business);
        setPassSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Giriş şifreniz güncellendi!');
        setTimeout(() => setPassSuccess(false), 3000);
      }
    } catch {
      setPassError('Şifre güncellenirken hata oluştu.');
      toast.error('Şifre güncellenirken hata oluştu.');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Top Save Bar */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="font-extrabold text-xs text-slate-900">İşletme Bilgileri & Yapılandırma</h3>
        </div>

        <button
          type="button"
          onClick={handleSaveGeneral}
          disabled={saving}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition disabled:opacity-50"
        >
          {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Kaydedildi' : saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
        </button>
      </div>

      {/* Dual Logo Field */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">İşletme Logosu</span>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setLogoMode('upload')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                logoMode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Upload className="w-3 h-3" />
              Fotoğraf
            </button>
            <button
              type="button"
              onClick={() => setLogoMode('url')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                logoMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Link2 className="w-3 h-3" />
              Görsel URL
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          {logoUrl ? (
            <div className="relative group shrink-0">
              <img src={logoUrl} alt="Logo" className="w-14 h-14 object-contain rounded-xl bg-white p-1 border border-slate-200 shadow-xs" />
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md transition"
                title="Kaldır"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-12 h-12 flex items-center justify-center text-slate-400 shrink-0">
              <Camera className="w-5 h-5" />
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
                className="border border-dashed border-slate-300 hover:border-orange-500 bg-white rounded-xl p-2.5 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-orange-600"
              >
                <Upload className="w-4 h-4 text-orange-500" />
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
                className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Cover / Banner Photo Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">QR Menü Kapak & Arka Plan Fotoğrafı</span>
            <span className="text-[10px] text-slate-500">Müşterilerin QR menüyü açtığında en üstte gördüğü geniş arka plan görseli</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setBannerMode('upload')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                bannerMode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Upload className="w-3 h-3" />
              Fotoğraf
            </button>
            <button
              type="button"
              onClick={() => setBannerMode('presets')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                bannerMode === 'presets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Hazır Şablonlar
            </button>
            <button
              type="button"
              onClick={() => setBannerMode('url')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                bannerMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Link2 className="w-3 h-3" />
              URL
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
          {bannerUrl ? (
            <div className="relative group w-full h-32 rounded-xl overflow-hidden bg-black/40 border border-slate-200">
              <img src={bannerUrl} alt="Kapak" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setBannerUrl('')}
                className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-full shadow-md transition"
                title="Kapak Fotoğrafını Kaldır"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-full h-24 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-white">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Henüz kapak fotoğrafı yüklenmedi (Varsayılan şablon kullanılır)</span>
            </div>
          )}

          {bannerMode === 'upload' && (
            <div>
              <input
                type="file"
                ref={bannerFileInputRef}
                onChange={handleBannerFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
              <div
                onClick={() => bannerFileInputRef.current?.click()}
                className="border border-dashed border-slate-300 hover:border-orange-500 bg-white rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs font-bold text-slate-700 hover:text-orange-600 shadow-xs"
              >
                <Upload className="w-4 h-4 text-orange-500" />
                <span>{bannerUrl ? 'Kapak Fotoğrafını Değiştir (Cihazdan Seç)' : 'Cihazdan Geniş Kapak Fotoğrafı Seç'}</span>
              </div>
            </div>
          )}

          {bannerMode === 'presets' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {COVER_PRESETS.map((preset) => (
                <div
                  key={preset.name}
                  onClick={() => {
                    setBannerUrl(preset.url);
                    toast.success(preset.name + ' seçildi!');
                  }}
                  className={`cursor-pointer rounded-xl overflow-hidden border-2 transition relative group ${
                    bannerUrl === preset.url ? 'border-orange-500 shadow-md' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-16 object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[10px] font-bold py-0.5 text-center truncate px-1">
                    {preset.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {bannerMode === 'url' && (
            <div>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Working Schedule Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-xs text-slate-900">Çalışma Günleri & Saatleri</h3>
          </div>
          <span className="text-xs font-bold text-orange-600 font-mono">{workingHoursDisplay}</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Haftalık Günler</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyDaysPreset('all')}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200"
                >
                  Her Gün
                </button>
                <button
                  type="button"
                  onClick={() => applyDaysPreset('weekdays')}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200"
                >
                  Hafta İçi
                </button>
                <button
                  type="button"
                  onClick={() => applyDaysPreset('mon_sat')}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200"
                >
                  Pzt - Cmt
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {ALL_DAYS.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition border text-center ${
                      isSelected
                        ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            {!is24Hours ? (
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 mb-1">Açılış</span>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 mb-1">Kapanış</span>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none font-bold"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full bg-orange-50 border border-orange-200 rounded-xl py-2 px-3 text-xs text-orange-800 font-bold mb-2 text-center">
                24 Saat Açık Hizmet (Haftanın 7 Günü)
              </div>
            )}

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '09:00 - 00:00', val: '09:00-00:00' },
                { label: '08:00 - 22:00', val: '08:00-22:00' },
                { label: '11:00 - 02:00', val: '11:00-02:00' },
                { label: '24 Saat Açık', val: '24' },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => applyPresetHours(preset.val)}
                  className="py-1 px-1 rounded-xl bg-white hover:bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200 transition truncate text-center"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Wi-Fi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Contact */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-xs text-slate-900">İletişim & Açık Adres</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Telefon Numarası
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0 (212) 000 00 00"
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Açık Adres
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="İşletme açık adresi..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Wi-Fi */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Wifi className="w-4 h-4 text-orange-500" />
                Müşteri Wi-Fi Bilgileri
              </h3>
              <p className="text-[10px] text-slate-400">QR menüde misafirlere gösterilsin mi?</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showWifi}
                onChange={(e) => setShowWifi(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          {showWifi ? (
            <div className="space-y-2.5 pt-1 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wi-Fi Ağ Adı (SSID)
                </label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="Restoran_Misafir"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wi-Fi Şifresi
                </label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Misafir1234"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
              Wi-Fi bilgisi müşteri menüsünde gizlidir.
            </div>
          )}
        </div>
      </div>

      {/* Password Change Form */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-xs text-slate-900">Yeni Şifre Belirleme</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            İşletmenizin mevcut giriş şifresini değiştirdiğinizde eski şifre sistemden silinir ve yeni belirlediğiniz şifre tek geçerli giriş şifresi olur.
          </p>
        </div>

        {passError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        {passSuccess && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-semibold">
            <Check className="w-4 h-4 shrink-0" />
            <span>Giriş şifreniz başarıyla güncellendi!</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yeni Şifre
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-900 focus:outline-none font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yeni Şifre (Tekrar)
            </label>
            <div className="relative">
              <input
                type={showConfirmPass ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Tekrar girin"
                className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-900 focus:outline-none font-bold"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={savingPass || !newPassword}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{savingPass ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Standalone Thermal Print Agent Setup Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <span>7/24 Otomatik Adisyon Yazıcı Programı (.EXE)</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Tarayıcı Kapalıyken de Basar
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Müşteri masadan sipariş verdiği an bilgisayarda tarayıcı (Chrome) açık olmasa bile termal fiş anında yazıcıdan çıkar.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
            <span className="text-orange-400 font-bold text-[11px] block">İşletme Eşleşme Kodunuz:</span>
            <div className="bg-black/40 px-3 py-2 rounded-xl text-white font-mono font-bold text-xs border border-white/10">
              {business.slug}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Programı ilk açtığınızda işletmenizi seçin veya bu kodu girin.
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5 sm:col-span-2">
            <span className="text-orange-400 font-bold text-[11px] block">Nasıl Kurulur? (Sıfır Ek Maliyet):</span>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li>Masaüstü bilgisayarınızda <strong className="text-white">RestivaAdisyonYazici.exe</strong> programını çalıştırın.</li>
              <li>Termal yazıcınızı (Epson, Xprinter, Bixolon vb.) seçip <strong className="text-emerald-400">&quot;Bağlantıyı Başlat&quot;</strong> butonuna basın.</li>
              <li>Artık QR menüden sipariş geldiğinde program sesi çalar ve fişi saniyesinde basar!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
