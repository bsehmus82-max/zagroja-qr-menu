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
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [latestMessageMap, setLatestMessageMap] = useState<Record<string, { message: string; created_at: string; sender: string; subject?: string }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSupportSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('id, business_id, sender, is_read, message, subject, created_at, status')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const uMap: Record<string, number> = {};
        const lMap: Record<string, { message: string; created_at: string; sender: string; subject?: string }> = {};

        data.forEach((m: any) => {
          if (m.sender === 'business' && !m.is_read) {
            uMap[m.business_id] = (uMap[m.business_id] || 0) + 1;
          }
          if (!lMap[m.business_id]) {
            lMap[m.business_id] = {
              message: m.message,
              created_at: m.created_at,
              sender: m.sender,
              subject: m.subject,
            };
          }
        });

        setUnreadMap(uMap);
        setLatestMessageMap(lMap);
      }
    } catch (err) {
      console.warn('Superadmin fetch support summary error:', err);
    }
  };

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

        setUnreadMap((prev) => ({ ...prev, [bizId]: 0 }));
      }
    } catch (err) {
      console.warn('Superadmin chat fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Global listener for ALL support messages across any business
  useEffect(() => {
    fetchSupportSummary();

    const channel = supabase
      .channel('sa_all_support_listener')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
        },
        (payload) => {
          fetchSupportSummary();
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as SupportMessage;
            if (newMsg.business_id === selectedBizId) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBizId]);

  useEffect(() => {
    if (selectedBizId) {
      fetchMessages(selectedBizId);
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
      const { data, error } = await supabase.from('support_messages').insert([
        {
          business_id: selectedBizId,
          sender: 'superadmin',
          message: text,
          status: 'open',
          is_resolved: false,
          is_read: false,
        },
      ]).select().single();

      if (!error && data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data as SupportMessage];
        });
        fetchSupportSummary();
      }
    } catch (err) {
      console.warn('Superadmin send message error:', err);
    }
  };

  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.username.toLowerCase().includes(search.toLowerCase())
  );

  // Sort businesses: unread tickets first, then most recently messaged, then alphabetic
  const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
    const unreadA = unreadMap[a.id] || 0;
    const unreadB = unreadMap[b.id] || 0;
    if (unreadA !== unreadB) return unreadB - unreadA;

    const timeA = latestMessageMap[a.id]?.created_at || '';
    const timeB = latestMessageMap[b.id]?.created_at || '';
    if (timeA && timeB) return new Date(timeB).getTime() - new Date(timeA).getTime();
    if (timeA) return -1;
    if (timeB) return 1;

    return a.name.localeCompare(b.name);
  });

  const activeBusiness = businesses.find((b) => b.id === selectedBizId);

  return (
    <div className="bg-[#111622] border border-[#1F293D] rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[680px] shadow-2xl font-medium text-slate-200">
      {/* Left Sidebar: Business List */}
      <div className="border-r border-[#1F293D] flex flex-col h-full bg-[#0C1017]">
        <div className="p-3.5 border-b border-[#1F293D]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İşletme veya kullanıcı ara..."
              className="w-full bg-[#111622] border border-[#1F293D] focus:border-slate-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#1F293D]">
          {sortedBusinesses.map((biz) => {
            const isSelected = biz.id === selectedBizId;
            const unread = unreadMap[biz.id] || 0;
            const latest = latestMessageMap[biz.id];

            return (
              <button
                key={biz.id}
                onClick={() => setSelectedBizId(biz.id)}
                className={`w-full text-left p-3 transition flex items-center gap-3 relative ${
                  isSelected ? 'bg-white/10 border-l-2 border-white' : 'hover:bg-white/5'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-[#1C2433] text-white font-bold text-xs flex items-center justify-center shrink-0 border border-[#2B384E] relative">
                  {biz.name.charAt(0)}
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-200 truncate">{biz.name}</span>
                    {unread > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black shrink-0 animate-pulse">
                        {unread} Yeni
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {latest?.subject ? `[${latest.subject}] ` : ''}{latest?.message || biz.username}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="md:col-span-2 flex flex-col h-full bg-[#111622]">
        {/* Chat Header */}
        <div className="p-3.5 border-b border-[#1F293D] flex items-center justify-between bg-[#111622]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1C2433] text-white flex items-center justify-center font-bold text-xs border border-[#2B384E] shadow-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">{activeBusiness?.name || 'İşletme Seçin'}</h3>
              <p className="text-[10px] text-slate-400">Canlı Destek & Destek Talepleri</p>
            </div>
          </div>

          <button
            onClick={() => selectedBizId && fetchMessages(selectedBizId)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C2433] transition"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0C1017]">
          {loading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-300" />
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
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed space-y-1.5 ${
                      isMe
                        ? 'bg-[#1C2433] border border-[#2B384E] text-white rounded-br-none shadow-sm'
                        : 'bg-[#111622] border border-[#1F293D] text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {m.subject && (
                      <div className="text-[11px] font-bold text-slate-300 pb-1 border-b border-white/10 mb-1">
                        Konu: {m.subject}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{m.message}</p>
                    {m.image_url && (
                      <div className="pt-1.5">
                        <img
                          src={m.image_url}
                          alt="Ekran Görüntüsü"
                          className="max-h-56 rounded-xl object-contain bg-black/30 p-1 cursor-pointer hover:opacity-90 transition"
                          onClick={() => window.open(m.image_url, '_blank')}
                        />
                      </div>
                    )}
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
        <form onSubmit={handleSendMessage} className="p-3 border-t border-[#1F293D] flex items-center gap-2 bg-[#111622]">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="İşletmeye yanıt yazın..."
            className="flex-1 bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition font-medium"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !selectedBizId}
            className="p-2.5 bg-white hover:bg-slate-200 disabled:opacity-40 text-slate-900 rounded-xl shadow-sm transition shrink-0 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
