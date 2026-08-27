import React, { useState, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Business, SupportMessage } from '../../types';

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
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!selectedBiz) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('business_id', selectedBiz.id)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data as SupportMessage[]);
      }
    };

    fetchMessages();
  }, [selectedBiz]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz || !inputText.trim()) return;

    setSending(true);
    try {
      const msgPayload = {
        business_id: selectedBiz.id,
        sender: 'superadmin',
        message: inputText.trim(),
        is_read: false,
      };

      const { data, error } = await supabase
        .from('support_messages')
        .insert([msgPayload])
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden min-h-[600px]">
      {/* Left List */}
      <div className="border-r border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-800 font-bold text-sm text-white flex items-center justify-between">
          <span>Ýþletme Destek Kanallarý</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-normal">
            {businesses.length} Ýþletme
          </span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/50">
          {businesses.map((biz) => (
            <button
              key={biz.id}
              onClick={() => onSelectBiz(biz)}
              className={`w-full text-left p-4 transition flex items-center justify-between ${
                selectedBiz?.id === biz.id ? 'bg-brand-600/10 border-l-4 border-brand-500' : 'hover:bg-neutral-800/40'
              }`}
            >
              <div>
                <div className="font-bold text-sm text-white">{biz.name}</div>
                <div className="text-xs text-neutral-500 font-mono mt-0.5">@{biz.username}</div>
              </div>
              <span className="text-[10px] text-neutral-400 px-2 py-0.5 rounded-md bg-neutral-950">
                {biz.subscription_status}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right Chat Panel */}
      <div className="md:col-span-2 flex flex-col justify-between">
        {selectedBiz ? (
          <>
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">{selectedBiz.name} ile Canlý Destek</h3>
                <p className="text-xs text-neutral-400 font-mono">Kullanýcý: {selectedBiz.username}</p>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[450px]">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-neutral-500 text-xs">
                  Bu iþletme ile henüz mesajlaþma geçmiþi bulunmuyor. Ýlk mesajý gönderebilirsiniz.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === 'superadmin';
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-md rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                          isMe
                            ? 'bg-brand-600 text-white rounded-br-none shadow-md shadow-brand-600/20'
                            : 'bg-neutral-800 text-neutral-200 rounded-bl-none border border-neutral-700'
                        }`}
                      >
                        <div className="font-bold text-[10px] opacity-75 mb-1">
                          {isMe ? 'Platform Canlý Destek' : selectedBiz.name}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.message}</div>
                        <div className="text-[9px] opacity-60 text-right mt-1">
                          {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-800 bg-neutral-900 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ýþletmeye mesajýnýzý yazýnýz..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 transition"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="bg-brand-600 hover:bg-brand-500 text-white px-5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                Gönder
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-500">
            <MessageSquare className="w-12 h-12 text-neutral-700 mb-3" />
            <p className="font-bold text-sm text-neutral-300">Ýþletme Seçiniz</p>
            <p className="text-xs text-neutral-500 mt-1">
              Birebir canlý sohbet etmek için sol taraftan bir iþletme seçin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
