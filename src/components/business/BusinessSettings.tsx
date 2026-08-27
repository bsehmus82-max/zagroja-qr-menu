import React, { useState } from 'react';
import { 
  Settings, Palette, Wifi, Clock, Phone, MapPin, 
  Check, Save, Sparkles, AlertCircle
} from 'lucide-react';
import { Business, TemplateId } from '../../types';
import { supabase } from '../../lib/supabase';

interface BusinessSettingsProps {
  business: Business;
  onUpdate: (updated: Business) => void;
}

export const BusinessSettings: React.FC<BusinessSettingsProps> = ({ business, onUpdate }) => {
  const [templateId, setTemplateId] = useState<TemplateId>(business.template_id || 'clean');
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  const [workingHours, setWorkingHours] = useState(business.working_hours || '');
  const [wifiSsid, setWifiSsid] = useState(business.wifi_ssid || '');
  const [wifiPassword, setWifiPassword] = useState(business.wifi_password || '');

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        template_id: templateId,
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
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111622] border border-[#1E2638] p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white">İşletme Ayarları & Görsel Tema</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Müşterilerinizin göreceği QR menü şablonunu ve restoran bilgilerinizi güncelleyin.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
        >
          {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{savedSuccess ? 'Kaydedildi' : saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
        </button>
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

      {/* Contact & Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Info */}
        <div className="bg-[#111622] border border-[#1E2638] rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-xs text-white">İletişim & Adres</h3>
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

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Çalışma Saatleri
            </label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="08:00 - 00:00"
              className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
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
    </form>
  );
};
