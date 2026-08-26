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
import { 
  ChefHat, 
  UtensilsCrossed, 
  QrCode, 
  BarChart3, 
  Settings, 
  ExternalLink, 
  BellRing, 
  Menu as MenuIcon, 
  X, 
  Sparkles,
  Layers
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenCustomerMenu: (tableNumber?: number) => void;
  onLogout?: () => void;
}

type AdminTab = 'live_orders' | 'menu' | 'tables' | 'eod' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenCustomerMenu,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('live_orders');
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

  const activeOrdersCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing'
  ).length;

  const activeCallsCount = serviceCalls.filter((c) => c.status === 'active').length;

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
            <span>Müşteri Menüsünü Aç</span>
          </button>
          
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Oturumu Kapat</span>
            </button>
          )}

          <p className="text-[10px] text-slate-500 text-center">
            Zagroja ID Tabanlı QR Menü
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Restoran ID: {restaurant.slug}
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenCustomerMenu(1)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3.5 py-2 rounded-xl transition-colors border border-orange-200/60"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Menü Simülatörü</span>
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
            />
          )}

          {activeTab === 'eod' && <EndOfDayReport restaurant={restaurant} />}

          {activeTab === 'settings' && <RestaurantSettings restaurant={restaurant} />}
        </div>
      </main>
    </div>
  );
};
