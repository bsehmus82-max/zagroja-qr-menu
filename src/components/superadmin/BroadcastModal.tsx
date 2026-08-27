import React, { useState } from 'react';
import { Radio, Send } from 'lucide-react';
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
  const [broadcastText, setBroadcastText] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim() || businesses.length === 0) return;

    setSending(true);
    try {
      const messagesToInsert = businesses.map((b) => ({
        business_id: b.id,
        sender: 'superadmin',
        message: `?? [SÝSTEM DUYURUSU]\n${broadcastText.trim()}`,
        is_read: false,
      }));

      const { error } = await supabase.from('support_messages').insert(messagesToInsert);
      if (!error) {
        alert(`Duyuru ${businesses.length} iþletmenin Canlý Destek ekranýna baþarýyla iletildi!`);
        setBroadcastText('');
        onClose();
      } else {
        alert('Duyuru gönderilirken bir hata oluþtu.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
        <h2 className="text-lg font-black text-white tracking-tight mb-1 flex items-center gap-2">
          <Radio className="w-5 h-5 text-purple-400" />
          Tüm Ýþletmelere Toplu Sistem Duyurusu
        </h2>
        <p className="text-xs text-neutral-400 mb-6">
          Bu mesaj, sistemdeki tüm kayýtlý iþletmelerin <strong>Canlý Destek</strong> paneline tek tek ayrý sohbet mesajý olarak anýnda iletilecektir.
        </p>

        <form onSubmit={handleSend} className="space-y-4">
          <textarea
            required
            rows={4}
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder="Örn: Sayýn iþletme yöneticimiz, planlý altyapý güçlendirmesi nedeniyle..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 transition"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 transition"
            >
              Ýptal
            </button>
            <button
              type="submit"
              disabled={sending || !broadcastText.trim()}
              className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Ýletiliyor...' : 'Tümüne Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
