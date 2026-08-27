import React, { useState, useEffect } from 'react';
import { 
  Users, Smartphone, Plus, QrCode, Trash2, CheckCircle2, 
  XCircle, Clock, ShieldCheck, RefreshCw, Copy, Check, AlertTriangle 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { supabase, hashPassword } from '../../lib/supabase';
import { Business, Waiter, WaiterDevice } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

interface WaitersManagerProps {
  business: Business;
}

export const WaitersManager: React.FC<WaitersManagerProps> = ({ business }) => {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [devices, setDevices] = useState<WaiterDevice[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddWaiterOpen, setIsAddWaiterOpen] = useState(false);
  const [newWaiterName, setNewWaiterName] = useState('');
  const [newWaiterPin, setNewWaiterPin] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Pairing Modal
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [pairingExpiresAt, setPairingExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes
  const [isGeneratingPair, setIsGeneratingPair] = useState(false);
  const [copied, setCopied] = useState(false);

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'waiter' | 'device'; id: string; name: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [waitersRes, devicesRes] = await Promise.all([
        supabase
          .from('waiters')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('waiter_devices')
          .select('*, waiters(*)')
          .eq('business_id', business.id)
          .eq('is_trusted', true)
          .order('last_active_at', { ascending: false }),
      ]);

      if (waitersRes.data) setWaiters(waitersRes.data);
      if (devicesRes.data) setDevices(devicesRes.data);
    } catch (e) {
      console.error('Veriler yüklenemedi:', e);
      toast.error('Garson ve cihaz listesi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel(`waiter-devices-${business.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'waiter_devices', filter: `business_id=eq.${business.id}` },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business.id]);

  // Pairing countdown timer
  useEffect(() => {
    if (!isPairModalOpen || !pairingExpiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((pairingExpiresAt.getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setPairingToken(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPairModalOpen, pairingExpiresAt]);

  const handleCreateWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaiterName.trim()) {
      toast.error('Lütfen garson adını giriniz.');
      return;
    }
    if (!newWaiterPin.trim() || newWaiterPin.length < 4) {
      toast.error('PIN en az 4 haneli olmalıdır.');
      return;
    }

    try {
      setIsAdding(true);
      const pinHash = await hashPassword(newWaiterPin.trim());
      const { data, error } = await supabase
        .from('waiters')
        .insert([{
          business_id: business.id,
          name: newWaiterName.trim(),
          pin_hash: pinHash,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      setWaiters((prev) => [data, ...prev]);
      toast.success(`${data.name} adlı garson başarıyla eklendi.`);
      setNewWaiterName('');
      setNewWaiterPin('');
      setIsAddWaiterOpen(false);
    } catch (err: any) {
      toast.error('Garson eklenirken hata: ' + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleGeneratePairing = async () => {
    try {
      setIsGeneratingPair(true);
      const { data, error } = await supabase.rpc('generate_waiter_pairing_token', {
        p_business_id: business.id,
        p_device_name: 'Garson Telefonu',
      });

      if (error) throw error;

      setPairingToken(data.pairing_token);
      setPairingExpiresAt(new Date(data.expires_at));
      setTimeLeft(300);
      setIsPairModalOpen(true);
    } catch (err: any) {
      toast.error('Eşleme kodu üretilemedi: ' + err.message);
    } finally {
      setIsGeneratingPair(false);
    }
  };

  const pairingUrl = pairingToken
    ? `${window.location.origin}/pair-waiter?token=${pairingToken}&biz=${business.id}`
    : '';

  const handleCopyPairLink = () => {
    if (!pairingUrl) return;
    navigator.clipboard.writeText(pairingUrl);
    setCopied(true);
    toast.success('Eşleme linki panoya kopyalandı!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'waiter') {
        const { error } = await supabase.from('waiters').delete().eq('id', deleteTarget.id);
        if (error) throw error;
        setWaiters((prev) => prev.filter((w) => w.id !== deleteTarget.id));
        toast.success('Garson silindi.');
      } else {
        const { error } = await supabase.from('waiter_devices').delete().eq('id', deleteTarget.id);
        if (error) throw error;
        setDevices((prev) => prev.filter((d) => d.id !== deleteTarget.id));
        toast.success('Cihaz yetkisi kaldırıldı ve oturumu kapatıldı.');
      }
    } catch (err: any) {
      toast.error('İşlem başarısız: ' + err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#12161F] border border-[#212634] rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Garson & Cihaz Güvenliği (Tek Seferlik Eşleme)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Garsonlar sisteme sadece onaylanan fiziksel cihazları ve kişisel PIN kodlarıyla giriş yapabilir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddWaiterOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-slate-700 shadow-sm"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            Yeni Garson Ekle
          </button>

          <button
            onClick={handleGeneratePairing}
            disabled={isGeneratingPair}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30"
          >
            <QrCode className="w-4 h-4" />
            {isGeneratingPair ? 'QR Üretiliyor...' : 'Yeni Cihaz Eşle (QR)'}
          </button>
        </div>
      </div>

      {/* Grid: Waiters List & Paired Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Waiters List */}
        <div className="bg-[#12161F] border border-[#212634] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              Kayıtlı Garsonlar ({waiters.length})
            </h3>
            <button 
              onClick={loadData}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Yenile
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Yükleniyor...</div>
          ) : waiters.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs bg-[#090C10]/50 rounded-xl border border-dashed border-[#212634]">
              Henüz garson eklenmemiş. Yukarıdaki "Yeni Garson Ekle" butonuna tıklayın.
            </div>
          ) : (
            <div className="space-y-2.5">
              {waiters.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#090C10] border border-[#212634] hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs">
                      {w.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{w.name}</h4>
                      <p className="text-[10px] text-slate-500">PIN: **** (Şifreli Güvenli)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      w.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {w.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                    <button
                      onClick={() => setDeleteTarget({ type: 'waiter', id: w.id, name: w.name })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Paired Devices */}
        <div className="bg-[#12161F] border border-[#212634] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              Eşlenmiş Aktif Cihazlar ({devices.length})
            </h3>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
              Kasa Kontrolünde
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Yükleniyor...</div>
          ) : devices.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs bg-[#090C10]/50 rounded-xl border border-dashed border-[#212634]">
              Henüz eşlenmiş cihaz yok. Garson telefonunu eşlemek için "Yeni Cihaz Eşle (QR)" butonunu kullanın.
            </div>
          ) : (
            <div className="space-y-2.5">
              {devices.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#090C10] border border-[#212634] hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-200">{d.device_name || 'Garson Telefonu'}</h4>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Eşlendi
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {d.waiters ? `Son Kullanıcı: ${d.waiters.name}` : 'Atanmış garson yok'} • Son aktiflik: {new Date(d.last_active_at).toLocaleTimeString('tr-TR')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteTarget({ type: 'device', id: d.id, name: d.device_name || 'Garson Cihazı' })}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Oturumu Kapat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD WAITER MODAL */}
      {isAddWaiterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#12161F] border border-[#212634] rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-black text-white mb-1">Yeni Garson Tanımla</h3>
            <p className="text-xs text-slate-400 mb-4">
              Garsonun sisteme giriş yapacağı isim ve 4 haneli PIN kodunu belirleyin.
            </p>

            <form onSubmit={handleCreateWaiter} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Garson Adı Soyadı:</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Mehmet Yılmaz"
                  value={newWaiterName}
                  onChange={(e) => setNewWaiterName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090C10] border border-[#212634] text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">4 Haneli Giriş PIN Kodu:</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="Örn: 1234"
                  value={newWaiterPin}
                  onChange={(e) => setNewWaiterPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090C10] border border-[#212634] text-white text-xs tracking-widest placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-center font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddWaiterOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
                >
                  {isAdding ? 'Kaydediliyor...' : 'Garsonu Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PAIRING QR CODE MODAL */}
      {isPairModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#12161F] border border-[#212634] rounded-2xl p-6 shadow-2xl text-center animate-in fade-in zoom-in-95">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-white mb-1">Tek Seferlik Garson Cihazı Eşleme</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
              Garson bu QR kodu telefonunun kamerasıyla okutmalıdır. 5 dakika geçerlidir ve tek sefer kullanılır.
            </p>

            {pairingToken && timeLeft > 0 ? (
              <div className="space-y-4">
                <div className="inline-block p-4 bg-white rounded-2xl shadow-xl">
                  <QRCodeSVG value={pairingUrl} size={190} level="M" />
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 py-2 px-3 rounded-xl">
                  <Clock className="w-4 h-4 animate-pulse" />
                  Kalan Süre: {formatTime(timeLeft)}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pairingUrl}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#090C10] border border-[#212634] text-[10px] text-slate-400 truncate"
                  />
                  <button
                    onClick={handleCopyPairLink}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Kopyalandı' : 'Kopyala'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 space-y-3">
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
                <p className="text-xs font-bold text-red-400">Eşleme kodunun süresi doldu!</p>
                <button
                  onClick={handleGeneratePairing}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg"
                >
                  Yeni QR Kodu Üret
                </button>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#212634]">
              <button
                onClick={() => setIsPairModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                Pencereyi Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Revoke Confirmation */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          title={deleteTarget.type === 'waiter' ? 'Garsonu Sil' : 'Cihaz Yetkisini Kaldır'}
          message={`"${deleteTarget.name}" adlı ${deleteTarget.type === 'waiter' ? 'garsonu silmek' : 'cihazın yetkisini kaldırıp oturumunu kapatmak'} istediğinize emin misiniz?`}
          confirmText="Evet, Kaldır"
          cancelText="Vazgeç"
          type="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
