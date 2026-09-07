import React from 'react';
import { HelpCircle, Mail, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onGoHome?: () => void;
  message?: string;
  supportEmail?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onGoHome,
  message = 'Ulaşmaya çalıştığınız sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak kullanım dışı kalmış olabilir.',
  supportEmail = 'destek@restivadisyon.com',
}) => {
  const handleNavigateHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#0C1017] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-md bg-[#111622] border border-white/[0.06] rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#1C2433] text-slate-300 flex items-center justify-center mx-auto border border-white/[0.04]">
          <HelpCircle className="w-7 h-7" />
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Üzgünüz, Bu Sayfa Bulunamadı
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
          <p className="text-xs text-slate-500">
            Eğer bir sorun olduğunu düşünüyorsanız lütfen bize bunu bildirin.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={handleNavigateHome}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfaya Dön</span>
          </button>

          <a
            href={`mailto:${supportEmail}?subject=${encodeURIComponent('RestivAdisyon Sayfa Hatası Bildirimi')}`}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1C2433] hover:bg-[#253043] border border-white/[0.06] text-slate-200 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Mail className="w-4 h-4 text-slate-400" />
            <span>Sorun Bildir</span>
          </a>
        </div>
      </div>
    </div>
  );
};
