import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share, PlusSquare } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC<{ panelName?: string }> = ({ panelName = 'Yönetim Paneli' }) => {
  const toast = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    // Check if already installed as standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for Android/Desktop install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (isStandalone) {
    return null; // Already running as installed App
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('Uygulama cihazınıza başarıyla indirildi!');
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIosModal(true);
    } else {
      // Desktop / other
      toast.info('Tarayıcı menünüzden (sağ üstteki üç nokta) "Uygulamayı Yükle" veya "Masaüstüne Ekle" seçeneğine tıklayabilirsiniz.');
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/20 text-xs font-semibold transition"
        title="Uygulamayı Cihazına İndir"
      >
        <Download className="w-3.5 h-3.5 text-orange-400" />
        <span className="hidden sm:inline">Uygulamayı İndir</span>
        <span className="sm:hidden">İndir</span>
      </button>

      {/* iOS Installation Instructions Modal */}
      {showIosModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-sm text-white">iPhone / iPad'e İndir</h3>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {panelName} uygulamasını ana ekranınıza ekleyip tam ekran uygulama olarak kullanmak için:
            </p>

            <div className="space-y-3 bg-[#0F172A] p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  1
                </span>
                <span className="text-slate-200">
                  Safari alt çubuğundaki <Share className="w-3.5 h-3.5 inline text-orange-400 mx-1" /> <strong>Paylaş</strong> butonuna dokunun.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  2
                </span>
                <span className="text-slate-200">
                  Aşağı kaydırıp <PlusSquare className="w-3.5 h-3.5 inline text-orange-400 mx-1" /> <strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  3
                </span>
                <span className="text-slate-200">
                  Sağ üstteki <strong>"Ekle"</strong> butonuna basın. Uygulama telefonunuza yüklenecektir!
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-xs transition"
            >
              Tamam, Anladım
            </button>
          </div>
        </div>
      )}
    </>
  );
};
