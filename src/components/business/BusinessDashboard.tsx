import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, ChefHat, Calculator, 
  TrendingUp, Settings, MessageSquare, LogOut, ExternalLink, QrCode,
  Menu, X
} from 'lucide-react';
import { Business, Table } from '../../types';
import { supabase } from '../../lib/supabase';
import { MenuManager } from './MenuManager';
import { TableManager } from './TableManager';
import { LiveOrders } from './LiveOrders';
import { ManualPos } from './ManualPos';
import { TurnoverReport } from './TurnoverReport';
import { BusinessSettings } from './BusinessSettings';
import { BusinessSupportChat } from './BusinessSupportChat';
import { BusinessOnboarding } from './BusinessOnboarding';
import { NotificationPrompt } from '../common/NotificationPrompt';
import { PwaInstallPrompt } from '../common/PwaInstallPrompt';

interface BusinessDashboardProps {
  initialBusiness: Business;
  onLogout: () => void;
  onBusinessUpdate?: (updated: Business) => void;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({
  initialBusiness,
  onLogout,
  onBusinessUpdate,
}) => {
  const [business, setBusiness] = useState<Business>(initialBusiness);
  const [activeTab, setActiveTab] = useState<
    'orders' | 'pos' | 'menu' | 'tables' | 'turnover' | 'settings' | 'support'
  >('orders');
  const [tableCount, setTableCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isFirstTime = !business.phone && !business.address;
  const [showOnboarding, setShowOnboarding] = useState(isFirstTime);

  // Fetch Table Count for the Sidebar Badge
  useEffect(() => {
    const fetchTableCount = async () => {
      const { data } = await supabase
        .from('tables')
        .select('id')
        .eq('business_id', business.id);
      if (data) setTableCount(data.length);
    };
    fetchTableCount();
  }, [business.id, activeTab]);

  if (showOnboarding) {
    return (
      <BusinessOnboarding
        business={business}
        onComplete={(updated) => {
          setBusiness(updated);
          setShowOnboarding(false);
          onBusinessUpdate?.(updated);
        }}
      />
    );
  }

  const menuLiveUrl = `${window.location.origin}/m/${business.slug}`;

  const navItems = [
    {
      id: 'orders' as const,
      label: 'Canlı Sipariş & Servis',
      icon: ChefHat,
      badge: null,
    },
    {
      id: 'menu' as const,
      label: 'Menü & Çeşit Yönetimi',
      icon: UtensilsCrossed,
      badge: null,
    },
    {
      id: 'tables' as const,
      label: 'Masa & QR Kodlar',
      icon: QrCode,
      badge: `${tableCount} Masa`,
    },
    {
      id: 'pos' as const,
      label: 'Kasa / POS Satış',
      icon: Calculator,
      badge: null,
    },
    {
      id: 'turnover' as const,
      label: 'Gün Sonu & Kasa Analizi',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'settings' as const,
      label: 'İşletme & Wi-Fi Ayarları',
      icon: Settings,
      badge: null,
    },
    {
      id: 'support' as const,
      label: 'Canlı Destek',
      icon: MessageSquare,
      badge: null,
    },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case 'orders': return 'Canlı Sipariş & Servis';
      case 'menu': return 'Menü & Çeşit Yönetimi';
      case 'tables': return 'Masa & QR Kod Yönetimi';
      case 'pos': return 'Kasa / POS Sipariş Masası';
      case 'turnover': return 'Gün Sonu & Kasa Analizi';
      case 'settings': return 'İşletme & Wi-Fi Ayarları';
      case 'support': return 'Canlı Destek ve Duyurular';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#0B0F17] text-white p-4 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1 overflow-hidden shrink-0">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-slate-900 font-extrabold text-xs">{business.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h1 className="font-extrabold text-xs tracking-wide uppercase">{business.name}</h1>
            <p className="text-[10px] text-slate-400">YÖNETİM PANELİ</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-200"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left Sidebar (Deep Slate/Navy with Vibrant Orange Pill) */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0B0F17] text-slate-300 flex flex-col justify-between p-4 z-50 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-sm">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-slate-900 font-extrabold text-sm">{business.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white tracking-wide uppercase truncate max-w-[130px]">
                {business.name}
              </h2>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider">YÖNETİM PANELİ</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${
                      isActive ? 'bg-black/20 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-2 pt-4 border-t border-slate-800/80">
          <a
            href={menuLiveUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
            <span>Müşteri Menüsünü Önizle</span>
          </a>

          <button
            onClick={onLogout}
            className="w-full py-2 px-3 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Oturumu Kapat</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area (Clean Off-White) */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar on Light Background */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              RESTORAN: {business.name}
            </span>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <NotificationPrompt />
            <PwaInstallPrompt panelName={business.name} />

            <a
              href={menuLiveUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition"
            >
              <QrCode className="w-3.5 h-3.5 text-orange-500" />
              <span>Müşteri QR Menüsüne Geç</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </header>

        {/* Tab Body */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'orders' && <LiveOrders business={business} onNavigatePos={() => setActiveTab('pos')} />}
          {activeTab === 'pos' && <ManualPos business={business} />}
          {activeTab === 'menu' && <MenuManager business={business} />}
          {activeTab === 'tables' && <TableManager business={business} />}
          {activeTab === 'turnover' && <TurnoverReport business={business} />}
          {activeTab === 'settings' && (
            <BusinessSettings
              business={business}
              onUpdate={(updated) => {
                setBusiness(updated);
                onBusinessUpdate?.(updated);
              }}
            />
          )}
          {activeTab === 'support' && <BusinessSupportChat business={business} />}
        </div>
      </main>
    </div>
  );
};
