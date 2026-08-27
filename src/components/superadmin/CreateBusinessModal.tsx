import React, { useState } from 'react';
import { 
  X, Building2, Layers, Calendar, Plus, AlertCircle, 
  CreditCard, Sparkles, Check, DollarSign, Sliders
} from 'lucide-react';
import { supabase, slugify, generateTempPassword, hashPassword } from '../../lib/supabase';
import { Business, PlanType, BillingPeriod } from '../../types';
import { DEFAULT_CATEGORIES } from '../../data/defaultCatalog';

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (info: { business: Business; tempPass: string; days: number }) => void;
}

interface PlanPreset {
  id: PlanType;
  billingPeriod: BillingPeriod;
  name: string;
  badge: string;
  days: number;
  price: number;
  tableLimit: number | null;
  description: string;
}

const PLAN_PRESETS: PlanPreset[] = [
  {
    id: 'trial',
    billingPeriod: 'trial',
    name: '7 Günlük Deneme',
    badge: '0 TL',
    days: 7,
    price: 0,
    tableLimit: 20,
    description: 'Ücretsiz test & tanıtım modu (7 Gün, 20 Masa)',
  },
  {
    id: 'lite',
    billingPeriod: 'monthly',
    name: 'Lite (Aylık)',
    badge: '450 TL / Ay',
    days: 30,
    price: 450,
    tableLimit: 15,
    description: 'Akıllı QR Menü & Çoklu Dil (15 Masa)',
  },
  {
    id: 'lite',
    billingPeriod: 'annual',
    name: 'Lite (Yıllık)',
    badge: '3.900 TL / Yıl',
    days: 365,
    price: 3900,
    tableLimit: 15,
    description: 'Yıllık Peşin Lite QR Menü (15 Masa)',
  },
  {
    id: 'standard',
    billingPeriod: 'monthly',
    name: 'Standart (Aylık)',
    badge: '850 TL / Ay',
    days: 30,
    price: 850,
    tableLimit: 25,
    description: 'POS + Yazıcı + 3 Garson + Z Raporu (25 Masa)',
  },
  {
    id: 'standard',
    billingPeriod: 'semi_annual',
    name: 'Standart (6 Ay)',
    badge: '4.350 TL',
    days: 180,
    price: 4350,
    tableLimit: 25,
    description: '6 Aylık İndirimli Standart Paket (25 Masa)',
  },
  {
    id: 'standard',
    billingPeriod: 'annual',
    name: 'Standart (Yıllık)',
    badge: '7.900 TL / Yıl',
    days: 365,
    price: 7900,
    tableLimit: 25,
    description: '2 Ay Bedava Yıllık Standart Paket (25 Masa)',
  },
  {
    id: 'pro',
    billingPeriod: 'monthly',
    name: 'Profesyonel (Aylık)',
    badge: '1.450 TL / Ay',
    days: 30,
    price: 1450,
    tableLimit: null,
    description: 'Tam Donanımlı + Sınırsız Masa & Garson',
  },
  {
    id: 'pro',
    billingPeriod: 'semi_annual',
    name: 'Profesyonel (6 Ay)',
    badge: '7.400 TL',
    days: 180,
    price: 7400,
    tableLimit: null,
    description: '6 Aylık Pro Paket + Öncelikli Canlı Destek',
  },
  {
    id: 'pro',
    billingPeriod: 'annual',
    name: 'Profesyonel (Yıllık)',
    badge: '13.900 TL / Yıl',
    days: 365,
    price: 13900,
    tableLimit: null,
    description: 'Yıllık En Avantajlı Full Restoran Paketi',
  },
];

