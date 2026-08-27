import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageSquare, ShieldCheck, RefreshCw, CheckCheck, 
  Bot, HelpCircle, AlertTriangle, Image as ImageIcon, QrCode, 
  DollarSign, Sparkles, ExternalLink, ChevronRight, BookOpen,
  Headphones, Lightbulb, ArrowRight, User
} from 'lucide-react';
import { Business, SupportMessage } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../lib/audio';
import { sendNativeNotification } from '../../lib/notifications';
import { useToast } from '../../context/ToastContext';

interface BusinessSupportChatProps {
  business: Business;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'admin';
  text: string;
  timestamp: string;
  quickActions?: Array<{ label: string; url?: string; actionType?: string }>;
}

const FAQ_DATABASE = [
  {
    keywords: ['görsel', 'fotoğraf', 'resim', 'stok', 'url', 'foto', 'unsplash', 'pexels'],
    title: 'Görsel Bulma & Stok URL Rehberi',
    response: `**Ürün Fotoğrafı Ekleme & Stok Görsel Rehberi:**

Menüdeki ürünlerinize internet üzerindeki ücretsiz stok fotoğrafların bağlantı adresini (URL) ekleyebilirsiniz.

**Adımlar:**
1. **Ücretsiz Stok Görsel Sitesine Gidin:**
   * [Unsplash Yemek Koleksiyonu](https://unsplash.com/s/photos/food)
   * [Pexels Restoran Fotoğrafları](https://www.pexels.com/search/food/)
2. **Görsel Bağlantısını Kopyalayın:**
   * Telefonda: Fotoğrafa basılı tutup "Resim Bağlantısını Kopyala" seçeneğini seçin.
   * Bilgisayarda: Fotoğrafa sağ tıklayıp "Resim Adresini Kopyala" seçeneğini seçin.
3. **Restiva Paneline Ekleyin:**
   * Menü & Ürünler > Ürünü Düzenle > Görsel kutucuğuna linki yapıştırın ve kaydedin.`,
    quickActions: [
      { label: 'Unsplash Yemekleri Aç', url: 'https://unsplash.com/s/photos/food' },
      { label: 'Pexels Restoran Fotoğrafları Aç', url: 'https://www.pexels.com/search/food/' },
    ],
  },
  {
    keywords: ['tükendi', 'stok', 'bitti', 'yok', 'gizle', 'kapat'],
    title: 'Tükenen Ürün Yönetimi',
    response: `**Tükenen Ürünü Menüde Kapatma:**

* **Menü & Ürünler** sekmesine gidin.
* Biten ürünün altındaki **"Tükendi Olarak İşaretle"** butonuna basın.
* Ürün canlı menüde en alt sıraya kayar, pasifleşir ve sepete eklenemez.
* Ürün tekrar hazır olduğunda aynı butondan **"Satışa Aç"** diyebilirsiniz.`,
    quickActions: [
      { label: 'Menü & Ürünlere Git', actionType: 'navigate_menu' },
    ],
  },
  {
    keywords: ['qr', 'karekod', 'yazdır', 'masa', 'çıktı', 'pdf', 'baskı'],
    title: 'Masa QR Çıktısı Alma',
    response: `**Masa QR Kodları ve Baskı:**

* Paneldeki **"Masa & QR Kodlar"** sekmesine gidin.
* **"Tüm QR Kodları Yazdır / PDF İndir"** butonuna basarak doğrudan masa aparatlarına uygun formatta çıktı alabilirsiniz.
* Masaya oturan müşteri QR kodu okuttuğunda o masanın sipariş ekranı açılır.`,
    quickActions: [
      { label: 'Masa & QR Kodlara Git', actionType: 'navigate_tables' },
    ],
  },
  {
    keywords: ['fiyat', 'fiyatlar', 'zam', 'indirim', 'güncelle', 'değiştir', 'düzenle'],
    title: 'Fiyat ve Ürün Güncelleme',
    response: `**Fiyat ve Menü Güncelleme:**

* **Menü & Ürünler** sekmesine gidin.
* Düzenlemek istediğiniz ürünün yanındaki **"Düzenle"** butonuna basın.
* Fiyat veya açıklama bilgisini güncelleyip **"Değişiklikleri Kaydet"** butonuna basın.`,
  },
  {
    keywords: ['hesap', 'ödendi', 'kapat', 'adisyon', 'ciro', 'kasa'],
    title: 'Masa Hesabını Kapatma',
    response: `**Masa Hesabını Kapatma:**

* **Canlı Siparişler** veya **Masa Yönetimi** ekranında ilgili masayı seçin.
* Ödeme alındığında **"Hesabı Kapat / Ödendi"** butonuna basın.
* Tutar otomatik olarak gün sonu cironuza işlenir ve masa yeni müşteriye hazır hale gelir.`,
  },
];

