import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, ShieldCheck, 
  AlertTriangle,
  CheckCircle2,
  FileText, Download,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { Business, SupportMessage, Order } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../lib/audio';
import { sendNativeNotification } from '../../lib/notifications';
import { useToast } from '../../context/ToastContext';

interface BusinessSupportChatProps {
  business: Business;
}

export const BusinessSupportChat: React.FC<BusinessSupportChatProps> = ({ business }) => {
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Ticket Form States
  const [subject, setSubject] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Active Chat State
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatImageUrl, setChatImageUrl] = useState('');
  const [isCompressingChatImage, setIsCompressingChatImage] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isEndingChat, setIsEndingChat] = useState(false);

  const compressImageFile = (
    file: File,
    onSuccess: (base64: string) => void,
    setLoading: (loading: boolean) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir görsel dosyası (.jpg, .png, .webp) seçiniz.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Görsel boyutu 10MB\'dan küçük olmalıdır.');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          onSuccess(compressedBase64);
        }
        setLoading(false);
      };
      img.onerror = () => {
        toast.error('Görsel işlenirken bir sorun oluştu.');
        setLoading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      toast.error('Görsel okunamadı.');
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleTicketImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, (base64) => setImageUrl(base64), setIsCompressingImage);
    }
  };

  const handleChatImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, (base64) => setChatImageUrl(base64), setIsCompressingChatImage);
    }
  };

  // Monthly Report Check (Days 1 to 5)
  const now = new Date();
  const dayOfMonth = now.getDate();
  const isMonthlyPdfReady = dayOfMonth <= 5;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthName = prevMonthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  // Expiry check (3 days or less)
  const isTrialExpiring = (() => {
    if (business.plan_type === 'trial' && business.subscription_expires_at) {
      const diffMs = new Date(business.subscription_expires_at).getTime() - Date.now();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    }
    return false;
  })();

  const diffDays = (() => {
    if (business.subscription_expires_at) {
      const diffMs = new Date(business.subscription_expires_at).getTime() - Date.now();
      return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
    return 0;
  })();

  const loadMessages = async () => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('business_id', business.id)
      .eq('status', 'open')
      .order('created_at', { ascending: true });

    if (data) setMessages(data as SupportMessage[]);
  };

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`support-chat-${business.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as SupportMessage;
            setMessages((prev) => [...prev, newMsg]);
            if (newMsg.sender === 'superadmin') {
              sound.playMessageTone();
              toast.info('RestivAdisyon Müşteri Hizmetleri mesaj gönderdi.');
              sendNativeNotification({
                title: 'Destek Yanıtı',
                body: newMsg.message,
                url: '/admin',
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as SupportMessage;
            if (updated.status === 'closed' || updated.is_resolved) {
              setMessages((prev) => prev.filter((m) => m.id !== updated.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDownloadMonthlyPdf = async () => {
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const { data: rawOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('business_id', business.id)
      .eq('status', 'paid')
      .gte('created_at', startOfPrevMonth.toISOString())
      .lte('created_at', endOfPrevMonth.toISOString());

    const prevOrders = (rawOrders as Order[]) || [];
    const mTotal = prevOrders.reduce((acc, o) => acc + o.total_amount, 0);
    const mCash = prevOrders.filter((o) => o.payment_method === 'cash').reduce((acc, o) => acc + o.total_amount, 0);
    const mCard = prevOrders.filter((o) => o.payment_method === 'credit_card').reduce((acc, o) => acc + o.total_amount, 0);
    const mOther = prevOrders.filter((o) => o.payment_method === 'other' || o.payment_method === 'online' || o.payment_method === 'bank_transfer').reduce((acc, o) => acc + o.total_amount, 0);

    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Lütfen açılır pencere (pop-up) engelini kaldırınız.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${business.name} - ${prevMonthName} Ciro Raporu</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .biz-name { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
          .report-title { font-size: 16px; color: #64748b; margin-top: 4px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
          .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
          .kpi-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; }
          .kpi-val { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f1f5f9; text-align: left; padding: 12px; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 1px solid #cbd5e1; }
          td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="biz-name">${business.name}</h1>
            <div class="report-title">Resmi Aylık Finansal Döküm Raporu — ${prevMonthName}</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            Tarih: ${new Date().toLocaleDateString('tr-TR')}<br>
            Durum: Onaylandı
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Toplam Net Gelir</div>
            <div class="kpi-val">${mTotal.toFixed(2)} ₺</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${prevOrders.length} Sipariş</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Nakit Tahsilat</div>
            <div class="kpi-val" style="color: #059669;">${mCash.toFixed(2)} ₺</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">POS / Kredi Kartı</div>
            <div class="kpi-val" style="color: #4f46e5;">${mCard.toFixed(2)} ₺</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Diğer (IBAN / Havale)</div>
            <div class="kpi-val" style="color: #0284c7;">${mOther.toFixed(2)} ₺</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 10px;">İşlem Hareketleri</h3>
        <table>
          <thead>
            <tr>
              <th>Tarih & Saat</th>
              <th>Masa</th>
              <th>Ödeme Türü</th>
              <th>Kalem Sayısı</th>
              <th style="text-align: right;">Tutar</th>
            </tr>
          </thead>
          <tbody>
            ${prevOrders.slice(0, 50).map(o => `
              <tr>
                <td>${new Date(o.created_at).toLocaleString('tr-TR')}</td>
                <td><strong>${o.table_no}</strong></td>
                <td>${o.payment_method === 'cash' ? 'Nakit' : o.payment_method === 'credit_card' ? 'Kredi Kartı' : 'Diğer / Havale'}</td>
                <td>${o.items.length} Kalem</td>
                <td style="text-align: right; font-weight: 700;">${o.total_amount.toFixed(2)} ₺</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Bu belge RestivAdisyon Bulut Platformu tarafından üretilmiş resmi aylık ciro özetidir.
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !issueDescription.trim()) {
      toast.error('Lütfen konu başlığı ve açıklama giriniz.');
      return;
    }

    try {
      setIsSubmittingTicket(true);
      const payload = {
        business_id: business.id,
        sender: 'business',
        subject: subject.trim(),
        message: issueDescription.trim(),
        image_url: imageUrl.trim() || null,
        is_read: false,
        status: 'open',
        is_resolved: false,
      };

      const { data, error } = await supabase.from('support_messages').insert([payload]).select().single();
      if (error) throw error;

      if (data) {
        setMessages([data as SupportMessage]);
      }

      setSubject('');
      setIssueDescription('');
      setImageUrl('');
      toast.success('Sorun bildiriminiz RestivAdisyon Müşteri Hizmetleri\'ne iletildi.');
    } catch (err: any) {
      toast.error('Talep iletilemedi: ' + err.message);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !chatImageUrl) return;

    const text = chatInput.trim();
    const attachedImage = chatImageUrl;
    setChatInput('');
    setChatImageUrl('');
    if (chatFileInputRef.current) chatFileInputRef.current.value = '';

    try {
      setIsSendingMessage(true);
      const { data, error } = await supabase
        .from('support_messages')
        .insert([
          {
            business_id: business.id,
            sender: 'business',
            message: text || '(Görsel paylaşıldı)',
            image_url: attachedImage || null,
            is_read: false,
            status: 'open',
            is_resolved: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMessages((prev) => [...prev, data as SupportMessage]);
      }
    } catch (err: any) {
      toast.error('Mesaj gönderilemedi: ' + err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleEndChat = async () => {
    try {
      setIsEndingChat(true);
      const { error } = await supabase.rpc('end_support_chat', {
        p_business_id: business.id,
      });

      if (error) {
        await supabase
          .from('support_messages')
          .update({ is_resolved: true, status: 'closed', updated_at: new Date().toISOString() })
          .eq('business_id', business.id)
          .eq('status', 'open');
      }

      setMessages([]);
      toast.success('Sohbet sonlandırıldı.');
    } catch (err: any) {
      toast.error('Sohbet sonlandırılırken hata oluştu.');
    } finally {
      setIsEndingChat(false);
    }
  };

  const hasActiveConversation = messages.length > 0;
  const hasAgentReplied = messages.some((m) => m.sender === 'superadmin');

  return (
    <div className="w-full max-w-3xl space-y-4 font-medium text-slate-200">
      {/* 1. SİSTEM BİLDİRİMLERİ (Varsa) */}
      {isTrialExpiring && (
        <div className="bg-[#111622] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white">Deneme Süresi Uyarısı</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {diffDays === 0
                  ? 'Deneme süreniz bugün sona ermektedir. Kesintisiz erişim için lütfen aboneliğinizi yenileyiniz.'
                  : `Deneme sürenizin bitmesine ${diffDays} gün kaldı. Sisteminizin kapanmaması için aboneliğinizi yenileyiniz.`}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-[#1C2433] text-slate-300 px-3 py-1.5 rounded-xl self-start sm:self-auto shrink-0">
            Kalan: {diffDays} Gün
          </span>
        </div>
      )}

      {isMonthlyPdfReady && (
        <div className="bg-[#111622] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white">
                {prevMonthName} Aylık Ciro Raporu Hazır
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Ayın 1-5'i arasında geçen ayın tüm satış, nakit ve kredi kartı dökümünü resmi muhasebe PDF formatında indirebilirsiniz.
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadMonthlyPdf}
            className="px-4 py-2 bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shrink-0 self-start sm:self-auto active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Aylık PDF İndir</span>
          </button>
        </div>
      )}

      {/* 2. SORUN BİLDİR VEYA CANLI SOHBET */}
      {!hasActiveConversation ? (
        /* Direkt, Yalın, Kartsız Sorun Bildirim Formu */
        <form onSubmit={handleSubmitTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Konu Başlığı
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Örn: Yazıcı fiş yazdırmıyor / Garson terminali eşleşmedi..."
              className="w-full bg-[#111622] rounded-xl px-4 py-3 text-xs text-slate-100 font-bold focus:outline-none placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Detaylı Açıklama
            </label>
            <textarea
              required
              rows={6}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Lütfen karşılaştığınız teknik durumu veya sorunuzu detaylı olarak açıklayınız..."
              className="w-full bg-[#111622] rounded-xl p-4 text-xs text-slate-100 font-medium focus:outline-none resize-none placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Ekran Görüntüsü / Fotoğraf (İsteğe Bağlı)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              onChange={handleTicketImageChange}
              className="hidden"
            />

            {!imageUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-[#111622] hover:bg-[#161E2E] rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer transition text-slate-400 hover:text-slate-200 active:scale-[0.99]"
              >
                <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-bold">
                  {isCompressingImage ? 'Görsel işleniyor...' : 'Görsel / Ekran Görüntüsü Seç (.jpg, .png, .webp)'}
                </span>
              </div>
            ) : (
              <div className="relative inline-block mt-1">
                <img
                  src={imageUrl}
                  alt="Seçilen Görsel"
                  className="max-h-44 rounded-xl object-contain bg-[#111622] p-1 shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-[#1C2433] hover:bg-rose-600 text-white rounded-full transition cursor-pointer shadow-md"
                  title="Görseli Kaldır"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmittingTicket || isCompressingImage}
            className="w-full py-3.5 bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmittingTicket ? 'Talebiniz İletiliyor...' : isCompressingImage ? 'Görsel Yükleniyor...' : 'Sorun Bildirimini Gönder'}</span>
          </button>
        </form>
      ) : (
        /* Canlı Destek Mesajlaşma Alanı */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400">
              {hasAgentReplied ? 'Aktif Destek Oturumu' : 'Talebiniz iletildi, temsilci yanıtı bekleniyor...'}
            </span>
            <button
              onClick={handleEndChat}
              disabled={isEndingChat}
              className="px-3 py-1.5 bg-[#1C2433] hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Mevcut sohbeti sonlandırır"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sohbeti Bitir</span>
            </button>
          </div>

          <div className="bg-[#111622] rounded-2xl shadow-lg overflow-hidden flex flex-col min-h-[500px]">
            {/* Mesaj Listesi */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#0C1017] max-h-[500px]">
              {messages.map((m) => {
                const isUser = m.sender === 'business';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed space-y-1.5 shadow-sm ${
                        isUser
                          ? 'bg-[#1C2433] text-slate-100 rounded-br-none'
                          : 'bg-[#141A26] text-slate-200 rounded-bl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-slate-400 pb-1">
                        <span>{isUser ? 'Siz' : 'RestivAdisyon Temsilcisi'}</span>
                        <span>
                          {new Date(m.created_at).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {m.subject && (
                        <div className="text-xs font-bold text-white">
                          Konu: {m.subject}
                        </div>
                      )}

                      <div className="whitespace-pre-wrap">{m.message}</div>

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
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-[#111622] flex flex-col gap-2">
              {chatImageUrl && (
                <div className="relative inline-block self-start">
                  <img
                    src={chatImageUrl}
                    alt="Seçilen Görsel"
                    className="max-h-20 rounded-lg object-contain bg-[#0C1017] p-1 shadow"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setChatImageUrl('');
                      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
                    }}
                    className="absolute -top-1.5 -right-1.5 p-0.5 bg-[#1C2433] hover:bg-rose-600 text-white rounded-full transition cursor-pointer shadow"
                    title="Görseli Kaldır"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-center">
                <input
                  ref={chatFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleChatImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => chatFileInputRef.current?.click()}
                  className="p-2.5 bg-[#0C1017] hover:bg-[#1C2433] text-slate-400 hover:text-slate-200 rounded-xl transition cursor-pointer shrink-0"
                  title="Görsel / Ekran Görüntüsü Ekle"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Mesajınızı yazınız..."
                  className="flex-1 bg-[#0C1017] rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none font-medium placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={(!chatInput.trim() && !chatImageUrl) || isSendingMessage || isCompressingChatImage}
                  className="px-4 py-2.5 bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-40 active:scale-95 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Gönder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
