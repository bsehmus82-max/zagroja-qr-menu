import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Banknote, CreditCard, Printer, 
  Calendar, RefreshCw, Layers
} from 'lucide-react';
import { Business, Order } from '../../types';
import { supabase } from '../../lib/supabase';
import { printZReport } from '../../lib/thermalPrinter';

interface TurnoverReportProps {
  business: Business;
}

export const TurnoverReport: React.FC<TurnoverReportProps> = ({ business }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'all'>('today');

  const loadFinancials = async () => {
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
    loadFinancials();
  }, [business.id]);

  const filteredOrders = orders.filter((o) => {
    if (filterPeriod === 'all') return true;
    const orderDate = new Date(o.created_at);
    const now = new Date();

    if (filterPeriod === 'today') {
      return orderDate.toDateString() === now.toDateString();
    } else if (filterPeriod === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return orderDate >= oneWeekAgo;
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

  const cashPercent = totalTurnover > 0 ? (cashTotal / totalTurnover) * 100 : 0;
  const cardPercent = totalTurnover > 0 ? (cardTotal / totalTurnover) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111622] border border-[#1E2638] p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white">Ciro & Gün Sonu Analizi</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tamamlanan adisyonların nakit ve POS dağılımını inceleyebilir ve Z-Raporu yazdırabilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center bg-[#0B0E14] p-1 rounded-xl border border-[#1E2638]">
            <button
              onClick={() => setFilterPeriod('today')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterPeriod === 'today' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bugün
            </button>
            <button
              onClick={() => setFilterPeriod('week')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterPeriod === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Son 7 Gün
            </button>
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterPeriod === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tümü
            </button>
          </div>

          <button
            onClick={() => printZReport(business, filteredOrders, totalTurnover, cashTotal, cardTotal)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Z-Raporu Yazdır
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-[#111622] border border-[#1E2638] p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Toplam Ciro</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">{totalTurnover.toFixed(2)} ₺</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {filteredOrders.length} Adet Tamamlanan Adisyon
          </span>
        </div>

        <div className="bg-[#111622] border border-[#1E2638] p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 mb-1">
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nakit Tahsilat</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{cashTotal.toFixed(2)} ₺</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Cironun %{cashPercent.toFixed(1)} kadarı
          </span>
        </div>

        <div className="bg-[#111622] border border-[#1E2638] p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 mb-1">
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kredi Kartı / POS</span>
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{cardTotal.toFixed(2)} ₺</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Cironun %{cardPercent.toFixed(1)} kadarı
          </span>
        </div>
      </div>

      {/* Breakdown Bar */}
      <div className="bg-[#111622] border border-[#1E2638] p-4 rounded-2xl space-y-2">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
          Tahsilat Dağılımı
        </span>
        <div className="w-full h-3 bg-[#0B0E14] rounded-full overflow-hidden flex">
          <div
            style={{ width: `${cashPercent}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`Nakit: %${cashPercent.toFixed(1)}`}
          />
          <div
            style={{ width: `${cardPercent}%` }}
            className="bg-indigo-500 h-full transition-all duration-500"
            title={`POS: %${cardPercent.toFixed(1)}`}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#111622] border border-[#1E2638] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 border-b border-[#1E2638] flex justify-between items-center">
          <span className="font-bold text-xs text-white">Tamamlanan Adisyon Geçmişi</span>
          <span className="text-[11px] text-slate-400">{filteredOrders.length} Adet</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
            <span>Yükleniyor...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Seçili dönemde tamamlanmış adisyon kaydı bulunmuyor.
          </div>
        ) : (
          <div className="divide-y divide-[#1A2234]">
            {filteredOrders.map((o) => (
              <div
                key={o.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-[#182030] transition text-xs"
              >
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span>{o.table_no}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      #{o.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(o.created_at).toLocaleString('tr-TR')} • {o.items.length} Kalem
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-indigo-400">{o.total_amount.toFixed(2)} ₺</div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {o.payment_method === 'cash' ? 'Nakit' : 'Kredi Kartı'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
