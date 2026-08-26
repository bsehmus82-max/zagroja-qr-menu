import React, { useState } from 'react';
import { Lock, User, ArrowRight, Store } from 'lucide-react';
import { store } from '../../lib/store';

interface BusinessLoginProps {
  onSuccess: () => void;
}

export const BusinessLogin: React.FC<BusinessLoginProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await store.authenticateOwner(username, password);
      if (res.success && res.restaurant) {
        const rest = res.restaurant;
        localStorage.setItem('zagroja_business_session', JSON.stringify({
          restaurantId: rest.id,
          username: rest.owner_username,
          slug: rest.slug,
          loginTime: new Date().toISOString()
        }));

        store.setCurrentRestaurant(rest.id);
        await store.syncFromCloud();
        setIsLoading(false);
        onSuccess();
      } else {
        setIsLoading(false);
        setError(res.error || 'Hatalı kullanıcı adı veya şifre girdiniz.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError('Bağlantı hatası: ' + (err?.message || 'Giriş yapılamadı.'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white relative overflow-hidden">
      {/* Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-slide-up">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/30 text-white font-bold">
            <Store className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">İşletme Yönetim Girişi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Zagroja Menü, Sipariş & Masa Yönetim Platformu
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-xs font-medium animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Kullanıcı Adı</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-500"
                placeholder="İşletme kullanıcı adınız"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Şifre</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 disabled:opacity-50"
          >
            <span>{isLoading ? 'Giriş Yapılıyor...' : 'Yönetim Paneline Giriş Yap'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
