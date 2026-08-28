import React from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Evet, Onayla',
  cancelText = 'Vazgeç',
  type = 'warning',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
      <div className="bg-[#1E293B] border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              type === 'danger'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
            }`}
          >
            {type === 'danger' ? (
              <AlertCircle className="w-5 h-5" />
            ) : type === 'warning' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <HelpCircle className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-sm text-white">{title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition ${
              type === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                : type === 'warning'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20 text-black font-bold'
                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
