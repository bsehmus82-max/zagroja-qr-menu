import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, ShieldCheck, RefreshCw, CheckCheck, 
  AlertTriangle, Image as ImageIcon,
  ExternalLink, ChevronRight, Headphones, CheckCircle2,
  FileText, Download, Globe
} from 'lucide-react';
import { Business, SupportMessage, Order, PlatformType } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../lib/audio';
import { sendNativeNotification } from '../../lib/notifications';
import { useToast } from '../../context/ToastContext';
import { PLATFORM_INFO } from '../../lib/foodPlatforms';

interface BusinessSupportChatProps {
  business: Business;
}

export const BusinessSupportChat: React.FC<BusinessSupportChatProps> = ({ business }) => {
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const [activeView, setActiveView] = useState<'ticket' | 'platform_request'>('ticket');

  // Platform Request Form States
  const [reqPlatform, setReqPlatform] = useState<PlatformType>('trendyol');
  const [reqMerchantId, setReqMerchantId] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [isSubmittingPlatformReq, setIsSubmittingPlatformReq] = useState(false);

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
              toast.info('Restiva Müşteri Hizmetleri mesaj gönderdi.');
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
          Bu belge Restiva Adisyon Bulut Platformu tarafından üretilmiş resmi aylık ciro özetidir.
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
      toast.success('Sorun bildiriminiz Restiva Müşteri Hizmetleri\'ne iletildi.');
    } catch (err: any) {
      toast.error('Talep iletilemedi: ' + err.message);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSubmitPlatformRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqMerchantId.trim()) {
      toast.error('Lütfen Satıcı / Restoran / Şube ID numaranızı giriniz.');
      return;
    }

    setIsSubmittingPlatformReq(true);
    try {
      const platformName = PLATFORM_INFO[reqPlatform]?.name || reqPlatform;
      const fullSubject = `[Platform Entegrasyon Talebi] ${platformName} (ID: ${reqMerchantId.trim()})`;
      const fullMessage = `İşletmemize "${platformName}" yemek platformunun bağlanmasını talep ediyoruz.\n\nSatıcı / Restoran ID: ${reqMerchantId.trim()}\nİşletme Notu: ${reqNotes.trim() || 'Hemen bağlanmasını rica ederiz.'}`;

      const { data, error } = await supabase
        .from('support_messages')
        .insert([{
          business_id: business.id,
          sender: 'business',
          subject: fullSubject,
          message: fullMessage,
          is_read: false,
          status: 'open',
          is_resolved: false,
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => [...prev, data as SupportMessage]);
        sound.playMessageTone();
        toast.success(`${platformName} entegrasyon talebiniz sistem yöneticisine başarıyla iletildi!`);
        setReqMerchantId('');
        setReqNotes('');
        setActiveView('ticket');
      }
    } catch (err: any) {
      toast.error('Talep iletilemedi: ' + err.message);
    } finally {
      setIsSubmittingPlatformReq(false);
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
    <div className="max-w-5xl mx-auto space-y-5 font-medium text-slate-200">
      {/* 1. SİSTEM BİLDİRİMLERİ KUTUSU */}
      <div className="space-y-2.5">
        {/* Trial Warning Alert */}
        {isTrialExpiring && (
          <div className="bg-[#161E2E] border border-[#2B384E] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold shrink-0 border border-white/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">Deneme Süresi Uyarısı</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {diffDays === 0
                    ? 'Deneme süreniz bugün sona ermektedir. Kesintisiz erişim için lütfen aboneliğinizi yenileyiniz.'
                    : `Deneme sürenizin bitmesine ${diffDays} gün kaldı. Sisteminizin kapanmaması için aboneliğinizi yenileyiniz.`}
                </p>
              </div>
            </div>
            <span className="text-xs font-black bg-white/15 text-white px-3 py-1.5 rounded-xl self-start sm:self-auto shrink-0 border border-white/20">
              Kalan: {diffDays} Gün
            </span>
          </div>
        )}

        {/* Monthly Accounting PDF Report Notice */}
        {isMonthlyPdfReady && (
          <div className="bg-[#161E2E] border border-[#2B384E] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold shrink-0 border border-white/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">
                  {prevMonthName} Aylık Ciro Raporu Hazır
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Ayın 1-5'i arasında geçen ayın tüm satış, nakit ve kredi kartı dökümünü resmi muhasebe PDF formatında indirebilirsiniz.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadMonthlyPdf}
              className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-900 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition shrink-0 self-start sm:self-auto active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Aylık PDF İndir</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. ANA SEKMELER: SORUN BİLDİR & DESTEK / YEMEK PLATFORMU BAĞLAMA */}
      <div className="flex items-center gap-2 bg-[#111622] p-1.5 rounded-2xl border border-[#1F293D] shadow-sm">
        <button
          onClick={() => setActiveView('ticket')}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 relative ${
            activeView === 'ticket'
              ? 'bg-white/15 text-white border border-white/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C2433]'
          }`}
        >
          <Headphones className="w-4 h-4 text-slate-300" />
          <span>Sorun Bildir & Destek</span>
          {hasActiveConversation && (
            <span className="w-2 h-2 rounded-full bg-white animate-pulse absolute right-4 top-3" />
          )}
        </button>

        <button
          onClick={() => setActiveView('platform_request')}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 ${
            activeView === 'platform_request'
              ? 'bg-white/15 text-white border border-white/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C2433]'
          }`}
        >
          <Globe className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Yemek Platformu Bağlama</span>
          <span className="sm:hidden">Platform Bağla</span>
        </button>
      </div>

      {/* 3. VIEW: SORUN BİLDİR & CANLI DESTEK */}
      {activeView === 'ticket' && (
        <div className="bg-[#111622] border border-[#1F293D] rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#1F293D] bg-[#0C1017] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center font-bold shrink-0 border border-white/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Restiva Müşteri Hizmetleri</h3>
                <p className="text-xs text-slate-400">
                  {hasAgentReplied
                    ? 'Aktif Destek Oturumu'
                    : 'Doğrudan teknik destek ve sorun bildirimi'}
                </p>
              </div>
            </div>

            {hasActiveConversation && (
              <button
                onClick={handleEndChat}
                disabled={isEndingChat}
                className="px-3.5 py-1.5 bg-[#1C2433] hover:bg-rose-500/20 border border-[#2B384E] text-slate-300 hover:text-rose-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                title="Mevcut sohbeti sonlandırır"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sohbeti Bitir</span>
              </button>
            )}
          </div>

          {/* Form or Active Messages */}
          {!hasActiveConversation ? (
            /* Ticket Creation Form */
            <div className="p-6 max-w-xl mx-auto w-full space-y-4 my-auto">
              <div className="text-center space-y-1">
                <h3 className="text-base font-black text-white">Yeni Sorun Bildirimi</h3>
                <p className="text-xs text-slate-400">
                  Yaşadığınız teknik sorunu veya sorunuzu özetleyiniz. Temsilcimiz yanıtladığında sohbet başlayacaktır.
                </p>
              </div>

              <form onSubmit={handleSubmitTicket} className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Konu Başlığı
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Örn: Yazıcı fiş yazdırmıyor / Garson terminali eşleşmedi..."
                    className="w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Detaylı Açıklama
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Lütfen karşılaştığınız durumu detaylı olarak açıklayınız..."
                    className="w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl p-3 text-xs text-slate-100 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Ekran Görüntüsü / Resim URL (İsteğe Bağlı)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... (Görsel linki varsa yapıştırabilirsiniz)"
                    className="w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="w-full py-3 bg-white hover:bg-slate-200 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingTicket ? 'Talebiniz İletiliyor...' : 'Sorun Bildirimini Gönder'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* Active Live Chat Thread */
            <div className="flex-1 flex flex-col justify-between">
              {/* Waiting Agent Notice if no reply yet */}
              {!hasAgentReplied && (
                <div className="p-3.5 bg-[#161E2E] border-b border-[#2B384E] text-center text-xs text-slate-300 font-medium">
                  Sorun bildiriminiz Restiva Müşteri Hizmetleri'ne iletildi. Müşteri temsilcimiz yanıt yazdığı anda sohbet burada devam edecektir.
                </div>
              )}

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#0C1017] max-h-[500px]">
                {messages.map((m) => {
                  const isUser = m.sender === 'business';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[90%] sm:max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                          isUser
                            ? 'bg-[#1C2433] text-slate-100 border border-[#2B384E] rounded-br-none shadow-sm'
                            : 'bg-[#111622] border border-[#1F293D] text-slate-200 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 text-[10px] font-black">
                          <span>{isUser ? 'Siz' : 'Restiva Müşteri Hizmetleri'}</span>
                          <span className="text-slate-400">
                            {new Date(m.created_at).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {m.subject && (
                          <div className="text-[11px] font-extrabold text-white">
                            Konu: {m.subject}
                          </div>
                        )}

                        <div className="whitespace-pre-wrap">{m.message}</div>

                        {m.image_url && (
                          <div className="pt-1.5">
                            <img
                              src={m.image_url}
                              alt="Ekran Görüntüsü"
                              className="max-h-48 rounded-xl object-cover border border-[#1F293D]"
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
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-[#1F293D] bg-[#111622] flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Mesajınızı yazınız..."
                  className="flex-1 bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none font-medium placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isSendingMessage}
                  className="px-5 py-2.5 bg-white hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-40 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Gönder</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 5. VIEW: YEMEK PLATFORMU ENTEGRASYON TALEBİ */}
      {activeView === 'platform_request' && (
        <div className="bg-[#111622] border border-[#1F293D] rounded-2xl p-5 sm:p-7 shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
            <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Yemek Platformu Entegrasyon Talebi</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Yemeksepeti, Trendyol, Getir, Tıkla Gelsin vb. hesaplarınızı adisyona bağlatmak için restoran bilgilerinizi iletin. Sistem yöneticiniz kurulumu yaptığında anında bildirim alacaksınız.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitPlatformRequest} className="space-y-4">
            {/* Platform Selector Pills */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Bağlanmasını İstediğiniz Platformu Seçin:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(PLATFORM_INFO) as PlatformType[]).map((plt) => {
                  const info = PLATFORM_INFO[plt];
                  const isSelected = reqPlatform === plt;
                  return (
                    <button
                      type="button"
                      key={plt}
                      onClick={() => setReqPlatform(plt)}
                      className={`p-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 border text-left ${
                        isSelected
                          ? 'bg-white/20 text-white border-white/30 shadow-md'
                          : 'bg-[#0C1017] text-slate-400 hover:text-white hover:bg-[#182030] border-white/[0.04]'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-slate-600'}`} />
                      <span className="truncate">{info.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Merchant ID Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {PLATFORM_INFO[reqPlatform].name} Satıcı / Restoran / Şube ID Numaranız:
              </label>
              <input
                type="text"
                value={reqMerchantId}
                onChange={(e) => setReqMerchantId(e.target.value)}
                placeholder="Örn: 10425 veya TG_IST_082"
                className="w-full bg-[#0C1017] rounded-xl px-4 py-3 text-xs text-white font-mono font-bold focus:outline-none placeholder:text-slate-600 border border-white/[0.06]"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {PLATFORM_INFO[reqPlatform].portalName} üzerindeki satıcı veya mağaza numaranızdır.
              </span>
            </div>

            {/* Notes Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Ek Not veya Talep Detayı (İsteğe Bağlı):
              </label>
              <textarea
                value={reqNotes}
                onChange={(e) => setReqNotes(e.target.value)}
                rows={3}
                placeholder="Örn: Kadıköy şubemizi bağlamak istiyoruz, kurye modelimiz platform kuryesidir."
                className="w-full bg-[#0C1017] rounded-xl p-3 text-xs text-slate-200 focus:outline-none resize-none placeholder:text-slate-600 border border-white/[0.06]"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingPlatformReq}
                className="w-full py-3 bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-md border border-white/25 active:scale-95 disabled:opacity-50"
              >
                {isSubmittingPlatformReq ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-amber-400" />}
                <span>{isSubmittingPlatformReq ? 'Talep İletiliyor...' : 'Entegrasyon Talebini İlet'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
