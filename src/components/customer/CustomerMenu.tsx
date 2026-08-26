import React, { useState, useEffect } from 'react';
import { 
  Restaurant, 
  RestaurantTable, 
  Category, 
  Product, 
  CartItem, 
  Order 
} from '../../types';
import { store } from '../../lib/store';
import { useLanguage } from '../../lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CategoryNav } from './CategoryNav';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { CartDrawer } from './CartDrawer';
import { ServiceButtons } from './ServiceButtons';
import { WifiModal } from './WifiModal';
import { OrderStatusModal } from './OrderStatusModal';
import { 
  Search, 
  ShoppingBag, 
  Clock3, 
  Sparkles, 
  MapPin, 
  Phone, 
  ShieldCheck,
  QrCode,
  LayoutGrid
} from 'lucide-react';

interface CustomerMenuProps {
  initialTableNumber?: number;
  restaurant?: Restaurant;
}

export const CustomerMenu: React.FC<CustomerMenuProps> = ({
  initialTableNumber = 1,
  restaurant: propRestaurant
}) => {
  const { t, tDynamic } = useLanguage();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(propRestaurant || store.getRestaurant());
  const [tables, setTables] = useState<RestaurantTable[]>(store.getTables());
  const [categories, setCategories] = useState<Category[]>(store.getCategories());
  const [products, setProducts] = useState<Product[]>(store.getProducts());
  const [orders, setOrders] = useState<Order[]>(store.getOrders());

  // URL Query Params Check for table number
  const [currentTableNumber, setCurrentTableNumber] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    return tableParam ? parseInt(tableParam, 10) : initialTableNumber;
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modals & Drawers state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWifiOpen, setIsWifiOpen] = useState(false);
  const [isOrderStatusOpen, setIsOrderStatusOpen] = useState(false);
  const [cart, setCartState] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('customer_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const setCart = (updater: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    setCartState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('customer_cart', JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  };

  // Update document title dynamically
  useEffect(() => {
    if (restaurant && restaurant.name) {
      document.title = `${restaurant.name} — Dijital Menü`;
    } else {
      document.title = 'QR Menü';
    }
  }, [restaurant]);

  // Subscribe to realtime store changes
  useEffect(() => {
    const updateLocalState = () => {
      const cur = store.getRestaurant();
      if (cur) setRestaurant(cur);
      setTables(store.getTables());
      setCategories(store.getCategories());
      setProducts(store.getProducts());
      setOrders(store.getOrders());
    };

    const unsubscribe = store.subscribe(updateLocalState);
    return () => {
      unsubscribe();
    };
  }, []);

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-white">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl text-center max-w-sm w-full">
          <h1 className="text-xl font-bold text-white mb-2">QR Menü</h1>
          <p className="text-xs text-slate-400">İşletme yükleniyor veya bulunamadı.</p>
        </div>
      </div>
    );
  }

  // Filter products by category and search query
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategoryId === 'all' || product.category_id === selectedCategoryId;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Table specific active orders
  const tableOrders = orders.filter(
    (o) => o.table_number === currentTableNumber && o.status !== 'cancelled'
  );
  const activeOrdersCount = tableOrders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing'
  ).length;

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1, notes = '') => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        if (notes) updated[existingIndex].notes = notes;
        return updated;
      }
      return [...prev, { product, quantity, notes }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleSubmitOrder = async (notes: string, paymentMethod: 'cash' | 'credit_card') => {
    const orderItems = cart.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      unit_price: item.product.price,
      quantity: item.quantity,
      total_price: item.product.price * item.quantity,
      item_notes: item.notes,
    }));

    await store.createOrder(currentTableNumber, orderItems, notes, paymentMethod);
    setCart([]);
    setIsOrderStatusOpen(true);
  };

  // Service requests
  const handleCallWaiter = () => {
    store.createServiceCall(currentTableNumber, 'waiter');
  };

  const handleRequestBill = (paymentType: 'cash' | 'credit_card') => {
    store.createServiceCall(currentTableNumber, 'bill', paymentType);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center selection:bg-orange-500 selection:text-white">
      {/* Mobile-centric constrained container for best QR experience */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen shadow-2xl flex flex-col relative pb-28">
        
        {/* Top Header & Restaurant Cover */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900 flex-shrink-0">
          <img
            src={restaurant.cover_url || ''}
            alt={restaurant.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

          {/* Top Bar Floating Badges */}
          <div className="absolute top-3 left-3 flex items-center z-10">
            {/* Sabit Masa Etiketi */}
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-white text-xs font-bold shadow-lg">
              <QrCode className="w-3.5 h-3.5 text-orange-400" />
              <span>{t('Masa')} {currentTableNumber}</span>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="absolute top-3 right-3 z-20">
            <LanguageSwitcher />
          </div>

          {/* Restaurant Profile Card in Cover */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end gap-3 z-10">
            <img
              src={restaurant.logo_url || ''}
              alt={restaurant.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md bg-white flex-shrink-0"
            />
            <div className="text-white min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-extrabold truncate leading-tight drop-shadow-xs">
                {restaurant.name}
              </h1>
              <p className="text-[11px] text-slate-300 truncate mt-0.5 opacity-90">
                {restaurant.description}
              </p>
            </div>
          </div>
        </div>

        {/* Action Header & Quick Status */}
        <div className="px-3 pt-2.5 space-y-2">
          {/* Service Buttons: Garson Çağır, Hesap İste, Wi-Fi */}
          <ServiceButtons
            tableNumber={currentTableNumber}
            onCallWaiter={handleCallWaiter}
            onRequestBill={handleRequestBill}
            onOpenWifi={() => setIsWifiOpen(true)}
            hasWifi={Boolean(restaurant.wifi_password || restaurant.wifi_name)}
          />

          {/* Order Tracking Banner (If active orders exist) */}
          {tableOrders.length > 0 && (
            <div
              onClick={() => setIsOrderStatusOpen(true)}
              className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-2.5 flex items-center justify-between cursor-pointer hover:bg-orange-500/15 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center animate-pulse">
                  <Clock3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {activeOrdersCount > 0
                      ? `${activeOrdersCount} Siparişiniz Hazırlanıyor`
                      : 'Siparişleriniz Masanıza Ulaştı'}
                  </div>
                  <span className="text-[10px] text-orange-600 font-semibold">
                    Detayları ve canlı durumu görmek için tıklayın ➔
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Ürün ara...', 'Yiyecek veya içecek ara...')}
              className="w-full bg-white text-xs pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Temizle
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <CategoryNav
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        {/* Product Items List */}
        <div className="flex-1 p-3 space-y-2.5">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600 text-sm">Ürün Bulunamadı</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Arama kriterinizi değiştirmeyi deneyebilirsiniz.
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={restaurant.currency}
                onOpenDetail={(prod) => setSelectedProduct(prod)}
                onQuickAdd={(prod) => handleAddToCart(prod, 1)}
              />
            ))
          )}
        </div>

        {/* Restaurant Footer Info */}
        <div className="p-4 text-center border-t border-slate-200 bg-white/50 text-slate-400 text-[11px] space-y-1">
          <div className="flex items-center justify-center gap-1.5 font-medium text-slate-600">
            <MapPin className="w-3 h-3 text-orange-500" />
            <span>{restaurant.address}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Phone className="w-3 h-3 text-emerald-500" />
            <span>{restaurant.phone}</span>
          </div>
        </div>

        {/* Sticky Floating Cart Bar (Appears when items are in cart) */}
        {totalCartCount > 0 && (
          <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md z-40 px-1 animate-slide-up">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-2xl p-3.5 shadow-2xl shadow-orange-500/40 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xs">
                  {totalCartCount}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Sepeti Görüntüle
                  </div>
                  <span className="text-[10px] text-orange-100 font-medium">
                    Masa {currentTableNumber} için hazır
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-extrabold">
                  {totalCartPrice.toFixed(2)} {restaurant.currency}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Product Detail Modal */}
        <ProductDetailModal
          product={selectedProduct}
          currency={restaurant.currency}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />

        {/* Cart Drawer */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cart}
          currency={restaurant.currency}
          tableNumber={currentTableNumber}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onSubmitOrder={handleSubmitOrder}
        />

        {/* Wi-Fi Info Modal */}
        <WifiModal
          isOpen={isWifiOpen}
          onClose={() => setIsWifiOpen(false)}
          ssid={restaurant.wifi_name || restaurant.wifi_ssid || ''}
          password={restaurant.wifi_password || ''}
        />

        {/* Order Status Modal */}
        <OrderStatusModal
          isOpen={isOrderStatusOpen}
          onClose={() => setIsOrderStatusOpen(false)}
          orders={tableOrders}
          currency={restaurant.currency}
          tableNumber={currentTableNumber}
        />

      </div>
    </div>
  );
};
