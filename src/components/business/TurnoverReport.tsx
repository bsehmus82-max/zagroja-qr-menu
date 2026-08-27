import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Banknote, CreditCard, Receipt, 
  Calendar, Printer, RefreshCw, BarChart3
} from 'lucide-react';
import { Business, Order } from '../../types';
import { supabase } from '../../lib/supabase';

interface TurnoverReportProps {
  business: Business;
}

export const TurnoverReport: React.FC<TurnoverReportProps> = ({ business }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  const loadTurnover = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('business_id', business.id)
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (data) setOrders(data as Order[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTurnover();
  }, [business.id]);

  // Filter orders based on time range
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filteredOrders = orders.filter((o) => {
    const orderTime = new Date(o.created_at).getTime();
    if (timeRange === 'today') return orderTime >= startOfDay;
    if (timeRange === 'week') return orderTime >= startOfWeek;
    if (timeRange === 'month') return orderTime >= startOfMonth;
    return true;
  });

  const totalTurnover = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const cashTurnover = filteredOrders
    .filter((o) => o.payment_method === 'cash')
    .reduce((sum, o) => sum + o.total_amount, 0);
  const cardTurnover = filteredOrders
    .filter((o) => o.payment_method === 'credit_card')
    .reduce((sum, o) => sum + o.total_amount, 0);

  // Print Official Z-Report
  const handlePrintZReport = () => {
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GÜN SONU Z-RAPORU</title>
          <style>
            @page { margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 80mm;
              margin: 0 auto;
              padding: 10px;
              color: #000;
            }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .double { border-top: 2px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin:0; font-size: 18px;">${business.name}</h2>
            <div style="font-size: 14px; font-weight: bold; margin-top: 4px;">*** GÜN SONU Z RAPORU ***</div>
            <div style="font-size: 11px; margin-top: 4px;">Tarih: ${new Date().toLocaleString('tr-TR')}</div>
          </div>

          <div class="double"></div>

          <div class="row">
            <span>Toplam Tamamlanan Sipariþ:</span>
            <span class="bold">${filteredOrders.length} Adet</span>
          </div>

          <div class="divider"></div>

          <div class="row">
            <span>Nakit Tahsilat:</span>
            <span class="bold">${cashTurnover.toFixed(2)} ?</span>
          </div>
          <div class="row">
            <span>Kredi Kartý / POS:</span>
            <span class="bold">${cardTurnover.toFixed(2)} ?</span>
          </div>

          <div class="double"></div>

          <div class="row bold" style="font-size: 16px;">
            <span>GENEL CÝRO TOPLAMI:</span>
            <span>${totalTurnover.toFixed(2)} ?</span>
          </div>

          <div class="center" style="margin-top: 16px; font-size: 11px;">
            Zagroja Kasa & POS Sistemi<br>
            Mali Deðeri Yoktur - Bilgi Fiþidir
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Ciro & Gün Sonu Z-Raporu</h2>
          <p className="text-xs text-neutral-400">
            Ýþletmenizin net ciro hesaplarý, nakit & POS tahsilat dökümleri ve tek týkla Z-Raporu çýktýsý.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                timeRange === 'today' ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Bugün
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                timeRange === 'week' ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Bu Hafta
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                timeRange === 'month' ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Bu Ay
            </button>
          </div>

          <button
            onClick={handlePrintZReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition border border-neutral-700"
          >
            <Printer className="w-4 h-4" />
            Z-Raporu Yazdýr
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-400">Toplam Net Ciro</span>
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{totalTurnover.toFixed(2)} ?</div>
          <div className="text-[11px] text-neutral-500 mt-2">
            Toplam {filteredOrders.length} tamamlanan sipariþ
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-400">Nakit Tahsilat</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">{cashTurnover.toFixed(2)} ?</div>
          <div className="text-[11px] text-neutral-500 mt-2">Kasa nakit girdisi</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-400">Kredi Kartý / POS</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-400">{cardTurnover.toFixed(2)} ?</div>
          <div className="text-[11px] text-neutral-500 mt-2">Banka / POS terminali</div>
        </div>
      </div>

      {/* Orders history list */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
        <h3 className="font-bold text-sm text-white mb-4">Tamamlanan Sipariþ Dökümü</h3>
        {loading ? (
          <div className="py-12 text-center text-neutral-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-brand-500" />
            <span className="text-xs">Rapor yükleniyor...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 text-xs">
            Seçilen tarih aralýðýnda tamamlanan sipariþ bulunmuyor.
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80 max-h-96 overflow-y-auto">
            {filteredOrders.map((o) => (
              <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{o.table_no}</span>
                    <span className="text-[10px] font-normal text-neutral-500 font-mono">
                      #{o.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    {new Date(o.created_at).toLocaleString('tr-TR')} • {o.items.length} Çeþit Ürün
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm text-white">{o.total_amount.toFixed(2)} ?</div>
                  <div className="text-[10px] text-neutral-400">
                    {o.payment_method === 'cash' ? 'Nakit' : 'Kredi Kartý'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
