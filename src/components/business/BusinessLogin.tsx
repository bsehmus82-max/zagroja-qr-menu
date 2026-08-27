import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase, hashPassword } from '../../lib/supabase';
import { Business } from '../../types';

interface BusinessLoginProps {
  onSuccess: (business: Business) => void;
}

export const BusinessLogin: React.FC<BusinessLoginProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

      sessionStorage.setItem('zagroja_business_id', biz.id);
      sessionStorage.setItem('zagroja_business_data', JSON.stringify(biz));
      onSuccess(biz);
    } catch {
      setError('Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090C10] flex items-center justify-center p-4 selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="w-full max-w-sm bg-[#12161F] border border-[#212634] rounded-2xl p-7 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-slate-100 tracking-tight">İşletme Girişi</h1>
          <p className="text-xs text-slate-400 mt-1">Yönetim paneline erişmek için giriş yapınız</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
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
                className="w-full bg-[#0A0D14] border border-[#212634] focus:border-indigo-500/60 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
              Şifre
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0A0D14] border border-[#212634] focus:border-indigo-500/60 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            <span>{loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
