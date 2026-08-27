import React, { useState } from 'react';
import { Shield, Lock, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { hashPassword } from '../../lib/supabase';

interface SuperAdminLoginProps {
  onSuccess: () => void;
}

export const SuperAdminLogin: React.FC<SuperAdminLoginProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      const isMasterUser = cleanUser === 'zagroja_owner' || cleanUser === 'zagroja_admin' || cleanUser === 'bsehmus' || cleanUser === 'admin';
      const isSecurePass = cleanPass === 'Zagroja#Master$2026!HQ' || cleanPass === 'ZagrojaHQ2026!';

      if (isMasterUser && isSecurePass) {
        sessionStorage.setItem('zagroja_superadmin_auth', 'true');
        sessionStorage.setItem('zagroja_superadmin_user', cleanUser);
        onSuccess();
      } else {
        setError('Yetkili kullanıcı adı veya şifre geçersiz.');
      }
    } catch {
      setError('Giriş doğrulanırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090C10] flex items-center justify-center p-4 selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="w-full max-w-md bg-[#12161F] border border-[#212634] rounded-2xl p-8 shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">Yönetim Merkezi</h1>
          <p className="text-xs text-slate-400 mt-1">Platform Sahibi Girişi</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium tracking-wide text-slate-300 mb-1.5">
              Kullanıcı Adı
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınız"
                className="w-full bg-[#0A0D14] border border-[#212634] focus:border-indigo-500/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-wide text-slate-300 mb-1.5">
              Güvenlik Şifresi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0A0D14] border border-[#212634] focus:border-indigo-500/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            <span>{loading ? 'Doğrulanıyor...' : 'Giriş Yap'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
