import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, UtensilsCrossed } from 'lucide-react';
import { supabase, hashPassword } from '../../lib/supabase';
import { Business } from '../../types';

interface BusinessLoginProps {
  onSuccess: (business: Business) => void;
}

export const BusinessLogin: React.FC<BusinessLoginProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 selection:bg-orange-500/30 selection:text-orange-200">
      <div className="w-full max-w-sm bg-[#1E293B] border border-slate-800 rounded-3xl p-7 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Decorative Orange Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />

        <div className="text-center mb-6 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-black text-slate-100 tracking-tight">RestivAdisyon İşletme Girişi</h1>
          <p className="text-xs text-slate-400 mt-1">Yönetim ve POS paneline erişmek için giriş yapınız</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
              Kullanıcı Adı
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınız"
                className="w-full bg-[#0B0F17] border border-slate-700/80 focus:border-orange-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
              Şifre
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0B0F17] border border-slate-700/80 focus:border-orange-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-orange-500/25 disabled:opacity-50"
          >
            <span>{loading ? 'Giriş Yapılıyor...' : 'Yönetim Paneline Giriş Yap'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
