import React, { useState, useEffect } from 'react';
import { store } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { Lock, KeyRound, CheckCircle2, XCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { Restaurant } from '../../types';

interface PasswordResetScreenProps {
  token: string;
  onComplete?: () => void;
}

export const PasswordResetScreen: React.FC<PasswordResetScreenProps> = ({ token, onComplete }) => {
  const [expires, setExpires] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    try {
      const decoded = atob(token);
      const [tokenSlug, tokenExpiresStr] = decoded.split(':');
      const tokenExpires = parseInt(tokenExpiresStr, 10);

      setExpires(tokenExpires);

      if (Date.now() > tokenExpires) {
        setIsExpired(true);
        setLoading(false);
        return;
      }

      const fetchRest = async () => {
        let r = store.getRestaurantBySlug(tokenSlug);
        if (!r) {
          const { data } = await supabase.from('restaurants').select('*').eq('slug', tokenSlug).maybeSingle();
          if (data) r = data as Restaurant;
        }
        setRestaurant(r || null);
        setLoading(false);
      };

      fetchRest();
    } catch {
      setIsExpired(true);
      setLoading(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 4) {
      setError('Şifre en az 4 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Girdiğiniz şifreler birbiriyle uyuşmuyor.');
      return;
    }

    if (!restaurant) {
      setError('İşletme hesabı bulunamadı.');
      return;
    }

    if (expires && Date.now() > expires) {
      setIsExpired(true);
      setError('Bu linkin 15 dakikalık süresi dolmuştur.');
      return;
    }

    setSubmitting(true);
    try {
      await store.updateRestaurant(restaurant.id, { owner_password: newPassword.trim() });
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (e: any) {
      setError('Şifre güncellenirken hata oluştu: ' + (e?.message || 'Lütfen tekrar deneyin.'));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-white text-sm font-medium animate-pulse">Güvenlik anahtarı doğrulanıyor...</div>
      </div>
    );
  }

  if (isExpired || !restaurant) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Geçersiz veya Süresi Dolmuş Link</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Bu şifre sıfırlama linkinin <strong>15 dakikalık güvenlik süresi</strong> dolmuştur veya link hatalıdır. Lütfen sistem yöneticinizden yeni bir şifre sıfırlama linki talep edin.
          </p>
          <a
            href="/"
            className="inline-block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center animate-slide-up">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Şifreniz Başarıyla Güncellendi!</h2>
          <p className="text-xs text-slate-400 mb-6">
            "{restaurant.name}" işletme hesabınız için yeni şifreniz kaydedildi. Giriş ekranına yönlendiriliyorsunuz...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-slide-up">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/30 text-white font-bold">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Yeni Şifre Belirleyin</h2>
          <p className="text-xs text-slate-400 mt-1">
            İşletme: <strong className="text-orange-400">{restaurant.name}</strong> ({restaurant.owner_username})
          </p>
          <span className="inline-block text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full mt-2 border border-amber-400/20">
            ⏱️ Link 15 Dakika Sürelidir
          </span>
        </div>

        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-xs font-medium flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Yeni Şifre</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm"
                placeholder="En az 4 karakter"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Yeni Şifre (Tekrar)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm"
                placeholder="Şifreyi tekrar girin"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-sm mt-2 active:scale-95"
          >
            {submitting ? 'Kaydediliyor...' : <>Şifreyi Güncelle <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
};
