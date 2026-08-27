import React, { useState } from 'react';
import { 
  Store, Phone, MapPin, Clock, Wifi, Palette, 
  Check, Save, Sparkles, LayoutTemplate
} from 'lucide-react';
import { Business, TemplateId } from '../../types';
import { supabase } from '../../lib/supabase';

interface BusinessSettingsProps {
  business: Business;
  onUpdated: (updated: Business) => void;
}

const TEMPLATES: { id: TemplateId; name: string; desc: string; previewClass: string }[] = [
  {
    id: 'clean',
    name: 'Sade & Klasik (Varsayýlan)',
    desc: 'Hýzlý, minimalist ve göz yormayan ferah arayüz.',
    previewClass: 'bg-neutral-900 border-neutral-700 text-white',
  },
  {
    id: 'dark_luxury',
    name: 'Modern Dark Luxury',
    desc: 'Asil siyah, altýn sarýsý ve mor ýþýk vurgularý.',
    previewClass: 'bg-black border-amber-500/40 text-amber-300',
  },
  {
    id: 'nordic',
    name: 'Nordic Light',
    desc: 'Ýskandinav tarzý aydýnlýk, ferah ve temiz hatlar.',
    previewClass: 'bg-slate-100 border-slate-300 text-slate-900',
  },
  {
    id: 'bistro',
    name: 'Warm Bistro & Artisan',
    desc: 'Sýcak kahve, fýrýn ve ahþap dokulu nostaljik renkler.',
    previewClass: 'bg-stone-900 border-amber-700/50 text-amber-200',
  },
  {
    id: 'neon',
    name: 'Neon Night Vibes',
    desc: 'Gece mekanlarý, kokteyl barlar ve canlý neon detaylar.',
    previewClass: 'bg-neutral-950 border-purple-500 text-purple-300',
  },
  {
    id: 'vintage',
    name: 'Classic Elegant Vintage',
    desc: 'Geleneksel lüks restoran ve fine-dining tipografisi.',
    previewClass: 'bg-zinc-900 border-emerald-500/40 text-emerald-300',
  },
];

export const BusinessSettings: React.FC<BusinessSettingsProps> = ({ business, onUpdated }) => {
  const [name, setName] = useState(business.name);
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  const [workingHours, setWorkingHours] = useState(business.working_hours || '09:00 - 00:00');
  const [wifiSSID, setWifiSSID] = useState(business.wifi_ssid || '');
  const [wifiPassword, setWifiPassword] = useState(business.wifi_password || '');
  const [templateId, setTemplateId] = useState<TemplateId>(business.template_id || 'clean');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
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
        onUpdated(data as Business);
        alert('Ýþletme ayarlarý ve QR Menü þablonu baþarýyla kaydedildi!');
      } else {
        alert('Ayarlar kaydedilemedi.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Ýþletme Ayarlarý & Þablon Seçimi</h2>
        <p className="text-xs text-neutral-400">
          Ýþletme iletiþim bilgilerinizi, Wi-Fi þifrenizi ve müþterilerinizin göreceði QR menü þablonunu belirleyin.
        </p>
      </div>

      {/* 6 Templates Selector */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <LayoutTemplate className="w-4 h-4 text-brand-400" />
          <span>6 Farklý QR Menü Arayüz Þablonu</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEMPLATES.map((tmpl) => {
            const isSelected = templateId === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => setTemplateId(tmpl.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-brand-600/10 border-brand-500 ring-2 ring-brand-500/20'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-white">{tmpl.name}</span>
                    {isSelected && (
                      <span className="p-1 rounded-lg bg-brand-600 text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400">{tmpl.desc}</p>
                </div>

                <div className={`mt-4 p-2 rounded-xl border text-[10px] font-mono text-center ${tmpl.previewClass}`}>
                  Menü Önizleme Stili
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Business Info Form */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-sm text-white mb-2">Genel Bilgiler</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Ýþletme Adý
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
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
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
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

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Ýþletme Adresi
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adres bilgisi"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-neutral-800">
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
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-8 py-3.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Kaydediliyor...' : 'Deðiþiklikleri Kaydet'}
        </button>
      </div>
    </form>
  );
};
