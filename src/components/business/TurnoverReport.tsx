import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Banknote, CreditCard, Calendar, 
  Printer, ArrowUpRight, Clock, RefreshCw 
} from 'lucide-react';
import { Business, Order } from '../../types';
import { supabase } from '../../lib/supabase';
import { printZReport } from '../../lib/thermalPrinter';

interface TurnoverReportProps {
  business: Business;
}

export const TurnoverReport: React.FC<TurnoverReportProps> = ({ business }) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTurnover = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();

      if (period === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      }

      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('business_id', business.id)
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (data) {
        setOrders(data as Order[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTurnover();
  }, [business.id, period]);

  const totalTurnover = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const cashTurnover = orders
    .filter((o) => o.payment_method === 'cash')
    .reduce((sum, o) => sum + o.total_amount, 0);
  const cardTurnover = orders
    .filter((o) => o.payment_method === 'credit_card')
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
        <div>
          <h2 className="text-xl font-black text-white">Ciro & Kasa Raporları</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Tam veri gizliliği ile anlık satış, nakit ve kredi kartı analizleri.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Filter */}
          <div className="flex items-center bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                period === 'today' ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Bugün
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                period === 'week' ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Son 7 Gün
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                period === 'month' ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Bu Ay
            </button>
          </div>

          <button
            onClick={() => printZReport(business, orders, totalTurnover, cashTurnover, cardTurnover)}
            className="px-4 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition border border-neutral-700 flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-purple-400" />
            Gün Sonu Z-Raporu Yazdır
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Toplam Ciro</span>
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-3xl font-black text-white">{totalTurnover.toFixed(2)} ₺</p>
          <span className="text-[10px] text-neutral-500 mt-2 block">
            Toplam {orders.length} adet tamamlanan adisyon
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Nakit Tahsilat</span>
            <Banknote className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">{cashTurnover.toFixed(2)} ₺</p>
          <span className="text-[10px] text-neutral-500 mt-2 block">
            {orders.filter((o) => o.payment_method === 'cash').length} Nakit Adisyon
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Kredi Kartı / POS</span>
            <CreditCard className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-purple-400">{cardTurnover.toFixed(2)} ₺</p>
          <span className="text-[10px] text-neutral-500 mt-2 block">
            {orders.filter((o) => o.payment_method === 'credit_card').length} POS Adisyon
          </span>
        </div>
      </div>

      {/* Orders History Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
          <h3 className="font-bold text-sm text-white">Tamamlanan Adisyon Geçmişi</h3>
          <span className="text-xs text-neutral-400">{orders.length} Kayıt</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-neutral-500 text-xs">Yükleniyor...</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-neutral-500 text-xs">
            Seçilen tarih aralığında tamamlanan sipariş bulunmuyor.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {orders.map((o) => (
              <div
                key={o.id}
                className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center font-bold text-white text-[11px]">
                    {o.table_no.replace('Masa ', '#')}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{o.table_no}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {new Date(o.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300">
                    {o.payment_method === 'cash' ? 'Nakit' : 'Kredi Kartı'}
                  </span>
                  <span className="font-black text-sm text-brand-400">
                    {o.total_amount.toFixed(2)} ₺
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
