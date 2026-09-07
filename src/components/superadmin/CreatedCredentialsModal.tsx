import React, { useState } from 'react';
import { Check, Copy, X, KeyRound, ExternalLink, ShieldCheck } from 'lucide-react';
import { Business } from '../../types';

interface CreatedCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  tempPass: string;
  days: number;
}

export const CreatedCredentialsModal: React.FC<CreatedCredentialsModalProps> = ({
  isOpen,
  onClose,
  business,
  tempPass,
  days,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const loginUrl = window.location.origin;
  const menuUrl = `${window.location.origin}/m/${business.slug}`;

  const infoText = `RestivAdisyon Giriş Bilgileri:
İşletme: ${business.name}
Giriş Paneli: ${loginUrl}
Kullanıcı Adı: ${business.username}
Geçici Güvenlik Şifresi: ${tempPass}
Tanımlanan Süre: ${days} Gün
Masa Sınırı: ${business.table_limit && business.table_limit < 9999 ? business.table_limit : 'Sınırsız'}
QR Menü Linki: ${menuUrl}

Lütfen ilk girişte şifrenizi Ayarlar bölümünden güncelleyiniz.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(infoText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111622] border border-[#1F293D] rounded-3xl w-full max-w-lg p-6 shadow-2xl relative font-medium text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#1F293D] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C2433] text-white flex items-center justify-center border border-[#2B384E] shadow-sm">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">İşletme Giriş Bilgileri</h2>
              <p className="text-[11px] text-slate-400">Bu bilgileri işletme sahibine WhatsApp / SMS ile iletiniz</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1C2433] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#0C1017] border border-[#1F293D] rounded-2xl p-4 space-y-3 mb-5 text-xs">
          <div className="flex items-center justify-between border-b border-[#1F293D] pb-2">
            <span className="text-slate-400">İşletme Adı:</span>
            <span className="font-bold text-slate-100">{business.name}</span>
          </div>

          <div className="flex items-center justify-between border-b border-[#1F293D] pb-2">
            <span className="text-slate-400">Kullanıcı Adı:</span>
            <span className="font-mono font-bold text-white">{business.username}</span>
          </div>

          <div className="flex items-center justify-between border-b border-[#1F293D] pb-2">
            <span className="text-slate-400">İlk Giriş Şifresi:</span>
            <span className="font-mono font-black text-white bg-[#1C2433] px-2 py-0.5 rounded border border-[#2B384E]">
              {tempPass}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-[#1F293D] pb-2">
            <span className="text-slate-400">Tanımlı Süre:</span>
            <span className="font-bold text-white font-mono">+{days} Gün</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400">Müşteri QR Menüsü:</span>
            <a
              href={menuUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-200 hover:underline flex items-center gap-1 font-mono truncate max-w-[200px]"
            >
              <span>{business.slug}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-white hover:bg-slate-200 text-slate-900 shadow-sm active:scale-95'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Bilgiler Kopyalandı' : 'Tüm Bilgileri Kopyala (WhatsApp / SMS)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
