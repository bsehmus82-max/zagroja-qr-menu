import React, { useState } from 'react';
import { Restaurant } from '../../types';
import { store } from '../../lib/store';
import { updateSupabaseCredentials, isSupabaseConfigured } from '../../lib/supabase';
import { 
  Building2, 
  Wifi, 
  Database, 
  Save, 
  RotateCcw, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Globe
} from 'lucide-react';

interface RestaurantSettingsProps {
  restaurant: Restaurant;
}

export const RestaurantSettings: React.FC<RestaurantSettingsProps> = ({ restaurant }) => {
  const [form, setForm] = useState<Restaurant>({ ...restaurant });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Supabase Credentials State
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('qr_supabase_url') || ''
  );
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(
    localStorage.getItem('qr_supabase_anon_key') || ''
  );
  const [isDbConnected, setIsDbConnected] = useState(isSupabaseConfigured());
  const [sqlCopied, setSqlCopied] = useState(false);

  const handleSaveRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateRestaurant(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    setIsDbConnected(isSupabaseConfigured());
    alert('Supabase bağlantı ayarları güncellendi!');
  };

  const handleCopySQL = () => {
    const sqlContent = `-- Supabase SQL Şeması\n-- Proje içerisindeki supabase_schema.sql dosyasını kullanabilirsiniz.`;
    navigator.clipboard.writeText(sqlContent);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const handleResetSample = () => {
    if (confirm('Tüm ürünleri, masaları ve menü verilerini varsayılan gurme menüye sıfırlamak istediğinize emin misiniz?')) {
      store.resetAllToSample();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-500" />
            <span>İşletme ve Sistem Ayarları</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Restoran bilgilerinizi, Wi-Fi ağ şifresini ve Supabase veritabanı entegrasyonunu yönetin.
          </p>
        </div>

        {savedSuccess && (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600" /> Ayarlar Kaydedildi!
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Restaurant & Wi-Fi Profile */}
        <form onSubmit={handleSaveRestaurant} className="lg:col-span-2 space-y-5">
          {/* General Information */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-orange-500" />
              <span>Restoran Temel Bilgileri</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İşletme / Restoran Adı *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Para Birimi
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value as '₺' | '$' | '€' | '£' })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white font-bold"
                >
                  <option value="₺">Türk Lirası (₺)</option>
                  <option value="$">Dolar ($)</option>
                  <option value="€">Euro (€)</option>
                  <option value="£">Sterlin (£)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Slogan / Karşılama Açıklaması
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İletişim Telefonu
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adres
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Logo Görsel URL
                </label>
                <input
                  type="url"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kapak Banner Görsel URL
                </label>
                <input
                  type="url"
                  value={form.cover_url}
                  onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Wi-Fi Settings Section */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Wifi className="w-4 h-4 text-sky-500" />
              <span>Müşteri Wi-Fi Ağ Ayarları (QR Menüde Gösterilen)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wi-Fi Ağ Adı (SSID) *
                </label>
                <input
                  type="text"
                  required
                  value={form.wifi_ssid}
                  onChange={(e) => setForm({ ...form, wifi_ssid: e.target.value })}
                  placeholder="Örn: Gusto_Guest_5G"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wi-Fi Şifresi *
                </label>
                <input
                  type="text"
                  required
                  value={form.wifi_password}
                  onChange={(e) => setForm({ ...form, wifi_password: e.target.value })}
                  placeholder="Örn: GustoLezzet2026"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none font-mono text-orange-600 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Restoran ve Wi-Fi Ayarlarını Kaydet</span>
            </button>
          </div>
        </form>

        {/* Right Col: Supabase Cloud Integration */}
        <div className="space-y-5">
          {/* Supabase Connection Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <span>Supabase Bulut Entegrasyonu</span>
              </h3>
              {isDbConnected ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Bağlı
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Demo Modu (Yerel)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Supabase bilgilerinizi girerek gerçek zamanlı PostgreSQL veritabanını aktif hale getirebilirsiniz. Bilgi girilmediğinde sistem sıfır hata ile yerel modda çalışır.
            </p>

            <form onSubmit={handleSaveSupabase} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Project URL
                </label>
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Anon Public API Key
                </label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 font-mono text-[11px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Supabase Bağlantısını Güncelle</span>
              </button>
            </form>

            {/* SQL Template Link */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[11px] text-slate-500 mb-2">
                Proje ana dizininde yer alan <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-orange-600">supabase_schema.sql</code> dosyasını Supabase SQL editöründe çalıştırarak tabloları ve örnek menüyü saniyeler içinde oluşturabilirsiniz.
              </p>
            </div>
          </div>

          {/* Factory Reset Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
            <h4 className="text-xs font-bold text-slate-800">Örnek Verileri Sıfırla</h4>
            <p className="text-[11px] text-slate-500">
              Tüm ürün, masa ve ayarları hazır şablon gurme menüye geri döndürür.
            </p>
            <button
              onClick={handleResetSample}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Varsayılan Verilere Sıfırla</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
