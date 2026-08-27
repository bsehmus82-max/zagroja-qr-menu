import React, { useState } from 'react';
import { Hand, Banknote, Wifi, Check, X, Copy, CreditCard } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [wifiCopied, setWifiCopied] = useState(false);

  if (!isOpen || !type) return null;

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      let requestType: 'waiter' | 'bill_cash' | 'bill_card' = 'waiter';
      if (type === 'bill') {
        requestType = billMethod === 'pos' ? 'bill_card' : 'bill_cash';
      }

      await supabase.from('service_requests').insert([
        {
          business_id: business.id,
          table_no: tableNo || 'Genel Masa',
          request_type: requestType,
          status: 'pending',
        },
      ]);

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-5 shadow-2xl animate-in slide-in-from-bottom text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            {type === 'waiter' && <Hand className="w-4 h-4 text-orange-500" />}
            {type === 'bill' && <Banknote className="w-4 h-4 text-emerald-600" />}
            {type === 'wifi' && <Wifi className="w-4 h-4 text-sky-500" />}
            <span>
              {type === 'waiter' && t.waiterModalTitle}
              {type === 'bill' && t.billModalTitle}
              {type === 'wifi' && t.wifiModalTitle}
            </span>
          </h3>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-1.5">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-200 animate-bounce">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">{t.requestSubmittedTitle}</h4>
            <p className="text-xs text-slate-500">
              {t.requestSubmittedDesc}
            </p>
          </div>
        ) : type === 'wifi' ? (
          <div className="space-y-3.5">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">{t.wifiNetwork}</span>
                <span className="font-extrabold text-slate-900">{business.wifi_ssid || 'Wi-Fi'}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-semibold">{t.wifiPassword}</span>
                <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {business.wifi_password || t.noWifiPassword}
                </span>
              </div>
            </div>

            {business.wifi_password && (
              <button
                onClick={copyWifiPassword}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                {wifiCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{wifiCopied ? t.wifiCopied : t.copyWifiPassword}</span>
              </button>
            )}
          </div>
        ) : type === 'bill' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">{t.paymentChoice}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBillMethod('pos')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                    billMethod === 'pos'
                      ? 'border-orange-500 bg-orange-50 text-orange-800 font-extrabold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 font-semibold'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs">{t.posPayment}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBillMethod('nakit')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                    billMethod === 'nakit'
                      ? 'border-orange-500 bg-orange-50 text-orange-800 font-extrabold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 font-semibold'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span className="text-xs">{t.cashPayment}</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleSendRequest}
              disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 transition"
            >
              {loading ? t.sending : t.sendBillRequest}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900 font-extrabold">{tableNo || t.table}</strong> {t.waiterPrompt}
            </p>

            <button
              onClick={handleSendRequest}
              disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2"
            >
              <Hand className="w-4 h-4" />
              <span>{loading ? t.sending : t.callWaiterBtn}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
