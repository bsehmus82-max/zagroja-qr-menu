import React, { useState } from 'react';
import { Business } from '../../types';
import { supabase, hashPassword, generateTempPassword, slugify } from '../../lib/supabase';

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (info: {
    business: Business;
    tempPass: string;
    days: number;
  }) => void;
}

export const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [tableLimit, setTableLimit] = useState('20');
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const cleanName = name.trim();
      const slug = slugify(cleanName) + '-' + Math.floor(1000 + Math.random() * 9000);
      const username = slugify(cleanName).replace(/-/g, '_') + '_' + Math.floor(100 + Math.random() * 900);
      const tempPass = generateTempPassword(8);
      const passHash = await hashPassword(tempPass);
      const numTables = parseInt(tableLimit) || 20;
      const numDays = parseInt(days) || 30;

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + numDays);

      const payload = {
        name: cleanName,
        slug,
        username,
        password_hash: passHash,
        table_limit: numTables,
        subscription_days: numDays,
        subscription_expires_at: expiryDate.toISOString(),
        subscription_status: 'active',
        is_onboarded: false,
      };

      const { data, error } = await supabase
        .from('businesses')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        onCreated({
          business: data as Business,
          tempPass,
          days: numDays,
        });
        setName('');
        onClose();
      } else {
        alert('Ýþletme kaydedilemedi. Supabase veritabaný þemasýnýn aktif olduðunu kontrol ediniz.');
      }
    } catch {
      alert('Ýþlem sýrasýnda bir hata oluþtu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
        <h2 className="text-lg font-black text-white tracking-tight mb-1">Yeni Ýþletme Hesabý Aç</h2>
        <p className="text-xs text-neutral-400 mb-6">
          Ýþletme adýný, masa kapasitesini ve gün sayýsýný giriniz. Kullanýcý adý ve geçici þifre otomatik üretilir.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Ýþletme Adý (Restoran / Kafe)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Zagroja Cafe & Bar"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Masa Sýnýrý (Adet)
              </label>
              <input
                type="number"
                min="1"
                required
                value={tableLimit}
                onChange={(e) => setTableLimit(e.target.value)}
                placeholder="20"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 transition"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">Manuel masa sýnýrý</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Abonelik Süresi (Gün)
              </label>
              <input
                type="number"
                min="1"
                required
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="30"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 transition"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">Örn: 30, 90, 365</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 transition"
            >
              Ýptal
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
            >
              {loading ? 'Açýlýyor...' : 'Ýþletmeyi Aç & Þifre Üret'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
