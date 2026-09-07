import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, Plus, Trash2, Edit3, TrendingDown, 
  TrendingUp, Wallet, Calendar, Tag, FileText, 
  CreditCard, Banknote, Building2, Search, Filter,
  PieChart, ArrowUpRight, ArrowDownRight, Check, X,
  AlertCircle, Download, RefreshCw
} from 'lucide-react';
import { Business, Expense, Order } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface ExpensesManagerProps {
  business: Business;
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'fatura', name: 'Fatura & Abonelikler', desc: 'Elektrik, su, doğalgaz, internet' },
  { id: 'mutfak', name: 'Mutfak & Tedarik', desc: 'Et, sebze, içecek, toptan gıda' },
  { id: 'personel', name: 'Personel & Maaş', desc: 'Aylık maaş, yevmiye, avans, SGK' },
  { id: 'kira', name: 'Kira & Aidat', desc: 'Dükkan kirası, bina aidatı' },
  { id: 'temizlik', name: 'Temizlik & Hijyen', desc: 'Deterjan, peçete, ambalaj, sarf' },
  { id: 'bakim', name: 'Bakım & Onarım', desc: 'Tadilat, cihaz servisi, tesisat' },
  { id: 'vergi', name: 'Vergi & Muhasebe', desc: 'KDV, stopaj, muhasebe ücreti' },
  { id: 'pazarlama', name: 'Pazarlama & Reklam', desc: 'Sosyal medya, broşür, promosyon' },
  { id: 'diger', name: 'Diğer / Genel Giderler', desc: 'Çeşitli masraflar' },
];

