import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Hand, Banknote, Wifi, Snowflake, 
  Plus, Search, Clock, Sparkles, Check, ChevronRight
} from 'lucide-react';
import { Business, Category, Product, CartItem, TemplateId } from '../../types';
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
  const [tableNo] = useState<string>(() => {
    if (initialTable) {
      localStorage.setItem(`tbl_session_${business.id}`, initialTable);
      return initialTable;
    }
    return localStorage.getItem(`tbl_session_${business.id}`) || '';
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

  // Template Theme Configuration
  const getThemeConfig = (template: TemplateId) => {
    switch (template) {
      case 'dark_luxury':
        return {
          bg: 'bg-[#040404]',
          headerBg: 'bg-[#0A0A0A]/90 border-[#2A2315]',
          cardBg: 'bg-[#0E0D0A] border-[#221C11] hover:border-[#4A3E26]',
          activePill: 'bg-[#D4AF37] text-black shadow-lg shadow-amber-500/20 font-bold',
          inactivePill: 'bg-[#14120E] border-[#2A2315] text-[#A69980] hover:text-white',
          priceColor: 'text-[#F5D061]',
          btnBg: 'bg-[#D4AF37] hover:bg-[#E5C158] text-black shadow-md shadow-amber-500/20',
          accentText: 'text-[#D4AF37]',
          fontFamily: 'font-sans',
        };
      case 'nordic':
        return {
          bg: 'bg-[#090E17]',
          headerBg: 'bg-[#0F1726]/90 border-[#1C2A40]',
          cardBg: 'bg-[#111A2C] border-[#1E2E47] hover:border-[#2C4366]',
          activePill: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-semibold',
          inactivePill: 'bg-[#131E31] border-[#1E2E47] text-slate-400 hover:text-white',
          priceColor: 'text-emerald-400',
          btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20',
          accentText: 'text-emerald-400',
          fontFamily: 'font-sans',
        };
      case 'bistro':
        return {
          bg: 'bg-[#0E0B09]',
          headerBg: 'bg-[#17110E]/90 border-[#2B1D14]',
          cardBg: 'bg-[#19130F] border-[#2D1F16] hover:border-[#4D3425]',
          activePill: 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 font-semibold',
          inactivePill: 'bg-[#1C1410] border-[#2D1F16] text-[#A8988D] hover:text-white',
          priceColor: 'text-amber-400',
          btnBg: 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20',
          accentText: 'text-amber-400',
          fontFamily: 'font-sans',
        };
      case 'neon':
        return {
          bg: 'bg-[#070814]',
          headerBg: 'bg-[#0D1026]/90 border-[#222752]',
          cardBg: 'bg-[#0E112B] border-[#222854] hover:border-[#38418A]',
          activePill: 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-lg shadow-cyan-500/25 font-bold',
          inactivePill: 'bg-[#121536] border-[#222854] text-slate-400 hover:text-white',
          priceColor: 'text-cyan-400',
          btnBg: 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:opacity-90 text-white shadow-md shadow-cyan-500/20',
          accentText: 'text-cyan-400',
          fontFamily: 'font-sans',
        };
      case 'vintage':
        return {
          bg: 'bg-[#050E09]',
          headerBg: 'bg-[#0B1A12]/90 border-[#193625]',
          cardBg: 'bg-[#0D2117] border-[#183B2A] hover:border-[#285E43]',
          activePill: 'bg-[#C5A059] text-[#050E09] shadow-lg shadow-yellow-600/20 font-bold',
          inactivePill: 'bg-[#0E261A] border-[#183B2A] text-[#93AC9F] hover:text-white',
          priceColor: 'text-[#E2C376]',
          btnBg: 'bg-[#C5A059] hover:bg-[#D4B36E] text-[#050E09] font-bold shadow-md',
          accentText: 'text-[#C5A059]',
          fontFamily: 'font-sans',
        };
      case 'clean':
      default:
        return {
          bg: 'bg-[#080B10]',
          headerBg: 'bg-[#10141E]/90 border-[#1E2638]',
          cardBg: 'bg-[#111724] border-[#1D273B] hover:border-[#2E3C59]',
          activePill: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold',
          inactivePill: 'bg-[#131A29] border-[#1E283D] text-slate-400 hover:text-white',
          priceColor: 'text-indigo-400',
          btnBg: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20',
          accentText: 'text-indigo-400',
          fontFamily: 'font-sans',
        };
    }
  };

  const theme = getThemeConfig(business.template_id);

  const currentProducts = products
    .filter((p) => (selectedCatId ? p.category_id === selectedCatId : true))
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const selectedCategory = categories.find((c) => c.id === selectedCatId);

  return (
    <div className={`min-h-screen pb-32 text-slate-100 antialiased ${theme.bg} ${theme.fontFamily}`}>
      {/* Sticky Header Bar */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-xl px-4 py-3 ${theme.headerBg}`}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {business.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h1 className="font-bold text-xs tracking-tight text-white">{business.name}</h1>
              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                {tableNo && (
                  <span className="font-semibold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    {tableNo}
                  </span>
                )}
                <span>{business.working_hours || 'Açık'}</span>
              </div>
            </div>
          </div>

          {/* Wi-Fi Action Button */}
          {(business.show_wifi ?? true) && business.wifi_ssid && (
            <button
              onClick={() => setServiceModalType('wifi')}
              className="p-2 rounded-xl bg-[#182030]/80 border border-[#26334D] text-slate-300 hover:text-white transition active:scale-95"
              title="Wi-Fi Bilgisi"
            >
              <Wifi className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Real-time Order Tracker Bar (if active orders exist) */}
        <OrderStatusTracker businessId={business.id} tableNo={tableNo} />

        {/* Quick Service Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setServiceModalType('waiter')}
            className="py-2.5 px-3 bg-[#111622]/80 border border-[#1E2638] hover:border-amber-500/40 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-200 transition active:scale-98 shadow-sm"
          >
            <Hand className="w-3.5 h-3.5 text-amber-400" />
            <span>Garson Çağır</span>
          </button>

          <button
            onClick={() => setServiceModalType('bill')}
            className="py-2.5 px-3 bg-[#111622]/80 border border-[#1E2638] hover:border-emerald-500/40 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-200 transition active:scale-98 shadow-sm"
          >
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hesap İste</span>
          </button>
        </div>

        {/* Instant Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Menüde lezzet ara..."
            className="w-full bg-[#111622]/80 border border-[#1E2638] focus:border-indigo-500/50 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition"
          />
        </div>

        {/* Category Horizontal Slider (Only place with visual covers) */}
        <div>
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`cursor-pointer rounded-2xl p-2 shrink-0 w-24 border transition text-center ${
                    isSelected ? theme.activePill : theme.inactivePill
                  }`}
                >
                  <div className="w-full h-14 rounded-xl overflow-hidden mb-1.5 border border-white/10 bg-black/40">
                    <img src={cat.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-semibold text-[10px] line-clamp-1 block">
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Products List (Content, Ingredients, Price & Add button - NO photos / NO kcal as requested) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="font-bold text-xs text-slate-200">
              {selectedCategory?.name || 'Tüm Ürünler'}
            </span>
            <span className="text-[11px] text-slate-500">
              {currentProducts.length} Çeşit
            </span>
          </div>

          {currentProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs bg-[#111622]/40 border border-dashed border-[#1E2638] rounded-2xl">
              Bu kategoride ürün bulunmuyor.
            </div>
          ) : (
            currentProducts.map((prod) => (
              <div
                key={prod.id}
                className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                  prod.is_frozen
                    ? 'bg-[#0B0E14]/40 border-[#1A2234] opacity-50'
                    : theme.cardBg
                }`}
              >
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs text-slate-100 truncate">{prod.name}</h3>
                    {prod.is_frozen && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Tükendi
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1 line-clamp-2">
                    {prod.description || 'Özel hazırlanmış lezzet.'}
                  </p>

                  <div className={`text-xs font-bold mt-1.5 ${theme.priceColor}`}>
                    {prod.price.toFixed(2)} ₺
                  </div>
                </div>

                <button
                  disabled={prod.is_frozen}
                  onClick={() => addToCart(prod)}
                  className={`p-2 rounded-xl shrink-0 transition flex items-center justify-center ${
                    prod.is_frozen
                      ? 'bg-[#182030] text-slate-600 cursor-not-allowed'
                      : `${theme.btnBg} active:scale-90`
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
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
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-between transition transform active:scale-98 animate-float-subtle"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                {totalCartCount}
              </div>
              <span className="text-xs font-semibold">Sepeti Görüntüle</span>
            </div>

            <span className="text-xs font-bold">{totalCartPrice.toFixed(2)} ₺ →</span>
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
