import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageSquare, ShieldCheck, RefreshCw, CheckCheck, 
  Bot, HelpCircle, AlertTriangle, Image as ImageIcon, QrCode, 
  DollarSign, Sparkles, ExternalLink, ChevronRight, BookOpen,
  Headphones, Lightbulb, ArrowRight, User, XCircle, Trash2, CheckCircle2,
  Printer, Smartphone, Settings, Utensils
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
  sender: 'bot' | 'user' | 'admin' | 'system';
  text: string;
  timestamp: string;
  quickActions?: Array<{ label: string; url?: string; actionType?: string }>;
}

const FAQ_DATABASE = [
  {
    keywords: ['garson', 'terminal', 'telefon', 'eşle', 'pin', 'garson ekle', 'el terminali'],
    title: 'Garson Paneli ve Cihaz Eşleme',
    response: `**Garson Terminali ve Cihaz Eşleme Rehberi:**

1. **Kasada Manuel Ekleme Gerekmez:**
   * Garson kendi telefonundan kasadaki "Garson Eşleme QR Kodu"nu okutur.
   * Telefonuna adını ve soyadını yazıp "Yetki Talebi Gönder" butonuna basar.

2. **Kasa Onayı:**
   * Kasa panelindeki "Garsonlar & Terminaller" sekmesine talep anında düşer.
   * "Yetkiyi Onayla" butonuna bastığınız anda garsonun telefonu doğrudan masa ve sipariş POS ekranına dönüşür.

3. **PIN'siz Doğrudan Sipariş:**
   * Cihaz bir kez onaylandıktan sonra her girişte PIN sormaz; garson doğrudan masa seçip sipariş girer.
   * Siparişler kasaya ve mutfak yazıcısına garsonun adıyla iletilir.`,
    quickActions: [
      { label: 'Garson Paneline Git', actionType: 'navigate_waiters' },
    ],
  },
  {
    keywords: ['hesap', 'ödendi', 'kapat', 'nakit', 'pos', 'kredi kartı', 'kart'],
    title: 'Sipariş ve Hesap Kapatma (Nakit / POS)',
    response: `**Canlı Siparişler ve Hesap Kapatma:**

1. **Sipariş Durumu:**
   * Gelen sipariş "Bekliyor" durumundayken "Hazırla" butonuna basılır.
   * Hazırlanan veya bekleyen sipariş için doğrudan **"Hesabı Kapat"** butonuna basılır.

2. **Ödeme Türü Seçimi:**
   * Açılan pencerede sipariş detayları ve ödenecek tutar gösterilir.
   * **"POS / Kredi Kartı"** veya **"Nakit Ödeme"** butonlarından biri seçilerek hesap kapatılır.
   * Yapılan ödeme anında ilgili ciro kalemine (Kredi Kartı veya Nakit) otomatik işlenir.`,
    quickActions: [
      { label: 'Canlı Siparişlere Git', actionType: 'navigate_orders' },
      { label: 'Ciro Raporunu Gör', actionType: 'navigate_turnover' },
    ],
  },
  {
    keywords: ['yazıcı', 'termal', 'çıktı', 'fiş', 'printer', 'mutfak fişi', '80mm', '58mm'],
    title: 'Termal Fiş Yazıcı Ayarları',
    response: `**Yazıcı ve Termal Fiş Ayarları:**

* Paneldeki **"İşletme Ayarları"** sekmesinden Fiş Genişliğini (80mm veya 58mm) seçebilirsiniz.
* "Yeni Siparişte Otomatik Yazdır" seçeneğini aktif ettiğinizde masadan veya garsondan gelen her yeni sipariş otomatik olarak mutfak yazıcısına gönderilir.
* Sipariş kartlarındaki "Yazdır" butonuyla dilediğiniz zaman tekrar fiş çıktısı alabilirsiniz.`,
    quickActions: [
      { label: 'İşletme Ayarlarına Git', actionType: 'navigate_settings' },
    ],
  },
  {
    keywords: ['qr', 'karekod', 'yazdır', 'masa', 'çıktı', 'pdf', 'baskı'],
    title: 'Masa QR Kodları ve Baskı Alma',
    response: `**Masa QR Kodları ve Baskı:**

* Paneldeki **"Masa & QR Kodlar"** sekmesine gidin.
* **"Tüm QR Kodları Yazdır / PDF İndir"** butonuna basarak masa aparatlarına uygun formatta çıktı alabilirsiniz.
* Masaya oturan müşteri QR kodu okuttuğunda o masanın sipariş menüsü doğrudan açılır.`,
    quickActions: [
      { label: 'Masa & QR Kodlara Git', actionType: 'navigate_tables' },
    ],
  },
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
    keywords: ['ciro', 'rapor', 'z raporu', 'gün sonu', 'aylık', 'pdf'],
    title: 'Ciro ve Z Raporu',
    response: `**Ciro ve Kasa Raporları:**

* **Ciro & Raporlar** sekmesinden günlük, haftalık ve aylık toplam gelirinizi görebilirsiniz.
* Toplam tutar Nakit ve POS/Kredi Kartı olarak ayrı ayrı dökülür.
* **"Z Raporu Yazdır"** butonuyla gün sonu kasa fişi çıktısı alabilir, **"Aylık PDF İndir"** butonuyla muhasebe dökümünü kaydedebilirsiniz.`,
    quickActions: [
      { label: 'Ciro Raporuna Git', actionType: 'navigate_turnover' },
    ],
  },
  {
    keywords: ['wifi', 'şifre', 'işletme adı', 'adres', 'telefon', 'ayar'],
    title: 'İşletme Bilgileri ve Müşteri WiFi',
    response: `**İşletme ve WiFi Ayarları:**

* **İşletme Ayarları** sekmesine gidin.
* İşletme adı, telefon, adres ve müşteri WiFi adı/şifresini güncelleyebilirsiniz.
* WiFi bilgileri müşterilerin QR menü ekranında pratik şekilde gösterilir.`,
    quickActions: [
      { label: 'İşletme Ayarlarına Git', actionType: 'navigate_settings' },
    ],
  },
];

