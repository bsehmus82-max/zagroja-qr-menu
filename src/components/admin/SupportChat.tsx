import React, { useState, useEffect, useRef } from 'react';
import { store, playNotificationSound } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { SupportMessage, Restaurant } from '../../types';
import { 
  Send, 
  Headphones, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  CheckCheck, 
  Info,
  RefreshCw
} from 'lucide-react';

interface SupportChatProps {
  restaurant: Restaurant;
}

export const SupportChat: React.FC<SupportChatProps> = ({ restaurant }) => {
  const [messages, setMessages] = useState<SupportMessage[]>(() => store.getSupportMessages(restaurant.id));
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setIsLoading(true);
    const msgs = await store.loadSupportMessagesFromCloud(restaurant.id);
    setMessages(msgs);
    await store.markSupportMessagesAsRead(restaurant.id, 'business');
    setIsLoading(false);
    scrollToBottom();
  };

  useEffect(() => {
    loadMessages();

    // Subscribe to realtime changes on support_messages
    const channel = supabase.channel(`support_${restaurant.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages', 
        filter: `restaurant_id=eq.${restaurant.id}` 
      }, (payload) => {
        const newMsg = payload.new as SupportMessage;
        setMessages((prev) => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.sender_type === 'superadmin') {
          playNotificationSound('call', 'Zagroja Destek Ekibinden Yeni Mesaj!');
          store.markSupportMessagesAsRead(restaurant.id, 'business');
        }
        scrollToBottom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const newMsg = await store.sendSupportMessage({
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name || 'İşletme',
        sender_type: 'business',
        sender_name: restaurant.owner_username || 'İşletme Yetkilisi',
        message: text
      });

      setMessages((prev) => [...prev.filter(m => m.id !== newMsg.id), newMsg]);
      scrollToBottom();
    } catch (e) {
      console.warn('Mesaj gönderilemedi:', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-170px)] bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-white">Zagroja Canlı Destek & Süper Admin</h2>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Doğrudan Platform Yöneticisine Bağlısınız</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadMessages}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            title="Sohbeti Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5-Day Notice Banner */}
      <div className="bg-blue-950/40 border-b border-blue-900/30 px-4 py-2 flex items-center justify-between text-[11px] text-blue-300">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Sohbet geçmişi depolama tasarrufu için <strong>5 gün boyunca</strong> saklanır.</span>
        </div>
        <span className="hidden sm:inline-block font-mono text-[10px] text-blue-400/80 bg-blue-900/40 px-2 py-0.5 rounded-md">
          Uçtan Uca Güvenli
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-400">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-300 text-sm">Destek Talebi Oluşturun</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Menü, masalar, sistem veya aboneliğiniz hakkında Süper Admin ekibine soru sorabilir veya yardım talep edebilirsiniz.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_type === 'business';
            const timeStr = new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const dateStr = new Date(msg.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-slide-up`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-bold text-slate-400">
                    {isMe ? 'Siz (İşletme)' : 'Zagroja Destek (Süper Admin)'}
                  </span>
                  <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" /> {dateStr} {timeStr}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-md ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  
                  {isMe && (
                    <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-blue-200/80">
                      <span>{timeStr}</span>
                      <CheckCheck className={`w-3.5 h-3.5 ${msg.is_read ? 'text-cyan-300' : 'text-blue-300/60'}`} />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Süper Admin'e mesajınızı veya sorunuzu yazın..."
          className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-2xl text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 text-xs sm:text-sm active:scale-95 shrink-0"
        >
          <span>Gönder</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
