import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number; // 10000 ms (10 seconds)
  createdAt: number;
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

  // References to preserve active toast timing across state updates
  const activeToastRef = useRef<string | null>(null);
  const activeStartTimeRef = useRef<number>(0);
  const recentMessagesRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => {
      const next = prev.filter((t) => t.id !== id);
      // Reset active refs if removing the active toast
      if (activeToastRef.current === id) {
        activeToastRef.current = next.length > 0 ? next[0].id : null;
        activeStartTimeRef.current = Date.now();
      }
      return next;
    });
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 10000) => {
      const now = Date.now();
      
      // Debounce identical duplicate messages within 2.5 seconds to prevent spam
      const lastSeen = recentMessagesRef.current.get(message);
      if (lastSeen && now - lastSeen < 2500) {
        return;
      }
      recentMessagesRef.current.set(message, now);

      const id = `toast_${now}_${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type, duration, createdAt: now }]);
    },
    []
  );

  // 10-Second Sequential Countdown Queue
  // The first (topmost) notification is the ONLY active one counting down for 10 seconds.
  // When a new notification arrives, the top notification's timer DOES NOT restart.
  // When the top notification finishes or is closed, the next notification moves to top and starts its 10 seconds.
  const activeToast = toasts.length > 0 ? toasts[0] : null;
  const activeToastId = activeToast ? activeToast.id : null;

  useEffect(() => {
    if (!activeToast || !activeToastId) {
      activeToastRef.current = null;
      setActiveProgress(100);
      return;
    }

    // If this is a new active toast, initialize its start time
    if (activeToastRef.current !== activeToastId) {
      activeToastRef.current = activeToastId;
      activeStartTimeRef.current = Date.now();
      setActiveProgress(100);
    }

    const duration = activeToast.duration || 10000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - activeStartTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setActiveProgress(remaining);

      if (elapsed >= duration) {
        clearInterval(interval);
        removeToast(activeToastId);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [activeToastId, activeToast?.duration, removeToast]);

  const success = useCallback((msg: string) => showToast(msg, 'success', 10000), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error', 10000), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info', 10000), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning', 10000), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}

      {/* Floating Notification Queue Container (Top-Right, 10s per item, First is Topmost) */}
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
                  ? 'bg-[#0C1512]/95 border-emerald-500/30 text-slate-100 shadow-black/60'
                  : isError
                  ? 'bg-[#180D10]/95 border-rose-500/30 text-slate-100 shadow-black/60'
                  : isWarning
                  ? 'bg-[#18140D]/95 border-amber-500/30 text-slate-100 shadow-black/60'
                  : 'bg-[#111622]/95 border-[#1F293D] text-slate-100 shadow-black/60'
              }`}
            >
              {/* Animated 10s Progress Bar on Active Notification */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-white/20 transition-all duration-75"
                  style={{ width: `${activeProgress}%` }}
                />
              )}

              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-slate-300" />}
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
                title="Kapat"
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
