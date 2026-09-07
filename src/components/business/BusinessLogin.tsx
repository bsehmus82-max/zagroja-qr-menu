import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  UtensilsCrossed,
  ShieldCheck,
  Coffee,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Store,
  Zap,
  Printer,
  PieChart,
  QrCode,
  Sliders,
  Flame,
  KeyRound,
  Compass
} from 'lucide-react';
import { supabase, hashPassword } from '../../lib/supabase';
import { Business } from '../../types';

interface BusinessLoginProps {
  onSuccess: (business: Business) => void;
}

interface StyleMeta {
  id: number;
  name: string;
  tag: string;
  desc: string;
}

const STYLES_LIST: StyleMeta[] = [
  { id: 1, name: 'Minimalist Soft Hub', tag: 'Kompakt & Sade', desc: 'Klasik zarif kart, merkez odaklı, ince tepe ışıltısı' },
  { id: 2, name: 'Split-Screen Marka Vitrini', tag: 'Geniş Çift Panel', desc: 'Sol gastronomi vitrini & canlı saat, sağ giriş formu' },
  { id: 3, name: 'Chef Atelier Gastronomi', tag: 'Bistro & Mühür', desc: 'Mühür rozeti, sıcak koyu tonlar ve şef atölyesi hissi' },
  { id: 4, name: 'Hızlı POS & Kasa Terminali', tag: 'Dokunmatik Kasa', desc: 'Büyük butonlar, canlı terminal durumu, dokunmatik uyumlu' },
  { id: 5, name: 'Ambient Spotlight Glow', tag: 'Işık Hüzmesi', desc: 'Arka planda yumuşak radyal ışık huzmesi, buzlu mat yüzey' },
  { id: 6, name: 'Luxury Bistro Muted Gold', tag: 'Sakin Altın Vurgu', desc: 'Asil şampanya altın tonları, rafine tipografi' },
  { id: 7, name: 'Yüzen Ada (Floating Island)', tag: 'Ultra Kavisli', desc: 'Kompakt ada tasarımı, geniş kenar ovallikleri' },
  { id: 8, name: 'Enterprise Özellik Vitrini', tag: 'Modül Önizlemeli', desc: 'Sol tarafta canlı sipariş, termal fiş ve kasa özellikleri' },
  { id: 9, name: 'Modern SaaS Portalı', tag: 'Geniş Karşılama', desc: 'Sistem durumu, ping sayacı ve kurumsal karşılama paneli' },
  { id: 10, name: 'Cyber Terminal Console', tag: 'Monospace & Kod', desc: 'Koyu konsol estetiği, uptime rozeti, mono detaylar' },
  { id: 11, name: 'Nordic Zen Minimal', tag: 'Sıfır Çerçeve', desc: 'Çerçevesiz saf yüzeyler, geniş boşluklar ve İskandinav sadeliği' },
  { id: 12, name: 'Espresso & Lounge Cafe', tag: 'Sıcak Kahve Tonu', desc: 'Sıcak koyu kahve/antrasit tonları, barista amblemi' },
  { id: 13, name: 'Muted Emerald Güvenlik', tag: 'Zümrüt Vurgu', desc: 'Soft zümrüt detaylar, aktif bağlantı göstergesi' },
  { id: 14, name: 'Kart Dışı Kesintisiz (Cardless)', tag: 'Düz Ekrana Entegre', desc: 'Kutu kartı olmadan doğrudan sayfa zemininde süzülen form' },
  { id: 15, name: 'Finansal Kasa & SSL Shield', tag: 'Bankacılık Güvenliği', desc: '256-Bit SSL şifreleme ve zırhlı kasa hissi' },
  { id: 16, name: 'İnce Noktasal Izgara (Matrix Grid)', tag: 'Radyal Matris', desc: 'Arka planda hafif nokta ızgarası ve merkez odak' },
  { id: 17, name: 'Çoklu Şube & Franchise Portalı', tag: 'Merkez Yönetim', desc: 'Şube seçici simülasyonu ve kurumsal yönetim rozeti' },
  { id: 18, name: 'Kapsül / Pill Geometrisi', tag: 'Tam Oval', desc: 'Tüm girdi ve butonlarda tam oval kapsül formu' },
  { id: 19, name: 'Alt Çekmece (Bottom Sheet)', tag: 'Mobil/Tablet Sheet', desc: 'Üstte geniş atmosfer alanı, altta dock edilmiş giriş çekmecesi' },
  { id: 20, name: 'RestivAdisyon Neo-Dark Master', tag: '42 Kural Tam Uyum', desc: 'Vinyet geçişler, mikro canlı nabız ve tam tasarım uyumu' }
];

