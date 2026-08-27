import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
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

  const daysLeft = Math.ceil(
    (new Date(business.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpiringSoon = daysLeft <= 3;

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

    const channel = supabase
      .channel(`chat-biz-${business.id}`)
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

    const payload = {
      business_id: business.id,
      sender: 'business',
      sender_name: business.name,
      message: text,
      is_read: false,
    };

    const { data, error } = await supabase
      .from('support_messages')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as SupportMessage]);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Expiration warning banner if <= 3 days */}
      {isExpiringSoon && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              Abonelik sürenizin bitmesine <strong>{Math.max(0, daysLeft)} gün</strong> kaldı. Süre uzatmak için buradan mesaj gönderebilirsiniz.
            </span>
          </div>
        </div>
      )}

      {/* Main Chat Box */}
      <div className="bg-[#111622] border border-[#1E2638] rounded-2xl h-[600px] flex flex-col overflow-hidden shadow-2xl">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-[#1E2638] bg-[#141A29] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white">Sistem & Teknik Destek</h3>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Doğrudan Platform Yöneticisi ile İletişim
              </p>
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#0B0E14]">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
              <span>Yükleniyor...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-24 text-center text-slate-500 text-xs space-y-1">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <h4 className="text-slate-300 font-semibold">Canlı Destek Hattı</h4>
              <p className="text-slate-500 max-w-xs mx-auto">
                Masa artırma, süre uzatma veya teknik konularda doğrudan mesaj yazabilirsiniz.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender === 'business';
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-md rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                        : 'bg-[#151C2C] text-slate-200 border border-[#212C42] rounded-bl-none'
                    }`}
                  >
                    <div className="text-[10px] font-semibold opacity-75 mb-1">
                      {isMe ? 'Siz' : 'Sistem Yöneticisi'}
                    </div>
                    <p className="whitespace-pre-wrap">{m.message}</p>
                    <div className="text-[9px] opacity-60 text-right mt-1 font-mono">
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
        <form onSubmit={handleSendMessage} className="p-3.5 border-t border-[#1E2638] bg-[#141A29] flex items-center gap-2.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Mesajınızı yazınız..."
            className="flex-1 bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-md shadow-indigo-600/20 transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
