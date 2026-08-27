import React, { useState, useRef, useEffect } from 'react';
import { 
  Palette, Wifi, Lock, Check, Save, KeyRound, 
  AlertCircle, Eye, EyeOff, Upload, Link2, Trash2, 
  Camera, Calendar
} from 'lucide-react';
import { Business, TemplateId } from '../../types';
import { supabase, hashPassword } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface BusinessSettingsProps {
  business: Business;
  onUpdate: (updated: Business) => void;
}

const ALL_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const BusinessSettings: React.FC<BusinessSettingsProps> = ({ business, onUpdate }) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [templateId, setTemplateId] = useState<TemplateId>(business.template_id || 'clean');
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');
  const [logoUrl, setLogoUrl] = useState(business.logo_url || '');
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
  const [showWifi, setShowWifi] = useState<boolean>(business.show_wifi ?? true);
  const [wifiSsid, setWifiSsid] = useState(business.wifi_ssid || '');
  const [wifiPassword, setWifiPassword] = useState(business.wifi_password || '');

  // Password Change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
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

  const workingHoursDisplay = `${getDaysSummary()}: ${is24Hours ? '24 Saat Açık' : `${openTime} - ${closeTime}`}`;

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

  const templates: { id: TemplateId; name: string; desc: string; accentColor: string; bgTone: string }[] = [
    {
      id: 'clean',
      name: 'Swiss Minimalist',
      desc: 'Sade antrasit slate ve elektrik indigo vurgusu.',
      accentColor: 'bg-indigo-500',
      bgTone: 'bg-[#080B10]',
    },
    {
      id: 'dark_luxury',
      name: 'Michelin Velvet & Gold',
      desc: 'Derin siyah kadife ve şampanya altın detayları.',
      accentColor: 'bg-[#D4AF37]',
      bgTone: 'bg-[#040404]',
    },
    {
      id: 'nordic',
      name: 'Nordic Forest & Mint',
      desc: 'İskandinav dinginliği, zümrüt ve taze nane tonları.',
      accentColor: 'bg-emerald-500',
      bgTone: 'bg-[#090E17]',
    },
    {
      id: 'bistro',
      name: 'Parisian Bistro & Espresso',
      desc: 'Sıcak espresso kahve ve terakota deri tonları.',
      accentColor: 'bg-amber-500',
      bgTone: 'bg-[#0E0B09]',
    },
    {
      id: 'neon',
      name: 'Midnight Cyber Lounge',
      desc: 'Gece kulübü ve modern lounge için neon ciyan ve fuşya.',
      accentColor: 'bg-gradient-to-r from-cyan-400 to-fuchsia-500',
      bgTone: 'bg-[#070814]',
    },
    {
      id: 'vintage',
      name: 'Classic Heritage & Brass',
      desc: 'İngiliz kraliyet yeşili ve antik pirinç dokunuşları.',
      accentColor: 'bg-[#C5A059]',
      bgTone: 'bg-[#050E09]',
    },
  ];

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

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        template_id: templateId,
        logo_url: logoUrl.trim() || null,
        phone: phone.trim(),
        address: address.trim(),
        working_hours: workingHoursDisplay,
        wifi_ssid: showWifi ? wifiSsid.trim() : '',
        wifi_password: showWifi ? wifiPassword.trim() : '',
        show_wifi: showWifi,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('businesses')
        .update(payload)
        .eq('id', business.id)
        .select()
        .single();

      if (!error && data) {
        onUpdate(data as Business);
        setSavedSuccess(true);
        toast.success('İşletme ayarları başarıyla kaydedildi!');
        setTimeout(() => setSavedSuccess(false), 2500);
      } else {
        toast.error('Ayarlar kaydedilirken bir hata oluştu.');
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
      setPassError('Yeni şifreniz en az 6 karakter olmalıdır.');
      toast.warning('Yeni şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      toast.error('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
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
        onUpdate(data as Business);
        setPassSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Giriş şifreniz kalıcı olarak güncellendi!');
        setTimeout(() => setPassSuccess(false), 3000);
      }
    } catch {
      setPassError('Şifre güncellenirken bir hata oluştu.');
      toast.error('Şifre güncellenirken bir hata oluştu.');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111622] border border-white/[0.08] p-4 sm:p-5 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white">İşletme Ayarları & Görsel Tema</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Logonuzu, çalışma saatlerinizi, Wi-Fi görünürlüğünü, temanızı ve şifrenizi buradan yönetebilirsiniz.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveGeneral}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
        >
          {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{savedSuccess ? 'Kaydedildi' : saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
        </button>
      </div>

      {/* Dual Logo Field: Frameless, Pure Logo */}
      <div className="bg-[#111622] border border-white/[0.08] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">İşletme Logosu</span>

          <div className="flex items-center gap-1 bg-[#090C12] p-1 rounded-xl border border-white/[0.08]">
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

        <div className="flex items-center gap-4 bg-[#090C12] p-4 rounded-2xl border border-white/[0.06]">
          {logoUrl ? (
            <div className="relative group shrink-0">
              <img
                src={logoUrl}
                alt="Logo"
                className="w-16 h-16 object-contain rounded-xl"
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
            <div className="w-14 h-14 flex items-center justify-center text-slate-500 shrink-0">
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
                className="border border-dashed border-white/[0.12] hover:border-indigo-500/60 bg-[#121724] rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs text-slate-300 hover:text-white"
              >
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>{logoUrl ? 'Yeni Fotoğraf Seç / Değiştir' : 'Cihazdan Fotoğraf Seç'}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://... /logo.png"
                className="w-full bg-[#121724] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>
          )}
        </div>
      </div>

      {/* Working Schedule Card: Days & Hours */}
      <div className="bg-[#111622] border border-white/[0.08] rounded-2xl p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-xs text-white">Çalışma Günleri & Saatleri</h3>
          </div>
          <span className="text-[11px] font-bold text-indigo-400 font-mono">{workingHoursDisplay}</span>
        </div>

        <div className="bg-[#090C12] p-4 rounded-2xl border border-white/[0.06] space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-300">Haftalık Çalışma Günleri</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyDaysPreset('all')}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-[#121724] hover:bg-white/5 text-slate-300 border border-white/[0.08]"
                >
                  Her Gün
                </button>
                <button
                  type="button"
                  onClick={() => applyDaysPreset('weekdays')}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-[#121724] hover:bg-white/5 text-slate-300 border border-white/[0.08]"
                >
                  Hafta İçi
                </button>
                <button
                  type="button"
                  onClick={() => applyDaysPreset('mon_sat')}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-[#121724] hover:bg-white/5 text-slate-300 border border-white/[0.08]"
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
                    className={`py-2 rounded-xl text-xs font-semibold transition border text-center ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-[#121724] border-white/[0.06] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            {!is24Hours ? (
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <span className="block text-[10px] text-slate-400 mb-1">Açılış Saati</span>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full bg-[#121724] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 mb-1">Kapanış Saati</span>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full bg-[#121724] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full bg-indigo-600/10 border border-indigo-500/25 rounded-xl py-2 px-3 text-xs text-indigo-300 font-semibold mb-2 text-center">
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
                  className="py-1.5 px-1 rounded-xl bg-[#121724] hover:bg-white/5 text-[10px] text-slate-400 hover:text-slate-200 border border-white/[0.06] transition truncate text-center"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Wi-Fi & Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Info */}
        <div className="bg-[#111622] border border-white/[0.08] rounded-2xl p-5 space-y-3.5">
          <h3 className="font-bold text-xs text-white">İletişim & Açık Adres</h3>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Telefon Numarası
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0 (212) 000 00 00"
              className="w-full bg-[#090C12] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Açık Adres
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="İşletme açık adresi..."
              className="w-full bg-[#090C12] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Wi-Fi Info with Toggle */}
        <div className="bg-[#111622] border border-white/[0.08] rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-indigo-400" />
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
              <div className="w-10 h-5 bg-[#090C12] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 peer-checked:after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 border border-white/[0.08]"></div>
            </label>
          </div>

          {showWifi ? (
            <div className="space-y-3 pt-1 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Wi-Fi Ağ Adı (SSID)
                </label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="Restoran_Misafir"
                  className="w-full bg-[#090C12] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Wi-Fi Şifresi
                </label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Misafir1234"
                  className="w-full bg-[#090C12] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#090C12] rounded-xl border border-white/[0.06] text-center text-xs text-slate-500">
              Wi-Fi bilgisi müşteri QR menüsünde gizlenmiştir.
            </div>
          )}
        </div>
      </div>

      {/* 6 Luxury Themes Selector */}
      <div className="bg-[#111622] border border-white/[0.08] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-xs text-white">QR Menü Görsel Şablonu (6 Seçenek)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {templates.map((tpl) => {
            const isSelected = templateId === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setTemplateId(tpl.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 bg-[#151C2C] ring-2 ring-indigo-500/20 shadow-lg'
                    : 'border-white/[0.08] bg-[#090C12] hover:border-white/[0.16]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-white">{tpl.name}</span>
                    <div className={`w-3.5 h-3.5 rounded-full ${tpl.accentColor}`} />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    {tpl.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400">
                  <span>{tpl.id}</span>
                  {isSelected ? (
                    <span className="font-bold text-indigo-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Seçildi
                    </span>
                  ) : (
                    <span className="hover:text-white">Seç</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Password Change Form */}
      <div className="bg-[#111622] border border-white/[0.08] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <div>
              <h3 className="font-bold text-xs text-white">Kalıcı Giriş Şifresi Belirle</h3>
              <p className="text-[11px] text-slate-400">
                Geçici şifrenizi istediğiniz zaman kendi belirlediğiniz kalıcı şifreyle değiştirebilirsiniz.
              </p>
            </div>
          </div>
        </div>

        {passError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        {passSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400 text-xs">
            <Check className="w-4 h-4 shrink-0" />
            <span>Giriş şifreniz başarıyla güncellendi! Bir sonraki girişinizde bu şifreyi kullanabilirsiniz.</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Yeni Şifre
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full bg-[#090C12] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Yeni Şifre Tekrar
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Şifreyi tekrar giriniz"
              className="w-full bg-[#090C12] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={savingPass || !newPassword}
              className="w-full py-2 bg-[#182030] hover:bg-indigo-600 text-slate-200 hover:text-white font-semibold rounded-xl text-xs border border-[#25324A] hover:border-indigo-500 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{savingPass ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