export const BusinessLogin: React.FC<BusinessLoginProps> = ({ onSuccess }) => {
  const [activeStyle, setActiveStyle] = useState<number>(() => {
    const saved = localStorage.getItem('restiva_login_style_choice');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const setStyle = (id: number) => {
    setActiveStyle(id);
    localStorage.setItem('restiva_login_style_choice', id.toString());
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanUsername = username.trim().toLowerCase();
      const cleanPass = password.trim();
      const passHash = await hashPassword(cleanPass);

      const { data, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('username', cleanUsername)
        .single();

      if (fetchError || !data) {
        setError('Geçersiz kullanıcı adı veya şifre.');
        return;
      }

      const biz = data as Business;

      if (biz.subscription_status === 'suspended') {
        setError('İşletme hesabı askıya alınmıştır.');
        return;
      }

      if (biz.password_hash !== passHash) {
        setError('Girdiğiniz şifre hatalı.');
        return;
      }

      sessionStorage.setItem('restiva_biz_id', biz.id);
      sessionStorage.setItem('restiva_biz_session', JSON.stringify(biz));
      localStorage.setItem('restiva_biz_id', biz.id);
      localStorage.setItem('restiva_biz_session', JSON.stringify(biz));
      onSuccess(biz);
    } catch {
      setError('Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Reusable Form Controls
  const renderError = () => {
    if (!error) return null;
    return (
      <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-semibold animate-in fade-in duration-200">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  };

  const renderInputs = (customInputClass?: string) => (
    <>
      <div>
        <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
          Kullanıcı Adı
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Kullanıcı adınız"
            className={
              customInputClass ||
              "w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition font-medium"
            }
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
          Şifre
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={
              customInputClass ||
              "w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition font-medium"
            }
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  );

  const renderSubmitBtn = (label = 'Yönetim Paneline Giriş Yap', customClass?: string) => (
    <button
      type="submit"
      disabled={loading}
      className={
        customClass ||
        "w-full mt-2 bg-white hover:bg-slate-200 active:scale-98 text-slate-900 font-extrabold py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-sm disabled:opacity-50"
      }
    >
      <span>{loading ? 'Giriş Yapılıyor...' : label}</span>
      <ArrowRight className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0C1017] flex flex-col selection:bg-white/20 selection:text-white font-medium text-slate-200">
      
      {/* 20-STYLE INTERACTIVE PREVIEW SELECTOR BAR (STICKY TOP) */}
      <header className="sticky top-0 z-50 bg-[#111622]/95 backdrop-blur-md border-b border-[#1F293D] shadow-lg px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#1C2433] border border-[#2B384E] flex items-center justify-center text-white">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">20 Giriş Tasarım Önerisi</span>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-300 font-bold">
                  Stil {activeStyle} / 20
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                <strong className="text-white">{STYLES_LIST[activeStyle - 1]?.name}:</strong> {STYLES_LIST[activeStyle - 1]?.desc}
              </p>
            </div>
          </div>

          {/* Quick 1..20 numbered buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setStyle(Math.max(1, activeStyle - 1))}
              disabled={activeStyle === 1}
              className="p-1 rounded bg-[#1C2433] hover:bg-[#2B384E] text-slate-300 disabled:opacity-30 transition"
              title="Önceki Stil"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {STYLES_LIST.map((s) => {
              const isActive = s.id === activeStyle;
              return (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  title={`${s.id}. ${s.name} (${s.tag})`}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-md font-black scale-105'
                      : 'bg-[#141A26] hover:bg-[#1C2433] text-slate-400 hover:text-slate-200 border border-[#1F293D]'
                  }`}
                >
                  {s.id}
                </button>
              );
            })}

            <button
              onClick={() => setStyle(Math.min(20, activeStyle + 1))}
              disabled={activeStyle === 20}
              className="p-1 rounded bg-[#1C2433] hover:bg-[#2B384E] text-slate-300 disabled:opacity-30 transition"
              title="Sonraki Stil"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* DYNAMIC ACTIVE STYLE CONTENT AREA */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        
        {/* =========================================================================
            STIL 1: Minimalist Soft Hub (Kompakt Odaklı Standart)
           ========================================================================= */}
        {activeStyle === 1 && (
          <div className="w-full max-w-sm bg-[#111622] border border-[#1F293D] rounded-3xl p-7 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />
            <div className="text-center mb-6 pt-2">
              <div className="w-12 h-12 rounded-2xl bg-[#1C2433] border border-[#2B384E] text-slate-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-black text-white tracking-tight">RestivAdisyon İşletme Girişi</h1>
              <p className="text-xs text-slate-400 mt-1">Yönetim ve POS paneline erişmek için giriş yapınız</p>
            </div>
            {renderError()}
            <form onSubmit={handleLogin} className="space-y-4">
              {renderInputs()}
              {renderSubmitBtn()}
            </form>
          </div>
        )}

        {/* =========================================================================
            STIL 2: Split-Screen Marka Vitrini (Sol Büyük Vitrin, Sağ Giriş)
           ========================================================================= */}
        {activeStyle === 2 && (
          <div className="w-full max-w-4xl bg-[#111622] border border-[#1F293D] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
            {/* Sol Vitrin */}
            <div className="bg-[#141A26] p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#1F293D] relative">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C2433] border border-[#2B384E] text-[11px] text-slate-300 font-semibold mb-6">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Sistem Aktif • {currentTime}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#1C2433] border border-[#2B384E] text-white flex items-center justify-center mb-4">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight leading-snug">
                  Restoranınızı Tek Noktadan Yönetin.
                </h2>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  Gerçek zamanlı sipariş takibi, temassız QR menü, adisyon fiş çıktısı ve gelişmiş kasa raporlama sistemi.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-[#1F293D] flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                <span>RestivAdisyon v2.4</span>
                <span>Bulut Altyapısı</span>
              </div>
            </div>

            {/* Sağ Form */}
            <div className="p-8 sm:p-10 flex flex-col justify-center">
              <div className="mb-6">
                <h3 className="text-base font-black text-white">Yönetici Girişi</h3>
                <p className="text-xs text-slate-400 mt-1">İşletme hesabınıza bağlanın</p>
              </div>
              {renderError()}
              <form onSubmit={handleLogin} className="space-y-4">
                {renderInputs()}
                {renderSubmitBtn('Panele Giriş Yap')}
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            STIL 3: Chef Atelier & Gastronomi Mührü (Mühür Armalı Klasik Bistro)
           ========================================================================= */}
        {activeStyle === 3 && (
          <div className="w-full max-w-sm bg-[#111622] border border-[#2B384E] rounded-3xl p-8 shadow-2xl relative text-center">
            {/* Gastronomi Mührü */}
            <div className="relative inline-block mx-auto mb-4">
              <div className="w-16 h-16 rounded-full bg-[#1C2433] border-2 border-dashed border-slate-600 flex items-center justify-center mx-auto text-slate-100 shadow-inner">
                <UtensilsCrossed className="w-7 h-7" />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#0C1017] px-2 py-0.5 rounded-full border border-slate-700 text-[9px] font-black tracking-widest text-slate-300 uppercase">
                ATELIER
              </div>
            </div>

            <h1 className="text-base font-black text-white tracking-widest uppercase mb-1">RestivAdisyon</h1>
            <p className="text-[11px] text-slate-400 tracking-wide uppercase font-semibold mb-6">Mutfak & Salon Yönetim Masası</p>

            {renderError()}
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              {renderInputs()}
              {renderSubmitBtn('Atölyeye Bağlan')}
            </form>
          </div>
        )}

        {/* =========================================================================
            STIL 4: Hızlı POS & Kasa Terminali (Dokunmatik Kasa Odaklı)
           ========================================================================= */}
        {activeStyle === 4 && (
          <div className="w-full max-w-md bg-[#111622] border-2 border-[#1F293D] rounded-3xl p-7 shadow-2xl">
            {/* POS Top Bar */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#1F293D]">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                <span className="text-xs font-black text-white tracking-tight uppercase">POS TERMINAL #01</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">{currentTime}</span>
            </div>

            <div className="mb-5">
              <h2 className="text-base font-black text-white">Kasa & Adisyon Girişi</h2>
              <p className="text-xs text-slate-400 mt-0.5">Vardiya veya masa açılışı için yetkili kimliği girin</p>
            </div>

            {renderError()}
            <form onSubmit={handleLogin} className="space-y-4">
              {renderInputs("w-full bg-[#0C1017] border-2 border-[#1F293D] focus:border-slate-400 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-bold")}
              {renderSubmitBtn('Terminali Başlat', 'w-full mt-3 bg-white hover:bg-slate-200 active:scale-98 text-slate-950 font-black py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-50')}
            </form>
          </div>
        )}

        {/* =========================================================================
            STIL 5: Ambient Spotlight Glow (Yumuşak Işık Hüzmesi & Buzlu Cam)
           ========================================================================= */}
        {activeStyle === 5 && (
          <div className="relative w-full max-w-sm">
            {/* Ambient Radial Spotlight Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-slate-600/30 via-slate-400/20 to-slate-700/30 rounded-3xl blur-xl opacity-70" />
            <div className="relative bg-[#111622]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-7 sm:p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-slate-200" />
                </div>
                <h1 className="text-lg font-black text-white">RestivAdisyon Portal</h1>
                <p className="text-xs text-slate-400 mt-1">Işıltılı ve modern işletme deneyimi</p>
              </div>
              {renderError()}
              <form onSubmit={handleLogin} className="space-y-4">
                {renderInputs("w-full bg-[#0C1017]/80 border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition font-medium")}
                {renderSubmitBtn()}
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            STIL 6: Luxury Bistro Muted Gold (Sakin Şampanya Altın Vurgusu)
           ========================================================================= */}
        {activeStyle === 6 && (
          <div className="w-full max-w-sm bg-[#111622] border border-[#3E3424] rounded-3xl p-8 shadow-2xl relative">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#1D1912] border border-[#695434] text-[#D4AF37] flex items-center justify-center mx-auto mb-3 shadow-md">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase">PREMIUM BISTRO</span>
              <h1 className="text-lg font-black text-white tracking-tight mt-0.5">RestivAdisyon Salon</h1>
              <p className="text-xs text-slate-400 mt-1">Özel işletme ve masa yönetim girişi</p>
            </div>
            {renderError()}
            <form onSubmit={handleLogin} className="space-y-4">
              {renderInputs("w-full bg-[#0C1017] border border-[#2B2317] focus:border-[#D4AF37]/50 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition font-medium")}
              {renderSubmitBtn('Salona Giriş Yap', 'w-full mt-2 bg-[#D4AF37] hover:bg-[#E5C358] active:scale-98 text-stone-950 font-black py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md disabled:opacity-50')}
            </form>
          </div>
        )}

        {/* =========================================================================
            STIL 7: Yüzen Ada / Floating Pill (Ultra Kavisli Kompakt Ada)
           ========================================================================= */}
        {activeStyle === 7 && (
          <div className="w-full max-w-xs bg-[#111622] border border-[#1F293D] rounded-[36px] p-7 shadow-2xl text-center">
            <div className="w-10 h-10 rounded-full bg-[#1C2433] border border-[#2B384E] text-white flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="text-base font-black text-white tracking-tight">Hızlı Erişim</h1>
            <p className="text-[11px] text-slate-400 mb-5">İşletme kimliğinizi doğrulayın</p>
            {renderError()}
            <form onSubmit={handleLogin} className="space-y-3 text-left">
              {renderInputs()}
              {renderSubmitBtn('Giriş')}
            </form>
          </div>
        )}

        {/* =========================================================================
            STIL 8: Enterprise Özellik Vitrini (Sol Modül Tanıtım Kartları)
           ========================================================================= */}
        {activeStyle === 8 && (
          <div className="w-full max-w-4xl bg-[#111622] border border-[#1F293D] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Sol Tanıtım Bölümü */}
            <div className="lg:col-span-7 bg-[#141A26] p-8 sm:p-10 border-b lg:border-b-0 lg:border-r border-[#1F293D] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-[#1C2433] border border-[#2B384E] text-white flex items-center justify-center">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-white">RestivAdisyon Enterprise</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight leading-snug mb-3">
                  Tüm restoran operasyonunuz tek ekranda buluşuyor.
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  <div className="p-3.5 rounded-2xl bg-[#111622] border border-[#1F293D]">
                    <Zap className="w-4 h-4 text-amber-400 mb-2" />
                    <h4 className="text-xs font-bold text-white">Canlı Sipariş Takibi</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Masa ve paket siparişleri anlık mutfağa düşer.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#111622] border border-[#1F293D]">
                    <Printer className="w-4 h-4 text-blue-400 mb-2" />
                    <h4 className="text-xs font-bold text-white">Termal Adisyon Çıktısı</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">80mm ve 58mm termal yazıcılarla tam uyumlu.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#111622] border border-[#1F293D]">
                    <PieChart className="w-4 h-4 text-emerald-400 mb-2" />
                    <h4 className="text-xs font-bold text-white">Kasa & Ciro Analizi</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Gün sonu z raporu, nakit ve pos ayrımı.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#111622] border border-[#1F293D]">
                    <QrCode className="w-4 h-4 text-purple-400 mb-2" />
                    <h4 className="text-xs font-bold text-white">Dinamik QR Menü</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Müşteriler için hızlı ve fotosuz/fotolu menü.</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1F293D] text-[11px] text-slate-500">
                Güvenli SSL 256-Bit Şifreleme Aktif
              </div>
            </div>

            {/* Sağ Giriş Formu */}
            <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-center">
              <h3 className="text-base font-black text-white mb-1">Panele Giriş</h3>
              <p className="text-xs text-slate-400 mb-6">Hesabınızı doğrulayın</p>
              {renderError()}
              <form onSubmit={handleLogin} className="space-y-4">
                {renderInputs()}
                {renderSubmitBtn()}
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            STIL 9: Modern SaaS Portalı (Geniş Karşılama)
           ========================================================================= */}
        {activeStyle === 9 && (
          <div className="w-full max-w-md bg-[#111622] border border-[#1F293D] rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#1F293D]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1C2433] border border-[#2B384E] text-white flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">RESTIVADISYON CLOUD</h3>
                  <p className="text-[10px] text-slate-400">Bulut Restoran Yönetim Sistemi</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                Online
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-base font-black text-white">İşletme Girişi</h2>
              <p className="text-xs text-slate-400 mt-1">Panelinize erişmek için bilgilerinizi giriniz</p>
            </div>

            {renderError()}
            <form onSubmit={handleLogin} className="space-y-4">
              {renderInputs()}
              {renderSubmitBtn()}
            </form>
          </div>
        )}

        {/* =========================================================================
            STIL 10: Cyber Terminal Console (Yazılımcı / Mühendislik Koyu Konsol)
           ========================================================================= */}
        {activeStyle === 10 && (
          <div className="w-full max-w-sm bg-[#0C1017] border border-[#1F293D] rounded-2xl p-7 shadow-2xl font-mono">
            {/* Terminal Header */}
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-[#1F293D] text-[11px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              </div>
              <span className="text-slate-400">auth@restiva:~</span>
            </div>

            <div className="mb-5 text-xs text-slate-300">
              <p className="text-emerald-400 font-bold">$ restiva-cli --login</p>
              <p className="text-[11px] text-slate-400 mt-1">Kimlik doğrulama protokolü başlatıldı.</p>
            </div>

            {renderError()}
            <form onSubmit={handleLogin} className="space-y-4">
              {renderInputs("w-full bg-[#111622] border border-[#1F293D] focus:border-emerald-500/50 rounded-lg pl-10 pr-3.5 py-2 text-xs text-emerald-300 font-mono focus:outline-none")}
              {renderSubmitBtn('> Girişi Başlat', 'w-full mt-2 bg-emerald-400 hover:bg-emerald-300 active:scale-98 text-slate-950 font-black py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-xs font-mono shadow-sm disabled:opacity-50')}
            </form>
          </div>
        )}

        {/* =========================================================================
            STIL 11: Nordic Zen Minimal (Sıfır Çerçeve, Saf Tipografi)
           ========================================================================= */}
        {activeStyle === 11 && (
          <div className="w-full max-w-sm bg-[#111622] rounded-3xl p-8 shadow-xl text-center">
            <div className="mb-8">
              <h1 className="text-xl font-light text-white tracking-[0.2em] uppercase">Restiva</h1>
              <div className="w-8 h-0.5 bg-slate-500 mx-auto my-2" />
              <p className="text-[10px] text-slate-400 tracking-widest uppercase">Yönetim Masası</p>
            </div>
            {renderError()}
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              {renderInputs("w-full bg-[#141A26] border-0 rounded-xl pl-10 pr-3.5 py-3 text-xs text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-slate-400 focus:outline-none transition font-medium")}
              {renderSubmitBtn('Giriş', 'w-full mt-4 bg-slate-100 hover:bg-white active:scale-98 text-slate-900 font-black py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs tracking-wider uppercase')}
            </form>
          </div>
        )}

        {/* =========================================================================
            STIL 12: Espresso & Roast Cafe (Sıcak Kahve & Lounge Tonları)
           ========================================================================= */}
        {activeStyle === 12 && (
          <div className="w-full max-w-sm bg-[#13110E] border border-[#2B2319] rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#241E17] border border-[#3E3224] text-amber-500 flex items-center justify-center mx-auto mb-3">
              <Coffee className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-black text-amber-100 tracking-tight">RestivAdisyon Cafe</h1>
            <p className="text-xs text-stone-400 mt-1 mb-6">Barista, Kasa ve Mutfak Girişi</p>
            {renderError()}
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              {renderInputs("w-full bg-[#0C0B0A] border border-[#2B2319] focus:border-amber-600/50 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-amber-50 placeholder:text-stone-600 focus:outline-none transition font-medium")}
              {renderSubmitBtn('Kafeye Giriş Yap', 'w-full mt-2 bg-amber-500 hover:bg-amber-400 active:scale-98 text-stone-950 font-black py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md disabled:opacity-50')}
            </form>
          </div>
        )}

        {/* =========================================================================
            STIL 13: Muted Emerald Pro (Soft Zümrüt Vurgulu Güvenlik)
           ========================================================================= */}
        {activeStyle === 13 && (
          <div className="w-full max-w-sm bg-[#111622] border border-emerald-500/20 rounded-3xl p-8 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/20 via-emerald-400/50 to-emerald-500/20" />
            <div className="text-center mb-6 pt-2">
              <div className="w-12 h-12 rounded-2xl bg-[#1C2433] border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Store className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-black text-white">İşletme Paneli</h1>
              <p className="text-xs text-slate-400 mt-1">Güvenli restoran oturumu</p>
            </div>
            {renderError()}
            <form onSubmit={handleLogin} className="space-y-4">
              {renderInputs()}
              {renderSubmitBtn('Oturum Aç')}
            </form>
          </div>
        )}

        {/* =========================================================================
            STIL 14: Kart Dışı / Düz Ekrana Entegre (Cardless Seamless Flow)
           ========================================================================= */}
        {activeStyle === 14 && (
          <div className="w-full max-w-sm text-center py-4">
            <div className="w-14 h-14 rounded-3xl bg-[#111622] border border-[#1F293D] text-white flex items-center justify-center mx-auto mb-4 shadow-xl">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-1">RestivAdisyon</h1>
            <p className="text-xs text-slate-400 mb-8">Doğrudan ekrana entegre kesintisiz giriş</p>
            {renderError()}
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              {renderInputs("w-full bg-[#111622] border border-[#1F293D] focus:border-slate-400 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition shadow-sm font-medium")}
              {renderSubmitBtn('Giriş Yap', 'w-full mt-3 bg-white hover:bg-slate-200 active:scale-98 text-slate-900 font-black py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-xs shadow-md disabled:opacity-50')}
            </form>
          </div>
        )}

        {/* =========================================================================
            STIL 15: Finansal Kasa & Yüksek Güvenlik Kasası (Shield & 256-bit Vault)
           ========================================================================= */}
        {activeStyle === 15 && (
          <div className="w-full max-w-sm bg-[#111622] border border-[#1F293D] rounded-3xl p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#1F293D]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">256-Bit SSL Korumalı</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">Kasa Modu</span>
            </div>
            <div className="text-center mb-6">
              <h1 className="text-base font-black text-white">Yönetici Kimlik Doğrulama</h1>
              <p className="text-xs text-slate-400 mt-1">Finans ve masa raporlarına erişim</p>
            </div>
            {renderError()}
            <form onSubmit={handleLogin} className="space-y-4">
              {renderInputs()}
              {renderSubmitBtn('Doğrula ve Giriş Yap')}
            </form>
          </div>
        )}

        {/* =========================================================================
            STIL 16: İnce Izgara & Noktasal Matris (Subtle Dot Grid)
           ========================================================================= */}
        {activeStyle === 16 && (
          <div className="relative w-full max-w-sm">
            <div className="w-full bg-[#111622] border border-[#1F293D] rounded-3xl p-8 shadow-2xl relative z-10">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#1C2433] border border-[#2B384E] text-white flex items-center justify-center mx-auto mb-3">
                  <Compass className="w-6 h-6" />
                </div>
                <h1 className="text-lg font-black text-white">Matris Giriş Portalı</h1>
                <p className="text-xs text-slate-400 mt-1">Hassas restoran denetim paneli</p>
              </div>
              {renderError()}
              <form onSubmit={handleLogin} className="space-y-4">
                {renderInputs()}
                {renderSubmitBtn()}
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            STIL 17: Çoklu Şube & Franchise Portalı (Merkez Yönetim Karşılama)
           ========================================================================= */}
        {activeStyle === 17 && (
          <div className="w-full max-w-md bg-[#111622] border border-[#1F293D] rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#1F293D]">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-slate-300" />
                <span className="text-xs font-bold text-white">Franchise & Şube Yönetimi</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">Merkez Ağ</span>
            </div>

            <div className="mb-5">
              <h2 className="text-base font-black text-white">Şube Yönetici Girişi</h2>
              <p className="text-xs text-slate-400 mt-1">Kullanıcı adınız şube yetkinize göre otomatik atanır</p>
            </div>

            {renderError()}
            <form onSubmit={handleLogin} className="space-y-4">
              {renderInputs()}
              {renderSubmitBtn('Şube Paneline Bağlan')}
            </form>
          </div>
        )}

        {/* =========================================================================
            STIL 18: Kapsül / Oval Giriş Çizgisi (Pill Input & Soft Radius)
           ========================================================================= */}
        {activeStyle === 18 && (
          <div className="w-full max-w-sm bg-[#111622] border border-[#1F293D] rounded-[40px] p-8 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-[#1C2433] border border-[#2B384E] text-white flex items-center justify-center mx-auto mb-3">
              <Flame className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-lg font-black text-white">RestivAdisyon</h1>
            <p className="text-xs text-slate-400 mt-1 mb-6">Ergonomik kapsül tasarımı</p>
            {renderError()}
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              {renderInputs("w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-400 rounded-full pl-11 pr-4 py-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition font-medium")}
              {renderSubmitBtn('Giriş Yap', 'w-full mt-2 bg-white hover:bg-slate-200 active:scale-98 text-slate-900 font-black py-3.5 rounded-full transition flex items-center justify-center gap-2 text-xs shadow-md disabled:opacity-50')}
            </form>
          </div>
        )}

        {/* =========================================================================
            STIL 19: Alt Çekmece / Bottom-Docked Modern App (Mobil/Tablet Sheet Stili)
           ========================================================================= */}
        {activeStyle === 19 && (
          <div className="w-full max-w-md bg-[#111622] border border-[#1F293D] rounded-3xl shadow-2xl overflow-hidden">
            {/* Üst Atmosfer */}
            <div className="bg-[#141A26] p-7 text-center border-b border-[#1F293D]">
              <div className="w-12 h-12 rounded-2xl bg-[#1C2433] border border-[#2B384E] text-white flex items-center justify-center mx-auto mb-2">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h2 className="text-base font-black text-white">RestivAdisyon Bulut</h2>
              <p className="text-xs text-slate-400 mt-0.5">Mobil & Tablet Uyumlu Kasa Paneli</p>
            </div>

            {/* Alt Giriş Bölümü */}
            <div className="p-7">
              {renderError()}
              <form onSubmit={handleLogin} className="space-y-4">
                {renderInputs()}
                {renderSubmitBtn()}
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            STIL 20: RestivAdisyon Neo-Dark Başyapıtı (42 Kural Tam Uyumlu Master)
           ========================================================================= */}
        {activeStyle === 20 && (
          <div className="w-full max-w-sm bg-[#111622] border border-[#1F293D] rounded-3xl p-8 shadow-2xl relative">
            {/* Üst Vinyet Çizgisi */}
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="text-center mb-6 pt-1">
              <div className="relative inline-block mb-3">
                <div className="w-13 h-13 rounded-2xl bg-[#1C2433] border border-[#2B384E] text-white flex items-center justify-center shadow-md p-3">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              </div>
              <h1 className="text-lg font-black text-white tracking-tight">RestivAdisyon OS</h1>
              <p className="text-xs text-slate-400 mt-1">Yönetici ve Kasa Operasyon Masası</p>
            </div>

            {/* İnce Vinyet Ayırıcı */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-[#2B384E] to-transparent my-5" />

            {renderError()}
            <form onSubmit={handleLogin} className="space-y-4">
              {renderInputs()}
              {renderSubmitBtn('Yönetim Paneline Giriş Yap')}
            </form>

            <div className="mt-6 pt-4 border-t border-[#1F293D] flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <span>RestivAdisyon Core v2.4</span>
              <span>Aktif Sunucu</span>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER INFO */}
      <footer className="py-3 px-4 text-center border-t border-[#1F293D] bg-[#0C1017] text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>RestivAdisyon v2.4 • 20 Stil İnteraktif İnceleme Modu</span>
        </div>
        <div className="text-slate-400">
          Beğendiğiniz numarayı iletiniz, kalıcı tasarım olarak kilitlenecektir.
        </div>
      </footer>

    </div>
  );
};

