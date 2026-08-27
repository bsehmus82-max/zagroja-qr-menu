import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageSquare, ShieldCheck, RefreshCw, CheckCheck, 
  HelpCircle, AlertTriangle, Image as ImageIcon, QrCode, 
  DollarSign, Sparkles, ExternalLink, ChevronRight, BookOpen,
  Headphones, Lightbulb, ArrowRight, User, XCircle, Trash2, CheckCircle2,
  Printer, Smartphone, Settings, Utensils, FileText, Download, Clock,
  ChevronDown, ChevronUp, PlusCircle
} from 'lucide-react';
import { Business, SupportMessage, Order } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../lib/audio';
import { sendNativeNotification } from '../../lib/notifications';
import { useToast } from '../../context/ToastContext';

interface BusinessSupportChatProps {
  business: Business;
}

interface GuideSection {
  id: string;
  category: 'bilgilendirme' | 'nasil_kullanirim';
  categoryTitle: string;
  title: string;
  summary: string;
  content: string;
  actionLabel?: string;
  actionUrl?: string;
}

const SYSTEM_GUIDES: GuideSection[] = [
  // BİLGİLENDİRME KATEGORİSİ
  {
    id: 'bilgi-sistem-nedir',
    category: 'bilgilendirme',
    categoryTitle: 'Bilgilendirme & Genel Bakış',
    title: 'Sistem Nedir ve Nasıl Çalışır?',
    summary: 'Restiva Adisyon ve QR Menü sisteminin temel işleyişi ve donanım gereksinimleri.',
    content: `Restiva, restoran, kafe ve işletmeler için sıfır ek donanım maliyetiyle çalışan bulut tabanlı bir adisyon ve dijital QR menü platformudur.

Temel Özellikler:
* Ekstra pahalı el terminali veya özel POS cihazı satın alma zorunluluğu yoktur.
* Tüm garsonlar kendi akıllı telefonlarını kasadaki QR kodu okutarak anında mobil sipariş terminaline dönüştürebilir.
* Müşteriler masadaki QR kodu okutarak canlı menüye ulaşır, sipariş verebilir veya garson/hesap çağırabilir.
* Kasa paneli üzerinden tüm masalar, siparişler, termal yazıcılar ve ciro raporları anlık olarak yönetilir.`,
  },
  {
    id: 'bilgi-abonelik-deneme',
    category: 'bilgilendirme',
    categoryTitle: 'Bilgilendirme & Genel Bakış',
    title: 'Abonelik ve 14 Günlük Ücretsiz Deneme Süreci',
    summary: 'Deneme süresi bitişi, bildirimler ve işletme askıya alma kuralları.',
    content: `Yeni açılan tüm işletmelere 14 günlük ücretsiz tam erişim deneme paketi tanımlanır.

İşleyiş Kuralları:
* Deneme süresinin bitimine 3 gün ve daha az kaldığında panelinizde otomatik bitiş uyarıları gösterilir.
* Süre dolduğunda sistem işletmeyi otomatik olarak askıya alır ve QR menü erişimi geçici olarak kapatılır.
* Aboneliğinizi yenilediğinizde tüm menü, masa ve geçmiş verileriniz korunarak hesabınız anında tekrar aktifleşir.`,
  },
  {
    id: 'bilgi-sifir-komisyon',
    category: 'bilgilendirme',
    categoryTitle: 'Bilgilendirme & Genel Bakış',
    title: 'Sıfır Komisyon ve Sabit Maliyet Avantajı',
    summary: 'Sipariş başına komisyon kesintisi olmadan şeffaf çalışma modeli.',
    content: `Restiva'da verilen hiçbir sipariş üzerinden yüzde veya komisyon kesintisi yapılmaz.

Avantajlar:
* Sabit paket ücreti dışında gizli maliyet veya ek ödeme bulunmaz.
* Masalardan veya garsonlardan ne kadar sipariş alınırsa alınsın cironuzun tamamı işletmenize kalır.`,
  },

  // NASIL KULLANIRIM KATEGORİSİ
  {
    id: 'nasil-menu-urun',
    category: 'nasil_kullanirim',
    categoryTitle: 'Nasıl Kullanırım? (Adım Adım Rehberler)',
    title: '1. Menü & Ürün Yönetimi (Fotoğraf, Fiyat, Stok)',
    summary: 'Ürün ekleme, düzenleme, stok görsel bulma ve tükenen ürünleri kapatma adımları.',
    content: `Menü ve Ürünlerinizi Yönetmek İçin:

1. Fotoğraf Ekleme & Stok Görsel Bulma:
   * İnternetten ücretsiz stok fotoğraf sitelerine (Unsplash veya Pexels) gidin.
   * Beğendiğiniz yemeğin görsel bağlantısını kopyalayıp ürün düzenleme kutusuna yapıştırın.

2. Fiyat Güncelleme:
   * Menü & Ürünler sekmesinde ürünün yanındaki "Düzenle" butonuna basın, yeni fiyatı girip kaydedin. Fiyat müşterilerin menüsünde anında güncellenir.

3. Tükenen Ürünü Kapatma:
   * Biten ürünün altındaki "Tükendi Olarak İşaretle" butonuna bastığınızda ürün menünün en altına kayar ve pasifleşir. Hazır olduğunda aynı butondan tekrar satışa açabilirsiniz.`,
    actionLabel: 'Unsplash Yemek Koleksiyonu',
    actionUrl: 'https://unsplash.com/s/photos/food',
  },
  {
    id: 'nasil-masa-qr',
    category: 'nasil_kullanirim',
    categoryTitle: 'Nasıl Kullanırım? (Adım Adım Rehberler)',
    title: '2. Masa & QR Kod Yönetimi ve PDF Baskı',
    summary: 'Masa ekleme, QR kodları PDF olarak indirme ve masa aparatlarına baskı alma.',
    content: `Masa QR Kodlarını Hazırlamak İçin:

1. Masa Ekleme:
   * "Masa & QR Kodlar" sekmesine giderek işletmenizdeki masa adlarını (Örn: Masa 1, Masa 2, Teras 1) girin.

2. PDF İndirme ve Çıktı Alma:
   * "Tüm QR Kodları Yazdır / PDF İndir" butonuna basınız.
   * Sistem masalara özel QR kodları şık bir baskı şablonu halinde hazırlar.
   * Çıktıyı doğrudan masa aparatlarınıza veya pleksi stantlarınıza yerleştirebilirsiniz.`,
  },
  {
    id: 'nasil-garson-esleme',
    category: 'nasil_kullanirim',
    categoryTitle: 'Nasıl Kullanırım? (Adım Adım Rehberler)',
    title: '3. Garson El Terminali ve Cihaz Eşleme (Şifresiz Sipariş)',
    summary: 'Garsonun telefonunu kasadaki QR ile eşleme ve şifresiz sipariş alma.',
    content: `Garson Telefonunu Eşlemek ve Sipariş Almak İçin:

1. Kasadaki QR Kodu Okutma:
   * Garson kendi telefonunun kamerasıyla kasadaki "Garson Eşleme QR Kodu"nu okutur.
   * Açılan sayfada adını ve soyadını yazıp "Yetki Talebi Gönder" butonuna basar.

2. Kasadan Tek Tıkla Onay:
   * Kasa panelindeki "Garsonlar & Terminaller" sekmesine talep canlı olarak düşer.
   * "Yetkiyi Onayla" butonuna basıldığında garsonun telefonu anında Masa ve Sipariş El Terminaline dönüşür.

3. PIN'siz Doğrudan Sipariş:
   * Onaylanan cihazda her girişte PIN sorulmaz. Garson masayı seçer, ürünleri ekler ve siparişi mutfağa iletir.
   * Mutfak fişinde ve kasada "[Garson: Personel Adı]" bilgisi otomatik yer alır.
   * Ayrılan personelin yetkisi kasadaki listeden çöp kutusu ikonuna basılarak anında iptal edilebilir.`,
  },
  {
    id: 'nasil-canli-siparis',
    category: 'nasil_kullanirim',
    categoryTitle: 'Nasıl Kullanırım? (Adım Adım Rehberler)',
    title: '4. Canlı Siparişler ve Hesap Kapatma (POS / Nakit)',
    summary: 'Gelen siparişleri yönetme ve ödeme türüne göre tek tıkla hesabı kapatma.',
    content: `Sipariş Takibi ve Hesap Kapatma Adımları:

1. Sipariş Karşılama:
   * Masadan veya garsondan gelen sipariş "Bekliyor" sütununda belirir ve sesli bildirim çalar.
   * "Hazırla" butonuna basıldığında sipariş mutfakta hazırlanma aşamasına geçer.

2. Hesabı Kapatma ve Ödeme Türü Seçimi:
   * Masanın hesabı alınırken "Hesabı Kapat" butonuna basılır.
   * Açılan pencerede sipariş detayları ve toplam tutar görüntülenir.
   * Alttaki "POS / Kredi Kartı" veya "Nakit Ödeme" seçeneklerinden birine tıklanarak hesap kapatılır.
   * Tutar otomatik olarak ilgili ciro kalemine (Kredi Kartı veya Nakit) anında kaydedilir.`,
  },
  {
    id: 'nasil-termal-yazici',
    category: 'nasil_kullanirim',
    categoryTitle: 'Nasıl Kullanırım? (Adım Adım Rehberler)',
    title: '5. Termal Fiş Yazıcıları (80mm / 58mm & Otomatik Fiş)',
    summary: 'Mutfak yazıcısı genişlik ayarları ve otomatik yazdırma.',
    content: `Yazıcı Ayarlarını Yapılandırmak İçin:

1. Fiş Genişliği Seçimi:
   * "İşletme Ayarları" sekmesinden kullandığınız termal yazıcıya göre 80mm (Geniş Fiş) veya 58mm (Dar Fiş) seçiniz.

2. Otomatik Yazdırma:
   * "Yeni Siparişte Otomatik Yazdır" ayarını aktif ettiğinizde masadan veya garsondan gelen her sipariş doğrudan mutfak yazıcısına iletilir.
   * Dilediğiniz zaman sipariş kartlarındaki "Yazdır" butonundan tekrar fiş dökümü alabilirsiniz.`,
  },
  {
    id: 'nasil-ciro-rapor',
    category: 'nasil_kullanirim',
    categoryTitle: 'Nasıl Kullanırım? (Adım Adım Rehberler)',
    title: '6. Gün Sonu, Z Raporu ve Aylık Muhasebe PDF Dökümü',
    summary: 'Ciro takibi, Z raporu fişi ve her ayın ilk 5 günü indirilebilen muhasebe PDF raporu.',
    content: `Finansal Raporları İncelemek ve İndirmek İçin:

1. Günlük / Haftalık / Aylık Ciro:
   * "Gün Sonu & Ciro" sekmesinden toplam satış tutarınızı, Nakit ve Kredi Kartı dağılımını görebilirsiniz.

2. Z Raporu Fişi:
   * "Z Raporu Yazdır" butonuna basarak gün sonu kasa kapanış fişini termal yazıcınızdan çıkartabilirsiniz.

3. Aylık Muhasebe PDF Raporu:
   * Her ayın 1'i ile 5'i arasında geçen ayın tüm sipariş ve ciro dökümünü içeren resmi muhasebe PDF raporunu indirebilirsiniz.`,
  },
  {
    id: 'nasil-isletme-wifi',
    category: 'nasil_kullanirim',
    categoryTitle: 'Nasıl Kullanırım? (Adım Adım Rehberler)',
    title: '7. İşletme Bilgileri ve Müşteri WiFi Ayarları',
    summary: 'İşletme adı, iletişim bilgileri ve QR menüde gösterilen WiFi adı ve şifresi.',
    content: `İşletme Ayarlarını Güncellemek İçin:

* "İşletme Ayarları" sekmesine giderek işletme adı, telefon, adres ve müşteri WiFi adı/şifresini girebilirsiniz.
* Girilen WiFi bilgileri müşterilerinizin QR menü ekranında pratik bir şekilde görüntülenir.`,
  },
  {
    id: 'nasil-musteri-oturum-kapatma',
    category: 'nasil_kullanirim',
    categoryTitle: 'Nasıl Kullanırım? (Adım Adım Rehberler)',
    title: '8. Hesap Kapatıldığında Müşteri Ekranı ve Oturum Sıfırlama',
    summary: 'Kasa hesabı kapattığında müşterinin telefonundaki QR menünün anında algılayıp sıfırlanması.',
    content: `Müşteri Cihazının Otomatik Sıfırlanma Mantığı:

1. Canlı Algılama:
   * Kasa panelinden veya garson terminalinden masanın hesabı kapatıldığı anda (Örn: POS veya Nakit ile), masada açık olan müşterinin telefonundaki QR menü canlı olarak kapanışı algılar.

2. Oturum ve Sepet Temizliği:
   * Müşterinin cihazındaki eski sipariş geçmişi ve sepet anında temizlenir.
   * Ekranda "Hesabınız Başarıyla Kapatıldı - Afiyet Olsun / Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz" bilgilendirme kartı belirir.

3. Sekmeyi Kapatma:
   * Müşteriye "Sekmeyi Kapat / Çıkış" butonu sunulur ve masa yeni gelen müşteriler için tamamen temizlenmiş olur.`,
  },
  {
    id: 'nasil-sekme-basliklari',
    category: 'nasil_kullanirim',
    categoryTitle: 'Nasıl Kullanırım? (Adım Adım Rehberler)',
    title: '9. Sekme Başlıkları ve İşletme Adı Görünümü',
    summary: 'Tarayıcı sekmelerinde ve müşteri menülerinde sadece işletme adının yer alması.',
    content: `Sekme Başlıklarının Özelleştirilmesi:

* Müşteriler masadaki QR kodu okuttuğunda Safari, Chrome veya diğer mobil tarayıcı sekmelerinde doğrudan yalnızca işletmenizin adı (Örn: Bistro Kafe) görünür.
* Kasa panelinizde ve garson el terminallerinde de sekme başlığı işletme adınızla senkronize çalışır.`,
  },
];

