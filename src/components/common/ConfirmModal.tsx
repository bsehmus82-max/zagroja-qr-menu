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
      <div className="bg-[#111622] rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 font-medium text-slate-200">
        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              type === 'danger'
                ? 'bg-rose-500/15 text-rose-400'
                : 'bg-[#1C2433] text-slate-200'
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
            <h3 className="font-extrabold text-sm text-white">{title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer ${
              type === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-white hover:bg-slate-200 text-slate-900'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
