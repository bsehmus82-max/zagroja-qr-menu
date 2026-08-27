import React, { useState } from 'react';
import { 
  Hand, Banknote, CreditCard, Wifi, Check, 
  X, Copy, Sparkles 
} from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedWifi, setCopiedWifi] = useState(false);

  if (!isOpen || !type) return null;

  const handleCallWaiter = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('service_requests').insert([
        {
          business_id: business.id,
          table_no: tableNo || 'Genel',
          request_type: 'waiter',
          status: 'pending',
        },
      ]);

      if (!error) {
        setSuccessMsg('Garson çaðrýnýz personele anýnda iletildi.');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestBill = async (method: 'bill_cash' | 'bill_card') => {
    setLoading(true);
    try {
      const { error } = await supabase.from('service_requests').insert([
        {
          business_id: business.id,
          table_no: tableNo || 'Genel',
          request_type: method,
          status: 'pending',
        },
      ]);

      if (!error) {
        setSuccessMsg(
          method === 'bill_cash'
            ? 'Nakit hesap talebiniz kasaya iletildi.'
            : 'POS / Kredi kartý hesap talebiniz kasaya iletildi.'
        );
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWifi = () => {
    navigator.clipboard.writeText(business.wifi_password);
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {successMsg ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">Talebiniz Alýndý!</h3>
            <p className="text-xs text-neutral-400">{successMsg}</p>
          </div>
        ) : type === 'waiter' ? (
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Hand className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">Garson Çaðýr</h3>
            <p className="text-xs text-neutral-400 mb-6">
              <strong>{tableNo || 'Masa'}</strong> için servis personelini çaðýrmak istiyor musunuz?
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-neutral-800 text-neutral-300 rounded-2xl text-xs font-bold"
              >
                Vazgeç
              </button>
              <button
                disabled={loading}
                onClick={handleCallWaiter}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-amber-600/30 transition disabled:opacity-50"
              >
                {loading ? 'Ýletiliyor...' : 'Evet, Çaðýr'}
              </button>
            </div>
          </div>
        ) : type === 'bill' ? (
          <div className="text-center py-2">
            <h3 className="font-bold text-sm text-white mb-1">Hesap Ýsteme Türü</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Ödemenizi nasýl gerçekleþtirmek istersiniz?
            </p>
            <div className="space-y-2.5">
              <button
                disabled={loading}
                onClick={() => handleRequestBill('bill_cash')}
                className="w-full py-3.5 px-4 bg-neutral-950 border border-neutral-800 hover:border-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <span>Nakit Ödeme</span>
                </div>
                <span className="text-neutral-500 group-hover:text-white">Seç ›</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleRequestBill('bill_card')}
                className="w-full py-3.5 px-4 bg-neutral-950 border border-neutral-800 hover:border-purple-500 text-white rounded-2xl text-xs font-bold flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span>Kredi Kartý / POS</span>
                </div>
                <span className="text-neutral-500 group-hover:text-white">Seç ›</span>
              </button>
            </div>
          </div>
        ) : type === 'wifi' ? (
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto mb-3">
              <Wifi className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">Müþteri Wi-Fi Bilgileri</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Ýþletmemizin kablosuz aðýna kolayca baðlanabilirsiniz.
            </p>

            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-neutral-400">Að Adý (SSID):</span>
                <span className="font-bold text-white font-mono">{business.wifi_ssid || 'Belirtilmedi'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Þifre:</span>
                <span className="font-bold text-brand-400 font-mono">{business.wifi_password || 'Þifresiz'}</span>
              </div>
            </div>

            {business.wifi_password && (
              <button
                onClick={handleCopyWifi}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                {copiedWifi ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedWifi ? 'Þifre Kopyalandý!' : 'Wi-Fi Þifresini Kopyala'}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
