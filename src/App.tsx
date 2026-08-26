import React, { useState, useEffect } from 'react';
import { CustomerMenu } from './components/customer/CustomerMenu';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLogin } from './components/admin/AdminLogin';
import { SetupWizard } from './components/admin/SetupWizard';
import { SuperAdmin } from './components/admin/SuperAdmin';
import { PasswordResetScreen } from './components/admin/PasswordResetScreen';
import { store, SUPER_ADMIN_SESSION_KEY } from './lib/store';
import { supabase } from './lib/supabase';
import { LanguageProvider } from './lib/i18n';

export function App() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(
    Boolean(localStorage.getItem(SUPER_ADMIN_SESSION_KEY))
  );

  const getPathInfo = () => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    return {
      isAdminPath: params.get('admin') === 'true' || path.startsWith('/admin'),
      isSuperAdminPath: path.startsWith('/super') || params.get('panel') === 'super',
      resetToken: params.get('reset'),
      restaurantSlug: path.startsWith('/m/') ? path.replace('/m/', '').split('/')[0] : params.get('r'),
      tableNumber: parseInt(params.get('table') || '0', 10),
    };
  };

  const pathInfo = getPathInfo();

  // URL'de bir restoran slug yoksa (yani direkt ana sayfaya girildiyse), varsayılan olarak giriş ekranını göster.
  const [isAdminView, setIsAdminView] = useState<boolean>(pathInfo.isAdminPath || !pathInfo.restaurantSlug);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('app_admin_session'));
  });
  const [loadingTenant, setLoadingTenant] = useState<boolean>(true);

  // Fetch tenant info on load
  useEffect(() => {
    const init = async () => {
      const storedSession = localStorage.getItem('app_admin_session');
      if (storedSession) {
        try {
          const user = JSON.parse(storedSession);
          let userRest = store.getRestaurantByUsername(user.username);
          if (!userRest && user.slug) {
            userRest = await store.loadRestaurantBySlug(user.slug);
          }
          if (!userRest && user.username) {
            const { data } = await supabase.from('restaurants').select('*').ilike('owner_username', user.username).maybeSingle();
            if (data) {
              userRest = data as any;
              const all = store.getAllRestaurants();
              store.saveAllRestaurants([...all.filter(r => r.id !== userRest!.id), userRest!]);
            }
          }
          if (userRest) {
            store.setCurrentRestaurant(userRest.id);
            await store.syncFromCloud();
          }
        } catch (e) {
          console.warn('Session init error:', e);
        }
      } else if (pathInfo.restaurantSlug) {
        await store.loadRestaurantBySlug(pathInfo.restaurantSlug);
      }
      setLoadingTenant(false);
    };

    init();

    const unsubscribe = store.subscribe(() => {
      // Trigger re-render when store updates
      setLoadingTenant(false);
    });

    return () => unsubscribe();
  }, [pathInfo.restaurantSlug]);

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminView(true);
    // Refresh to apply context
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('app_admin_session');
    setIsAdminAuthenticated(false);
    setIsAdminView(false);
    window.location.href = '/';
  };

  if (pathInfo.resetToken) {
    return <PasswordResetScreen token={pathInfo.resetToken} onComplete={() => { window.location.href = '/'; }} />;
  }

  // Sadece süper admin yolundaysa (/?panel=super veya /super) Süper Admin panelini aç
  if (pathInfo.isSuperAdminPath) {
    return (
      <SuperAdmin
        onLogout={() => {
          localStorage.removeItem(SUPER_ADMIN_SESSION_KEY);
          setIsSuperAdmin(false);
          window.location.href = '/';
        }}
      />
    );
  }

  // Müşteri QR menüsü linki varsa (örn: ?r=slug veya /m/slug)
  if (pathInfo.restaurantSlug && !pathInfo.isAdminPath) {
    const currentRest = store.getRestaurant();
    const validTable = pathInfo.tableNumber > 0 ? pathInfo.tableNumber : 1;

    if (!currentRest || !currentRest.setup_completed) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full">
            <h1 className="text-xl font-bold text-slate-800 mb-2">QR Menü</h1>
            <p className="text-slate-500">İşletme kurulumu henüz tamamlanmadı veya bulunamadı.</p>
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

  // İşletme Yönetim Paneli veya İşletme Girişi
  if (isAdminAuthenticated) {
    const rest = store.getRestaurant();
    
    // If restaurant hasn't completed setup wizard, show it
    if (rest && !rest.setup_completed) {
      return <SetupWizard restaurant={rest} onComplete={() => window.location.reload()} />;
    }

    return (
      <AdminDashboard
        onOpenCustomerMenu={(tableNum = 1) => {
          window.open(`/?r=${rest.slug}&table=${tableNum}`, '_blank');
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <AdminLogin
      onSuccess={handleLoginSuccess}
      onCancel={() => {
        setIsAdminView(false);
        window.location.href = `/`;
      }}
    />
  );
}
