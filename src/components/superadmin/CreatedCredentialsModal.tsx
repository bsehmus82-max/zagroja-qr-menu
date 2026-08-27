import React, { useState } from 'react';
import { CheckCircle, Copy, Check, X, Shield } from 'lucide-react';
import { Business } from '../../types';

interface CreatedCredentialsModalProps {
  info: {
    business: Business;
    tempPass: string;
    days: number;
  } | null;
  onClose: () => void;
}

export const CreatedCredentialsModal: React.FC<CreatedCredentialsModalProps> = ({
  info,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!info) return null;

  const { business, tempPass, days } = info;
  const baseUrl = window.location.origin;
  const loginUrl = `${baseUrl}/admin`;
  const menuUrl = `${baseUrl}/m/${business.slug}`;

  const messageText = `Sayın ${business.name} Yetkilisi,

QR Menü ve Sipariş Yönetim Sistemi hesabınız açılmıştır.

Giriş Adresi: ${loginUrl}
Kullanıcı Adı: ${business.username}
Geçici Şifre: ${tempPass}
Tanımlanan Süre: ${days} Gün
Masa Limiti: ${business.table_limit ? `${business.table_limit} Masa` : 'Sınırsız'}
Menü Bağlantınız: ${menuUrl}

İlk girişinizde iletişim bilgilerinizi ve kategorilerinizi düzenleyebilir, masalarınız için QR kodlarınızı yazdırabilirsiniz.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12161F] border border-[#212634] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#212634] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">İşletme Hesabı Oluşturuldu</h2>
              <p className="text-[11px] text-slate-400">Giriş bilgileri hazırlandı</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1A202C] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 mb-5">
          <div className="bg-[#0A0D14] p-4 rounded-xl border border-[#212634] space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">İşletme Adı:</span>
              <span className="font-semibold text-slate-100">{business.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Kullanıcı Adı:</span>
              <span className="font-mono font-semibold text-indigo-400">{business.username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Geçici Şifre:</span>
              <span className="font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {tempPass}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Masa Limiti:</span>
              <span className="text-slate-200">{business.table_limit || 'Sınırsız'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Tanımlanan Süre:</span>
              <span className="text-slate-200">{days} Gün</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Panoya Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Giriş Bilgilerini Kopyala</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#1A202C] hover:bg-[#252D3D] text-slate-300 text-xs font-medium transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
