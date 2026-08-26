import React, { useState } from 'react';
import { EndOfDayReportData, Restaurant } from '../../types';
import { store } from '../../lib/store';
import { 
  BarChart3, 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  Printer, 
  RotateCcw, 
  Calendar, 
  Layers,
  Sparkles,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

interface EndOfDayReportProps {
  restaurant: Restaurant;
}

export const EndOfDayReport: React.FC<EndOfDayReportProps> = ({ restaurant }) => {
  const [report, setReport] = useState<EndOfDayReportData>(store.getEndOfDayReport());
  const [activeTab, setActiveTab] = useState<'tables' | 'products'>('tables');

  const refreshReport = () => {
    setReport(store.getEndOfDayReport());
  };

  const handleResetDay = () => {
    if (
      confirm(
        'DİKKAT: Gün sonu kapanışı yapmak ve bugünkü siparişleri arşivleyip sıfırlamak istediğinize emin misiniz?'
      )
    ) {
      store.resetDay();
      refreshReport();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs print:border-none">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            <span>Gün Sonu ve Masa Kasa Raporu (Z Raporu)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Tarih: {report.date}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Raporu Yazdır</span>
          </button>

          <button
            onClick={handleResetDay}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4 text-rose-500" />
            <span>Günü Kapat & Sıfırla</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards (Tüm Masaların Genel Toplamı) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Ciro */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Toplam Ciro</span>
            <DollarSign className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-orange-400">
              {report.total_revenue.toFixed(2)} <span className="text-sm text-white">{restaurant.currency}</span>
            </div>
            <span className="text-[10px] text-slate-300 mt-0.5 block">Tüm masaların genel satışı</span>
          </div>
        </div>

        {/* Toplam Sipariş Sayısı */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Sipariş Sayısı</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {report.total_orders} <span className="text-sm font-semibold text-slate-400">Adet</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{report.total_items_sold} adet ürün teslim edildi</span>
          </div>
        </div>

        {/* Kredi Kartı Cirosu */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Kredi / Banka Kartı</span>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-600">
              {report.credit_card_total.toFixed(2)} <span className="text-sm text-slate-500">{restaurant.currency}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">POS cihazı tahsilatları</span>
          </div>
        </div>

        {/* Nakit Cirosu */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Nakit Kasa</span>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">
              {report.cash_total.toFixed(2)} <span className="text-sm text-slate-500">{restaurant.currency}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Elden alınan nakit ödemeler</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 print:hidden">
        <button
          onClick={() => setActiveTab('tables')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tables'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Masa Masa Satış Dökümü
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'products'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          En Çok Satan Ürünler Analizi
        </button>
      </div>

      {/* 1. Masa Masa Satış ve Ürün Listesi */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.table_summaries.map((table) => {
            const items = Object.entries(table.items_sold);
            return (
              <div
                key={table.table_number}
                className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between ${
                  table.total_sales > 0 ? 'border-slate-200' : 'border-slate-100 opacity-60'
                }`}
              >
                <div>
                  {/* Table Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 font-extrabold text-xs flex items-center justify-center">
                        M{table.table_number}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{table.table_name}</h4>
                        <span className="text-[10px] text-slate-400">{table.order_count} sipariş verildi</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-slate-900 text-base">
                        {table.total_sales.toFixed(2)} {restaurant.currency}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold">
                        {table.paid_sales > 0 ? `${table.paid_sales.toFixed(2)} ${restaurant.currency} ödendi` : 'Açık'}
                      </span>
                    </div>
                  </div>

                  {/* Items Sold on this table */}
                  <div className="py-3 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Masanın Tükettiği Çeşitler:
                    </span>
                    {items.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Bugün sipariş alınmadı.</p>
                    ) : (
                      items.map(([name, qty], idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-700 font-medium">{name}</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            {qty} Adet
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {table.active_orders > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg block text-center">
                      ⏳ {table.active_orders} aktif hazırlanıyor
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. En Çok Satan Ürünler Tablosu */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span>Satılan Ürünler ve Ciro Payları</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Sıra</th>
                  <th className="py-3 px-4">Ürün Adı</th>
                  <th className="py-3 px-4">Satılan Miktar</th>
                  <th className="py-3 px-4 text-right">Getirdiği Toplam Ciro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.top_products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                      Henüz satılan ürün kaydı bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  report.top_products.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md font-bold">
                          {item.count} Adet
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-orange-600 text-right">
                        {item.revenue.toFixed(2)} {restaurant.currency}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