export const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType>('trial');
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<BillingPeriod>('trial');
  const [price, setPrice] = useState<number>(0);
  const [tableLimit, setTableLimit] = useState<number | ''>(20);
  const [days, setDays] = useState<number>(7);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectPreset = (preset: PlanPreset) => {
    setIsCustomMode(false);
    setSelectedPlanType(preset.id);
    setSelectedBillingPeriod(preset.billingPeriod);
    setPrice(preset.price);
    setDays(preset.days);
    setTableLimit(preset.tableLimit !== null ? preset.tableLimit : '');
  };

  const handleEnableCustomMode = () => {
    setIsCustomMode(true);
    setSelectedPlanType('custom');
    setSelectedBillingPeriod('custom');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Lütfen bir işletme adı giriniz.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const trimmedName = name.trim();
      const baseSlug = slugify(trimmedName);
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      const slug = `${baseSlug}-${uniqueSuffix}`;
      const username = `${baseSlug.replace(/-/g, '_')}_${uniqueSuffix}`;
      const tempPass = generateTempPassword(8);
      const passHash = await hashPassword(tempPass);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(days));

      const payload = {
        name: trimmedName,
        slug: slug,
        username: username,
        password_hash: passHash,
        table_limit: tableLimit === '' ? null : Number(tableLimit),
        plan_type: selectedPlanType,
        plan_price: Number(price),
        billing_period: selectedBillingPeriod,
        last_payment_date: new Date().toISOString(),
        next_billing_date: expiresAt.toISOString(),
        subscription_status: 'active',
        subscription_days: Number(days),
        subscription_expires_at: expiresAt.toISOString(),
        template_id: 'dark_luxury',
        phone: '',
        address: '',
        working_hours: 'Her Gün: 7/24 Açık',
        wifi_ssid: '',
        wifi_password: '',
      };

      const { data, error: insertError } = await supabase
        .from('businesses')
        .insert([payload])
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      const createdBusiness = data as Business;

      // Automatically install all 16 default categories and products for this new business!
      try {
        for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
          const catTemplate = DEFAULT_CATEGORIES[i];
          const { data: catData } = await supabase
            .from('categories')
            .insert([
              {
                business_id: createdBusiness.id,
                name: catTemplate.name,
                image_url: catTemplate.image_url,
                order_index: i,
                is_active: true,
              },
            ])
            .select()
            .single();

          if (catData) {
            const prodsToInsert = catTemplate.products.map((p, pIdx) => ({
              business_id: createdBusiness.id,
              category_id: catData.id,
              name: p.name,
              description: p.description,
              price: 0,
              is_frozen: false,
              is_active: true,
              order_index: pIdx,
            }));

            await supabase.from('products').insert(prodsToInsert);
          }
        }
      } catch (seedErr) {
        console.error('Katalog kurulum hatası:', seedErr);
      }

      onCreated({
        business: createdBusiness,
        tempPass: tempPass,
        days: Number(days),
      });

      setName('');
      setTableLimit(20);
      setDays(7);
      setPrice(0);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'İşletme hesabı oluşturulurken bir hata oluştu.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12161F] border border-[#212634] rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#212634] mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Yeni İşletme & Abonelik Kaydı</h2>
              <p className="text-[11px] text-slate-400">Paket seçin veya süre/fiyat bilgilerini manuel belirleyin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#1A202C] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Business Name */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
              İşletme Adı <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Restiva Kafe & Bistro"
              className="w-full bg-[#0A0D14] border border-[#212634] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
            />
          </div>

          {/* Subscription Package Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                Abonelik Paketi Seçin (1 Tıkla Doldur)
              </label>
              <button
                type="button"
                onClick={handleEnableCustomMode}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                  isCustomMode 
                    ? 'bg-indigo-600 text-white border-indigo-500' 
                    : 'bg-[#0A0D14] text-slate-400 border-[#212634] hover:text-slate-200'
                }`}
              >
                Özel / Manuel Giriş
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PLAN_PRESETS.map((preset) => {
                const isSelected = 
                  !isCustomMode && 
                  selectedPlanType === preset.id && 
                  selectedBillingPeriod === preset.billingPeriod &&
                  price === preset.price;

                return (
                  <button
                    key={`${preset.id}-${preset.billingPeriod}-${preset.days}`}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 shadow-xs ring-1 ring-indigo-500'
                        : 'bg-[#0A0D14] border-[#212634] hover:border-slate-700 hover:bg-[#12161F]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-100">{preset.name}</span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-[#1E2433] text-indigo-300'
                      }`}>
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{preset.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editable Parameters (Price, Days, Table Limit) */}
          <div className="bg-[#0A0D14] border border-[#212634] p-3.5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Seçili Paket Parametreleri (İstediğiniz gibi düzenleyebilirsiniz)
              </span>
              <span className="text-indigo-400 font-mono">
                {selectedPlanType.toUpperCase()} ({selectedBillingPeriod})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  Paket Ücreti (TL)
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={price}
                  onChange={(e) => {
                    setPrice(Number(e.target.value));
                    setIsCustomMode(true);
                  }}
                  className="w-full bg-[#12161F] border border-[#212634] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-400" />
                  Abonelik Süresi (Gün)
                </label>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={days}
                  onChange={(e) => {
                    setDays(Number(e.target.value));
                    setIsCustomMode(true);
                  }}
                  className="w-full bg-[#12161F] border border-[#212634] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-400" />
                  Masa Limiti (Boş = Sınırsız)
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={tableLimit}
                  onChange={(e) => {
                    setTableLimit(e.target.value === '' ? '' : Number(e.target.value));
                    setIsCustomMode(true);
                  }}
                  placeholder="Sınırsız"
                  className="w-full bg-[#12161F] border border-[#212634] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#212634] flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1A202C] hover:bg-[#252D3D] text-xs font-medium text-slate-300 transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition disabled:opacity-50 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Hesap Açılıyor...' : `İşletmeyi Aç (${price > 0 ? `${price.toLocaleString('tr-TR')} ₺` : 'Ücretsiz'})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
