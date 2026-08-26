import React, { useState } from 'react';
import { Restaurant } from '../../types';
import { store } from '../../lib/store';
import { uploadImage } from '../../lib/supabase';
import { showToast } from '../../lib/toast';
import { Building2, Image as ImageIcon, MapPin, CheckCircle2, UploadCloud, Loader2 } from 'lucide-react';

export const SetupWizard = ({ restaurant, onComplete }: { restaurant: Restaurant, onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: restaurant.name || '',
    logo_url: restaurant.logo_url || '',
    cover_url: restaurant.cover_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    phone: restaurant.phone || '',
    address: restaurant.address || '',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadImage(file);
    setUploading(false);
    if (result.url) {
      setForm(prev => ({...prev, logo_url: result.url!}));
    }
    // error is already logged by uploadImage
  };

  const handleComplete = async () => {
    setLoading(true);
    await store.completeSetup(restaurant.id, form);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-orange-500 p-8 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Hoş Geldiniz!</h1>
          <p className="text-orange-100 text-sm">Dijital menünüzü kullanmaya başlamak için birkaç temel bilgiyi doldurmanız gerekiyor.</p>
        </div>

        <div className="p-8">
          {/* Progress */}
          <div className="flex justify-between mb-8 relative">
            <div className="absolute top-1/2 -mt-[1px] w-full h-[2px] bg-slate-100 z-0" />
            {[1, 2, 3].map(i => (
              <div key={i} className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step >= i ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {i}
              </div>
            ))}
          </div>

          {/* Steps */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 mb-6 text-slate-800 font-semibold">
                <Building2 className="w-5 h-5 text-orange-500" /> 1. İşletme Adı
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mekanınızın Adı *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="İşletme Adı"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
                />
                <p className="text-xs text-slate-500 mt-2">Müşterileriniz QR kodu okuttuğunda bu ismi görecekler.</p>
              </div>
              <button 
                onClick={() => form.name.trim() ? setStep(2) : showToast('Lütfen işletme adını girin.', 'warning')}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold mt-6"
              >
                Devam Et
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 mb-6 text-slate-800 font-semibold">
                <ImageIcon className="w-5 h-5 text-purple-500" /> 2. Görseller
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İşletme Logosu *</label>
                <div className="flex flex-col gap-4 mt-2">
                  {form.logo_url && (
                    <img 
                      src={form.logo_url} 
                      alt="Logo" 
                      className="w-24 h-24 rounded-2xl object-cover border border-slate-200"
                    />
                  )}
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-slate-600 font-medium ${uploading ? 'border-orange-400 bg-orange-50' : 'border-slate-300 hover:border-purple-500'}`}>
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                        <span className="text-orange-600">Yükleniyor...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5 text-purple-500" />
                        {form.logo_url ? 'Farklı Logo Seç' : 'Logo Seç ve Yükle'}
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Geri</button>
                <button 
                  onClick={() => form.logo_url.trim() ? setStep(3) : showToast('Lütfen logo yükleyin.', 'warning')}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold"
                >
                  Devam Et
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 mb-6 text-slate-800 font-semibold">
                <MapPin className="w-5 h-5 text-blue-500" /> 3. İletişim (Opsiyonel)
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="05xx..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
                <textarea
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Geri</button>
                <button 
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {loading ? 'Kuruluyor...' : <><CheckCircle2 className="w-5 h-5" /> Kurulumu Tamamla</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
