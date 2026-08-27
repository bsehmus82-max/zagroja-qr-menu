import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, RefreshCw } from 'lucide-react';
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
      <div className="py-20 text-center text-slate-500 bg-[#12161F] border border-[#212634] rounded-2xl p-8">
        <MessageSquare className="w-10 h-10 mx-auto mb-2.5 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-200">Kayıtlı İşletme Bulunmuyor</h3>
        <p className="text-xs text-slate-400 mt-1">
          İşletme hesabı açıldığında buradan doğrudan mesajlaşabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#12161F] border border-[#212634] rounded-2xl h-[650px] flex overflow-hidden shadow-xl">
      {/* Left Sidebar: Business List */}
      <div className="w-72 border-r border-[#212634] flex flex-col bg-[#0D1017]">
        <div className="p-4 border-b border-[#212634]">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
            İşletmeler ({businesses.length})
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#1A202C]">
          {businesses.map((biz) => {
            const isSelected = activeBusiness?.id === biz.id;
            return (
              <div
                key={biz.id}
                onClick={() => onSelectBiz(biz)}
                className={`p-3.5 cursor-pointer transition flex items-center gap-3 ${
                  isSelected ? 'bg-[#181E2B] border-l-2 border-indigo-500' : 'hover:bg-[#12161F]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-[#1A202C] text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 border border-[#262E3E]">
                  {biz.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs text-slate-200 truncate">{biz.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate">@{biz.username}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0A0D14]">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-[#212634] bg-[#12161F] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
              {activeBusiness?.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-xs text-slate-100">{activeBusiness?.name}</h3>
              <p className="text-[10px] text-slate-400">
                @{activeBusiness?.username} • {activeBusiness?.table_limit ? `${activeBusiness?.table_limit} Masa` : 'Sınırsız'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-2 text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-xs">Yükleniyor...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              Bu işletme ile henüz bir mesaj geçmişi bulunmuyor.
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender === 'superadmin';
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-md rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                        : 'bg-[#181E2B] text-slate-200 border border-[#262E3E] rounded-bl-none'
                    }`}
                  >
                    <div className="text-[10px] font-semibold opacity-75 mb-1">
                      {isMe ? 'Siz (Yönetici)' : activeBusiness?.name}
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

        {/* Input Footer */}
        <form onSubmit={handleSendMessage} className="p-3.5 border-t border-[#212634] bg-[#12161F] flex items-center gap-2.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Mesajınızı yazınız..."
            className="flex-1 bg-[#0A0D14] border border-[#212634] focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-sm transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
