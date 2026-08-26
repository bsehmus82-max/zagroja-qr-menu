import React, { useState, useEffect } from 'react';
import { CustomerMenu } from './components/customer/CustomerMenu';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLogin } from './components/admin/AdminLogin';
import { SetupWizard } from './components/admin/SetupWizard';
import { SuperAdmin } from './components/admin/SuperAdmin';
import { store, SUPER_ADMIN_SESSION_KEY } from './lib/store';

export function App() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(
    Boolean(localStorage.getItem(SUPER_ADMIN_SESSION_KEY))
  );

  const getPathInfo = () => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    return {
      isAdminPath: params.get('admin') === 'true' || path.startsWith('/admin'),
      isSuperAdminPath: path === '/super' || params.get('panel') === 'super',
      restaurantSlug: path.startsWith('/m/') ? path.replace('/m/', '').split('/')[0] : params.get('r'),
      tableNumber: parseInt(params.get('table') || '0', 10),
    };
  };

  const pathInfo = getPathInfo();

  const [isAdminView, setIsAdminView] = useState<boolean>(pathInfo.isAdminPath);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('app_admin_session'));
  });

  // Fetch tenant info on load
  useEffect(() => {
    // Determine active tenant context
    const storedSession = localStorage.getItem('app_admin_session');
    if (storedSession) {
      // If logged in, ensure store context is set to this user's restaurant
      const user = JSON.parse(storedSession);
      const userRest = store.getRestaurantByUsername(user.username);
      if (userRest) {
        store.setCurrentRestaurant(userRest.id);
        store.syncFromCloud();
      }
    } else if (pathInfo.restaurantSlug) {
      // Customer view
      const targetRest = store.getRestaurantBySlug(pathInfo.restaurantSlug);
      if (targetRest) {
        store.setCurrentRestaurant(targetRest.id);
        store.syncFromCloud();
      }
    }
  }, []);

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

  if (isSuperAdmin || pathInfo.isSuperAdminPath) {
    return <SuperAdmin onLogout={() => {
      localStorage.removeItem(SUPER_ADMIN_SESSION_KEY);
      window.location.href = '/';
    }} />;
  }

  if (isAdminView) {
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

  // Pure customer view
  const currentRest = store.getRestaurant();
  const validTable = pathInfo.tableNumber > 0 ? pathInfo.tableNumber : 1;

  if (!currentRest || !currentRest.setup_completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full">
          <h1 className="text-xl font-bold text-slate-800 mb-2">QR Menü</h1>
          <p className="text-slate-500">İşletme kurulumu henüz tamamlanmadı veya bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <CustomerMenu initialTableNumber={validTable} />
    </div>
  );
}
