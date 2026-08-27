import React, { useState, useEffect } from 'react';
import { 
  Calculator, Plus, Minus, Trash2, Printer, 
  Check, CreditCard, Banknote, RefreshCw
} from 'lucide-react';
import { Business, Category, Product, OrderItem, Table } from '../../types';
import { supabase } from '../../lib/supabase';
import { printKitchenTicket } from '../../lib/thermalPrinter';

interface ManualPosProps {
  business: Business;
}

export const ManualPos: React.FC<ManualPosProps> = ({ business }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  const [selectedTable, setSelectedTable] = useState<string>('Kasa Satışı');
  const [posItems, setPosItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPosData = async () => {
      setLoading(true);
      try {
        const [catsRes, prodsRes, tablesRes] = await Promise.all([
          supabase
            .from('categories')
            .select('*')
            .eq('business_id', business.id)
            .eq('is_active', true)
            .order('order_index', { ascending: true }),
          supabase
            .from('products')
            .select('*')
            .eq('business_id', business.id)
            .eq('is_active', true)
            .order('order_index', { ascending: true }),
          supabase
            .from('tables')
            .select('*')
            .eq('business_id', business.id)
            .order('created_at', { ascending: true }),
        ]);

        if (catsRes.data) {
          setCategories(catsRes.data as Category[]);
          if (catsRes.data.length > 0) setSelectedCatId(catsRes.data[0].id);
        }
        if (prodsRes.data) setProducts(prodsRes.data as Product[]);
        if (tablesRes.data) setTables(tablesRes.data as Table[]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosData();
  }, [business.id]);

  const addItemToPos = (prod: Product) => {
    setPosItems((prev) => {
      const existing = prev.find((item) => item.product_id === prod.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product_id: prod.id, name: prod.name, price: prod.price, quantity: 1 }];
    });
  };

  const updateItemQty = (prodId: string, delta: number) => {
    setPosItems((prev) =>
      prev
        .map((item) => {
          if (item.product_id === prodId) {
            const next = item.quantity + delta;
            return next > 0 ? { ...item, quantity: next } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const totalPosAmount = posItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCompleteOrder = async (paymentMethod: 'cash' | 'credit_card') => {
    if (posItems.length === 0) return;
    setSaving(true);

    try {
      const payload = {
        business_id: business.id,
        table_no: selectedTable,
        session_token: `pos_${Date.now()}`,
        order_source: 'pos',
        items: posItems,
        total_amount: totalPosAmount,
        status: 'paid',
        payment_method: paymentMethod,
        customer_notes: 'Manuel Kasa Girişi',
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        printKitchenTicket(business, data);
        setPosItems([]);
        alert('Adisyon başarıyla kapatıldı ve fiş yazdırıldı.');
      }
    } finally {
      setSaving(false);
    }
  };

  const currentCategoryProducts = products.filter((p) => p.category_id === selectedCatId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-[#111622] border border-[#1E2638] p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white">Manuel Kasa / POS Sistemi</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Garson veya kasa personeli için hızlı adisyon oluşturma ve doğrudan tahsilat ekranı.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Menu Selection */}
        <div className="lg:col-span-2 space-y-3">
          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-[#111622] border border-[#1E2638] text-slate-300 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
              <span>Yükleniyor...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {currentCategoryProducts.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => addItemToPos(prod)}
                  className="p-3 bg-[#111622] hover:bg-[#182030] active:scale-95 border border-[#1E2638] hover:border-indigo-500/40 rounded-2xl text-left transition flex flex-col justify-between h-24"
                >
                  <span className="font-bold text-xs text-white line-clamp-2">{prod.name}</span>
                  <span className="text-xs font-bold text-indigo-400">
                    {prod.price.toFixed(2)} ₺
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Current Receipt */}
        <div className="bg-[#111622] border border-[#1E2638] rounded-2xl p-4 flex flex-col justify-between shadow-xl h-[550px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638] mb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs text-white">Açık Adisyon</span>
              </div>

              {/* Table Selector */}
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-[#0B0E14] border border-[#1E2638] rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
              >
                <option value="Kasa Satışı">Kasa Satışı</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.table_no}>
                    {t.table_no}
                  </option>
                ))}
              </select>
            </div>

            {/* Receipt Items */}
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {posItems.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  Henüz ürün seçilmedi. Soldan ürünlere tıklayınız.
                </div>
              ) : (
                posItems.map((item) => (
                  <div
                    key={item.product_id}
                    className="p-2 bg-[#0B0E14] rounded-xl border border-[#1A2234] flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 pr-2 truncate">
                      <div className="font-medium text-slate-200 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {(item.price * item.quantity).toFixed(2)} ₺
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateItemQty(item.product_id, -1)}
                        className="w-5 h-5 rounded bg-[#182030] text-slate-300 flex items-center justify-center"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-5 text-center font-bold text-xs text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItemQty(item.product_id, 1)}
                        className="w-5 h-5 rounded bg-[#182030] text-slate-300 flex items-center justify-center"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Receipt Actions */}
          <div className="pt-3 border-t border-[#1E2638] space-y-3">
            <div className="flex justify-between items-center text-sm font-bold text-white">
              <span>Toplam Tutar:</span>
              <span className="text-indigo-400 text-base">{totalPosAmount.toFixed(2)} ₺</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={saving || posItems.length === 0}
                onClick={() => handleCompleteOrder('cash')}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Nakit Alındı</span>
              </button>

              <button
                disabled={saving || posItems.length === 0}
                onClick={() => handleCompleteOrder('credit_card')}
                className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Kredi Kartı / POS</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
