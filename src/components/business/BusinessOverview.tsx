import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Wallet, 
  Users, ShoppingBag, PieChart, Calendar, Clock,
  ArrowUpRight, ArrowDownRight, Activity, Percent,
  Coffee, Award, ChevronRight, RefreshCw, LayoutGrid
} from 'lucide-react';
import { Business, Order, Expense, Table } from '../../types';
import { supabase } from '../../lib/supabase';

interface BusinessOverviewProps {
  business: Business;
}

export const BusinessOverview: React.FC<BusinessOverviewProps> = ({ business }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const loadAllRealData = async (isSilent = false) => {
    if (!isSilent && orders.length === 0) {
      setLoading(true);
    }
    try {
      const [ordRes, expRes, tblRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('business_id', business.id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .eq('business_id', business.id)
          .order('expense_date', { ascending: false }),
        supabase
          .from('tables')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: true })
      ]);

      if (ordRes.data) setOrders(ordRes.data as Order[]);
      if (tblRes.data) setTables(tblRes.data as Table[]);

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
    loadAllRealData();

    // Live Real-Time Subscriptions (Silent background updates)
    const channel = supabase
      .channel(`biz_overview_realtime_${business.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${business.id}` }, () => {
        loadAllRealData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `business_id=eq.${business.id}` }, () => {
        loadAllRealData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `business_id=eq.${business.id}` }, () => {
        loadAllRealData(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business.id]);

  // Today's Date Filter for Core KPI Cards (Daily Focus)
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayOrders = useMemo(() => {
    return orders.filter((o) => new Date(o.created_at) >= todayStart);
  }, [orders, todayStart]);

  const todayExpenses = useMemo(() => {
    return expenses.filter((e) => new Date(e.expense_date) >= todayStart);
  }, [expenses, todayStart]);

  const todayRevenue = useMemo(() => {
    return todayOrders.reduce((sum, o) => sum + o.total_amount, 0);
  }, [todayOrders]);

  const todayExpense = useMemo(() => {
    return todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [todayExpenses]);

  const todayBalance = todayRevenue - todayExpense;
  const todayAvgOrder = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;

  // Date Filtering Calculations for Trend Chart
  const getStartDate = (t: typeof timeframe) => {
    const d = new Date();
    if (t === 'today') {
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (t === 'week') {
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (t === 'month') {
      d.setDate(d.getDate() - 30);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return new Date(2020, 0, 1);
  };

  const startDate = getStartDate(timeframe);

  // Filtered Orders & Expenses based on timeframe
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => new Date(o.created_at) >= startDate);
  }, [orders, startDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => new Date(e.expense_date) >= startDate);
  }, [expenses, startDate]);

  // Financial KPIs
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  }, [filteredOrders]);

  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const netProfit = totalRevenue - totalExpense;
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  // Table Occupancy Real-Time Stats
  const totalTablesCount = tables.length;
  const occupiedTablesCount = tables.filter((t) => t.is_occupied).length;
  const emptyTablesCount = totalTablesCount - occupiedTablesCount;
  const occupancyRate = totalTablesCount > 0 ? (occupiedTablesCount / totalTablesCount) * 100 : 0;

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let card = 0;
    let other = 0;
    filteredOrders.forEach((o) => {
      if (o.payment_method === 'cash') cash += o.total_amount;
      else if (o.payment_method === 'credit_card') card += o.total_amount;
      else other += o.total_amount;
    });
    const total = cash + card + other;
    return {
      cash,
      card,
      other,
      cashPercent: total > 0 ? (cash / total) * 100 : 0,
      cardPercent: total > 0 ? (card / total) * 100 : 0,
      otherPercent: total > 0 ? (other / total) * 100 : 0,
    };
  }, [filteredOrders]);

  // Order Sources Breakdown (QR Masadan vs Garson vs POS Kasa)
  const sourceBreakdown = useMemo(() => {
    let qr = 0;
    let waiter = 0;
    let pos = 0;
    filteredOrders.forEach((o) => {
      if (o.order_source === 'qr') qr += 1;
      else if (o.order_source === 'waiter') waiter += 1;
      else pos += 1;
    });
    const total = filteredOrders.length;
    return {
      qr,
      waiter,
      pos,
      qrPercent: total > 0 ? (qr / total) * 100 : 0,
      waiterPercent: total > 0 ? (waiter / total) * 100 : 0,
      posPercent: total > 0 ? (pos / total) * 100 : 0,
    };
  }, [filteredOrders]);

  // Top Selling Products (From real order items)
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!map[item.name]) {
          map[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        map[item.name].quantity += item.quantity;
        map[item.name].revenue += item.price * item.quantity;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 7);
  }, [filteredOrders]);

  // Daily Chart Trend (Group revenue and expenses by date)
  const chartData = useMemo(() => {
    const daysMap: Record<string, { label: string; revenue: number; expense: number }> = {};
    
    // Determine number of slots
    const daysCount = timeframe === 'today' ? 1 : timeframe === 'week' ? 7 : 30;
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      daysMap[key] = { label, revenue: 0, expense: 0 };
    }

    filteredOrders.forEach((o) => {
      const key = new Date(o.created_at).toISOString().split('T')[0];
      if (daysMap[key]) {
        daysMap[key].revenue += o.total_amount;
      }
    });

    filteredExpenses.forEach((e) => {
      const key = new Date(e.expense_date).toISOString().split('T')[0];
      if (daysMap[key]) {
        daysMap[key].expense += e.amount;
      }
    });

    return Object.values(daysMap);
  }, [filteredOrders, filteredExpenses, timeframe]);

  // Dynamic Scale Y-Axis Steps calculation
  const maxChartVal = useMemo(() => {
    const rawMax = Math.max(
      ...chartData.map((d) => Math.max(d.revenue, d.expense)),
      0
    );
    if (rawMax <= 100) return 100;
    if (rawMax <= 500) return Math.ceil(rawMax / 100) * 100;
    if (rawMax <= 2000) return Math.ceil(rawMax / 250) * 250;
    return Math.ceil(rawMax / 500) * 500;
  }, [chartData]);

  const yAxisSteps = useMemo(() => {
    const max = maxChartVal;
    return [
      max,
      Math.round(max * 0.75),
      Math.round(max * 0.5),
      Math.round(max * 0.25),
      0
    ];
  }, [maxChartVal]);

  // Hourly Order Rush Breakdown (Saatlik Yoğunluk)
  const hourlyRush = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0 }));
    filteredOrders.forEach((o) => {
      const h = new Date(o.created_at).getHours();
      if (hours[h]) hours[h].count += 1;
    });
    return hours.filter((_, idx) => idx >= 8 && idx <= 23); // Display 08:00 - 23:00
  }, [filteredOrders]);

  const maxHourCount = useMemo(() => {
    return Math.max(...hourlyRush.map((h) => h.count), 1);
  }, [hourlyRush]);

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Header & Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111622] p-4 sm:p-5 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-300" />
            <span>İşletme Genel Özeti & Analiz Tablosu</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerçek sipariş, harcama ve masa verileri üzerinden işletmenizin anlık ve geçmiş performansını takip edin.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center bg-[#0C1017] p-1 rounded-xl shrink-0">
          <button
            onClick={() => setTimeframe('today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              timeframe === 'today' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bugün
          </button>
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              timeframe === 'week' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Son 7 Gün
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              timeframe === 'month' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Son 30 Gün
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              timeframe === 'all' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tümü
          </button>
        </div>
      </div>

      {/* 4 Core Financial & Operational KPI Cards (O Güne Ait Günlük Odak) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Toplam Net Gelir */}
        <div
          onMouseMove={handleSpotlightMove}
          className="bg-[#111622] rounded-2xl p-5 shadow-lg space-y-2 spotlight-card spotlight-glow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Toplam Net Gelir</span>
            <TrendingUp className="w-5 h-5 text-slate-300 shrink-0" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {todayRevenue.toFixed(2)} ₺
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-300" />
            <span>{todayOrders.length} Adet Tamamlanan Satış</span>
          </div>
        </div>

        {/* 2. Toplam Net Gider */}
        <div
          onMouseMove={handleSpotlightMove}
          className="bg-[#111622] rounded-2xl p-5 shadow-lg space-y-2 spotlight-card spotlight-glow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Toplam Net Gider</span>
            <TrendingDown className="w-5 h-5 text-rose-400 shrink-0" />
          </div>
          <div className="text-2xl font-black text-rose-400 tracking-tight">
            -{todayExpense.toFixed(2)} ₺
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
            <span>{todayExpenses.length} Adet Masraf Kaydı</span>
          </div>
        </div>

        {/* 3. Toplam Bakiye */}
        <div
          onMouseMove={handleSpotlightMove}
          className="bg-[#111622] rounded-2xl p-5 shadow-lg space-y-2 spotlight-card spotlight-glow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Toplam Bakiye</span>
            <Wallet className="w-5 h-5 text-slate-300 shrink-0" />
          </div>
          <div className={`text-2xl font-black tracking-tight ${todayBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {todayBalance >= 0 ? `+${todayBalance.toFixed(2)} ₺` : `${todayBalance.toFixed(2)} ₺`}
          </div>
          <div className="text-[11px] text-slate-400 font-semibold">
            Ort. Sipariş: <strong className="text-white">{todayAvgOrder.toFixed(2)} ₺</strong>
          </div>
        </div>

        {/* 4. Canlı Masa Doluluk Oranı */}
        <div
          onMouseMove={handleSpotlightMove}
          className="bg-[#111622] rounded-2xl p-5 shadow-lg space-y-2 spotlight-card spotlight-glow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Masa Doluluk Durumu</span>
            <LayoutGrid className="w-5 h-5 text-slate-300 shrink-0" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-2">
            <span>%{occupancyRate.toFixed(0)}</span>
            <span className="text-xs text-slate-400 font-medium font-mono">
              ({occupiedTablesCount}/{totalTablesCount} Masa)
            </span>
          </div>
          <div className="w-full bg-[#0C1017] rounded-full h-2 overflow-hidden">
            <div
              className="bg-white/80 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(4, occupancyRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Analytical Chart: Gelir Gider Karşılaştırma Grafiği */}
      <div className="bg-[#111622] rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-300" />
              <span>Gelir Gider Karşılaştırma Grafiği</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Seçilen periyotta gerçekleşen günlük brüt gelirler ve yapılan harcamaların karşılaştırması.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-300 shadow-xs" />
              <span className="text-slate-300">Gelir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-400/50 shadow-xs" />
              <span className="text-slate-300">Gider</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart with Left Y-Axis Scale */}
        {loading ? (
          <div className="h-56 flex items-center justify-center text-xs text-slate-400 font-bold">
            Grafik verileri işleniyor...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-slate-400">
            Seçilen dönemde gösterilecek hareket bulunmuyor.
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {/* Grid Layout: Left Y-Axis & Chart Columns */}
            <div className="relative flex items-stretch gap-2 sm:gap-3">
              {/* Left Y-Axis Monetary Scale */}
              <div className="flex flex-col justify-between items-end pb-7 pr-1 sm:pr-2 text-[10px] font-mono text-slate-400 select-none shrink-0 w-14 sm:w-16">
                {yAxisSteps.map((step, idx) => (
                  <span key={idx} className="leading-none">
                    {step.toLocaleString('tr-TR')} ₺
                  </span>
                ))}
              </div>

              {/* Chart Plot Area with Grid Lines */}
              <div className="flex-1 relative min-w-0">
                {/* Horizontal Dashed/Subtle Guide Lines */}
                <div className="absolute inset-0 pb-7 flex flex-col justify-between pointer-events-none">
                  {yAxisSteps.map((_, idx) => (
                    <div key={idx} className="w-full border-b border-white/[0.04]" />
                  ))}
                </div>

                {/* Bars Container with top padding to ensure tooltips are never cut off */}
                <div className="h-56 pt-8 flex items-end gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-none relative z-10">
                  {chartData.map((d, idx) => {
                    const revHeight = maxChartVal > 0 ? (d.revenue / maxChartVal) * 100 : 0;
                    const expHeight = maxChartVal > 0 ? (d.expense / maxChartVal) * 100 : 0;

                    return (
                      <div 
                        key={idx} 
                        className="flex-1 min-w-[36px] sm:min-w-[48px] flex flex-col items-center gap-1.5 h-full justify-end relative p-1 rounded-xl transition-all duration-200 hover:bg-white/[0.03]"
                      >
                        {/* Dual Bars Container */}
                        <div className="w-full flex items-end justify-center gap-1.5 h-36 relative">
                          {/* Gelir Bar (Soft elegant highlight) */}
                          <div
                            className="w-1/2 bg-slate-300 rounded-t-md transition-all duration-200 hover:bg-white hover:shadow-[0_0_8px_rgba(255,255,255,0.3)] origin-bottom cursor-pointer relative group/bar"
                            style={{ height: `${Math.max(4, revHeight)}%` }}
                          >
                            {/* Gelir Floating Tooltip (Directly on top of this bar) */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-[#0C1017] text-white text-[10px] font-bold px-2 py-0.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all duration-150 shadow-xl pointer-events-none z-30 whitespace-nowrap border border-white/[0.08]">
                              {d.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                            </div>
                          </div>

                          {/* Gider Bar (Soft highlight) */}
                          <div
                            className="w-1/2 bg-rose-500/40 rounded-t-md transition-all duration-200 hover:bg-rose-400 hover:shadow-[0_0_8px_rgba(244,63,94,0.3)] origin-bottom cursor-pointer relative group/bar"
                            style={{ height: `${Math.max(4, expHeight)}%` }}
                          >
                            {/* Gider Floating Tooltip (Directly on top of this bar) */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-[#0C1017] text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all duration-150 shadow-xl pointer-events-none z-30 whitespace-nowrap border border-white/[0.08]">
                              {d.expense.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                            </div>
                          </div>
                        </div>

                        {/* Date Label */}
                        <span className="text-[10px] text-slate-400 font-mono truncate w-full text-center group-hover:text-white transition">
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Grid: Rush Hours & Order Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Saatlik Sipariş Yoğunluğu Dağılımı */}
        <div className="bg-[#111622] rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-300" />
              <span>Günün Saatlerine Göre Sipariş Yoğunluğu</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">08:00 - 23:00</span>
          </div>

          <div className="h-32 flex items-end gap-1.5 sm:gap-2 pt-2">
            {hourlyRush.map((h, i) => {
              const height = (h.count / maxHourCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                  <div className="absolute -top-7 bg-[#0C1017] text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover/opacity-100 transition shadow-lg pointer-events-none whitespace-nowrap">
                    {h.count} Sipariş
                  </div>

                  <div
                    className="w-full bg-[#1C2433] group-hover:bg-white rounded-t transition-all duration-200"
                    style={{ height: `${Math.max(6, height)}%` }}
                  />

                  <span className="text-[9px] text-slate-500 font-mono scale-90">
                    {h.hour.split(':')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Kanal & Ödeme Türü Dağılımı */}
        <div className="bg-[#111622] rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-slate-300" />
            <span>Kanal & Ödeme Dağılımları</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Ödeme Türü (Nakit vs POS vs Diğer) - / % format without parentheses */}
            <div className="bg-[#0C1017] rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">Ödeme Yöntemi</span>
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">POS / Kart</span>
                  <span className="font-bold text-white font-mono">{paymentBreakdown.card.toFixed(2)} ₺ / %{paymentBreakdown.cardPercent.toFixed(0)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Nakit Kasa</span>
                  <span className="font-bold text-white font-mono">{paymentBreakdown.cash.toFixed(2)} ₺ / %{paymentBreakdown.cashPercent.toFixed(0)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Diğer / IBAN</span>
                  <span className="font-bold text-white font-mono">{paymentBreakdown.other.toFixed(2)} ₺ / %{paymentBreakdown.otherPercent.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Sipariş Kaynağı (Masadan QR vs Garson vs POS) */}
            <div className="bg-[#0C1017] rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">Sipariş Kaynağı</span>
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Masadan QR Menü</span>
                  <span className="font-bold text-white font-mono">%{sourceBreakdown.qrPercent.toFixed(0)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Garson Terminali</span>
                  <span className="font-bold text-white font-mono">%{sourceBreakdown.waiterPercent.toFixed(0)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">POS / Kasa Satışı</span>
                  <span className="font-bold text-white font-mono">%{sourceBreakdown.posPercent.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Products Leaderboard */}
      <div className="bg-[#111622] rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-slate-300" />
            <span>En Çok Tercih Edilen Ürünler</span>
          </h3>
        </div>

        {topProducts.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            Seçilen dönemde sipariş edilmiş ürün bulunmuyor.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topProducts.map((p, idx) => (
              <div
                key={idx}
                onMouseMove={handleSpotlightMove}
                className="bg-[#0C1017] rounded-2xl p-3.5 flex items-center justify-between transition spotlight-card spotlight-glow"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-[#1C2433] flex items-center justify-center font-black text-xs text-white shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-white block truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-400 block">{p.quantity} Adet Satıldı</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-black text-xs text-slate-200">{p.revenue.toFixed(2)} ₺</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
