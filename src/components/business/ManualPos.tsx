import React, { useState, useEffect } from 'react';
import { 
  Calculator, Plus, Minus, Trash2, Printer, 
  Banknote, CreditCard, Check, Search, Utensils
} from 'lucide-react';
import { Business, Category, Product, Table, OrderItem } from '../../types';
import { supabase } from '../../lib/supabase';
import { printThermalReceipt } from '../../lib/thermalPrinter';

interface ManualPosProps {
  business: Business;
}

export const ManualPos: React.FC<ManualPosProps> = ({ business }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Cart
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [customerNotes, setCustomerNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [tRes, cRes, pRes] = await Promise.all([
        supabase.from('tables').select('*').eq('business_id', business.id).order('created_at'),
        supabase.from('categories').select('*').eq('business_id', business.id).order('order_index'),
        supabase.from('products').select('*').eq('business_id', business.id).order('order_index'),
      ]);

      if (tRes.data) {
        setTables(tRes.data as Table[]);
        if (tRes.data.length > 0) setSelectedTable(tRes.data[0].table_no);
      }
      if (cRes.data) {
        setCategories(cRes.data as Category[]);
        if (cRes.data.length > 0) setSelectedCatId(cRes.data[0].id);
      }
      if (pRes.data) setProducts(pRes.data as Product[]);
    };

    fetchData();
  }, [business.id]);

  const addToCart = (prod: Product) => {
    setCart((prev) => {
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
          quantity: 1,
          price: prod.price,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async (paymentMethod: 'unpaid' | 'cash' | 'credit_card') => {
    if (!selectedTable || cart.length === 0) return;

    setSaving(true);
    try {
      const orderPayload = {
        business_id: business.id,
        table_no: selectedTable,
        order_source: 'manual_pos',
        items: cart,
        total_amount: totalAmount,
        status: paymentMethod === 'unpaid' ? 'preparing' : 'paid',
        payment_method: paymentMethod,
        customer_notes: customerNotes.trim(),
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (!error && data) {
        // Print receipt
        printThermalReceipt(data, business);
        setCart([]);
        setCustomerNotes('');
        alert(`Masa ${selectedTable} için sipariþ/hesap baþarýyla kaydedildi!`);
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products
    .filter((p) => (selectedCatId ? p.category_id === selectedCatId : true))
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Kasa & Manuel POS Ekraný</h2>
        <p className="text-xs text-neutral-400">
          QR okutamayan müþteriler için hýzlý adisyon açma, sipariþ girme ve anýnda hesap tahsilatý.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Menu and Table Selector */}
        <div className="lg:col-span-2 space-y-4">
          {/* Table Selector */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-2">
              Ýþlem Yapýlacak Masa Seçimi
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {tables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTable(t.table_no)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    selectedTable === t.table_no
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {t.table_no}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Selector */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCatId(c.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition ${
                  selectedCatId === c.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => !prod.is_frozen && addToCart(prod)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  prod.is_frozen
                    ? 'bg-neutral-950/40 border-neutral-800 opacity-50 cursor-not-allowed'
                    : 'bg-neutral-900 border-neutral-800 hover:border-brand-500 hover:bg-neutral-850'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-white">{prod.name}</div>
                  <div className="text-[10px] text-neutral-500 line-clamp-2 mt-1">
                    {prod.description}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-black text-xs text-brand-400">{prod.price.toFixed(2)} ?</span>
                  <span className="p-1.5 rounded-lg bg-neutral-800 text-white">
                    <Plus className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Current Table Order / POS Cart */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between min-h-[550px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
              <div>
                <span className="text-xs text-neutral-400">Seçili Masa</span>
                <h3 className="font-black text-lg text-white">{selectedTable || 'Masa Seçiniz'}</h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 font-bold">
                {cart.length} Kalem
              </span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-72 overflow-y-auto mb-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-neutral-500 text-xs">
                  Soldaki menüden ürün seçerek adisyona ekleyebilirsiniz.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between p-2.5 bg-neutral-950 rounded-2xl border border-neutral-800/80 text-xs"
                  >
                    <div className="flex-1 pr-2 truncate">
                      <div className="font-bold text-white truncate">{item.name}</div>
                      <div className="text-[10px] text-brand-400 font-bold">
                        {(item.price * item.quantity).toFixed(2)} ?
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="w-6 h-6 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-white text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="w-6 h-6 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total */}
            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800/80 mb-4">
              <div className="flex items-center justify-between text-base font-black text-white">
                <span>GENEL TOPLAM:</span>
                <span className="text-brand-400">{totalAmount.toFixed(2)} ?</span>
              </div>
            </div>
          </div>

          {/* POS Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-neutral-800">
            <button
              disabled={saving || cart.length === 0}
              onClick={() => handleSubmitOrder('unpaid')}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-40"
            >
              <Printer className="w-4 h-4" />
              Sipariþi Kaydet & Adisyon Yazdýr
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={saving || cart.length === 0}
                onClick={() => handleSubmitOrder('cash')}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
              >
                <Banknote className="w-3.5 h-3.5" />
                Nakit Tahsil Et
              </button>
              <button
                disabled={saving || cart.length === 0}
                onClick={() => handleSubmitOrder('credit_card')}
                className="py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
              >
                <CreditCard className="w-3.5 h-3.5" />
                POS / Kart Tahsil Et
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
