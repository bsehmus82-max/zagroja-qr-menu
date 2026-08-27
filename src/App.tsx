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
    () => sessionStorage.getItem('zagroja_superadmin_auth') === 'true' || localStorage.getItem('zagroja_superadmin_auth') === 'true'
  );

  // Business Admin state
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(() => {
    const raw = sessionStorage.getItem('zagroja_business_data') || localStorage.getItem('zagroja_business_data');
    return raw ? JSON.parse(raw) : null;
  });

  // Customer Menu state
  const [customerBusiness, setCustomerBusiness] = useState<Business | null>(null);
  const [customerTable, setCustomerTable] = useState<string>('');
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState('');

  // Re-fetch fresh business data on load to ensure up-to-date attributes
  useEffect(() => {
    if (activeBusiness?.id) {
      supabase
        .from('businesses')
        .select('*')
        .eq('id', activeBusiness.id)
        .single()
        .then(({ data }) => {
          if (data) {
            const biz = data as Business;
            setActiveBusiness(biz);
            sessionStorage.setItem('zagroja_business_data', JSON.stringify(biz));
            localStorage.setItem('zagroja_business_data', JSON.stringify(biz));
          }
        });
    }
  }, []);

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
      // Default directly to Business Login / Dashboard
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
      return (
        <SuperAdminLogin
          onSuccess={() => {
            sessionStorage.setItem('zagroja_superadmin_auth', 'true');
            localStorage.setItem('zagroja_superadmin_auth', 'true');
            setIsSuperAdminAuth(true);
          }}
        />
      );
    }
    return (
      <SuperAdminDashboard
        onLogout={() => {
          sessionStorage.removeItem('zagroja_superadmin_auth');
          localStorage.removeItem('zagroja_superadmin_auth');
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
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mb-3" />
          <h2 className="font-bold text-xs text-slate-700">Menü Yükleniyor...</h2>
        </div>
      );
    }

    if (customerError || !customerBusiness) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 mb-3">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="font-extrabold text-sm text-slate-800 mb-1">{customerError || 'Menü Bulunamadı'}</h2>
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
          sessionStorage.setItem('zagroja_business_id', biz.id);
          sessionStorage.setItem('zagroja_business_data', JSON.stringify(biz));
          localStorage.setItem('zagroja_business_id', biz.id);
          localStorage.setItem('zagroja_business_data', JSON.stringify(biz));
          setActiveBusiness(biz);
        }}
      />
    );
  }

  return (
    <BusinessDashboard
      initialBusiness={activeBusiness}
      onBusinessUpdate={(updated) => {
        setActiveBusiness(updated);
        sessionStorage.setItem('zagroja_business_data', JSON.stringify(updated));
        localStorage.setItem('zagroja_business_data', JSON.stringify(updated));
      }}
      onLogout={() => {
        sessionStorage.removeItem('zagroja_business_id');
        sessionStorage.removeItem('zagroja_business_data');
        localStorage.removeItem('zagroja_business_id');
        localStorage.removeItem('zagroja_business_data');
        setActiveBusiness(null);
      }}
    />
  );
}
