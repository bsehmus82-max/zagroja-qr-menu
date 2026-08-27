import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number; // 10000 ms (10 seconds)
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeProgress, setActiveProgress] = useState(100);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 10000) => {
      const id = `toast_${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  // 10-Second Sequential Countdown Queue
  // The first notification (toasts[0]) counts down for 10 seconds.
  // Subsequent notifications wait underneath. When the active one expires, the next one moves up and counts for 10 seconds.
  useEffect(() => {
    if (toasts.length === 0) {
      setActiveProgress(100);
      return;
    }

    const currentToast = toasts[0];
    const duration = currentToast.duration || 10000;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setActiveProgress(remaining);

      if (elapsed >= duration) {
        clearInterval(interval);
        removeToast(currentToast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toasts, removeToast]);

  const success = useCallback((msg: string) => showToast(msg, 'success', 10000), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error', 10000), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info', 10000), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning', 10000), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}

      {/* Floating Notification Queue Container (Top-Right, 10s per item) */}
      <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((toast, index) => {
          const isActive = index === 0;
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto relative overflow-hidden p-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-start gap-3 transition-all duration-300 transform ${
                isActive ? 'scale-100 opacity-100 shadow-lg' : 'scale-98 opacity-80'
              } ${
                isSuccess
                  ? 'bg-[#0A1A12]/95 border-emerald-500/40 text-slate-100 shadow-emerald-950/50'
                  : isError
                  ? 'bg-[#1C0D0F]/95 border-rose-500/40 text-slate-100 shadow-rose-950/50'
                  : isWarning
                  ? 'bg-[#1C1408]/95 border-amber-500/40 text-slate-100 shadow-amber-950/50'
                  : 'bg-[#0B101C]/95 border-indigo-500/40 text-slate-100 shadow-indigo-950/50'
              }`}
            >
              {/* Animated 10s Progress Bar on Active Notification */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-white/30 to-white/80 transition-all duration-75"
                  style={{ width: `${activeProgress}%` }}
                />
              )}

              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-indigo-400" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
                {index > 0 && (
                  <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                    Sırada ({index}. bildirim)
                  </span>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-white p-1 rounded-lg transition hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
