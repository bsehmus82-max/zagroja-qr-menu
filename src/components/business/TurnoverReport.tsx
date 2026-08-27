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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            Gün Sonu & Kasa Analizi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Satış performansınızı, nakit/kart dağılımını izleyin ve resmi gün sonu (Z Raporu) fişi yazdırın.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilterPeriod('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterPeriod === 'today' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Bugün
            </button>
            <button
              onClick={() => setFilterPeriod('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterPeriod === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Son 7 Gün
            </button>
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterPeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Tümü
            </button>
          </div>

          <button
            onClick={() => printZReport(business, filteredOrders, totalTurnover, cashTotal, cardTotal)}
            disabled={filteredOrders.length === 0}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition disabled:opacity-40"
          >
            <Printer className="w-4 h-4" />
            <span>Z Raporu Yazdır</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Toplam Net Ciro</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalTurnover.toFixed(2)} ₺
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Toplam {filteredOrders.length} adet tamamlanan sipariş
          </p>
        </div>

        {/* Cash Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Nakit Tahsilat</span>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {cashTotal.toFixed(2)} ₺
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Kasa çekmecesindeki nakit tutar</p>
        </div>

        {/* Card Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">POS / Kredi Kartı</span>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600">
            {cardTotal.toFixed(2)} ₺
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Banka POS slipleri toplamı</p>
        </div>
      </div>

      {/* Orders History List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900">Son Tamamlanan Siparişler</h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Veriler yükleniyor...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Seçilen dönemde henüz tamamlanmış sipariş bulunmuyor.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredOrders.slice(0, 15).map((ord) => (
              <div key={ord.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{ord.table_no}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {ord.payment_method === 'cash' ? 'Nakit' : 'POS / Kart'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    {new Date(ord.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} • {ord.items.length} Kalem
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-sm text-slate-900">
                    {ord.total_amount.toFixed(2)} ₺
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold block">Ödendi</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
