import React, { useState } from 'react';
import { CustomerMenu } from './components/customer/CustomerMenu';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLogin } from './components/admin/AdminLogin';

export function App() {
  const [currentView, setCurrentView] = useState<'customer' | 'admin'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || window.location.pathname.startsWith('/admin')) {
      return 'admin';
    }
    return 'customer';
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('zagroja_admin_session'));
  });

  const [activeTableNumber, setActiveTableNumber] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const tbl = params.get('table');
    return tbl ? parseInt(tbl, 10) : 1;
  });

  const handleOpenCustomerMenu = (tableNum = 1) => {
    setActiveTableNumber(tableNum);
    setCurrentView('customer');
    const newUrl = `${window.location.pathname}?table=${tableNum}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleOpenAdmin = () => {
    setCurrentView('admin');
    const newUrl = `${window.location.pathname}?admin=true`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setCurrentView('admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('zagroja_admin_session');
    setIsAdminAuthenticated(false);
    handleOpenCustomerMenu(activeTableNumber);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* Main View Router */}
      {currentView === 'customer' ? (
        <CustomerMenu
          initialTableNumber={activeTableNumber}
          onNavigateToAdmin={handleOpenAdmin}
        />
      ) : isAdminAuthenticated ? (
        <AdminDashboard
          onOpenCustomerMenu={handleOpenCustomerMenu}
          onLogout={handleLogout}
        />
      ) : (
        <AdminLogin
          onSuccess={handleLoginSuccess}
          onCancel={() => handleOpenCustomerMenu(activeTableNumber)}
        />
      )}
    </div>
  );
}

export default App;
