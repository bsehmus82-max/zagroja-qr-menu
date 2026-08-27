import React, { useState } from 'react';
import { 
  Radio, X, Send, AlertCircle, CheckCircle2, 
  Gift, Wrench, Sparkles, Clock, Calendar 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Business } from '../../types';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
  onBusinessesUpdated?: (updatedList: Business[]) => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  businesses,
  onBusinessesUpdated,
}) => {
  const [message, setMessage] = useState('');
  const [addFreeDays, setAddFreeDays] = useState(false);
  const [compensationDays, setCompensationDays] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleApplyTemplate = (type: 'maintenance' | 'feature' | 'compensation') => {
    if (type === 'maintenance') {
      setMessage(
        `Değerli İşletmecimiz,\n\nSistemlerimizde altyapı güçlendirme ve sunucu optimizasyon çalışmaları gerçekleştirilmektedir. Bu süreçte yaşanabilecek kısa süreli kesintilerden dolayı işletmenize +${compensationDays} GÜN ÜCRETSİZ TELAFİ SÜRESİ tanımlanmıştır.\n\nAnlayışınız ve iş ortaklığınız için teşekkür ederiz.`
      );
      setAddFreeDays(true);
    } else if (type === 'feature') {
      setMessage(
        `Değerli İşletmecimiz,\n\nRestivAdisyon sistemimize işletmenizin hızını ve verimliliğini artıracak yeni özellikler ve performans iyileştirmeleri eklenmiştir. Sayfanızı yenileyerek veya programı açarak en güncel sürümü kullanmaya devam edebilirsiniz.\n\nBol kazançlı günler dileriz!`
      );
      setAddFreeDays(false);
    } else if (type === 'compensation') {
      setMessage(
        `Değerli İşletmecimiz,\n\nYaşanan teknik aksaklıktan dolayı özür diler, mağduriyetinizi telafi etmek adına hesabınıza +${compensationDays} GÜN ÜCRETSİZ HAK tanımlandığını bildirmek isteriz. Gösterdiğiniz sabır ve anlayış için teşekkür ederiz.`
      );
      setAddFreeDays(true);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError('');

    try {
      const activeBiz = businesses.filter((b) => b.subscription_status === 'active');
      if (activeBiz.length === 0) {
        throw new Error('Aktif durumda işletme bulunmuyor.');
      }

      // 1. If compensation days is checked, batch-update subscription expiration dates
      let updatedBizList = [...businesses];
      if (addFreeDays && compensationDays > 0) {
        for (const biz of activeBiz) {
          const currentExpiry = new Date(biz.subscription_expires_at);
          const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
          baseDate.setDate(baseDate.getDate() + Number(compensationDays));

          await supabase
            .from('businesses')
            .update({
              subscription_expires_at: baseDate.toISOString(),
              subscription_days: (biz.subscription_days || 0) + Number(compensationDays),
              updated_at: new Date().toISOString(),
            })
            .eq('id', biz.id);

          updatedBizList = updatedBizList.map((b) =>
            b.id === biz.id
              ? {
                  ...b,
                  subscription_expires_at: baseDate.toISOString(),
                  subscription_days: (b.subscription_days || 0) + Number(compensationDays),
                }
              : b
          );
        }

        onBusinessesUpdated?.(updatedBizList);
      }

      // 2. Insert broadcast message to all active businesses
      const rows = activeBiz.map((biz) => ({
        business_id: biz.id,
        sender: 'superadmin',
        message: `[SİSTEM DUYURUSU]\n${message.trim()}`,
        status: 'open',
        is_read: false,
      }));

      const { error: insertError } = await supabase.from('support_messages').insert(rows);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
        setAddFreeDays(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Duyuru iletilirken hata oluştu.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12161F] border border-[#212634] rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#212634] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Toplu Sistem & Bakım Duyurusu</h2>
              <p className="text-[11px] text-slate-400">Tüm aktif işletmelere anında duyuru ve telafi süresi gönderin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#1A202C] transition"
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

        {success ? (
          <div className="py-8 text-center space-y-2.5">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-sm font-bold text-slate-100">Duyuru ve Süre Tanımlandı</h3>
            <p className="text-xs text-slate-400">
              Tüm aktif işletmelere mesaj iletildi {addFreeDays ? `ve +${compensationDays} gün telafi süresi eklendi.` : '.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendBroadcast} className="space-y-4">
            {/* Quick Templates */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Hazır Duyuru Şablonları
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('maintenance')}
                  className="p-2 rounded-xl bg-[#0A0D14] border border-[#212634] hover:border-purple-500/50 text-[10px] font-bold text-purple-300 text-left transition flex items-center gap-1"
                >
                  <Wrench className="w-3 h-3 text-purple-400 shrink-0" />
                  <span>Bakım & Telafi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('compensation')}
                  className="p-2 rounded-xl bg-[#0A0D14] border border-[#212634] hover:border-emerald-500/50 text-[10px] font-bold text-emerald-300 text-left transition flex items-center gap-1"
                >
                  <Gift className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>+3 Gün Hediye</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('feature')}
                  className="p-2 rounded-xl bg-[#0A0D14] border border-[#212634] hover:border-indigo-500/50 text-[10px] font-bold text-indigo-300 text-left transition flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span>Yeni Güncelleme</span>
                </button>
              </div>
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                Duyuru Metni
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="İşletmelere iletmek istediğiniz duyuruyu yazınız..."
                className="w-full bg-[#0A0D14] border border-[#212634] focus:border-purple-500/60 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition resize-none leading-relaxed"
              />
            </div>

            {/* Compensation & Free Days Checkbox */}
            <div className="bg-[#0A0D14] border border-[#212634] p-3 rounded-2xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addFreeDays}
                  onChange={(e) => setAddFreeDays(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-0 bg-[#12161F]"
                />
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-purple-400" />
                  Tüm aktif işletmelere telafi / hediye süresi ekle
                </span>
              </label>

              {addFreeDays && (
                <div className="flex items-center gap-3 pt-1 pl-6">
                  <span className="text-[11px] text-slate-400">Eklenecek Gün:</span>
                  {[1, 3, 5, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCompensationDays(num)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        compensationDays === num
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-[#12161F] text-slate-400 border border-[#212634] hover:text-slate-200'
                      }`}
                    >
                      +{num} Gün
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#212634] flex items-center justify-between gap-2.5">
              <span className="text-[10px] text-slate-500 font-mono">
                {businesses.filter((b) => b.subscription_status === 'active').length} aktif işletmeye iletilecek
              </span>

              <div className="flex items-center gap-2">
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
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Gönderiliyor...' : 'Duyuruyu ve Telafiyi Gönder'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
