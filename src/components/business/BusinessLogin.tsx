import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { supabase, hashPassword } from '../../lib/supabase';
import { Business } from '../../types';

interface BusinessLoginProps {
  onSuccess: (business: Business) => void;
}

export const BusinessLogin: React.FC<BusinessLoginProps> = ({ onSuccess }) => {
  // Remember Me state loaded from localStorage
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return localStorage.getItem('restiva_remember_me') === 'true';
  });

  const [username, setUsername] = useState<string>(() => {
    const isRemembered = localStorage.getItem('restiva_remember_me') === 'true';
    return isRemembered ? (localStorage.getItem('restiva_remembered_username') || '') : '';
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Stealth Ambient Cursor Light Coordinates & Proximity
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -999, y: -999 });
  const [spotlightOpacity, setSpotlightOpacity] = useState<number>(0.12);
  const formRef = useRef<HTMLDivElement>(null);

  // Trigger entrance animations on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // Track mouse move for ambient light and expanded stealth occlusion
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      if (formRef.current) {
        const rect = formRef.current.getBoundingClientRect();
        const formCenterX = rect.left + rect.width / 2;
        const formCenterY = rect.top + rect.height / 2;
        const dist = Math.hypot(e.clientX - formCenterX, e.clientY - formCenterY);

        // Expanded stealth absorption zone (560px radius around center)
        const absorptionRadius = 560;
        if (dist < absorptionRadius) {
          const factor = Math.max(0, (dist - 140) / (absorptionRadius - 140));
          setSpotlightOpacity(0.12 * factor);
        } else {
          setSpotlightOpacity(0.12);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isFormFilled = username.trim().length > 0 && password.trim().length > 0;

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

      // Handle real "Beni Hatırla" persistence
      if (rememberMe) {
        localStorage.setItem('restiva_remember_me', 'true');
        localStorage.setItem('restiva_remembered_username', cleanUsername);
        localStorage.setItem('restiva_biz_id', biz.id);
        localStorage.setItem('restiva_biz_session', JSON.stringify(biz));
      } else {
        localStorage.setItem('restiva_remember_me', 'false');
        localStorage.removeItem('restiva_remembered_username');
        localStorage.removeItem('restiva_biz_id');
        localStorage.removeItem('restiva_biz_session');
        localStorage.removeItem('zagroja_business_id');
        localStorage.removeItem('zagroja_business_data');
      }

      sessionStorage.setItem('restiva_biz_id', biz.id);
      sessionStorage.setItem('restiva_biz_session', JSON.stringify(biz));
      onSuccess(biz);
    } catch {
      setError('Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C1017] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none selection:bg-slate-700 selection:text-white font-medium text-slate-300">
      
      {/* AMBIENT CURSOR-TRACKING LIGHT */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 ease-out"
        style={{
          background: `radial-gradient(480px circle at ${mousePos.x}px ${mousePos.y}px, rgba(148, 163, 184, ${spotlightOpacity}), transparent 75%)`
        }}
      />

      {/* BACKGROUND SUBTLE AMBIENT TEXTURE */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />

      {/* CENTRAL STEALTH VAULT CONTAINER */}
      <div
        ref={formRef}
        className="relative z-10 w-full max-w-[420px] text-center py-12 sm:py-16 px-6 sm:px-8"
      >
        {/* EXPANDED INVISIBLE STEALTH ABSORPTION HALO */}
        <div className="absolute inset-0 -z-10 rounded-full shadow-[0_0_200px_140px_#0C1017] bg-[#0C1017]/95" />

        {/* =========================================================================
            1. AŞAMA (ÜST KISIM): YUKARIDAN İPEKSİ SÜZÜLEREK VE ODAKLANARAK GELİR
           ========================================================================= */}
        <div className="mb-12 sm:mb-14">
          
          {/* RESTIVADISYON BAŞLIĞI (Yukarıdan derinlikli yumuşak blur ile iner) */}
          <div
            className={`transition-all duration-1000 transform ${
              isMounted
                ? 'opacity-100 translate-y-0 tracking-[0.3em] blur-0'
                : 'opacity-0 -translate-y-8 tracking-[0.4em] blur-[8px]'
            }`}
            style={{
              transitionDelay: '100ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <h1 className="text-2xl sm:text-3xl font-light text-slate-100 uppercase select-none">
              RestivAdisyon
            </h1>
          </div>

          {/* VİNYET ÇİZGİSİ */}
          <div className="flex justify-center my-4 overflow-hidden">
            <div
              className={`h-[1px] bg-gradient-to-r from-transparent via-slate-500/50 to-transparent transition-all duration-800 ${
                isMounted ? 'w-40 scale-x-100 opacity-100' : 'w-0 scale-x-0 opacity-0'
              }`}
              style={{
                transitionDelay: '400ms',
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          </div>

          {/* İŞLETME GİRİŞİ ALT BAŞLIĞI */}
          <p
            className={`text-xs sm:text-sm text-slate-400 tracking-widest font-normal transition-all duration-800 transform ${
              isMounted ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 -translate-y-3 blur-[6px]'
            }`}
            style={{
              transitionDelay: '650ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            İşletme Girişi
          </p>
        </div>

        {/* ERROR MESSAGE (Smooth Pop-in) */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2.5 text-rose-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6 text-left">
          
          {/* =========================================================================
              3. AŞAMA (ORTA KISIM): KULLANICININ GÖZÜNDEN İPEKSİ, YUMUŞATILMIŞ DERİNLİK İLE GELİR
             ========================================================================= */}

          {/* KULLANICI ADI (Yumuşak lens odağı ve mikro-derinlik ile süzülür) */}
          <div
            className={`transition-all duration-1000 transform ${
              isMounted
                ? 'opacity-100 scale-100 translate-y-0 blur-0'
                : 'opacity-0 scale-[1.06] -translate-y-2 blur-[8px]'
            }`}
            style={{
              transitionDelay: '1350ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2 ml-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Kullanıcı Adı</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adınızı girin"
              className="w-full bg-[#111622] rounded-2xl px-5 py-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none border-0 border-transparent focus:ring-0 transition-colors duration-200 font-medium shadow-sm"
            />
          </div>

          {/* ŞİFRE (Yumuşak lens odağı ve mikro-derinlik ile süzülür) */}
          <div
            className={`transition-all duration-1000 transform ${
              isMounted
                ? 'opacity-100 scale-100 translate-y-0 blur-0'
                : 'opacity-0 scale-[1.06] -translate-y-2 blur-[8px]'
            }`}
            style={{
              transitionDelay: '1550ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2 ml-1">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Şifre</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#111622] rounded-2xl pl-5 pr-12 py-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none border-0 border-transparent focus:ring-0 transition-colors duration-200 font-medium shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-200 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* BENİ HATIRLA (Yumuşak lens odağı ve mikro-derinlik ile süzülür) */}
          <div
            className={`flex items-center justify-between pt-1 pb-1 transition-all duration-900 transform ${
              isMounted
                ? 'opacity-100 scale-100 blur-0'
                : 'opacity-0 scale-[1.04] blur-[6px]'
            }`}
            style={{
              transitionDelay: '1750ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4.5 h-4.5 rounded-md flex items-center justify-center transition-all duration-200 border ${
                  rememberMe
                    ? 'bg-[#1C2536] border-slate-400 text-slate-200 shadow-sm'
                    : 'bg-[#111622] border-[#222C3E] group-hover:border-slate-500 text-transparent'
                }`}
              >
                <Check className={`w-3.5 h-3.5 stroke-[2.5] transition-transform duration-150 ${rememberMe ? 'scale-100' : 'scale-0'}`} />
              </div>
              <span
                onClick={() => setRememberMe(!rememberMe)}
                className={`text-xs font-medium transition-colors duration-200 ${
                  rememberMe ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-300'
                }`}
              >
                Beni Hatırla
              </span>
            </label>
          </div>

          {/* =========================================================================
              2. AŞAMA (ALT KISIM): ALTTAN YUKARIYA DOĞRU İPEKSİ SÜZÜLEREK GELİR
             ========================================================================= */}
          <div
            className={`pt-5 sm:pt-6 transition-all duration-1000 transform ${
              isMounted
                ? 'opacity-100 translate-y-0 scale-100 blur-0'
                : 'opacity-0 translate-y-8 scale-[0.97] blur-[8px]'
            }`}
            style={{
              transitionDelay: '950ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <button
              type="submit"
              disabled={loading || !isFormFilled}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2.5 text-xs sm:text-sm transition-all duration-300 ${
                isFormFilled
                  ? 'bg-[#1C2638] text-slate-100 border border-[#2F3E58] hover:bg-[#25334D] hover:text-white hover:border-[#3E5274] hover:shadow-lg hover:shadow-black/40 active:bg-[#2E3F5F] active:scale-[0.98] cursor-pointer'
                  : 'bg-[#121824] text-slate-500 border border-[#1B2332] cursor-not-allowed opacity-60'
              }`}
            >
              <span>{loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}</span>
              <ArrowRight
                className={`w-4 h-4 transition-transform duration-300 ${
                  isFormFilled ? 'translate-x-0 group-hover:translate-x-1' : 'opacity-40'
                }`}
              />
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
