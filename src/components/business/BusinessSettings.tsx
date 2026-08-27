import React, { useState } from 'react';
import { 
  Palette, Wifi, Phone, Lock, 
  Check, Save, KeyRound, AlertCircle, Eye, EyeOff, Image as ImageIcon, Clock, MapPin
} from 'lucide-react';
import { Business, TemplateId } from '../../types';
import { supabase, hashPassword } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface BusinessSettingsProps {
  business: Business;
  onUpdate: (updated: Business) => void;
}

export const BusinessSettings: React.FC<BusinessSettingsProps> = ({ business, onUpdate }) => {
  const toast = useToast();
  const [templateId, setTemplateId] = useState<TemplateId>(business.template_id || 'clean');
  const [logoUrl, setLogoUrl] = useState(business.logo_url || '');
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  
  // Working Hours State
  const [workingHours, setWorkingHours] = useState(business.working_hours || '09:00 - 00:00');
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

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        template_id: templateId,
        logo_url: logoUrl.trim() || null,
        phone: phone.trim(),
        address: address.trim(),
        working_hours: workingHours.trim(),
        wifi_ssid: wifiSsid.trim(),
        wifi_password: wifiPassword.trim(),
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
        toast.success('İşletme ayarları ve şablon başarıyla kaydedildi!');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111622] border border-[#1E2638] p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white">İşletme Ayarları & Görsel Tema</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Logonuzu, çalışma saatlerinizi, QR menü temanızı ve giriş şifrenizi buradan yönetebilirsiniz.
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

      {/* Logo & Identity Card */}
      <div className="bg-[#111622] border border-[#1E2638] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-xs text-white">İşletme Logosu</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0B0E14] p-4 rounded-2xl border border-[#1E2638]">
          <div className="w-16 h-16 rounded-2xl bg-[#151C2C] border border-[#212C42] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo Önizleme"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-500" />
            )}
          </div>

          <div className="flex-1 w-full space-y-1">
            <label className="block text-[11px] font-medium text-slate-300">
              Logo Görsel Bağlantısı (URL)
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://... /logo.png (Müşteri menüsünde ve panelde görünür)"
              className="w-full bg-[#111622] border border-[#1E2638] focus:border-indigo-500/60 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* 6 Luxury Themes Selector */}
      <div className="bg-[#111622] border border-[#1E2638] rounded-2xl p-5 space-y-4">
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
                    : 'border-[#1E2638] bg-[#0B0E14] hover:border-[#2C3B59]'
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

      {/* Contact & Wi-Fi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Info */}
        <div className="bg-[#111622] border border-[#1E2638] rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-xs text-white">İletişim & Çalışma Saatleri</h3>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Telefon Numarası
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0 (212) 000 00 00"
              className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center justify-between">
              <span>Çalışma Saatleri</span>
              <span className="text-[10px] text-indigo-400 font-semibold">{workingHours}</span>
            </label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="09:00 - 00:00 veya 24 Saat Açık"
              className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none mb-1.5"
            />
            {/* Quick buttons */}
            <div className="grid grid-cols-4 gap-1">
              {['09:00 - 00:00', '08:00 - 22:00', '11:00 - 02:00', '24 Saat Açık'].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setWorkingHours(h)}
                  className="py-1 px-1 rounded-lg bg-[#0B0E14] hover:bg-[#182030] text-[10px] text-slate-400 hover:text-slate-200 border border-[#1E2638] transition truncate text-center"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Adres
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="İşletme açık adresi..."
              className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Wi-Fi Info */}
        <div className="bg-[#111622] border border-[#1E2638] rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-xs text-white">Müşteri Wi-Fi Bilgileri</h3>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Wi-Fi Ağ Adı (SSID)
            </label>
            <input
              type="text"
              value={wifiSsid}
              onChange={(e) => setWifiSsid(e.target.value)}
              placeholder="Restoran_Misafir_Wifi"
              className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
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
              className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="bg-[#111622] border border-[#1E2638] rounded-2xl p-5 space-y-4">
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
                className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-100 focus:outline-none"
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
              className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
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
