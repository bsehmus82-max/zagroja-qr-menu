import React, { useState, useEffect } from 'react';
import { 
  Plus, Printer, QrCode, Trash2, RefreshCw, 
  ExternalLink, Layers, AlertCircle, Copy, Check
} from 'lucide-react';
import { Business, Table } from '../../types';
import { supabase } from '../../lib/supabase';
import { printSingleQrCard, printBatchQrCards } from '../../lib/thermalPrinter';

interface TableManagerProps {
  business: Business;
}

export const TableManager: React.FC<TableManagerProps> = ({ business }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTableNo, setNewTableNo] = useState('');
  const [batchCount, setBatchCount] = useState<number | ''>(5);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

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
      alert(`Maksimum masa limitinize (${business.table_limit}) ulaştınız.`);
      return;
    }

    const qrToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload = {
      business_id: business.id,
      table_no: newTableNo.trim(),
      qr_token: qrToken,
      is_occupied: false,
    };

    const { data, error } = await supabase.from('tables').insert([payload]).select().single();
    if (!error && data) {
      setTables((prev) => [...prev, data as Table]);
      setNewTableNo('');
    }
  };

  const handleBatchAddTables = async () => {
    if (!batchCount || Number(batchCount) <= 0) return;
    const count = Number(batchCount);

    if (business.table_limit && tables.length + count > business.table_limit) {
      alert(`Maksimum masa limitinizi aşamazsınız. (Mevcut limit: ${business.table_limit})`);
      return;
    }

    const currentMax = tables.reduce((max, t) => {
      const num = parseInt(t.table_no.replace(/\D/g, ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);

    const rows = [];
    for (let i = 1; i <= count; i++) {
      const tNum = currentMax + i;
      rows.push({
        business_id: business.id,
        table_no: `Masa ${tNum}`,
        qr_token: `tok_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        is_occupied: false,
      });
    }

    const { data, error } = await supabase.from('tables').insert(rows).select();
    if (!error && data) {
      setTables((prev) => [...prev, ...(data as Table[])]);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!window.confirm('Bu masayı ve QR kodunu silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('tables').delete().eq('id', tableId);
    if (!error) {
      setTables((prev) => prev.filter((t) => t.id !== tableId));
    }
  };

  const copyTableLink = (table: Table) => {
    const link = `${window.location.origin}/m/${business.slug}?table=${encodeURIComponent(table.table_no)}&token=${table.qr_token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(table.id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111622] border border-[#1E2638] p-4 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Masa & QR Kod Yönetimi</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {tables.length} / {business.table_limit || 'Sınırsız'} Masa
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Her masaya özel üretilen QR kodlar ile müşteriler doğrudan masalarından sipariş verebilir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tables.length > 0 && (
            <button
              onClick={() => printBatchQrCards(business, tables)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Tüm QR Kodları Yazdır
            </button>
          )}
        </div>
      </div>

      {/* Creation Tools: Single Table & Batch Generator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Single Table Add */}
        <form
          onSubmit={handleAddSingleTable}
          className="bg-[#111622] border border-[#1E2638] p-4 rounded-2xl flex items-center gap-2.5"
        >
          <input
            type="text"
            required
            value={newTableNo}
            onChange={(e) => setNewTableNo(e.target.value)}
            placeholder="Masa Adı (Örn: Teras 4, Bahçe 2)"
            className="flex-1 bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#182030] hover:bg-[#222E45] text-slate-200 text-xs font-semibold rounded-xl border border-[#25324A] transition flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            Ekle
          </button>
        </form>

        {/* Batch Table Generator */}
        <div className="bg-[#111622] border border-[#1E2638] p-4 rounded-2xl flex items-center gap-2.5">
          <input
            type="number"
            min={1}
            max={50}
            value={batchCount}
            onChange={(e) => setBatchCount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Adet"
            className="w-24 bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none text-center"
          />
          <button
            onClick={handleBatchAddTables}
            className="flex-1 py-2 bg-[#182030] hover:bg-[#222E45] text-slate-200 text-xs font-semibold rounded-xl border border-[#25324A] transition flex items-center justify-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            Toplu Otomatik Masa Üret
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
          <span>Yükleniyor...</span>
        </div>
      ) : tables.length === 0 ? (
        <div className="py-20 text-center bg-[#111622]/40 border border-dashed border-[#1E2638] rounded-2xl p-8 space-y-2">
          <QrCode className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="font-semibold text-slate-200 text-sm">Tanımlı Masa Bulunmuyor</h3>
          <p className="text-xs text-slate-400">
            Yukarıdaki form ile ilk masanızı ekleyebilir veya toplu masa oluşturabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tables.map((table) => {
            const tableLiveUrl = `${window.location.origin}/m/${business.slug}?table=${encodeURIComponent(table.table_no)}&token=${table.qr_token}`;
            const qrPreviewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(tableLiveUrl)}`;

            return (
              <div
                key={table.id}
                className="bg-[#111622] border border-[#1E2638] hover:border-[#2A3754] rounded-2xl p-3.5 flex flex-col items-center text-center justify-between transition shadow-sm"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="font-bold text-xs text-white truncate">{table.table_no}</span>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                      title="Sil"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="w-24 h-24 bg-white p-1.5 rounded-xl shadow-inner mx-auto mb-2 flex items-center justify-center">
                    <img src={qrPreviewUrl} alt={table.table_no} className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="w-full pt-2 border-t border-[#1E2638] flex items-center gap-1 justify-center">
                  <button
                    onClick={() => printSingleQrCard(business, table)}
                    className="p-1.5 rounded-lg bg-[#182030] hover:bg-[#222E45] text-slate-300 hover:text-white transition"
                    title="QR Kartı Yazdır"
                  >
                    <Printer className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => copyTableLink(table)}
                    className="p-1.5 rounded-lg bg-[#182030] hover:bg-[#222E45] text-slate-300 hover:text-white transition"
                    title="Menü Bağlantısını Kopyala"
                  >
                    {copiedToken === table.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>

                  <a
                    href={tableLiveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-[#182030] hover:bg-[#222E45] text-slate-300 hover:text-white transition"
                    title="Menüyü Aç"
                  >
                    <ExternalLink className="w-3 h-3" />
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