export const BusinessSupportChat: React.FC<BusinessSupportChatProps> = ({ business }) => {
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: `Merhaba. Restiva Destek Asistanına hoş geldiniz.\n\nSistem kullanımı, menü yönetimi, QR kodlar veya teknik konular hakkında bilgi almak için yukarıdaki hızlı başlıklardan birini seçebilir veya sorunuzu doğrudan yazabilirsiniz.`,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Realtime Supabase live messages sync with SuperAdmin
  useEffect(() => {
    const fetchAdminMessages = async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        const mapped: ChatMessage[] = data.map((d) => ({
          id: d.id,
          sender: d.sender === 'business' ? 'user' : 'admin',
          text: d.message,
          timestamp: new Date(d.created_at).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));
        setMessages((prev) => {
          const botInitial = prev.filter((p) => p.id.startsWith('welcome-') || p.sender === 'bot');
          return [...botInitial, ...mapped];
        });
      }
    };

    fetchAdminMessages();

    const channel = supabase
      .channel(`support-realtime-${business.id}`)
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
            toast.info('Sistem Yöneticisinden yeni mesaj geldi.');
            sendNativeNotification({
              title: 'Sistem Yöneticisinden Mesaj',
              body: newMsg.message.slice(0, 100),
              url: '/admin',
            });
            setMessages((prev) => [
              ...prev,
              {
                id: newMsg.id,
                sender: 'admin',
                text: newMsg.message,
                timestamp: new Date(newMsg.created_at).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            ]);
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
  }, [messages, isTyping]);

  // Handle Bot Answer or Send to Superadmin
  const handleQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Save to Supabase support_messages so SuperAdmin can also see and respond live!
    await supabase.from('support_messages').insert([
      {
        business_id: business.id,
        sender: 'business',
        message: queryText.trim(),
        is_read: false,
      },
    ]);

    // Check FAQ Matching
    const lower = queryText.toLowerCase();
    const matchedFaq = FAQ_DATABASE.find((faq) =>
      faq.keywords.some((k) => lower.includes(k))
    );

    setTimeout(() => {
      setIsTyping(false);
      if (matchedFaq) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: matchedFaq.response,
            timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            quickActions: matchedFaq.quickActions,
          },
        ]);
        sound.playMessageTone();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `Mesajınız sistem yöneticisine ve teknik destek ekibine iletildi. 👨‍💻\n\nEn kısa sürede buradan yanıt verilecektir. Dilerseniz yukarıdaki hazır yardım konularını da inceleyebilirsiniz.`,
            timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        sound.playMessageTone();
      }
    }, 600);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery(inputVal);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[78vh] max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <span>Restiva Akıllı Müşteri Temsilcisi</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-500">7/24 Kullanım ipuçları, stok görsel bulma ve canlı teknik destek</p>
          </div>
        </div>

        <div className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full">
          Canlı & Çevrimiçi
        </div>
      </div>

      {/* Quick Action Category Badges */}
      <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200/70 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">
          Hızlı Konular:
        </span>
        <button
          onClick={() => handleQuery('Ürünlerime nasıl fotoğraf eklerim veya nereden görsel bulurum?')}
          className="px-3 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 text-[11px] font-bold rounded-xl transition shrink-0 flex items-center gap-1 shadow-xs"
        >
          <ImageIcon className="w-3 h-3 text-orange-500" />
          <span>Görsel Bulma & Stok URL Rehberi</span>
        </button>

        <button
          onClick={() => handleQuery('Tükenen ürünü nasıl kapatırım / en alta düşürürüm?')}
          className="px-3 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 text-[11px] font-bold rounded-xl transition shrink-0 flex items-center gap-1 shadow-xs"
        >
          <Sparkles className="w-3 h-3 text-orange-500" />
          <span>Tükenen Ürün Yönetimi</span>
        </button>

        <button
          onClick={() => handleQuery('Masa QR kodlarını nasıl indirip bastırabilirim?')}
          className="px-3 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 text-[11px] font-bold rounded-xl transition shrink-0 flex items-center gap-1 shadow-xs"
        >
          <QrCode className="w-3 h-3 text-orange-500" />
          <span>Masa QR Çıktısı Alma</span>
        </button>

        <button
          onClick={() => handleQuery('Sistemde bir sorun veya hata bildirmek istiyorum')}
          className="px-3 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 text-[11px] font-bold rounded-xl transition shrink-0 flex items-center gap-1 shadow-xs"
        >
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span>Sorun Bildir</span>
        </button>
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isAdmin = msg.sender === 'admin';
          const isBot = msg.sender === 'bot';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-2.5 ${
                  isUser
                    ? 'bg-orange-500 text-white rounded-br-none shadow-md shadow-orange-500/20'
                    : isAdmin
                    ? 'bg-emerald-700 text-white rounded-bl-none shadow-md'
                    : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-none shadow-sm'
                }`}
              >
                {/* Sender Title */}
                <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-1.5 text-[10px] font-black">
                  <div className="flex items-center gap-1.5">
                    {isBot && <Bot className="w-3.5 h-3.5 text-orange-500" />}
                    {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />}
                    {isUser && <User className="w-3.5 h-3.5 text-orange-200" />}
                    <span>
                      {isBot ? 'Restiva Akıllı Asistan' : isAdmin ? 'Süper Admin (Canlı Destek)' : 'Siz'}
                    </span>
                  </div>
                  <span className={isUser ? 'text-orange-100' : 'text-slate-400'}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* Body Content */}
                <div className="whitespace-pre-wrap leading-relaxed font-medium">
                  {msg.text}
                </div>

                {/* Interactive Action Buttons if any */}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                    {msg.quickActions.map((qa, i) => (
                      qa.url ? (
                        <a
                          key={i}
                          href={qa.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-slate-900 hover:bg-orange-600 text-white text-[11px] font-black rounded-xl transition flex items-center gap-1.5 shadow-xs"
                        >
                          <span>{qa.label}</span>
                          <ExternalLink className="w-3 h-3 text-orange-400" />
                        </a>
                      ) : null
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Bot className="w-4 h-4 text-orange-500 animate-spin" />
            <span>Restiva Asistan yanıt yazıyor...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleFormSubmit} className="p-3 sm:p-4 border-t border-slate-100 bg-white flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Sormak istediğiniz konuyu yazın (Örn: Görsel nasıl eklenir? Stok bitti ne yapmalıyım?)..."
          className="flex-1 bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none font-medium placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isTyping}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 disabled:opacity-40 active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Gönder</span>
        </button>
      </form>
    </div>
  );
};
