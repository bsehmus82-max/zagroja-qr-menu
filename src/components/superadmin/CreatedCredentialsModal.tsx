import React, { useState } from 'react';
import { CheckCircle, Copy, Check, X, Shield, ExternalLink, QrCode } from 'lucide-react';
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

  const messageText = `🎉 Sayın ${business.name} Yetkilisi,

Zagroja QR Menü & Restoran Yönetim Sistemi hesabınız başarıyla oluşturulmuştur.

🔗 İşletme Giriş Paneli: ${loginUrl}
👤 Kullanıcı Adı: ${business.username}
🔑 Geçici Giriş Şifresi: ${tempPass}
📅 Tanımlanan Süre: ${days} Gün
🏷️ Masa Sınırı: ${business.table_limit ? `${business.table_limit} Masa` : 'Sınırsız'}
📱 Canlı Müşteri QR Menünüz: ${menuUrl}

İlk girişinizde işletme profilinizi (telefon, adres, çalışma saatleri ve menü kategorilerinizi) tamamlayıp masalarınız için estetik QR kodlarınızı anında yazdırabilirsiniz.

İyi çalışmalar dileriz.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">İşletme Başarıyla Açıldı!</h2>
              <p className="text-xs text-neutral-400">Giriş bilgileri hazırlandı</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">İşletme Adı:</span>
              <span className="font-bold text-white">{business.name}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">Kullanıcı Adı:</span>
              <span className="font-mono font-bold text-brand-400">{business.username}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">Geçici Şifre:</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {tempPass}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">Masa Limiti:</span>
              <span className="text-white">{business.table_limit || 'Sınırsız'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">Abonelik Süresi:</span>
              <span className="text-white">{days} Gün</span>
            </div>
          </div>

          <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-brand-300">
            <Shield className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <span>
              Bu bilgileri işletme sahibine WhatsApp, SMS veya Canlı Destek üzerinden iletiniz. İşletme giriş yaptığında şifresini kendisi güncelleyebilir.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className={`flex-1 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white shadow-lg shadow-brand-600/30'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Mesaj Panoya Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Giriş Metnini Kopyala (WhatsApp / Destek)</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
