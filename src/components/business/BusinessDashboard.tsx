import React, { useState, useEffect } from 'react';
import { 
  BarChart3, UtensilsCrossed, ChefHat, Calculator, ClipboardList,
  TrendingUp, Settings, LogOut, ExternalLink, QrCode,
  Menu, X, Users, Volume2, Lock, Pin, PinOff, Printer, Receipt,
  LayoutDashboard, Sparkles, Palette, Wand2, Bell, MessageSquare, Bot,
  Pencil, GripVertical, ChevronUp, ChevronDown, RotateCcw, Check
} from 'lucide-react';
import { Business, Order, ServiceRequest } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../lib/audio';
import { sendNativeNotification } from '../../lib/notifications';
import { printKitchenTicket, isWebAutoPrintEnabled, setWebAutoPrintEnabled } from '../../lib/thermalPrinter';
import { useToast } from '../../context/ToastContext';
import { BusinessOverview } from './BusinessOverview';
import { MenuManager } from './MenuManager';
import { TableManager } from './TableManager';
import { LiveOrders } from './LiveOrders';
import { ManualPos } from './ManualPos';
import { TurnoverReport } from './TurnoverReport';
import { ExpensesManager } from './ExpensesManager';
import { BusinessSettings } from './BusinessSettings';
import { BusinessSupportChat } from './BusinessSupportChat';
import { WaitersManager, StaffManager } from './WaitersManager';
import { KitchenKds } from '../kitchen/KitchenKds';
import { AudioNotificationPermissionModal } from '../common/AudioNotificationPermissionModal';
import { ThemeCustomizerModal } from './ThemeCustomizerModal';
import { ArtisticQrStudioModal } from './ArtisticQrStudioModal';

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
  const toast = useToast();
  const [business, setBusiness] = useState<Business>(initialBusiness);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'kitchen' | 'pos' | 'menu' | 'tables' | 'waiters' | 'expenses' | 'turnover' | 'settings' | 'support'
  >(() => {
    return (localStorage.getItem('biz_active_tab') as any) || 'overview';
  });
  const [unreadSupportCount, setUnreadSupportCount] = useState<number>(0);
  const [pendingCallsCount, setPendingCallsCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [showThemeStudio, setShowThemeStudio] = useState(false);
  const [showQrStudio, setShowQrStudio] = useState(false);
  const [menuRefreshKey, setMenuRefreshKey] = useState(0);

  // Supabase style hover-to-expand sidebar with pin support
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    return localStorage.getItem('biz_sidebar_pinned') === 'true';
  });

  const isExpanded = isPinned || isHovered;

  const togglePin = () => {
    const next = !isPinned;
    setIsPinned(next);
    localStorage.setItem('biz_sidebar_pinned', next.toString());
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    localStorage.setItem('biz_active_tab', tab);
    setIsMobileMenuOpen(false);
  };

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  // Check Trial & Monthly PDF Status for Notifications
  const now = new Date();
  const expiresAt = business.subscription_expires_at ? new Date(business.subscription_expires_at) : null;
  const diffDays = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  const isTrialExpiring = diffDays >= 0 && diffDays <= 3;
  const isMonthlyPdfReady = now.getDate() <= 5;

  // Set browser tab title strictly to business name
  useEffect(() => {
    if (business?.name) {
      document.title = business.name;
    }
  }, [business?.name]);

  const totalNotifications = unreadSupportCount + (isTrialExpiring ? 1 : 0) + (isMonthlyPdfReady ? 1 : 0);

  // Global Realtime Listener for Sound, Notifications, Auto-Print across ALL Tabs
  useEffect(() => {
    const fetchCounts = async () => {
      const [sRes, cRes] = await Promise.all([
        supabase
          .from('support_messages')
          .select('id')
          .eq('business_id', business.id)
          .eq('sender', 'superadmin')
          .eq('is_read', false),
        supabase
          .from('service_requests')
          .select('id')
          .eq('business_id', business.id)
          .eq('status', 'pending')
      ]);

      if (sRes.data) setUnreadSupportCount(sRes.data.length);
      if (cRes.data) setPendingCallsCount(cRes.data.length);
    };

    fetchCounts();

    const channel = supabase
      .channel(`global-biz-listener-${business.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          const newOrder = payload.new as Order;
          sound.playOrderBell(business.sound_preference);
          
          // Automatic Web & Thermal Ticket Printing
          printKitchenTicket(business, newOrder);
          
          toast.info(`${newOrder.table_no} için yeni sipariş geldi (${newOrder.total_amount.toFixed(2)} ₺)`);
          sendNativeNotification({
            title: `Yeni Sipariş: ${newOrder.table_no}`,
            body: `${newOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ')} (${newOrder.total_amount.toFixed(2)} ₺)`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          const newReq = payload.new as ServiceRequest;
          sound.playWaiterCall(business.sound_preference);
          const reqLabel =
            newReq.request_type === 'waiter'
              ? 'Garson Çağrısı'
              : newReq.request_type === 'bill_cash'
              ? 'Hesap İste (Nakit)'
              : 'Hesap İste (POS / Kart)';

          toast.warning(`${newReq.table_no}: ${reqLabel}`);
          sendNativeNotification({
            title: `${newReq.table_no}: ${reqLabel}`,
            body: `${newReq.table_no} masası servis personeli bekliyor.`,
          });
          fetchCounts();
        }
      )
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
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
  }, [business.id, business.sound_preference]);

  const menuLiveUrl = `${window.location.origin}/m/${business.slug}`;
  const DEFAULT_NAV_IDS = [
    'orders',
    'kitchen',
    'tables',
    'pos',
    'waiters',
    'menu',
    'expenses',
    'turnover',
    'overview',
    'support',
  ] as const;

  const [navOrder, setNavOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem(`biz_sidebar_nav_order_${business.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validIds = parsed.filter((id) => DEFAULT_NAV_IDS.includes(id as any));
          DEFAULT_NAV_IDS.forEach((id) => {
            if (!validIds.includes(id)) validIds.push(id);
          });
          return validIds;
        }
      } catch {}
    }
    return [...DEFAULT_NAV_IDS];
  });

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Keep-Alive visited tabs memory to prevent reloading, reset and flicker on tab switch
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set([activeTab]));

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  const handleMoveNav = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= navOrder.length) return;
    const newOrder = [...navOrder];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    setNavOrder(newOrder);
    localStorage.setItem(`biz_sidebar_nav_order_${business.id}`, JSON.stringify(newOrder));
  };

  const handleResetNavOrder = () => {
    setNavOrder([...DEFAULT_NAV_IDS]);
    localStorage.removeItem(`biz_sidebar_nav_order_${business.id}`);
    toast.success('Menü sıralaması varsayılana sıfırlandı.');
  };

  const isLitePlan = business.plan_type === 'lite';

  const isTabLockedInLite = (tabId: string) => {
    if (!isLitePlan) return false;
    return ['orders', 'pos', 'waiters', 'expenses', 'turnover'].includes(tabId);
  };

  const allNavMap: Record<string, any> = {
    orders: {
      id: 'orders' as const,
      label: 'Canlı Siparişler',
      icon: ClipboardList,
      badge: isTabLockedInLite('orders') ? 'Kilitli' : pendingCallsCount > 0 ? `${pendingCallsCount} Çağrı` : null,
      isAlert: !isTabLockedInLite('orders') && pendingCallsCount > 0,
      isLocked: isTabLockedInLite('orders'),
    },
    kitchen: {
      id: 'kitchen' as const,
      label: 'Mutfak Ekranı',
      icon: ChefHat,
      badge: isTabLockedInLite('kitchen') ? 'Kilitli' : null,
      isAlert: false,
      isLocked: isTabLockedInLite('kitchen'),
    },
    tables: {
      id: 'tables' as const,
      label: 'Masa & QR Kodlar',
      icon: QrCode,
      badge: null,
      isAlert: false,
      isLocked: false,
    },
    pos: {
      id: 'pos' as const,
      label: 'Kasa / POS Satış',
      icon: Calculator,
      badge: isTabLockedInLite('pos') ? 'Kilitli' : null,
      isAlert: false,
      isLocked: isTabLockedInLite('pos'),
    },
    waiters: {
      id: 'waiters' as const,
      label: 'Personeller & Yetkiler',
      icon: Users,
      badge: isTabLockedInLite('waiters') ? 'Kilitli' : null,
      isAlert: false,
      isLocked: isTabLockedInLite('waiters'),
    },
    menu: {
      id: 'menu' as const,
      label: 'Menü & Ürünler',
      icon: UtensilsCrossed,
      badge: null,
      isAlert: false,
      isLocked: false,
    },
    expenses: {
      id: 'expenses' as const,
      label: 'Gider & Masraflar',
      icon: Receipt,
      badge: null,
      isAlert: false,
      isLocked: false,
    },
    turnover: {
      id: 'turnover' as const,
      label: 'Gün Sonu & Kasa',
      icon: TrendingUp,
      badge: isTabLockedInLite('turnover') ? 'Kilitli' : null,
      isAlert: false,
      isLocked: isTabLockedInLite('turnover'),
    },
    overview: {
      id: 'overview' as const,
      label: 'Genel Özet & Analiz',
      icon: LayoutDashboard,
      badge: null,
      isAlert: false,
      isLocked: false,
    },
    support: {
      id: 'support' as const,
      label: 'Sorun Bildir & Destek',
      icon: Bell,
      badge: totalNotifications > 0 ? totalNotifications.toString() : null,
      isAlert: totalNotifications > 0,
      isLocked: false,
    },
    settings: {
      id: 'settings' as const,
      label: 'İşletme ve Panel Ayarları',
      icon: Settings,
      badge: null,
      isAlert: false,
      isLocked: false,
    },
  };

  const navItems = navOrder.map((id) => allNavMap[id]).filter(Boolean);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Genel Özet & İşletme Performansı';
      case 'orders': return 'Canlı Sipariş & Servis';
      case 'kitchen': return 'Mutfak & Hazırlık Ekranı';
      case 'menu': return 'Menü & Çeşit Yönetimi';
      case 'tables': return 'Masa & QR Kodlar';
      case 'pos': return 'Kasa / Hızlı POS Satışı';
      case 'waiters': return 'Personel & Terminal Yetkilendirme';
      case 'expenses': return 'Gider & Masraf Yönetimi';
      case 'turnover': return 'Gün Sonu & Kasa Analizi';
      case 'settings': return 'İşletme ve Panel Ayarları';
      case 'support': return 'Sorun Bildir & Bildirimler';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#0C1017] text-slate-200 flex flex-col md:flex-row font-medium selection:bg-white/20 selection:text-white relative">
      {/* Audio & Notification Visual Permission Guide Modal */}
      <AudioNotificationPermissionModal forceOpen={showPermModal} onClose={() => setShowPermModal(false)} />

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
        />
      )}

      {/* Desktop Non-Shifting Backdrop Blur */}
      <div 
        className={`hidden md:block fixed inset-0 left-[76px] bg-black/35 backdrop-blur-[2px] z-40 transition-opacity duration-300 pointer-events-none ${
          isHovered && !isPinned ? 'opacity-100' : 'opacity-0'
        }`} 
      />

      {/* Mobile Top Header Bar */}
      <div className="md:hidden bg-[#111622] text-slate-200 p-3.5 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1C2433] flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-sm">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <span className="text-white font-black text-xs">{business.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h1 className="font-extrabold text-xs tracking-wide uppercase truncate max-w-[150px] text-white">{business.name}</h1>
            <p className="text-[9px] text-slate-400 font-semibold tracking-wider">{getPageTitle()}</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2.5 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-slate-300 active:scale-95 transition"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 
        Ultra-Clean, Stable, Non-Jumping Sidebar:
        - The logo and all icons have a fixed left position (zero horizontal shift on hover).
        - Only the width expands/collapses smoothly.
        - Text smoothly fades in/out without any lag or jumping.
      */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          fixed top-0 left-0 h-screen bg-[#111622] text-slate-300 flex flex-col justify-between py-4 z-50 shadow-[6px_0_30px_rgba(0,0,0,0.6)] overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isExpanded ? 'w-72' : 'w-[76px]'}
          ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="space-y-2.5 px-3 flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Brand Header: Logo position is 100% fixed at left:0 */}
          <div className="flex items-center justify-between pb-2 min-h-[50px] shrink-0">
            <div className="flex items-center w-full min-w-0">
              {/* Perfectly stationary and centered logo slot (Matches 52px nav slot exactly) */}
              <div className="w-[52px] flex items-center justify-center shrink-0">
                <div 
                  onMouseMove={handleSpotlightMove}
                  className="w-10 h-10 rounded-2xl bg-[#1C2433] p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md transition-transform duration-200 hover:scale-105 spotlight-card spotlight-glow"
                >
                  {business.logo_url ? (
                    <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full bg-[#1C2433] flex items-center justify-center text-white font-extrabold text-sm">
                      {business.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* Text label: Smoothly fades in/out without shifting the logo */}
              <div 
                className={`min-w-0 flex-1 transition-opacity duration-200 whitespace-nowrap overflow-hidden ${
                  isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <h2 className="font-extrabold text-xs text-white tracking-wide uppercase truncate">
                  {business.name}
                </h2>
                <p className="text-[9px] text-slate-400 font-semibold tracking-wider mt-0.5">YÖNETİM PANELİ</p>
              </div>

              {/* Header Action Buttons (Reorder Pencil & Pin) */}
              {isExpanded && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setIsReorderMode(!isReorderMode)}
                    title={isReorderMode ? 'Sıralamayı Kaydet' : 'Modül Sıralamasını Düzenle'}
                    className={`p-1.5 rounded-lg transition active:scale-90 ${
                      isReorderMode 
                        ? 'bg-white text-slate-900 font-bold shadow-md' 
                        : 'text-slate-400 hover:text-white hover:bg-[#1C2433]'
                    }`}
                  >
                    {isReorderMode ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={togglePin}
                    title={isPinned ? 'Menüyü Daralt' : 'Menüyü Sabitle'}
                    className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C2433] transition active:scale-90"
                  >
                    {isPinned ? <PinOff className="w-3.5 h-3.5 text-white" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Header Bottom Edge-Fading Vignette Divider */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-1.5 mx-2 shrink-0 pointer-events-none" />

          {/* Reorder Mode Helper Notice */}
          {isExpanded && isReorderMode && (
            <div className="p-2 bg-[#0C1017] rounded-xl flex items-center justify-between text-[11px] font-bold text-slate-300 animate-in fade-in duration-200 shrink-0">
              <span className="flex items-center gap-1.5 text-slate-200 truncate">
                <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Basılı tutun veya oklarla taşıyın</span>
              </span>
              <button
                onClick={handleResetNavOrder}
                title="Varsayılan sıralamaya dön"
                className="p-1 hover:bg-[#1C2433] text-slate-400 hover:text-white rounded-lg transition shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Navigation Items (Icons are stationary at left, text smoothly fades) */}
          <nav className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-none">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isDragging = draggedIdx === index;
              const isDragOver = dragOverIdx === index && draggedIdx !== index;

              return (
                <React.Fragment key={item.id}>
                  <div
                    draggable={isReorderMode}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(index));
                      setDraggedIdx(index);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIdx(index);
                    }}
                    onDragLeave={() => {
                      if (dragOverIdx === index) setDragOverIdx(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                      if (!isNaN(from) && from !== index) {
                        handleMoveNav(from, index);
                      }
                      setDraggedIdx(null);
                      setDragOverIdx(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIdx(null);
                      setDragOverIdx(null);
                    }}
                    className={`transition-all duration-200 ${
                      isDragging
                        ? 'opacity-30 scale-95'
                        : isDragOver
                        ? 'scale-[1.02] bg-white/[0.08] rounded-2xl'
                        : ''
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (!isReorderMode) handleTabChange(item.id);
                      }}
                      onMouseMove={handleSpotlightMove}
                      title={!isExpanded ? item.label : undefined}
                      className={`w-full flex items-center h-12 rounded-2xl text-xs font-bold transition-colors duration-150 group relative select-none spotlight-card spotlight-glow ${
                        isReorderMode
                          ? 'cursor-grab active:cursor-grabbing hover:bg-white/[0.06]'
                          : 'active:scale-[0.98]'
                      } ${
                        isActive && !isReorderMode
                          ? 'bg-white/[0.12] text-white shadow-sm'
                          : item.isLocked
                          ? 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      {/* Active Bar */}
                      {isActive && !isReorderMode && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-sm z-10" />
                      )}

                      {/* Fixed Icon Container (Width is exactly 52px so icon is always centered at left column) */}
                      <div className="w-[52px] h-full flex items-center justify-center shrink-0 relative z-10">
                        {isExpanded && isReorderMode ? (
                          <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                        ) : (
                          <Icon className={`w-[22px] h-[22px] transition-transform duration-200 ${isActive ? 'text-white scale-110' : item.isLocked ? 'text-slate-500' : 'text-slate-400 group-hover:text-white group-hover:scale-110'}`} />
                        )}
                      </div>

                      {/* Text Label & Badge (Smooth fade) */}
                      <div 
                        className={`flex-1 flex items-center justify-between pr-3 min-w-0 transition-opacity duration-200 relative z-10 ${
                          isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                      >
                        <span className="whitespace-nowrap overflow-hidden text-left truncate">
                          {item.label}
                        </span>

                        {isReorderMode ? (
                          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleMoveNav(index, index - 1)}
                              disabled={index === 0}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1C2433] disabled:opacity-20 transition active:scale-90"
                              title="Yukarı Taşı"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveNav(index, index + 1)}
                              disabled={index === navItems.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1C2433] disabled:opacity-20 transition active:scale-90"
                              title="Aşağı Taşı"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : item.isLocked ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Lite</span>
                          </span>
                        ) : item.badge ? (
                          item.isAlert ? (
                            <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black flex items-center justify-center animate-pulse shrink-0">
                              {item.badge}
                            </span>
                          ) : (
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold shrink-0 ${
                              isActive ? 'bg-white/20 text-white' : 'bg-[#1C2433] text-slate-300'
                            }`}>
                              {item.badge}
                            </span>
                          )
                        ) : null}
                      </div>

                      {/* Dot indicator when collapsed and has alert */}
                      {!isExpanded && item.isAlert && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-400 animate-ping z-10" />
                      )}
                    </button>
                  </div>

                  {/* Balanced Vignette Divider Between Logical Navigation Groups */}
                  {(index === 3 || index === 6) && (
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-1.5 mx-2 shrink-0 pointer-events-none" />
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom: Settings + Preview QR Menu Button & Logout */}
        <div className="space-y-1.5 pt-1 px-3 shrink-0">
          {/* Inset Vignette Divider Before Settings */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-1.5 mx-2 shrink-0 pointer-events-none" />

          {/* Settings Tab Button */}
          <button
            onClick={() => handleTabChange('settings')}
            onMouseMove={handleSpotlightMove}
            title={!isExpanded ? 'İşletme ve Panel Ayarları' : undefined}
            className={`w-full flex items-center h-12 rounded-2xl text-xs font-bold transition-colors duration-150 group relative select-none active:scale-[0.98] spotlight-card spotlight-glow ${
              activeTab === 'settings'
                ? 'bg-white/[0.12] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {/* Active Indicator Bar */}
            {activeTab === 'settings' && (
              <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-sm z-10" />
            )}

            {/* Fixed 52px Icon Container */}
            <div className="w-[52px] h-full flex items-center justify-center shrink-0 relative z-10">
              <Settings className={`w-[22px] h-[22px] transition-transform duration-200 ${activeTab === 'settings' ? 'text-white scale-110' : 'text-slate-400 group-hover:text-white group-hover:scale-110'}`} />
            </div>

            {/* Text Label */}
            <div 
              className={`flex-1 flex items-center justify-between pr-3 min-w-0 transition-opacity duration-200 relative z-10 ${
                isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <span className="whitespace-nowrap overflow-hidden text-left truncate">
                İşletme ve Panel Ayarları
              </span>
            </div>
          </button>

          {/* Inset Vignette Divider Before QR Menu & Logout */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-1.5 mx-2 shrink-0 pointer-events-none" />

          {/* Müşteri Menüsünü Aç */}
          <a
            href={menuLiveUrl}
            target="_blank"
            rel="noreferrer"
            onMouseMove={handleSpotlightMove}
            title={!isExpanded ? 'Müşteri Menüsünü Aç' : undefined}
            className="w-full flex items-center h-12 rounded-2xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors duration-150 group relative select-none active:scale-[0.98] spotlight-card spotlight-glow"
          >
            <div className="w-[52px] h-full flex items-center justify-center shrink-0 relative z-10">
              <QrCode className="w-[22px] h-[22px] text-slate-400 group-hover:text-white group-hover:scale-110 transition-transform" />
            </div>

            <div 
              className={`flex-1 flex items-center justify-between pr-3 min-w-0 transition-opacity duration-200 relative z-10 ${
                isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <span className="whitespace-nowrap overflow-hidden truncate">
                Müşteri Menüsünü Aç
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform group-hover:translate-x-0.5 shrink-0" />
            </div>
          </a>

          {/* Logout */}
          <button
            onClick={onLogout}
            onMouseMove={handleSpotlightMove}
            title={!isExpanded ? 'Oturumu Kapat' : undefined}
            className="w-full h-12 text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-colors duration-150 flex items-center active:scale-95 group spotlight-card spotlight-glow"
          >
            <div className="w-[52px] h-full flex items-center justify-center shrink-0 relative z-10">
              <LogOut className="w-[22px] h-[22px] shrink-0 transition-transform group-hover:-translate-x-0.5" />
            </div>
            <div 
              className={`flex-1 text-left min-w-0 transition-opacity duration-200 relative z-10 ${
                isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <span className="whitespace-nowrap overflow-hidden truncate">
                Oturumu Kapat
              </span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 min-h-screen bg-[#0C1017] transition-[padding] duration-300 ${isPinned ? 'md:pl-72' : 'md:pl-[76px]'}`}>
        {/* Top Header Bar */}
        <header className="bg-[#111622] sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
          <div>
            <h1 className="text-sm sm:text-base font-black text-slate-100 tracking-tight">
              {getPageTitle()}
            </h1>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24">
          {isTabLockedInLite(activeTab) ? (
            <div className="bg-[#111622] rounded-2xl p-6 sm:p-8 max-w-xl mx-auto text-center space-y-5 shadow-2xl my-8">
              <div className="w-16 h-16 rounded-2xl bg-[#1C2433] text-slate-300 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/10 text-slate-200">
                  Standart & Profesyonel Paket Özelliği
                </span>
                <h3 className="text-lg font-black text-slate-100">
                  {activeTab === 'orders' ? 'Canlı Sipariş & Adisyon Modülü' :
                   activeTab === 'pos' ? 'Kasa / Hızlı POS Satış Modülü' :
                   activeTab === 'waiters' ? 'Garson El Terminalleri & Cihaz Yönetimi' :
                   activeTab === 'expenses' ? 'Gider & Masraf Yönetim Modülü' :
                   'Gün Sonu & Kasa Analizi'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                  İşletmeniz şu anda <strong>Lite (Sadece Akıllı QR Menü)</strong> paketindedir. Masadan doğrudan sipariş alma, otomatik termal fiş yazdırma motoru, garson çağrıları, gider takibi ve POS modülünü aktif etmek için paketinizi Standart veya Profesyonel plana yükseltebilirsiniz.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => handleTabChange('support')}
                  className="w-full sm:w-auto px-6 py-3 bg-white text-slate-900 hover:bg-slate-200 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Canlı Destekten Paket Yükseltme İste</span>
                </button>
                <button
                  onClick={() => handleTabChange('menu')}
                  className="w-full sm:w-auto px-5 py-3 bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold text-xs rounded-xl transition"
                >
                  Menü Yönetimine Dön
                </button>
              </div>
            </div>
          ) : (
            <>
              {visitedTabs.has('overview') && (
                <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
                  <BusinessOverview business={business} />
                </div>
              )}
              {visitedTabs.has('orders') && (
                <div className={activeTab === 'orders' ? 'block' : 'hidden'}>
                  <LiveOrders business={business} onNavigatePos={() => handleTabChange('pos')} />
                </div>
              )}
              {visitedTabs.has('kitchen') && (
                <div className={activeTab === 'kitchen' ? 'block' : 'hidden'}>
                  <KitchenKds business={business} />
                </div>
              )}
              {visitedTabs.has('pos') && (
                <div className={activeTab === 'pos' ? 'block' : 'hidden'}>
                  <ManualPos business={business} />
                </div>
              )}
              {visitedTabs.has('menu') && (
                <div className={activeTab === 'menu' ? 'block' : 'hidden'}>
                  <MenuManager 
                    key={menuRefreshKey} 
                    business={business} 
                    onOpenThemeStudio={() => setShowThemeStudio(true)}
                  />
                </div>
              )}
              {visitedTabs.has('tables') && (
                <div className={activeTab === 'tables' ? 'block' : 'hidden'}>
                  <TableManager 
                    business={business} 
                    onOpenQrStudio={() => setShowQrStudio(true)}
                  />
                </div>
              )}
              {visitedTabs.has('waiters') && (
                <div className={activeTab === 'waiters' ? 'block' : 'hidden'}>
                  <WaitersManager business={business} />
                </div>
              )}
              {visitedTabs.has('expenses') && (
                <div className={activeTab === 'expenses' ? 'block' : 'hidden'}>
                  <ExpensesManager business={business} />
                </div>
              )}
              {visitedTabs.has('turnover') && (
                <div className={activeTab === 'turnover' ? 'block' : 'hidden'}>
                  <TurnoverReport business={business} />
                </div>
              )}
              {visitedTabs.has('settings') && (
                <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
                  <BusinessSettings
                    business={business}
                    onUpdate={(updated) => {
                      setBusiness(updated);
                      onBusinessUpdate?.(updated);
                    }}
                  />
                </div>
              )}
              {visitedTabs.has('support') && (
                <div className={activeTab === 'support' ? 'block' : 'hidden'}>
                  <BusinessSupportChat business={business} />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Brand Theme & Typography Studio Modal */}
      <ThemeCustomizerModal
        isOpen={showThemeStudio}
        onClose={() => setShowThemeStudio(false)}
        business={business}
        onThemeUpdated={(updatedBiz) => {
          setBusiness(updatedBiz);
          onBusinessUpdate?.(updatedBiz);
        }}
      />

      {/* Artistic & Colorful QR Studio Modal */}
      <ArtisticQrStudioModal
        isOpen={showQrStudio}
        onClose={() => setShowQrStudio(false)}
        business={business}
        onThemeUpdated={(updatedBiz) => {
          setBusiness(updatedBiz);
          onBusinessUpdate?.(updatedBiz);
        }}
      />
    </div>
  );
};
