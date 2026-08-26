import React, { useState } from 'react';
import { CustomerMenu } from './components/customer/CustomerMenu';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLogin } from './components/admin/AdminLogin';

export function App() {
  const isAdminPath = () => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    return params.get('admin') === 'true' || path.startsWith('/admin');
  };

  const [isAdminView, setIsAdminView] = useState<boolean>(isAdminPath());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('app_admin_session'));
  });

  const [activeTableNumber] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const tbl = params.get('table');
    return tbl ? parseInt(tbl, 10) : 1;
  });

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminView(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('app_admin_session');
    setIsAdminAuthenticated(false);
    setIsAdminView(false);
    window.location.href = '/';
  };

  if (isAdminView) {
    if (isAdminAuthenticated) {
      return (
        <AdminDashboard
          onOpenCustomerMenu={(tableNum = 1) => {
            window.location.href = `/?table=${tableNum}`;
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
          window.location.href = `/?table=${activeTableNumber}`;
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <CustomerMenu initialTableNumber={activeTableNumber} />
    </div>
  );
}

export default App;
