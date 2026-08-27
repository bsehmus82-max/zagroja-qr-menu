import React, { useState } from 'react';
import { 
  BellRing, Receipt, Wifi, Check, X, Copy, 
  CreditCard, Banknote, Sparkles, MessageCircle, AlertCircle
} from 'lucide-react';
import { Business } from '../../types';
import { supabase } from '../../lib/supabase';
import { Language, translations } from '../../lib/translations';

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

  if (!isOpen || !type) return null;

  const waiterReasons = [
    t.reasonOrder,
    t.reasonClean,
    t.reasonInfo,
    t.reasonOther,
  ];

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      let requestType: 'waiter' | 'bill_cash' | 'bill_card' = 'waiter';
      let noteText = selectedReason;

      if (type === 'bill') {
        requestType = billMethod === 'pos' ? 'bill_card' : 'bill_cash';
        noteText = billMethod === 'pos' ? 'POS / Kredi Kartı ile Ödeme' : 'Nakit ile Ödeme';
      } else if (!noteText) {
        noteText = 'Garson Çağrısı';
      }

      const { error: insertErr } = await supabase.from('service_requests').insert([
        {
          business_id: business.id,
          table_no: tableNo || 'Genel Masa',
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
            table_no: tableNo || 'Genel Masa',
            request_type: requestType,
            status: 'pending',
          },
        ]);
      }

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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom text-slate-800 border-t sm:border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              type === 'waiter'
                ? 'bg-orange-50 text-orange-600'
                : type === 'bill'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-sky-50 text-sky-600'
            }`}>
              {type === 'waiter' && <BellRing className="w-4 h-4" />}
              {type === 'bill' && <Receipt className="w-4 h-4" />}
              {type === 'wifi' && <Wifi className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
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
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200 shadow-sm animate-bounce">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="font-black text-sm text-slate-900">{t.requestSubmittedTitle}</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {t.requestSubmittedDesc}
            </p>
          </div>
        ) : type === 'wifi' ? (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">{t.wifiNetwork}</span>
                <span className="font-black text-slate-900">{business.wifi_ssid || 'Wi-Fi'}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                <span className="text-slate-500 font-semibold">{t.wifiPassword}</span>
                <span className="font-mono font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                  {business.wifi_password || t.noWifiPassword}
                </span>
              </div>
            </div>

            {business.wifi_password && (
              <button
                onClick={copyWifiPassword}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-sm active:scale-98"
              >
                {wifiCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{wifiCopied ? t.wifiCopied : t.copyWifiPassword}</span>
              </button>
            )}
          </div>
        ) : type === 'bill' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">{t.paymentChoice}</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBillMethod('pos')}
                  className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                    billMethod === 'pos'
                      ? 'border-orange-500 bg-orange-50/70 text-orange-900 font-black shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 font-bold hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-orange-600" />
                  <span className="text-xs">{t.posPayment}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBillMethod('nakit')}
                  className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                    billMethod === 'nakit'
                      ? 'border-orange-500 bg-orange-50/70 text-orange-900 font-black shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 font-bold hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-orange-600" />
                  <span className="text-xs">{t.cashPayment}</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleSendRequest}
              disabled={loading}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md shadow-orange-500/20 transition active:scale-98 disabled:opacity-50"
            >
              {loading ? t.sending : t.sendBillRequest}
            </button>
          </div>
        ) : (
          /* WAITER CALL MODAL (Ultra Modern) */
          <div className="space-y-4">
            <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-orange-900">
              <BellRing className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">
                <strong className="font-black text-slate-900">{tableNo || t.table}</strong> {t.waiterPrompt}
              </p>
            </div>

            {/* Quick Reason Selector Tags */}
            <div>
              <span className="block text-[11px] font-bold text-slate-600 mb-2">
                {t.waiterReasonTitle}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {waiterReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(selectedReason === reason ? '' : reason)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center border ${
                      selectedReason === reason
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
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
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-orange-500/25 transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
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
