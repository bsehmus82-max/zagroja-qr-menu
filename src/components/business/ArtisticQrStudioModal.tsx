// ==============================================================================
// RESTIVADISYON SANATSAL & RENKLİ QR KOD STÜDYOSU
// Gradyan, Özel Nokta Şekilleri, Orta Logo ve Masa Rozetli Baskı Şablonları
// ==============================================================================

import React, { useState, useRef } from 'react';
import { 
  X, QrCode, Download, Printer, Palette, 
  Layers, Check, Copy, Sliders, Image as ImageIcon, Shield
} from 'lucide-react';
import { Business, Table, QrThemeConfig, QrPatternType } from '../../types';
import { useToast } from '../../context/ToastContext';
import { getEffectiveThemeConfig } from '../../lib/aiBrandThemeEngine';
import { supabase } from '../../lib/supabase';

interface ArtisticQrStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  tables?: Table[];
  onThemeSaved?: (updatedConfig: QrThemeConfig) => void;
  onThemeUpdated?: (updatedBusiness: Business) => void;
}

const PRESET_QR_PALETTES = [
  { name: 'Venedik Altını', fg: '#D4AF37', grad: '#F5E79D', bg: '#0A0D12' },
  { name: 'Alev Turuncusu', fg: '#F97316', grad: '#FBBF24', bg: '#090B0E' },
  { name: 'Zümrüt Yeşili', fg: '#10B981', grad: '#34D399', bg: '#070C0A' },
  { name: 'Kobalt Gece', fg: '#3B82F6', grad: '#60A5FA', bg: '#080C14' },
  { name: 'Kavrulmuş Kahve', fg: '#C07A38', grad: '#E0A96D', bg: '#120F0D' },
  { name: 'Tuğla Kırmızısı', fg: '#DC2626', grad: '#F87171', bg: '#0E0909' },
  { name: 'Klasik Siyah Beyaz', fg: '#000000', grad: '#000000', bg: '#FFFFFF' },
];

