import React, { useState, useEffect } from 'react';
import { 
  Plus, Printer, QrCode, Trash2, Edit2, Download, 
  Layers, ExternalLink, Sparkles, AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Business, Table } from '../../types';
import { supabase } from '../../lib/supabase';
import { printBatchQrCards, printSingleQrCard } from '../../lib/thermalPrinter';

interface TableManagerProps {
  business: Business;
}

export const TableManager: React.FC<TableManagerProps> = ({ business }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableNameInput, setTableNameInput] = useState('');
  const [batchCountInput, setBatchCountInput] = useState<number>(5);

  const loadTables = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('tables')
        .select('*')
        .eq('business_id', business.id)
        .order('table_no', { ascending: true });

      if (data) {
        setTables(data as Table[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, [business.id]);

  const canAddMore = !business.table_limit || tables.length < business.table_limit;

  const handleAddSingleTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNameInput.trim() || !canAddMore) return;

    const token = `tbl_${business.slug}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;
    const newTable = {
      business_id: business.id,
      table_no: tableNameInput.trim(),
      qr_token: token,
      is_occupied: false,
    };

    const { data, error } = await supabase
      .from('tables')
      .insert([newTable])
      .select()
      .single();

    if (!error && data) {
      setTables((prev) => [...prev, data as Table]);
      setTableNameInput('');
    }
  };

  const handleBatchCreateTables = async () => {
    if (!canAddMore) return;
    const currentMax = tables.length;
    const toCreate = Math.min(
      Number(batchCountInput),
      business.table_limit ? business.table_limit - currentMax : 100
    );

    const rows = [];
    for (let i = 1; i <= toCreate; i++) {
      const num = currentMax + i;
      const token = `tbl_${business.slug}_${num}_${Date.now().toString(36)}`;
      rows.push({
        business_id: business.id,
        table_no: `Masa ${num}`,
        qr_token: token,
        is_occupied: false,
      });
    }

    const { data, error } = await supabase.from('tables').insert(rows).select();
    if (!error && data) {
      setTables((prev) => [...prev, ...(data as Table[])]);
    }
  };

  const handleDeleteTable = async (table: Table) => {
    if (!window.confirm(`"${table.table_no}" masasını silmek istediğinize emin misiniz?`)) return;

    const { error } = await supabase.from('tables').delete().eq('id', table.id);
    if (!error) {
      setTables((prev) => prev.filter((t) => t.id !== table.id));
    }
  };

  const getMenuUrlForTable = (table: Table) => {
    const origin = window.location.origin;
    return `${origin}/m/${business.slug}?table=${encodeURIComponent(table.table_no)}&token=${table.qr_token}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Masa & QR Kod Yönetimi</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
              {tables.length} / {business.table_limit ? `${business.table_limit} Masa` : 'Sınırsız'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Her masaya özel sanat eseri estetiğinde, yuvarlatılmış ve termal baskıya tam uyumlu QR kodlar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={tables.length === 0}
            onClick={() => printBatchQrCards(business, tables)}
            className="px-4 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition border border-neutral-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-purple-400" />
            Toplu QR Kartı Yazdır
          </button>
        </div>
      </div>

      {/* Creation Tools */}
      {canAddMore ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tool 1: Single Custom Named Table */}
          <form
            onSubmit={handleAddSingleTable}
            className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl flex items-center gap-3"
          >
            <input
              type="text"
              required
              value={tableNameInput}
              onChange={(e) => setTableNameInput(e.target.value)}
              placeholder="Örn: Bahçe 1, Teras 4, Loca A"
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-brand-600/30 flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Masa Ekle
            </button>
          </form>

          {/* Tool 2: Sequential Batch Table Creator */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-300">Sıralı Masa Aç:</span>
              <input
                type="number"
                min={1}
                max={50}
                value={batchCountInput}
                onChange={(e) => setBatchCountInput(Number(e.target.value))}
                className="w-16 bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1.5 text-xs text-white text-center"
              />
              <span className="text-xs text-neutral-400">Adet</span>
            </div>

            <button
              type="button"
              onClick={handleBatchCreateTables}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              Otomatik Oluştur
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center gap-3 text-xs text-amber-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>
            Masa sınırınıza ulaştınız ({business.table_limit} Masa). Masa limitinizi artırmak için Super Admin ile Canlı Destek üzerinden iletişime geçebilirsiniz.
          </span>
        </div>
      )}

      {/* Tables Grid */}
      {loading ? (
        <div className="py-20 text-center text-neutral-500 text-xs">Masalar yükleniyor...</div>
      ) : tables.length === 0 ? (
        <div className="py-20 text-center bg-neutral-900/40 border border-dashed border-neutral-800 rounded-3xl p-8 space-y-2">
          <QrCode className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
          <h3 className="font-bold text-white text-base">Henüz Masa Oluşturulmadı</h3>
          <p className="text-xs text-neutral-400">
            Yukarıdaki panelden tek tek veya otomatik sıralı olarak masalarınızı hemen açabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => {
            const tableUrl = getMenuUrlForTable(table);

            return (
              <div
                key={table.id}
                className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col items-center justify-between text-center relative hover:border-neutral-700 transition group"
              >
                {/* QR Artwork Display */}
                <div className="w-full bg-white p-4 rounded-2xl shadow-inner mb-4 flex flex-col items-center justify-center">
                  <div className="font-black text-xs text-neutral-900 tracking-wider uppercase mb-2">
                    {business.name}
                  </div>
                  <QRCodeSVG
                    value={tableUrl}
                    size={130}
                    level="H"
                    includeMargin={false}
                    fgColor="#111827"
                    bgColor="#FFFFFF"
                  />
                  <div className="font-extrabold text-sm text-neutral-950 mt-2">
                    {table.table_no}
                  </div>
                </div>

                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{table.table_no}</span>
                    <a
                      href={tableUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-400 hover:text-brand-300 flex items-center gap-1 text-[11px]"
                    >
                      <span>Önizle</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800">
                    <button
                      onClick={() => printSingleQrCard(business, table)}
                      className="py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Printer className="w-3.5 h-3.5 text-purple-400" />
                      Yazdır
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table)}
                      className="py-2 rounded-xl bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
