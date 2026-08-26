import React, { useState } from 'react';
import { Wifi, Copy, Check, X } from 'lucide-react';

interface WifiModalProps {
  isOpen: boolean;
  onClose: () => void;
  ssid: string;
  password: string;
}

export const WifiModal: React.FC<WifiModalProps> = ({
  isOpen,
  onClose,
  ssid,
  password,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 text-center animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
          <Wifi className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-slate-900">Restoran Wi-Fi Ağı</h3>
        <p className="text-xs text-slate-500 mt-0.5">Ücretsiz ve hızlı internet bağlantısı</p>

        <div className="mt-4 bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-left space-y-2.5">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Ağ Adı (SSID)
            </span>
            <span className="text-sm font-bold text-slate-800">{ssid || 'Lezzet_Guest_WiFi'}</span>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Şifre
              </span>
              <span className="text-sm font-bold text-orange-600 font-mono">
                {password || 'Gusto2026!'}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                copied
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Kopyalandı
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Kopyala
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-3.5">
          Ağ ayarlarınızdan Wi-Fi ismini seçip şifreyi yapıştırarak kolayca bağlanabilirsiniz.
        </p>
      </div>
    </div>
  );
};
