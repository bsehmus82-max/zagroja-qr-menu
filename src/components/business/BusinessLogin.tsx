import React, { useState } from 'react';
import { Store, Lock, KeyRound, AlertCircle, Key } from 'lucide-react';
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

  // Change Password Modal inside login if needed
  const [showChangePass, setShowChangePass] = useState(false);
  const [changeUser, setChangeUser] = useState('');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [changeMsg, setChangeMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();
      const passHash = await hashPassword(cleanPass);

      const { data, error: dbError } = await supabase
        .from('businesses')
        .select('*')
        .ilike('username', cleanUser)
        .single();

      if (dbError || !data) {
        setError('Kullanýcý adý veya þifre hatalý.');
        return;
      }

      const business = data as Business;

      if (business.subscription_status === 'suspended') {
        setError('Bu iþletme hesabý askýya alýnmýþtýr. Lütfen platform yöneticisi ile iletiþime geçiniz.');
        return;
      }

      const isExpired = new Date(business.subscription_expires_at).getTime() < Date.now();
      if (isExpired) {
        setError('Abonelik süreniz dolmuþtur. Paneli kullanmaya devam etmek için lütfen platform yöneticisi ile iletiþime geçiniz.');
        return;
      }

      if (business.password_hash !== passHash) {
        setError('Kullanýcý adý veya þifre hatalý.');
        return;
      }

      sessionStorage.setItem('zagroja_business_id', business.id);
      sessionStorage.setItem('zagroja_business_data', JSON.stringify(business));
      onSuccess(business);
    } catch {
      setError('Giriþ yapýlýrken bir baðlantý hatasý oluþtu.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeMsg('');
    try {
      const oldHash = await hashPassword(oldPass.trim());
      const newHash = await hashPassword(newPass.trim());

      const { data, error: dbError } = await supabase
        .from('businesses')
        .select('*')
        .ilike('username', changeUser.trim().toLowerCase())
        .single();

      if (dbError || !data || (data as Business).password_hash !== oldHash) {
        setChangeMsg('Mevcut þifreniz veya kullanýcý adýnýz hatalý.');
        return;
      }

      const { error: updateError } = await supabase
        .from('businesses')
        .update({ password_hash: newHash, updated_at: new Date().toISOString() })
        .eq('id', data.id);

      if (!updateError) {
        alert('Þifreniz baþarýyla deðiþtirildi! Yeni þifrenizle giriþ yapabilirsiniz.');
        setShowChangePass(false);
        setPassword('');
      }
    } catch {
      setChangeMsg('Þifre deðiþtirilemedi.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-brand-500 selection:text-white">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white mb-4 shadow-lg shadow-brand-500/20">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Ýþletme Giriþ Paneli</h1>
          <p className="text-xs text-neutral-400 mt-1">Zagroja QR Menü Yönetim Portalý</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Ýþletme Kullanýcý Adý
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="isletme_adi"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Þifre
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-600/30 transition transform active:scale-[0.98] disabled:opacity-50 mt-2 text-xs"
          >
            {loading ? 'Giriþ Yapýlýyor...' : 'Yönetim Paneline Giriþ Yap'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <span>Kayýt olma kapalýdýr.</span>
          <button
            onClick={() => setShowChangePass(true)}
            className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 transition"
          >
            <Key className="w-3.5 h-3.5" />
            Þifremi Deðiþtir
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePass && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-black text-white mb-2">Þifre Deðiþtir</h3>
            {changeMsg && <div className="text-xs text-red-400 mb-3">{changeMsg}</div>}
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Kullanýcý Adý</label>
                <input
                  type="text"
                  required
                  value={changeUser}
                  onChange={(e) => setChangeUser(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Mevcut Þifre</label>
                <input
                  type="password"
                  required
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Yeni Þifre</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowChangePass(false)}
                  className="px-4 py-2 bg-neutral-800 text-neutral-300 text-xs rounded-xl"
                >
                  Ýptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
