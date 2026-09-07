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
    name: 'Standart Kafe/Bistro (Aylık)',
    badge: '850 TL / Ay',
    days: 30,
    price: 850,
    tableLimit: 30,
    description: 'QR Menü + Masadan Sipariş + POS + Adisyon Fiş Motoru (30 Masa)',
  },
  {
    id: 'standard',
    billingPeriod: 'annual',
    name: 'Standart Kafe/Bistro (Yıllık)',
    badge: '7.900 TL / Yıl',
    days: 365,
    price: 7900,
    tableLimit: 30,
    description: 'Yıllık Peşin Standart Kafe/Bistro (30 Masa)',
  },
  {
    id: 'pro',
    billingPeriod: 'monthly',
    name: 'Profesyonel Restoran (Aylık)',
    badge: '1.450 TL / Ay',
    days: 30,
    price: 1450,
    tableLimit: null,
    description: 'Sınırsız Masa + Çoklu Garson Terminali + Kasa + Termal Yazıcı + Ciro Analizi',
  },
  {
    id: 'pro',
    billingPeriod: 'annual',
    name: 'Profesyonel Restoran (Yıllık)',
    badge: '13.500 TL / Yıl',
    days: 365,
    price: 13500,
    tableLimit: null,
    description: 'Yıllık Peşin Profesyonel Full Paket (Sınırsız)',
  },
];

export const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Subscription Plan Selection State
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType>('trial');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('trial');
  const [days, setDays] = useState<number>(7);
  const [price, setPrice] = useState<number>(0);
  const [tableLimit, setTableLimit] = useState<number | ''>(20);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = PLAN_PRESETS[index];
    setSelectedPlanType(preset.id);
    setBillingPeriod(preset.billingPeriod);
    setDays(preset.days);
    setPrice(preset.price);
    setTableLimit(preset.tableLimit !== null ? preset.tableLimit : '');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const slug = slugify(name);
      const tempPass = generateTempPassword();
      const passwordHash = await hashPassword(tempPass);
      const username = `${slug}_${Math.floor(1000 + Math.random() * 9000)}`;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(days));

      const effectivePlan = isCustomMode ? 'custom' : selectedPlanType;
      const effectivePeriod = isCustomMode ? 'monthly' : billingPeriod;

      const { data: newBiz, error: insertError } = await supabase
        .from('businesses')
        .insert([
          {
            name: name.trim(),
            slug,
            username,
            password_hash: passwordHash,
            phone: phone.trim(),
            address: address.trim(),
            subscription_status: 'active',
            subscription_expires_at: expiresAt.toISOString(),
            subscription_days: Number(days),
            table_limit: tableLimit === '' ? 9999 : Number(tableLimit),
            plan_type: effectivePlan,
            plan_price: Number(price),
            billing_period: effectivePeriod,
            last_payment_date: new Date().toISOString(),
            next_billing_date: expiresAt.toISOString(),
            is_active: true,
          },
        ])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Bu işletme adı veya kullanıcı adı zaten kullanımda.');
        }
        throw insertError;
      }

      // Default Catalog Seeding
      try {
        for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
          const cat = DEFAULT_CATEGORIES[i];
          const { data: catData, error: catError } = await supabase
            .from('categories')
            .insert([
              {
                business_id: newBiz.id,
                name: cat.name,
                order_index: i,
              },
            ])
            .select()
            .single();

          if (!catError && catData && cat.products) {
            const productInserts = cat.products.map((p, idx) => ({
              business_id: newBiz.id,
              category_id: catData.id,
              name: p.name,
              description: p.description,
              price: p.price,
              is_available: true,
              order_index: idx,
            }));
            await supabase.from('products').insert(productInserts);
          }
        }
      } catch (catErr) {
        console.warn('Default categories warning:', catErr);
      }

      // Default Tables Seeding
      try {
        const defaultTableCount = tableLimit === '' ? 12 : Math.min(Number(tableLimit), 12);
        const tableRows = [];
        for (let i = 1; i <= defaultTableCount; i++) {
          tableRows.push({
            business_id: newBiz.id,
            table_no: `Masa ${i}`,
            section: 'Salon',
            capacity: 4,
            is_active: true,
          });
        }
        await supabase.from('tables').insert(tableRows);
      } catch (tblErr) {
        console.warn('Default tables warning:', tblErr);
      }

      onCreated({
        business: newBiz as Business,
        tempPass,
        days: Number(days),
      });

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'İşletme oluşturulurken hata oluştu.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111622] border border-[#1F293D] rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[92vh] flex flex-col font-medium text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1F293D] mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C2433] text-white flex items-center justify-center border border-[#2B384E] shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Yeni İşletme Kaydı & Paket Tanımla</h2>
              <p className="text-[11px] text-slate-400">Restoran bilgilerini girin ve abonelik paketini seçin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1C2433] transition"
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

        <form onSubmit={handleCreate} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Business Info Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                İşletme / Restoran Adı *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Boğaziçi Steakhouse & Bistro"
                className="w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Yetkili Telefon Numarası
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0532 000 00 00"
                className="w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Şehir / Adres
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Kadıköy, İstanbul"
                className="w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Subscription Plans & Pricing Selection */}
          <div className="border-t border-[#1F293D] pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-300" />
                <span>Abonelik Paketi & Tahsilat Tipi</span>
              </label>

              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                  isCustomMode 
                    ? 'bg-white text-slate-900 border-white' 
                    : 'bg-[#0C1017] text-slate-400 border-[#1F293D] hover:text-slate-200'
                }`}
              >
                {isCustomMode ? 'Hazır Paketlere Dön' : 'Özel Manuel Ayarla'}
              </button>
            </div>

            {/* Presets Grid */}
            {!isCustomMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PLAN_PRESETS.map((preset, idx) => {
                  const isSelected = selectedPresetIndex === idx;
                  return (
                    <button
                      key={`${preset.id}_${preset.billingPeriod}_${idx}`}
                      type="button"
                      onClick={() => handleSelectPreset(idx)}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between relative ${
                        isSelected
                          ? 'bg-white/10 border-white shadow-sm ring-1 ring-white'
                          : 'bg-[#0C1017] border-[#1F293D] hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-slate-100">{preset.name}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            isSelected ? 'bg-white text-slate-900' : 'bg-[#1C2433] text-slate-300'
                          }`}
                        >
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* Manual Customization Row (Price, Days, Tables) */}
            <div className="bg-[#0C1017] border border-[#1F293D] rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-300" />
                  Paket Detayları (Gün, Fiyat, Masa Sınırı)
                </span>
                <span className="text-white font-mono">
                  {isCustomMode ? 'Manuel Mod' : 'Seçili Paket Parametreleri'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Tahsil Edilen Fiyat (TL)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-[#111622] border border-[#1F293D] focus:border-slate-500 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-300" />
                    Kullanım Süresi (Gün)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="w-full bg-[#111622] border border-[#1F293D] focus:border-slate-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-300" />
                    Masa Sınırı (Boş = Sınırsız)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Sınırsız"
                    value={tableLimit}
                    onChange={(e) => setTableLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#111622] border border-[#1F293D] focus:border-slate-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-[#1F293D] flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-xs font-medium text-slate-300 transition border border-[#2B384E]"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-900 text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition disabled:opacity-50 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{loading ? 'İşletme Açılıyor...' : 'İşletmeyi & Paketi Başlat'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