export const BusinessSupportChat: React.FC<BusinessSupportChatProps> = ({ business }) => {
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: `Merhaba. Restiva Destek Asistanına hoş geldiniz.\n\nSistem kullanımı, garson eşleme, canlı siparişler, termal yazıcı, menü veya ciro yönetimi hakkında bilgi almak için aşağıdaki hızlı başlıklardan birini seçebilir veya sorunuzu doğrudan yazabilirsiniz.`,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEndingChat, setIsEndingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Realtime Supabase live messages sync with SuperAdmin & Auto-clean
  useEffect(() => {
    const fetchAdminMessages = async () => {
      // 1. Trigger DB cleanup for resolved chats older than 2h & chats older than 3 days
      try {
        await supabase.rpc('cleanup_old_support_messages');
      } catch {
        // Fallback if RPC is not yet applied
      }

      // 2. Fetch active messages
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('business_id', business.id)
        .eq('status', 'open')
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

  // Handle Ending / Resolving Chat
  const handleEndChat = async () => {
    try {
      setIsEndingChat(true);
      const { error } = await supabase.rpc('end_support_chat', {
        p_business_id: business.id,
      });

      if (error) {
        // Fallback direct update
        await supabase
          .from('support_messages')
          .update({ is_resolved: true, status: 'closed', updated_at: new Date().toISOString() })
          .eq('business_id', business.id)
          .eq('status', 'open');
      }

      setMessages([
        {
          id: `system-${Date.now()}`,
          sender: 'system',
          text: 'Sohbet başarıyla sonlandırıldı. Geçmiş mesajlar 2 saat içerisinde otomatik olarak temizlenecektir. İhtiyaç duyduğunuzda yeni bir soru sorarak yeni bir sohbet başlatabilirsiniz.',
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      toast.success('Sohbet sonlandırıldı.');
    } catch (err: any) {
      toast.error('Sohbet sonlandırılırken hata oluştu.');
    } finally {
      setIsEndingChat(false);
    }
  };

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

    // Save to Supabase support_messages
    await supabase.from('support_messages').insert([
      {
        business_id: business.id,
        sender: 'business',
        message: queryText.trim(),
        is_read: false,
        status: 'open',
        is_resolved: false,
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
            text: `Mesajınız sistem yöneticisine ve teknik destek ekibine iletildi.\n\nEn kısa sürede buradan yanıt verilecektir. Dilerseniz yukarıdaki hazır yardım konularını da inceleyebilirsiniz.`,
            timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        sound.playMessageTone();
      }
    }, 500);
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
              <span>Restiva Destek Asistanı</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-500">Sistem kullanımı, garson terminalleri, yazıcı ve canlı teknik destek</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEndChat}
            disabled={isEndingChat}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
            title="Mevcut sohbeti sonlandırır ve geçmişi temizleme kuyruğuna alır"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sohbeti Sonlandır</span>
          </button>

          <div className="hidden sm:block text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl">
            Çevrimiçi
          </div>
        </div>
      </div>

      {/* Quick Action Category Badges */}
      <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200/70 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">
          Hızlı Konular:
        </span>
        <button
          onClick={() => handleQuery('Garson terminalini nasıl eşlerim ve nasıl sipariş alırım?')}
          className="px-3 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 text-[11px] font-bold rounded-xl transition shrink-0 flex items-center gap-1 shadow-xs"
        >
          <Smartphone className="w-3 h-3 text-orange-500" />
          <span>Garson Terminali & Eşleme</span>
        </button>

        <button
          onClick={() => handleQuery('Hesabı kapatırken Nakit veya Kredi Kartı POS seçimi nasıl işler?')}
          className="px-3 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 text-[11px] font-bold rounded-xl transition shrink-0 flex items-center gap-1 shadow-xs"
        >
          <DollarSign className="w-3 h-3 text-orange-500" />
          <span>Sipariş & Hesap Kapatma</span>
        </button>

        <button
          onClick={() => handleQuery('Masa QR kodlarını nasıl indirip bastırabilirim?')}
          className="px-3 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 text-[11px] font-bold rounded-xl transition shrink-0 flex items-center gap-1 shadow-xs"
        >
          <QrCode className="w-3 h-3 text-orange-500" />
          <span>Masa QR Çıktısı Alma</span>
        </button>

        <button
          onClick={() => handleQuery('Termal fiş yazıcısı ayarları ve mutfak fişi nasıl çalışır?')}
          className="px-3 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 text-[11px] font-bold rounded-xl transition shrink-0 flex items-center gap-1 shadow-xs"
        >
          <Printer className="w-3 h-3 text-orange-500" />
          <span>Termal Yazıcı Ayarları</span>
        </button>

        <button
          onClick={() => handleQuery('Tükenen ürünü nasıl kapatırım / en alta düşürürüm?')}
          className="px-3 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 text-[11px] font-bold rounded-xl transition shrink-0 flex items-center gap-1 shadow-xs"
        >
          <Sparkles className="w-3 h-3 text-orange-500" />
          <span>Tükenen Ürün Yönetimi</span>
        </button>
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isAdmin = msg.sender === 'admin';
          const isBot = msg.sender === 'bot';
          const isSystem = msg.sender === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="bg-slate-200/80 text-slate-700 px-4 py-2 rounded-2xl text-[11px] font-semibold max-w-lg text-center shadow-xs">
                  {msg.text}
                </div>
              </div>
            );
          }

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
                      {isBot ? 'Restiva Asistan' : isAdmin ? 'Sistem Yöneticisi (Canlı Destek)' : 'Siz'}
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
          placeholder="Sormak istediğiniz konuyu yazınız (Örn: Garson eşleme nasıl yapılır?)..."
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
