import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, RefreshCw, CheckCheck, Clock, 
  MessageSquare, User, Building2, Search 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Business, SupportMessage } from '../../types';

interface SuperAdminChatProps {
  businesses: Business[];
}

export const SuperAdminChat: React.FC<SuperAdminChatProps> = ({ businesses }) => {
  const [selectedBizId, setSelectedBizId] = useState<string>(businesses[0]?.id || '');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (bizId: string) => {
    if (!bizId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('business_id', bizId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as SupportMessage[]);

        // Mark as read
        await supabase
          .from('support_messages')
          .update({ is_read: true })
          .eq('business_id', bizId)
          .eq('sender', 'business')
          .eq('is_read', false);
      }
    } catch (err) {
      console.warn('Superadmin chat fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBizId) {
      fetchMessages(selectedBizId);

      const channel = supabase
        .channel(`sa_support_${selectedBizId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `business_id=eq.${selectedBizId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as SupportMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedBizId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedBizId) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await supabase.from('support_messages').insert([
        {
          business_id: selectedBizId,
          sender: 'superadmin',
          message: text,
          status: 'open',
          is_read: false,
        },
      ]);
    } catch (err) {
      console.warn('Superadmin send message error:', err);
    }
  };

  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.username.toLowerCase().includes(search.toLowerCase())
  );

  const activeBusiness = businesses.find((b) => b.id === selectedBizId);

  return (
    <div className="bg-[#1E293B] border border-slate-800 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[680px] shadow-2xl">
      {/* Left Sidebar: Business List */}
      <div className="border-r border-slate-800 flex flex-col h-full bg-[#0F172A]">
        <div className="p-3.5 border-b border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İşletme veya kullanıcı ara..."
              className="w-full bg-[#1E293B] border border-slate-700/80 focus:border-orange-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
          {filteredBusinesses.map((biz) => {
            const isSelected = biz.id === selectedBizId;
            return (
              <button
                key={biz.id}
                onClick={() => setSelectedBizId(biz.id)}
                className={`w-full text-left p-3 transition flex items-center gap-3 ${
                  isSelected ? 'bg-orange-500/10 border-l-2 border-orange-500' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">
                  {biz.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-200 truncate">{biz.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{biz.username}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="md:col-span-2 flex flex-col h-full bg-[#1E293B]">
        {/* Chat Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#1E293B]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs border border-orange-500/20 shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100">{activeBusiness?.name || 'İşletme Seçin'}</h3>
              <p className="text-[10px] text-slate-400">Canlı Destek & Destek Talepleri</p>
            </div>
          </div>

          <button
            onClick={() => selectedBizId && fetchMessages(selectedBizId)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0F172A]/40">
          {loading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-700" />
              <span>Bu işletme ile henüz bir mesajlaşma bulunmuyor.</span>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender === 'superadmin';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isMe
                        ? 'bg-orange-500 text-white rounded-br-none shadow-md shadow-orange-500/15'
                        : 'bg-[#0F172A] border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.message}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-500">
                    <Clock className="w-2.5 h-2.5" />
                    <span>
                      {new Date(m.created_at).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && m.is_read && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center gap-2 bg-[#1E293B]">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="İşletmeye yanıt yazın..."
            className="flex-1 bg-[#0F172A] border border-slate-700/80 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition font-medium"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !selectedBizId}
            className="p-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl shadow-md shadow-orange-500/25 transition shrink-0 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
