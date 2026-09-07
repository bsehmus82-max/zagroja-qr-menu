import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, CreditCard, Printer, Wallet
} from 'lucide-react';
import { Business, Order, DailySummary, Expense } from '../../types';
import { supabase } from '../../lib/supabase';
import { printZReport } from '../../lib/thermalPrinter';
import { useToast } from '../../context/ToastContext';

interface TurnoverReportProps {
  business: Business;
}

export const TurnoverReport: React.FC<TurnoverReportProps> = ({ business }) => {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const now = new Date();

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const loadFinancials = async (isSilent = false) => {
    if (!isSilent && orders.length === 0) {
      setLoading(true);
    }
    try {
      const [ordersRes, summaryRes, expRes] = await Promise.all([
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
          .limit(30),
        supabase
          .from('expenses')
          .select('*')
          .eq('business_id', business.id)
          .order('expense_date', { ascending: false })
      ]);

      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (summaryRes.data) setDailySummaries(summaryRes.data as DailySummary[]);
      if (expRes.data) {
        setExpenses(expRes.data as Expense[]);
      } else {
        const local = localStorage.getItem(`restiva_expenses_${business.id}`);
        if (local) {
          try { setExpenses(JSON.parse(local)); } catch {}
        }
      }
    } catch {
      const local = localStorage.getItem(`restiva_expenses_${business.id}`);
      if (local) {
        try { setExpenses(JSON.parse(local)); } catch {}
      }
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

  const filteredExpenses = expenses.filter((e) => {
    if (filterPeriod === 'all') return true;
    const expDate = new Date(e.expense_date);

    if (filterPeriod === 'today') {
      return expDate.toDateString() === now.toDateString();
    } else if (filterPeriod === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return expDate >= oneWeekAgo;
    } else if (filterPeriod === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      return expDate >= oneMonthAgo;
    }
    return true;
  });

  const totalTurnover = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalTurnover - totalExpense;

  const cashTotal = filteredOrders
    .filter((o) => o.payment_method === 'cash')
    .reduce((sum, o) => sum + o.total_amount, 0);
  const cardTotal = filteredOrders
    .filter((o) => o.payment_method === 'credit_card')
    .reduce((sum, o) => sum + o.total_amount, 0);
  const otherTotal = filteredOrders
    .filter((o) => o.payment_method === 'other' || o.payment_method === 'online' || o.payment_method === 'bank_transfer')
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="space-y-6 font-medium text-slate-200">
      {/* Top Filter & Print Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111622] p-3 rounded-2xl shadow-md">
        <div className="flex bg-[#0C1017] p-1 rounded-xl">
          <button
            onClick={() => setFilterPeriod('today')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPeriod === 'today' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bugün
          </button>
          <button
            onClick={() => setFilterPeriod('week')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPeriod === 'week' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Son 7 Gün
          </button>
          <button
            onClick={() => setFilterPeriod('month')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPeriod === 'month' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Son 30 Gün
          </button>
          <button
            onClick={() => setFilterPeriod('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPeriod === 'all' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tümü
          </button>
        </div>

        <button
          onClick={() => printZReport(business, filteredOrders, totalTurnover, cashTotal, cardTotal, otherTotal)}
          disabled={filteredOrders.length === 0}
          className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-900 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-40"
        >
          <Printer className="w-4 h-4" />
          <span>Gün Sonu Raporu Yazdır</span>
        </button>
      </div>

      {/* KPI Cards (Toplam Net Gelir, Toplam Net Gider, Kasa, Nakit / POS / Diğer) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Net Gelir */}
        <div 
          onMouseMove={handleSpotlightMove}
          className="bg-[#111622] rounded-3xl p-5 shadow-lg space-y-1.5 spotlight-card spotlight-glow"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-300">Toplam Net Gelir</span>
            <TrendingUp className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-2xl font-black text-white">
            {totalTurnover.toFixed(2)} ₺
          </div>
          <p className="text-[10px] text-slate-400 font-bold">{filteredOrders.length} adet tamamlanan sipariş</p>
        </div>

        {/* Total Net Gider */}
        <div 
          onMouseMove={handleSpotlightMove}
          className="bg-[#111622] rounded-3xl p-5 shadow-lg space-y-1.5 spotlight-card spotlight-glow"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-300">Toplam Net Gider</span>
            <TrendingDown className="w-4 h-4 text-rose-300" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            -{totalExpense.toFixed(2)} ₺
          </div>
          <p className="text-[10px] text-slate-400 font-bold">{filteredExpenses.length} adet kayıtlı masraf</p>
        </div>

        {/* Kasa (Net Kâr / Kasa) */}
        <div 
          onMouseMove={handleSpotlightMove}
          className="bg-[#111622] rounded-3xl p-5 shadow-lg space-y-1.5 spotlight-card spotlight-glow"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-300">Kasa</span>
            <Wallet className="w-4 h-4 text-slate-300" />
          </div>
          <div className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netProfit >= 0 ? `+${netProfit.toFixed(2)} ₺` : `${netProfit.toFixed(2)} ₺`}
          </div>
          <p className="text-[10px] text-slate-400 font-bold">Net Nakit & POS Kasası</p>
        </div>

        {/* Cash vs Card vs Other Split */}
        <div 
          onMouseMove={handleSpotlightMove}
          className="bg-[#111622] rounded-3xl p-5 shadow-lg space-y-1.5 spotlight-card spotlight-glow"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-300">Nakit / POS / Diğer Ödeme Dağılımı</span>
            <CreditCard className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-xs font-bold space-y-1 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Nakit:</span>
              <span className="text-white font-black">{cashTotal.toFixed(2)} ₺</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">POS / Kart:</span>
              <span className="text-white font-black">{cardTotal.toFixed(2)} ₺</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Diğer (IBAN):</span>
              <span className="text-white font-black">{otherTotal.toFixed(2)} ₺</span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders History */}
      <div className="bg-[#111622] rounded-3xl p-5 shadow-lg space-y-4">
        <h3 className="font-extrabold text-sm text-white">Tamamlanan Son Satışlar</h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-bold">Veriler yükleniyor...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 font-medium">
            Seçilen dönemde tamamlanmış sipariş bulunmuyor.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredOrders.slice(0, 15).map((ord) => (
              <div key={ord.id} className="p-3 bg-[#0C1017] rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-100">{ord.table_no}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#1C2433] text-slate-300">
                      {ord.payment_method === 'cash' 
                        ? 'Nakit' 
                        : ord.payment_method === 'credit_card' 
                        ? 'POS / Kart' 
                        : 'Diğer (IBAN)'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {new Date(ord.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} • {ord.items.length} Kalem
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-black text-xs text-white">
                    {ord.total_amount.toFixed(2)} ₺
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold block">Ödendi</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