export const BusinessSupportChat: React.FC<BusinessSupportChatProps> = ({ business }) => {
  const toast = useToast();
  const [activeView, setActiveView] = useState<'guides' | 'ticket'>('guides');
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>('bilgi-sistem-nedir');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'bilgilendirme' | 'nasil_kullanirim'>('all');

  // Issue reporting form state
  const [subject, setSubject] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isEndingChat, setIsEndingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Notifications calculation
  const now = new Date();
  const expiresAt = business.subscription_expires_at ? new Date(business.subscription_expires_at) : null;
  const diffDays = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  const isTrialExpiring = diffDays >= 0 && diffDays <= 3;
  const isMonthlyPdfReady = now.getDate() <= 5;

  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthName = prevMonthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  // Fetch active messages from Supabase
  const loadMessages = async () => {
    try {
      await supabase.rpc('cleanup_old_support_messages');
    } catch {}

    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('business_id', business.id)
      .eq('status', 'open')
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as SupportMessage[]);
      // Mark admin messages as read
      const unreadIds = data.filter((m) => m.sender === 'superadmin' && !m.is_read).map((m) => m.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('support_messages')
          .update({ is_read: true })
          .in('id', unreadIds);
      }
    }
  };

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`support-live-hub-${business.id}`)
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
            if (newMsg.status === 'open') {
              setMessages((prev) => [...prev, newMsg]);
              if (newMsg.sender === 'superadmin') {
                sound.playMessageTone();
                toast.info('Restiva Müşteri Hizmetleri yeni mesaj gönderdi.');
              }
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

  // Handle Monthly PDF Download
  const handleDownloadMonthlyPdf = async () => {
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('business_id', business.id)
      .eq('status', 'paid')
      .gte('created_at', startOfPrevMonth.toISOString())
      .lte('created_at', endOfPrevMonth.toISOString());

    const prevMonthOrders: Order[] = data ? (data as Order[]) : [];
    const mTotal = prevMonthOrders.reduce((acc, o) => acc + o.total_amount, 0);
    const mCash = prevMonthOrders.filter((o) => o.payment_method === 'cash').reduce((acc, o) => acc + o.total_amount, 0);
    const mCard = prevMonthOrders.filter((o) => o.payment_method === 'credit_card').reduce((acc, o) => acc + o.total_amount, 0);

    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      toast.error('Açılır pencere engellendi. Lütfen tarayıcı izinlerini kontrol ediniz.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${business.name} - ${prevMonthName} Aylık Ciro Raporu</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; }
          .stat-label { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
          .stat-value { font-size: 20px; font-weight: 900; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 12px; font-weight: 750; color: #334155; border-bottom: 2px solid #cbd5e1; }
          td { padding: 9px 12px; font-size: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${business.name}</h1>
            <p class="subtitle">Aylık Mali Ciro ve Satış Raporu (${prevMonthName})</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Toplam Satış</div>
            <div class="stat-value" style="color: #ea580c;">${mTotal.toFixed(2)} ₺</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Nakit Gelir</div>
            <div class="stat-value" style="color: #16a34a;">${mCash.toFixed(2)} ₺</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">POS / Kredi Kartı</div>
            <div class="stat-value" style="color: #4f46e5;">${mCard.toFixed(2)} ₺</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Masa</th>
              <th>Ödeme Türü</th>
              <th style="text-align: right;">Tutar</th>
            </tr>
          </thead>
          <tbody>
            ${prevMonthOrders.map((o) => `
              <tr>
                <td>${new Date(o.created_at).toLocaleDateString('tr-TR')} ${new Date(o.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>
                <td><strong>${o.table_no}</strong></td>
                <td>${o.payment_method === 'credit_card' ? 'POS / Kredi Kartı' : 'Nakit'}</td>
                <td style="text-align: right; font-weight: bold;">${o.total_amount.toFixed(2)} ₺</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Restiva Bulut Adisyon ve QR Menü Yönetim Sistemi tarafından üretilmiştir.
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  // Submit Issue Ticket
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

  // Send message in existing chat
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

  // End / Resolve Chat
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
      toast.success('Sohbet sonlandırıldı. Geçmiş kayıtlar 2 saat içinde otomatik temizlenecektir.');
    } catch (err: any) {
      toast.error('Sohbet sonlandırılırken hata oluştu.');
    } finally {
      setIsEndingChat(false);
    }
  };

  const filteredGuides = SYSTEM_GUIDES.filter((g) => {
    if (selectedCategory === 'all') return true;
    return g.category === selectedCategory;
  });

  const hasActiveConversation = messages.length > 0;
  const hasAgentReplied = messages.some((m) => m.sender === 'superadmin');

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* 1. SİSTEM BİLDİRİMLERİ KUTUSU (Trial Expiry, Monthly Report, Support) */}
      <div className="space-y-2.5">
        {/* Trial Warning Alert */}
        {isTrialExpiring && (
          <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-950">Deneme Süresi Uyarısı</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  {diffDays === 0
                    ? 'Deneme süreniz bugün sona ermektedir. Kesintisiz erişim için lütfen aboneliğinizi yenileyiniz.'
                    : `Deneme sürenizin bitmesine ${diffDays} gün kaldı. Sisteminizin kapanmaması için aboneliğinizi yenileyiniz.`}
                </p>
              </div>
            </div>
            <span className="text-xs font-black bg-amber-200/80 text-amber-900 px-3 py-1.5 rounded-xl self-start sm:self-auto shrink-0">
              Kalan: {diffDays} Gün
            </span>
          </div>
        )}

        {/* Monthly Accounting PDF Report Notice (Days 1-5) */}
        {isMonthlyPdfReady && (
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-indigo-950">
                  {prevMonthName} Aylık Ciro Raporu Hazır
                </h4>
                <p className="text-xs text-indigo-800 mt-0.5">
                  Ayın 1-5'i arasında geçen ayın tüm satış, nakit ve kredi kartı dökümünü resmi muhasebe PDF formatında indirebilirsiniz.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadMonthlyPdf}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition shrink-0 self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Aylık PDF İndir</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. ANA SEKMELER: REHBER & BİLGİLENDİRME / SORUN BİLDİR */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <button
          onClick={() => setActiveView('guides')}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 ${
            activeView === 'guides'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-orange-500" />
          <span>Kullanım Kılavuzu & Bilgilendirme</span>
        </button>

        <button
          onClick={() => setActiveView('ticket')}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 relative ${
            activeView === 'ticket'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Sorun Bildir & Destek</span>
          {hasActiveConversation && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse absolute right-4 top-3" />
          )}
        </button>
      </div>

      {/* 3. VIEW: KULLANIM KILAVUZU & BİLGİLENDİRME */}
      {activeView === 'guides' && (
        <div className="space-y-4">
          {/* Category Filter Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Tüm Başlıklar ({SYSTEM_GUIDES.length})
            </button>
            <button
              onClick={() => setSelectedCategory('bilgilendirme')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'bilgilendirme'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Bilgilendirme & Genel Bakış
            </button>
            <button
              onClick={() => setSelectedCategory('nasil_kullanirim')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'nasil_kullanirim'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Nasıl Kullanırım? (Adım Adım)
            </button>
          </div>

          {/* Guides Accordion List */}
          <div className="space-y-3">
            {filteredGuides.map((guide) => {
              const isExpanded = expandedGuideId === guide.id;
              return (
                <div
                  key={guide.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs transition hover:border-slate-300"
                >
                  <div
                    onClick={() => setExpandedGuideId(isExpanded ? null : guide.id)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                        {guide.categoryTitle}
                      </span>
                      <h3 className="text-xs font-extrabold text-slate-900 mt-0.5">{guide.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{guide.summary}</p>
                    </div>

                    <button className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 ml-3">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed space-y-3">
                      <p>{guide.content}</p>

                      {guide.actionUrl && (
                        <div className="pt-2">
                          <a
                            href={guide.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 transition"
                          >
                            <span>{guide.actionLabel}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Direct Ticket CTA */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6">
            <div>
              <h4 className="text-xs font-extrabold text-orange-950">Aradığınız cevabı bulamadınız mı?</h4>
              <p className="text-[11px] text-orange-800 mt-0.5">
                Sorun Bildir formundan bize yazın; Restiva Müşteri Hizmetleri talebinizi anında yanıtlasın.
              </p>
            </div>
            <button
              onClick={() => setActiveView('ticket')}
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 transition shrink-0 self-start sm:self-auto flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Sorun Bildir</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. VIEW: SORUN BİLDİR & CANLI DESTEK */}
      {activeView === 'ticket' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-orange-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Restiva Müşteri Hizmetleri</h3>
                <p className="text-xs text-slate-500">
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
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
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
                <h3 className="text-base font-black text-slate-900">Yeni Sorun Bildirimi</h3>
                <p className="text-xs text-slate-500">
                  Yaşadığınız teknik sorunu veya sorunuzu özetleyiniz. Temsilcimiz yanıtladığında sohbet başlayacaktır.
                </p>
              </div>

              <form onSubmit={handleSubmitTicket} className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Konu Başlığı
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Örn: Yazıcı fiş yazdırmıyor / Garson terminali eşleşmedi..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Detaylı Açıklama
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Lütfen karşılaştığınız durumu detaylı olarak açıklayınız..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ekran Görüntüsü / Resim URL (İsteğe Bağlı)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... (Görsel linki varsa yapıştırabilirsiniz)"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
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
                <div className="p-3.5 bg-amber-50 border-b border-amber-200/80 text-center text-xs text-amber-900 font-medium">
                  Sorun bildiriminiz Restiva Müşteri Hizmetleri'ne iletildi. Müşteri temsilcimiz yanıt yazdığı anda sohbet burada devam edecektir.
                </div>
              )}

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/40 max-h-[500px]">
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
                            ? 'bg-orange-500 text-white rounded-br-none shadow-md shadow-orange-500/20'
                            : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-1 text-[10px] font-black">
                          <span>{isUser ? 'Siz' : 'Restiva Müşteri Hizmetleri'}</span>
                          <span className={isUser ? 'text-orange-100' : 'text-slate-400'}>
                            {new Date(m.created_at).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {m.subject && (
                          <div className={`text-[11px] font-extrabold ${isUser ? 'text-white' : 'text-slate-900'}`}>
                            Konu: {m.subject}
                          </div>
                        )}

                        <div className="whitespace-pre-wrap">{m.message}</div>

                        {m.image_url && (
                          <div className="pt-1.5">
                            <img
                              src={m.image_url}
                              alt="Ekran Görüntüsü"
                              className="max-h-48 rounded-xl object-cover border border-black/10"
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
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-100 bg-white flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Mesajınızı yazınız..."
                  className="flex-1 bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none font-medium placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isSendingMessage}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Gönder</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
