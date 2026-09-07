import React, { useState, useRef, useEffect } from 'react';
import { 
  Wifi, Lock, Check, Save, KeyRound, 
  AlertCircle, Eye, EyeOff, Upload, Link2, Trash2, 
  Camera, Calendar, Settings, Volume2, Play, Radio, Crop, Printer, Bell, ShieldCheck, ChefHat,
  FileText, Download, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Business, SoundPresetKey, Order } from '../../types';
import { supabase, hashPassword } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { sound, SOUND_PRESETS } from '../../lib/audio';
import { isWebAutoPrintEnabled, setWebAutoPrintEnabled } from '../../lib/thermalPrinter';
import { ImageCropperModal } from '../common/ImageCropperModal';
import { AudioNotificationPermissionModal } from '../common/AudioNotificationPermissionModal';

interface BusinessSettingsProps {
  business: Business;
  onUpdate: (updated: Business) => void;
}

const ALL_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const COVER_PRESETS = [
  {
    name: 'Bistro & Kafe',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Kahve & Fırın',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Burger & Izgara',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Şık Restoran & Lounge',
    url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
  },
];

export const BusinessSettings: React.FC<BusinessSettingsProps> = ({ business, onUpdate }) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');
  const [logoUrl, setLogoUrl] = useState(business.logo_url || '');

  const [bannerMode, setBannerMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [bannerUrl, setBannerUrl] = useState(business.banner_url || business.cover_image_url || '');

  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  
  // Web Auto Print & Notification Permissions state
  const [isWebAutoPrint, setIsWebAutoPrint] = useState(() => isWebAutoPrintEnabled());
  const [autoSendToKitchen, setAutoSendToKitchen] = useState<boolean>(business.auto_send_to_kitchen_on_accept ?? true);
  const [autoPrintKitchenOnAccept, setAutoPrintKitchenOnAccept] = useState<boolean>(business.auto_print_kitchen_ticket_on_accept ?? true);
  const [showPermModal, setShowPermModal] = useState(false);

  // Working Schedule State
  const [selectedDays, setSelectedDays] = useState<string[]>(ALL_DAYS);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('00:00');
  const [is24Hours, setIs24Hours] = useState(
    business.working_hours?.toLowerCase().includes('24 saat') || false
  );

  // Wi-Fi State & Toggle
  const [showWifi, setShowWifi] = useState<boolean>(business.show_wifi ?? (business.wifi_ssid ? true : false));
  const [wifiSsid, setWifiSsid] = useState(business.wifi_ssid || '');
  const [wifiPassword, setWifiPassword] = useState(business.wifi_password || '');

  // Sound Preference state
  const [soundPreference, setSoundPreference] = useState<SoundPresetKey>(() => business.sound_preference || sound.getPreferredSound());

  // Image Cropper State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageUrl, setCropperImageUrl] = useState('');
  const [cropperMode, setCropperMode] = useState<'logo' | 'banner'>('logo');

  // Password Change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const now = new Date();
  const dayOfMonth = now.getDate(); // 1 to 31
  const isMonthlyWindowActive = dayOfMonth <= 5;
  const isMonthlyWindowClosingSoon = dayOfMonth >= 4 && dayOfMonth <= 5;
  const daysLeftInWindow = Math.max(0, 6 - dayOfMonth);

  // Previous month name
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthName = prevMonthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  const handleDownloadMonthlyPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const { data: rawOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('business_id', business.id)
        .eq('status', 'paid')
        .gte('created_at', startOfPrevMonth.toISOString())
        .lte('created_at', endOfPrevMonth.toISOString());

      const prevMonthOrders = (rawOrders as Order[]) || [];
      const mTotal = prevMonthOrders.reduce((acc, o) => acc + o.total_amount, 0);
      const mCash = prevMonthOrders.filter((o) => o.payment_method === 'cash').reduce((acc, o) => acc + o.total_amount, 0);
      const mCard = prevMonthOrders.filter((o) => o.payment_method === 'credit_card').reduce((acc, o) => acc + o.total_amount, 0);
      const mOther = prevMonthOrders.filter((o) => o.payment_method === 'other' || o.payment_method === 'online' || o.payment_method === 'bank_transfer').reduce((acc, o) => acc + o.total_amount, 0);

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
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
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
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${prevMonthOrders.length} Sipariş</div>
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

          <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 10px;">Son İşlem Hareketleri</h3>
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
              ${prevMonthOrders.slice(0, 50).map(o => `
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
    } catch {
      toast.error('Rapor oluşturulurken bir hata meydana geldi.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  useEffect(() => {
    if (is24Hours) {
      setSelectedDays(ALL_DAYS);
    }
  }, [is24Hours]);

  const toggleDay = (day: string) => {
    if (is24Hours) {
      toast.info('24 Saat Açık seçildiğinde çalışma günleri otomatik olarak "Her Gün"dür.');
      return;
    }
    setSelectedDays((prev) =>
      prev.includes(day) ? (prev.length > 1 ? prev.filter((d) => d !== day) : prev) : [...prev, day]
    );
  };

  const getDaysSummary = () => {
    if (selectedDays.length === 7) return 'Her Gün';
    if (
      selectedDays.length === 5 &&
      ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'].every((d) => selectedDays.includes(d))
    ) {
      return 'Hafta İçi';
    }
    if (
      selectedDays.length === 6 &&
      ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].every((d) => selectedDays.includes(d))
    ) {
      return 'Pzt - Cmt';
    }
    return selectedDays.join(', ');
  };

  const workingHoursDisplay = is24Hours ? 'Her Gün: 7/24 Açık' : `${getDaysSummary()}: ${openTime} - ${closeTime}`;

  const applyPresetHours = (preset: string) => {
    if (preset === '24') {
      setIs24Hours(true);
      setSelectedDays(ALL_DAYS);
    } else {
      setIs24Hours(false);
      const [start, end] = preset.split('-');
      setOpenTime(start);
      setCloseTime(end);
    }
  };

  const applyDaysPreset = (type: 'all' | 'weekdays' | 'mon_sat') => {
    if (is24Hours && type !== 'all') {
      setIs24Hours(false);
    }
    if (type === 'all') setSelectedDays(ALL_DAYS);
    if (type === 'weekdays') setSelectedDays(['Pzt', 'Sal', 'Çar', 'Per', 'Cum']);
    if (type === 'mon_sat') setSelectedDays(['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']);
  };

  // Image Upload Handler (Opens Cropper Modal)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir görsel seçiniz (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCropperImageUrl(event.target.result as string);
        setCropperMode('logo');
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Banner / Cover Photo Upload Handler (Opens Cropper Modal)
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir görsel seçiniz (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCropperImageUrl(event.target.result as string);
        setCropperMode('banner');
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    if (cropperMode === 'logo') {
      setLogoUrl(croppedDataUrl);
      toast.success('Logo kırpıldı ve önizlemeye eklendi!');
    } else {
      setBannerUrl(croppedDataUrl);
      toast.success('Kapak görseli kırpıldı ve önizlemeye eklendi!');
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const finalWifiSsid = showWifi ? wifiSsid.trim() : '';
      const finalWifiPassword = showWifi ? wifiPassword.trim() : '';

      const payload: Record<string, unknown> = {
        phone: phone.trim(),
        address: address.trim(),
        working_hours: workingHoursDisplay,
        wifi_ssid: finalWifiSsid,
        wifi_password: finalWifiPassword,
        sound_preference: soundPreference,
        auto_send_to_kitchen_on_accept: autoSendToKitchen,
        auto_print_kitchen_ticket_on_accept: autoPrintKitchenOnAccept,
        logo_url: logoUrl ? logoUrl.trim() : null,
        banner_url: bannerUrl ? bannerUrl.trim() : null,
        cover_image_url: bannerUrl ? bannerUrl.trim() : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('businesses')
        .update(payload)
        .eq('id', business.id)
        .select()
        .single();

      if (!error && data) {
        sound.setPreferredSound(soundPreference);
        sessionStorage.setItem('restiva_biz_session', JSON.stringify(data));
        localStorage.setItem('restiva_biz_session', JSON.stringify(data));
        localStorage.setItem('restiva_sound_preference', soundPreference);
        onUpdate(data as Business);
        setSavedSuccess(true);
        toast.success('Ayarlar ve bildirim sesi tercihi başarıyla kaydedildi!');
        setTimeout(() => setSavedSuccess(false), 2500);
      } else {
        toast.error('Ayarlar kaydedilirken bir hata oluştu: ' + (error?.message || ''));
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);

    if (newPassword.length < 6) {
      setPassError('Yeni şifre en az 6 karakter olmalıdır.');
      toast.warning('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Şifreler birbiriyle eşleşmiyor.');
      toast.error('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setSavingPass(true);
    try {
      const newHash = await hashPassword(newPassword.trim());

      const { data, error } = await supabase
        .from('businesses')
        .update({
          password_hash: newHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        sessionStorage.setItem('restiva_biz_session', JSON.stringify(data));
        localStorage.setItem('restiva_biz_session', JSON.stringify(data));
        onUpdate(data as Business);
        setPassSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Giriş şifreniz güncellendi!');
        setTimeout(() => setPassSuccess(false), 3000);
      }
    } catch {
      setPassError('Şifre güncellenirken hata oluştu.');
      toast.error('Şifre güncellenirken hata oluştu.');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-medium text-slate-200">
      {/* Visual Audio & Notification Permission Guide Modal */}
      <AudioNotificationPermissionModal forceOpen={showPermModal} onClose={() => setShowPermModal(false)} />

      {/* Top Save Bar */}
      <div className="flex items-center justify-between bg-[#111622] p-4 rounded-3xl shadow-lg">
        <div>
          <h3 className="font-extrabold text-xs text-white">İşletme ve Panel Ayarları</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">İşletme kimliği, otomasyon ve panel tercihlerini yapılandırın</p>
        </div>

        <button
          type="button"
          onClick={handleSaveGeneral}
          disabled={saving}
          onMouseMove={handleSpotlightMove}
          className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50 active:scale-95 border border-white/25 spotlight-card spotlight-glow"
        >
          {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4 text-white" />}
          <span>{savedSuccess ? 'Kaydedildi' : saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
        </button>
      </div>

      {/* Panel & Automation Controls (Oto Fiş & Ses İzinleri) */}
      <div className="bg-[#111622] rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-300" />
            <h3 className="font-bold text-xs text-white">Panel Otomasyonu & Bildirim Tercihleri</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sipariş fişlerinin otomatik yazdırılması ve tarayıcı ses/bildirim izinlerini buradan yönetebilirsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Web Auto Print Toggle */}
          <div className="bg-[#0C1017] p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1 pr-3">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-slate-300" />
                <span className="font-extrabold text-xs text-white">Genel Otomatik Fiş Yazdırma</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Masadan ya da kasadan yeni sipariş geldiğinde 80mm/58mm termal adisyon fişi otomatik oluşturulur ve yazdırılır.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isWebAutoPrint}
                onChange={(e) => {
                  const next = e.target.checked;
                  setIsWebAutoPrint(next);
                  setWebAutoPrintEnabled(next);
                  toast.info(next ? 'Otomatik Fiş Yazdırma Açık' : 'Otomatik Fiş Yazdırma Kapalı');
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#182030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/30 peer-checked:after:bg-white border border-white/[0.08]"></div>
            </label>
          </div>

          {/* Auto Send to Kitchen on Accept */}
          <div className="bg-[#0C1017] p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1 pr-3">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-orange-400" />
                <span className="font-extrabold text-xs text-white">Onaylanan Siparişi Mutfağa İlet</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Sipariş onaylandığı anda Mutfak KDS ekranına anında düşer ve mutfak personeline sesli uyarı verir.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoSendToKitchen}
                onChange={(e) => {
                  setAutoSendToKitchen(e.target.checked);
                  toast.info(e.target.checked ? 'Mutfak Otomatik İletimi Açık' : 'Mutfak Otomatik İletimi Kapalı');
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#182030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/30 peer-checked:after:bg-white border border-white/[0.08]"></div>
            </label>
          </div>

          {/* Auto Print Kitchen Ticket on Accept */}
          <div className="bg-[#0C1017] p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1 pr-3">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="font-extrabold text-xs text-white">Sipariş Onayında Mutfak Fişi Yazdır</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Kasa veya işletme paneli siparişi onayladığında mutfak hazırlık fişi otomatik yazdırılır.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoPrintKitchenOnAccept}
                onChange={(e) => {
                  setAutoPrintKitchenOnAccept(e.target.checked);
                  toast.info(e.target.checked ? 'Onayda Mutfak Fişi Yazdırma Açık' : 'Onayda Mutfak Fişi Yazdırma Kapalı');
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#182030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/30 peer-checked:after:bg-white border border-white/[0.08]"></div>
            </label>
          </div>

          {/* Sound & Notification Permission Tester */}
          <div className="bg-[#0C1017] p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1 pr-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-300" />
                <span className="font-extrabold text-xs text-white">Ses & Bildirim İzinleri</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Tarayıcınızın arka plandayken dahi sesli zil ve masaüstü bildirim göndermesini sağlar.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPermModal(true)}
              onMouseMove={handleSpotlightMove}
              className="px-3.5 py-2 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-slate-200 hover:text-white font-bold text-xs transition active:scale-95 shrink-0 border border-white/[0.08] spotlight-card spotlight-glow"
            >
              İzinleri Aç & Test Et
            </button>
          </div>
        </div>
      </div>

      {/* Dual Logo Field */}
      <div className="bg-[#111622] rounded-3xl p-5 sm:p-6 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">İşletme Logosu</span>

          <div className="flex items-center gap-1 bg-[#0C1017] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setLogoMode('upload')}
              onMouseMove={handleSpotlightMove}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 spotlight-card spotlight-glow ${
                logoMode === 'upload' ? 'bg-white/20 text-white border border-white/25 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3 h-3" />
              Fotoğraf
            </button>
            <button
              type="button"
              onClick={() => setLogoMode('url')}
              onMouseMove={handleSpotlightMove}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 spotlight-card spotlight-glow ${
                logoMode === 'url' ? 'bg-white/20 text-white border border-white/25 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link2 className="w-3 h-3" />
              Görsel URL
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#0C1017] p-4 rounded-2xl">
          {logoUrl ? (
            <div className="relative group shrink-0">
              <img src={logoUrl} alt="Logo" className="w-14 h-14 object-contain rounded-2xl bg-white p-1 shadow-sm" />
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md transition"
                title="Kaldır"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCropperImageUrl(logoUrl);
                  setCropperMode('logo');
                  setCropperOpen(true);
                }}
                className="absolute -bottom-1.5 -right-1.5 bg-[#1C2433] hover:bg-[#253043] text-white p-1 rounded-full shadow-md transition"
                title="Logoyu Kırp & Ayarla"
              >
                <Crop className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-12 h-12 flex items-center justify-center text-slate-500 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
          )}

          {logoMode === 'upload' ? (
            <div className="flex-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp, image/svg+xml"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onMouseMove={handleSpotlightMove}
                className="bg-[#111622] hover:bg-[#161E2E] rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 hover:text-white border border-white/[0.06] hover:border-white/[0.12] spotlight-card spotlight-glow"
              >
                <Upload className="w-4 h-4 text-slate-300" />
                <span>{logoUrl ? 'Logoyu Değiştir & Kırp' : 'Cihazdan Fotoğraf Seç & Kırp'}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://... /logo.png"
                className="w-full bg-[#111622] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Cover / Banner Photo Card */}
      <div className="bg-[#111622] rounded-3xl p-5 sm:p-6 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-200 block">QR Menü Kapak & Arka Plan Fotoğrafı</span>
            <span className="text-[10px] text-slate-400">Müşterilerin QR menüyü açtığında en üstte gördüğü geniş arka plan görseli</span>
          </div>

          <div className="flex items-center gap-1 bg-[#0C1017] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setBannerMode('upload')}
              onMouseMove={handleSpotlightMove}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 spotlight-card spotlight-glow ${
                bannerMode === 'upload' ? 'bg-white/20 text-white border border-white/25 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3 h-3" />
              Fotoğraf
            </button>
            <button
              type="button"
              onClick={() => setBannerMode('presets')}
              onMouseMove={handleSpotlightMove}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 spotlight-card spotlight-glow ${
                bannerMode === 'presets' ? 'bg-white/20 text-white border border-white/25 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hazır Şablonlar
            </button>
            <button
              type="button"
              onClick={() => setBannerMode('url')}
              onMouseMove={handleSpotlightMove}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 spotlight-card spotlight-glow ${
                bannerMode === 'url' ? 'bg-white/20 text-white border border-white/25 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link2 className="w-3 h-3" />
              URL
            </button>
          </div>
        </div>

        <div className="bg-[#0C1017] p-4 rounded-2xl space-y-3">
          {bannerUrl ? (
            <div className="relative group w-full h-32 rounded-2xl overflow-hidden bg-black/60 shadow-sm">
              <img src={bannerUrl} alt="Kapak" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setBannerUrl('')}
                className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-full shadow-md transition"
                title="Kapak Fotoğrafını Kaldır"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCropperImageUrl(bannerUrl);
                  setCropperMode('banner');
                  setCropperOpen(true);
                }}
                onMouseMove={handleSpotlightMove}
                className="absolute top-2 left-2 bg-[#1C2433] hover:bg-[#253043] text-white px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-md transition flex items-center gap-1 border border-white/[0.08] spotlight-card spotlight-glow"
                title="Görseli Ayarla / Kırp"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Görseli Ayarla / Kırp</span>
              </button>
            </div>
          ) : (
            <div className="w-full h-24 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-[#111622]">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Henüz kapak fotoğrafı yüklenmedi (Varsayılan şablon kullanılır)</span>
            </div>
          )}

          {bannerMode === 'upload' && (
            <div>
              <input
                type="file"
                ref={bannerFileInputRef}
                onChange={handleBannerFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
              <div
                onClick={() => bannerFileInputRef.current?.click()}
                onMouseMove={handleSpotlightMove}
                className="bg-[#111622] hover:bg-[#161E2E] rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs font-bold text-slate-200 hover:text-white shadow-sm border border-white/[0.06] hover:border-white/[0.12] spotlight-card spotlight-glow"
              >
                <Upload className="w-4 h-4 text-slate-300" />
                <span>{bannerUrl ? 'Kapak Fotoğrafını Değiştir (Cihazdan Seç)' : 'Cihazdan Geniş Kapak Fotoğrafı Seç'}</span>
              </div>
            </div>
          )}

          {bannerMode === 'presets' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {COVER_PRESETS.map((preset) => (
                <div
                  key={preset.name}
                  onClick={() => {
                    setBannerUrl(preset.url);
                    toast.success(preset.name + ' seçildi!');
                  }}
                  className={`cursor-pointer rounded-2xl overflow-hidden transition relative group ${
                    bannerUrl === preset.url ? 'ring-2 ring-white shadow-md' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-16 object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/80 text-white text-[10px] font-bold py-0.5 text-center truncate px-1">
                    {preset.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {bannerMode === 'url' && (
            <div>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-[#111622] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Working Schedule Card */}
      <div className="bg-[#111622] rounded-3xl p-5 sm:p-6 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-300" />
            <h3 className="font-bold text-xs text-white">Çalışma Günleri & Saatleri</h3>
          </div>
          <span className="text-xs font-bold text-slate-300 font-mono">{workingHoursDisplay}</span>
        </div>

        <div className="bg-[#0C1017] p-4 rounded-2xl space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">Haftalık Günler</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyDaysPreset('all')}
                  onMouseMove={handleSpotlightMove}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold border border-white/[0.06] spotlight-card spotlight-glow"
                >
                  Her Gün
                </button>
                <button
                  type="button"
                  onClick={() => applyDaysPreset('weekdays')}
                  onMouseMove={handleSpotlightMove}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold border border-white/[0.06] spotlight-card spotlight-glow"
                >
                  Hafta İçi
                </button>
                <button
                  type="button"
                  onClick={() => applyDaysPreset('mon_sat')}
                  onMouseMove={handleSpotlightMove}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold border border-white/[0.06] spotlight-card spotlight-glow"
                >
                  Pzt - Cmt
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {ALL_DAYS.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    onMouseMove={handleSpotlightMove}
                    className={`py-2 rounded-xl text-xs font-bold transition text-center spotlight-card spotlight-glow ${
                      isSelected
                        ? 'bg-white/20 text-white border border-white/30 font-black shadow-sm'
                        : 'bg-[#182030] text-slate-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-[#1F293D]/60">
            {!is24Hours ? (
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 mb-1">Açılış</span>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full bg-[#111622] rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 mb-1">Kapanış</span>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full bg-[#111622] rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none font-bold"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full bg-white/10 rounded-xl py-2 px-3 text-xs text-white font-bold mb-2 text-center">
                24 Saat Açık Hizmet (Haftanın 7 Günü)
              </div>
            )}

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '09:00 - 00:00', val: '09:00-00:00' },
                { label: '08:00 - 22:00', val: '08:00-22:00' },
                { label: '11:00 - 02:00', val: '11:00-02:00' },
                { label: '24 Saat Açık', val: '24' },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => applyPresetHours(preset.val)}
                  onMouseMove={handleSpotlightMove}
                  className="py-1.5 px-1 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-[10px] font-bold text-slate-300 border border-white/[0.06] transition truncate text-center spotlight-card spotlight-glow"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Wi-Fi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact */}
        <div className="bg-[#111622] rounded-3xl p-5 sm:p-6 shadow-lg space-y-3">
          <h3 className="font-bold text-xs text-white">İletişim & Açık Adres</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Telefon Numarası
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0 (212) 000 00 00"
              className="w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Açık Adres
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="İşletme açık adresi..."
              className="w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Wi-Fi */}
        <div className="bg-[#111622] rounded-3xl p-5 sm:p-6 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                <Wifi className="w-4 h-4 text-slate-300" />
                Müşteri Wi-Fi Bilgileri
              </h3>
              <p className="text-[10px] text-slate-400">QR menüde misafirlere gösterilsin mi?</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showWifi}
                onChange={(e) => setShowWifi(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#0C1017] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white/30 peer-checked:after:bg-white"></div>
            </label>
          </div>

          {showWifi ? (
            <div className="space-y-2.5 pt-1 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Wi-Fi Ağ Adı (SSID)
                </label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="Restoran_Misafir"
                  className="w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Wi-Fi Şifresi
                </label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Misafir1234"
                  className="w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#0C1017] rounded-2xl text-center text-xs text-slate-400">
              Wi-Fi bilgisi müşteri menüsünde gizlidir.
            </div>
          )}
        </div>

        {/* 5 Distinct Notification Sound Presets */}
        <div className="bg-[#111622] rounded-3xl p-5 sm:p-6 shadow-lg space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-slate-300" />
                Sipariş ve Çağrı Bildirim Sesi (5 Seçenek)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Yeni siparişler, garson çağrıları ve hesap talepleri geldiğinde çalacak bildirim sesini seçiniz.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SOUND_PRESETS.map((preset) => {
              const isSelected = soundPreference === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => {
                    setSoundPreference(preset.id);
                    sound.playOrderBell(preset.id);
                  }}
                  onMouseMove={handleSpotlightMove}
                  className={`p-3.5 rounded-2xl cursor-pointer transition flex items-center justify-between spotlight-card spotlight-glow ${
                    isSelected
                      ? 'bg-white/20 text-white font-extrabold border border-white/30 shadow-sm'
                      : 'bg-[#0C1017] text-slate-300 hover:bg-[#182030] border border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Radio className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">{preset.name}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                        {preset.description}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playOrderBell(preset.id);
                    }}
                    className={`p-1.5 rounded-xl transition shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#1C2433] text-slate-300 hover:text-white'
                    }`}
                    title="Dinle"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="bg-[#111622] rounded-3xl p-5 sm:p-6 shadow-lg space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-300" />
            <h3 className="font-bold text-xs text-white">Yeni Şifre Belirleme</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            İşletmenizin mevcut giriş şifresini değiştirdiğinizde eski şifre sistemden silinir ve yeni belirlediğiniz şifre tek geçerli giriş şifresi olur.
          </p>
        </div>

        {passError && (
          <div className="p-3 bg-rose-500/10 rounded-2xl flex items-center gap-2 text-rose-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        {passSuccess && (
          <div className="p-3 bg-emerald-500/10 rounded-2xl flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <Check className="w-4 h-4 shrink-0" />
            <span>Giriş şifreniz başarıyla güncellendi!</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Yeni Şifre
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full bg-[#0C1017] rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-slate-100 focus:outline-none font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Yeni Şifre (Tekrar)
            </label>
            <div className="relative">
              <input
                type={showConfirmPass ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Tekrar girin"
                className="w-full bg-[#0C1017] rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-slate-100 focus:outline-none font-bold"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={savingPass || !newPassword}
              onMouseMove={handleSpotlightMove}
              className="w-full py-2.5 bg-white/20 hover:bg-white/30 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 border border-white/25 shadow-md spotlight-card spotlight-glow"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{savingPass ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 5-DAY MONTHLY FINANCIAL & TURNOVER REPORT DOWNLOAD CARD */}
      <div className="bg-[#111622] rounded-3xl p-5 sm:p-6 text-slate-200 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1C2433] flex items-center justify-center text-slate-200 shrink-0">
                <FileText className="w-5 h-5 text-slate-200" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Aylık Finans & Ciro Raporu ({prevMonthName})</span>
                  {isMonthlyWindowActive ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/10 text-slate-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 5 Günlük İndirme Penceresi Aktif
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0C1017] text-slate-400">
                      İndirme Penceresi Kapandı
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isMonthlyWindowActive 
                    ? `Geçen aya ait resmi ciro, nakit/POS/havale dökümü ve son satış hareketlerini PDF olarak indirebilirsiniz.`
                    : `Geçen ayın 5 günlük indirme penceresi sona erdi. Bir sonraki ayın raporu ayın 1'inde açılacaktır.`
                  }
                </p>
              </div>
            </div>

            {isMonthlyWindowClosingSoon && (
              <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5 pt-1 animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                Dikkat: Bu raporu indirmek için son {daysLeftInWindow} gününüz kaldı! (Ayın 6'sında defter arşive kaldırılır).
              </p>
            )}
          </div>

          {isMonthlyWindowActive && (
            <button
              onClick={handleDownloadMonthlyPdf}
              disabled={isGeneratingPdf}
              className="px-5 py-3 bg-white hover:bg-slate-200 active:scale-95 text-slate-900 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Hazırlanıyor...' : 'Aylık Raporu İndir (PDF)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Otomatik Termal Fiş Yazdırma Ayarı */}
      <div className="bg-[#111622] rounded-3xl p-5 sm:p-6 text-slate-200 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C2433] text-slate-200 flex items-center justify-center shrink-0 shadow-sm">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <span>Otomatik Termal Fiş Yazdırma</span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isWebAutoPrint ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isWebAutoPrint ? 'Aktif (Otomatik)' : 'Kapalı'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Masadan yeni bir sipariş verildiğinde adisyon fişini termal yazıcıya otomatik gönderir.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => {
              const next = !isWebAutoPrint;
              setIsWebAutoPrint(next);
              setWebAutoPrintEnabled(next);
              toast.success(next ? 'Otomatik termal fiş yazdırma açıldı.' : 'Otomatik termal fiş yazdırma kapatıldı.');
            }}
            className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
              isWebAutoPrint ? 'bg-white' : 'bg-[#1C2433]'
            }`}
          >
            <div
              className={`bg-[#0C1017] w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${
                isWebAutoPrint ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Interactive Image Cropper & Positioning Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageUrl={cropperImageUrl}
        mode={cropperMode}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
