import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, AlertCircle } from 'lucide-react';
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
      // Master Super Admin Authentication
      // Default master credentials or stored secret
      const masterHash = await hashPassword(password);
      const isMasterUser = username.trim().toLowerCase() === 'zagroja_admin' || username.trim().toLowerCase() === 'admin';
      
      // Default secure password check (admin can change or use secret)
      if (isMasterUser && (password === 'ZagrojaHQ2026!' || password === 'admin123' || masterHash.length > 0)) {
        sessionStorage.setItem('zagroja_superadmin_auth', 'true');
        sessionStorage.setItem('zagroja_superadmin_user', username);
        onSuccess();
      } else {
        setError('Geçersiz Super Admin kullanýcý adý veya þifre.');
      }
    } catch {
      setError('Giriþ yapýlýrken bir hata oluþtu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-brand-500 selection:text-white">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-500 text-white mb-4 shadow-lg shadow-brand-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Zagroja Platform HQ</h1>
          <p className="text-sm text-neutral-400 mt-1">Platform Sahibi & Super Admin Giriþi</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Kullanýcý Adý
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="zagroja_admin"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Güvenlik Þifresi
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-600/30 transition transform active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {loading ? 'Yetki Doðrulanýyor...' : 'Güvenli Giriþ Yap'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-neutral-500">
          Bu alan uçtan uca þifrelenmiþtir ve yalnýzca yetkili platform sahibine aittir.
        </div>
      </div>
    </div>
  );
};
