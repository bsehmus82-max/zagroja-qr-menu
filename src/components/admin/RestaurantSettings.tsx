import React, { useState } from 'react';
import { Restaurant } from '../../types';
import { store } from '../../lib/store';
import { 
  Building2, Wifi, Save, Globe, Phone, MapPin, 
  Image, Check, RefreshCw, Palette
} from 'lucide-react';

interface RestaurantSettingsProps {
  restaurant: Restaurant;
}

export const RestaurantSettings: React.FC<RestaurantSettingsProps> = ({ restaurant }) => {
  const [form, setForm] = useState<Restaurant>({ ...restaurant });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await store.updateRestaurant(restaurant.id, form);
    setSavedSuccess(true);
    setSaving(false);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleChange = (field: keyof Restaurant, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleResetDay = () => {
    if (confirm('Tüm siparişler ve servis çağrıları temizlenecek. Günü sıfırlamak istediğinize emin misiniz?')) {
      store.resetDay();
      alert('Gün başarıyla sıfırlandı.');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-500" />
            İşletme Ayarları
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Restoran bilgilerini ve görünümünü düzenleyin</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
        >
          {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {savedSuccess ? 'Kaydedildi!' : saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">

        {/* Basic Info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            Temel Bilgiler
          </h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">İşletme Adı *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Restoran veya kafe adı"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
              <textarea
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Kısa işletme açıklaması..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Telefon
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="+90 (5xx) xxx xx xx"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Adres
              </label>
              <input
                type="text"
                value={form.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder="İşletme adresi"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Visuals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Image className="w-4 h-4 text-purple-500" />
            Görsel Ayarlar
          </h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
              <input
                type="url"
                value={form.logo_url}
                onChange={e => handleChange('logo_url', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
              />
              {form.logo_url && (
                <div className="mt-2 flex items-center gap-3">
                  <img 
                    src={form.logo_url} 
                    alt="Logo önizleme" 
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <span className="text-xs text-slate-500">Logo önizleme</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kapak Fotoğrafı URL</label>
              <input
                type="url"
                value={form.cover_url}
                onChange={e => handleChange('cover_url', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
              />
              {form.cover_url && (
                <div className="mt-2">
                  <img 
                    src={form.cover_url} 
                    alt="Kapak önizleme" 
                    className="w-full h-24 rounded-xl object-cover border border-slate-200"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wifi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-500" />
            Wi-Fi Bilgileri
          </h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Wi-Fi Adı (SSID)</label>
              <input
                type="text"
                value={form.wifi_name}
                onChange={e => handleChange('wifi_name', e.target.value)}
                placeholder="Misafir Wi-Fi adı"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Wi-Fi Şifresi</label>
              <input
                type="text"
                value={form.wifi_password}
                onChange={e => handleChange('wifi_password', e.target.value)}
                placeholder="Wi-Fi şifresi (opsiyonel)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Currency */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-yellow-500" />
            Para Birimi
          </h3>
          <select
            value={form.currency}
            onChange={e => handleChange('currency', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
          >
            <option value="₺">₺ — Türk Lirası</option>
            <option value="$">$ — Amerikan Doları</option>
            <option value="€">€ — Euro</option>
            <option value="£">£ — İngiliz Sterlini</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {savedSuccess ? 'Kaydedildi!' : saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </form>

      {/* Danger Zone */}
      <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs">
        <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Tehlikeli Alan
        </h3>
        <p className="text-sm text-slate-600 mb-3">
          Bugünkü tüm sipariş ve servis çağrılarını sıfırlar. Bu işlem geri alınamaz.
        </p>
        <button
          onClick={handleResetDay}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Günü Sıfırla
        </button>
      </div>
    </div>
  );
};
