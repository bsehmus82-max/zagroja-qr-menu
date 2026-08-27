import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, Smartphone, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const PairWaiter: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [businessName, setBusinessName] = useState('');

  const getDeviceName = () => {
    const ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return 'iPhone Garson Cihazı';
    if (/iPad/i.test(ua)) return 'iPad Garson Tableti';
    if (/Android/i.test(ua)) return 'Android Garson Cihazı';
    if (/Windows/i.test(ua)) return 'Windows Terminali';
    return 'Mobil Garson Cihazı';
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('Geçersiz veya eksik eşleme kodu.');
      return;
    }

    const pairDevice = async () => {
      try {
        const deviceName = getDeviceName();
        const { data, error } = await supabase.rpc('pair_waiter_device', {
          p_pairing_token: token,
          p_device_name: deviceName,
        });

        if (error) throw error;

        if (data && data.success) {
          localStorage.setItem('restiva_waiter_device_token', data.device_token);
          localStorage.setItem('restiva_waiter_biz_id', data.business_id);
          localStorage.setItem('restiva_waiter_biz_name', data.business_name);
          localStorage.setItem('restiva_waiter_biz_slug', data.business_slug);
          setBusinessName(data.business_name);
          setStatus('success');
        } else {
          throw new Error('Eşleme onaylanamadı.');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Eşleme QR kodunun süresi dolmuş veya kod geçersiz.');
      }
    };

    pairDevice();
  }, []);

  const handleGoToWaiter = () => {
    window.location.href = '/waiter';
  };

  return (
    <div className="min-h-screen bg-[#090C10] flex items-center justify-center p-4 selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="w-full max-w-sm bg-[#12161F] border border-[#212634] rounded-3xl p-7 shadow-2xl text-center">
        {status === 'loading' && (
          <div className="py-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>
            <h2 className="text-base font-black text-white">Cihaz Doğrulanıyor...</h2>
            <p className="text-xs text-slate-400">
              Güvenlik sertifikası ve eşleme anahtarı kontrol ediliyor.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full mb-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Güvenli Cihaz Onaylandı
              </span>
              <h2 className="text-lg font-black text-white">{businessName}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Bu telefon artık işletmeye özel garson terminali olarak eşlendi.
              </p>
            </div>

            <div className="p-3 bg-[#090C10] rounded-2xl border border-[#212634] text-left text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                Cihaz: {getDeviceName()}
              </div>
              <div className="text-[10px] text-emerald-400 font-bold">
                ✓ Kalıcı Cihaz Tokenı Kaydedildi
              </div>
            </div>

            <button
              onClick={handleGoToWaiter}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-xs transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              Garson Ekranına Geç
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-400 mx-auto flex items-center justify-center border border-red-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-base font-black text-white">Eşleme Başarısız</h2>
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-2xl">
              {errorMessage}
            </p>
            <p className="text-xs text-slate-400">
              Lütfen kasadaki yetkiliden yeni bir 5 dakikalık "Cihaz Eşleme QR Kodu" isteyiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
