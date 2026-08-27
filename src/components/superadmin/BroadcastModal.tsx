import React, { useState } from 'react';
import { Radio, X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Business } from '../../types';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  businesses,
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError('');

    try {
      const activeBiz = businesses.filter((b) => b.subscription_status === 'active');
      if (activeBiz.length === 0) {
        throw new Error('Aktif durumda işletme bulunmuyor.');
      }

      const rows = activeBiz.map((biz) => ({
        business_id: biz.id,
        sender: 'superadmin',
        message: `[SİSTEM DUYURUSU]\n${message.trim()}`,
        is_read: false,
      }));

      const { error: insertError } = await supabase.from('support_messages').insert(rows);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
        onClose();
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Duyuru iletilirken hata oluştu.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12161F] border border-[#212634] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#212634] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Toplu Sistem Duyurusu</h2>
              <p className="text-[11px] text-slate-400">Tüm aktif işletmelere anında mesaj iletir</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1A202C] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-100">Duyuru Gönderildi</h3>
            <p className="text-xs text-slate-400">
              Tüm işletmelerin destek ekranına mesajınız iletildi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                Duyuru İçeriği
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="İşletmelere iletmek istediğiniz duyuruyu yazınız..."
                className="w-full bg-[#0A0D14] border border-[#212634] focus:border-purple-500/60 rounded-xl p-3.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition resize-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {businesses.filter((b) => b.subscription_status === 'active').length} adet aktif işletmeye gönderilecek.
              </span>
            </div>

            <div className="pt-3 border-t border-[#212634] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#1A202C] hover:bg-[#252D3D] text-xs font-medium text-slate-300 transition"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? 'Gönderiliyor...' : 'Duyuruyu Gönder'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
