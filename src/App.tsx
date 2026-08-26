import React, { useState } from 'react';
import { CustomerMenu } from './components/customer/CustomerMenu';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLogin } from './components/admin/AdminLogin';
import { LayoutGrid, QrCode } from 'lucide-react';

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
      {/* Floating Demo Mode Switcher Bar */}
      <div className="fixed top-2 right-2 z-50 flex items-center gap-1 bg-black/85 backdrop-blur-md p-1 rounded-full shadow-2xl border border-white/20">
        <button
          onClick={() => handleOpenCustomerMenu(activeTableNumber)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            currentView === 'customer'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Müşteri Menüsü (Masa {activeTableNumber})</span>
        </button>

        <button
          onClick={handleOpenAdmin}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            currentView === 'admin'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Admin Paneli</span>
        </button>
      </div>

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
