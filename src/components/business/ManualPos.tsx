import React, { useState, useEffect } from 'react';
import { 
  Calculator, Plus, Minus, Trash2, Printer, 
  Check, CreditCard, Banknote, Landmark, RefreshCw, ShoppingBag
} from 'lucide-react';
import { Business, Category, Product, OrderItem, Table } from '../../types';
import { supabase } from '../../lib/supabase';
import { printKitchenTicket } from '../../lib/thermalPrinter';
import { useToast } from '../../context/ToastContext';

interface ManualPosProps {
  business: Business;
}

export const ManualPos: React.FC<ManualPosProps> = ({ business }) => {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  const [selectedTable, setSelectedTable] = useState<string>('Kasa Satışı');
  const [posItems, setPosItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

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

  const addItemToCart = (prod: Product) => {
    if (prod.is_frozen) {
      toast.warning(`${prod.name} ürünü dondurulmuş (tükendi).`);
      return;
    }

    setPosItems((prev) => {
      const existing = prev.find((item) => item.product_id === prod.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          product_id: prod.id,
          name: prod.name,
          price: prod.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQty = (prodId: string, delta: number) => {
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

  const totalAmount = posItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async (paymentMethod: 'cash' | 'credit_card' | 'other', sendToKitchen: boolean) => {
    if (posItems.length === 0) {
      toast.warning('Lütfen sepete en az 1 ürün ekleyiniz.');
      return;
    }

    setSaving(true);
    try {
      const orderPayload = {
        business_id: business.id,
        table_no: selectedTable,
        session_token: `pos_${Date.now()}`,
        order_source: 'pos',
        items: posItems,
        total_amount: totalAmount,
        status: sendToKitchen ? 'preparing' : 'paid',
        payment_method: paymentMethod,
        customer_notes: 'Kasa / POS manuel giriş',
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (!error && data) {
        if (sendToKitchen) {
          printKitchenTicket(business, data);
        }
        toast.success(`Sipariş başarıyla kaydedildi (${totalAmount.toFixed(2)} ₺)`);
        setPosItems([]);
      } else {
        toast.error('Sipariş kaydedilirken bir hata oluştu.');
      }
    } finally {
      setSaving(false);
    }
  };

  const currentCategoryProducts = products.filter((p) => p.category_id === selectedCatId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-medium text-slate-200">
      {/* Product Selection Area (2 Columns) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 ${
                selectedCatId === cat.id
                  ? 'bg-white/20 text-white border border-white/25 shadow-sm'
                  : 'bg-[#111622] text-slate-400 hover:text-slate-100 hover:bg-[#182030] border border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="bg-[#111622] rounded-3xl p-12 text-center text-slate-400 text-xs font-bold shadow-md">
            Ürünler yükleniyor...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {currentCategoryProducts.map((prod) => (
              <button
                key={prod.id}
                onClick={() => addItemToCart(prod)}
                disabled={prod.is_frozen}
                onMouseMove={handleSpotlightMove}
                className={`p-4 rounded-3xl text-left transition flex flex-col justify-between h-32 shadow-lg spotlight-card spotlight-glow ${
                  prod.is_frozen
                    ? 'bg-[#111622]/40 opacity-40 cursor-not-allowed'
                    : 'bg-[#111622] hover:bg-[#161E2E] active:scale-95'
                }`}
              >
                <div>
                  <h4 className="font-extrabold text-xs text-slate-100 line-clamp-2">
                    {prod.name}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1F293D]/60">
                  <span className="font-black text-xs text-white">
                    {prod.price.toFixed(2)} ₺
                  </span>
                  <span className="w-6 h-6 rounded-xl bg-[#1C2433] text-white flex items-center justify-center font-extrabold text-xs">
                    +
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart & Checkout Panel (1 Column) */}
      <div className="bg-[#111622] rounded-3xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="font-extrabold text-sm text-slate-100">Adisyon / POS Masası</h3>
            <button
              onClick={() => setPosItems([])}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
            >
              Temizle
            </button>
          </div>

          {/* Table Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Masa Seçimi</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Kasa Satışı">Kasa Satışı (Ayakta / Paket)</option>
              {tables.map((t) => (
                <option key={t.id} value={t.table_no}>
                  {t.table_no}
                </option>
              ))}
            </select>
          </div>

          {/* Items List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {posItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-medium">
                Sepet boş. Ürünlere tıklayarak ekleyin.
              </div>
            ) : (
              posItems.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between p-3 bg-[#0C1017] rounded-2xl"
                >
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-200">{item.name}</h5>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {item.price.toFixed(2)} ₺ x {item.quantity} = {(item.price * item.quantity).toFixed(2)} ₺
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      className="w-6 h-6 rounded-lg bg-[#1C2433] hover:bg-[#253043] text-slate-200 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-xs w-4 text-center text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      className="w-6 h-6 rounded-lg bg-[#1C2433] hover:bg-[#253043] text-slate-200 flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total & Checkout Buttons */}
        <div className="pt-3 border-t border-[#1F293D]/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-400 text-xs">Toplam Tutar:</span>
            <span className="font-black text-lg text-white">
              {totalAmount.toFixed(2)} ₺
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleCheckout('cash', false)}
              disabled={saving || posItems.length === 0}
              onMouseMove={handleSpotlightMove}
              className="py-3 bg-[#1C2433] hover:bg-[#253043] text-white font-bold text-xs rounded-2xl shadow-sm transition flex flex-col items-center justify-center gap-1 disabled:opacity-40 spotlight-card spotlight-glow"
            >
              <Banknote className="w-4 h-4 text-slate-300" />
              <span>Nakit</span>
            </button>

            <button
              onClick={() => handleCheckout('credit_card', false)}
              disabled={saving || posItems.length === 0}
              onMouseMove={handleSpotlightMove}
              className="py-3 bg-[#1C2433] hover:bg-[#253043] text-white font-bold text-xs rounded-2xl shadow-sm transition flex flex-col items-center justify-center gap-1 disabled:opacity-40 spotlight-card spotlight-glow"
            >
              <CreditCard className="w-4 h-4 text-slate-300" />
              <span>POS / Kart</span>
            </button>

            <button
              onClick={() => handleCheckout('other', false)}
              disabled={saving || posItems.length === 0}
              onMouseMove={handleSpotlightMove}
              className="py-3 bg-[#1C2433] hover:bg-[#253043] text-white font-bold text-xs rounded-2xl shadow-sm transition flex flex-col items-center justify-center gap-1 disabled:opacity-40 spotlight-card spotlight-glow"
            >
              <Landmark className="w-4 h-4 text-slate-300" />
              <span>Diğer (IBAN)</span>
            </button>
          </div>

          <button
            onClick={() => handleCheckout('cash', true)}
            disabled={saving || posItems.length === 0}
            onMouseMove={handleSpotlightMove}
            className="w-full py-3 bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-98 shadow-md spotlight-card spotlight-glow"
          >
            <span>Mutfağa Gönder (Adisyon Aç)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
