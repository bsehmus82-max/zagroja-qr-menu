import React, { useState } from 'react';
import { 
  Building2, Phone, MapPin, Clock, Wifi, Layers, 
  Sparkles, CheckCircle2, ArrowRight, Shield
} from 'lucide-react';
import { Business } from '../../types';
import { supabase } from '../../lib/supabase';
import { DEFAULT_CATEGORIES } from '../../data/defaultCatalog';
import { useToast } from '../../context/ToastContext';

interface BusinessOnboardingProps {
  business: Business;
  onComplete: (updated: Business) => void;
}

export const BusinessOnboarding: React.FC<BusinessOnboardingProps> = ({
  business,
  onComplete,
}) => {
  const toast = useToast();
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  const [workingHours, setWorkingHours] = useState(business.working_hours || '09:00 - 00:00');
  const [wifiSsid, setWifiSsid] = useState(business.wifi_ssid || '');
  const [wifiPassword, setWifiPassword] = useState(business.wifi_password || '');
  const [tableCount, setTableCount] = useState<number>(10);
  const [loadDefaultMenu, setLoadDefaultMenu] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Update Business Settings
      const { data: updatedBiz, error: bizError } = await supabase
        .from('businesses')
        .update({
          phone: phone.trim(),
          address: address.trim(),
          working_hours: workingHours.trim(),
          wifi_ssid: wifiSsid.trim(),
          wifi_password: wifiPassword.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)
        .select()
        .single();

      if (bizError) throw bizError;

      // 2. Generate Initial Tables
      if (tableCount > 0) {
        const tableRows = [];
        for (let i = 1; i <= tableCount; i++) {
          tableRows.push({
            business_id: business.id,
            table_no: `Masa ${i}`,
            qr_token: `tok_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            is_occupied: false,
          });
        }
        await supabase.from('tables').insert(tableRows);
      }

      // 3. Load Rich Default Catalog if checked
      if (loadDefaultMenu) {
        for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
          const catTemplate = DEFAULT_CATEGORIES[i];
          const { data: catData, error: catError } = await supabase
            .from('categories')
            .insert([
              {
                business_id: business.id,
                name: catTemplate.name,
                image_url: catTemplate.image_url,
                order_index: i,
                is_active: true,
              },
            ])
            .select()
            .single();

          if (!catError && catData) {
            const prodsToInsert = catTemplate.products.map((p, pIdx) => ({
              business_id: business.id,
              category_id: catData.id,
              name: p.name,
              description: p.description,
              price: p.price,
              is_frozen: false,
              is_active: true,
              order_index: pIdx,
            }));

            await supabase.from('products').insert(prodsToInsert);
          }
        }
      }

      toast.success('İşletme kurulumunuz tamamlandı! Yönetim paneline hoş geldiniz.');
      onComplete(updatedBiz as Business);
    } catch {
      toast.error('Kurulum kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B10] flex items-center justify-center p-4 selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="w-full max-w-2xl bg-[#111622] border border-[#1E2638] rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">İşletme Kurulum Sihirbazı</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {business.name} için temel bilgileri girerek sisteminizi 1 dakikada hazır hale getirin.
          </p>
        </div>

        <form onSubmit={handleFinishOnboarding} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-400" />
                İşletme Telefonu
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0 (212) 000 00 00"
                className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>

            {/* Working Hours */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Çalışma Saatleri
              </label>
              <input
                type="text"
                required
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                placeholder="09:00 - 00:00"
                className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              Açık Adres
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Mahalle, Cadde, No, İlçe / Şehir"
              className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Wi-Fi SSID */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                Müşteri Wi-Fi Adı (İsteğe Bağlı)
              </label>
              <input
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="Restoran_Guest_Wifi"
                className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>

            {/* Wi-Fi Password */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Wi-Fi Şifresi
              </label>
              <input
                type="text"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="Misafir1234"
                className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Table Count */}
          <div className="p-4 bg-[#0B0E14] border border-[#1E2638] rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-white">Başlangıç Masa Sayısı</h3>
                <p className="text-[10px] text-slate-400">Masalarınız ve QR kodlarınız otomatik üretilir</p>
              </div>
            </div>
            <input
              type="number"
              min={0}
              max={business.table_limit || 100}
              value={tableCount}
              onChange={(e) => setTableCount(Number(e.target.value))}
              className="w-20 bg-[#111622] border border-[#1E2638] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-white font-bold text-center focus:outline-none"
            />
          </div>

          {/* Load Default Catalog Checkbox */}
          <label className="p-4 bg-[#0B0E14] border border-[#1E2638] rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:border-indigo-500/30 transition">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-white">Hazır Zengin Menü Kataloğunu Yükle</h3>
                <p className="text-[10px] text-slate-400">Kahvaltı, Kahve, Burger, Pizza, Izgara ve Tatlı kategorileri hazır gelsin</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={loadDefaultMenu}
              onChange={(e) => setLoadDefaultMenu(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-[#111622] border-[#1E2638]"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <span>{loading ? 'Kurulum Tamamlanıyor...' : 'Kurulumu Tamamla ve Panele Geç'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
