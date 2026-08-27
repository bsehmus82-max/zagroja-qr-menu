import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Hand, Banknote, Wifi, Snowflake, 
  Plus, Search, UtensilsCrossed, Sparkles, Check, ChevronRight, Smartphone
} from 'lucide-react';
import { Business, Category, Product, CartItem, Order } from '../../types';
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
  const [selectedCatId, setSelectedCatId] = useState<string | 'all'>('all');
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

  // Active Order Tracker state
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);

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

  // Load Active Orders for tracking
  useEffect(() => {
    const fetchMyActiveOrders = async () => {
      const storedOrderIds = JSON.parse(localStorage.getItem('my_active_orders') || '[]');
      if (storedOrderIds.length === 0) return;

      const { data } = await supabase
        .from('orders')
        .select('*')
        .in('id', storedOrderIds)
        .in('status', ['pending', 'preparing', 'served']);

      if (data) setActiveOrders(data as Order[]);
    };

    fetchMyActiveOrders();
    const interval = setInterval(fetchMyActiveOrders, 10000);
    return () => clearInterval(interval);
  }, []);

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

  const currentProducts = products
    .filter((p) => (selectedCatId === 'all' ? true : p.category_id === selectedCatId))
    .filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const defaultBanner = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-800 antialiased flex justify-center selection:bg-orange-500 selection:text-white">
      {/* Mobile Screen Shell Container on Desktop / PC */}
      <div className="w-full max-w-md min-h-screen bg-[#F8FAFC] relative pb-28 shadow-[0_0_60px_rgba(0,0,0,0.6)] border-x border-slate-800/50 flex flex-col justify-between">
        <div>
          {/* Hero Header with Banner */}
          <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-900">
            <img
              src={business.banner_url || defaultBanner}
              alt={business.name}
              className="w-full h-full object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-black/30 to-black/50" />

            {/* Top-Left Table Badge */}
            <div className="absolute top-3.5 left-4 z-10">
              <div className="bg-black/60 backdrop-blur-md text-white border border-white/20 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span>{tableNo ? tableNo : 'QR Menü'}</span>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-3.5 left-4 right-4 z-10 flex items-center gap-3">
              <div className="w-13 h-13 rounded-2xl bg-white border-2 border-white shadow-lg overflow-hidden flex items-center justify-center shrink-0 p-1">
                {business.logo_url ? (
                  <img src={business.logo_url} alt={business.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-slate-900 font-black text-sm">{business.name.charAt(0)}</span>
                )}
              </div>

              <div className="text-white min-w-0">
                <h1 className="font-extrabold text-base tracking-tight truncate leading-tight">
                  {business.name}
                </h1>
                {business.working_hours && (
                  <p className="text-[11px] text-slate-300 truncate mt-0.5 font-medium">
                    {business.working_hours}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Bar (Dark Rounded Card) */}
          <div className="mx-4 -mt-3.5 relative z-20 bg-[#0B0F17] text-white rounded-2xl p-2.5 flex items-center justify-around shadow-xl border border-slate-800">
            <button
              onClick={() => setServiceModalType('waiter')}
              className="flex flex-col items-center gap-1 p-1 transition active:scale-95 text-slate-300 hover:text-white"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-orange-400">
                <Hand className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold">Garson Çağır</span>
            </button>

            <button
              onClick={() => setServiceModalType('bill')}
              className="flex flex-col items-center gap-1 p-1 transition active:scale-95 text-slate-300 hover:text-white"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-orange-400">
                <Banknote className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold">Hesap İste</span>
            </button>

            {business.wifi_ssid && (
              <button
                onClick={() => setServiceModalType('wifi')}
                className="flex flex-col items-center gap-1 p-1 transition active:scale-95 text-slate-300 hover:text-white"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-sky-400">
                  <Wifi className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold">Wi-Fi Bilgisi</span>
              </button>
            )}
          </div>

          {/* Active Order Tracker */}
          {activeOrders.length > 0 && (
            <div className="mx-4 mt-3">
              <OrderStatusTracker orders={activeOrders} />
            </div>
          )}

          {/* Search Bar */}
          <div className="mx-4 mt-3">
            <div className="bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2.5 shadow-xs flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Yiyecek veya içecek ara..."
                className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Category Navigation Pills */}
          <div className="px-4 mt-3 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setSelectedCatId('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                selectedCatId === 'all'
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Tümü</span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Product Items List */}
          <div className="px-4 mt-3 space-y-2.5">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 font-bold">
                Menü yükleniyor...
              </div>
            ) : currentProducts.length === 0 ? (
              <div className="py-14 text-center text-xs text-slate-400 font-medium bg-white rounded-2xl border border-slate-200 p-6">
                Aradığınız kriterlere uygun ürün bulunamadı.
              </div>
            ) : (
              currentProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs hover:shadow-sm transition flex items-center gap-3 relative overflow-hidden"
                >
                  {/* Image on Left */}
                  <div className="w-18 h-18 rounded-xl overflow-hidden shrink-0 relative bg-slate-100 border border-slate-100">
                    <img
                      src={
                        categories.find((c) => c.id === prod.category_id)?.image_url ||
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                    {prod.is_frozen && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-bold">
                        Tükendi
                      </div>
                    )}
                  </div>

                  {/* Info in Center */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                      {prod.name}
                    </h3>
                    {prod.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed font-medium">
                        {prod.description}
                      </p>
                    )}
                    <div className="mt-1 flex items-baseline">
                      <span className="font-black text-xs sm:text-sm text-orange-600">
                        {prod.price.toFixed(2)} ₺
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div>
                    <button
                      onClick={() => addToCart(prod)}
                      disabled={prod.is_frozen}
                      className="w-8 h-8 rounded-xl bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-200 hover:border-orange-500 flex items-center justify-center font-black text-sm transition active:scale-90 shadow-xs disabled:opacity-40 disabled:pointer-events-none shrink-0"
                      title="Sepete Ekle"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Floating Cart Button (Pinned inside mobile bounds) */}
        {totalCartCount > 0 && (
          <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
            <button
              onClick={() => setShowCart(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 px-5 rounded-2xl shadow-xl shadow-orange-500/35 flex items-center justify-between transition active:scale-[0.98] font-bold text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-black/20 flex items-center justify-center text-xs font-black">
                  {totalCartCount}
                </span>
                <span>Siparişi İncele / Tamamla</span>
              </div>

              <div className="flex items-center gap-1 font-black text-sm">
                <span>{totalCartPrice.toFixed(2)} ₺</span>
                <ChevronRight className="w-4 h-4" />
              </div>
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
          onOrderPlaced={() => {
            setCart([]);
            setShowCart(false);
          }}
        />

        {/* Service Action Modal */}
        <ServiceActionsModal
          business={business}
          tableNo={tableNo}
          isOpen={serviceModalType !== null}
          type={serviceModalType}
          onClose={() => setServiceModalType(null)}
        />
      </div>
    </div>
  );
};
