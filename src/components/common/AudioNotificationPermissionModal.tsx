import React, { useState, useEffect } from 'react';
import { Volume2, BellRing, Sparkles, X, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { 
  requestNotificationPermission, 
  getNotificationPermissionStatus, 
  sendNativeNotification,
  isDesktopApp
} from '../../lib/notifications';
import { sound } from '../../lib/audio';
import { useToast } from '../../context/ToastContext';

interface AudioNotificationPermissionModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const AudioNotificationPermissionModal: React.FC<AudioNotificationPermissionModalProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // If running inside desktop .exe application, permissions are handled natively by Windows
    if (isDesktopApp()) {
      setIsOpen(false);
      return;
    }

    const status = getNotificationPermissionStatus();
    const isDismissed = localStorage.getItem('restiva_audio_guide_dismissed') === 'true';

    if ((status !== 'granted' && !isDismissed) || forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  if (!isOpen || isDesktopApp()) return null;

  const handleDismiss = () => {
    localStorage.setItem('restiva_audio_guide_dismissed', 'true');
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleEnableAndTest = async () => {
    setIsActivating(true);

    try {
      // 1. Play sound immediately on user interaction to unlock Web Audio API Context
      sound.playOrderBell();

      // 2. Request native browser notification permission
      const granted = await requestNotificationPermission();

      if (granted) {
        setIsSuccess(true);
        sound.playWaiterCall();
        toast.success('Ses ve bildirim izinleri başarıyla etkinleştirildi.');
        
        sendNativeNotification({
          title: 'RestivAdisyon Bildirimleri Aktif',
          body: 'Yeni sipariş ve garson çağrıları anlık olarak sesli çalacaktır.',
        });

        localStorage.setItem('restiva_audio_guide_dismissed', 'true');

        setTimeout(() => {
          setIsOpen(false);
          if (onClose) onClose();
        }, 1200);
      } else {
        toast.warning('Tarayıcı bildirim izni verilmedi. Sipariş sesleri yine de sayfa açıkken çalacaktır.');
        handleDismiss();
      }
    } catch {
      toast.error('İzin açılırken bir hata oluştu.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-medium text-slate-200">
      <div className="bg-[#111622] border border-[#1F293D] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
        {/* Header Border */}
        <div className="h-1 w-full bg-white/20" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#1C2433] hover:bg-[#253043] text-slate-400 hover:text-white transition border border-[#2B384E]"
          title="Kapat"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Title & Icon */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#1C2433] border border-[#2B384E] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Canlı Sipariş & Bildirim Sesi
              </h2>
              <p className="text-xs text-slate-400">
                Siparişlerin anında sesli çalması için ses motorunu test edip başlatın
              </p>
            </div>
          </div>

          {/* Clean Step Cards */}
          <div className="space-y-2.5">
            <div className="bg-[#0C1017] border border-[#1F293D] rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#1C2433] text-white flex items-center justify-center shrink-0 font-bold text-xs border border-[#2B384E]">
                1
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">Ses Motorunu Etkinleştir</span>
                <span className="text-slate-400 text-[11px]">Tarayıcı ses çıkışını aktif eder ve test melodisini çalar.</span>
              </div>
            </div>

            <div className="bg-[#0C1017] border border-[#1F293D] rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#1C2433] text-white flex items-center justify-center shrink-0 font-bold text-xs border border-[#2B384E]">
                2
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">Arka Plan Bildirimleri</span>
                <span className="text-slate-400 text-[11px]">Sekme arka plandayken dahi sipariş ve çağrı uyarıları ekrana gelir.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleEnableAndTest}
              disabled={isActivating || isSuccess}
              className={`w-full py-3.5 px-5 rounded-2xl font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-sm ${
                isSuccess
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-200 text-slate-900 active:scale-[0.99]'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ses Motoru Aktif Edildi!</span>
                </>
              ) : isActivating ? (
                <span>Test Ediliyor...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Sesi Test Et & İzinleri Başlat</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
            >
              Şimdilik Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
