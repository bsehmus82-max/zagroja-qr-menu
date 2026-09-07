import React, { useState, useEffect } from 'react';
import { 
  Utensils, Check, Copy, ExternalLink, RefreshCw, 
  Send, ShieldCheck, Zap, AlertCircle, ShoppingBag, Truck, Sparkles, Key
} from 'lucide-react';
import { Business, PlatformType, FoodPlatformConfig } from '../../types';
import { 
  PLATFORM_INFO, 
  getPlatformConfigs, 
  savePlatformConfig, 
  getPlatformWebhookUrl, 
  sendSimulatedPlatformOrder 
} from '../../lib/foodPlatforms';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface FoodPlatformsManagerProps {
  business: Business;
}

export const FoodPlatformsManager: React.FC<FoodPlatformsManagerProps> = ({ business }) => {
  const toast = useToast();
  const [configs, setConfigs] = useState<Record<PlatformType, FoodPlatformConfig>>({
    trendyol: { business_id: business.id, platform: 'trendyol', is_active: false, courier_type: 'platform', use_master_api: true },
    yemeksepeti: { business_id: business.id, platform: 'yemeksepeti', is_active: false, courier_type: 'platform', use_master_api: true },
    getir: { business_id: business.id, platform: 'getir', is_active: false, courier_type: 'platform', use_master_api: true },
    migros: { business_id: business.id, platform: 'migros', is_active: false, courier_type: 'platform', use_master_api: true },
    tiklagelsin: { business_id: business.id, platform: 'tiklagelsin', is_active: false, courier_type: 'platform', use_master_api: true },
    fuudy: { business_id: business.id, platform: 'fuudy', is_active: false, courier_type: 'platform', use_master_api: true },
    vigo: { business_id: business.id, platform: 'vigo', is_active: false, courier_type: 'platform', use_master_api: true },
  });

  const [loading, setLoading] = useState(true);
  const [savingPlatform, setSavingPlatform] = useState<PlatformType | null>(null);
  const [simulatingPlatform, setSimulatingPlatform] = useState<PlatformType | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<PlatformType | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('trendyol');

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  useEffect(() => {
    const loadConfigs = async () => {
      setLoading(true);
      try {
        const list = await getPlatformConfigs(business.id);
        if (list && list.length > 0) {
          setConfigs((prev) => {
            const next = { ...prev };
            list.forEach((c) => {
              next[c.platform] = { ...c, use_master_api: c.use_master_api ?? true };
            });
            return next;
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadConfigs();
  }, [business.id]);

  const handleSave = async (platform: PlatformType) => {
    setSavingPlatform(platform);
    try {
      const configToSave = configs[platform];
      const saved = await savePlatformConfig(configToSave);
      if (saved) {
        setConfigs((prev) => ({ ...prev, [platform]: saved }));
        toast.success(`${PLATFORM_INFO[platform].name} entegrasyonu başarıyla bağlandı!`);

        // Send automated notification message to business support chat
        if (configToSave.is_active) {
          try {
            await supabase.from('support_messages').insert({
              business_id: business.id,
              sender: 'system',
              subject: `${PLATFORM_INFO[platform].name} Entegrasyonunuz Aktifleştirildi`,
              message: `Sayın işletme yetkilisi,\n\n"${PLATFORM_INFO[platform].name}" yemek platformu entegrasyonunuz sistem yöneticiniz tarafından başarıyla kuruldu ve aktifleştirildi.\n\nArtık ${PLATFORM_INFO[platform].name} üzerinden gelen tüm siparişleriniz Canlı Siparişler ekranınıza anında düşecek, bildirim sesi çalacak ve otomatik termal mutfak fişi yazdırılacaktır.`,
              is_read: false,
            });
          } catch (e) {
            console.warn('Auto support message warning:', e);
          }
        }
      }
    } catch (err: any) {
      toast.error('Ayarlar kaydedilirken hata oluştu: ' + (err?.message || ''));
    } finally {
      setSavingPlatform(null);
    }
  };

  const handleCopyWebhook = (platform: PlatformType) => {
    const url = getPlatformWebhookUrl(business.slug, platform);
    navigator.clipboard.writeText(url);
    setCopiedPlatform(platform);
    toast.success(`${PLATFORM_INFO[platform].name} Webhook URL panoya kopyalandı!`);
    setTimeout(() => setCopiedPlatform(null), 2500);
  };

  const handleSendTestOrder = async (platform: PlatformType) => {
    setSimulatingPlatform(platform);
    try {
      const sampleItems = [
        { name: 'Özel Soslu Tavuk Dürüm Menü', price: 210, quantity: 2 },
        { name: 'Çıtır Patates Tava (Büyük)', price: 85, quantity: 1 },
        { name: 'Kutu İçecek 330ml', price: 45, quantity: 2 },
      ];

      const created = await sendSimulatedPlatformOrder(business.id, platform, sampleItems);
      if (created) {
        toast.success(`[${PLATFORM_INFO[platform].name}] Canlı test siparişi oluşturuldu! Canlı Siparişler ekranını ve fiş çıktısını kontrol edebilirsiniz.`);
      }
    } catch (err: any) {
      toast.error('Test siparişi oluşturulamadı: ' + (err?.message || ''));
    } finally {
      setSimulatingPlatform(null);
    }
  };

  const activePlatformCount = Object.values(configs).filter((c) => c.is_active).length;
  const currentConfig = configs[selectedPlatform];
  const currentInfo = PLATFORM_INFO[selectedPlatform];
  const currentWebhookUrl = getPlatformWebhookUrl(business.slug, selectedPlatform);

  return (
    <div className="space-y-6 font-medium text-slate-200">
      {/* Top Banner Card */}
      <div 
        onMouseMove={handleSpotlightMove}
        className="bg-[#111622] rounded-2xl p-5 sm:p-6 shadow-lg spotlight-card spotlight-glow space-y-3"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-white/10 text-slate-200">
              <Zap className="w-3.5 h-3.5" /> Çoklu Yemek & Kurye Platformları (7 Platform)
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
              Master API ile Tek Tıkla Bağlantı
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trendyol Yemek, Yemeksepeti, Getir, Migros Yemek, Tıkla Gelsin, Fuudy ve Vigo. İşletmenin sadece <strong className="text-slate-200">Dükkan / Satıcı ID</strong> kodunu girerek RestivAdisyon Ana Altyapısına anında bağlayabilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#0C1017] p-3 rounded-xl shrink-0 self-start md:self-auto shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#1C2433] flex items-center justify-center text-white font-black text-sm">
              {activePlatformCount}/7
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 block">Bağlı Platform</span>
              <span className="text-[10px] text-slate-400 block">{activePlatformCount > 0 ? 'Siparişler dinleniyor' : 'Henüz platform bağlı değil'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Selector Pills (All 7 Platforms) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(Object.keys(PLATFORM_INFO) as PlatformType[]).map((plt) => {
          const info = PLATFORM_INFO[plt];
          const cfg = configs[plt];
          const isSelected = selectedPlatform === plt;

          return (
            <button
              key={plt}
              onClick={() => setSelectedPlatform(plt)}
              onMouseMove={handleSpotlightMove}
              className={`px-4 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 shrink-0 spotlight-card spotlight-glow ${
                isSelected
                  ? 'bg-white/20 text-white border border-white/30 shadow-md'
                  : 'bg-[#111622] text-slate-400 hover:text-white hover:bg-[#182030] border border-white/[0.06]'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${cfg.is_active ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-600'}`} />
              <span>{info.name}</span>
              {cfg.is_active && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Bağlı
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Platform Detail Form Card */}
      <div className="bg-[#111622] rounded-2xl p-5 sm:p-6 shadow-lg space-y-6">
        {/* Header & Status Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F293D]/60">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">{currentInfo.name}</h3>
              <a
                href={currentInfo.portalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-[#1C2433] px-2.5 py-1 rounded-xl transition"
              >
                <span>{currentInfo.portalName}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-slate-400 mt-1">{currentInfo.description}</p>
          </div>

          <div className="flex items-center gap-3 bg-[#0C1017] p-2 rounded-2xl shrink-0">
            <span className="text-xs font-bold text-slate-300">
              {currentConfig.is_active ? 'Entegrasyon Açık' : 'Entegrasyon Kapalı'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentConfig.is_active}
                onChange={(e) =>
                  setConfigs((prev) => ({
                    ...prev,
                    [selectedPlatform]: { ...prev[selectedPlatform], is_active: e.target.checked },
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#182030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500/30 peer-checked:after:bg-emerald-400 border border-white/[0.08]"></div>
            </label>
          </div>
        </div>

        {/* Master API Badge */}
        <div className="bg-[#0C1017] p-3.5 rounded-2xl flex items-center justify-between border border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">RestivAdisyon Master API Aktif</span>
              <span className="text-[11px] text-slate-400">İşletme için sadece Satıcı / Restoran ID kodunu girmeniz yeterlidir.</span>
            </div>
          </div>
          <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300">
            Otomatik Eşleşme
          </span>
        </div>

        {/* Form Inputs (Primary: Merchant ID / Store ID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentInfo.requiredFields.map((field, idx) => (
            <div key={field.key} className={idx === 0 ? 'md:col-span-2' : ''}>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {field.label} {idx === 0 && <span className="text-emerald-400 font-extrabold">(Zorunlu)</span>}
              </label>
              <input
                type="text"
                value={(currentConfig as any)[field.key] || ''}
                onChange={(e) =>
                  setConfigs((prev) => ({
                    ...prev,
                    [selectedPlatform]: {
                      ...prev[selectedPlatform],
                      [field.key]: e.target.value,
                    },
                  }))
                }
                placeholder={field.placeholder}
                className={`w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none font-bold placeholder:text-slate-600 ${
                  idx === 0 ? 'border border-emerald-500/30' : ''
                }`}
              />
            </div>
          ))}

          {/* Courier Model & Auto-Accept Controls */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kurye Dağıtım Modeli
            </label>
            <select
              value={currentConfig.courier_type || 'platform'}
              onChange={(e) =>
                setConfigs((prev) => ({
                  ...prev,
                  [selectedPlatform]: {
                    ...prev[selectedPlatform],
                    courier_type: e.target.value as any,
                  },
                }))
              }
              className="w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-bold focus:outline-none cursor-pointer"
            >
              <option value="platform">{currentInfo.name} Kuryesi (Platform Teslimatı)</option>
              <option value="restaurant">Restoranın Kendi Özel Kuryesi</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Otomatik Sipariş Onayı
            </label>
            <div className="bg-[#0C1017] p-2.5 rounded-xl flex items-center justify-between">
              <span className="text-xs text-slate-400">Sipariş gelince beklemeden onayla</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentConfig.auto_accept || false}
                  onChange={(e) =>
                    setConfigs((prev) => ({
                      ...prev,
                      [selectedPlatform]: {
                        ...prev[selectedPlatform],
                        auto_accept: e.target.checked,
                      },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-[#182030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white/30 peer-checked:after:bg-white border border-white/[0.08]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Webhook Endpoint Box (For Pasting into Platform Portal) */}
        <div className="bg-[#0C1017] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 block">
              {currentInfo.name} Webhook Bildirim Adresi (URL)
            </span>
            <span className="text-[10px] text-slate-400">
              Bu bağlantıyı {currentInfo.portalName} Entegrasyon / Webhook ayarlarına yapıştırın.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentWebhookUrl}
              className="flex-1 bg-[#111622] rounded-xl px-3.5 py-2 text-xs text-slate-300 font-mono focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={() => handleCopyWebhook(selectedPlatform)}
              onMouseMove={handleSpotlightMove}
              className="px-3.5 py-2 bg-[#1C2433] hover:bg-[#253043] text-slate-200 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-white/[0.08] shrink-0 spotlight-card spotlight-glow"
            >
              {copiedPlatform === selectedPlatform ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPlatform === selectedPlatform ? 'Kopyalandı' : 'Kopyala'}</span>
            </button>
          </div>
        </div>

        {/* Actions Row: Save & Live Test Order Simulator */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#1F293D]/60">
          <button
            type="button"
            onClick={() => handleSendTestOrder(selectedPlatform)}
            disabled={simulatingPlatform === selectedPlatform}
            onMouseMove={handleSpotlightMove}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#1C2433] hover:bg-[#253043] text-slate-200 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-white/[0.08] disabled:opacity-50 spotlight-card spotlight-glow"
          >
            <Send className={`w-3.5 h-3.5 ${simulatingPlatform === selectedPlatform ? 'animate-spin' : ''}`} />
            <span>{simulatingPlatform === selectedPlatform ? 'Sipariş Gönderiliyor...' : `Canlı ${currentInfo.name} Test Siparişi Fırlat`}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(selectedPlatform)}
            disabled={savingPlatform === selectedPlatform}
            onMouseMove={handleSpotlightMove}
            className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-slate-200 text-slate-900 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-95 spotlight-card spotlight-glow"
          >
            {savingPlatform === selectedPlatform ? <RefreshCw className="w-4 h-4 animate-spin text-slate-900" /> : <Check className="w-4 h-4 text-slate-900" />}
            <span>{savingPlatform === selectedPlatform ? 'Kaydediliyor...' : `${currentInfo.name} Entegrasyonunu Bağla`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
