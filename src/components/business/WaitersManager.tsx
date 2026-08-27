import React, { useState, useEffect } from 'react';
import { 
  Users, Smartphone, QrCode, Trash2, CheckCircle2, 
  XCircle, Clock, ShieldCheck, RefreshCw, Copy, Check, 
  UserCheck, ShieldAlert
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Business, WaiterDevice } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

interface WaitersManagerProps {
  business: Business;
}

export const WaitersManager: React.FC<WaitersManagerProps> = ({ business }) => {
  const [approvedDevices, setApprovedDevices] = useState<WaiterDevice[]>([]);
  const [pendingDevices, setPendingDevices] = useState<WaiterDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairingSecret, setPairingSecret] = useState<string>(business.pairing_secret || '');
  const [isRotatingQr, setIsRotatingQr] = useState(false);

  // Editable waiter names for pending requests
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});

  // QR Modal
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Delete / Revoke Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState<WaiterDevice | null>(null);

  const pairingUrl = `${window.location.origin}/pair-waiter?biz=${business.slug}${pairingSecret ? `&key=${pairingSecret}` : ''}`;

  const loadData = async () => {
    try {
      setLoading(true);
      const [devicesRes, bizRes] = await Promise.all([
        supabase
          .from('waiter_devices')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('businesses')
          .select('pairing_secret')
          .eq('id', business.id)
          .single(),
      ]);

      if (bizRes.data?.pairing_secret) setPairingSecret(bizRes.data.pairing_secret);

      if (devicesRes.data) {
        const approved = devicesRes.data.filter((d) => d.status === 'approved' && d.is_trusted);
        const pending = devicesRes.data.filter((d) => d.status === 'pending');
        setApprovedDevices(approved);
        setPendingDevices(pending);

        const initialNames: Record<string, string> = {};
        pending.forEach((d) => {
          initialNames[d.id] = d.waiter_name || '';
        });
        setEditingNames(initialNames);
      }
    } catch (e) {
      console.error('Cihaz listesi yüklenemedi:', e);
      toast.error('Garson cihaz listesi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel(`waiter-devices-live-${business.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'waiter_devices', filter: `business_id=eq.${business.id}` },
        (payload: any) => {
          loadData();
          if (payload.eventType === 'INSERT' && payload.new?.status === 'pending') {
            toast.info(`Yeni Garson Talebi: "${payload.new.waiter_name || payload.new.device_name}" onay bekliyor!`, {
              duration: 6000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business.id]);

  const handleRotateQr = async () => {
    try {
      setIsRotatingQr(true);
      const { data, error } = await supabase.rpc('rotate_business_pairing_secret', {
        p_business_id: business.id,
      });

      if (error) throw error;

      setPairingSecret(data);
      toast.success('Garson QR kodu başarıyla yenilendi. Eski QR kodlar geçersiz kılındı.');
    } catch (err: any) {
      toast.error('QR kod yenilenirken hata: ' + err.message);
    } finally {
      setIsRotatingQr(false);
    }
  };

  const handleApproveDevice = async (deviceId: string) => {
    const waiterName = editingNames[deviceId] || '';

    try {
      const { data, error } = await supabase.rpc('approve_waiter_device', {
        p_device_id: deviceId,
        p_waiter_name: waiterName.trim() || null,
      });

      if (error) throw error;

      toast.success(`"${data.waiter_name}" adlı garson cihazı başarıyla onaylandı.`);
      loadData();
    } catch (err: any) {
      toast.error('Onaylama sırasında hata: ' + err.message);
    }
  };

  const handleRejectDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase.rpc('reject_waiter_device', {
        p_device_id: deviceId,
      });

      if (error) throw error;

      toast.success('Garson talebi reddedildi.');
      loadData();
    } catch (err: any) {
      toast.error('İşlem başarısız: ' + err.message);
    }
  };

  const handleRevokeDevice = async () => {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase.rpc('reject_waiter_device', {
        p_device_id: deleteTarget.id,
      });

      if (error) throw error;

      setApprovedDevices((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.waiter_name || 'Garson'}" cihazının yetkisi kaldırıldı.`);
    } catch (err: any) {
      toast.error('Yetki kaldırma başarısız: ' + err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCopyPairLink = () => {
    navigator.clipboard.writeText(pairingUrl);
    setCopied(true);
    toast.success('Garson bağlantı linki kopyalandı!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* TOP BANNER: PAIRING QR CODE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Garson Cihaz Eşleme Mimarisi
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
              Garson Cihazı Eşleme QR Kodu
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              İşe başlayan garson bu QR kodu telefonunun kamerasıyla okutur ve adını girerek yetki talebi gönderir. Kasadan onayladığınız anda garson doğrudan masa seçip sipariş almaya başlar.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
              >
                <QrCode className="w-4 h-4" />
                <span>QR Kodu Büyüt</span>
              </button>

              <button
                onClick={handleRotateQr}
                disabled={isRotatingQr}
                className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-2 border border-amber-500/30 transition disabled:opacity-50"
                title="Eski QR kodu iptal eder ve yeni bir kod oluşturur"
              >
                <RefreshCw className={`w-4 h-4 ${isRotatingQr ? 'animate-spin' : ''}`} />
                <span>{isRotatingQr ? 'Yenileniyor...' : 'QR Kodunu Yenile'}</span>
              </button>

              <button
                onClick={handleCopyPairLink}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Kopyalandı!' : 'Bağlantıyı Kopyala'}</span>
              </button>
            </div>
          </div>

          <div 
            onClick={() => setIsQrModalOpen(true)}
            className="cursor-pointer bg-white p-3.5 rounded-2xl border-4 border-indigo-500/20 shadow-2xl shrink-0 self-center md:self-auto hover:scale-105 transition-transform"
          >
            <QRCodeSVG value={pairingUrl} size={110} level="M" />
            <span className="block text-[9px] font-black text-slate-900 text-center mt-1.5 uppercase tracking-wider">
              Tarat ve Eşle
            </span>
          </div>
        </div>
      </div>

      {/* PENDING APPROVAL REQUESTS (CANLI TALEPLER) */}
      {pendingDevices.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
              <h3 className="text-sm font-black text-slate-900">
                Onay Bekleyen Garson Cihaz Talepleri ({pendingDevices.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-500/20 px-2.5 py-0.5 rounded-full">
              Canlı Bildirim
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingDevices.map((device) => (
              <div key={device.id} className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Garson Adı & Cihaz:
                  </label>
                  <input
                    type="text"
                    value={editingNames[device.id] ?? (device.waiter_name || '')}
                    onChange={(e) => setEditingNames({ ...editingNames, [device.id]: e.target.value })}
                    placeholder="Garson Adı"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Cihaz: {device.device_name}</span>
                    <span>Saat: {new Date(device.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleApproveDevice(device.id)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Yetkiyi Onayla</span>
                  </button>

                  <button
                    onClick={() => handleRejectDevice(device.id)}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reddet</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPROVED DEVICES LIST */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Yetkili Garsonlar ve Cihazları ({approvedDevices.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              QR okutulup onaylanan tüm garsonlar. İşten ayrılan personelin yetkisini buradan tek tıkla kaldırabilirsiniz.
            </p>
          </div>

          <button
            onClick={loadData}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
            title="Listeyi Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-bold">Yükleniyor...</div>
        ) : approvedDevices.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            Henüz onaylanmış bir garson cihazı bulunmuyor. Garsonlarınız yukarıdaki QR kodu okutarak talep gönderebilir.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {approvedDevices.map((device) => (
              <div key={device.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-sm">
                    {(device.waiter_name || 'G').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-slate-900">{device.waiter_name || 'Garson'}</h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        Aktif
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {device.device_name}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Son Giriş: {new Date(device.last_active_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setDeleteTarget(device)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Yetkiyi Kaldır"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: LARGE QR CODE */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900">Garson Eşleme QR Kodu</h3>
              <button onClick={() => setIsQrModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl inline-block shadow-inner">
              <QRCodeSVG value={pairingUrl} size={200} level="H" />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Garson bu QR kodu telefon kamerasıyla okutarak adını girip talep gönderir.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleCopyPairLink}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <Copy className="w-4 h-4" />
                <span>Bağlantı Linkini Kopyala</span>
              </button>

              <button
                onClick={handleRotateQr}
                disabled={isRotatingQr}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRotatingQr ? 'animate-spin' : ''}`} />
                <span>{isRotatingQr ? 'Yenileniyor...' : 'Yeni QR Kod Üret (Eskileri İptal Et)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          title="Garson Yetkisini Kaldır"
          message={`"${deleteTarget.waiter_name || 'Garson'}" adlı personelin terminal yetkisini kaldırmak istediğinize emin misiniz?`}
          confirmText="Evet, Kaldır"
          cancelText="Vazgeç"
          type="danger"
          onConfirm={handleRevokeDevice}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
