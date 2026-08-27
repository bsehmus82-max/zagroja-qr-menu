import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, BellRing, Receipt, Wifi, Snowflake, 
  Plus, Minus, Search, UtensilsCrossed, ArrowLeft, ChevronRight,
  CheckCircle2, Sparkles
} from 'lucide-react';
import { Business, Category, Product, CartItem, Order } from '../../types';
import { supabase } from '../../lib/supabase';
import { ServiceActionsModal } from './ServiceActionsModal';
import { CartDrawer } from './CartDrawer';
import { OrderStatusTracker } from './OrderStatusTracker';
import { ProductDetailModal } from './ProductDetailModal';
import { sendNativeNotification } from '../../lib/notifications';
import { 
  Language, translations, getCategoryTitle, 
  getTranslatedWorkingHours, getTranslatedDescription 
} from '../../lib/translations';

interface CustomerMenuProps {
  business: Business;
  initialTable?: string;
}

export const CustomerMenu: React.FC<CustomerMenuProps> = ({ business, initialTable }) => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('menu_lang') as Language) || 'tr';
  });

  const t = translations[lang] || translations.tr;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  // Default to null so CATEGORIES view opens first!
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

  // Product Detail Modal state
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  // Service Modal state
  const [serviceModalType, setServiceModalType] = useState<'waiter' | 'bill' | 'wifi' | null>(null);

  // Active Order Tracker state
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [showPaidSessionModal, setShowPaidSessionModal] = useState(false);
  const prevOrderStatusRef = useRef<Record<string, string>>({});

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('menu_lang', newLang);
  };

  // Load Menu Data with Instant Realtime Sync
  const fetchMenu = async () => {
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

  useEffect(() => {
    fetchMenu();

    // Realtime Postgres Changes listener for instant menu updates
    const channel = supabase
      .channel(`menu_sync_${business.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `business_id=eq.${business.id}`,
        },
        () => {
          fetchMenu();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `business_id=eq.${business.id}`,
        },
        () => {
          fetchMenu();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business.id]);

  // Load Active Orders for tracking and Customer Native Notifications
  useEffect(() => {
    const fetchMyActiveOrders = async () => {
      const storedOrderIds = JSON.parse(localStorage.getItem('my_active_orders') || '[]');
      if (storedOrderIds.length === 0) return;

      const { data } = await supabase
        .from('orders')
        .select('*')
        .in('id', storedOrderIds);

      if (data) {
        const allOrders = data as Order[];
        const stillActive = allOrders.filter((o) => ['pending', 'preparing', 'served'].includes(o.status));
        const newlyPaidOrders = allOrders.filter((o) => o.status === 'paid');

        // Check for Status Changes and trigger Native Notifications for Customer (Food preparation only)
        allOrders.forEach((order) => {
          const prevStatus = prevOrderStatusRef.current[order.id];
          if (prevStatus && prevStatus !== order.status) {
            if (order.status === 'preparing') {
              sendNativeNotification({
                title: 'Siparişiniz Hazırlanıyor 👨‍🍳',
                body: 'Şeflerimiz siparişinizi özenle hazırlamaya başladı.',
              });
            } else if (order.status === 'served') {
              sendNativeNotification({
                title: 'Siparişiniz Masanızda! 🍽️',
                body: 'Siparişiniz servis edildi. Afiyet olsun!',
              });
            }
          }
          prevOrderStatusRef.current[order.id] = order.status;
        });

        // If all orders were paid by admin in dashboard, close session and disconnect device immediately!
        if (newlyPaidOrders.length > 0 && stillActive.length === 0) {
          setShowPaidSessionModal(true);
          localStorage.removeItem('my_active_orders');
          localStorage.removeItem('cart');
          localStorage.removeItem(`tbl_session_${business.id}`);
          setCart([]);
          setActiveOrders([]);
          setShowCart(false);
          setServiceModalType(null);
          prevOrderStatusRef.current = {};
        } else {
          setActiveOrders(stillActive);
        }
      }
    };

    fetchMyActiveOrders();
    const interval = setInterval(fetchMyActiveOrders, 4000);
    return () => clearInterval(interval);
  }, [business.id]);

  const handleClosePaidSession = () => {
    setShowPaidSessionModal(false);
    setCart([]);
    setActiveOrders([]);
    setShowCart(false);
    fetchMenu();
  };

  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    if (product.is_frozen) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantityToAdd } : item
        );
      }
      return [...prev, { product, quantity: quantityToAdd }];
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

  const getItemQtyInCart = (prodId: string) => {
    const found = cart.find((item) => item.product.id === prodId);
    return found ? found.quantity : 0;
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const isSearching = searchTerm.trim().length > 0;
  const hasActiveOrders = activeOrders.length > 0;

  // Filter and Sort: Sold-out (is_frozen) products automatically drop to the bottom!
  const currentProducts = products
    .filter((p) => (isSearching ? true : selectedCatId ? p.category_id === selectedCatId : true))
    .filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (a.is_frozen === b.is_frozen) return (a.order_index || 0) - (b.order_index || 0);
      return a.is_frozen ? 1 : -1; // Frozen products drop to bottom!
    });

  const selectedCategory = categories.find((c) => c.id === selectedCatId);
  const defaultBanner = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80';
  const displayWorkingHours = getTranslatedWorkingHours(business.working_hours, lang);

  const detailCategory = selectedProductForDetail
    ? categories.find((c) => c.id === selectedProductForDetail.category_id)
    : undefined;

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-800 antialiased flex justify-center selection:bg-orange-500 selection:text-white">
      {/* Mobile Screen Shell Container on Desktop / PC (Soft Muted Off-White #F1F4F9) */}
      <div className="w-full max-w-md min-h-screen bg-[#F1F4F9] relative pb-28 shadow-[0_0_60px_rgba(0,0,0,0.6)] border-x border-slate-800/50 flex flex-col justify-between">
        <div>
          {/* Hero Header with Vignette Gradient Fadeout */}
          <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-950">
            <img
              src={business.banner_url || defaultBanner}
              alt={business.name}
              className="w-full h-full object-cover opacity-80"
            />

            {/* Vignette Melt Gradient directly transitioning into #F1F4F9 background */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#F1F4F9] via-[#0B0F17]/40 to-black/70" />

            {/* Top Bar: Left Table Badge & Wi-Fi, Right TR/EN/RU Language Switcher */}
            <div className="absolute top-3.5 left-4 right-4 z-20 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {/* Table Pill */}
                <div className="bg-black/60 backdrop-blur-md text-white border border-white/20 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span>{tableNo ? tableNo : t.qrMenu}</span>
                </div>

                {/* Wi-Fi Quick Pill (If configured and no active order yet) */}
                {business.wifi_ssid && (
                  <button
                    onClick={() => setServiceModalType('wifi')}
                    className="bg-black/60 backdrop-blur-md text-sky-300 border border-white/20 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md hover:bg-black/80 transition"
                  >
                    <Wifi className="w-3 h-3 text-sky-400" />
                    <span>Wi-Fi</span>
                  </button>
                )}
              </div>

              {/* Language Switcher Capsule (TR | EN | RU) */}
              <div className="bg-black/60 backdrop-blur-md border border-white/20 p-0.5 rounded-full flex items-center gap-0.5 shadow-md text-[10px] font-extrabold text-slate-300">
                <button
                  onClick={() => handleLanguageChange('tr')}
                  className={`px-2 py-0.5 rounded-full transition flex items-center gap-1 ${
                    lang === 'tr'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'hover:text-white'
                  }`}
                >
                  <span>TR</span>
                </button>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2 py-0.5 rounded-full transition flex items-center gap-1 ${
                    lang === 'en'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'hover:text-white'
                  }`}
                >
                  <span>EN</span>
                </button>
                <button
                  onClick={() => handleLanguageChange('ru')}
                  className={`px-2 py-0.5 rounded-full transition flex items-center gap-1 ${
                    lang === 'ru'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'hover:text-white'
                  }`}
                >
                  <span>RU</span>
                </button>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center gap-3">
              <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl bg-white border-2 border-white shadow-xl overflow-hidden flex items-center justify-center shrink-0 p-1">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    className="w-full h-full max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-slate-900 font-black text-base">{business.name.charAt(0)}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight truncate leading-tight text-slate-900 drop-shadow-xs">
                  {business.name}
                </h1>
                {displayWorkingHours && (
                  <p className="text-[11px] text-slate-600 truncate mt-0.5 font-semibold">
                    {displayWorkingHours}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Active Order Status Tracker & Quick Actions (APPEARS ONLY AFTER ORDER IS PLACED) */}
          {hasActiveOrders && (
            <div className="mx-4 mt-2 space-y-2">
              <OrderStatusTracker orders={activeOrders} />

              {/* Action Bar (Garson & Hesap) after order */}
              <div className="bg-[#0B0F17] text-white rounded-2xl p-2 flex items-center justify-around shadow-xl border border-slate-800">
                <button
                  onClick={() => setServiceModalType('waiter')}
                  className="flex items-center gap-2 py-1.5 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white transition active:scale-95 text-xs font-bold"
                >
                  <BellRing className="w-4 h-4 text-orange-400" />
                  <span>{t.callWaiter}</span>
                </button>

                <div className="w-px h-5 bg-slate-800" />

                <button
                  onClick={() => setServiceModalType('bill')}
                  className="flex items-center gap-2 py-1.5 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white transition active:scale-95 text-xs font-bold"
                >
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>{t.requestBill}</span>
                </button>
              </div>
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
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* VIEW 1: CATEGORIES (1 Category Per Row, Rounded Rectangular Gourmet Banner Cards) */}
          {!isSearching && selectedCatId === null && (
            <div className="px-4 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-xs text-slate-800 tracking-wide uppercase">
                  {t.menuCategories}
                </h2>
                <span className="text-[10px] font-bold text-slate-400">
                  {categories.length} {t.categoryCount}
                </span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-xs text-slate-400 font-bold">
                  {t.loadingCategories}
                </div>
              ) : categories.length === 0 ? (
                <div className="py-14 text-center text-xs text-slate-400 font-medium bg-white rounded-2xl border border-slate-200 p-6">
                  {t.noCategoryItems}
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.category_id === cat.id).length;
                    const translatedName = getCategoryTitle(cat.name, lang);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCatId(cat.id)}
                        className="w-full h-32 sm:h-36 rounded-2xl overflow-hidden relative shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.99] group border border-slate-200/70 bg-slate-900"
                      >
                        {/* High Quality Responsive Category Background Image */}
                        <img
                          src={
                            cat.image_url ||
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
                          }
                          alt={translatedName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Rich Gradient Overlay for High Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />

                        {/* Card Content: Left Category Title + Count, Right Arrow Circle */}
                        <div className="absolute inset-0 p-4 flex items-center justify-between z-10">
                          <div className="space-y-1.5 max-w-[75%]">
                            <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                              {count} {t.items}
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-sm group-hover:text-orange-300 transition-colors">
                              {translatedName}
                            </h3>
                          </div>

                          <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-orange-500 group-hover:border-orange-500 transition-all shadow-sm">
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: PRODUCTS INSIDE CATEGORY (COMPACT HORIZONTAL RECTANGULAR CARDS WITH POP-UP MODAL) */}
          {(isSearching || selectedCatId !== null) && (
            <div className="mt-3 space-y-3">
              {/* Category Breadcrumb / Back Bar */}
              <div className="px-4 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedCatId(null);
                    setSearchTerm('');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition text-xs font-bold shadow-xs active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-orange-500" />
                  <span>{t.categories}</span>
                </button>

                {selectedCategory && !isSearching && (
                  <span className="text-xs font-extrabold text-slate-900 bg-orange-50 border border-orange-200 text-orange-800 px-3 py-1 rounded-xl">
                    {getCategoryTitle(selectedCategory.name, lang)} ({currentProducts.length})
                  </span>
                )}
              </div>

              {/* Horizontal Category Switcher Pills */}
              {!isSearching && (
                <div className="px-4 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                  {categories.map((cat) => {
                    const isSelected = selectedCatId === cat.id;
                    const translatedCatName = getCategoryTitle(cat.name, lang);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCatId(cat.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{translatedCatName}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Products List (Sold Out Products Automatically Dropped to Bottom) */}
              <div className="px-4 space-y-2.5">
                {loading ? (
                  <div className="py-16 text-center text-xs text-slate-400 font-bold">
                    {t.loadingMenu}
                  </div>
                ) : currentProducts.length === 0 ? (
                  <div className="py-14 text-center text-xs text-slate-400 font-medium bg-white rounded-2xl border border-slate-200 p-6">
                    {isSearching ? t.noItemsFound : t.noCategoryItems}
                  </div>
                ) : (
                  currentProducts.map((prod) => {
                    const translatedDesc = getTranslatedDescription(prod.description, lang);
                    const qtyInCart = getItemQtyInCart(prod.id);
                    const catImg = categories.find((c) => c.id === prod.category_id)?.image_url;

                    return (
                      <div
                        key={prod.id}
                        onClick={() => setSelectedProductForDetail(prod)}
                        className={`bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs hover:shadow-sm transition flex items-center justify-between gap-3 overflow-hidden relative cursor-pointer active:scale-[0.99] group ${
                          prod.is_frozen ? 'opacity-70 bg-slate-50/80' : ''
                        }`}
                      >
                        {/* Food Thumbnail on Left (Strictly Constrained 80x80px with right vignette) */}
                        <div className="w-20 h-20 min-w-[80px] min-h-[80px] max-w-[80px] max-h-[80px] rounded-xl overflow-hidden shrink-0 relative bg-slate-100 border border-slate-200/60 shadow-xs">
                          <img
                            src={
                              prod.image_url ||
                              catImg ||
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
                            }
                            alt={prod.name}
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                              prod.is_frozen ? 'grayscale' : ''
                            }`}
                          />
                          {/* Right Vignette on Food Image */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20" />

                          {prod.is_frozen && (
                            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center text-white text-[9px] font-black tracking-wider">
                              {t.soldOut}
                            </div>
                          )}
                        </div>

                        {/* Info in Center: Product Name + Translated Description + Price */}
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate leading-snug group-hover:text-orange-600 transition-colors">
                              {prod.name}
                            </h3>
                            {prod.is_frozen && (
                              <span className="text-[9px] font-extrabold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md shrink-0">
                                {t.soldOut}
                              </span>
                            )}
                          </div>
                          {translatedDesc && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed font-medium">
                              {translatedDesc}
                            </p>
                          )}
                          <div className="mt-1 flex items-baseline">
                            <span className={`font-black text-xs sm:text-sm ${
                              prod.is_frozen ? 'text-slate-400 line-through' : 'text-orange-600'
                            }`}>
                              {prod.price.toFixed(2)} ₺
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons on Right: Quantity Stepper or Plus Button */}
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          {prod.is_frozen ? (
                            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1.5 rounded-xl border border-slate-200">
                              {t.soldOut}
                            </span>
                          ) : qtyInCart > 0 ? (
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                              <button
                                onClick={() => updateCartQty(prod.id, -1)}
                                className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-800 font-bold hover:bg-slate-50 active:scale-95 transition"
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              <span className="text-xs font-black text-slate-900 w-4 text-center">
                                {qtyInCart}
                              </span>

                              <button
                                onClick={() => updateCartQty(prod.id, 1)}
                                className="w-6 h-6 rounded-lg bg-slate-900 shadow-xs flex items-center justify-center text-white font-bold hover:bg-slate-800 active:scale-95 transition"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(prod, 1)}
                              className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-orange-600 text-white flex items-center justify-center font-black text-sm transition active:scale-90 shadow-xs"
                              title={t.addToCart}
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Floating Cart Button */}
        {totalCartCount > 0 && (
          <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
            <button
              onClick={() => setShowCart(true)}
              className="w-full bg-slate-900 hover:bg-orange-600 text-white py-3.5 px-5 rounded-2xl shadow-xl shadow-slate-900/30 flex items-center justify-between transition active:scale-[0.98] font-bold text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-orange-500 flex items-center justify-center text-xs font-black text-white">
                  {totalCartCount}
                </span>
                <span>{t.viewCart}</span>
              </div>

              <div className="flex items-center gap-1 font-black text-sm text-orange-400">
                <span>{totalCartPrice.toFixed(2)} ₺</span>
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </button>
          </div>
        )}

        {/* Bill Paid & Session Reset Celebration Modal */}
        {showPaidSessionModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl space-y-4 animate-in zoom-in-95 border border-slate-100">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-sm animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900">Hesabınız Ödendi</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {tableNo ? <strong className="text-slate-800">{tableNo}</strong> : 'Masa'} hesabı başarıyla kapatıldı. Bizi tercih ettiğiniz için teşekkür eder, yine bekleriz!
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 font-semibold flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Oturumunuz güvenle sıfırlandı.</span>
              </div>

              <button
                onClick={handleClosePaidSession}
                className="w-full py-3.5 bg-slate-900 hover:bg-orange-600 text-white font-black text-xs rounded-2xl shadow-lg transition active:scale-98"
              >
                Yeni Menüyü Aç / Tamamla
              </button>
            </div>
          </div>
        )}

        {/* Product Detail Modal (Pop-up with Blurred Backdrop & Top-Left Back Button) */}
        <ProductDetailModal
          product={selectedProductForDetail}
          categoryName={detailCategory?.name}
          categoryImage={detailCategory?.image_url}
          isOpen={selectedProductForDetail !== null}
          lang={lang}
          onClose={() => setSelectedProductForDetail(null)}
          onAddToCart={(prod, qty) => addToCart(prod, qty)}
        />

        {/* Cart Drawer */}
        <CartDrawer
          business={business}
          tableNo={tableNo}
          cart={cart}
          isOpen={showCart}
          lang={lang}
          onClose={() => setShowCart(false)}
          onUpdateQty={updateCartQty}
          onOrderPlaced={(newOrder) => {
            setCart([]);
            setShowCart(false);
            setActiveOrders((prev) => [newOrder, ...prev]);
          }}
        />

        {/* Service Action Modal */}
        <ServiceActionsModal
          business={business}
          tableNo={tableNo}
          isOpen={serviceModalType !== null}
          type={serviceModalType}
          lang={lang}
          onClose={() => setServiceModalType(null)}
        />
      </div>
    </div>
  );
};
