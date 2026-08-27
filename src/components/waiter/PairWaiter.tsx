import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, AlertTriangle, Smartphone, 
  ArrowRight, RefreshCw, Send, Clock, Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const PairWaiter: React.FC = () => {
  const [businessSlug, setBusinessSlug] = useState('');
  const [pairingKey, setPairingKey] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [waiterName, setWaiterName] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'waiting_approval' | 'approved' | 'rejected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const getDefaultDeviceName = () => {
    const ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return 'iPhone';
    if (/iPad/i.test(ua)) return 'iPad';
    if (/Android/i.test(ua)) return 'Android Cihaz';
    return 'Mobil Cihaz';
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bizParam = params.get('biz') || params.get('business') || '';
    const keyParam = params.get('key') || params.get('k') || '';
    setBusinessSlug(bizParam);
    setPairingKey(keyParam);
    setDeviceName(getDefaultDeviceName());

    const savedToken = localStorage.getItem('restiva_waiter_device_token');
    if (savedToken) {
      checkExistingToken(savedToken);
    }
  }, []);

  const checkExistingToken = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('check_device_pairing_status', {
        p_device_token: token,
      });

      if (!error && data) {
        if (data.status === 'approved' && data.is_trusted) {
          window.location.href = '/waiter';
          return;
        } else if (data.status === 'pending') {
          setDeviceToken(token);
          if (data.waiter_name) setWaiterName(data.waiter_name);
          setStatus('waiting_approval');
        }
      }
    } catch {
      // Continue to request screen
    }
  };

  useEffect(() => {
    if (status !== 'waiting_approval' || !deviceToken) return;

    const channel = supabase
      .channel(`waiter-pairing-${deviceToken}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waiter_devices',
          filter: `device_token=eq.${deviceToken}`,
        },
        (payload: any) => {
          const updated = payload.new;
          if (updated) {
            if (updated.status === 'approved' && updated.is_trusted) {
              localStorage.setItem('restiva_waiter_device_token', updated.device_token);
              localStorage.setItem('restiva_waiter_biz_id', updated.business_id);
              localStorage.setItem('restiva_waiter_name', updated.waiter_name || 'Garson');
              setStatus('approved');
              setTimeout(() => {
                window.location.href = '/waiter';
              }, 1200);
            } else if (updated.status === 'rejected') {
              setStatus('rejected');
            }
          }
        }
      )
      .subscribe();

    const interval = setInterval(async () => {
      const { data } = await supabase.rpc('check_device_pairing_status', {
        p_device_token: deviceToken,
      });
      if (data && data.status === 'approved' && data.is_trusted) {
        localStorage.setItem('restiva_waiter_device_token', deviceToken);
        if (data.business_id) localStorage.setItem('restiva_waiter_biz_id', data.business_id);
        if (data.waiter_name) localStorage.setItem('restiva_waiter_name', data.waiter_name);
        setStatus('approved');
        setTimeout(() => {
          window.location.href = '/waiter';
        }, 1200);
      } else if (data && data.status === 'rejected') {
        setStatus('rejected');
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [status, deviceToken]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessSlug.trim()) {
      setErrorMessage('İşletme kodu (slug) eksik. Lütfen QR kodu tekrar okutunuz.');
      setStatus('error');
      return;
    }
    if (!waiterName.trim()) {
      setErrorMessage('Lütfen adınızı ve soyadınızı giriniz.');
      setStatus('error');
      return;
    }

    try {
      setStatus('submitting');
      setErrorMessage('');

      const { data, error } = await supabase.rpc('request_waiter_pairing', {
        p_business_slug: businessSlug.trim(),
        p_waiter_name: waiterName.trim(),
        p_device_name: deviceName.trim() || getDefaultDeviceName(),
        p_pairing_key: pairingKey.trim() || null,
      });

      if (error) throw error;

      if (data && data.success) {
        setDeviceId(data.device_id);
        setDeviceToken(data.device_token);
        setBusinessName(data.business_name);
        localStorage.setItem('restiva_waiter_device_token', data.device_token);
        localStorage.setItem('restiva_waiter_biz_id', data.business_id);
        localStorage.setItem('restiva_waiter_biz_name', data.business_name);
        localStorage.setItem('restiva_waiter_biz_slug', data.business_slug);
        localStorage.setItem('restiva_waiter_name', data.waiter_name);
        setStatus('waiting_approval');
      } else {
        throw new Error('Talep oluşturulamadı.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Eşleme talebi gönderilirken bir hata oluştu.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-indigo-600 selection:text-white">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
        
        {(status === 'idle' || status === 'submitting') && (
          <form onSubmit={handleSendRequest} className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center shadow-lg">
              <Smartphone className="w-7 h-7" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full mb-1">
                Garson Terminali Eşleme
              </span>
              <h2 className="text-base font-black text-white">Garson Cihaz Girişi</h2>
              <p className="text-xs text-slate-400 mt-1">
                Sipariş almaya başlamak için bilgilerinizi girip kasaya onay talebi gönderin.
              </p>
            </div>

            <div className="space-y-3 text-left pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Adınız ve Soyadınız
                </label>
                <input
                  type="text"
                  value={waiterName}
                  onChange={(e) => setWaiterName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Cihaz Modeli
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Örn: iPhone 14"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
                />
              </div>

              {!businessSlug && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    İşletme Kodu (Slug)
                  </label>
                  <input
                    type="text"
                    value={businessSlug}
                    onChange={(e) => setBusinessSlug(e.target.value)}
                    placeholder="Örn: silvana-7133"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
                    required
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
            >
              {status === 'submitting' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Talep İletiliyor...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Yetki Talebi Gönder</span>
                </>
              )}
            </button>
          </form>
        )}

        {status === 'waiting_approval' && (
          <div className="py-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-lg animate-pulse">
              <Clock className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full mb-2">
                Kasa Onayı Bekleniyor
              </span>
              <h2 className="text-base font-black text-white">Talebiniz Kasaya İletildi</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Lütfen kasa yetkilisinin panel üzerinden cihazınızı onaylamasını bekleyiniz. Onay verildiğinde bu ekran otomatik olarak açılacaktır.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Cihaz:</span>
                <span className="font-bold text-white">{deviceName}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Durum:</span>
                <span className="font-bold text-amber-400">Onay Bekliyor...</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Canlı bağlantı aktif...</span>
            </div>
          </div>
        )}

        {status === 'approved' && (
          <div className="py-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Yetki Onaylandı
              </span>
              <h2 className="text-base font-black text-white">Cihaz Başarıyla Eşlendi</h2>
              <p className="text-xs text-slate-400 mt-1">
                Garson terminali başlatılıyor, lütfen bekleyiniz...
              </p>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="py-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-base font-black text-white">Talep Reddedildi</h2>
              <p className="text-xs text-slate-400 mt-1">
                Kasa yetkilisi bu cihazın garson eşleme talebini onaylamadı.
              </p>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('restiva_waiter_device_token');
                setStatus('idle');
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
            >
              Yeniden Talep Gönder
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-base font-black text-white">Bağlantı Hatası</h2>
              <p className="text-xs text-rose-300 mt-1 leading-relaxed">{errorMessage}</p>
            </div>

            <button
              onClick={() => setStatus('idle')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 text-left">
          <div className="flex items-start gap-2.5 text-slate-400 text-[11px] leading-relaxed">
            <Download className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-300 block">Uygulama Olarak İndirin:</span>
              Tarayıcı menünüzden <span className="text-white font-semibold">"Ana Ekrana Ekle"</span> seçeneğine dokunarak her gün doğrudan tek tıkla açabilirsiniz.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
