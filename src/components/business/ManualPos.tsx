import React, { useState, useEffect } from 'react';
import { 
  Calculator, Plus, Minus, Trash2, Printer, 
  Check, CreditCard, Banknote, RefreshCw, ShoppingBag
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

  const handleCheckout = async (paymentMethod: 'cash' | 'credit_card', sendToKitchen: boolean) => {
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection Area (2 Columns) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedCatId === cat.id
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-xs">
            Ürünler yükleniyor...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {currentCategoryProducts.map((prod) => (
              <button
                key={prod.id}
                onClick={() => addItemToCart(prod)}
                disabled={prod.is_frozen}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-28 shadow-sm ${
                  prod.is_frozen
                    ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                    : 'bg-white border-slate-200/90 hover:border-orange-500 hover:shadow-md active:scale-95'
                }`}
              >
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 line-clamp-2">
                    {prod.name}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="font-extrabold text-xs text-orange-600">
                    {prod.price.toFixed(2)} ₺
                  </span>
                  <span className="w-5 h-5 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-extrabold text-xs">
                    +
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart & Checkout Panel (1 Column) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900">Adisyon / POS Masası</h3>
            <button
              onClick={() => setPosItems([])}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
            >
              Temizle
            </button>
          </div>

          {/* Table Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Masa Seçimi</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none"
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
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {posItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Sepet boş. Ürünlere tıklayarak ekleyin.
              </div>
            ) : (
              posItems.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900">{item.name}</h5>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {item.price.toFixed(2)} ₺ x {item.quantity} = {(item.price * item.quantity).toFixed(2)} ₺
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-xs w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
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
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600 text-xs">Toplam Tutar:</span>
            <span className="font-extrabold text-lg text-orange-600">
              {totalAmount.toFixed(2)} ₺
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCheckout('cash', false)}
              disabled={saving || posItems.length === 0}
              className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Banknote className="w-4 h-4" />
              <span>Nakit Tahsilat</span>
            </button>

            <button
              onClick={() => handleCheckout('credit_card', false)}
              disabled={saving || posItems.length === 0}
              className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <CreditCard className="w-4 h-4" />
              <span>POS / Kart</span>
            </button>
          </div>

          <button
            onClick={() => handleCheckout('cash', true)}
            disabled={saving || posItems.length === 0}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <span>Mutfağa Gönder (Adisyon Aç)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
