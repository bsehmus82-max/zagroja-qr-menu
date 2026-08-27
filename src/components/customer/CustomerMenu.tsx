import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Hand, Banknote, Wifi, Snowflake, 
  Plus, Search, Store, Clock, Phone, MapPin, Sparkles, Check
} from 'lucide-react';
import { Business, Category, Product, CartItem, Order, TemplateId } from '../../types';
import { supabase } from '../../lib/supabase';
import { ServiceActionsModal } from './ServiceActionsModal';
import { CartDrawer } from './CartDrawer';
import { OrderStatusTracker } from './OrderStatusTracker';

interface CustomerMenuProps {
  business: Business;
  initialTable?: string;
}

export const CustomerMenu: React.FC<CustomerMenuProps> = ({ business, initialTable }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Table session memory
  const [tableNo, setTableNo] = useState<string>(() => {
    if (initialTable) {
      localStorage.setItem(`zagroja_table_${business.id}`, initialTable);
      return initialTable;
    }
    return localStorage.getItem(`zagroja_table_${business.id}`) || '';
  });

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Service Modal state
  const [serviceModalType, setServiceModalType] = useState<'waiter' | 'bill' | 'wifi' | null>(null);

  // Load Menu Data
  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const [catsRes, prodsRes] = await Promise.all([
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
        ]);

        if (catsRes.data) {
          setCategories(catsRes.data as Category[]);
          if (catsRes.data.length > 0 && !selectedCatId) {
            setSelectedCatId(catsRes.data[0].id);
          }
        }
        if (prodsRes.data) {
          setProducts(prodsRes.data as Product[]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [business.id]);

  const addToCart = (product: Product) => {
    if (product.is_frozen) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (prodId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === prodId) {
            const next = item.quantity + delta;
            return next > 0 ? { ...item, quantity: next } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Template Theme Classes Helper
  const getThemeWrapperClass = (template: TemplateId) => {
    switch (template) {
      case 'dark_luxury':
        return 'bg-black text-neutral-100 selection:bg-amber-500 selection:text-black';
      case 'nordic':
        return 'bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white';
      case 'bistro':
        return 'bg-stone-950 text-amber-50 selection:bg-amber-600 selection:text-white';
      case 'neon':
        return 'bg-neutral-950 text-purple-100 selection:bg-purple-500 selection:text-white';
      case 'vintage':
        return 'bg-zinc-950 text-emerald-100 selection:bg-emerald-600 selection:text-white';
      case 'clean':
      default:
        return 'bg-neutral-950 text-neutral-100 selection:bg-brand-500 selection:text-white';
    }
  };

  const currentProducts = products
    .filter((p) => (selectedCatId ? p.category_id === selectedCatId : true))
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const selectedCategory = categories.find((c) => c.id === selectedCatId);

  return (
    <div className={`min-h-screen pb-32 ${getThemeWrapperClass(business.template_id)}`}>
      {/* Top Banner / Restaurant Info */}
      <header className="relative border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-30 px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              {business.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight text-white">{business.name}</h1>
              <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                {tableNo && (
                  <span className="font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                    {tableNo}
                  </span>
                )}
                <span>{business.working_hours || 'Açık'}</span>
              </div>
            </div>
          </div>

          {/* Wi-Fi Quick Button */}
          {business.wifi_ssid && (
            <button
              onClick={() => setServiceModalType('wifi')}
              className="p-2 rounded-2xl bg-neutral-900 border border-neutral-800 text-brand-400 hover:text-white transition"
              title="Wi-Fi Bilgisi"
            >
              <Wifi className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto p-4 space-y-5">
        {/* Live Order Tracker (Persists across reloads) */}
        <OrderStatusTracker businessId={business.id} tableNo={tableNo} />

        {/* Quick Service Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setServiceModalType('waiter')}
            className="py-3 px-4 bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/50 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-white transition active:scale-98 shadow-sm"
          >
            <Hand className="w-4 h-4 text-amber-400" />
            <span>Garson Çağır</span>
          </button>

          <button
            onClick={() => setServiceModalType('bill')}
            className="py-3 px-4 bg-neutral-900/90 border border-neutral-800 hover:border-brand-500/50 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-white transition active:scale-98 shadow-sm"
          >
            <Banknote className="w-4 h-4 text-brand-400" />
            <span>Hesap İste</span>
          </button>
        </div>

        {/* Search inside menu */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Menüde lezzet ara..."
            className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Categories Horizontal Slider (Only place where images are shown) */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5 px-1">
            Kategoriler
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`cursor-pointer rounded-2xl p-2 shrink-0 w-28 border transition text-center ${
                    isSelected
                      ? 'bg-brand-600/20 border-brand-500 ring-2 ring-brand-500/30'
                      : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="w-full h-16 rounded-xl bg-neutral-800 overflow-hidden mb-1.5 border border-white/10">
                    <img src={cat.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-[11px] text-white line-clamp-1">
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Products List (Content, Ingredients, Price & Add button - NO photos / NO kcal as requested) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-black text-sm text-white">
              {selectedCategory?.name || 'Tüm Lezzetler'}
            </span>
            <span className="text-xs text-neutral-400">
              {currentProducts.length} Çeşit
            </span>
          </div>

          {currentProducts.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs bg-neutral-900/40 border border-dashed border-neutral-800 rounded-3xl">
              Bu kategoride ürün bulunamadı.
            </div>
          ) : (
            currentProducts.map((prod) => (
              <div
                key={prod.id}
                className={`p-4 rounded-3xl border transition flex items-start justify-between gap-3 ${
                  prod.is_frozen
                    ? 'bg-neutral-950/40 border-neutral-800/80 opacity-60'
                    : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs text-white">{prod.name}</h3>
                    {prod.is_frozen && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Tükendi
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-relaxed mt-1">
                    {prod.description || 'Geleneksel lezzet.'}
                  </p>

                  <div className="text-xs font-black text-brand-400 mt-2">
                    {prod.price.toFixed(2)} ₺
                  </div>
                </div>

                <button
                  disabled={prod.is_frozen}
                  onClick={() => addToCart(prod)}
                  className={`p-2.5 rounded-2xl shrink-0 font-bold transition flex items-center justify-center ${
                    prod.is_frozen
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/30 active:scale-90'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40">
          <button
            onClick={() => setShowCart(true)}
            className="w-full py-4 px-5 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white rounded-3xl font-bold shadow-2xl shadow-brand-600/40 flex items-center justify-between transition transform active:scale-98 animate-bounce-subtle"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-xs">
                {totalCartCount}
              </div>
              <span className="text-xs">Siparişi Tamamla</span>
            </div>

            <span className="text-sm font-black">{totalCartPrice.toFixed(2)} ₺ →</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        business={business}
        tableNo={tableNo}
        cart={cart}
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onUpdateQty={updateCartQty}
        onOrderPlaced={() => setCart([])}
      />

      {/* Service Modal */}
      <ServiceActionsModal
        business={business}
        tableNo={tableNo}
        isOpen={serviceModalType !== null}
        type={serviceModalType}
        onClose={() => setServiceModalType(null)}
      />
    </div>
  );
};
