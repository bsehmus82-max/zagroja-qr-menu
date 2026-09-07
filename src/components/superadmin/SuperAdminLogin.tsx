import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { SUPERADMIN_CREDENTIALS } from '../../types';

interface SuperAdminLoginProps {
  onSuccess: () => void;
}

export const SuperAdminLogin: React.FC<SuperAdminLoginProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      const userMatch = SUPERADMIN_CREDENTIALS.usernames.includes(cleanUser);
      const passMatch =
        cleanPass === SUPERADMIN_CREDENTIALS.admin1Password ||
        cleanPass === SUPERADMIN_CREDENTIALS.admin2Password;

      if (userMatch && passMatch) {
        sessionStorage.setItem('restiva_sa_auth', 'true');
        sessionStorage.setItem('restiva_sa_user', cleanUser);
        localStorage.setItem('restiva_sa_auth', 'true');
        localStorage.setItem('restiva_sa_user', cleanUser);
        onSuccess();
      } else {
        setError('Geçersiz Süper Admin kullanıcı adı veya şifre.');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0C1017] flex items-center justify-center p-4 selection:bg-white/20 selection:text-white font-medium text-slate-200">
      <div className="w-full max-w-sm bg-[#111622] border border-[#1F293D] rounded-3xl p-7 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Minimal White Highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />

        <div className="text-center mb-6 pt-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1C2433] text-white border border-[#2B384E] mb-3 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-black text-white tracking-tight">Merkez Yönetim Girişi</h1>
          <p className="text-xs text-slate-400 mt-1">Platform Süper Admin Kontrol Paneli</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
              Yönetici Kullanıcı Adı
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin, superadmin, bsehmus..."
                className="w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
              Güvenlik Şifresi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-white hover:bg-slate-200 active:scale-98 text-slate-900 font-extrabold py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-sm disabled:opacity-50"
          >
            <span>{loading ? 'Doğrulanıyor...' : 'Yönetim Merkezine Giriş Yap'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
