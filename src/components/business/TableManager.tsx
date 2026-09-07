import React, { useState, useEffect } from 'react';
import { 
  Plus, Printer, QrCode, Trash2, RefreshCw, 
  ExternalLink, Layers, Copy, Check, Sparkles, Palette
} from 'lucide-react';
import { Business, Table } from '../../types';
import { supabase } from '../../lib/supabase';
import { printSingleQrCard, printBatchQrCards } from '../../lib/thermalPrinter';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';

interface TableManagerProps {
  business: Business;
  onOpenQrStudio?: () => void;
}

export const TableManager: React.FC<TableManagerProps> = ({ business, onOpenQrStudio }) => {
  const toast = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTableNo, setNewTableNo] = useState('');
  const [batchCount, setBatchCount] = useState<number | ''>(5);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  // In-app Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    action: () => {},
  });

  const loadTables = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('tables')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: true });

      if (data) setTables(data as Table[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, [business.id]);

  const handleAddSingleTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNo.trim()) return;

    if (business.table_limit && tables.length >= business.table_limit) {
      toast.error(`Masa sınırına ulaştınız! Mevcut paket limitiniz: ${business.table_limit} masa.`);
      return;
    }

    const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const { data, error } = await supabase
      .from('tables')
      .insert([
        {
          business_id: business.id,
          table_no: newTableNo.trim(),
          qr_token: token,
          is_occupied: false,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setTables((prev) => [...prev, data as Table]);
      setNewTableNo('');
      toast.success(`${newTableNo} oluşturuldu.`);
    } else {
      toast.error('Masa eklenirken bir hata oluştu.');
    }
  };

  const handleAddBatchTables = async () => {
    if (!batchCount || batchCount <= 0) return;

    const currentLen = tables.length;
    const targetCount = Number(batchCount);

    if (business.table_limit && currentLen + targetCount > business.table_limit) {
      toast.error(`Masa kotanızı aşıyor! Kalan ekleme hakkınız: ${business.table_limit - currentLen} masa.`);
      return;
    }

    const newRows = [];
    for (let i = 1; i <= targetCount; i++) {
      const num = currentLen + i;
      newRows.push({
        business_id: business.id,
        table_no: `Masa ${num}`,
        qr_token: `tok_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        is_occupied: false,
      });
    }

    const { data, error } = await supabase
      .from('tables')
      .insert(newRows)
      .select();

    if (!error && data) {
      setTables((prev) => [...prev, ...(data as Table[])]);
      toast.success(`${targetCount} adet yeni masa açıldı.`);
    } else {
      toast.error('Toplu masa eklenirken hata oluştu.');
    }
  };

  const handleDeleteTable = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: `${name} Silinsin mi?`,
      message: 'Bu masayı sildiğinizde masaya ait QR kod geçersiz olacaktır.',
      type: 'danger',
      action: async () => {
        const { error } = await supabase
          .from('tables')
          .delete()
          .eq('id', id)
          .eq('business_id', business.id);
        if (!error) {
          setTables((prev) => prev.filter((t) => t.id !== id));
          toast.success(`${name} silindi.`);
        }
      },
    });
  };

  const getTableUrl = (t: Table) => {
    const origin = window.location.origin;
    return `${origin}/m/${business.slug}?table=${encodeURIComponent(t.table_no)}&token=${t.qr_token}`;
  };

  const handleCopyLink = (t: Table) => {
    const url = getTableUrl(t);
    navigator.clipboard.writeText(url);
    setCopiedToken(t.id);
    toast.success(`${t.table_no} bağlantısı panoya kopyalandı!`);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-5 font-medium text-slate-200">
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={() => {
          confirmConfig.action();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Top Action Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-[#111622] p-4 rounded-3xl shadow-lg">
        {/* Single Table Add */}
        <form onSubmit={handleAddSingleTable} className="flex gap-2">
          <input
            type="text"
            required
            value={newTableNo}
            onChange={(e) => setNewTableNo(e.target.value)}
            placeholder="Örn: Masa 12, Bahçe 4"
            className="flex-1 bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            onMouseMove={handleSpotlightMove}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs rounded-xl shadow-md transition shrink-0 active:scale-95 border border-white/25 spotlight-card spotlight-glow"
          >
            + Masa Ekle
          </button>
        </form>

        {/* Batch Add & Print All */}
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            max="50"
            value={batchCount}
            onChange={(e) => setBatchCount(e.target.value ? Number(e.target.value) : '')}
            placeholder="Adet"
            className="w-20 bg-[#0C1017] rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-bold"
          />
          <button
            onClick={handleAddBatchTables}
            onMouseMove={handleSpotlightMove}
            className="flex-1 py-2.5 bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold text-xs rounded-xl transition border border-white/[0.06] hover:border-white/[0.12] spotlight-card spotlight-glow"
          >
            + Toplu Aç
          </button>
          <button
            onClick={() => printBatchQrCards(business, tables)}
            disabled={tables.length === 0}
            onMouseMove={handleSpotlightMove}
            className="px-3 py-2.5 bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-40 border border-white/[0.06] spotlight-card spotlight-glow"
            title="Tüm Masaları Yazdır"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Yazdır</span>
          </button>
          {onOpenQrStudio && (
            <button
              onClick={onOpenQrStudio}
              onMouseMove={handleSpotlightMove}
              className="px-3.5 py-2.5 bg-[#1C2433] hover:bg-[#253043] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-white/10 hover:border-white/20 shadow-md spotlight-card spotlight-glow active:scale-95"
              title="Masa QR Kodlarını Özelleştir & Önizle"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-200" />
              <span>QR Tasarımı & Baskı</span>
            </button>
          )}
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="bg-[#111622] rounded-3xl p-12 text-center text-slate-400 text-xs font-bold shadow-md">
          Masalar yükleniyor...
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-[#111622] rounded-3xl p-14 text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-[#1C2433] flex items-center justify-center mx-auto mb-2 text-slate-400">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="font-black text-sm text-slate-200">Henüz Masa Bulunmuyor</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Yukarıdaki panelden tekil veya toplu masa oluşturabilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {tables.map((t) => {
            const tableUrl = getTableUrl(t);
            const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
              tableUrl
            )}&margin=1`;

            return (
              <div
                key={t.id}
                onMouseMove={handleSpotlightMove}
                className="bg-[#111622] rounded-3xl p-4 shadow-lg transition flex flex-col justify-between space-y-3 spotlight-card spotlight-glow"
              >
                <div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-black text-xs text-slate-100 bg-[#1C2433] px-2.5 py-1 rounded-xl">
                      {t.table_no}
                    </span>
                    <button
                      onClick={() => handleDeleteTable(t.id, t.table_no)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10"
                      title="Masayı Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* QR Image with clean white backing */}
                  <div className="py-2 flex justify-center">
                    <div className="p-2 bg-white rounded-2xl shadow-sm">
                      <img src={qrImgUrl} alt={t.table_no} className="w-24 h-24 object-contain" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-1.5 pt-1">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => printSingleQrCard(business, t)}
                      className="py-1.5 px-2 bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold text-[10px] rounded-xl transition flex items-center justify-center gap-1 border border-white/[0.06]"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Fiş</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(t)}
                      className="py-1.5 px-2 bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold text-[10px] rounded-xl transition flex items-center justify-center gap-1 border border-white/[0.06]"
                    >
                      {copiedToken === t.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedToken === t.id ? 'Alındı' : 'Link'}</span>
                    </button>
                  </div>

                  <a
                    href={tableUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-1.5 bg-[#182030] hover:bg-[#222C3D] text-slate-100 font-extrabold text-[10px] rounded-xl transition flex items-center justify-center gap-1 border border-white/[0.08]"
                  >
                    <span>Masa Menüsü</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
