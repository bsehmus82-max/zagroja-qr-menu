import React, { useState } from 'react';
import { 
  X, Calendar, Layers, CheckCircle2, AlertCircle, 
  RotateCw, CreditCard, Sparkles, Sliders 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Business, PlanType, BillingPeriod } from '../../types';

interface RenewSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  onSuccess: (updated: Business) => void;
}

interface RenewalPreset {
  planType: PlanType;
  billingPeriod: BillingPeriod;
  name: string;
  badge: string;
  days: number;
  price: number;
  tableLimit: number | null;
}

const RENEWAL_PRESETS: RenewalPreset[] = [
  {
    planType: 'lite',
    billingPeriod: 'monthly',
    name: 'Lite QR Menü (1 Ay)',
    badge: '450 TL',
    days: 30,
    price: 450,
    tableLimit: 15,
  },
  {
    planType: 'lite',
    billingPeriod: 'annual',
    name: 'Lite QR Menü (1 Yıl)',
    badge: '3.900 TL',
    days: 365,
    price: 3900,
    tableLimit: 15,
  },
  {
    planType: 'standard',
    billingPeriod: 'monthly',
    name: 'Standart Kafe/Bistro (1 Ay)',
    badge: '850 TL',
    days: 30,
    price: 850,
    tableLimit: 30,
  },
  {
    planType: 'standard',
    billingPeriod: 'annual',
    name: 'Standart Kafe/Bistro (1 Yıl)',
    badge: '7.900 TL',
    days: 365,
    price: 7900,
    tableLimit: 30,
  },
  {
    planType: 'pro',
    billingPeriod: 'monthly',
    name: 'Profesyonel Restoran (1 Ay)',
    badge: '1.450 TL',
    days: 30,
    price: 1450,
    tableLimit: null,
  },
  {
    planType: 'pro',
    billingPeriod: 'annual',
    name: 'Profesyonel Restoran (1 Yıl)',
    badge: '13.500 TL',
    days: 365,
    price: 13500,
    tableLimit: null,
  },
];

export const RenewSubscriptionModal: React.FC<RenewSubscriptionModalProps> = ({
  isOpen,
  onClose,
  business,
  onSuccess,
}) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(2);
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType>(business.plan_type || 'standard');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(business.billing_period || 'monthly');
  const [days, setDays] = useState<number>(30);
  const [price, setPrice] = useState<number>(business.plan_price || 850);
  const [tableLimit, setTableLimit] = useState<number | ''>(
    business.table_limit && business.table_limit < 9999 ? business.table_limit : ''
  );
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = RENEWAL_PRESETS[index];
    setSelectedPlanType(preset.planType);
    setBillingPeriod(preset.billingPeriod);
    setDays(preset.days);
    setPrice(preset.price);
    setTableLimit(preset.tableLimit !== null ? preset.tableLimit : '');
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const currentExpiry = new Date(business.subscription_expires_at);
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      baseDate.setDate(baseDate.getDate() + Number(days));

      const newTotalDays = (business.subscription_days || 0) + Number(days);
      const effectivePlan = isCustomMode ? (business.plan_type || 'standard') : selectedPlanType;
      const effectivePeriod = isCustomMode ? (business.billing_period || 'monthly') : billingPeriod;

      const { data, error: updateError } = await supabase
        .from('businesses')
        .update({
          subscription_expires_at: baseDate.toISOString(),
          subscription_days: newTotalDays,
          subscription_status: 'active',
          table_limit: tableLimit === '' ? 9999 : Number(tableLimit),
          plan_type: effectivePlan,
          plan_price: Number(price),
          billing_period: effectivePeriod,
          last_payment_date: new Date().toISOString(),
          next_billing_date: baseDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)
        .select()
        .single();

      if (updateError) throw updateError;

      onSuccess(data as Business);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Abonelik uzatılırken hata oluştu.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = new Date(business.subscription_expires_at) < new Date();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E293B] border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20 shadow-xs">
              <RotateCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Abonelik & Paket Yenileme</h2>
              <p className="text-[11px] text-slate-400">
                <span className="text-orange-400 font-semibold">{business.name}</span> işletmesi için süre ve tahsilat tanımlayın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
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

        <form onSubmit={handleRenew} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Current Status Card */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Mevcut Bitiş Tarihi:</span>
              <span className={`text-xs font-mono font-bold ${isExpired ? 'text-rose-400' : 'text-slate-200'}`}>
                {new Date(business.subscription_expires_at).toLocaleDateString('tr-TR')}
                {isExpired && ' (Süresi Dolmuş)'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Tanımlı Paket:</span>
              <span className="text-xs font-bold text-orange-400">
                {business.plan_type === 'pro' ? 'Profesyonel' : business.plan_type === 'standard' ? 'Standart' : 'Lite'}
              </span>
            </div>
          </div>

          {/* Presets Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>Yenileme Paketini Seçin</span>
              </label>

              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                  isCustomMode 
                    ? 'bg-orange-500 text-white border-orange-500' 
                    : 'bg-[#0F172A] text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {isCustomMode ? 'Hazır Paketler' : 'Özel Gün/Fiyat'}
              </button>
            </div>

            {!isCustomMode && (
              <div className="grid grid-cols-2 gap-2">
                {RENEWAL_PRESETS.map((preset, idx) => {
                  const isSelected = selectedPresetIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(idx)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-orange-500/15 border-orange-500 text-slate-100 ring-1 ring-orange-500'
                          : 'bg-[#0F172A] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <div className="font-bold text-xs truncate">{preset.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">+{preset.days} Gün</div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                        isSelected ? 'bg-orange-500 text-white' : 'bg-slate-800 text-orange-400'
                      }`}>
                        {preset.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details (Price, Days, Tables) */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-400" />
                Tahsilat & Tanımlanacak Süre
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
                  className="w-full bg-[#1E293B] border border-slate-700/80 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-orange-400" />
                  Eklenecek Süre (Gün)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full bg-[#1E293B] border border-slate-700/80 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-orange-400" />
                  Masa Sınırı
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Sınırsız"
                  value={tableLimit}
                  onChange={(e) => setTableLimit(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1E293B] border border-slate-700/80 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 flex items-center gap-1.5 transition disabled:opacity-50 active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? 'Uzatılıyor...' : `+${days} Gün Tanımla & Aktif Et`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
