import React, { useState, useEffect } from 'react';
import { CustomerMenu } from './components/customer/CustomerMenu';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { BusinessLogin } from './components/business/BusinessLogin';
import { SuperAdminHQ } from './components/superadmin/SuperAdminHQ';
import { PasswordResetScreen } from './components/admin/PasswordResetScreen';
import { store } from './lib/store';
import { LanguageProvider } from './lib/i18n';

export function App() {
  const getPathInfo = () => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();

    const isSuperAdmin = 
      params.get('zagroja') === 'hq' ||
      path === '/zagroja-hq';

    const resetToken = params.get('reset');
    const restaurantSlug = params.get('r');
    const tableNumber = parseInt(params.get('table') || '0', 10);
    const isAdminParam = params.get('admin') === 'true';

    // If an invalid or legacy path like /super is visited, clean the browser URL
    if (!isSuperAdmin && !resetToken && !restaurantSlug && path !== '/' && path !== '') {
      try {
        window.history.replaceState({}, '', '/');
      } catch { /* ignore */ }
    }

    return {
      isSuperAdmin,
      resetToken,
      restaurantSlug,
      tableNumber,
      isAdminParam
    };
  };

  const pathInfo = getPathInfo();

  const [isBusinessAuthenticated, setIsBusinessAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('zagroja_business_session'));
  });

  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      const storedSession = localStorage.getItem('zagroja_business_session');
      if (storedSession) {
        try {
          const user = JSON.parse(storedSession);
          if (user.restaurantId) {
            store.setCurrentRestaurant(user.restaurantId);
            await store.syncFromCloud();
          } else {
            localStorage.removeItem('zagroja_business_session');
            setIsBusinessAuthenticated(false);
          }
        } catch {
          localStorage.removeItem('zagroja_business_session');
          setIsBusinessAuthenticated(false);
        }
      } else if (pathInfo.restaurantSlug) {
        await store.loadRestaurantBySlug(pathInfo.restaurantSlug);
      }
      setIsReady(true);
    };

    init();

    const unsubscribe = store.subscribe(() => {
      setIsReady(true);
    });

    return () => {
      unsubscribe();
    };
  }, [pathInfo.restaurantSlug]);

  // ============================================================
  // ROUTE 1: ZAGROJA MASTER SUPERADMIN HQ
  // ============================================================
  if (pathInfo.isSuperAdmin) {
    return (
      <SuperAdminHQ
        onLogout={() => {
          localStorage.removeItem('zagroja_super_admin_session');
          window.location.href = '/';
        }}
      />
    );
  }

  // ============================================================
  // ROUTE 2: PASSWORD RESET (15-MIN TOKEN)
  // ============================================================
  if (pathInfo.resetToken) {
    return (
      <PasswordResetScreen
        token={pathInfo.resetToken}
        onComplete={() => { window.location.href = '/'; }}
      />
    );
  }

  // ============================================================
  // ROUTE 3: CUSTOMER QR MENU (TABLE SPECIFIC)
  // ============================================================
  if (pathInfo.restaurantSlug && !pathInfo.isAdminParam) {
    const currentRest = store.getRestaurant();
    const validTable = pathInfo.tableNumber > 0 ? pathInfo.tableNumber : 1;

    if (!currentRest) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-white">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl text-center max-w-sm w-full">
            <h1 className="text-xl font-bold text-white mb-2">QR Menü</h1>
            <p className="text-xs text-slate-400">İşletme bulunamadı.</p>
          </div>
        </div>
      );
    }

    return (
      <LanguageProvider>
        <div className="min-h-screen bg-slate-100 font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <CustomerMenu initialTableNumber={validTable} />
        </div>
      </LanguageProvider>
    );
  }

  // ============================================================
  // ROUTE 4: BUSINESS MANAGEMENT PORTAL (LOGIN OR DASHBOARD)
  // ============================================================
  if (isBusinessAuthenticated) {
    const rest = store.getRestaurant();

    return (
      <AdminDashboard
        onOpenCustomerMenu={(tableNum = 1) => {
          window.open(`/?r=${rest.slug}&table=${tableNum}`, '_blank');
        }}
        onLogout={() => {
          localStorage.removeItem('zagroja_business_session');
          setIsBusinessAuthenticated(false);
          window.location.href = '/';
        }}
      />
    );
  }

  return (
    <BusinessLogin
      onSuccess={() => {
        setIsBusinessAuthenticated(true);
        window.location.reload();
      }}
    />
  );
}