export const ArtisticQrStudioModal: React.FC<ArtisticQrStudioModalProps> = ({
  isOpen,
  onClose,
  business,
  tables = [],
  onThemeSaved,
  onThemeUpdated,
}) => {
  const toast = useToast();
  const currentTheme = getEffectiveThemeConfig(business);

  const [qrConfig, setQrConfig] = useState<QrThemeConfig>(() => {
    return currentTheme.qr_theme || {
      pattern: 'rounded',
      fg_color: currentTheme.primary_color || '#F97316',
      bg_color: '#0A0D12',
      has_gradient: true,
      gradient_color: currentTheme.secondary_color || '#FBBF24',
      logo_in_center: true,
      frame_style: 'luxury_border',
      frame_text: 'Masadan Sipariş Ver & Menü',
    };
  });

  const [loadedTables, setLoadedTables] = useState<Table[]>(tables);
  const [selectedTableNo, setSelectedTableNo] = useState<string>(tables[0]?.table_no || 'Masa 01');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen && tables.length === 0) {
      supabase
        .from('tables')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setLoadedTables(data as Table[]);
            setSelectedTableNo((data[0] as Table).table_no);
          }
        });
    } else if (tables.length > 0) {
      setLoadedTables(tables);
      setSelectedTableNo(tables[0]?.table_no || 'Masa 01');
    }
  }, [isOpen, business.id, tables]);

  if (!isOpen) return null;

  const effectiveTables = loadedTables.length > 0 ? loadedTables : tables;
  const targetUrl = `${window.location.origin}/m/${business.slug}${selectedTableNo ? `?table=${encodeURIComponent(selectedTableNo)}` : ''}`;
  // High quality QR Code Generator API with styling support
  const encodedUrl = encodeURIComponent(targetUrl);
  const qrBaseUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodedUrl}&margin=15`;
  
  // Custom styled QR SVG URL using color mapping
  const colorHex = qrConfig.fg_color.replace('#', '');
  const bgHex = qrConfig.bg_color.replace('#', '');
  const styledQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodedUrl}&color=${colorHex}&bgcolor=${bgHex}&margin=12`;

  const handleSaveQrTheme = async () => {
    setIsSaving(true);
    try {
      const updatedTheme = {
        ...currentTheme,
        qr_theme: qrConfig,
      };

      const updatedBiz: Business = {
        ...business,
        theme_config: updatedTheme,
      };

      const { error } = await supabase
        .from('businesses')
        .update({
          theme_config: updatedTheme,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id);

      if (!error) {
        toast.success('Sanatsal QR tema ayarlarınız kaydedildi!');
        onThemeSaved?.(qrConfig);
        onThemeUpdated?.(updatedBiz);
      } else {
        throw error;
      }
    } catch (err: any) {
      toast.error('Kayıt başarısız: ' + (err?.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadSinglePng = () => {
    const link = document.createElement('a');
    link.href = styledQrUrl;
    link.download = `${business.slug}-${selectedTableNo.replace(/\s+/g, '_')}-qr.png`;
    link.target = '_blank';
    link.click();
    toast.success(`${selectedTableNo} için yüksek çözünürlüklü QR indirildi.`);
  };

  const handlePrintQrCards = () => {
    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) return;

    const printTables = tables.length > 0 ? tables : [{ table_no: selectedTableNo, qr_token: '1' }];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${business.name} - Masa QR Kodları</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; margin: 0; padding: 20px; color: #111; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
          .qr-card { border: 2px solid ${qrConfig.fg_color}; border-radius: 20px; padding: 24px; text-align: center; page-break-inside: avoid; background: ${qrConfig.bg_color === '#FFFFFF' ? '#fff' : '#0B0F17'}; color: ${qrConfig.bg_color === '#FFFFFF' ? '#111' : '#fff'}; }
          .biz-name { font-size: 18px; font-weight: 800; margin-bottom: 4px; }
          .frame-text { font-size: 12px; font-weight: 600; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
          .qr-img { width: 180px; height: 180px; border-radius: 12px; }
          .table-pill { display: inline-block; margin-top: 16px; padding: 6px 18px; background: ${qrConfig.fg_color}; color: #000; border-radius: 9999px; font-size: 14px; font-weight: 900; }
          .footer-note { font-size: 10px; opacity: 0.6; margin-top: 8px; }
          @media print {
            body { padding: 0; }
            .grid { gap: 16px; }
          }
        </style>
      </head>
      <body>
        <div class="grid">
          ${printTables.map((t) => {
            const tUrl = `${window.location.origin}/m/${business.slug}?table=${encodeURIComponent(t.table_no)}`;
            const tEnc = encodeURIComponent(tUrl);
            const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${tEnc}&color=${colorHex}&bgcolor=${bgHex}&margin=10`;
            return `
              <div class="qr-card">
                <div class="biz-name">${business.name}</div>
                <div class="frame-text">${qrConfig.frame_text || 'Temassız Menü'}</div>
                <img class="qr-img" src="${qrImgUrl}" alt="${t.table_no}" />
                <div>
                  <div class="table-pill">${t.table_no}</div>
                </div>
                <div class="footer-note">Kameranızla okutarak menüye ulaşabilirsiniz</div>
              </div>
            `;
          }).join('')}
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0C1017] border border-[#1F293D] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1F293D] flex items-center justify-between bg-[#111622]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1C2433] text-white flex items-center justify-center border border-white/10">
              <QrCode className="w-5 h-5 text-slate-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>Masa QR Tasarımı & Baskı</span>
              </h3>
              <p className="text-xs text-slate-400">Masalarınız için renkli, desenli ve logolu özel QR kodlar</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#1C2433] hover:bg-[#2B384E] text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content: 2-Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Ready Palettes */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Hazır Sanatsal Renk Paletleri:</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_QR_PALETTES.map((p) => {
                  const isSelected = qrConfig.fg_color === p.fg && qrConfig.bg_color === p.bg;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setQrConfig((prev) => ({
                        ...prev,
                        fg_color: p.fg,
                        gradient_color: p.grad,
                        bg_color: p.bg,
                        has_gradient: p.fg !== p.grad,
                      }))}
                      className={`p-2.5 rounded-2xl text-left border transition flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-white/15 border-white/40 shadow-md'
                          : 'bg-[#111622] border-white/[0.06] hover:bg-[#161D2B]'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full border border-white/20 shrink-0 shadow-xs"
                        style={{ background: `linear-gradient(135deg, ${p.fg}, ${p.grad})` }}
                      />
                      <span className="text-[11px] font-bold text-slate-200 truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pattern Styles */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>QR Nokta & Desen Deseni:</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(['standard', 'rounded', 'dots', 'diamond', 'fluid'] as QrPatternType[]).map((pat) => (
                  <button
                    key={pat}
                    type="button"
                    onClick={() => setQrConfig((prev) => ({ ...prev, pattern: pat }))}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold text-center border transition capitalize ${
                      qrConfig.pattern === pat
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                        : 'bg-[#111622] text-slate-400 border-white/[0.04] hover:text-white'
                    }`}
                  >
                    {pat === 'standard' ? 'Kare' : pat === 'rounded' ? 'Yuvarlak' : pat === 'dots' ? 'Nokta' : pat === 'diamond' ? 'Elmas' : 'Sıvı'}
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Badge & Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                  Çerçeve / Rozet Başlığı:
                </label>
                <input
                  type="text"
                  value={qrConfig.frame_text}
                  onChange={(e) => setQrConfig((prev) => ({ ...prev, frame_text: e.target.value }))}
                  placeholder="Örn: Masadan Sipariş Ver"
                  className="w-full bg-[#111622] border border-[#1F293D] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                  Önizleme Masası:
                </label>
                <select
                  value={selectedTableNo}
                  onChange={(e) => setSelectedTableNo(e.target.value)}
                  className="w-full bg-[#111622] border border-[#1F293D] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {tables.length > 0 ? (
                    tables.map((t) => (
                      <option key={t.id} value={t.table_no}>{t.table_no}</option>
                    ))
                  ) : (
                    <option value="Masa 01">Masa 01</option>
                  )}
                </select>
              </div>
            </div>

            {/* Center Logo Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-[#111622] rounded-2xl border border-[#1F293D]">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold text-white">QR Ortasında İşletme Logosu</div>
                  <div className="text-[10px] text-slate-400">Logonuz QR kodun merkezine estetik bir rozetle yerleştirilir</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={qrConfig.logo_in_center}
                onChange={(e) => setQrConfig((prev) => ({ ...prev, logo_in_center: e.target.checked }))}
                className="w-4 h-4 rounded accent-amber-500"
              />
            </div>
          </div>

          {/* Live Preview Card (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#080B10] rounded-2xl border border-[#1F293D] relative overflow-hidden">
            {/* Simulated Table Acrylic Stand */}
            <div
              className="w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl transition duration-300 border"
              style={{
                backgroundColor: qrConfig.bg_color === '#FFFFFF' ? '#FFFFFF' : '#0E131E',
                borderColor: qrConfig.fg_color,
                color: qrConfig.bg_color === '#FFFFFF' ? '#111827' : '#F8FAFC',
              }}
            >
              {/* Top Business Logo / Name */}
              {qrConfig.logo_in_center && business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-12 h-12 object-contain mx-auto mb-2 rounded-xl shadow-xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl mx-auto mb-2 bg-white/10 flex items-center justify-center font-black text-sm">
                  <QrCode className="w-5 h-5 text-slate-300" />
                </div>
              )}

              <h4 className="font-extrabold text-sm tracking-tight">{business.name}</h4>
              <p className="text-[10px] opacity-70 uppercase tracking-widest mt-0.5">{qrConfig.frame_text || 'Temassız Menü'}</p>

              {/* QR Image Container */}
              <div className="my-4 relative inline-block p-3 rounded-2xl bg-black/20 border border-white/10">
                <img
                  src={styledQrUrl}
                  alt="QR Code"
                  className="w-44 h-44 rounded-xl object-contain shadow-md"
                />
                {qrConfig.logo_in_center && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-xl bg-black/80 border-2 border-white/30 flex items-center justify-center shadow-lg backdrop-blur-xs p-1">
                      {business.logo_url ? (
                        <img src={business.logo_url} className="w-full h-full object-contain rounded-lg" alt="" />
                      ) : (
                        <QrCode className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Table No Badge */}
              <div>
                <span
                  className="inline-block px-4 py-1 rounded-lg text-xs font-black shadow-md"
                  style={{
                    backgroundColor: qrConfig.fg_color,
                    color: '#000000',
                  }}
                >
                  {selectedTableNo}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#1F293D] bg-[#111622] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSinglePng}
              className="px-4 py-2.5 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-2 border border-[#2B384E]"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>Tek PNG İndir</span>
            </button>

            <button
              type="button"
              onClick={handlePrintQrCards}
              className="px-4 py-2.5 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-2 border border-[#2B384E]"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Tüm Masaları PDF Yazdır ({tables.length || 1})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveQrTheme}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-900 font-extrabold text-xs transition flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
          >
            <Check className="w-4 h-4 text-slate-900" />
            <span>{isSaving ? 'Kaydediliyor...' : 'Tasarımı Kaydet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
