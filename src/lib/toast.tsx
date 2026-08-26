import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export const useToast = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast needs ToastProvider');
  return c;
};

// Singleton for use in non-React code (store.ts, supabase.ts, etc.)
let _singleton: ToastCtx['toast'] | null = null;
export const _registerToast = (fn: ToastCtx['toast']) => { _singleton = fn; };
export const showToast = (msg: string, type: ToastType = 'info') => {
  _singleton ? _singleton(msg, type) : console.warn('[toast]', msg);
};

const BG: Record<ToastType, string> = {
  success: 'bg-emerald-600',
  error:   'bg-red-600',
  warning: 'bg-amber-500',
  info:    'bg-blue-600',
};

const Icon: Record<ToastType, React.FC<{ className?: string }>> = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    setItems(p => p.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `t${Date.now()}${Math.random()}`;
    setItems(p => [...p.slice(-4), { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const success = useCallback((m: string) => toast(m, 'success'), [toast]);
  const error   = useCallback((m: string) => toast(m, 'error'),   [toast]);
  const warning = useCallback((m: string) => toast(m, 'warning'), [toast]);
  const info    = useCallback((m: string) => toast(m, 'info'),    [toast]);

  // Register singleton
  _registerToast(toast);

  return (
    <Ctx.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
        {items.map(t => {
          const I = Icon[t.type];
          return (
            <div key={t.id} className={`${BG[t.type]} flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-medium pointer-events-auto`}>
              <I className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
};