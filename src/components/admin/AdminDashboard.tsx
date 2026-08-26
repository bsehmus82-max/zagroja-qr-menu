import React, { useState, useEffect } from 'react';
import { 
  Restaurant, 
  RestaurantTable, 
  Category, 
  Product, 
  Order, 
  ServiceCall 
} from '../../types';
import { store } from '../../lib/store';
import { LiveOrders } from './LiveOrders';
import { MenuManager } from './MenuManager';
import { TableManager } from './TableManager';
import { EndOfDayReport } from './EndOfDayReport';
import { RestaurantSettings } from './RestaurantSettings';
import { ManualPosScreen } from './ManualPosScreen';
import { SupportChat } from './SupportChat';
import { 
  ChefHat, 
  UtensilsCrossed, 
  QrCode, 
  BarChart3, 
  Settings, 
  ExternalLink, 
  Menu as MenuIcon, 
  X,
  ShoppingCart,
  LogOut,
  Headphones
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenCustomerMenu: (tableNumber?: number) => void;
  onLogout?: () => void;
}

export type AdminTab = 'live_orders' | 'pos' | 'menu' | 'tables' | 'eod' | 'settings' | 'support';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenCustomerMenu,
  onLogout,
}) => {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const [activeTab, setActiveTabState] = useState<AdminTab>(() => {
    try {
      const hash = window.location.hash.replace('#', '') as AdminTab;
      if (['live_orders', 'pos', 'menu', 'tables', 'eod', 'settings', 'support'].includes(hash)) {
        return hash;
      }
      const saved = localStorage.getItem('admin_active_tab') as AdminTab;
      if (saved && ['live_orders', 'pos', 'menu', 'tables', 'eod', 'settings', 'support'].includes(saved)) {
        return saved;
      }
    } catch { /* ignore */ }
    return 'live_orders';
  });

  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('admin_active_tab', tab);
      window.location.hash = tab;
    } catch { /* ignore */ }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Store state
  const [restaurant, setRestaurant] = useState<Restaurant>(store.getRestaurant());
  const [tables, setTables] = useState<RestaurantTable[]>(store.getTables());
  const [categories, setCategories] = useState<Category[]>(store.getCategories());
  const [products, setProducts] = useState<Product[]>(store.getProducts());
  const [orders, setOrders] = useState<Order[]>(store.getOrders());
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>(store.getServiceCalls());

  useEffect(() => {
    const update = () => {
      setRestaurant(store.getRestaurant());
      setTables(store.getTables());
      setCategories(store.getCategories());
      setProducts(store.getProducts());
      setOrders(store.getOrders());
      setServiceCalls(store.getServiceCalls());
    };

    const unsubscribe = store.subscribe(update);
    return () => unsubscribe();
  }, []);

  // Subscription Check
  const isTimed = restaurant.subscription_type === 'timed' && restaurant.subscription_expires_at;
  const daysLeft = isTimed 
    ? Math.ceil((new Date(restaurant.subscription_expires_at!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 999;
  
  const isSuspended = !restaurant.is_active || daysLeft < 0;

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500 text-white w-20 h-20 flex items-center justify-center rounded-full mb-6">
          <X className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Hesap Askıya Alındı</h1>
        <p className="text-slate-400 max-w-md mx-auto mb-8">
          Abonelik süreniz dolmuş veya işletme hesabınız yönetici tarafından kısıtlanmış. Lütfen sistem yöneticisi ile iletişime geçiniz.
        </p>
        <button onClick={onLogout} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 transition-colors text-white rounded-xl font-bold">
          Güvenli Çıkış Yap
        </button>
      </div>
    );
  }

  const activeOrdersCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing'
  ).length;

  const activeCallsCount = serviceCalls.filter((c) => c.status === 'active').length;
  const unreadSupportCount = store.getSupportMessages(restaurant.id).filter(
    (m) => m.sender_type === 'superadmin' && !m.is_read
  ).length;

  const navItems = [
    {
      id: 'live_orders' as AdminTab,
      label: 'Canlı Sipariş & Servis',
      icon: ChefHat,
      badge: activeOrdersCount + activeCallsCount > 0 ? `${activeOrdersCount + activeCallsCount}` : null,
      badgeColor: activeCallsCount > 0 ? 'bg-rose-500' : 'bg-amber-500',
    },
    {
      id: 'menu' as AdminTab,
      label: 'Menü & Çeşit Yönetimi',
      icon: UtensilsCrossed,
      badge: null,
    },
    {
      id: 'tables' as AdminTab,
      label: 'Masa & QR Kodlar',
      icon: QrCode,
      badge: `${tables.length} Masa`,
      badgeColor: 'bg-slate-700',
    },
    {
      id: 'support' as AdminTab,
      label: 'Canlı Destek & Yardım',
      icon: Headphones,
      badge: unreadSupportCount > 0 ? `${unreadSupportCount} Yeni` : null,
      badgeColor: 'bg-blue-600 animate-pulse',
    },
    {
      id: 'eod' as AdminTab,
      label: 'Gün Sonu & Kasa Analizi',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings' as AdminTab,
      label: 'İşletme & Wi-Fi Ayarları',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-72 bg-slate-950 text-white flex flex-col justify-between transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand & Logo */}
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-10 h-10 rounded-2xl object-cover border border-slate-700 bg-white"
              />
              <div className="min-w-0">
                <h1 className="font-extrabold text-sm truncate text-white">{restaurant.name}</h1>
                <span className="text-[10px] text-orange-400 font-semibold tracking-wider uppercase block">
                  Yönetim Paneli
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25 font-bold scale-[1.02]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 active:scale-98'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white ${
                        item.badgeColor || 'bg-orange-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom: Preview Customer QR Menu & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => onOpenCustomerMenu(1)}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
            <span>Müşteri Menüsünü Önizle</span>
          </button>
          
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Oturumu Kapat</span>
            </button>
          )}
        </div>
      </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top Header Mobile Toggle */}
          <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <img src={restaurant.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-bold text-slate-800">{restaurant.name}</span>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
  
          {isTimed && daysLeft <= 3 && (
            <div className="p-4 md:p-8 pb-0 max-w-7xl mx-auto mt-16 md:mt-0 w-full">
              <div className="bg-red-500 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg">
                <div className="font-bold flex items-center gap-2">
                  <X className="w-5 h-5 bg-white text-red-500 rounded-full" />
                  DİKKAT: Abonelik sürenizin dolmasına {daysLeft} gün kaldı. Lütfen sürenizi uzatın.
                </div>
              </div>
            </div>
          )}

        {/* Top Header Bar */}
        <header className="hidden md:flex sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Restoran: {restaurant.name}
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                {navItems.find((n) => n.id === activeTab)?.label || (activeTab === 'pos' ? 'Manuel Masa Satışı & POS' : '')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCustomerMenu(1)}
              className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3.5 py-2 rounded-xl transition-colors border border-orange-200/60"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Müşteri QR Menüsüne Geç</span>
              <span className="sm:hidden">Menü</span>
            </button>
          </div>
        </header>

        {/* Tab View Container */}
        <div className="p-4 sm:p-8 flex-1">
          {activeTab === 'live_orders' && (
            <LiveOrders
              orders={orders}
              serviceCalls={serviceCalls}
              currency={restaurant.currency}
              onOpenManualOrder={() => setActiveTab('pos')}
            />
          )}

          {activeTab === 'pos' && (
            <ManualPosScreen
              tables={tables}
              categories={categories}
              products={products}
              currency={restaurant.currency}
            />
          )}

          {activeTab === 'menu' && (
            <MenuManager
              categories={categories}
              products={products}
              currency={restaurant.currency}
            />
          )}

          {activeTab === 'tables' && (
            <TableManager
              tables={tables}
              restaurant={restaurant}
              onOpenCustomerMenuForTable={(tableNum) => onOpenCustomerMenu(tableNum)}
              onOpenManualOrderForTable={() => setActiveTab('pos')}
            />
          )}

          {activeTab === 'support' && <SupportChat restaurant={restaurant} />}

          {activeTab === 'eod' && <EndOfDayReport restaurant={restaurant} />}

          {activeTab === 'settings' && <RestaurantSettings restaurant={restaurant} />}
        </div>
      </main>
    </div>
  );
};
