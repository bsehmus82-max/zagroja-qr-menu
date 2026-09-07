// ==============================================================================
// RESTIVADISYON AI MENÜ & İŞLETME ASİSTANI (SAĞ COPILOT DRAWER)
// Canlı Siparişler & Dashboard Uyumlu Tasarım, Hover/Pin Mimarisi ve Düşük Bellek
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Mic, MicOff, Check, ArrowRight,
  Image as ImageIcon, Loader2,
  Sparkles, RefreshCw, AlertCircle
} from 'lucide-react';
import { Business, Category, Product } from '../../types';
import { 
  processMenuCopilot, 
  generateMenuWithAi, 
  CopilotExecutionResult, 
  CopilotDiffChange,
  getTimeBasedGreeting,
  sanitizeAiText
} from '../../lib/geminiAi';
import { supabase } from '../../lib/supabase';
import { sound } from '../../lib/audio';
import { useToast } from '../../context/ToastContext';
import { QrRobotIcon } from '../common/QrRobotIcon';

interface RestivaAiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  categories?: Category[];
  products?: Product[];
  onMenuUpdated?: () => void;
  onOpenThemeStudio?: () => void;
  onOpenQrStudio?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  createdAt: number; // Unix timestamp in ms for 7-day rolling purge
  result?: CopilotExecutionResult;
  isApplied?: boolean;
  imageUrl?: string;
  isNew?: boolean;
}

interface PendingImage {
  file: File;
  base64: string;
  name: string;
}

const QUICK_SUGGESTIONS = [
  { label: 'Tüm sıcak içeceklere yüzde 10 zam yap', prompt: 'Tüm sıcak içeceklere yüzde 10 zam yap' },
  { label: 'Tükenen tatlıları menüde kapat', prompt: 'Tükenen tatlıları menüde satışa kapat' },
  { label: 'Soğuk içeceklerin fiyatlarını 15 TL artır', prompt: 'Tüm soğuk içeceklerin fiyatlarını 15 TL artır' },
  { label: 'Menüdeki en yüksek fiyatlı 5 ürünü listele', prompt: 'Menüdeki en pahalı 5 ürünü ve fiyatlarını listele' },
];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// ChatGPT / Gemini Tarzı Yumuşak Kelime Akışı (Typewriter) ve Canlı Otomatik Kaydırma
const TypewriterText: React.FC<{ 
  text: string; 
  isNew?: boolean; 
  onTick?: () => void;
  onComplete?: () => void; 
}> = ({ text, isNew, onTick, onComplete }) => {
  const [displayedText, setDisplayedText] = useState(isNew ? '' : text);
  const [isTyping, setIsTyping] = useState(isNew);

  useEffect(() => {
    if (!isNew) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    const words = text.split(' ');
    let currentWordIndex = 0;

    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        setDisplayedText(words.slice(0, currentWordIndex + 1).join(' '));
        currentWordIndex++;
        onTick?.();
      } else {
        clearInterval(interval);
        setIsTyping(false);
        onTick?.();
        onComplete?.();
      }
    }, 20);

    return () => clearInterval(interval);
  }, [text, isNew]);

  return (
    <span>
      {displayedText}
      {isTyping && <span className="inline-block w-1.5 h-3.5 bg-white/70 ml-1 animate-pulse align-middle" />}
    </span>
  );
};

