import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, CreditCard, DollarSign, Layers, 
  CheckCircle2, Sparkles, Sliders, AlertCircle, Clock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Business, PlanType, BillingPeriod } from '../../types';
import { useToast } from '../../context/ToastContext';

interface RenewSubscriptionModalProps {
  isOpen: boolean;
  business: Business | null;
  onClose: () => void;
  onUpdated: (updated: Business) => void;
}

interface RenewalPreset {
  label: string;
  days: number;
  planType: PlanType;
  billingPeriod: BillingPeriod;
  price: number;
  tableLimit: number | null;
}

export const RenewSubscriptionModal: React.FC<RenewSubscriptionModalProps> = ({
  isOpen,
  business,
  onClose,
  onUpdated,
}) => {
  const toast = useToast();
  const [daysToAdd, setDaysToAdd] = useState<number>(30);
  const [planType, setPlanType] = useState<PlanType>('standard');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [price, setPrice] = useState<number>(850);
  const [tableLimit, setTableLimit] = useState<number | ''>(25);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (business) {
      setPlanType(business.plan_type || 'standard');
      setBillingPeriod(business.billing_period || 'monthly');
      setPrice(business.plan_price || (business.plan_type === 'pro' ? 1450 : business.plan_type === 'lite' ? 450 : 850));
      setTableLimit(business.table_limit !== null && business.table_limit !== undefined ? business.table_limit : '');
      setDaysToAdd(business.billing_period === 'annual' ? 365 : business.billing_period === 'semi_annual' ? 180 : 30);
      setIsCustomMode(business.plan_type === 'custom');
      setError('');
    }
  }, [business]);

  if (!isOpen || !business) return null;

  const currentExpiry = new Date(business.subscription_expires_at);
  const isExpired = currentExpiry < new Date();
  const baseDate = isExpired ? new Date() : currentExpiry;
  const newExpiry = new Date(baseDate);
  newExpiry.setDate(newExpiry.getDate() + Number(daysToAdd));

  const RENEWAL_PRESETS: RenewalPreset[] = [
    {
      label: '+1 Ay Standart (850 TL)',
      days: 30,
      planType: 'standard',
      billingPeriod: 'monthly',
      price: 850,
      tableLimit: 25,
    },
    {
      label: '+6 Ay Standart (4.350 TL)',
      days: 180,
      planType: 'standard',
      billingPeriod: 'semi_annual',
      price: 4350,
      tableLimit: 25,
    },
    {
      label: '+1 Yıl Standart (7.900 TL)',
      days: 365,
      planType: 'standard',
      billingPeriod: 'annual',
      price: 7900,
      tableLimit: 25,
    },
    {
      label: '+1 Ay Profesyonel (1.450 TL)',
      days: 30,
      planType: 'pro',
      billingPeriod: 'monthly',
      price: 1450,
      tableLimit: null,
    },
    {
      label: '+6 Ay Profesyonel (7.400 TL)',
      days: 180,
      planType: 'pro',
      billingPeriod: 'semi_annual',
      price: 7400,
      tableLimit: null,
    },
    {
      label: '+1 Yıl Profesyonel (13.900 TL)',
      days: 365,
      planType: 'pro',
      billingPeriod: 'annual',
      price: 13900,
      tableLimit: null,
    },
    {
      label: '+1 Ay Lite (450 TL)',
      days: 30,
      planType: 'lite',
      billingPeriod: 'monthly',
      price: 450,
      tableLimit: 15,
    },
    {
      label: '+1 Yıl Lite (3.900 TL)',
      days: 365,
      planType: 'lite',
      billingPeriod: 'annual',
      price: 3900,
      tableLimit: 15,
    },
  ];

  const handleApplyPreset = (preset: RenewalPreset) => {
    setIsCustomMode(false);
    setDaysToAdd(preset.days);
    setPlanType(preset.planType);
    setBillingPeriod(preset.billingPeriod);
    setPrice(preset.price);
    setTableLimit(preset.tableLimit !== null ? preset.tableLimit : '');
  };

  const handleSaveRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        subscription_expires_at: newExpiry.toISOString(),
        subscription_status: 'active',
        subscription_days: (business.subscription_days || 0) + Number(daysToAdd),
        plan_type: planType,
        plan_price: Number(price),
        billing_period: billingPeriod,
        table_limit: tableLimit === '' ? null : Number(tableLimit),
        last_payment_date: new Date().toISOString(),
        next_billing_date: newExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error: updateErr } = await supabase
        .from('businesses')
        .update(payload)
        .eq('id', business.id)
        .select()
        .single();

      if (updateErr) {
        throw updateErr;
      }

      toast.success(`"${business.name}" aboneliği yenilendi (+${daysToAdd} gün).`);
      onUpdated(data as Business);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Abonelik güncellenirken hata oluştu.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12161F] border border-[#212634] rounded-3xl w-full max-w-xl p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#212634] mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Ödeme Alındı & Abonelik Yenile</h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {business.name} ({business.username})
              </p>
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

        <form onSubmit={handleSaveRenewal} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Current Expiration Summary Banner */}
          <div className="bg-[#0A0D14] border border-[#212634] p-3 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Mevcut Bitiş Tarihi</span>
              <span className={`font-bold ${isExpired ? 'text-rose-400' : 'text-slate-200'}`}>
                {currentExpiry.toLocaleDateString('tr-TR')} {isExpired ? '(Süresi Dolmuş)' : ''}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Yeni Bitiş Tarihi</span>
              <span className="font-bold text-emerald-400">
                {newExpiry.toLocaleDateString('tr-TR')} (+{daysToAdd} Gün)
              </span>
            </div>
          </div>

          {/* Quick Renewal Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Hızlı Yenileme Paketleri
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomMode(true);
                  setPlanType('custom');
                  setBillingPeriod('custom');
                }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                  isCustomMode 
                    ? 'bg-indigo-600 text-white border-indigo-500' 
                    : 'bg-[#0A0D14] text-slate-400 border-[#212634] hover:text-slate-200'
                }`}
              >
                Manuel Ayarla
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RENEWAL_PRESETS.map((preset) => {
                const isSelected = 
                  !isCustomMode && 
                  planType === preset.planType && 
                  billingPeriod === preset.billingPeriod && 
                  daysToAdd === preset.days &&
                  price === preset.price;

                return (
                  <button
                    key={`${preset.planType}-${preset.billingPeriod}-${preset.days}`}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-slate-100 ring-1 ring-indigo-500'
                        : 'bg-[#0A0D14] border-[#212634] text-slate-300 hover:border-slate-700 hover:bg-[#12161F]'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editable Parameters */}
          <div className="bg-[#0A0D14] border border-[#212634] p-3.5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Ödeme ve Süre Detayları (Düzenlenebilir)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  Alınan Tutar (TL)
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
                  Eklenecek Gün
                </label>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={daysToAdd}
                  onChange={(e) => {
                    setDaysToAdd(Number(e.target.value));
                    setIsCustomMode(true);
                  }}
                  className="w-full bg-[#12161F] border border-[#212634] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-400" />
                  Masa Sınırı
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
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Kaydediliyor...' : `Ödemeyi Onayla & Uzat (${price.toLocaleString('tr-TR')} ₺)`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
