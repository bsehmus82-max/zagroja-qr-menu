import React, { useState } from 'react';
import { 
  BellRing, Receipt, Wifi, Check, X, Copy, 
  CreditCard, Banknote, Sparkles, MessageCircle, AlertCircle
} from 'lucide-react';
import { Business } from '../../types';
import { supabase } from '../../lib/supabase';
import { Language, translations } from '../../lib/translations';
import { checkRateLimit, recordAction, sanitizeInput } from '../../lib/security';

interface ServiceActionsModalProps {
  business: Business;
  tableNo: string;
  isOpen: boolean;
  type: 'waiter' | 'bill' | 'wifi' | null;
  lang?: Language;
  onClose: () => void;
}

export const ServiceActionsModal: React.FC<ServiceActionsModalProps> = ({
  business,
  tableNo,
  isOpen,
  type,
  lang = 'tr',
  onClose,
}) => {
  const t = translations[lang] || translations.tr;
  const [billMethod, setBillMethod] = useState<'nakit' | 'pos'>('pos');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [wifiCopied, setWifiCopied] = useState(false);
  const [cooldownMsg, setCooldownMsg] = useState<string | null>(null);

  if (!isOpen || !type) return null;

  const waiterReasons = [
    t.reasonOrder,
    t.reasonClean,
    t.reasonInfo,
    t.reasonOther,
  ];

  const handleSendRequest = async () => {
    if (loading) return;

    const rateLimitKey = `service_${business.id}_${tableNo || 'general'}_${type}`;
    const { allowed, remainingSec } = checkRateLimit(rateLimitKey, 30000);

    if (!allowed) {
      setCooldownMsg(
        lang === 'tr'
          ? `Lütfen tekrar talep göndermeden önce ${remainingSec} saniye bekleyiniz.`
          : `Please wait ${remainingSec}s before sending another request.`
      );
      setTimeout(() => setCooldownMsg(null), 4000);
      return;
    }

    setLoading(true);
    setCooldownMsg(null);
    try {
      let requestType: 'waiter' | 'bill_cash' | 'bill_card' = 'waiter';
      let noteText = sanitizeInput(selectedReason, 150);

      if (type === 'bill') {
        requestType = billMethod === 'pos' ? 'bill_card' : 'bill_cash';
        noteText = billMethod === 'pos' ? 'POS / Kredi Kartı ile Ödeme' : 'Nakit ile Ödeme';
      } else if (!noteText) {
        noteText = 'Garson Çağrısı';
      }

      const { error: insertErr } = await supabase.from('service_requests').insert([
        {
          business_id: business.id,
          table_no: sanitizeInput(tableNo, 50) || 'Genel Masa',
          request_type: requestType,
          status: 'pending',
          notes: noteText,
        },
      ]);

      if (insertErr) {
        // Fallback in case notes column is not present in database yet
        await supabase.from('service_requests').insert([
          {
            business_id: business.id,
            table_no: sanitizeInput(tableNo, 50) || 'Genel Masa',
            request_type: requestType,
            status: 'pending',
          },
        ]);
      }

      recordAction(rateLimitKey);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        setSelectedReason('');
      }, 2200);
    } catch (err) {
      console.error('Servis çağrısı gönderme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyWifiPassword = () => {
    if (business.wifi_password) {
      navigator.clipboard.writeText(business.wifi_password);
      setWifiCopied(true);
      setTimeout(() => setWifiCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[#111622] rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              type === 'waiter'
                ? 'bg-[#141A26] text-amber-400'
                : type === 'bill'
                ? 'bg-[#141A26] text-emerald-400'
                : 'bg-[#141A26] text-sky-400'
            }`}>
              {type === 'waiter' && <BellRing className="w-4 h-4" />}
              {type === 'bill' && <Receipt className="w-4 h-4" />}
              {type === 'wifi' && <Wifi className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white leading-tight">
                {type === 'waiter' && t.waiterModalTitle}
                {type === 'bill' && t.billModalTitle}
                {type === 'wifi' && t.wifiModalTitle}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                {tableNo ? tableNo : t.table}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#141A26] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {cooldownMsg && (
          <div className="mb-3.5 p-3 bg-amber-500/10 text-amber-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{cooldownMsg}</span>
          </div>
        )}

        {submitted ? (
          <div className="py-8 text-center space-y-2 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-[#141A26] text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-sm animate-bounce">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-sm text-white">{t.requestSubmittedTitle}</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto font-normal">
              {t.requestSubmittedDesc}
            </p>
          </div>
        ) : type === 'wifi' ? (
          <div className="space-y-4">
            <div className="bg-[#141A26] p-4 rounded-2xl space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">{t.wifiNetwork}</span>
                <span className="font-bold text-white">{business.wifi_ssid || 'Wi-Fi'}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5">
                <span className="text-slate-400 font-medium">{t.wifiPassword}</span>
                <span className="font-mono font-bold text-white bg-[#1C2433] px-2.5 py-1 rounded-lg shadow-xs">
                  {business.wifi_password || t.noWifiPassword}
                </span>
              </div>
            </div>

            {business.wifi_password && (
              <button
                onClick={copyWifiPassword}
                className="w-full py-3 bg-white hover:bg-slate-200 text-[#0F172A] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-98"
              >
                {wifiCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{wifiCopied ? t.wifiCopied : t.copyWifiPassword}</span>
              </button>
            )}
          </div>
        ) : type === 'bill' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">{t.paymentChoice}</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBillMethod('pos')}
                  className={`p-3.5 rounded-2xl text-center transition flex flex-col items-center gap-2 ${
                    billMethod === 'pos'
                      ? 'bg-[#1C2433] text-white font-bold shadow-sm'
                      : 'bg-[#141A26] text-slate-400 font-medium hover:bg-[#1C2433]/60'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-slate-200" />
                  <span className="text-xs">{t.posPayment}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBillMethod('nakit')}
                  className={`p-3.5 rounded-2xl text-center transition flex flex-col items-center gap-2 ${
                    billMethod === 'nakit'
                      ? 'bg-[#1C2433] text-white font-bold shadow-sm'
                      : 'bg-[#141A26] text-slate-400 font-medium hover:bg-[#1C2433]/60'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-slate-200" />
                  <span className="text-xs">{t.cashPayment}</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleSendRequest}
              disabled={loading}
              className="w-full py-3.5 bg-white hover:bg-slate-200 text-[#0F172A] font-bold text-xs rounded-xl shadow-md transition active:scale-98 disabled:opacity-50"
            >
              {loading ? t.sending : t.sendBillRequest}
            </button>
          </div>
        ) : (
          /* WAITER CALL MODAL (Ultra Modern) */
          <div className="space-y-4">
            <div className="bg-[#141A26] rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-slate-300">
              <BellRing className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-normal">
                <strong className="font-bold text-white">{tableNo || t.table}</strong> {t.waiterPrompt}
              </p>
            </div>

            {/* Quick Reason Selector Tags */}
            <div>
              <span className="block text-[11px] font-bold text-slate-400 mb-2">
                {t.waiterReasonTitle}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {waiterReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(selectedReason === reason ? '' : reason)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center ${
                      selectedReason === reason
                        ? 'bg-white text-[#0F172A] shadow-sm'
                        : 'bg-[#141A26] text-slate-300 hover:bg-[#1C2433]'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSendRequest}
              disabled={loading}
              className="w-full py-3.5 bg-white hover:bg-slate-200 text-[#0F172A] font-bold text-xs rounded-2xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <BellRing className="w-4 h-4" />
              <span>{loading ? t.sending : t.callWaiterBtn}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
