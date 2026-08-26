import React, { useState } from 'react';
import { RestaurantTable, Restaurant } from '../../types';
import { store } from '../../lib/store';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Plus, 
  RefreshCw, 
  Download, 
  Printer, 
  ExternalLink, 
  Trash2, 
  QrCode, 
  Edit,
  ShoppingCart,
  X,
  Sparkles,
  Layers
} from 'lucide-react';

interface TableManagerProps {
  tables: RestaurantTable[];
  restaurant: Restaurant;
  onOpenCustomerMenuForTable: (tableNumber: number) => void;
  onOpenManualOrderForTable?: (tableNumber: number) => void;
}

export const TableManager: React.FC<TableManagerProps> = ({
  tables,
  restaurant,
  onOpenCustomerMenuForTable,
  onOpenManualOrderForTable,
}) => {
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [selectedTableForPrint, setSelectedTableForPrint] = useState<RestaurantTable | null>(null);

  // New Table Form
  const [newTableNumber, setNewTableNumber] = useState<number>(tables.length + 1);
  const [newTableName, setNewTableName] = useState(`Masa ${tables.length + 1}`);
  const [newSection, setNewSection] = useState('Salon');

  // Edit Table Form
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editTableName, setEditTableName] = useState('');

  const maxTables = restaurant.max_tables || 25;
  const canAddMore = tables.length < maxTables;

  const getTableUrl = (table: RestaurantTable) => {
    const origin = window.location.origin;
    return `${origin}/?r=${restaurant.slug}&table=${table.table_number}&token=${table.qr_token}`;
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddMore) {
      alert(`Maksimum masa sınırına (${maxTables}) ulaştınız.`);
      return;
    }
    store.addTable({
      table_number: Number(newTableNumber),
      table_name: newTableName,
      section: newSection,
    });
    setIsAddingTable(false);
    setNewTableNumber(tables.length + 2);
    setNewTableName(`Masa ${tables.length + 2}`);
  };

  const handleSaveEdit = (tableId: string) => {
    store.updateTable(tableId, { table_name: editTableName });
    setEditingTableId(null);
  };

  const handleRegenerateQR = (tableId: string, tableName: string) => {
    if (confirm(`"${tableName}" için QR güvenlik kodunu yenilemek istediğinize emin misiniz? Eski QR kodlar geçersiz olacaktır.`)) {
      store.regenerateTableQR(tableId);
    }
  };

  const handleDeleteTable = (tableId: string, tableName: string) => {
    if (confirm(`"${tableName}" masasını silmek istediğinize emin misiniz?`)) {
      store.deleteTable(tableId);
    }
  };

  const handleDownloadSVG = (table: RestaurantTable) => {
    const svgElement = document.getElementById(`qr-svg-${table.id}`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${restaurant.slug}-masa-${table.table_number}-qr.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-orange-500" />
            <span>Masa ve QR Kod Yönetim Merkezi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Masaları tanımlayın, yönetin ve özel manuel siparişler girin. Sınır: {tables.length}/{maxTables} Masa.
          </p>
        </div>
        
        <div className="flex gap-2">
          {!isAddingTable && (
            <button
              onClick={() => setIsAddingTable(true)}
              disabled={!canAddMore}
              className={`px-4 py-2 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm
                ${canAddMore ? 'bg-orange-600 hover:bg-orange-700 active:scale-95' : 'bg-slate-400 cursor-not-allowed'}
              `}
            >
              <Plus className="w-4 h-4" /> 
              {canAddMore ? 'Yeni Masa Ekle' : 'Masa Sınırı Doldu'}
            </button>
          )}
        </div>
      </div>

      {/* Add Table Form */}
      {isAddingTable && (
        <form onSubmit={handleSaveTable} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm animate-fade-in grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Masa Numarası</label>
            <input
              type="number"
              required
              min="1"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Masa Görünür Adı</label>
            <input
              type="text"
              required
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm font-medium"
              placeholder="Örn: Bahçe 1"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Bölüm / Kategori</label>
            <input
              type="text"
              required
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm font-medium"
              placeholder="Örn: Teras, Salon"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 active:scale-95 transition-all shadow-xs text-sm"
            >
              Kaydet
            </button>
            <button
              type="button"
              onClick={() => setIsAddingTable(false)}
              className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all text-sm"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tables.map((table) => {
          const url = getTableUrl(table);
          const isEditing = editingTableId === table.id;
          
          return (
                <button
                  onClick={() => handleRegenerateQR(table.id, table.table_name)}
                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="QR Kodu Yenile (Eski QR geçersiz olur)"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteTable(table.id, table.table_name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Masayı Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Table Name */}
              <div className="mt-5 mb-3">
                <h3 className="font-extrabold text-slate-900 text-lg">{table.table_name}</h3>
                <span className="text-xs text-orange-600 font-semibold">Masa #{table.table_number}</span>
              </div>

              {/* QR Code Container */}
              <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-inner mb-3.5 flex items-center justify-center">
                <QRCodeSVG
                  id={`qr-svg-${table.id}`}
                  value={qrUrl}
                  size={140}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: restaurant.logo_url,
                    x: undefined,
                    y: undefined,
                    height: 28,
                    width: 28,
                    excavate: true,
                  }}
                />
              </div>

              {/* Quick URL preview */}
              <p className="text-[10px] text-slate-400 font-mono truncate max-w-full px-2 mb-3 bg-slate-50 py-1 rounded w-full">
                {qrUrl}
              </p>

              {/* Actions Footer */}
              <div className="w-full space-y-2 pt-2 border-t border-slate-100">
                {/* Manuel Sipariş Ekle Butonu */}
                {onOpenManualOrderForTable && (
                  <button
                    onClick={() => onOpenManualOrderForTable(table.table_number)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 active:scale-95 text-white flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Masaya Sipariş / Satış Gir</span>
                  </button>
                )}

                <div className="grid grid-cols-3 gap-1.5">
                  {/* Menüyü Müşteri Olarak Aç */}
                  <button
                    onClick={() => onOpenCustomerMenuForTable(table.table_number)}
                    className="p-2 rounded-xl text-[11px] font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 flex flex-col items-center justify-center transition-colors"
                    title="Müşteri Görünümü"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mb-0.5" />
                    <span>Menüyü Aç</span>
                  </button>

                  {/* SVG İndir */}
                  <button
                    onClick={() => handleDownloadSVG(table)}
                    className="p-2 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 flex flex-col items-center justify-center transition-colors"
                    title="SVG Olarak İndir"
                  >
                    <Download className="w-3.5 h-3.5 mb-0.5" />
                    <span>İndir</span>
                  </button>

                  {/* Masa Standını Yazdır */}
                  <button
                    onClick={() => setSelectedTableForPrint(table)}
                    className="p-2 rounded-xl text-[11px] font-semibold bg-slate-900 text-white hover:bg-black flex flex-col items-center justify-center transition-colors"
                    title="Masa Standı Olarak Yazdır"
                  >
                    <Printer className="w-3.5 h-3.5 mb-0.5" />
                    <span>Yazdır</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Table Modal */}
      {isAddingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10">
            <button
              onClick={() => setIsAddingTable(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Yeni Masa Tanımla</h3>
            <p className="text-xs text-slate-500 mb-4">
              Restoran veya kafeye yeni masa ekleyin, QR kod otomatik oluşturulacaktır.
            </p>

            <form onSubmit={handleSaveTable} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Masa Numarası *
                </label>
                <input
                  type="number"
                  required
                  value={newTableNumber}
                  onChange={(e) => {
                    const num = parseInt(e.target.value) || 1;
                    setNewTableNumber(num);
                    setNewTableName(`Masa ${num}`);
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Masa Adı / Etiketi *
                </label>
                <input
                  type="text"
                  required
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Örn: Masa 5, Bahçe 2, Teras VIP"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bölüm / Alan
                </label>
                <select
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium"
                >
                  <option value="Salon">Ana Salon</option>
                  <option value="Bahçe">Bahçe / Açık Alan</option>
                  <option value="Teras">Teras</option>
                  <option value="VIP">VIP Salon</option>
                  <option value="Bar">Bar / Bistro</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTable(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md"
                >
                  Masayı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Table Stand Modal */}
      {selectedTableForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in print:p-0 print:bg-white">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 text-center print:shadow-none print:w-full print:max-w-none">
            <button
              onClick={() => setSelectedTableForPrint(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center print:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Acrylic Table Stand Layout */}
            <div className="border-4 border-slate-900 rounded-3xl p-6 bg-gradient-to-b from-slate-50 to-white shadow-lg space-y-4">
              <div className="flex items-center justify-center gap-2">
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs"
                />
                <span className="font-extrabold text-slate-900 text-sm">{restaurant.name}</span>
              </div>

              <div className="py-2">
                <span className="inline-block bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {selectedTableForPrint.table_name} ({selectedTableForPrint.section})
                </span>
                <h4 className="text-xl font-extrabold text-slate-900 mt-2">
                  TEMASSIZ QR MENÜ
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kameranızla okutun, sipariş verin, garson çağırın!
                </p>
              </div>

              {/* Large QR */}
              <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-sm inline-block mx-auto">
                <QRCodeSVG
                  value={getTableUrl(selectedTableForPrint)}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                <p className="font-semibold text-slate-700">📶 Ücretsiz Wi-Fi: {restaurant.wifi_name || restaurant.wifi_ssid}</p>
                <p className="font-mono text-orange-600 font-bold">Şifre: {restaurant.wifi_password}</p>
              </div>
            </div>

            {/* Print Action Button */}
            <div className="mt-4 flex gap-2 justify-center print:hidden">
              <button
                onClick={handlePrint}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Yazdır / PDF Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
