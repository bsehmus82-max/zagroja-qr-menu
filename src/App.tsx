import React, { useState, useEffect } from 'react';
import { RefreshCw, QrCode } from 'lucide-react';
import { Business } from './types';
import { supabase } from './lib/supabase';
import { SuperAdminLogin } from './components/superadmin/SuperAdminLogin';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { BusinessLogin } from './components/business/BusinessLogin';
import { BusinessDashboard } from './components/business/BusinessDashboard';
import { CustomerMenu } from './components/customer/CustomerMenu';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'business' | 'superadmin' | 'customer'>('business');
  
  // Super Admin state
  const [isSuperAdminAuth, setIsSuperAdminAuth] = useState(
    () => sessionStorage.getItem('zagroja_superadmin_auth') === 'true'
  );

  // Business Admin state
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(() => {
    const raw = sessionStorage.getItem('zagroja_business_data');
    return raw ? JSON.parse(raw) : null;
  });

  // Customer Menu state
  const [customerBusiness, setCustomerBusiness] = useState<Business | null>(null);
  const [customerTable, setCustomerTable] = useState<string>('');
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState('');

  useEffect(() => {
    const url = new URL(window.location.href);
    const pathname = window.location.pathname.toLowerCase();
    const searchParams = url.searchParams;

    // 1. Check Subdomain (e.g. bistro.domain.com)
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const isSubdomain = parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'localhost' && parts[0] !== 'menu';
    const subdomainSlug = isSubdomain ? parts[0] : null;

    // 2. Route Check
    if (pathname.includes('/superadmin') || pathname.includes('/hq') || searchParams.get('panel') === 'superadmin') {
      setCurrentRoute('superadmin');
    } else if (pathname.startsWith('/m/') || searchParams.get('slug') || subdomainSlug) {
      let slug = '';
      if (pathname.startsWith('/m/')) {
        slug = pathname.replace('/m/', '').split('/')[0].split('?')[0];
      } else if (searchParams.get('slug')) {
        slug = searchParams.get('slug') || '';
      } else if (subdomainSlug) {
        slug = subdomainSlug;
      }

      const table = searchParams.get('table') || '';
      setCustomerTable(table);
      loadCustomerBusiness(slug);
      setCurrentRoute('customer');
    } else {
      // Default directly to Business Login / Dashboard (No landing/marketing page)
      setCurrentRoute('business');
    }
  }, []);

  const loadCustomerBusiness = async (slug: string) => {
    setCustomerLoading(true);
    setCustomerError('');
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        setCustomerError('Menü bulunamadı.');
        return;
      }

      const biz = data as Business;
      if (biz.subscription_status === 'suspended') {
        setCustomerError('Bu işletmenin menüsü geçici olarak kapalıdır.');
        return;
      }

      setCustomerBusiness(biz);
    } catch {
      setCustomerError('Menü yüklenirken bir hata oluştu.');
    } finally {
      setCustomerLoading(false);
    }
  };

  // 1. SUPER ADMIN PANEL ROUTE
  if (currentRoute === 'superadmin') {
    if (!isSuperAdminAuth) {
      return <SuperAdminLogin onSuccess={() => setIsSuperAdminAuth(true)} />;
    }
    return (
      <SuperAdminDashboard
        onLogout={() => {
          sessionStorage.removeItem('zagroja_superadmin_auth');
          setIsSuperAdminAuth(false);
          window.location.href = '/';
        }}
      />
    );
  }

  // 2. CUSTOMER QR MENU ROUTE
  if (currentRoute === 'customer') {
    if (customerLoading) {
      return (
        <div className="min-h-screen bg-[#090C10] flex flex-col items-center justify-center p-4 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mb-3" />
          <h2 className="font-semibold text-xs text-slate-200">Menü Yükleniyor...</h2>
        </div>
      );
    }

    if (customerError || !customerBusiness) {
      return (
        <div className="min-h-screen bg-[#090C10] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#12161F] border border-[#212634] flex items-center justify-center text-slate-500 mb-3">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="font-semibold text-sm text-slate-100 mb-1">{customerError || 'Menü Bulunamadı'}</h2>
          <p className="text-xs text-slate-400 max-w-xs">
            Lütfen masanızdaki QR kodu tekrar okutunuz.
          </p>
        </div>
      );
    }

    return <CustomerMenu business={customerBusiness} initialTable={customerTable} />;
  }

  // 3. DIRECT BUSINESS LOGIN / DASHBOARD (DEFAULT ROUTE)
  if (!activeBusiness) {
    return (
      <BusinessLogin
        onSuccess={(biz) => {
          setActiveBusiness(biz);
        }}
      />
    );
  }

  return (
    <BusinessDashboard
      initialBusiness={activeBusiness}
      onLogout={() => {
        sessionStorage.removeItem('zagroja_business_id');
        sessionStorage.removeItem('zagroja_business_data');
        setActiveBusiness(null);
      }}
    />
  );
}
