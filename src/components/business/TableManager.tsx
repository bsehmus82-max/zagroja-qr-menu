import React, { useState, useEffect } from 'react';
import { 
  Plus, Printer, QrCode, Trash2, RefreshCw, 
  ExternalLink, Layers, AlertCircle, Copy, Check
} from 'lucide-react';
import { Business, Table } from '../../types';
import { supabase } from '../../lib/supabase';
import { printSingleQrCard, printBatchQrCards } from '../../lib/thermalPrinter';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';

interface TableManagerProps {
  business: Business;
}

export const TableManager: React.FC<TableManagerProps> = ({ business }) => {
  const toast = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTableNo, setNewTableNo] = useState('');
  const [batchCount, setBatchCount] = useState<number | ''>(5);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

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
      toast.success(`${newTableNo} başarıyla oluşturuldu.`);
    } else {
      toast.error('Masa eklenirken bir hata oluştu.');
    }
  };

  const handleAddBatchTables = async () => {
    if (!batchCount || batchCount <= 0) return;

    const currentLen = tables.length;
    const targetCount = Number(batchCount);

    if (business.table_limit && currentLen + targetCount > business.table_limit) {
      toast.error(`Bu işlem masa kotanızı aşıyor! Kalan ekleme hakkınız: ${business.table_limit - currentLen} masa.`);
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
      toast.success(`${targetCount} adet yeni masa başarıyla açıldı.`);
    } else {
      toast.error('Toplu masa eklenirken hata oluştu.');
    }
  };

  const handleDeleteTable = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: `${name} Silinsin mi?`,
      message: 'Bu masayı sildiğinizde masaya ait mevcut QR kod geçersiz kılınacaktır.',
      type: 'danger',
      action: async () => {
        const { error } = await supabase.from('tables').delete().eq('id', id);
        if (!error) {
          setTables((prev) => prev.filter((t) => t.id !== id));
          toast.success(`${name} başarıyla silindi.`);
        } else {
          toast.error('Masa silinemedi.');
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

  const quotaRatio = business.table_limit ? (tables.length / business.table_limit) * 100 : 0;

  return (
    <div className="space-y-6">
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

      {/* Quota Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            Masa & QR Kod Yönetimi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Masalarınızı yönetin, tek tıkla QR fişi yazdırın veya dijital bağlantılarını paylaşın.
          </p>
        </div>

        {business.table_limit && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:w-64">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-600">Masa Kotası:</span>
              <span className="font-extrabold text-slate-900">
                {tables.length} / {business.table_limit}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  quotaRatio > 90 ? 'bg-rose-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(quotaRatio, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Forms Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Single Table Add */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-orange-500" />
            Tekil Masa Ekle
          </h3>

          <form onSubmit={handleAddSingleTable} className="flex gap-2">
            <input
              type="text"
              required
              value={newTableNo}
              onChange={(e) => setNewTableNo(e.target.value)}
              placeholder="Örn: Masa 12, Bahçe 4, VIP"
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition shrink-0"
            >
              Ekle
            </button>
          </form>
        </div>

        {/* Batch Table Add & Print All */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-orange-500" />
            Toplu Masa Aç & Tümünü Yazdır
          </h3>

          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="50"
              value={batchCount}
              onChange={(e) => setBatchCount(e.target.value ? Number(e.target.value) : '')}
              placeholder="Adet"
              className="w-24 bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
            />
            <button
              onClick={handleAddBatchTables}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
            >
              + Toplu Masa Ekle
            </button>
            <button
              onClick={() => printBatchQrCards(business, tables)}
              disabled={tables.length === 0}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-40"
              title="Tüm Masaların QR Kodlarını Yazdır"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Tümünü Yazdır</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Cards Grid */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-xs">
          Masalar yükleniyor...
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-800">Henüz Masa Oluşturulmadı</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Yukarıdaki panelden tekil veya toplu masa oluşturarak anında müşterilerinize özel QR menü kodları üretebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((t) => {
            const tableUrl = getTableUrl(t);
            const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
              tableUrl
            )}&margin=1`;

            return (
              <div
                key={t.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-extrabold text-sm text-slate-900">{t.table_no}</span>
                    <button
                      onClick={() => handleDeleteTable(t.id, t.table_no)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition rounded-lg"
                      title="Masayı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* QR Image Preview */}
                  <div className="py-3 flex justify-center">
                    <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-inner">
                      <img src={qrImgUrl} alt={t.table_no} className="w-28 h-28 object-contain" />
                    </div>
                  </div>
                </div>

                {/* Table Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => printSingleQrCard(business, t)}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Fiş Yazdır</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(t)}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                    >
                      {copiedToken === t.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToken === t.id ? 'Kopyalandı' : 'Linki Al'}</span>
                    </button>
                  </div>

                  <a
                    href={tableUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <span>Masayı Canlı Aç</span>
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
