import React, { useState } from 'react';
import { Hand, Banknote, Wifi, Check, X, Copy, CreditCard } from 'lucide-react';
import { Business } from '../../types';
import { supabase } from '../../lib/supabase';

interface ServiceActionsModalProps {
  business: Business;
  tableNo: string;
  isOpen: boolean;
  type: 'waiter' | 'bill' | 'wifi' | null;
  onClose: () => void;
}

export const ServiceActionsModal: React.FC<ServiceActionsModalProps> = ({
  business,
  tableNo,
  isOpen,
  type,
  onClose,
}) => {
  const [billMethod, setBillMethod] = useState<'nakit' | 'pos'>('pos');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [wifiCopied, setWifiCopied] = useState(false);

  if (!isOpen || !type) return null;

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      let details = '';
      if (type === 'bill') {
        details = billMethod === 'pos' ? 'POS / Kredi Kartı ile Ödeme' : 'Nakit Ödeme';
      } else if (type === 'waiter') {
        details = note.trim() ? `Not: ${note.trim()}` : 'Masa çağrısı';
      }

      await supabase.from('service_requests').insert([
        {
          business_id: business.id,
          table_no: tableNo || 'Genel Masa',
          type: type,
          details: details,
          is_completed: false,
        },
      ]);

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setNote('');
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#121622] border border-[#1E2638] rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-5 shadow-2xl animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2638] mb-4">
          <h3 className="font-bold text-xs text-white flex items-center gap-2">
            {type === 'waiter' && <Hand className="w-3.5 h-3.5 text-amber-400" />}
            {type === 'bill' && <Banknote className="w-3.5 h-3.5 text-emerald-400" />}
            {type === 'wifi' && <Wifi className="w-3.5 h-3.5 text-indigo-400" />}
            <span>
              {type === 'waiter' && 'Garson Çağır'}
              {type === 'bill' && 'Hesap İste'}
              {type === 'wifi' && 'Wi-Fi Bilgisi'}
            </span>
          </h3>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1A2234]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 animate-bounce">
              <Check className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-xs text-white">İsteğiniz İletildi</h4>
            <p className="text-[11px] text-slate-400">
              Personelimiz en kısa sürede masanıza gelecektir.
            </p>
          </div>
        ) : type === 'wifi' ? (
          <div className="space-y-3.5">
            <div className="bg-[#0B0E14] p-3.5 rounded-xl border border-[#1A2234] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Ağ Adı:</span>
                <span className="font-semibold text-slate-200">{business.wifi_ssid || 'Wi-Fi'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Şifre:</span>
                <span className="font-mono font-bold text-indigo-400">
                  {business.wifi_password || 'Şifresiz'}
                </span>
              </div>
            </div>

            {business.wifi_password && (
              <button
                onClick={copyWifiPassword}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition"
              >
                {wifiCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{wifiCopied ? 'Şifre Kopyalandı' : 'Şifreyi Panoya Kopyala'}</span>
              </button>
            )}
          </div>
        ) : type === 'bill' ? (
          <div className="space-y-3.5">
            <p className="text-xs text-slate-300">
              {tableNo} için ödeme yönteminizi seçiniz:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setBillMethod('pos')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  billMethod === 'pos'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-[#0B0E14] border-[#1A2234] text-slate-400'
                }`}
              >
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-[11px]">Kredi Kartı / POS</span>
              </button>

              <button
                type="button"
                onClick={() => setBillMethod('nakit')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  billMethod === 'nakit'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-[#0B0E14] border-[#1A2234] text-slate-400'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-[11px]">Nakit</span>
              </button>
            </div>

            <button
              onClick={handleSendRequest}
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {loading ? 'İletiliyor...' : 'Hesabı İste'}
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            <p className="text-xs text-slate-300">
              {tableNo} için servis personelini masanıza çağırabilirsiniz.
            </p>

            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="İsteğe bağlı bir not yazabilirsiniz..."
              className="w-full bg-[#0B0E14] border border-[#1A2234] focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none resize-none"
            />

            <button
              onClick={handleSendRequest}
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-amber-600/20 transition disabled:opacity-50"
            >
              {loading ? 'Çağrılıyor...' : 'Garsonu Masaya Çağır'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
