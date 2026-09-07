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
import { getEffectiveThemeConfig, FONT_FAMILY_MAP, injectGoogleFont } from '../../lib/aiBrandThemeEngine';

interface CustomerMenuProps {
  business: Business;
  initialTable?: string;
}

export const CustomerMenu: React.FC<CustomerMenuProps> = ({ business, initialTable }) => {
  const [currentBiz, setCurrentBiz] = useState<Business>(business);
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

  // Sync prop changes
  useEffect(() => {
    setCurrentBiz(business);
  }, [business]);

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

  // Load Menu Data & Latest Business with Instant Realtime Sync
  const fetchMenu = async () => {
    try {
      const [catsRes, prodsRes, bizRes] = await Promise.all([
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
          .from('businesses')
          .select('*')
          .eq('id', business.id)
          .maybeSingle(),
      ]);

      if (catsRes.data) {
        setCategories(catsRes.data as Category[]);
      }
      if (prodsRes.data) {
        setProducts(prodsRes.data as Product[]);
      }
      if (bizRes.data) {
        setCurrentBiz(bizRes.data as Business);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();

    // Realtime Postgres Changes listener for instant menu and business updates
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'businesses',
          filter: `id=eq.${business.id}`,
        },
        (payload) => {
          if (payload.new) {
            setCurrentBiz(payload.new as Business);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business.id]);

  // Set browser tab title strictly to business name
  useEffect(() => {
    if (currentBiz?.name) {
      document.title = currentBiz.name;
    }
  }, [currentBiz?.name]);

  // Load Active Orders for tracking and Customer Native Notifications
  useEffect(() => {
    const fetchMyActiveOrders = async () => {
      let storedOrderIds: string[] = [];
      try {
        storedOrderIds = JSON.parse(localStorage.getItem('my_active_orders') || '[]');
      } catch {
        storedOrderIds = [];
      }
      if (!Array.isArray(storedOrderIds) || storedOrderIds.length === 0) return;

      const { data } = await supabase
        .from('orders')
        .select('*')
        .in('id', storedOrderIds);

      if (data) {
        const allOrders = data as Order[];
        const stillActive = allOrders.filter((o) => ['pending', 'preparing', 'served'].includes(o.status));
        const newlyPaidOrders = allOrders.filter((o) => o.status === 'paid');

        // Check for Status Changes and trigger Native Notifications for Customer
        allOrders.forEach((order) => {
          const prevStatus = prevOrderStatusRef.current[order.id];
          if (prevStatus && prevStatus !== order.status) {
            if (order.status === 'preparing') {
              sendNativeNotification({
                title: 'Siparişiniz Hazırlanıyor',
                body: 'Siparişiniz özenle hazırlanmaya başladı.',
              });
            } else if (order.status === 'served') {
              sendNativeNotification({
                title: 'Siparişiniz Masanızda',
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

          try {
            window.close();
          } catch {}
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
  const themeConfig = getEffectiveThemeConfig(currentBiz);
  const fontMeta = FONT_FAMILY_MAP[themeConfig.font_family] || FONT_FAMILY_MAP.inter;

  useEffect(() => {
    if (themeConfig.font_family) {
      injectGoogleFont(themeConfig.font_family);
    }
  }, [themeConfig.font_family]);

  const displayWorkingHours = getTranslatedWorkingHours(currentBiz.working_hours, lang);

  const detailCategory = selectedProductForDetail
    ? categories.find((c) => c.id === selectedProductForDetail.category_id)
    : undefined;

  return (
    <div 
      className="min-h-screen bg-[#0C1017] text-slate-100 antialiased flex justify-center selection:bg-slate-700 selection:text-white"
      style={{ fontFamily: fontMeta.cssFont }}
    >
      {/* Mobile Screen Shell Container */}
      <div 
        className="w-full max-w-md min-h-screen relative pb-28 flex flex-col justify-between bg-[#0C1017]"
      >
        <div>
          {/* Hero Header with Vignette Gradient Fadeout */}
          <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-[#0C1017]">
            <img
              src={currentBiz.banner_url || currentBiz.cover_image_url || defaultBanner}
              alt={currentBiz.name}
              className="w-full h-full object-cover opacity-70"
            />

            {/* Vignette Melt Gradient transitioning into background color */}
            <div 
              className="absolute inset-0 bg-gradient-to-t from-[#0C1017] via-[#0C1017]/50 to-black/60"
            />

            {/* Top Bar: Left Table Badge & Wi-Fi, Right TR/EN/RU Language Switcher */}
            <div className="absolute top-3.5 left-4 right-4 z-20 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {/* Table Pill */}
                <div className="bg-[#141A26]/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span 
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" 
                  />
                  <span>{tableNo ? tableNo : t.qrMenu}</span>
                </div>

                {/* Wi-Fi Quick Pill (If configured and no active order yet) */}
                {(currentBiz.wifi_ssid || currentBiz.wifi_password) && (
                  <button
                    onClick={() => setServiceModalType('wifi')}
                    className="bg-[#141A26]/80 backdrop-blur-md text-sky-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm hover:bg-[#1C2433] transition"
                  >
                    <Wifi className="w-3 h-3 text-sky-400" />
                    <span>Wi-Fi</span>
                  </button>
                )}
              </div>

              {/* Language Switcher Capsule (TR | EN | RU) */}
              <div className="bg-[#141A26]/80 backdrop-blur-md p-0.5 rounded-full flex items-center gap-0.5 shadow-sm text-[10px] font-bold text-slate-400">
                <button
                  onClick={() => handleLanguageChange('tr')}
                  className={`px-2 py-0.5 rounded-full transition flex items-center gap-1 ${
                    lang === 'tr'
                      ? 'bg-[#1C2433] text-white shadow-xs'
                      : 'hover:text-white'
                  }`}
                >
                  <span>TR</span>
                </button>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2 py-0.5 rounded-full transition flex items-center gap-1 ${
                    lang === 'en'
                      ? 'bg-[#1C2433] text-white shadow-xs'
                      : 'hover:text-white'
                  }`}
                >
                  <span>EN</span>
                </button>
                <button
                  onClick={() => handleLanguageChange('ru')}
                  className={`px-2 py-0.5 rounded-full transition flex items-center gap-1 ${
                    lang === 'ru'
                      ? 'bg-[#1C2433] text-white shadow-xs'
                      : 'hover:text-white'
                  }`}
                >
                  <span>RU</span>
                </button>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center gap-3">
              <div className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-2xl shadow-lg overflow-hidden flex items-center justify-center shrink-0 bg-[#111622]/80 backdrop-blur-md">
                {currentBiz.logo_url ? (
                  <img
                    src={currentBiz.logo_url}
                    alt={currentBiz.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1C2433] flex items-center justify-center text-white font-black text-lg">
                    {currentBiz.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight truncate leading-tight text-white drop-shadow-xs">
                  {currentBiz.name}
                </h1>
                {displayWorkingHours && (
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                    {displayWorkingHours}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Active Order Status Tracker & Quick Actions (Always Available) */}
          <div className="mx-4 mt-2 space-y-2">
            {hasActiveOrders && <OrderStatusTracker orders={activeOrders} />}

            {/* Action Bar (Garson, Hesap & Wi-Fi) */}
            {currentBiz.plan_type !== 'lite' ? (
              <div className="bg-[#111622] text-white rounded-2xl p-1.5 flex items-center justify-around shadow-md">
                <button
                  onClick={() => setServiceModalType('waiter')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-[#141A26] hover:bg-[#1C2433] text-slate-200 hover:text-white transition active:scale-95 text-xs font-bold"
                >
                  <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{t.callWaiter}</span>
                </button>

                <div className="w-px h-5 bg-[#1C2433] mx-1" />

                <button
                  onClick={() => setServiceModalType('bill')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-[#141A26] hover:bg-[#1C2433] text-slate-200 hover:text-white transition active:scale-95 text-xs font-bold"
                >
                  <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{t.requestBill}</span>
                </button>

                {(currentBiz.wifi_ssid || currentBiz.wifi_password) && (
                  <>
                    <div className="w-px h-5 bg-[#1C2433] mx-1" />
                    <button
                      onClick={() => setServiceModalType('wifi')}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#141A26] hover:bg-[#1C2433] text-sky-300 hover:text-white transition active:scale-95 text-xs font-bold shrink-0"
                    >
                      <Wifi className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>Wi-Fi</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              (currentBiz.wifi_ssid || currentBiz.wifi_password) && (
                <div className="bg-[#111622] text-white rounded-2xl p-2.5 flex items-center justify-between shadow-md">
                  <span className="text-xs text-slate-300 font-medium pl-2">Mekan Wi-Fi Ağı</span>
                  <button
                    onClick={() => setServiceModalType('wifi')}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-white transition active:scale-95 text-xs font-bold shrink-0"
                  >
                    <Wifi className="w-4 h-4 text-white shrink-0" />
                    <span>Şifreyi Gör</span>
                  </button>
                </div>
              )
            )}
          </div>

          {/* Search Bar */}
          <div className="mx-4 mt-3">
            <div className="bg-[#111622] rounded-2xl px-3.5 py-2.5 shadow-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* VIEW 1: CATEGORIES (1 Category Per Row, Rounded Rectangular Gourmet Banner Cards) */}
          {!isSearching && selectedCatId === null && (
            <div className="px-4 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-xs text-slate-300 tracking-wide uppercase">
                  {t.menuCategories}
                </h2>
                <span className="text-[10px] font-medium text-slate-500">
                  {categories.length} {t.categoryCount}
                </span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-xs text-slate-500 font-medium">
                  {t.loadingCategories}
                </div>
              ) : categories.length === 0 ? (
                <div className="py-14 text-center text-xs text-slate-400 font-medium bg-[#111622] rounded-2xl p-6">
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
                        className="w-full h-32 sm:h-36 rounded-2xl overflow-hidden relative shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer active:scale-[0.99] group bg-[#111622]"
                      >
                        {/* High Quality Responsive Category Background Image */}
                        <img
                          src={
                            cat.image_url ||
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
                          }
                          alt={translatedName}
                          className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Rich Gradient Overlay for High Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />

                        {/* Card Content: Left Category Title + Count, Right Arrow Circle */}
                        <div className="absolute inset-0 p-4 flex items-center justify-between z-10">
                          <div className="space-y-1.5 max-w-[75%]">
                            <span className="inline-flex items-center gap-1 bg-[#1C2433]/90 backdrop-blur-md text-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                              {count} {t.items}
                            </span>
                            <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight drop-shadow-sm group-hover:text-slate-200 transition-colors">
                              {translatedName}
                            </h3>
                          </div>

                          <div className="w-9 h-9 rounded-full bg-[#1C2433]/80 backdrop-blur-md flex items-center justify-center text-slate-200 group-hover:bg-white group-hover:text-[#0F172A] transition-all shadow-sm">
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
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111622] hover:bg-[#141A26] text-slate-200 transition text-xs font-bold shadow-sm active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.categories}</span>
                </button>

                {selectedCategory && !isSearching && (
                  <span className="text-xs font-bold text-slate-200 bg-[#141A26] px-3 py-1 rounded-xl">
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
                            ? 'bg-white text-[#0F172A] shadow-sm'
                            : 'bg-[#111622] text-slate-400 hover:text-white'
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
                  <div className="py-16 text-center text-xs text-slate-500 font-medium">
                    {t.loadingMenu}
                  </div>
                ) : currentProducts.length === 0 ? (
                  <div className="py-14 text-center text-xs text-slate-400 font-medium bg-[#111622] rounded-2xl p-6">
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
                        className={`bg-[#111622] hover:bg-[#141A26] rounded-2xl p-3 shadow-sm transition flex items-center justify-between gap-3 overflow-hidden relative cursor-pointer active:scale-[0.99] group ${
                          prod.is_frozen ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Food Thumbnail on Left (Strictly Constrained 80x80px with right vignette) */}
                        <div className="w-20 h-20 min-w-[80px] min-h-[80px] max-w-[80px] max-h-[80px] rounded-xl overflow-hidden shrink-0 relative bg-[#141A26]">
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
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/30" />

                          {prod.is_frozen && (
                            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center text-white text-[9px] font-bold tracking-wider">
                              {t.soldOut}
                            </div>
                          )}
                        </div>

                        {/* Info in Center: Product Name + Translated Description + Price */}
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-xs sm:text-sm text-slate-100 truncate leading-snug group-hover:text-white transition-colors">
                              {prod.name}
                            </h3>
                            {prod.is_frozen && (
                              <span className="text-[9px] font-bold bg-[#1C2433] text-slate-400 px-1.5 py-0.5 rounded-md shrink-0">
                                {t.soldOut}
                              </span>
                            )}
                          </div>
                          {translatedDesc && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed font-normal">
                              {translatedDesc}
                            </p>
                          )}
                          <div className="mt-1 flex items-baseline">
                            <span className={`font-bold text-xs sm:text-sm ${
                              prod.is_frozen ? 'text-slate-500 line-through' : 'text-slate-100'
                            }`}>
                              {prod.price.toFixed(2)} ₺
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons on Right: Quantity Stepper or Plus Button */}
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          {prod.is_frozen ? (
                            <span className="text-[10px] font-bold text-slate-500 bg-[#141A26] px-2 py-1.5 rounded-xl">
                              {t.soldOut}
                            </span>
                          ) : qtyInCart > 0 ? (
                            <div className="flex items-center gap-1.5 bg-[#141A26] p-1 rounded-xl">
                              <button
                                onClick={() => updateCartQty(prod.id, -1)}
                                className="w-6 h-6 rounded-lg bg-[#1C2433] flex items-center justify-center text-slate-200 font-bold hover:bg-[#253043] active:scale-95 transition"
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              <span className="text-xs font-bold text-slate-100 w-4 text-center">
                                {qtyInCart}
                              </span>

                              <button
                                onClick={() => updateCartQty(prod.id, 1)}
                                className="w-6 h-6 rounded-lg bg-white text-[#0F172A] flex items-center justify-center font-bold hover:bg-slate-200 active:scale-95 transition"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(prod, 1)}
                              className="w-8 h-8 rounded-xl bg-[#1C2433] hover:bg-white hover:text-[#0F172A] text-slate-200 flex items-center justify-center font-bold text-sm transition active:scale-90 shadow-sm"
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
              className="w-full bg-[#111622] hover:bg-[#141A26] text-white py-3.5 px-5 rounded-2xl shadow-xl flex items-center justify-between transition active:scale-[0.98] font-bold text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-white text-[#0F172A] flex items-center justify-center text-xs font-bold">
                  {totalCartCount}
                </span>
                <span>{t.viewCart}</span>
              </div>

              <div className="flex items-center gap-1 font-bold text-sm text-slate-100">
                <span>{totalCartPrice.toFixed(2)} ₺</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          </div>
        )}

        {/* Bill Paid & Session Reset Celebration Modal */}
        {showPaidSessionModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#111622] text-slate-100 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-[#141A26] text-emerald-400 flex items-center justify-center mx-auto shadow-sm animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">Hesabınız Ödendi</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  {tableNo ? <strong className="text-slate-200">{tableNo}</strong> : 'Masa'} hesabı başarıyla kapatıldı. Bizi tercih ettiğiniz için teşekkür eder, yine bekleriz!
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    try {
                      window.close();
                    } catch {}
                    handleClosePaidSession();
                  }}
                  className="w-full py-3.5 bg-white hover:bg-slate-200 text-[#0F172A] font-bold text-xs rounded-2xl shadow-lg transition active:scale-98"
                >
                  Sekmeyi Kapat / Çıkış
                </button>

                <button
                  onClick={handleClosePaidSession}
                  className="w-full py-2.5 bg-[#1C2433] hover:bg-[#253043] text-slate-300 font-bold text-xs rounded-2xl transition"
                >
                  Menüyü İncelemeye Devam Et
                </button>
              </div>
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
          business={currentBiz}
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
          business={currentBiz}
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
