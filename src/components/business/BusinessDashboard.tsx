import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, ChefHat, Calculator, 
  TrendingUp, Settings, MessageSquare, LogOut, ExternalLink, QrCode,
  Menu, X, Users, AlertTriangle, Clock
} from 'lucide-react';
import { Business } from '../../types';
import { supabase } from '../../lib/supabase';
import { MenuManager } from './MenuManager';
import { TableManager } from './TableManager';
import { LiveOrders } from './LiveOrders';
import { ManualPos } from './ManualPos';
import { TurnoverReport } from './TurnoverReport';
import { BusinessSettings } from './BusinessSettings';
import { BusinessSupportChat } from './BusinessSupportChat';
import { BusinessOnboarding } from './BusinessOnboarding';
import { WaitersManager } from './WaitersManager';
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
    'orders' | 'pos' | 'menu' | 'tables' | 'waiters' | 'turnover' | 'settings' | 'support'
  >(() => {
    return (localStorage.getItem('biz_active_tab') as any) || 'orders';
  });
  const [tableCount, setTableCount] = useState<number>(0);
  const [unreadSupportCount, setUnreadSupportCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    localStorage.setItem('biz_active_tab', tab);
    setIsMobileMenuOpen(false);
  };

  const isFirstTime = !business.phone && !business.address;
  const [showOnboarding, setShowOnboarding] = useState(isFirstTime);

  // Check Trial & Monthly PDF Status for Notifications
  const now = new Date();
  const expiresAt = business.subscription_expires_at ? new Date(business.subscription_expires_at) : null;
  const diffDays = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  const isTrialExpiring = diffDays >= 0 && diffDays <= 3;
  const isMonthlyPdfReady = now.getDate() <= 5;

  const totalNotifications = unreadSupportCount + (isTrialExpiring ? 1 : 0) + (isMonthlyPdfReady ? 1 : 0);

  // Fetch Table Count & Unread Support Messages for Sidebar Badge
  useEffect(() => {
    const fetchCounts = async () => {
      const [tRes, sRes] = await Promise.all([
        supabase.from('tables').select('id').eq('business_id', business.id),
        supabase
          .from('support_messages')
          .select('id')
          .eq('business_id', business.id)
          .eq('sender', 'superadmin')
          .eq('is_read', false)
      ]);

      if (tRes.data) setTableCount(tRes.data.length);
      if (sRes.data) setUnreadSupportCount(sRes.data.length);
    };

    fetchCounts();

    const channel = supabase
      .channel(`sidebar-notifs-${business.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `business_id=eq.${business.id}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      label: 'Canlı Siparişler',
      icon: ChefHat,
      badge: null,
      isAlert: false,
    },
    {
      id: 'menu' as const,
      label: 'Menü & Ürünler',
      icon: UtensilsCrossed,
      badge: null,
      isAlert: false,
    },
    {
      id: 'tables' as const,
      label: 'Masa & QR Kodlar',
      icon: QrCode,
      badge: tableCount > 0 ? `${tableCount} Masa` : null,
      isAlert: false,
    },
    {
      id: 'pos' as const,
      label: 'Kasa / POS Satış',
      icon: Calculator,
      badge: null,
      isAlert: false,
    },
    {
      id: 'waiters' as const,
      label: 'Garson & Cihazlar',
      icon: Users,
      badge: null,
      isAlert: false,
    },
    {
      id: 'turnover' as const,
      label: 'Gün Sonu & Ciro',
      icon: TrendingUp,
      badge: null,
      isAlert: false,
    },
    {
      id: 'settings' as const,
      label: 'İşletme Ayarları',
      icon: Settings,
      badge: null,
      isAlert: false,
    },
    {
      id: 'support' as const,
      label: 'Yardım & Bildirimler',
      icon: MessageSquare,
      badge: totalNotifications > 0 ? totalNotifications.toString() : null,
      isAlert: totalNotifications > 0,
    },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case 'orders': return 'Canlı Sipariş & Servis';
      case 'menu': return 'Menü & Çeşit Yönetimi';
      case 'tables': return 'Masa & QR Kodlar';
      case 'pos': return 'Kasa / Hızlı POS Satışı';
      case 'waiters': return 'Garson & Cihaz Güvenliği';
      case 'turnover': return 'Gün Sonu & Kasa Analizi';
      case 'settings': return 'İşletme Ayarları';
      case 'support': return 'Yardım & Bildirimler';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-[#0B0F17] text-white p-4 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1 overflow-hidden shrink-0">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-slate-900 font-black text-xs">{business.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h1 className="font-extrabold text-xs tracking-wide uppercase truncate max-w-[140px]">{business.name}</h1>
            <p className="text-[9px] text-slate-400 font-semibold tracking-wider">YÖNETİM PANELİ</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-200"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-60 bg-[#0B0F17] text-slate-300 flex flex-col justify-between p-4 z-50 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-sm">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-slate-900 font-black text-sm">{business.name.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm text-white tracking-wide uppercase truncate max-w-[125px]">
                {business.name}
              </h2>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider">YÖNETİM PANELİ</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    item.isAlert ? (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse shrink-0">
                        {item.badge}
                      </span>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                        isActive ? 'bg-black/20 text-white' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.badge}
                      </span>
                    )
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Clean and minimal */}
        <div className="pt-4 border-t border-slate-800/80 space-y-1">
          <button
            onClick={onLogout}
            className="w-full py-2.5 px-3 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Oturumu Kapat</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div>
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
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-sm transition"
            >
              <QrCode className="w-3.5 h-3.5 text-orange-400" />
              <span>Müşteri Menüsünü Aç</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'orders' && <LiveOrders business={business} onNavigatePos={() => setActiveTab('pos')} />}
          {activeTab === 'pos' && <ManualPos business={business} />}
          {activeTab === 'menu' && <MenuManager business={business} />}
          {activeTab === 'tables' && <TableManager business={business} />}
          {activeTab === 'waiters' && <WaitersManager business={business} />}
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
