import React, { useState } from 'react';
import { Lock, User, ArrowRight, KeyRound } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin1234');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const validUsers = ['admin', 'yonetici', 'bistro'];
      const validPass = ['admin1234', 'admin', '123456'];

      if (
        validUsers.includes(username.trim().toLowerCase()) &&
        validPass.includes(password.trim())
      ) {
        localStorage.setItem('app_admin_session', 'active_' + Date.now());
        setIsLoading(false);
        onSuccess();
      } else {
        setIsLoading(false);
        setError('Hatalı kullanıcı adı veya şifre girdiniz.');
      }
    }, 400);
  };

  const handleAutoFill = () => {
    setUsername('admin');
    setPassword('admin1234');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/30 text-white font-bold">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">Yönetici Girişi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Restoran Sipariş & Menü Yönetim Paneli
          </p>
        </div>

        {/* Credentials Helper Pill */}
        <div
          onClick={handleAutoFill}
          className="mb-5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-3 text-left cursor-pointer transition-all flex items-center justify-between"
          title="Tıklayarak otomatik doldur"
        >
          <div className="flex items-center gap-2 text-xs">
            <KeyRound className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <div>
              <div className="text-slate-300 font-semibold">
                Kullanıcı: <span className="text-white font-mono font-bold">admin</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Şifre: <span className="text-orange-400 font-mono font-bold">admin1234</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-2 py-1 rounded-lg">
            Doldur
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kullanıcı Adı
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-slate-800 text-white text-xs pl-10 pr-3.5 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Şifre
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 text-white text-xs pl-10 pr-3.5 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/25 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50 mt-2"
          >
            <span>{isLoading ? 'Giriş Yapılıyor...' : 'Panele Giriş Yap'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Back to Menu link */}
        <div className="mt-5 text-center pt-4 border-t border-slate-800">
          <button
            onClick={onCancel}
            className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Menüye Geri Dön
          </button>
        </div>
      </div>
    </div>
  );
};
