import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageSquare, ShieldCheck, RefreshCw, CheckCheck, 
  Bot, HelpCircle, AlertTriangle, Image as ImageIcon, QrCode, 
  DollarSign, Sparkles, ExternalLink, ChevronRight, BookOpen,
  Headphones
} from 'lucide-react';
import { Business, SupportMessage } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../lib/audio';
import { sendNativeNotification } from '../../lib/notifications';
import { useToast } from '../../context/ToastContext';

interface BusinessSupportChatProps {
  business: Business;
}

interface BotGuideItem {
  id: string;
  title: string;
  category: 'guide' | 'image' | 'issue' | 'order';
  icon: React.ElementType;
  answer: string;
}

const BOT_KNOWLEDGE_BASE: BotGuideItem[] = [
  {
    id: 'image-guide',
    title: 'Ürünlerime nasıl fotoğraf eklerim veya nereden görsel bulurum?',
    category: 'image',
    icon: ImageIcon,
    answer: `🖼️ **Görsel Ekleme ve Stok Fotoğraf Rehberi:**

1. **Hazır Envanterimizden Seçin (En Kolay):**
   * **Menü & Ürünler** sekmesinde ürünün yanındaki *"Düzenle"* butonuna veya fotoğraf kutusuna dokunun.
   * **"Hazır Lezzet Galerisinden Seç / Yükle"** butonuna basarak 100+ profesyonel restorana özel yemek görseli arasından tek tıkla seçim yapabilirsiniz.

2. **Kendi Çektiğiniz Fotoğrafı Yükleyin:**
   * Galeri penceresinde sağ üstteki **"Cihazdan Yükle"** butonuna basarak telefonunuzdan veya bilgisayarınızdan kendi çektiğiniz fotoğrafı doğrudan yükleyebilirsiniz.

3. **İnternetten / Stok Sitelerinden Görsel Linki Alma:**
   * [Unsplash.com](https://unsplash.com) veya [Pexels.com](https://pexels.com) gibi ücretsiz sitelere girin.
   * İstediğiniz yemeği aratın (Örn: *Burger, Pizza, Steak, Coffee*).
   * Fotoğrafa sağ tıklayıp **"Resim Adresini Kopyala"** deyin ve ürün düzenleme ekranına yapıştırın.`,
  },
  {
    id: 'stock-out-guide',
    title: 'Tükenen ürünü nasıl kapatırım / en alta düşürürüm?',
    category: 'guide',
    icon: Sparkles,
    answer: `🧊 **Tükenen Ürün Yönetimi:**

* **Menü & Ürünler** sekmesine gidin.
* İlgili ürün kartının altındaki **"Tükendi Olarak İşaretle"** butonuna basın.
* Ürün saniyesinde griye döner, müşteri QR menüsünde otomatik olarak en alta kayar ve siparişe kapatılır.
* Ürün tekrar hazır olduğunda aynı butona basarak **"Satışa Aç"** diyebilirsiniz. Sayfayı yenilemeye gerek yoktur, canlı güncellenir.`,
  },
  {
    id: 'qr-print-guide',
    title: 'Masa QR kodlarını nasıl indirip bastırabilirim?',
    category: 'guide',
    icon: QrCode,
    answer: `📲 **Masa QR Kodları ve Kurulum:**

* Panelden **"Masa & QR Kodlar"** sekmesine gelin.
* Tüm masalarınızın karekodları hazırdır.
* **"Tüm QR Kodları Yazdır / PDF İndir"** butonuna basarak doğrudan kuşe kağıda veya pleksi masa aparatlarına uygun formatta çıktı alabilirsiniz.
* Masaya gelen müşteri telefon kamerasıyla okuttuğu an o masanın özel menüsü açılır.`,
  },
  {
    id: 'price-edit-guide',
    title: 'Fiyat veya ürün bilgilerini nasıl güncellerim?',
    category: 'guide',
    icon: DollarSign,
    answer: `🏷️ **Fiyat ve Menü Güncelleme:**

* **Menü & Ürünler** sekmesine gidin.
* Değiştirmek istediğiniz ürünün yanındaki **"Düzenle"** simgesine tıklayın.
* Fiyatı, ürün açıklamasını veya porsiyon bilgisini güncelleyip **"Değişiklikleri Kaydet"** deyin.
* Fiyatlar müşterilerin açık olan QR menülerinde anında güncellenir.`,
  },
  {
    id: 'bill-close-guide',
    title: 'Masa hesabı ve sipariş adisyonu nasıl kapatılır?',
    category: 'order',
    icon: BookOpen,
    answer: `🧾 **Hesap Kapatma ve Oturum Sonlandırma:**

* **Canlı Siparişler** veya **Masa Yönetimi** ekranında ilgili masayı seçin.
* Ödeme alındıktan sonra **"Hesabı Kapat / Ödendi"** butonuna basın.
* Tutar otomatik olarak kasanıza ve gün sonu cironuza eklenir.
* Müşterinin telefonundaki oturum ve sepet sıfırlanır, cihaz güvenle unutulur.`,
  },
  {
    id: 'report-issue',
    title: 'Sistemde bir sorun veya hata bildirmek istiyorum',
    category: 'issue',
    icon: AlertTriangle,
    answer: `🛠️ **Sorun Bildirimi ve Teknik Destek:**

* Aşağıdaki mesaj kutusundan yaşadığınız durumu (Örn: *Hangi ekranda, hangi masada veya hangi üründe sorun yaşadınız*) detaylıca yazarak gönderin.
* Talebiniz anında Süper Admin ve teknik destek ekibimizin paneline düşecektir.
* Sistem yöneticimiz en kısa sürede bu sohbet üzerinden size dönüş yapacaktır.`,
  },
];

