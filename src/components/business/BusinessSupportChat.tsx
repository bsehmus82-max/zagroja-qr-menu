import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check 3 days expiry warning
  const daysLeft = Math.ceil(
    (new Date(business.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpiringSoon = daysLeft <= 3 && daysLeft >= 0;
  const isExpired = daysLeft < 0;

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('support_messages')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: true });

        if (data) setMessages(data as SupportMessage[]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to realtime messages for this business
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
          setMessages((prev) => [...prev, newMsg]);
          if (newMsg.sender === 'superadmin') {
            sound.playMessageTone();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

    const newMsg = {
      business_id: business.id,
      sender: 'business',
      sender_name: business.name,
      message: text,
      is_read: false,
    };

    const { data, error } = await supabase
      .from('support_messages')
      .insert([newMsg])
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as SupportMessage]);
    }
  };

  return (
    <div className="max-w-4xl space-y-4">
      {/* Expiry Warning Banner (Son 3 gün kala bildirim) */}
      {isExpiringSoon && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center gap-3 text-xs text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <span>
            <strong>Dikkat:</strong> Abonelik sürenizin bitmesine <strong>{daysLeft} gün</strong> kaldı. Paneli kesintisiz kullanmaya devam etmek için lütfen buradan yöneticimizle iletişime geçiniz.
          </span>
        </div>
      )}

      {isExpired && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-3xl flex items-center gap-3 text-xs text-red-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
          <span>
            <strong>Abonelik Süreniz Doldu:</strong> Paneli ve QR menünüzü aktif tutmak için lütfen aşağıdaki canlı destek hattından yöneticimizle görüşünüz.
          </span>
        </div>
      )}

      {/* Main Chat Box */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl h-[600px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Canlı Destek Hattı</h3>
              <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Yetkili Sistem Yöneticisi ile Birebir İletişim
              </p>
            </div>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-2 text-neutral-500">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-500" />
              <span className="text-xs">Sohbet yükleniyor...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center text-neutral-500 text-xs">
              Henüz mesaj bulunmuyor. Masa artırımı, süre uzatma veya yardım için mesaj yazabilirsiniz.
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender === 'business';
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-md rounded-2xl p-4 text-xs shadow-md ${
                      isMe
                        ? 'bg-brand-600 text-white rounded-br-none'
                        : 'bg-neutral-800 text-neutral-200 border border-neutral-750 rounded-bl-none'
                    }`}
                  >
                    <div className="text-[10px] font-bold opacity-75 mb-1">
                      {isMe ? business.name : 'Canlı Destek (Sistem Yöneticisi)'}
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                    <div className="text-[9px] opacity-60 text-right mt-1.5 font-mono">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Mesajınızı buraya yazınız..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-brand-500 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-2xl shadow-lg shadow-brand-600/30 transition transform active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
