import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Banknote, CreditCard, Printer, 
  Calendar, RefreshCw, Download, FileText, Clock, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Business, Order, DailySummary } from '../../types';
import { supabase } from '../../lib/supabase';
import { printZReport } from '../../lib/thermalPrinter';
import { useToast } from '../../context/ToastContext';

interface TurnoverReportProps {
  business: Business;
}

export const TurnoverReport: React.FC<TurnoverReportProps> = ({ business }) => {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const now = new Date();
  const dayOfMonth = now.getDate(); // 1 to 31
  const isMonthlyWindowActive = dayOfMonth <= 5;
  const isMonthlyWindowClosingSoon = dayOfMonth >= 4 && dayOfMonth <= 5;
  const daysLeftInWindow = Math.max(0, 6 - dayOfMonth);

  // Previous month name
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthName = prevMonthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  const loadFinancials = async () => {
    setLoading(true);
    try {
      const [ordersRes, summaryRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('business_id', business.id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false }),
        supabase
          .from('daily_summary')
          .select('*')
          .eq('business_id', business.id)
          .order('summary_date', { ascending: false })
          .limit(30)
      ]);

      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (summaryRes.data) setDailySummaries(summaryRes.data as DailySummary[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancials();
  }, [business.id]);

  const filteredOrders = orders.filter((o) => {
    if (filterPeriod === 'all') return true;
    const orderDate = new Date(o.created_at);

    if (filterPeriod === 'today') {
      return orderDate.toDateString() === now.toDateString();
    } else if (filterPeriod === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return orderDate >= oneWeekAgo;
    } else if (filterPeriod === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      return orderDate >= oneMonthAgo;
    }
    return true;
  });

  const totalTurnover = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const cashTotal = filteredOrders
    .filter((o) => o.payment_method === 'cash')
    .reduce((sum, o) => sum + o.total_amount, 0);
  const cardTotal = filteredOrders
    .filter((o) => o.payment_method === 'credit_card')
    .reduce((sum, o) => sum + o.total_amount, 0);

  // Generate & Download In-App Monthly PDF Report
  const handleDownloadMonthlyPdf = async () => {
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const prevMonthOrders = orders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= startOfPrevMonth && d <= endOfPrevMonth;
    });

    const mTotal = prevMonthOrders.reduce((acc, o) => acc + o.total_amount, 0);
    const mCash = prevMonthOrders.filter((o) => o.payment_method === 'cash').reduce((acc, o) => acc + o.total_amount, 0);
    const mCard = prevMonthOrders.filter((o) => o.payment_method === 'credit_card').reduce((acc, o) => acc + o.total_amount, 0);

    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      toast.warning('Açılır pencere tarayıcınız tarafından engellendi. Lütfen izin veriniz.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Aylık Ciro Raporu - ${business.name} - ${prevMonthName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
          .title { font-size: 16px; color: #64748b; font-weight: 600; margin-top: 4px; }
          .meta { font-size: 12px; color: #94a3b8; margin-top: 8px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px; }
          .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
          .kpi-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
          .kpi-val { font-size: 22px; font-weight: 900; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e1; font-weight: 700; }
          td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">${business.name}</div>
          <div class="title">RESMİ AYLIK CİRO VE SATIŞ RAPORU (${prevMonthName.toUpperCase()})</div>
          <div class="meta">Dönem: ${startOfPrevMonth.toLocaleDateString('tr-TR')} - ${endOfPrevMonth.toLocaleDateString('tr-TR')} • Rapor Üretim Tarihi: ${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR')}</div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Toplam Net Ciro</div>
            <div class="kpi-val">${mTotal.toFixed(2)} ₺</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Nakit Tahsilat</div>
            <div class="kpi-val">${mCash.toFixed(2)} ₺</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">POS / Kredi Kartı</div>
            <div class="kpi-val">${mCard.toFixed(2)} ₺</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: 800; margin-bottom: 8px;">Dönem İçi Satış Kayıtları Özeti (${prevMonthOrders.length} Adet Sipariş)</h3>
        <table>
          <thead>
            <tr>
              <th>Tarih & Saat</th>
              <th>Masa</th>
              <th>Ödeme Yöntemi</th>
              <th>Kalem Sayısı</th>
              <th style="text-align: right;">Tutar</th>
            </tr>
          </thead>
          <tbody>
            ${prevMonthOrders.slice(0, 100).map((o) => `
              <tr>
                <td>${new Date(o.created_at).toLocaleDateString('tr-TR')} ${new Date(o.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>
                <td>${o.table_no}</td>
                <td>${o.payment_method === 'cash' ? 'Nakit' : 'Kredi Kartı / POS'}</td>
                <td>${o.items.length} Kalem</td>
                <td style="text-align: right; font-weight: 700;">${o.total_amount.toFixed(2)} ₺</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Restiva Adisyon & QR Menü Sistemi tarafından güvenli sunucu kayıtlarıyla üretilmiştir.
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  return (
    <div className="space-y-4">
      {/* 5-DAY MONTHLY REPORT DOWNLOAD WINDOW CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-lg text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-black text-white">
                Aylık Ciro Raporu ({prevMonthName})
              </h3>
              {isMonthlyWindowActive ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 5 Günlük İndirme Penceresi Aktif
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  İndirme Penceresi Kapandı
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300">
              {isMonthlyWindowActive 
                ? `Geçen aya ait resmi ciro ve satış dökümünü PDF olarak cihazınıza indirebilirsiniz.`
                : `Geçen ayın 5 günlük indirme penceresi sona erdi. Bir sonraki ayın raporu ayın 1'inde açılacaktır.`
              }
            </p>

            {isMonthlyWindowClosingSoon && (
              <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5 pt-1 animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                Dikkat: Bu raporu indirmek için son {daysLeftInWindow} gününüz kaldı! (Ayın 6'sında defter silinecektir).
              </p>
            )}
          </div>

          {isMonthlyWindowActive && (
            <button
              onClick={handleDownloadMonthlyPdf}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Aylık Raporu İndir (PDF)</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Filter & Print Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterPeriod('today')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPeriod === 'today' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Bugün
          </button>
          <button
            onClick={() => setFilterPeriod('week')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPeriod === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Son 7 Gün
          </button>
          <button
            onClick={() => setFilterPeriod('month')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Son 30 Gün
          </button>
          <button
            onClick={() => setFilterPeriod('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Tümü
          </button>
        </div>

        <button
          onClick={() => printZReport(business, filteredOrders, totalTurnover, cashTotal, cardTotal)}
          disabled={filteredOrders.length === 0}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition disabled:opacity-40"
        >
          <Printer className="w-4 h-4" />
          <span>Z Raporu Yazdır</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Net */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600">Toplam Net Ciro</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalTurnover.toFixed(2)} ₺
          </div>
          <p className="text-[10px] text-slate-400 font-bold">{filteredOrders.length} adet tamamlanan sipariş</p>
        </div>

        {/* Cash */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600">Nakit Tahsilat</span>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {cashTotal.toFixed(2)} ₺
          </div>
          <p className="text-[10px] text-slate-400 font-bold">Kasadaki nakit tutar</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600">POS / Kredi Kartı</span>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600">
            {cardTotal.toFixed(2)} ₺
          </div>
          <p className="text-[10px] text-slate-400 font-bold">POS slipleri toplamı</p>
        </div>
      </div>

      {/* Orders History */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="font-extrabold text-xs text-slate-900">Tamamlanan Son Satışlar</h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-bold">Veriler yükleniyor...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 font-medium">
            Seçilen dönemde tamamlanmış sipariş bulunmuyor.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredOrders.slice(0, 15).map((ord) => (
              <div key={ord.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{ord.table_no}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {ord.payment_method === 'cash' ? 'Nakit' : 'POS / Kart'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {new Date(ord.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} • {ord.items.length} Kalem
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-black text-xs text-slate-900">
                    {ord.total_amount.toFixed(2)} ₺
                  </span>
                  <span className="text-[9px] text-emerald-600 font-bold block">Ödendi</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
