import React, { useState } from 'react';
import { 
  Palette, Phone, MapPin, Clock, Wifi, Lock, 
  Sparkles, Check, Save, AlertCircle 
} from 'lucide-react';
import { Business, TemplateId } from '../../types';
import { supabase, hashPassword } from '../../lib/supabase';

interface BusinessSettingsProps {
  business: Business;
  onUpdate: (updated: Business) => void;
}

export const BusinessSettings: React.FC<BusinessSettingsProps> = ({
  business,
  onUpdate,
}) => {
  const [name, setName] = useState(business.name);
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  const [workingHours, setWorkingHours] = useState(business.working_hours || '09:00 - 00:00');
  const [wifiSSID, setWifiSSID] = useState(business.wifi_ssid || '');
  const [wifiPassword, setWifiPassword] = useState(business.wifi_password || '');
  const [templateId, setTemplateId] = useState<TemplateId>(business.template_id);

  // Change password
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const templates: { id: TemplateId; name: string; desc: string; bg: string }[] = [
    { id: 'clean', name: '1. Sade & Klasik', desc: 'Varsayılan temiz ve hızlı tasarım', bg: 'bg-neutral-900' },
    { id: 'dark_luxury', name: '2. Dark Luxury', desc: 'Siyah ve altın lüks restoran teması', bg: 'bg-black border-amber-500/40' },
    { id: 'nordic', name: '3. Nordic Light', desc: 'Ferah İskandinav kafe konsepti', bg: 'bg-slate-800' },
    { id: 'bistro', name: '4. Warm Bistro', desc: 'Sıcak ahşap & bistro tonları', bg: 'bg-stone-900' },
    { id: 'neon', name: '5. Neon Vibes', desc: 'Gece kulübü ve pub neon renkleri', bg: 'bg-neutral-950 border-purple-500/40' },
    { id: 'vintage', name: '6. Elegant Vintage', desc: 'Zarif retro ve klasik stil', bg: 'bg-zinc-900' },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .update({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          working_hours: workingHours.trim(),
          wifi_ssid: wifiSSID.trim(),
          wifi_password: wifiPassword.trim(),
          template_id: templateId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)
        .select()
        .single();

      if (!error && data) {
        onUpdate(data as Business);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass !== confirmPass) {
      alert('Şifreler eşleşmiyor.');
      return;
    }

    const hash = await hashPassword(newPass);
    const { error } = await supabase
      .from('businesses')
      .update({ password_hash: hash, updated_at: new Date().toISOString() })
      .eq('id', business.id);

    if (!error) {
      setPassSuccess(true);
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setPassSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* 6 Template Selector */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">QR Menü Arayüz Şablonu</h3>
            <p className="text-xs text-neutral-400">
              Müşterilerinizin masada QR okuttuğunda göreceği 6 farklı tasarım seçeneği
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {templates.map((tpl) => {
            const isSelected = templateId === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setTemplateId(tpl.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between h-28 ${tpl.bg} ${
                  isSelected
                    ? 'ring-2 ring-brand-500 border-brand-500 shadow-lg'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-xs text-white">{tpl.name}</h4>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400">{tpl.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile & Info Form */}
      <form onSubmit={handleSaveProfile} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6">
        <h3 className="font-bold text-base text-white">İşletme & İletişim Bilgileri</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              İşletme Adı
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Telefon Numarası
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0 (5xx) xxx xx xx"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Çalışma Saatleri
            </label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="09:00 - 00:00"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Açık Adres
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adres bilgisi"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Müşteri Wi-Fi Adı (SSID)
            </label>
            <input
              type="text"
              value={wifiSSID}
              onChange={(e) => setWifiSSID(e.target.value)}
              placeholder="Wi-Fi Adı"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Müşteri Wi-Fi Şifresi
            </label>
            <input
              type="text"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              placeholder="Wi-Fi Şifresi"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Kaydediliyor...' : saved ? 'Değişiklikler Kaydedildi!' : 'Ayarları Kaydet'}
          </button>
        </div>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handleChangePassword} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-400" />
          Şifre Değiştir
        </h3>

        {passSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs">
            Giriş şifreniz başarıyla güncellendi!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Yeni Şifre</label>
            <input
              type="password"
              required
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Yeni Şifre Tekrar</label>
            <input
              type="password"
              required
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition border border-neutral-700"
          >
            Şifreyi Güncelle
          </button>
        </div>
      </form>
    </div>
  );
};
