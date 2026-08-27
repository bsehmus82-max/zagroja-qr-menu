import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Search, Plus, Minus, Trash2, 
  Send, RefreshCw, CheckCircle2, Utensils, LogOut, Download
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { Business, Category, Product, Table } from '../../types';

export const WaiterApp: React.FC = () => {
  const toast = useToast();
  const [deviceToken, setDeviceToken] = useState<string | null>(() => localStorage.getItem('restiva_waiter_device_token'));
  const [businessId, setBusinessId] = useState<string | null>(() => localStorage.getItem('restiva_waiter_biz_id'));
  const [waiterName, setWaiterName] = useState<string>(() => localStorage.getItem('restiva_waiter_name') || 'Garson');
  const [business, setBusiness] = useState<Business | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [isApproved, setIsApproved] = useState<boolean>(false);

  // POS State
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<{ product: Product; quantity: number; notes: string }[]>([]);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Set browser tab title to [BusinessName] • Garson Paneli
  useEffect(() => {
    document.title = business?.name ? `${business.name} • Garson Paneli` : 'Silvana • Garson Paneli';
  }, [business?.name]);

  // Check device validity on mount
  useEffect(() => {
    if (!deviceToken) {
      setIsVerifying(false);
      setIsApproved(false);
      return;
    }

    const verifyDevice = async () => {
      try {
        setIsVerifying(true);
        const { data, error } = await supabase.rpc('check_device_pairing_status', {
          p_device_token: deviceToken,
        });

        if (error || !data || data.status !== 'approved' || !data.is_trusted) {
          localStorage.removeItem('restiva_waiter_device_token');
          setDeviceToken(null);
          setIsApproved(false);
        } else {
          setIsApproved(true);
          if (data.waiter_name) {
            setWaiterName(data.waiter_name);
            localStorage.setItem('restiva_waiter_name', data.waiter_name);
          }
          if (data.business_id && data.business_id !== businessId) {
            setBusinessId(data.business_id);
            localStorage.setItem('restiva_waiter_biz_id', data.business_id);
          }
        }
      } catch {
        // Network fallback
      } finally {
        setIsVerifying(false);
      }
    };

    verifyDevice();
  }, [deviceToken]);

  // Load business & products if device is approved
  useEffect(() => {
    if (!businessId || !isApproved) return;

    const fetchBusiness = async () => {
      try {
        setLoadingData(true);
        const [bRes, cRes, pRes, tRes] = await Promise.all([
          supabase.from('businesses').select('*').eq('id', businessId).single(),
          supabase.from('categories').select('*').eq('business_id', businessId).eq('is_active', true).order('order_index'),
          supabase.from('products').select('*').eq('business_id', businessId).eq('is_active', true).order('order_index'),
          supabase.from('tables').select('*').eq('business_id', businessId).order('table_no'),
        ]);

        if (bRes.data) setBusiness(bRes.data);
        if (cRes.data) setCategories(cRes.data);
        if (pRes.data) setProducts(pRes.data);
        if (tRes.data) {
          setTables(tRes.data);
          if (tRes.data.length > 0 && !selectedTable) {
            setSelectedTable(tRes.data[0].table_no);
          }
        }
      } catch (err) {
        console.error('Veri yüklenemedi:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchBusiness();
  }, [businessId, isApproved]);

  const handleAddToCart = (product: Product) => {
    if (product.is_frozen) {
      toast.error('Bu ürün şu an tükendi!');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [{ product, quantity: 1, notes: '' }, ...prev];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number; notes: string }[]
    );
  };

  const handleUpdateItemNote = (productId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, notes: note } : item))
    );
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleSendOrder = async () => {
    if (cart.length === 0) {
      toast.error('Sepete henüz ürün eklemediniz.');
      return;
    }
    if (!selectedTable) {
      toast.error('Lütfen bir masa seçiniz.');
      return;
    }
    if (!businessId || !deviceToken) {
      toast.error('Oturum bilgisi eksik.');
      return;
    }

    try {
      setIsSendingOrder(true);
      const rpcPayload = {
        p_business_id: businessId,
        p_table_no: selectedTable,
        p_items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          notes: item.notes.trim(),
        })),
        p_customer_notes: orderNotes.trim(),
        p_order_source: 'waiter',
        p_session_token: `waiter_${Date.now()}`,
        p_device_token: deviceToken,
      };

      const { data, error } = await supabase.rpc('create_customer_order', rpcPayload);

      if (error) throw error;

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {}

      toast.success(`${selectedTable} siparişi mutfağa iletildi! (${waiterName})`);
      setCart([]);
      setOrderNotes('');
    } catch (err: any) {
      toast.error('Sipariş iletilemedi: ' + err.message);
    } finally {
      setIsSendingOrder(false);
    }
  };

  // 1. VERIFYING LOADING SCREEN
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Garson Terminali Doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  // 2. UNPAIRED DEVICE SCREEN
  if (!isApproved || !deviceToken || !businessId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-indigo-600 selection:text-white">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-base font-black text-white">Cihaz Yetkisi Yok</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Bu telefon henüz işletme kasasından onaylanmamıştır. Lütfen kasadaki yetkili panelinden 
            <strong className="text-indigo-400"> "Garson Eşleme QR Kodu"</strong>nu okutunuz.
          </p>
          <a
            href="/pair-waiter"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition block"
          >
            <span>Eşleme Talebi Ekranına Git</span>
          </a>
        </div>
      </div>
    );
  }

  // 3. DIRECT POS WORKSPACE (NO PIN REQUIRED)
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-indigo-600/30">
            {waiterName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-black text-white">{waiterName}</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400">{business?.name || 'Restiva Adisyon'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Table Selector Dropdown */}
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
          >
            {tables.map((t) => (
              <option key={t.id} value={t.table_no}>
                {t.table_no}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              if (confirm('Bu cihazın eşleşmesini sıfırlamak istiyor musunuz?')) {
                localStorage.removeItem('restiva_waiter_device_token');
                setDeviceToken(null);
                setIsApproved(false);
              }
            }}
            title="Oturumu Sıfırla"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Split Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left / Top: Categories & Products Grid */}
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 pb-28 md:pb-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>

          {/* Category Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Tümü ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === c.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map((product) => {
              const inCart = cart.find((i) => i.product.id === product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className={`relative p-3 rounded-2xl border transition cursor-pointer select-none active:scale-95 flex flex-col justify-between ${
                    product.is_frozen
                      ? 'bg-slate-900/40 border-red-500/20 opacity-50'
                      : inCart
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow">
                      {inCart.quantity}
                    </span>
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-white line-clamp-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{product.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
                    <span className="text-xs font-extrabold text-amber-400">
                      {product.price.toFixed(2)} ₺
                    </span>
                    <button className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right / Bottom Drawer: Active Cart */}
        <div className="w-full md:w-80 lg:w-96 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 flex flex-col justify-between shadow-2xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-black text-white uppercase tracking-wider">
                  {selectedTable} Sepeti ({cart.reduce((a, b) => a + b.quantity, 0)})
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Temizle
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-64 md:max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Henüz ürün eklenmedi.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-200">{item.product.name}</h4>
                      <span className="text-xs font-extrabold text-amber-400">
                        {(item.product.price * item.quantity).toFixed(2)} ₺
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Not (Örn: Az pişmiş)..."
                        value={item.notes}
                        onChange={(e) => handleUpdateItemNote(item.product.id, e.target.value)}
                        className="w-36 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* General Order Note */}
            {cart.length > 0 && (
              <div>
                <input
                  type="text"
                  placeholder="Masa Notu..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Bottom Send Order Action */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Toplam Tutar:</span>
              <span className="text-base font-black text-white">{totalAmount.toFixed(2)} ₺</span>
            </div>

            <button
              onClick={handleSendOrder}
              disabled={cart.length === 0 || isSendingOrder}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 active:scale-95 text-white font-extrabold text-xs transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSendingOrder ? 'Mutfağa İletiliyor...' : `${selectedTable} Siparişini Gönder`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
