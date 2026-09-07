import React, { useState } from 'react';
import { 
  Radio, X, Send, AlertCircle, CheckCircle2, 
  Gift, Wrench, Sparkles, Clock, Calendar, Heart, Flag, Eye
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

  const handleApplyTemplate = (type: 'holiday_religious' | 'holiday_national' | 'maintenance' | 'feature' | 'compensation', days: number = compensationDays) => {
    setCompensationDays(days);
    if (type === 'holiday_religious') {
      setMessage(
        `Değerli İşletmecimiz,\n\nBayramınızı en içten dileklerimizle kutlar; aileniz ve sevdiklerinizle birlikte sağlıklı, huzurlu ve bol kazançlı bir bayram geçirmenizi dileriz.\n\nRestivAdisyon ailesi olarak bayram hediyesi olarak işletme hesabınıza +${days} GÜN ÜCRETSİZ KULLANIM HAKKI tanımlanmıştır.\n\nİyi bayramlar ve bereketli işler dileriz!`
      );
      setAddFreeDays(true);
    } else if (type === 'holiday_national') {
      setMessage(
        `Değerli İşletmecimiz,\n\nResmi tatilinizi kutlar, işletmenize bol kazançlı ve bereketli günler dileriz. İş ortaklığımızın bir teşekkürü olarak hesabınıza +${days} GÜN ÜCRETSİZ HAK hediye edilmiştir.\n\nBirlikte nice güzel günlere!`
      );
      setAddFreeDays(true);
    } else if (type === 'maintenance') {
      setMessage(
        `Değerli İşletmecimiz,\n\nSistemlerimizde altyapı güçlendirme ve sunucu optimizasyon çalışmaları gerçekleştirilmektedir. Bu süreçte yaşanabilecek kısa süreli kesintilerden dolayı işletmenize +${days} GÜN ÜCRETSİZ TELAFİ SÜRESİ tanımlanmıştır.\n\nAnlayışınız ve iş ortaklığınız için teşekkür ederiz.`
      );
      setAddFreeDays(true);
    } else if (type === 'feature') {
      setMessage(
        `Değerli İşletmecimiz,\n\nRestivAdisyon sistemimize işletmenizin hızını ve verimliliğini artıracak yeni özellikler ve performans iyileştirmeleri eklenmiştir. Sayfanızı yenileyerek veya programı açarak en güncel sürümü kullanmaya devam edebilirsiniz.\n\nBol kazançlı günler dileriz!`
      );
      setAddFreeDays(false);
    } else if (type === 'compensation') {
      setMessage(
        `Değerli İşletmecimiz,\n\nYaşanan teknik aksaklıktan dolayı özür diler, mağduriyetinizi telafi etmek adına hesabınıza +${days} GÜN ÜCRETSİZ HAK tanımlandığını bildirmek isteriz. Gösterdiğiniz sabır ve anlayış için teşekkür ederiz.`
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
      <div className="bg-[#111622] border border-[#1F293D] rounded-3xl w-full max-w-xl p-6 shadow-2xl relative max-h-[92vh] flex flex-col font-medium text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1F293D] mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C2433] text-white flex items-center justify-center border border-[#2B384E] shadow-sm">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Toplu Duyuru, Bayram & Telafi Sistemi</h2>
              <p className="text-[11px] text-slate-400">Tüm aktif işletmelere bayram tebriği, bakım bildirimi ve ücretsiz gün tanımlayın</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1C2433] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-8 text-center space-y-2.5">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-sm font-bold text-white">Duyuru ve Süre Tanımlandı</h3>
            <p className="text-xs text-slate-400">
              Tüm aktif işletmelere mesaj iletildi {addFreeDays ? `ve +${compensationDays} gün ücretsiz hak eklendi.` : '.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendBroadcast} className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Quick Templates Buttons */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-300" />
                Hazır Şablonlar (Tek Tıkla Yükle & Düzenle)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('holiday_religious', 4)}
                  className="p-2.5 rounded-xl bg-[#0C1017] border border-[#1F293D] hover:border-slate-500 text-[10px] font-bold text-slate-200 text-left transition flex items-center gap-1.5 active:scale-95"
                >
                  <Heart className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span>Dini Bayram (+4 Gün)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('holiday_national', 2)}
                  className="p-2.5 rounded-xl bg-[#0C1017] border border-[#1F293D] hover:border-slate-500 text-[10px] font-bold text-slate-200 text-left transition flex items-center gap-1.5 active:scale-95"
                >
                  <Flag className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span>Resmi Tatil (+2 Gün)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('maintenance', 3)}
                  className="p-2.5 rounded-xl bg-[#0C1017] border border-[#1F293D] hover:border-slate-500 text-[10px] font-bold text-slate-200 text-left transition flex items-center gap-1.5 active:scale-95"
                >
                  <Wrench className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span>Bakım Telafisi (+3 Gün)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('compensation', 3)}
                  className="p-2.5 rounded-xl bg-[#0C1017] border border-[#1F293D] hover:border-slate-500 text-[10px] font-bold text-slate-200 text-left transition flex items-center gap-1.5 active:scale-95"
                >
                  <Gift className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span>Özel Hediye (+3 Gün)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('feature', 0)}
                  className="p-2.5 rounded-xl bg-[#0C1017] border border-[#1F293D] hover:border-slate-500 text-[10px] font-bold text-slate-200 text-left transition flex items-center gap-1.5 sm:col-span-2 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span>Yeni Özellik Duyurusu (Süresiz)</span>
                </button>
              </div>
            </div>

            {/* Message Textarea (Directly Editable) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-300">
                  Duyuru Metni (Serbestçe Düzenleyebilirsiniz)
                </label>
                <span className="text-[10px] text-slate-500">
                  {message.length} karakter
                </span>
              </div>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="İşletmelere iletmek istediğiniz duyuruyu veya bayram tebriğini yazınız..."
                className="w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition resize-none leading-relaxed"
              />
            </div>

            {/* Live Preview Box */}
            {message.trim() && (
              <div className="bg-[#0C1017] border border-[#1F293D] rounded-2xl p-3.5 space-y-2 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-3 h-3" />
                    İşletme Ekranında Canlı Görünüm
                  </span>
                  {addFreeDays && compensationDays > 0 && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/20">
                      +{compensationDays} Gün Hediye Dahil
                    </span>
                  )}
                </div>

                <div className="bg-[#111622] border border-[#1F293D] rounded-xl p-3 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  <div className="text-[11px] font-extrabold text-white pb-1 border-b border-[#1F293D] mb-2 flex items-center gap-1.5">
                    <Radio className="w-3 h-3" />
                    <span>[SİSTEM DUYURUSU]</span>
                  </div>
                  {message}
                </div>
              </div>
            )}

            {/* Compensation & Free Days Checkbox & Custom Days */}
            <div className="bg-[#0C1017] border border-[#1F293D] p-3.5 rounded-2xl space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addFreeDays}
                  onChange={(e) => setAddFreeDays(e.target.checked)}
                  className="w-4 h-4 rounded border-[#1F293D] text-white focus:ring-0 bg-[#111622]"
                />
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-slate-300" />
                  Tüm aktif işletmelere bayram / tatil / telafi süresi ekle
                </span>
              </label>

              {addFreeDays && (
                <div className="space-y-2 pt-1 pl-6">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 mr-1">Hızlı Seç:</span>
                    {[1, 2, 3, 4, 5, 7, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCompensationDays(num)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          compensationDays === num
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'bg-[#1C2433] text-slate-300 border border-[#2B384E] hover:text-white'
                        }`}
                      >
                        +{num} Gün
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-400">Veya İstediğiniz Gün Sayısı:</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={compensationDays}
                      onChange={(e) => setCompensationDays(Number(e.target.value))}
                      className="w-20 bg-[#111622] border border-[#1F293D] focus:border-slate-500 rounded-lg px-2 py-1 text-xs text-white font-bold focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">Gün</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="pt-2 border-t border-[#1F293D] flex items-center justify-between gap-2.5 shrink-0">
              <span className="text-[10px] text-slate-400 font-mono">
                {businesses.filter((b) => b.subscription_status === 'active').length} aktif işletmeye tanımlanacak
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-xs font-medium text-slate-300 transition border border-[#2B384E]"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-900 text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'İşleniyor...' : 'Duyuruyu ve Günleri Gönder'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
