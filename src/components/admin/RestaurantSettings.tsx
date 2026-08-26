import React, { useState } from 'react';
import { Restaurant } from '../../types';
import { store } from '../../lib/store';
import { uploadImage } from '../../lib/supabase';
import { 
  Building2, Wifi, Save, Globe, Phone, MapPin, 
  Image, Check, RefreshCw, Palette, Shield, UploadCloud
} from 'lucide-react';

interface RestaurantSettingsProps {
  restaurant: Restaurant;
}

export const RestaurantSettings: React.FC<RestaurantSettingsProps> = ({ restaurant }) => {
  const [form, setForm] = useState<Restaurant>({ ...restaurant });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'cover_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    alert('Resim yükleniyor, lütfen bekleyin...');
    const url = await uploadImage(file);
    if (url) {
      handleChange(field, url);
      alert('Resim başarıyla yüklendi, kaydetmeyi unutmayın!');
    } else {
      alert('Yükleme başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

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
          <p className="text-sm text-slate-500 mt-0.5">Restoran bilgilerini, görünümünü ve şifrenizi düzenleyin</p>
        </div>
        <button
          onClick={handleResetDay}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-xl font-semibold text-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Günü Sıfırla
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Güvenlik (Şifre Değiştirme) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            Güvenlik & Giriş Şifresi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Kullanıcı Adı</label>
              <input
                disabled
                type="text"
                value={form.owner_username}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Yeni Şifre Belirle</label>
              <input
                type="text"
                value={form.owner_password}
                onChange={(e) => handleChange('owner_password', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm font-medium"
                placeholder="Yeni şifrenizi girin"
              />
            </div>
          </div>
        </div>

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

        {/* Branding & Media */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-purple-500" />
            Görsel Ayarları
          </h3>
          <div className="grid gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">İşletme Logosu</label>
              <div className="flex items-center gap-4">
                {form.logo_url && (
                  <img 
                    src={form.logo_url} 
                    alt="Logo önizleme" 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm bg-white"
                  />
                )}
                <div className="flex-1">
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50 rounded-xl cursor-pointer transition-colors group">
                    <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-purple-600" />
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-purple-700">Logo Seç ve Yükle</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => handleImageUpload(e, 'logo_url')}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Kapak Fotoğrafı (Menü Üstü)</label>
              <div className="flex flex-col gap-3">
                {form.cover_url && (
                  <img 
                    src={form.cover_url} 
                    alt="Kapak önizleme" 
                    className="w-full h-32 rounded-2xl object-cover border-2 border-slate-100 shadow-sm bg-white"
                  />
                )}
                <label className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50 rounded-xl cursor-pointer transition-colors group">
                  <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-purple-600" />
                  <span className="text-sm font-semibold text-slate-600 group-hover:text-purple-700">Kapak Fotoğrafı Seç ve Yükle</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={e => handleImageUpload(e, 'cover_url')}
                  />
                </label>
              </div>
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

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-600/20 active:scale-95 disabled:opacity-60"
          >
            {savedSuccess ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {savedSuccess ? 'Kaydedildi!' : saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
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
