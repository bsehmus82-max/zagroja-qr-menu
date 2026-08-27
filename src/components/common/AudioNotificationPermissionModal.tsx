import React, { useState, useEffect } from 'react';
import { Volume2, BellRing, Lock, ShieldCheck, Sparkles, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { 
  requestNotificationPermission, 
  getNotificationPermissionStatus, 
  sendNativeNotification,
  isNotificationSupported
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
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [isActivating, setIsActivating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const status = getNotificationPermissionStatus();
    setPermissionStatus(status);

    // If permission is not granted and not dismissed in this session, open guide
    const dismissedThisSession = sessionStorage.getItem('restiva_perm_guide_dismissed');
    if ((status !== 'granted' || forceOpen) && !dismissedThisSession) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('restiva_perm_guide_dismissed', 'true');
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
      const newStatus = getNotificationPermissionStatus();
      setPermissionStatus(newStatus);

      if (granted) {
        setIsSuccess(true);
        sound.playWaiterCall();
        toast.success('Ses ve bildirim izinleri başarıyla etkinleştirildi!');
        
        sendNativeNotification({
          title: 'RestivAdisyon Bildirimleri Aktif',
          body: 'Yeni sipariş ve garson çağrıları anlık olarak sesli ve bildirimli gelecektir.',
        });

        setTimeout(() => {
          setIsOpen(false);
          if (onClose) onClose();
        }, 1200);
      } else {
        toast.warning('Bildirim izni verilmedi. Lütfen adres çubuğundaki kilit simgesinden izin veriniz.');
      }
    } catch {
      toast.error('İzin açılırken bir hata oluştu.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B0F17] border border-[#1E293B] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative text-slate-200">
        {/* Top Decorative Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-indigo-500 to-emerald-500" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          title="Şimdilik Kapat"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0 shadow-inner">
              <Volume2 className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Canlı Ses & Bildirim İzinleri</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-extrabold uppercase">
                  Önemli
                </span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Yeni siparişler ve masa garson çağrılarının anında sesli çalması için tarayıcı izinlerinin aktif olması gerekmektedir.
              </p>
            </div>
          </div>

          {/* Visual Step-by-Step Guide Card */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 space-y-3.5">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Görsel İzin Kılavuzu</span>
            </div>

            {/* Simulated Address Bar Graphic */}
            <div className="bg-[#080B10] border border-slate-700/60 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 bg-[#161F30] px-3 py-1.5 rounded-lg border border-slate-700/80 text-[11px]">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400 truncate">https://restivadisyon.com</span>
                <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                  Site Ayarları
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <Volume2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-200">Sesler</div>
                    <div className="text-[10px] text-emerald-400 font-medium">İzin Verildi</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <BellRing className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-200">Bildirimler</div>
                    <div className="text-[10px] text-emerald-400 font-medium">İzin Verildi</div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              * Tarayıcınız arka plandayken veya sekme simge durumundayken siparişler ekranınızda anında açılır ve sesli ikaz verir.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleEnableAndTest}
              disabled={isActivating || isSuccess}
              className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shadow-xl ${
                isSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-orange-500 to-indigo-600 hover:from-orange-600 hover:to-indigo-700 text-white shadow-orange-500/20 active:scale-[0.99]'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>İzinler Aktifleştirildi & Test Edildi!</span>
                </>
              ) : isActivating ? (
                <span>İzinler Doğrulanıyor...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Ses & Bildirim İzinlerini Etkinleştir (Test Et)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
            >
              Şimdilik Kapat (Daha Sonra Hatırlat)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