export const RestivaAiCopilotDrawer: React.FC<RestivaAiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  business,
  categories,
  products,
  onMenuUpdated,
}) => {
  const toast = useToast();
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const STORAGE_KEY = `restiva_ai_memory_${business.id}`;

  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [dynamicGreeting, setDynamicGreeting] = useState(() => getTimeBasedGreeting());

  const [internalCats, setInternalCats] = useState<Category[]>(categories || []);
  const [internalProds, setInternalProds] = useState<Product[]>(products || []);

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const loadMenuData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        supabase.from('categories').select('*').eq('business_id', business.id).order('order_index', { ascending: true }),
        supabase.from('products').select('*').eq('business_id', business.id).order('order_index', { ascending: true }),
      ]);
      if (cRes.data) setInternalCats(cRes.data as Category[]);
      if (pRes.data) setInternalProds(pRes.data as Product[]);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      setDynamicGreeting(getTimeBasedGreeting());
      if (categories && categories.length > 0) setInternalCats(categories);
      if (products && products.length > 0) setInternalProds(products);
      if (!categories || !products || categories.length === 0) {
        loadMenuData();
      }
    }
  }, [isOpen, business.id, categories, products]);

  const effectiveCategories = categories && categories.length > 0 ? categories : internalCats;
  const effectiveProducts = products && products.length > 0 ? products : internalProds;

  // 7 Günlük Zamana Dayalı Otomatik Bellek Temizleme & Yükleme
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const now = Date.now();
          const validMessages = parsed.filter((m: any) => {
            const msgTime = m.createdAt || now;
            return now - msgTime <= SEVEN_DAYS_MS;
          });
          return validMessages.map((m: any) => ({ ...m, isNew: false }));
        }
      }
    } catch {}
    return [];
  });

  // Bellek & Depolama Koruma Kuralı (Maksimum 25 mesaj ve 7 gün süreli)
  useEffect(() => {
    try {
      const now = Date.now();
      const validMessages = messages
        .filter((m) => now - (m.createdAt || now) <= SEVEN_DAYS_MS)
        .slice(-25)
        .map((m) => {
          let cleanText = m.text;
          if (cleanText.length > 3000 && cleanText.includes('data:image')) {
            cleanText = cleanText.substring(0, 300) + '... [Görsel verisi depolama tasarrufu için temizlendi]';
          }
          return {
            id: m.id,
            sender: m.sender,
            text: cleanText,
            timestamp: m.timestamp,
            createdAt: m.createdAt || now,
            imageUrl: m.imageUrl ? '[Görsel]' : undefined,
            result: m.result
              ? {
                  summaryTitle: m.result.summaryTitle,
                  assistantMessage: m.result.assistantMessage,
                  changes: m.result.changes,
                }
              : undefined,
            isApplied: m.isApplied,
          };
        });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validMessages));
    } catch {
      // ignore storage quota errors safely
    }
  }, [messages, STORAGE_KEY]);

  const handleClearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    toast.info('AI sohbet geçmişi temizlendi.');
  };

  const handleScrollDown = (smooth = false) => {
    if (chatBodyRef.current) {
      if (smooth) {
        chatBodyRef.current.scrollTo({
          top: chatBodyRef.current.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleScrollDown(false);
    }
  }, [messages, isOpen, isProcessing]);

  // Sesli Komut Dinleyici (Web Speech API)
  const toggleVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Tarayıcınız sesli komut özelliğini desteklemiyor.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info('Sizi dinliyorum, komutunuzu söyleyin...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
        handleSendPrompt(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Görsel Seçildiğinde Göndermeden Önce Önizlemeye Al
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage({
        file,
        base64: reader.result as string,
        name: file.name,
      });
      toast.info('Fotoğraf eklendi. İsterseniz talimat yazıp Gönder\'e basabilirsiniz.');
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be selected again if re-added
    e.target.value = '';
  };

  // Komut veya Görseli Gönder ve Analiz Et
  const handleSendPrompt = async (promptToSend?: string) => {
    const text = (promptToSend || inputMessage).trim();
    if (!text && !pendingImage) return;
    if (isProcessing) return;

    const imageToSend = pendingImage;
    setPendingImage(null);
    setInputMessage('');

    const userMsgText = text || (imageToSend ? 'Menü fotoğrafı analiz edilsin' : '');
    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: userMsgText,
      imageUrl: imageToSend?.base64,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      // 1. Durum: Görsel Gönderildiyse OCR ve Menü Oluşturma
      if (imageToSend) {
        toast.info('Menü görseli AI tarafından analiz ediliyor...');
        const result = await generateMenuWithAi({
          imageFileBase64: imageToSend.base64,
          mimeType: imageToSend.file.type,
          conceptPrompt: text || 'Menüdeki tüm kategorileri ve ürünleri eksiksiz çıkar.',
        });

        let totalAdded = 0;
        for (const cat of result.categories) {
          const { data: catData } = await supabase
            .from('categories')
            .insert([
              {
                business_id: business.id,
                name: cat.name,
                image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
                is_active: true,
                order_index: 0,
              },
            ])
            .select()
            .single();

          if (catData) {
            for (const prod of cat.products) {
              await supabase.from('products').insert([
                {
                  business_id: business.id,
                  category_id: catData.id,
                  name: prod.name,
                  description: prod.description || '',
                  price: prod.price || 150,
                  is_frozen: false,
                  is_active: true,
                  order_index: 0,
                },
              ]);
              totalAdded++;
            }
          }
        }

        const aiMsg: ChatMessage = {
          id: 'ai_' + Date.now(),
          sender: 'assistant',
          text: sanitizeAiText(`Görsel analiz edildi. ${result.categories.length} Kategori ve ${totalAdded} Ürün menünüze eklendi.`),
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          createdAt: Date.now(),
          isNew: true,
        };

        sound.playSuccessTone();
        setMessages((prev) => [...prev, aiMsg]);
        toast.success(`${totalAdded} adet ürün menünüze eklendi!`);
        onMenuUpdated?.();
      } else {
        // 2. Durum: Metin Komutu ile Menü Güncelleme (Fiyat, Stok vb.)
        const result = await processMenuCopilot(text, effectiveCategories, effectiveProducts, business);

        const aiMsg: ChatMessage = {
          id: 'ai_' + Date.now(),
          sender: 'assistant',
          text: result.assistantMessage,
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          createdAt: Date.now(),
          result,
          isApplied: false,
          isNew: true,
        };

        sound.playMessageTone();
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      toast.error('Asistan yanıt verirken hata oluştu: ' + (err?.message || ''));
    } finally {
      setIsProcessing(false);
    }
  };

  // Değişiklikleri Canlı Veritabanına Yaz (Diff Execution)
  const handleApplyChanges = async (msgId: string, changes: CopilotDiffChange[]) => {
    try {
      setIsProcessing(true);

      for (const change of changes) {
        if (change.type === 'product_price' && change.payload) {
          await supabase
            .from('products')
            .update({ price: change.payload.newPrice, updated_at: new Date().toISOString() })
            .eq('id', change.payload.productId);
        } else if (change.type === 'product_stock' && change.payload) {
          await supabase
            .from('products')
            .update({ is_frozen: change.payload.is_frozen, updated_at: new Date().toISOString() })
            .eq('id', change.payload.productId);
        } else if (change.type === 'product_add' && change.payload) {
          await supabase.from('products').insert([
            {
              business_id: business.id,
              category_id: change.payload.category_id,
              name: change.payload.name,
              description: change.payload.description,
              price: change.payload.price,
              is_frozen: false,
              is_active: true,
            },
          ]);
        } else if (change.type === 'theme_update' && change.payload) {
          await supabase
            .from('businesses')
            .update({
              template_id: change.payload.template_id,
              theme_config: change.payload,
              updated_at: new Date().toISOString(),
            })
            .eq('id', business.id);
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, isApplied: true } : m))
      );

      sound.playSuccessTone();
      toast.success('Değişiklikler canlı QR menünüze uygulandı!');
      onMenuUpdated?.();
    } catch (err: any) {
      toast.error('Değişiklikler uygulanamadı: ' + (err?.message || ''));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Dimmed backdrop - closes on click */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} 
      />

      {/* Right-Side Floating Copilot Drawer (~460px wide) */}
      <aside 
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[460px] bg-[#0C1017] border-l border-white/[0.08] z-50 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header: Distinct Main Surface (#111622) - Kutucuksuz Nativ Logo ve Çerçevesiz Çarpı Butonu */}
        <header className="px-5 py-4 border-b border-white/[0.08] bg-[#111622] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Nativ Logo (Kutucuk veya kart çerçevesi olmadan) */}
            <QrRobotIcon size={24} className="text-white shrink-0" />

            <div>
              <h3 className="font-extrabold text-sm text-white tracking-tight leading-none">
                RestivAdisyon AI
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Akıllı Menü & İşletme Asistanı</p>
            </div>
          </div>

          {/* Çerçevesiz & Kutucuksuz Çarpı Butonu */}
          <button
            onClick={onClose}
            title="Kapat"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
          </button>
        </header>

        {/* Chat Body Area (Deep Canvas #0C1017) */}
        <div ref={chatBodyRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0C1017]">
          {/* Welcome Screen & Interactive Suggestion Chips when no messages */}
          {messages.length === 0 && (
            <div className="py-6 px-2 space-y-6 animate-in fade-in duration-300">
              {/* Introduction Card (Kutucuksuz sade logo) */}
              <div className="text-center space-y-2 max-w-sm mx-auto">
                <QrRobotIcon size={32} className="text-white mx-auto" />
                <h4 className="text-sm font-extrabold text-white leading-snug">{dynamicGreeting}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Menü fiyatlarınızı toplu güncelleyebilir tükenen ürünleri kapatabilir veya fotoğraf yükleyerek ürün ekleyebilirsiniz
                </p>
              </div>

              {/* Quick Suggestion Prompt Chips (Wix AI Style) */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-1 block">
                  Örnek Talimatlar
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {QUICK_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendPrompt(item.prompt)}
                      onMouseMove={handleSpotlightMove}
                      className="w-full text-left p-3 rounded-2xl bg-[#141A26] hover:bg-[#1C2433] border border-white/[0.04] hover:border-white/[0.12] text-xs font-semibold text-slate-300 hover:text-white transition-all duration-150 flex items-center justify-between group active:scale-[0.98]"
                    >
                      <span className="truncate pr-2">{item.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Message Thread */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
              >
                {/* User Image Attachment (if any) */}
                {isUser && msg.imageUrl && (
                  <div className="mb-2 max-w-[200px] rounded-xl overflow-hidden border border-white/[0.1]">
                    <img src={msg.imageUrl} alt="Yüklenen Görsel" className="w-full h-auto object-cover max-h-40" />
                  </div>
                )}

                {/* Message Bubble (User: #1C2433, Assistant: #141A26) */}
                <div
                  className={`max-w-[92%] rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-[#1C2433] text-white font-medium border border-white/[0.08] shadow-sm rounded-br-xs'
                      : 'bg-[#141A26] text-slate-200 border border-white/[0.05] shadow-sm rounded-bl-xs'
                  }`}
                >
                  {isUser ? (
                    msg.text
                  ) : (
                    <TypewriterText text={msg.text} isNew={msg.isNew} onTick={() => handleScrollDown(false)} />
                  )}

                  {/* Seamless Inline Diff List & Action Buttons (Ayrı kutu/kart olmadan balonun içinde) */}
                  {msg.result && msg.result.changes && msg.result.changes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">
                          {msg.result.summaryTitle || 'Önerilen Değişiklikler'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 bg-white/[0.08] px-2 py-0.5 rounded-md">
                          {msg.result.changes.length} Değişiklik
                        </span>
                      </div>

                      {/* Changes List */}
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {msg.result.changes.map((c, i) => (
                          <div key={i} className="p-2 rounded-xl bg-[#0C1017] border border-white/[0.04] flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-200 truncate max-w-[150px]">{c.title}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {c.oldValue && <span className="line-through text-slate-500 text-[10px]">{c.oldValue}</span>}
                              <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                              <span className="font-bold text-emerald-400">{c.newValue}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action & Refine Buttons (Wix AI Tarzı Doğrudan Eylem) */}
                      {!msg.isApplied ? (
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            onClick={() => handleApplyChanges(msg.id, msg.result!.changes)}
                            disabled={isProcessing}
                            className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-200 text-slate-900 font-extrabold text-xs transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Canlıya Uygula</span>
                          </button>

                          <button
                            onClick={() => {
                              setInputMessage('Farklı bir oran ile tekrar hesapla: ');
                            }}
                            className="py-2 px-3 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-slate-300 hover:text-white font-bold text-xs transition active:scale-95 cursor-pointer"
                          >
                            Düzenle
                          </button>
                        </div>
                      ) : (
                        <div className="py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Değişiklikler Canlı Menüye Uygulandı</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 mt-1 px-1 font-medium">{msg.timestamp}</span>
              </div>
            );
          })}

          {/* Animated Thinking State (Wix AI Bouncing Pulse) */}
          {isProcessing && (
            <div className="flex items-center gap-2.5 p-3.5 bg-[#141A26] border border-white/[0.06] rounded-2xl w-fit text-slate-300 text-xs font-medium animate-in fade-in">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
              </div>
              <span className="text-[11px] font-semibold text-slate-300">RestivAdisyon AI analiz ediyor...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Attachment Preview Area (#111622 Footer Container, #141A26 Capsule) */}
        <footer className="p-3.5 border-t border-white/[0.08] bg-[#111622] shrink-0 space-y-2">
          {/* Pre-Send Image Preview with Removal Button */}
          {pendingImage && (
            <div className="p-2 rounded-xl bg-[#141A26] border border-white/[0.08] flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={pendingImage.base64}
                  alt="Önizleme"
                  className="w-12 h-12 rounded-lg object-cover border border-white/[0.08] shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    {pendingImage.name}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Gönderilmeye hazır • İsteğe bağlı talimat yazabilirsiniz
                  </span>
                </div>
              </div>

              {/* Remove/Delete Image Button */}
              <button
                type="button"
                onClick={() => setPendingImage(null)}
                title="Görseli Kaldır"
                className="w-7 h-7 rounded-lg bg-[#0C1017] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition shrink-0 active:scale-90 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-2 bg-[#141A26] border border-white/[0.08] rounded-2xl p-1.5 shadow-sm"
          >
            {/* Hidden File Input for Menu Photo */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Photo Upload Icon */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Menü Fotoğrafı Seç (Önizlemeli)"
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition shrink-0 active:scale-90 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Voice Command Mic */}
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              title={isListening ? 'Dinleniyor...' : 'Sesli Komut Ver'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 active:scale-90 cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Main Input Field */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={pendingImage ? 'Görsel hakkında talimat yazın veya Gönder\'e basın...' : 'Bir talimat yazın (Örn: Sıcak kahvelere %10 zam yap)...'}
              className="flex-1 bg-transparent px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none font-medium"
            />

            {/* Send Action Button */}
            <button
              type="submit"
              disabled={(!inputMessage.trim() && !pendingImage) || isProcessing}
              className="w-9 h-9 rounded-xl bg-white hover:bg-slate-200 text-slate-900 flex items-center justify-center transition shrink-0 disabled:opacity-30 active:scale-95 shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </footer>
      </aside>
    </>
  );
};

