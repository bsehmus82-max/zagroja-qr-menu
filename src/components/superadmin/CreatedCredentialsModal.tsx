import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Business } from '../../types';

interface CreatedCredentialsModalProps {
  info: {
    business: Business;
    tempPass: string;
    days: number;
  } | null;
  onClose: () => void;
}

export const CreatedCredentialsModal: React.FC<CreatedCredentialsModalProps> = ({ info, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!info) return null;

  const handleCopy = () => {
    const text = `?? *${info.business.name}* - Zagroja QR Menü Giriþ Bilgileriniz:\n\n?? Giriþ Paneli: ${window.location.origin}/admin\n?? Kullanýcý Adý: ${info.business.username}\n?? Geçici Þifre: ${info.tempPass}\n?? Masa Sýnýrý: ${info.business.table_limit} Masa\n? Abonelik Süresi: ${info.days} Gün\n\nÝlk giriþinizde menü kategorilerinizi seçerek hýzlýca kullanmaya baþlayabilirsiniz.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-brand-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-white">Ýþletme Giriþ Bilgileri Hazýr!</h3>
          <p className="text-xs text-neutral-400 mt-1">
            Aþaðýdaki bilgileri müþterinize WhatsApp veya Canlý Destek üzerinden iletebilirsiniz.
          </p>
        </div>

        <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2 font-mono text-xs text-neutral-300 select-all mb-6">
          <div><strong>Ýþletme:</strong> {info.business.name}</div>
          <div><strong>Giriþ Adresi:</strong> {window.location.origin}/admin</div>
          <div><strong>Kullanýcý Adý:</strong> <span className="text-brand-400 font-bold">{info.business.username}</span></div>
          <div><strong>Geçici Þifre:</strong> <span className="text-emerald-400 font-bold">{info.tempPass}</span></div>
          <div><strong>Masa Limiti:</strong> {info.business.table_limit} Masa</div>
          <div><strong>Abonelik:</strong> {info.days} Gün</div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Kopyalandý!' : 'Bilgileri Kopyala'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-2xl text-xs font-bold transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
