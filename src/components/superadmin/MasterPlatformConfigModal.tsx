import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Key, Check, RefreshCw, Zap, ExternalLink, Globe } from 'lucide-react';
import { PlatformType } from '../../types';
import { PLATFORM_INFO, getMasterPlatformConfigs, saveMasterPlatformConfig } from '../../lib/foodPlatforms';
import { useToast } from '../../context/ToastContext';

interface MasterPlatformConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasterPlatformConfigModal: React.FC<MasterPlatformConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const toast = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('trendyol');
  const [masterConfigs, setMasterConfigs] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  useEffect(() => {
    if (isOpen) {
      getMasterPlatformConfigs().then((res) => {
        setMasterConfigs(res || {});
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPlatformInfo = PLATFORM_INFO[selectedPlatform];
  const currentData = masterConfigs[selectedPlatform] || {};

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const configToSave = {
        platform: selectedPlatform,
        ...currentData,
      };

      await saveMasterPlatformConfig(configToSave);
      toast.success(`${currentPlatformInfo.name} Master API anahtarları sisteme kaydedildi!`);
    } catch (err: any) {
      toast.error('Master API kaydedilemedi: ' + (err?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#0C1017] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/[0.08]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.06] bg-[#111622]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-sm sm:text-base text-white">
                  RestivAdisyon Global Master API Havuzu
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Tek Seferlik Kurulum
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Buraya gireceğiniz anahtarlar tüm kayıtlı restoranlar için geçerli olur. Yeni dükkan eklerken sadece Dükkan ID yazmanız yeterlidir.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#1C2433] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 scrollbar-none">
          {/* Platform Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(Object.keys(PLATFORM_INFO) as PlatformType[]).map((plt) => {
              const info = PLATFORM_INFO[plt];
              const isSelected = selectedPlatform === plt;
              const hasKey = !!(masterConfigs[plt]?.master_api_key || masterConfigs[plt]?.master_client_id);

              return (
                <button
                  key={plt}
                  onClick={() => setSelectedPlatform(plt)}
                  onMouseMove={handleSpotlightMove}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 spotlight-card spotlight-glow ${
                    isSelected
                      ? 'bg-white/20 text-white border border-white/30 shadow-md'
                      : 'bg-[#111622] text-slate-400 hover:text-white hover:bg-[#182030] border border-white/[0.06]'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span>{info.name}</span>
                </button>
              );
            })}
          </div>

          {/* Form for selected Platform */}
          <form onSubmit={handleSave} className="bg-[#111622] rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="font-extrabold text-sm text-white">{currentPlatformInfo.name} Master Anahtarları</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{currentPlatformInfo.description}</p>
              </div>

              <a
                href={currentPlatformInfo.portalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-300 hover:text-white bg-[#1C2433] px-3 py-1.5 rounded-xl transition flex items-center gap-1 border border-white/[0.08]"
              >
                <span>{currentPlatformInfo.portalName}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Master API Key / Client ID
                </label>
                <input
                  type="text"
                  value={currentData.master_api_key || currentData.master_client_id || ''}
                  onChange={(e) =>
                    setMasterConfigs((prev) => ({
                      ...prev,
                      [selectedPlatform]: {
                        ...prev[selectedPlatform],
                        master_api_key: e.target.value,
                        master_client_id: e.target.value,
                      },
                    }))
                  }
                  placeholder="Master API Key / Client ID giriniz"
                  className="w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Master API Secret / Client Secret
                </label>
                <input
                  type="password"
                  value={currentData.master_api_secret || currentData.master_client_secret || ''}
                  onChange={(e) =>
                    setMasterConfigs((prev) => ({
                      ...prev,
                      [selectedPlatform]: {
                        ...prev[selectedPlatform],
                        master_api_secret: e.target.value,
                        master_client_secret: e.target.value,
                      },
                    }))
                  }
                  placeholder="Master Secret / Token giriniz"
                  className="w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Geliştirici Notu / Partner Sözleşme No (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={currentData.notes || ''}
                  onChange={(e) =>
                    setMasterConfigs((prev) => ({
                      ...prev,
                      [selectedPlatform]: {
                        ...prev[selectedPlatform],
                        notes: e.target.value,
                      },
                    }))
                  }
                  placeholder="Örn: 2026 RestivAdisyon ISV Partner Sözleşmesi"
                  className="w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-[#1C2433] transition"
              >
                Kapat
              </button>

              <button
                type="submit"
                disabled={saving}
                onMouseMove={handleSpotlightMove}
                className="px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-md border border-white/25 active:scale-95 disabled:opacity-50 spotlight-card spotlight-glow"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-emerald-400" />}
                <span>{saving ? 'Kaydediliyor...' : `${currentPlatformInfo.name} Master API'yi Kaydet`}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
