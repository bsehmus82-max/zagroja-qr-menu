import React, { useState } from 'react';
import { X, Building2, Layers, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { supabase, slugify, generateTempPassword, hashPassword } from '../../lib/supabase';
import { Business } from '../../types';

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (info: { business: Business; tempPass: string; days: number }) => void;
}

export const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [tableLimit, setTableLimit] = useState<number | ''>(20);
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Lütfen geçerli bir işletme adı giriniz.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const trimmedName = name.trim();
      const baseSlug = slugify(trimmedName);
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      const slug = `${baseSlug}-${uniqueSuffix}`;
      const username = `${baseSlug.replace(/-/g, '_')}_${uniqueSuffix}`;
      const tempPass = generateTempPassword(8);
      const passHash = await hashPassword(tempPass);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(days));

      const payload = {
        name: trimmedName,
        slug: slug,
        username: username,
        password_hash: passHash,
        table_limit: tableLimit ? Number(tableLimit) : null,
        subscription_status: 'active',
        subscription_days: Number(days),
        subscription_expires_at: expiresAt.toISOString(),
        template_id: 'clean',
        phone: '',
        address: '',
        working_hours: '',
        wifi_ssid: '',
        wifi_password: '',
      };

      const { data, error: insertError } = await supabase
        .from('businesses')
        .insert([payload])
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      onCreated({
        business: data as Business,
        tempPass: tempPass,
        days: Number(days),
      });

      setName('');
      setTableLimit(20);
      setDays(30);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'İşletme hesabı oluşturulurken bir hata oluştu.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Yeni İşletme Hesabı Aç</h2>
              <p className="text-xs text-neutral-400">Tek tıkla otomatik kimlik ve şifre üretimi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              İşletme Adı <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Zümrüt Bistro & Cafe"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 transition"
            />
            <p className="text-[10px] text-neutral-500 mt-1">
              Kullanıcı adı ve benzersiz menü bağlantısı bu ada göre otomatik oluşturulur.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-brand-400" />
                Masa Sınırı
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={tableLimit}
                onChange={(e) => setTableLimit(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Örn: 25"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-400" />
                Abonelik (Gün)
              </label>
              <input
                type="number"
                min={1}
                max={3650}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                placeholder="30"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500 transition"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Oluşturuluyor...' : 'Hesabı Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
