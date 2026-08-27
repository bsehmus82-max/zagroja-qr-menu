import React, { useState, useEffect } from 'react';
import { 
  Plus, QrCode, Printer, Trash2, Edit2, Check, 
  Layers, Download, RefreshCw, AlertCircle, Copy
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Business, Table } from '../../types';
import { supabase } from '../../lib/supabase';

interface TableManagerProps {
  business: Business;
}

export const TableManager: React.FC<TableManagerProps> = ({ business }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingTable, setAddingTable] = useState(false);
  const [selectedTableForPrint, setSelectedTableForPrint] = useState<Table | null>(null);

  // Edit Table Name state
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editTableName, setEditTableName] = useState('');

  const loadTables = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setTables(data as Table[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, [business.id]);

  // Add Next Sequential Table ("Masa 1", "Masa 2", etc.)
  const handleAddTable = async () => {
    if (business.table_limit && tables.length >= business.table_limit) {
      alert(`Masa kapasite sýnýrýnýza (${business.table_limit} Masa) ulaþtýnýz. Limit artýrmak için lütfen platform yöneticisi ile iletiþime geçiniz.`);
      return;
    }

    setAddingTable(true);
    try {
      const nextNum = tables.length + 1;
      const defaultName = `Masa ${nextNum}`;
      const qrToken = `tbl_${business.slug}_${nextNum}_${Math.floor(100000 + Math.random() * 900000)}`;

      const { data, error } = await supabase
        .from('tables')
        .insert([
          {
            business_id: business.id,
            table_no: defaultName,
            qr_token: qrToken,
            is_occupied: false,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        setTables((prev) => [...prev, data as Table]);
      } else {
        alert('Masa eklenirken bir hata oluþtu.');
      }
    } finally {
      setAddingTable(false);
    }
  };

  // Update Table Name
  const handleUpdateTableName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !editTableName.trim()) return;

    const { error } = await supabase
      .from('tables')
      .update({ table_no: editTableName.trim() })
      .eq('id', editingTable.id);

    if (!error) {
      setTables((prev) =>
        prev.map((t) => (t.id === editingTable.id ? { ...t, table_no: editTableName.trim() } : t))
      );
      setEditingTable(null);
    }
  };

  // Delete Table
  const handleDeleteTable = async (table: Table) => {
    if (!window.confirm(`"${table.table_no}" masasýný silmek istediðinizden emin misiniz?`)) return;

    const { error } = await supabase.from('tables').delete().eq('id', table.id);
    if (!error) {
      setTables((prev) => prev.filter((t) => t.id !== table.id));
    }
  };

  // Print Single or Bulk QR Cards
  const handlePrintAllQRs = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const cardsHtml = tables
      .map((t) => {
        const qrUrl = `${window.location.origin}/m/${business.slug}?table=${encodeURIComponent(t.table_no)}&token=${t.qr_token}`;
        return `
        <div style="border: 2px solid #222; border-radius: 20px; padding: 24px; text-align: center; page-break-inside: avoid; margin: 16px; width: 220px; display: inline-block; box-sizing: border-box; font-family: sans-serif; background: #fff; color: #000;">
          <div style="font-size: 16px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">${business.name}</div>
          <div style="font-size: 11px; color: #666; margin-bottom: 12px;">Kamera ile QR Kodu Okutunuz</div>
          <div id="qr-${t.id}" style="margin: 0 auto 12px; display: flex; justify-content: center;"></div>
          <div style="font-size: 20px; font-weight: 900; background: #f3f4f6; padding: 6px 12px; border-radius: 10px;">${t.table_no}</div>
          ${business.wifi_ssid ? `<div style="font-size: 10px; color: #444; margin-top: 8px;">Wi-Fi: <strong>${business.wifi_ssid}</strong><br>Þifre: <strong>${business.wifi_password}</strong></div>` : ''}
        </div>
      `;
      })
      .join('');

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${business.name} - Masa QR Kodlarý</title>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
          <style>
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body style="padding: 20px; text-align: center;">
          <h2 style="font-family: sans-serif;">${business.name} - Masa QR Kod Kartlarý</h2>
          <div style="display: flex; flex-wrap: wrap; justify-content: center;">
            ${cardsHtml}
          </div>
          <script>
            window.onload = function() {
              ${tables
                .map(
                  (t) =>
                    `QRCode.toCanvas(document.createElement('canvas'), '${window.location.origin}/m/${business.slug}?table=${encodeURIComponent(t.table_no)}&token=${t.qr_token}', { width: 160, margin: 1 }, function(err, canvas) {
                      var container = document.getElementById('qr-${t.id}');
                      if (container && canvas) container.appendChild(canvas);
                    });`
                )
                .join('\n')}
              setTimeout(function() { window.print(); }, 800);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
  };

  const getQRLink = (table: Table) => {
    return `${window.location.origin}/m/${business.slug}?table=${encodeURIComponent(table.table_no)}&token=${table.qr_token}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-white tracking-tight">Masa & QR Kod Yönetimi</h2>
            <span className="text-xs px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 font-bold border border-brand-500/20">
              {tables.length} / {business.table_limit || 'Sýnýrsýz'} Masa
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Her masaya özel sanat eseri estetiðinde, yuvarlatýlmýþ ve termal baskýya tam uyumlu QR kodlar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {tables.length > 0 && (
            <button
              onClick={handlePrintAllQRs}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition border border-neutral-700"
            >
              <Printer className="w-4 h-4" />
              Tüm Masa QR'larýný Yazdýr
            </button>
          )}

          <button
            onClick={handleAddTable}
            disabled={addingTable || (business.table_limit > 0 && tables.length >= business.table_limit)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition transform active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {addingTable ? 'Ekleniyor...' : 'Yeni Masa Ekle'}
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="py-20 text-center text-neutral-500 flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
          <span className="text-xs">Masalar yükleniyor...</span>
        </div>
      ) : tables.length === 0 ? (
        <div className="py-20 text-center bg-neutral-900/40 border border-dashed border-neutral-800 rounded-3xl p-8">
          <QrCode className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h4 className="font-bold text-sm text-white">Henüz Masa Oluþturulmadý</h4>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Ýlk masanýzý açmak için yukarýdaki <strong>"Yeni Masa Ekle"</strong> butonuna týklayýnýz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => {
            const qrUrl = getQRLink(table);

            return (
              <div
                key={table.id}
                className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col items-center justify-between text-center hover:border-neutral-700 transition relative group"
              >
                {/* QR Display Card */}
                <div className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-black text-white tracking-tight">{table.table_no}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTable(table);
                          setEditTableName(table.table_no);
                        }}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
                        title="Masa Adýný Deðiþtir"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTable(table)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition"
                        title="Masayý Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Soft Luxury QR Card */}
                  <div className="bg-white p-4 rounded-2xl shadow-xl inline-block mx-auto mb-4 border-4 border-neutral-800">
                    <QRCodeSVG
                      value={qrUrl}
                      size={150}
                      level="M"
                      includeMargin={false}
                    />
                    <div className="text-[10px] font-black text-neutral-900 uppercase tracking-widest mt-2">
                      {business.name}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(qrUrl);
                      alert(`"${table.table_no}" menü baðlantý linki kopyalandý!`);
                    }}
                    className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Linki Kopyala
                  </button>
                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 rounded-xl text-xs font-bold transition"
                  >
                    Aç
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Table Name Modal */}
      {editingTable && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-black text-white mb-2">Masa Adýný Düzenle</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Örn: Bahçe 1, Teras 4, Balkon 2, VIP Oda
            </p>
            <form onSubmit={handleUpdateTableName} className="space-y-4">
              <input
                type="text"
                required
                value={editTableName}
                onChange={(e) => setEditTableName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl text-xs"
                >
                  Ýptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
