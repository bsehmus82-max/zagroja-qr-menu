import React, { useState } from 'react';
import { X, Building2, Layers, Calendar, Plus, AlertCircle } from 'lucide-react';
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
      setError('Lütfen bir işletme adı giriniz.');
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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12161F] border border-[#212634] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#212634] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Yeni İşletme Kaydı</h2>
              <p className="text-[11px] text-slate-400">Giriş bilgileri ve bağlantı otomatik üretilir</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1A202C] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
              İşletme Adı
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="İşletme adını giriniz"
              className="w-full bg-[#0A0D14] border border-[#212634] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Masa Sınırı
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={tableLimit}
                onChange={(e) => setTableLimit(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="20"
                className="w-full bg-[#0A0D14] border border-[#212634] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Süre (Gün)
              </label>
              <input
                type="number"
                min={1}
                max={3650}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                placeholder="30"
                className="w-full bg-[#0A0D14] border border-[#212634] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#212634] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1A202C] hover:bg-[#252D3D] text-xs font-medium text-slate-300 transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              {loading ? 'Kaydediliyor...' : 'İşletmeyi Aç'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
