import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { Business, SupportMessage } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../lib/audio';

interface BusinessSupportChatProps {
  business: Business;
}

export const BusinessSupportChat: React.FC<BusinessSupportChatProps> = ({ business }) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const daysLeft = Math.ceil(
    (new Date(business.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpiringSoon = daysLeft <= 3 && daysLeft >= 0;

  // Fetch chat history
  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data as SupportMessage[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [business.id]);

  // Realtime subscription for incoming support messages
  useEffect(() => {
    const channel = supabase
      .channel(`business-chat-${business.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          const newMsg = payload.new as SupportMessage;
          if (newMsg.sender === 'superadmin') {
            sound.playMessageTone();
          }
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setSending(true);
    try {
      const payload = {
        business_id: business.id,
        sender: 'business',
        message: inputText.trim(),
        is_read: false,
      };

      const { data, error } = await supabase
        .from('support_messages')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        setMessages((prev) => [...prev, data as SupportMessage]);
        setInputText('');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden flex flex-col min-h-[600px] max-w-4xl mx-auto shadow-2xl">
      {/* Header */}
      <div className="p-5 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-white">Canlý Destek Hattý</h3>
            <p className="text-[11px] text-neutral-400">
              Platform teknik destek ekibi ile 7/24 kesintisiz iletiþim kanalý
            </p>
          </div>
        </div>

        <div className="text-right text-xs">
          <span className="text-neutral-400">Abonelik: </span>
          <span className={`font-bold ${isExpiringSoon ? 'text-red-400' : 'text-emerald-400'}`}>
            {daysLeft > 0 ? `${daysLeft} Gün Kaldý` : 'Süresi Doldu'}
          </span>
        </div>
      </div>

      {/* Expiry Warning Banner */}
      {isExpiringSoon && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/20 flex items-center gap-3 text-red-300 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
          <span>
            <strong>Aboneliðinizin bitmesine {daysLeft} gün kaldý!</strong> Paneli kesintisiz kullanmaya devam etmek için lütfen bizimle buradan iletiþime geçiniz.
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[480px]">
        {loading ? (
          <div className="py-20 text-center text-neutral-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
            <span className="text-xs">Mesajlar yükleniyor...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center text-neutral-500 text-xs max-w-sm mx-auto">
            Canlý destek hattýmýza hoþ geldiniz. Her türlü soru, güncelleme talebi veya teknik konuda buradan mesaj gönderebilirsiniz.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === 'business';
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-md rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-br-none shadow-md shadow-brand-600/20'
                      : 'bg-neutral-950 text-neutral-200 rounded-bl-none border border-neutral-800'
                  }`}
                >
                  <div className="font-bold text-[10px] opacity-75 mb-1">
                    {isMe ? business.name : 'Canlý Destek'}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.message}</div>
                  <div className="text-[9px] opacity-60 text-right mt-1">
                    {new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-neutral-800 bg-neutral-900 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Canlý desteðe mesajýnýzý yazýn..."
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 transition"
        />
        <button
          type="submit"
          disabled={sending || !inputText.trim()}
          className="bg-brand-600 hover:bg-brand-500 text-white px-6 rounded-2xl font-bold text-xs flex items-center gap-2 transition disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
          Gönder
        </button>
      </form>
    </div>
  );
};
