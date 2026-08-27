import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ShieldCheck, RefreshCw, CheckCheck } from 'lucide-react';
import { Business, SupportMessage } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../lib/audio';
import { sendNativeNotification } from '../../lib/notifications';
import { useToast } from '../../context/ToastContext';

interface BusinessSupportChatProps {
  business: Business;
}

export const BusinessSupportChat: React.FC<BusinessSupportChatProps> = ({ business }) => {
  const toast = useToast();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
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

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`support-chat-${business.id}`)
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
            toast.info('Sistem Yöneticisinden yeni mesaj geldi.');
            sendNativeNotification({
              title: 'Sistem Yöneticisinden Mesaj',
              body: newMsg.message.slice(0, 100),
              url: '/admin',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from('support_messages').insert([
        {
          business_id: business.id,
          sender: 'business',
          message: text.trim(),
          is_read: false,
        },
      ]);

      if (!error) {
        setText('');
      } else {
        toast.error('Mesaj iletilemedi.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[75vh] max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Restiva Canlı Destek & Sistem Duyuruları</h3>
            <p className="text-xs text-slate-400">Teknik destek ve platform yöneticisi ile anlık mesajlaşma</p>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-slate-50/30">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Mesaj geçmişi yükleniyor...</div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-xs text-slate-700">Henüz Mesajlaşma Bulunmuyor</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Sistem yöneticisine iletmek istediğiniz soru veya taleplerinizi aşağıdaki alandan yazabilirsiniz.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === 'business';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    isMe
                      ? 'bg-orange-500 text-white rounded-br-none shadow-md shadow-orange-500/20'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {!isMe && (
                    <div className="text-[10px] font-extrabold text-orange-600 mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Sistem Yöneticisi</span>
                    </div>
                  )}
                  <p>{msg.message}</p>
                  <div
                    className={`text-[9px] mt-1.5 flex items-center justify-end gap-1 ${
                      isMe ? 'text-orange-100' : 'text-slate-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-slate-100 bg-white flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mesajınızı yazın..."
          className="flex-1 bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Gönder</span>
        </button>
      </form>
    </div>
  );
};
