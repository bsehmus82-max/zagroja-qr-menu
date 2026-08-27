import React, { useState } from 'react';
import { Hand, Banknote, Wifi, Check, X, Copy, Sparkles, CreditCard } from 'lucide-react';
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
      }, 2500);
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
      <div className="bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <h3 className="font-black text-sm text-white flex items-center gap-2">
            {type === 'waiter' && <Hand className="w-4 h-4 text-amber-400" />}
            {type === 'bill' && <Banknote className="w-4 h-4 text-emerald-400" />}
            {type === 'wifi' && <Wifi className="w-4 h-4 text-brand-400" />}
            <span>
              {type === 'waiter' && 'Garson Çağır'}
              {type === 'bill' && 'Hesap İste'}
              {type === 'wifi' && 'Müşteri Wi-Fi Bilgisi'}
            </span>
          </h3>

          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 animate-bounce">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-white">İsteğiniz İletildi!</h4>
            <p className="text-xs text-neutral-400">
              Personelimiz en kısa sürede masanıza gelecektir.
            </p>
          </div>
        ) : type === 'wifi' ? (
          <div className="space-y-4">
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Ağ Adı (SSID):</span>
                <span className="font-bold text-white">{business.wifi_ssid || 'İşletme Wi-Fi'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Şifre:</span>
                <span className="font-mono font-bold text-brand-400">
                  {business.wifi_password || 'Şifresiz'}
                </span>
              </div>
            </div>

            {business.wifi_password && (
              <button
                onClick={copyWifiPassword}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition"
              >
                {wifiCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{wifiCopied ? 'Şifre Kopyalandı!' : 'Şifreyi Panoya Kopyala'}</span>
              </button>
            )}
          </div>
        ) : type === 'bill' ? (
          <div className="space-y-4">
            <p className="text-xs text-neutral-300">
              {tableNo} için hesap ödeme yönteminizi seçiniz:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBillMethod('pos')}
                className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                  billMethod === 'pos'
                    ? 'bg-brand-600/20 border-brand-500 text-white ring-1 ring-brand-500'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                <CreditCard className="w-5 h-5 text-brand-400" />
                <span className="font-bold text-xs">POS / Kredi Kartı</span>
              </button>

              <button
                type="button"
                onClick={() => setBillMethod('nakit')}
                className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                  billMethod === 'nakit'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-xs">Nakit</span>
              </button>
            </div>

            <button
              onClick={handleSendRequest}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              {loading ? 'İletiliyor...' : 'Hesabı İste'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-neutral-300">
              {tableNo} için servis görevlisini masanıza çağırabilirsiniz.
            </p>

            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="İsteğe bağlı bir not yazabilirsiniz (Örn: Ekstra peçete rica ediyoruz)..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 resize-none"
            />

            <button
              onClick={handleSendRequest}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-amber-600/30 transition disabled:opacity-50"
            >
              {loading ? 'Çağrılıyor...' : 'Garsonu Masaya Çağır'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