export const BusinessSupportChat: React.FC<BusinessSupportChatProps> = ({ business }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'bot' | 'live'>('bot');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<BotGuideItem | null>(null);
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
    if (activeTab === 'live') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

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
        setActiveTab('live');
        toast.success('Mesajınız sistem yöneticisine iletildi.');
      } else {
        toast.error('Mesaj iletilemedi.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[78vh] max-w-4xl mx-auto">
      {/* Header with Dual Tabs: AI Assistant / Live Support */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Restiva Akıllı Destek & Müşteri Temsilcisi</h3>
            <p className="text-xs text-slate-500">7/24 Kullanım ipuçları, stok görsel rehberi ve canlı teknik destek</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-2xl gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('bot')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'bot'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nasıl Kullanırım? (Bot)</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 relative ${
              activeTab === 'live'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Canlı Temsilci ({messages.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SMART ASSISTANT & KNOWLEDGE BASE */}
      {activeTab === 'bot' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
          {selectedTopic ? (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
              <button
                onClick={() => setSelectedTopic(null)}
                className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
              >
                ← Tüm Konulara Geri Dön
              </button>

              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <selectedTopic.icon className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">{selectedTopic.title}</h4>
              </div>

              <div className="prose prose-sm text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedTopic.answer}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Bu yanıt yardımcı oldu mu?</span>
                <button
                  onClick={() => setActiveTab('live')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                  <span>Temsilciye Mesaj Yaz</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-4 sm:p-5 text-white shadow-md">
                <h4 className="font-black text-sm sm:text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Size Nasıl Yardımcı Olabiliriz?</span>
                </h4>
                <p className="text-xs text-orange-100 mt-1 font-medium">
                  Merak ettiğiniz konuyu seçerek ayrıntılı ipuçlarına ve adım adım kullanım rehberine hemen ulaşabilirsiniz.
                </p>
              </div>

              {/* Quick Topics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BOT_KNOWLEDGE_BASE.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedTopic(item)}
                      className="p-4 bg-white border border-slate-200/90 hover:border-orange-400 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-start justify-between gap-3 group active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-orange-50 group-hover:text-orange-600 flex items-center justify-center shrink-0 transition">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-xs text-slate-900 group-hover:text-orange-600 transition leading-snug">
                            {item.title}
                          </h5>
                          <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">
                            Detaylı rehberi gör →
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 shrink-0 mt-1 transition" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE SUPERADMIN CHAT */}
      {activeTab === 'live' && (
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
                Sistem yöneticisine iletmek istediğiniz soru, istek veya sorunları aşağıdaki alandan yazabilirsiniz.
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
      )}

      {/* Input Box (Active on Both Tabs) */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-slate-100 bg-white flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Temsilciye sorunuzu veya bildirmek istediğiniz sorunu yazın..."
          className="flex-1 bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none font-medium"
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
