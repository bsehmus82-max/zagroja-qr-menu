import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, ShieldCheck, 
  AlertTriangle,
  CheckCircle2,
  FileText, Download
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

  // Ticket Form States
  const [subject, setSubject] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Active Chat State
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isEndingChat, setIsEndingChat] = useState(false);

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
    if (!chatInput.trim()) return;

    const text = chatInput.trim();
    setChatInput('');

    try {
      setIsSendingMessage(true);
      const { data, error } = await supabase
        .from('support_messages')
        .insert([
          {
            business_id: business.id,
            sender: 'business',
            message: text,
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
    <div className="max-w-4xl mx-auto space-y-4 font-medium text-slate-200">
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

      {/* 2. SORUN BİLDİR & CANLI DESTEK ANA PANELİ */}
      <div className="bg-[#111622] rounded-2xl shadow-lg overflow-hidden flex flex-col min-h-[560px]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#141A26] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-white">RestivAdisyon Müşteri Hizmetleri</h3>
              <p className="text-[11px] text-slate-400">
                {hasAgentReplied
                  ? 'Aktif Destek Oturumu'
                  : 'Teknik destek, bildirim ve yardım masası'}
              </p>
            </div>
          </div>

          {hasActiveConversation && (
            <button
              onClick={handleEndChat}
              disabled={isEndingChat}
              className="px-3 py-1.5 bg-[#1C2433] hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Mevcut sohbeti sonlandırır"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sohbeti Bitir</span>
            </button>
          )}
        </div>

        {/* İçerik: Form veya Canlı Mesajlaşma */}
        {!hasActiveConversation ? (
          /* Sorun Bildirim Formu */
          <div className="p-6 sm:p-8 max-w-lg mx-auto w-full space-y-4 my-auto">
            <div className="text-center space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-white">Yeni Sorun Bildirimi</h3>
              <p className="text-xs text-slate-400">
                Karşılaştığınız teknik durumu veya sorunuzu iletin. Temsilcimiz yanıtladığında canlı sohbet başlayacaktır.
              </p>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Konu Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Örn: Yazıcı fiş yazdırmıyor / Garson terminali eşleşmedi..."
                  className="w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Detaylı Açıklama
                </label>
                <textarea
                  required
                  rows={4}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Lütfen karşılaştığınız durumu detaylı olarak açıklayınız..."
                  className="w-full bg-[#0C1017] rounded-xl p-3 text-xs text-slate-100 font-medium focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Ekran Görüntüsü / Resim URL (İsteğe Bağlı)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... (Görsel linki varsa yapıştırabilirsiniz)"
                  className="w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingTicket}
                className="w-full py-3 bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmittingTicket ? 'Talebiniz İletiliyor...' : 'Sorun Bildirimini Gönder'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* Canlı Destek Mesajlaşma Alanı */
          <div className="flex-1 flex flex-col justify-between">
            {!hasAgentReplied && (
              <div className="p-3 bg-[#141A26] text-center text-xs text-slate-300 font-medium">
                Sorun bildiriminiz RestivAdisyon Müşteri Hizmetleri'ne iletildi. Temsilcimiz yanıt yazdığında sohbet burada devam edecektir.
              </div>
            )}

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
                            className="max-h-48 rounded-xl object-cover"
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
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-[#111622] flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Mesajınızı yazınız..."
                className="flex-1 bg-[#0C1017] rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none font-medium placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSendingMessage}
                className="px-4 py-2.5 bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-40 active:scale-95 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Gönder</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
