import React, { useState } from 'react';
import { Radio, X, Send, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
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
        sender_name: 'Zagroja Sistem Merkezi',
        message: `📢 [SİSTEM DUYURUSU]\n${message.trim()}`,
        is_read: false,
      }));

      const { error: insertError } = await supabase.from('support_messages').insert(rows);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Duyuru iletilirken hata oluştu.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Toplu Sistem Duyurusu</h2>
              <p className="text-xs text-neutral-400">Tüm aktif işletmelere anında bildirim</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-white">Duyuru Gönderildi!</h3>
            <p className="text-xs text-neutral-400">
              Tüm işletmelerin Canlı Destek ekranına mesajınız başarıyla iletildi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Duyuru Metni
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Örn: Bu gece saat 03:00'te sistemlerimizde performans iyileştirmesi yapılacaktır..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 transition resize-none"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Bu mesaj {businesses.filter((b) => b.subscription_status === 'active').length} adet aktif işletmeye ayrı ayrı gönderilecektir.
              </span>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 transition"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Gönderiliyor...' : 'Tüm İşletmelere Gönder'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
