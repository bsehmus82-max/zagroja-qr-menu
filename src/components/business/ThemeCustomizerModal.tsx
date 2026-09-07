// ==============================================================================
// RESTIVADISYON TEMA & MARKA ÖZELLEŞTİRME STÜDYOSU
// 6 Gerçek Restoran Teması, Tipografi, Renk Paletleri ve Canlı Önizleme
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { 
  X, Palette, Check, Sliders, Type, 
  Layout, Eye, RotateCcw, Smartphone, SlidersHorizontal
} from 'lucide-react';
import { Business, MenuThemeConfig, TemplateId, FontFamilyType, CardStyleType } from '../../types';
import { 
  PRESET_THEMES, FONT_FAMILY_MAP, getEffectiveThemeConfig, 
  injectGoogleFont 
} from '../../lib/aiBrandThemeEngine';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  onThemeSaved?: (updatedConfig: MenuThemeConfig) => void;
  onThemeUpdated?: (updatedBusiness: Business) => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  business,
  onThemeSaved,
  onThemeUpdated,
}) => {
  const toast = useToast();
  const currentEffective = getEffectiveThemeConfig(business);

  const [themeConfig, setThemeConfig] = useState<MenuThemeConfig>(() => ({
    ...currentEffective,
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  useEffect(() => {
    if (themeConfig.font_family) {
      injectGoogleFont(themeConfig.font_family);
    }
  }, [themeConfig.font_family]);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: TemplateId) => {
    const preset = PRESET_THEMES[presetId];
    if (preset) {
      setThemeConfig({ ...preset.config });
      injectGoogleFont(preset.config.font_family);
      toast.info(`"${preset.name}" teması seçildi.`);
    }
  };

  const handleSaveTheme = async () => {
    setIsSaving(true);
    try {
      const updatedBiz: Business = {
        ...business,
        template_id: themeConfig.template_id,
        theme_config: themeConfig,
      };

      const { error } = await supabase
        .from('businesses')
        .update({
          template_id: themeConfig.template_id,
          theme_config: themeConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id);

      if (!error) {
        toast.success('Restoran temanız ve QR menü arayüzünüz başarıyla güncellendi!');
        onThemeSaved?.(themeConfig);
        onThemeUpdated?.(updatedBiz);
        onClose();
      } else {
        throw error;
      }
    } catch (err: any) {
      toast.error('Tema kaydedilemedi: ' + (err?.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const currentFontMeta = FONT_FAMILY_MAP[themeConfig.font_family] || FONT_FAMILY_MAP.inter;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0C1017] border border-[#1F293D] rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <header className="p-4 sm:p-5 border-b border-[#1F293D] bg-[#111622] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1C2433] text-white flex items-center justify-center border border-white/10">
              <Palette className="w-5 h-5 text-slate-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>Restoran Tema & Yazı Tipi</span>
              </h3>
              <p className="text-xs text-slate-400">Mekanınızın atmosferine uygun renkler, yazı tipleri ve kart düzenleri</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content: 2 Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tabs: Hazır Temalar / Özel Ayarlar */}
            <div className="flex items-center gap-2 bg-[#111622] p-1.5 rounded-2xl border border-[#1F293D]">
              <button
                onClick={() => setActiveTab('presets')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  activeTab === 'presets'
                    ? 'bg-white/15 text-white shadow-xs border border-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                <span>Hazır Sektörel Temalar (6 Adet)</span>
              </button>

              <button
                onClick={() => setActiveTab('custom')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  activeTab === 'custom'
                    ? 'bg-white/15 text-white shadow-xs border border-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Font & Renk Özelleştir</span>
              </button>
            </div>

            {/* View 1: 6 Real Gastronomy Presets */}
            {activeTab === 'presets' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['fine_dining', 'boutique_cafe', 'modern_bistro', 'traditional_ocak', 'artisan_burger', 'minimalist_zen'] as TemplateId[]).map((tid) => {
                  const preset = PRESET_THEMES[tid];
                  const isSelected = themeConfig.template_id === tid;
                  return (
                    <div
                      key={tid}
                      onClick={() => handleSelectPreset(tid)}
                      className={`p-4 rounded-2xl border cursor-pointer transition relative overflow-hidden text-left flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#141A26] border-amber-500/60 shadow-lg ring-1 ring-amber-500/40'
                          : 'bg-[#111622] border-white/[0.06] hover:bg-[#161E2C] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          {preset.category}
                        </span>
                        <div
                          className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: preset.config.primary_color }}
                        />
                      </div>

                      <h4 className="font-extrabold text-xs text-white">{preset.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{preset.tagline}</p>

                      <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Font: {FONT_FAMILY_MAP[preset.config.font_family].label.split(' ')[0]}</span>
                        {isSelected && <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Seçili</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View 2: Custom Fine-tuning */}
            {activeTab === 'custom' && (
              <div className="space-y-5">
                {/* Font Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-amber-400" />
                    <span>Menü Yazı Tipi (Typography / Google Fonts):</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(FONT_FAMILY_MAP) as FontFamilyType[]).map((fKey) => {
                      const fMeta = FONT_FAMILY_MAP[fKey];
                      const isSelected = themeConfig.font_family === fKey;
                      return (
                        <button
                          key={fKey}
                          type="button"
                          onClick={() => setThemeConfig((prev) => ({ ...prev, font_family: fKey }))}
                          className={`p-3 rounded-2xl text-left border transition ${
                            isSelected
                              ? 'bg-white/15 border-amber-500 text-white shadow-xs'
                              : 'bg-[#111622] border-white/[0.06] text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-extrabold truncate" style={{ fontFamily: fMeta.cssFont }}>
                            {fMeta.label.split(' ')[0]}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{fMeta.style}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Color Picker */}
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-sky-400" />
                    <span>Ana Vurgu & Buton Rengi:</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['#D4AF37', '#F97316', '#3B82F6', '#10B981', '#C07A38', '#DC2626', '#8B5CF6', '#EC4899'].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setThemeConfig((prev) => ({ ...prev, primary_color: col }))}
                        className={`w-8 h-8 rounded-full border-2 transition transform active:scale-95 ${
                          themeConfig.primary_color === col ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                    <input
                      type="color"
                      value={themeConfig.primary_color}
                      onChange={(e) => setThemeConfig((prev) => ({ ...prev, primary_color: e.target.value }))}
                      className="w-8 h-8 rounded-full bg-transparent cursor-pointer"
                      title="Özel Renk Seç"
                    />
                  </div>
                </div>

                {/* Card Style Layout */}
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Layout className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ürün Kartı Düzeni:</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'glass_card', label: 'Cam Efektli Kart (Lüks)' },
                      { id: 'rounded_card', label: 'Büyük Fotoğraflı Kart' },
                      { id: 'modern_grid', label: 'Modern 2’li Grid' },
                      { id: 'compact_row', label: 'Kompakt Sıralı Liste' },
                      { id: 'minimal_list', label: 'Minimal Sade Liste' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setThemeConfig((prev) => ({ ...prev, card_style: c.id as CardStyleType }))}
                        className={`p-2.5 rounded-xl text-left border text-[11px] font-bold transition ${
                          themeConfig.card_style === c.id
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-[#111622] border-white/[0.04] text-slate-400 hover:text-white'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Mobile Screen Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-[#080B10] rounded-2xl border border-[#1F293D]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Eye className="w-3 h-3 text-slate-300" />
              <span>Canlı Müşteri QR Menü Önizlemesi</span>
            </div>

            {/* Mobile Phone Mockup */}
            <div
              className="w-full max-w-[280px] rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex flex-col transition duration-300"
              style={{
                backgroundColor: themeConfig.background_color,
                color: themeConfig.text_primary,
                fontFamily: currentFontMeta.cssFont,
              }}
            >
              {/* Phone Header Banner */}
              <div className="h-28 w-full bg-slate-900 relative overflow-hidden">
                <img
                  src={business.banner_url || business.cover_image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'}
                  alt=""
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-2">
                  {business.logo_url && (
                    <img src={business.logo_url} className="w-8 h-8 rounded-xl object-contain bg-black/60 p-0.5" alt="" />
                  )}
                  <div>
                    <h5 className="font-extrabold text-xs text-white truncate">{business.name}</h5>
                    <p className="text-[9px] text-slate-300">Temassız Dijital Menü</p>
                  </div>
                </div>
              </div>

              {/* Sample Product Cards inside phone */}
              <div className="p-3 space-y-2.5">
                {/* Product 1 */}
                <div
                  className="p-2.5 rounded-xl border transition flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: themeConfig.surface_color,
                    borderColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-xs" style={{ color: themeConfig.text_primary }}>
                      Özel Şef Spesiyali
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">
                      Taze mevsim garnitürleri ile
                    </div>
                    <div className="font-black text-xs pt-1" style={{ color: themeConfig.primary_color }}>
                      240 ₺
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs text-black shadow-xs shrink-0"
                    style={{ backgroundColor: themeConfig.primary_color }}
                  >
                    +
                  </button>
                </div>

                {/* Product 2 */}
                <div
                  className="p-2.5 rounded-xl border transition flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: themeConfig.surface_color,
                    borderColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-xs" style={{ color: themeConfig.text_primary }}>
                      San Sebastian Tatlısı
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">
                      Hakiki çikolata sosu ile
                    </div>
                    <div className="font-black text-xs pt-1" style={{ color: themeConfig.primary_color }}>
                      165 ₺
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs text-black shadow-xs shrink-0"
                    style={{ backgroundColor: themeConfig.primary_color }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-4 sm:p-5 border-t border-[#1F293D] bg-[#111622] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Seçilen tema tüm masalarda müşterilerin telefonuna <strong>anında</strong> uygulanır.
          </div>

          <button
            onClick={handleSaveTheme}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-900 font-extrabold text-xs transition flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
          >
            <Check className="w-4 h-4 text-slate-900" />
            <span>{isSaving ? 'Kaydediliyor...' : 'Temayı Kaydet'}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
