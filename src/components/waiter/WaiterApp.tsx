import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Unlock, Search, Plus, Minus, Trash2, 
  Send, QrCode, AlertTriangle, RefreshCw, CheckCircle2, 
  Utensils, Users, LogOut, ChevronRight, MessageSquare 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { supabase, hashPassword } from '../../lib/supabase';
import { Business, Category, Product, Table, Order } from '../../types';

export const WaiterApp: React.FC = () => {
  const [deviceToken, setDeviceToken] = useState<string | null>(() => localStorage.getItem('restiva_waiter_device_token'));
  const [businessId, setBusinessId] = useState<string | null>(() => localStorage.getItem('restiva_waiter_biz_id'));
  const [business, setBusiness] = useState<Business | null>(null);

  // Auth / PIN state
  const [pin, setPin] = useState('');
  const [activeWaiter, setActiveWaiter] = useState<{ id: string; name: string } | null>(null);
  const [pinAttempts, setPinAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    const stored = localStorage.getItem('waiter_pin_lockout_until');
    return stored ? parseInt(stored, 10) : null;
  });
  const [lockTimeLeft, setLockTimeLeft] = useState<number>(0);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

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

  // Check Lockout timer
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= lockoutUntil) {
        setLockoutUntil(null);
        localStorage.removeItem('waiter_pin_lockout_until');
        setPinAttempts(0);
      } else {
        setLockTimeLeft(Math.ceil((lockoutUntil - now) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Load business & data if device token exists
  useEffect(() => {
    if (!businessId) return;

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
  }, [businessId]);

  // Handle PIN Keypad input
  const handleKeypadPress = (val: string) => {
    if (lockoutUntil && Date.now() < lockoutUntil) return;
    if (val === 'C') {
      setPin('');
      return;
    }
    if (val === 'DEL') {
      setPin((prev) => prev.slice(0, -1));
      return;
    }
    if (pin.length < 6) {
      const nextPin = pin + val;
      setPin(nextPin);
      if (nextPin.length >= 4) {
        verifyPin(nextPin);
      }
    }
  };

  const verifyPin = async (inputPin: string) => {
    if (!businessId || !deviceToken) return;

    try {
      setIsVerifyingPin(true);
      const pinHash = await hashPassword(inputPin);
      const { data, error } = await supabase.rpc('verify_waiter_pin', {
        p_business_id: businessId,
        p_device_token: deviceToken,
        p_pin_hash: pinHash,
      });

      if (error || !data || !data.success) {
        throw new Error(error?.message || 'PIN hatalı.');
      }

      setActiveWaiter({ id: data.waiter_id, name: data.waiter_name });
      setPin('');
      setPinAttempts(0);
      toast.success(`Hoş geldiniz, ${data.waiter_name}!`);
    } catch (err: any) {
      setPin('');
      const nextAttempts = pinAttempts + 1;
      setPinAttempts(nextAttempts);

      if (nextAttempts >= 3) {
        const lockTime = Date.now() + 5 * 60 * 1000; // 5 mins
        setLockoutUntil(lockTime);
        localStorage.setItem('waiter_pin_lockout_until', lockTime.toString());
        toast.error('3 kez hatalı PIN girildi! Terminal 5 dakika kilitlendi.');
      } else {
        toast.error(`Hatalı PIN! (Kalan Hak: ${3 - nextAttempts})`);
      }
    } finally {
      setIsVerifyingPin(false);
    }
  };

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
    if (!businessId || !deviceToken || !activeWaiter) {
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
        p_session_token: `waiter_${activeWaiter.id}_${Date.now()}`,
        p_device_token: deviceToken,
        p_waiter_id: activeWaiter.id,
      };

      const { data, error } = await supabase.rpc('create_customer_order', rpcPayload);

      if (error) throw error;

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {}

      toast.success(`${selectedTable} siparişi mutfağa ve yazıcıya iletildi!`);
      setCart([]);
      setOrderNotes('');
    } catch (err: any) {
      toast.error('Sipariş iletilemedi: ' + err.message);
    } finally {
      setIsSendingOrder(false);
    }
  };

  // 1. UNPAIRED DEVICE SCREEN
  if (!deviceToken || !businessId) {
    return (
      <div className="min-h-screen bg-[#090C10] flex items-center justify-center p-4 selection:bg-indigo-500/30 selection:text-indigo-200">
        <div className="w-full max-w-sm bg-[#12161F] border border-[#212634] rounded-3xl p-7 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-base font-black text-white">Cihaz Eşlenmemiş</h2>
          <p className="text-xs text-slate-400">
            Bu terminal henüz bir işletmeyle eşlenmemiştir. Lütfen kasadaki yetkili panelinden 
            <strong className="text-indigo-400"> "Yeni Cihaz Eşle (QR)"</strong> kodunu telefonunuzla okutunuz.
          </p>
          <div className="p-3 bg-[#090C10] rounded-2xl border border-[#212634] text-[11px] text-slate-500">
            QR okutulduktan sonra bu cihaz otomatik olarak işletmeye kilitlenecektir.
          </div>
        </div>
      </div>
    );
  }

  // 2. PIN AUTH SCREEN (LOCKED)
  if (!activeWaiter) {
    return (
      <div className="min-h-screen bg-[#090C10] flex items-center justify-center p-4 selection:bg-indigo-500/30 selection:text-indigo-200">
        <div className="w-full max-w-sm bg-[#12161F] border border-[#212634] rounded-3xl p-6 shadow-2xl text-center space-y-5">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Güvenli Garson Terminali
            </span>
          </div>

          <div>
            <h2 className="text-lg font-black text-white">{business?.name || 'Restiva Adisyon'}</h2>
            <p className="text-xs text-slate-400 mt-1">Lütfen kişisel PIN kodunuzu giriniz</p>
          </div>

          {/* Lockout Warning */}
          {lockoutUntil && Date.now() < lockoutUntil ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-1 animate-pulse">
              <AlertTriangle className="w-6 h-6 text-red-400 mx-auto" />
              <p className="text-xs font-bold text-red-400">Terminal Kilitlendi!</p>
              <p className="text-[11px] text-slate-400">Kalan Süre: {lockTimeLeft} saniye</p>
            </div>
          ) : (
            <>
              {/* PIN Dots Display */}
              <div className="flex justify-center items-center gap-3 py-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      pin.length > idx
                        ? 'bg-indigo-500 scale-110 shadow-lg shadow-indigo-500/50'
                        : 'bg-[#212634] border border-slate-700'
                    }`}
                  />
                ))}
              </div>

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto pt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'].map((val) => (
                  <button
                    key={val}
                    disabled={isVerifyingPin}
                    onClick={() => handleKeypadPress(val)}
                    className={`h-14 rounded-2xl font-extrabold text-base transition-all active:scale-95 flex items-center justify-center ${
                      val === 'C'
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs'
                        : val === 'DEL'
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 text-xs'
                        : 'bg-[#090C10] text-white hover:bg-slate-800 border border-[#212634] hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="text-[10px] text-slate-600">
            3 hatalı denemede cihaz 5 dakika kilitlenir.
          </div>
        </div>
      </div>
    );
  }

  // 3. WAITER POS WORKSPACE
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#090C10] text-slate-200 flex flex-col">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-30 bg-[#12161F] border-b border-[#212634] px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-indigo-600/30">
            {activeWaiter.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-black text-white">{activeWaiter.name}</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400">{business?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Table Selector Dropdown */}
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#090C10] border border-[#212634] text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
          >
            {tables.map((t) => (
              <option key={t.id} value={t.table_no}>
                {t.table_no}
              </option>
            ))}
          </select>

          <button
            onClick={() => setActiveWaiter(null)}
            title="Garson Değiştir / Kilitle"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <Lock className="w-4 h-4" />
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
              placeholder="Hızlı ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12161F] border border-[#212634] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>

          {/* Category Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-[#12161F] text-slate-400 hover:text-white border border-[#212634]'
              }`}
            >
              Tümü ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === c.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-[#12161F] text-slate-400 hover:text-white border border-[#212634]'
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
                  className={`relative p-3 rounded-2xl border transition-all cursor-pointer select-none active:scale-95 flex flex-col justify-between ${
                    product.is_frozen
                      ? 'bg-[#12161F]/40 border-red-500/20 opacity-50'
                      : inCart
                      ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                      : 'bg-[#12161F] border-[#212634] hover:border-slate-700'
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

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#212634]">
                    <span className="text-xs font-extrabold text-orange-400">
                      {product.price.toFixed(2)} ₺
                    </span>
                    <button className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right / Bottom Drawer: Active Cart */}
        <div className="w-full md:w-80 lg:w-96 bg-[#12161F] border-t md:border-t-0 md:border-l border-[#212634] p-4 flex flex-col justify-between shadow-2xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#212634]">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-black text-white uppercase tracking-wider">
                  {selectedTable} Sepeti ({cart.reduce((a, b) => a + b.quantity, 0)})
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1"
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
                    className="p-2.5 rounded-xl bg-[#090C10] border border-[#212634] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-200">{item.product.name}</h4>
                      <span className="text-xs font-extrabold text-orange-400">
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
                        className="w-36 px-2 py-1 rounded-lg bg-[#12161F] border border-[#212634] text-[10px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
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
                  placeholder="Masa Genel Notu (Örn: Çatal bıçak bol olsun)..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090C10] border border-[#212634] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Bottom Send Order Action */}
          <div className="pt-3 border-t border-[#212634] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Toplam Tutar:</span>
              <span className="text-base font-black text-white">{totalAmount.toFixed(2)} ₺</span>
            </div>

            <button
              onClick={handleSendOrder}
              disabled={cart.length === 0 || isSendingOrder}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 active:scale-95 text-white font-extrabold text-xs transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
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
