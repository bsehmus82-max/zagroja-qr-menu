import React, { useState, useEffect, useRef } from 'react';
import { Send, Building2, User, RefreshCw, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Business, SupportMessage } from '../../types';
import { sound } from '../../lib/audio';

interface SuperAdminChatProps {
  businesses: Business[];
  selectedBiz: Business | null;
  onSelectBiz: (biz: Business) => void;
}

export const SuperAdminChat: React.FC<SuperAdminChatProps> = ({
  businesses,
  selectedBiz,
  onSelectBiz,
}) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeBusiness = selectedBiz || (businesses.length > 0 ? businesses[0] : null);

  useEffect(() => {
    if (!activeBusiness) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('support_messages')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: true });

        if (data) setMessages(data as SupportMessage[]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to realtime messages for this business
    const channel = supabase
      .channel(`chat-admin-${activeBusiness.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `business_id=eq.${activeBusiness.id}`,
        },
        (payload) => {
          const newMsg = payload.new as SupportMessage;
          setMessages((prev) => [...prev, newMsg]);
          if (newMsg.sender === 'business') {
            sound.playMessageTone();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBusiness?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeBusiness) return;

    const text = inputText.trim();
    setInputText('');

    const newMsg = {
      business_id: activeBusiness.id,
      sender: 'superadmin',
      sender_name: 'Zagroja Yönetici',
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

  if (businesses.length === 0) {
    return (
      <div className="py-20 text-center text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
        <h3 className="text-base font-bold text-white">Henüz Kayıtlı İşletme Yok</h3>
        <p className="text-xs text-neutral-400 mt-1">
          İşletme hesabı açıldığında burada canlı mesajlaşabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl h-[700px] flex overflow-hidden shadow-2xl">
      {/* Left Sidebar: Business List */}
      <div className="w-80 border-r border-neutral-800 flex flex-col bg-neutral-950/40">
        <div className="p-4 border-b border-neutral-800">
          <h3 className="font-black text-sm text-white">İşletmeler ({businesses.length})</h3>
          <p className="text-[11px] text-neutral-400">Birebir canlı destek sohbetleri</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-neutral-850">
          {businesses.map((biz) => {
            const isSelected = activeBusiness?.id === biz.id;
            return (
              <div
                key={biz.id}
                onClick={() => onSelectBiz(biz)}
                className={`p-4 cursor-pointer transition flex items-center gap-3 ${
                  isSelected ? 'bg-neutral-800/80 border-l-4 border-brand-500' : 'hover:bg-neutral-900/50'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-neutral-800 flex items-center justify-center text-brand-400 font-bold shrink-0 border border-neutral-750">
                  {biz.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-white truncate">{biz.name}</h4>
                  <p className="text-[10px] text-neutral-400 truncate">@{biz.username}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col bg-neutral-900/40">
        {/* Chat Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600/20 text-brand-400 flex items-center justify-center font-bold">
              {activeBusiness?.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{activeBusiness?.name}</h3>
              <p className="text-[10px] text-neutral-400">
                Yetkili: @{activeBusiness?.username} | Masa Limiti: {activeBusiness?.table_limit || 'Sınırsız'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-2 text-neutral-500">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-500" />
              <span className="text-xs">Sohbet yükleniyor...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center text-neutral-500 text-xs">
              Bu işletme ile henüz bir mesajlaşma bulunmuyor. İlk mesajı aşağıdan yazabilirsiniz.
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender === 'superadmin';
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-md rounded-2xl p-4 text-xs shadow-md ${
                      isMe
                        ? 'bg-brand-600 text-white rounded-br-none'
                        : 'bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-bl-none'
                    }`}
                  >
                    <div className="text-[10px] font-bold opacity-75 mb-1">
                      {isMe ? 'Zagroja Yönetici' : activeBusiness?.name}
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

        {/* Input Footer */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-800 bg-neutral-900/80 flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`${activeBusiness?.name} işletmesine yanıt yaz...`}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 transition"
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