export const ExpensesManager: React.FC<ExpensesManagerProps> = ({ business }) => {
  const toast = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form State
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0].name);
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'bank_transfer' | 'other'>('cash');
  const [receiptNo, setReceiptNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Storage key for reliable offline / local cache
  const storageKey = `restiva_expenses_${business.id}`;

  const loadExpenses = async (isSilent = false) => {
    if (!isSilent && expenses.length === 0) {
      setLoading(true);
    }
    try {
      // 1. Try Supabase
      const { data: expData, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('business_id', business.id)
        .order('expense_date', { ascending: false });

      if (!error && expData) {
        setExpenses(expData as Expense[]);
        localStorage.setItem(storageKey, JSON.stringify(expData));
      } else {
        // Fallback to local storage
        const local = localStorage.getItem(storageKey);
        if (local) {
          try {
            setExpenses(JSON.parse(local));
          } catch {}
        }
      }

      // Also load paid orders for live turnover & profit comparison
      const { data: ordData } = await supabase
        .from('orders')
        .select('*')
        .eq('business_id', business.id)
        .eq('status', 'paid');

      if (ordData) {
        setOrders(ordData as Order[]);
      }
    } catch {
      const local = localStorage.getItem(storageKey);
      if (local) {
        try {
          setExpenses(JSON.parse(local));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [business.id]);

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setCategory(DEFAULT_EXPENSE_CATEGORIES[0].name);
    setCustomCategory('');
    setDescription('');
    setAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash');
    setReceiptNo('');
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    const isStandardCat = DEFAULT_EXPENSE_CATEGORIES.some((c) => c.name === exp.category);
    if (isStandardCat) {
      setCategory(exp.category);
      setCustomCategory('');
    } else {
      setCategory('custom');
      setCustomCategory(exp.category);
    }
    setDescription(exp.description);
    setAmount(exp.amount.toString());
    setExpenseDate(exp.expense_date);
    setPaymentMethod(exp.payment_method || 'cash');
    setReceiptNo(exp.receipt_no || '');
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Lütfen geçerli bir harcama tutarı giriniz.');
      return;
    }

    const finalCategory = category === 'custom' ? customCategory.trim() || 'Diğer Giderler' : category;

    setSubmitting(true);
    try {
      const payload = {
        business_id: business.id,
        category: finalCategory,
        description: description.trim() || finalCategory,
        amount: numAmount,
        expense_date: expenseDate,
        payment_method: paymentMethod,
        receipt_no: receiptNo.trim() || null,
        created_at: new Date().toISOString(),
      };

      if (editingExpense) {
        // Update
        const { error } = await supabase
          .from('expenses')
          .update(payload)
          .eq('id', editingExpense.id);

        const updatedList = expenses.map((item) =>
          item.id === editingExpense.id ? ({ ...item, ...payload } as Expense) : item
        );
        setExpenses(updatedList);
        localStorage.setItem(storageKey, JSON.stringify(updatedList));
        toast.success('Gider kaydı güncellendi.');
      } else {
        // Create
        const newId = crypto.randomUUID ? crypto.randomUUID() : `exp_${Date.now()}`;
        const newExpense: Expense = {
          id: newId,
          ...payload,
          receipt_no: payload.receipt_no || undefined,
        };

        const { data, error } = await supabase
          .from('expenses')
          .insert([{ id: newId, ...payload }])
          .select()
          .single();

        const updatedList = [data ? (data as Expense) : newExpense, ...expenses];
        setExpenses(updatedList);
        localStorage.setItem(storageKey, JSON.stringify(updatedList));
        toast.success('Yeni gider kaydı başarıyla eklendi.');
      }

      setIsModalOpen(false);
    } catch {
      toast.error('Gider kaydedilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Bu gider kaydını silmek istediğinizden emin misiniz?')) return;

    try {
      await supabase.from('expenses').delete().eq('id', id);
      const updatedList = expenses.filter((e) => e.id !== id);
      setExpenses(updatedList);
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
      toast.success('Gider kaydı silindi.');
    } catch {
      toast.error('Silinirken bir hata oluştu.');
    }
  };

  // Date filtering logic
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const getStartDateForPeriod = (p: typeof period): Date => {
    const d = new Date();
    if (p === 'today') {
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (p === 'week') {
      const day = d.getDay() || 7;
      d.setDate(d.getDate() - day + 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (p === 'month') {
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(2020, 0, 1);
  };

  const startDate = getStartDateForPeriod(period);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const expDate = new Date(exp.expense_date);
      if (expDate < startDate) return false;
      if (selectedCategoryFilter !== 'all' && exp.category !== selectedCategoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = exp.description.toLowerCase().includes(q);
        const matchCat = exp.category.toLowerCase().includes(q);
        const matchRcpt = exp.receipt_no ? exp.receipt_no.toLowerCase().includes(q) : false;
        if (!matchDesc && !matchCat && !matchRcpt) return false;
      }
      return true;
    });
  }, [expenses, startDate, selectedCategoryFilter, searchQuery]);

  // Filtered Orders for Turnover Comparison
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const oDate = new Date(o.created_at);
      return oDate >= startDate;
    });
  }, [orders, startDate]);

  // Financial Calculations
  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const totalRevenueAmount = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  }, [filteredOrders]);

  const netProfit = totalRevenueAmount - totalExpenseAmount;
  const profitMarginPercent = totalRevenueAmount > 0 ? (netProfit / totalRevenueAmount) * 100 : 0;

  // Expenses by Category breakdown
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([cat, val]) => ({ category: cat, total: val, percent: totalExpenseAmount > 0 ? (val / totalExpenseAmount) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, totalExpenseAmount]);

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111622] p-4 sm:p-5 rounded-3xl shadow-lg">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-300" />
            <span>Gider & Masraf Yönetimi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            İşletmenizin kira, fatura, personel ve mutfak masraflarını kaydedin; ciro ve net kârınızı canlı takip edin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-white hover:bg-slate-200 text-slate-900 font-extrabold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Gider Ekle</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Toplam Ciro (Gelir) */}
        <div 
          onMouseMove={handleSpotlightMove}
          className="bg-[#111622] rounded-3xl p-5 shadow-lg space-y-2 spotlight-card spotlight-glow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Toplam Ciro (Gelir)</span>
            <TrendingUp className="w-5 h-5 text-slate-300 shrink-0" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {totalRevenueAmount.toFixed(2)} ₺
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>{filteredOrders.length} Adet Tahsil Edilen Sipariş</span>
          </div>
        </div>

        {/* Toplam Giderler */}
        <div 
          onMouseMove={handleSpotlightMove}
          className="bg-[#111622] rounded-3xl p-5 shadow-lg space-y-2 spotlight-card spotlight-glow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Toplam Giderler</span>
            <TrendingDown className="w-5 h-5 text-rose-400 shrink-0" />
          </div>
          <div className="text-2xl font-black text-rose-400 tracking-tight">
            {totalExpenseAmount.toFixed(2)} ₺
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
            <span>{filteredExpenses.length} Adet Kayıtlı Masraf</span>
          </div>
        </div>

        {/* Net Kâr / Bakiye */}
        <div 
          onMouseMove={handleSpotlightMove}
          className="bg-[#111622] rounded-3xl p-5 shadow-lg space-y-2 spotlight-card spotlight-glow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Net Kâr / Bakiye</span>
            <Wallet className="w-5 h-5 text-slate-300 shrink-0" />
          </div>
          <div className={`text-2xl font-black tracking-tight ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netProfit >= 0 ? `+${netProfit.toFixed(2)} ₺` : `${netProfit.toFixed(2)} ₺`}
          </div>
          <div className="text-[11px] text-slate-400">
            Kâr Marjı: <strong className={netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>%{profitMarginPercent.toFixed(1)}</strong>
          </div>
        </div>
      </div>

      {/* Filter & Period Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#111622] p-3.5 rounded-3xl shadow-md">
        {/* Period Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              period === 'today'
                ? 'bg-white/20 text-white shadow-sm'
                : 'bg-[#182030] text-slate-400 hover:text-white hover:bg-[#1C2433]'
            }`}
          >
            Bugün
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              period === 'week'
                ? 'bg-white/20 text-white shadow-sm'
                : 'bg-[#182030] text-slate-400 hover:text-white hover:bg-[#1C2433]'
            }`}
          >
            Bu Hafta
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              period === 'month'
                ? 'bg-white/20 text-white shadow-sm'
                : 'bg-[#182030] text-slate-400 hover:text-white hover:bg-[#1C2433]'
            }`}
          >
            Bu Ay
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              period === 'all'
                ? 'bg-white/20 text-white shadow-sm'
                : 'bg-[#182030] text-slate-400 hover:text-white hover:bg-[#1C2433]'
            }`}
          >
            Tüm Zamanlar
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Açıklama, fiş no veya kategori ara..."
              className="w-full pl-8 pr-3 py-2 bg-[#0C1017] rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#0C1017] text-slate-200 text-xs font-bold rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="all">Tüm Kategoriler</option>
            {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Expenses Content: Left List & Right Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Expenses Table / List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-[#111622] rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-300" />
                <span>Masraf Kayıtları ({filteredExpenses.length})</span>
              </h3>
              <span className="text-xs font-black text-slate-300">
                Toplam: {totalExpenseAmount.toFixed(2)} ₺
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold">
                Giderler yükleniyor...
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1C2433] flex items-center justify-center mx-auto text-slate-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-200">Kayıtlı Gider Bulunmuyor</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Seçili dönemde herhangi bir gider kaydı bulunamadı. Masraf eklemek için aşağıdaki butonu kullanabilirsiniz.
                </p>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Gider Ekle</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    onMouseMove={handleSpotlightMove}
                    className="bg-[#0C1017] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition spotlight-card spotlight-glow"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs text-white bg-[#1C2433] px-2.5 py-0.5 rounded-lg">
                          {exp.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(exp.expense_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {exp.receipt_no && (
                          <span className="text-[10px] text-slate-400 bg-[#161E2E] px-2 py-0.5 rounded">
                            Fiş: #{exp.receipt_no}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 bg-[#161E2E] px-2 py-0.5 rounded">
                          {exp.payment_method === 'cash' ? 'Nakit' :
                           exp.payment_method === 'credit_card' ? 'Kredi Kartı' :
                           exp.payment_method === 'bank_transfer' ? 'Banka Havalesi' : 'Diğer'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 truncate">
                        {exp.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1F293D]">
                      <div className="text-right">
                        <span className="text-sm font-black text-rose-400 block">
                          -{exp.amount.toFixed(2)} ₺
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-2 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-slate-300 hover:text-white transition"
                          title="Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Category Breakdown & Financial Insights */}
        <div className="space-y-4">
          <div className="bg-[#111622] rounded-3xl p-5 shadow-lg space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-slate-300" />
              <span>Kategori Bazlı Harcama</span>
            </h3>

            {expensesByCategory.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Henüz kategori dağılımı için veri yok.
              </p>
            ) : (
              <div className="space-y-3">
                {expensesByCategory.map((item) => (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">{item.category}</span>
                      <span className="font-black text-slate-100">
                        {item.total.toFixed(2)} ₺ <span className="text-slate-400 font-normal">({item.percent.toFixed(0)}%)</span>
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-[#0C1017] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-white/80 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, item.percent))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Expense Tips */}
          <div className="bg-[#111622] rounded-3xl p-5 shadow-lg space-y-3">
            <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
              Finansal Notlar
            </h4>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed font-normal">
              <li>Girilen masraflar cironuzdan otomatik düşülerek anlık Net Kâr hesaplanır.</li>
              <li>Gün Sonu Raporunda günün toplam giderleri ve net kasası otomatik yer alır.</li>
              <li>Fiş ve fatura numaralarını açıklama alanına ekleyerek muhasebe sürecinizi hızlandırabilirsiniz.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ADD / EDIT EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#111622] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]/60">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingExpense ? 'Gider Kaydını Düzenle' : 'Gider Ekle'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Masraf türünü, tutarını ve açıklamasını giriniz.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1C2433] hover:bg-[#253043] text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveExpense} className="space-y-4">
              {/* Category Grid Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Gider Kategorisi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DEFAULT_EXPENSE_CATEGORIES.map((c) => {
                    const isSelected = category === c.name;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.name)}
                        className={`p-2.5 rounded-xl text-left transition flex items-center gap-2 ${
                          isSelected
                            ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                            : 'bg-[#0C1017] text-slate-300 hover:bg-[#182030] font-semibold'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="text-[11px] truncate">{c.name}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setCategory('custom')}
                    className={`p-2.5 rounded-xl text-left transition flex items-center gap-2 ${
                      category === 'custom'
                        ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                        : 'bg-[#0C1017] text-slate-300 hover:bg-[#182030] font-semibold'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="text-[11px] truncate">Özel Kategori</span>
                  </button>
                </div>

                {category === 'custom' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Kategori Adı Giriniz (Örn: Kırtasiye, Nakliye...)"
                    className="w-full mt-2 px-3.5 py-2.5 bg-[#0C1017] rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-medium"
                    required
                  />
                )}
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Masraf Tutarı (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-[#0C1017] rounded-xl text-sm font-black text-white placeholder:text-slate-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tarih *
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0C1017] rounded-xl text-xs font-bold text-slate-100 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Masraf Açıklaması
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Örn: Toptancı sebze ve meyve alımı"
                  className="w-full px-3.5 py-2.5 bg-[#0C1017] rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-medium"
                />
              </div>

              {/* Payment Method & Receipt No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Ödeme Yöntemi
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#0C1017] rounded-xl text-xs font-bold text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="cash">Nakit Kasa</option>
                    <option value="credit_card">Kredi Kartı / POS</option>
                    <option value="bank_transfer">Banka Havalesi / EFT</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Fiş / Fatura No (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    placeholder="A-12849"
                    className="w-full px-3.5 py-2.5 bg-[#0C1017] rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-slate-300 font-bold text-xs transition"
                >
                  İptal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-900 font-extrabold text-xs transition shadow-sm disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{submitting ? 'Kaydediliyor...' : editingExpense ? 'Güncelle' : 'Gideri Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
