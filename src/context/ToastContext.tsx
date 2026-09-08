import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  CheckCircle2, AlertCircle, Info, AlertTriangle, 
  X, ClipboardList, ArrowRight, UtensilsCrossed 
} from 'lucide-react';
import { Order } from '../types';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'order';

export interface OrderToastPayload {
  orderId: string;
  tableNo: string;
  totalAmount: number;
  paymentMethod?: string;
  items: Array<{ name: string; quantity: number; notes?: string; price?: number }>;
  customerNotes?: string;
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number; // 10000 ms default
  createdAt: number;
  orderPayload?: OrderToastPayload;
  onAction?: () => void;
  actionLabel?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showOrderToast: (order: Order, onGoToOrders?: () => void) => void;
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
      
      // Debounce identical duplicate messages within 2.5 seconds
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

  const showOrderToast = useCallback((order: Order, onGoToOrders?: () => void) => {
    const now = Date.now();
    const id = `order_toast_${order.id || now}`;
    
    // Prevent duplicate popup for exact same order id
    setToasts((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      return [
        ...prev,
        {
          id,
          message: `${order.table_no} için yeni sipariş`,
          type: 'order',
          duration: 12000,
          createdAt: now,
          orderPayload: {
            orderId: order.id,
            tableNo: order.table_no,
            totalAmount: order.total_amount,
            paymentMethod: order.payment_method,
            items: order.items.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              notes: i.notes,
              price: i.price,
            })),
            customerNotes: order.customer_notes,
          },
          onAction: onGoToOrders,
          actionLabel: 'Siparişi Gör',
        },
      ];
    });
  }, []);

  // 10-Second Sequential Countdown Queue (First item is topmost/active)
  const activeToast = toasts.length > 0 ? toasts[0] : null;
  const activeToastId = activeToast ? activeToast.id : null;

  useEffect(() => {
    if (!activeToast || !activeToastId) {
      activeToastRef.current = null;
      setActiveProgress(100);
      return;
    }

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
    <ToastContext.Provider value={{ showToast, showOrderToast, success, error, info, warning }}>
      {children}

      {/* Floating Notifications Container: Sağ Altta (Bottom-Right), Alt Alta Sıralı, Çizgisiz & MD Uyumlu */}
      <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((toast, index) => {
          const isActive = index === 0;
          const isOrder = toast.type === 'order';
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          // 1. DETAYLI GENİŞ SİPARİŞ POP-UP BİLDİRİMİ
          if (isOrder && toast.orderPayload) {
            const op = toast.orderPayload;
            return (
              <div
                key={toast.id}
                className={`pointer-events-auto relative overflow-hidden p-4 rounded-2xl shadow-2xl bg-[#111622] text-slate-100 transition-all duration-300 transform ${
                  isActive ? 'scale-100 opacity-100' : 'scale-98 opacity-85'
                }`}
              >
                {/* 10s Countdown Progress Bar */}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 h-0.5 bg-emerald-400/40 transition-all duration-75"
                    style={{ width: `${activeProgress}%` }}
                  />
                )}

                {/* Header: Masa No & Tutar */}
                <div className="flex items-center justify-between gap-2 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#1C2433] text-emerald-400 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white tracking-tight">
                        {op.tableNo}
                      </h4>
                      <p className="text-[10px] text-slate-400">Yeni Sipariş Geldi</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-emerald-400 bg-[#0C1017] px-2.5 py-1 rounded-xl">
                      {op.totalAmount.toFixed(2)} ₺
                    </span>
                    <button
                      onClick={() => removeToast(toast.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C2433] transition cursor-pointer"
                      title="Kapat"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Items Summary Breakdown */}
                <div className="bg-[#0C1017] rounded-xl p-2.5 space-y-1 max-h-32 overflow-y-auto mb-3 scrollbar-none">
                  {op.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-slate-200 font-bold truncate pr-2">
                        {it.quantity}x {it.name}
                      </span>
                      {it.price && (
                        <span className="text-slate-400 text-[11px] font-mono shrink-0">
                          {(it.price * it.quantity).toFixed(2)} ₺
                        </span>
                      )}
                    </div>
                  ))}
                  {op.customerNotes && (
                    <p className="text-[10px] text-amber-300 italic pt-1 border-t border-white/5">
                      Müşteri Notu: {op.customerNotes}
                    </p>
                  )}
                </div>

                {/* Action Button */}
                {toast.onAction && (
                  <button
                    onClick={() => {
                      toast.onAction?.();
                      removeToast(toast.id);
                    }}
                    className="w-full py-2.5 bg-[#1C2433] hover:bg-[#253043] text-slate-100 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <span>Siparişi Görüntüle</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                )}
              </div>
            );
          }

          // 2. GENEL STANDART BİLDİRİMLER (Garson Çağrısı, Sistem, Destek vb.)
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto relative overflow-hidden p-3.5 rounded-2xl shadow-2xl bg-[#111622] text-slate-100 flex items-start gap-3 transition-all duration-300 transform ${
                isActive ? 'scale-100 opacity-100' : 'scale-98 opacity-85'
              }`}
            >
              {/* 10s Countdown Progress Bar */}
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
                className="shrink-0 text-slate-400 hover:text-white p-1 rounded-lg transition hover:bg-[#1C2433] cursor-pointer"
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

