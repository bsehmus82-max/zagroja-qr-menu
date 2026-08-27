import React, { useState, useEffect } from 'react';
import { 
  Calculator, Plus, Minus, Trash2, Printer, 
  CheckCircle, Banknote, CreditCard, RefreshCw, ShoppingBag 
} from 'lucide-react';
import { Business, Table, Product, Category, Order } from '../../types';
import { supabase } from '../../lib/supabase';
import { printKitchenTicket } from '../../lib/thermalPrinter';

interface ManualPosProps {
  business: Business;
}

export const ManualPos: React.FC<ManualPosProps> = ({ business }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Current POS cart
  const [posCart, setPosCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit_card'>('cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInit = async () => {
      const [tRes, cRes, pRes] = await Promise.all([
        supabase.from('tables').select('*').eq('business_id', business.id),
        supabase.from('categories').select('*').eq('business_id', business.id).eq('is_active', true),
        supabase.from('products').select('*').eq('business_id', business.id).eq('is_active', true),
      ]);

      if (tRes.data && tRes.data.length > 0) {
        setTables(tRes.data as Table[]);
        setSelectedTable(tRes.data[0].table_no);
      }
      if (cRes.data && cRes.data.length > 0) {
        setCategories(cRes.data as Category[]);
        setSelectedCatId(cRes.data[0].id);
      }
      if (pRes.data) {
        setProducts(pRes.data as Product[]);
      }
    };

    fetchInit();
  }, [business.id]);

  const addToCart = (product: Product) => {
    if (product.is_frozen) return;
    setPosCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setPosCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id === productId) {
            const next = i.quantity + delta;
            return next > 0 ? { ...i, quantity: next } : null;
          }
          return i;
        })
        .filter(Boolean) as { product: Product; quantity: number }[]
    );
  };

  const totalAmount = posCart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const handleCompleteOrder = async (status: 'served' | 'paid') => {
    if (posCart.length === 0 || !selectedTable) return;

    setLoading(true);
    try {
      const orderItems = posCart.map((i) => ({
        product_id: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
        notes: '',
      }));

      const newOrder = {
        business_id: business.id,
        table_no: selectedTable,
        session_token: `pos_${Date.now()}`,
        order_source: 'pos',
        items: orderItems,
        total_amount: totalAmount,
        status: status,
        payment_method: status === 'paid' ? paymentType : 'unpaid',
        customer_notes: 'Kasa / POS Girişi',
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()
        .single();

      if (!error && data) {
        printKitchenTicket(business, data as Order);
        setPosCart([]);
        alert(status === 'paid' ? 'Tahsilat yapıldı ve fiş yazdırıldı.' : 'Sipariş mutfağa iletildi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentProducts = products.filter((p) =>
    selectedCatId ? p.category_id === selectedCatId : true
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Product & Category Selector */}
      <div className="lg:col-span-2 space-y-4">
        {/* Table Selector Bar */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-3xl flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-neutral-300">Sipariş Alınan Masa:</span>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-xs text-white rounded-2xl px-4 py-2.5 focus:outline-none focus:border-brand-500 font-bold"
          >
            {tables.map((t) => (
              <option key={t.id} value={t.table_no}>
                {t.table_no}
              </option>
            ))}
          </select>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCatId(c.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition ${
                selectedCatId === c.id
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[550px] overflow-y-auto pr-1">
          {currentProducts.map((prod) => (
            <button
              key={prod.id}
              disabled={prod.is_frozen}
              onClick={() => addToCart(prod)}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition h-28 ${
                prod.is_frozen
                  ? 'bg-neutral-950/40 border-neutral-800 opacity-50 cursor-not-allowed'
                  : 'bg-neutral-900 border-neutral-800 hover:border-brand-500/50 active:scale-98'
              }`}
            >
              <div>
                <h4 className="font-bold text-xs text-white truncate">{prod.name}</h4>
                {prod.is_frozen && (
                  <span className="text-[9px] text-amber-400 font-bold">Tükendi</span>
                )}
              </div>
              <div className="text-xs font-black text-brand-400">
                {prod.price.toFixed(2)} ₺
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Col: POS Ticket Cart & Payment */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between h-[650px]">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
            <div>
              <h3 className="font-black text-sm text-white">Adisyon Hesabı</h3>
              <span className="text-xs text-brand-400 font-bold">{selectedTable}</span>
            </div>
            {posCart.length > 0 && (
              <button
                onClick={() => setPosCart([])}
                className="text-neutral-500 hover:text-red-400 text-xs transition"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {posCart.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 text-xs">
                Sol taraftan ürün seçerek adisyona ekleyin.
              </div>
            ) : (
              posCart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <div className="font-bold text-white truncate">{item.product.name}</div>
                    <div className="text-[11px] text-neutral-400">
                      {(item.product.price * item.quantity).toFixed(2)} ₺
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQty(item.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-xs w-4 text-center text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.product.id, 1)}
                      className="w-6 h-6 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment & Submit Area */}
        <div className="pt-4 border-t border-neutral-800 space-y-4">
          <div className="flex items-center justify-between text-lg font-black text-white">
            <span>Toplam:</span>
            <span className="text-brand-400">{totalAmount.toFixed(2)} ₺</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentType('cash')}
              className={`py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                paymentType === 'cash'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Nakit</span>
            </button>

            <button
              onClick={() => setPaymentType('credit_card')}
              className={`py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                paymentType === 'credit_card'
                  ? 'bg-brand-600/20 border-brand-500 text-brand-400'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Kredi Kartı</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={loading || posCart.length === 0}
              onClick={() => handleCompleteOrder('served')}
              className="py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl text-xs transition disabled:opacity-50"
            >
              Açık Masa Bırak
            </button>

            <button
              disabled={loading || posCart.length === 0}
              onClick={() => handleCompleteOrder('paid')}
              className="py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              Tahsil Et & Fiş Yaz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
