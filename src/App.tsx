import React, { useState, useEffect } from 'react';
import { RefreshCw, QrCode } from 'lucide-react';
import { Business } from './types';
import { supabase } from './lib/supabase';
import { SuperAdminLogin } from './components/superadmin/SuperAdminLogin';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { BusinessLogin } from './components/business/BusinessLogin';
import { BusinessDashboard } from './components/business/BusinessDashboard';
import { CustomerMenu } from './components/customer/CustomerMenu';
import { PairWaiter } from './components/waiter/PairWaiter';
import { WaiterApp } from './components/waiter/WaiterApp';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<
    'business' | 'superadmin' | 'customer' | 'waiter' | 'pair_waiter'
  >('business');
  
  // Super Admin state
  const [isSuperAdminAuth, setIsSuperAdminAuth] = useState(
    () => 
      sessionStorage.getItem('restiva_sa_auth') === 'true' || 
      localStorage.getItem('restiva_sa_auth') === 'true' ||
      sessionStorage.getItem('zagroja_superadmin_auth') === 'true' || 
      localStorage.getItem('zagroja_superadmin_auth') === 'true'
  );

  // Business Admin state
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(() => {
    const raw = 
      sessionStorage.getItem('restiva_biz_session') || 
      localStorage.getItem('restiva_biz_session') ||
      sessionStorage.getItem('zagroja_business_data') || 
      localStorage.getItem('zagroja_business_data');
    return raw ? JSON.parse(raw) : null;
  });

  // Customer Menu state
  const [customerBusiness, setCustomerBusiness] = useState<Business | null>(null);
  const [customerTable, setCustomerTable] = useState<string>('');
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState('');

  // Re-fetch fresh business data on load & subscribe to realtime changes (Deletions/Suspension/Updates)
  useEffect(() => {
    if (!activeBusiness?.id) return;

    const wipeSession = () => {
      sessionStorage.removeItem('restiva_biz_id');
      sessionStorage.removeItem('restiva_biz_session');
      localStorage.removeItem('restiva_biz_id');
      localStorage.removeItem('restiva_biz_session');
      sessionStorage.removeItem('zagroja_business_id');
      sessionStorage.removeItem('zagroja_business_data');
      localStorage.removeItem('zagroja_business_id');
      localStorage.removeItem('zagroja_business_data');
      setActiveBusiness(null);
    };

    // 1. Initial verification query
    supabase
      .from('businesses')
      .select('*')
      .eq('id', activeBusiness.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          wipeSession();
          return;
        }

        const biz = data as Business;
        if (biz.subscription_status === 'suspended') {
          wipeSession();
          return;
        }

        setActiveBusiness(biz);
        sessionStorage.setItem('restiva_biz_session', JSON.stringify(biz));
        localStorage.setItem('restiva_biz_session', JSON.stringify(biz));
      });

    // 2. Realtime listener: If deleted, suspended or updated in SuperAdmin
    const channel = supabase
      .channel(`biz-security-guard-${activeBusiness.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'businesses',
          filter: `id=eq.${activeBusiness.id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            wipeSession();
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Business;
            if (updated.subscription_status === 'suspended') {
              wipeSession();
            } else {
              setActiveBusiness(updated);
              sessionStorage.setItem('restiva_biz_session', JSON.stringify(updated));
              localStorage.setItem('restiva_biz_session', JSON.stringify(updated));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBusiness?.id]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const pathname = window.location.pathname.toLowerCase();
    const searchParams = url.searchParams;

    // 1. Check Subdomain (e.g. bistro.domain.com) - Exclude IP addresses (127.0.0.1) and localhost
    const hostname = window.location.hostname;
    const isIpAddress = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    const parts = hostname.split('.');
    const isSubdomain = !isIpAddress && parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'localhost' && parts[0] !== 'menu';
    const subdomainSlug = isSubdomain ? parts[0] : null;

    // 2. Explicit Mode / Panel Parameters (Highest Priority)
    if (searchParams.get('mode') === 'business' || searchParams.get('panel') === 'business' || pathname === '/business') {
      setCurrentRoute('business');
    } else if (searchParams.get('mode') === 'superadmin' || searchParams.get('panel') === 'superadmin' || pathname.includes('/superadmin') || pathname.includes('/hq')) {
      setCurrentRoute('superadmin');
    } else if (searchParams.get('mode') === 'waiter' || pathname.includes('/waiter') || pathname.includes('/garson')) {
      setCurrentRoute('waiter');
    } else if (pathname.includes('/pair-waiter') || (searchParams.get('token') && searchParams.get('biz'))) {
      setCurrentRoute('pair_waiter');
    } else if (pathname.startsWith('/m/') || searchParams.get('slug') || subdomainSlug) {
      let slug = '';
      if (pathname.startsWith('/m/')) {
        slug = pathname.replace('/m/', '').split('/')[0].split('?')[0];
      } else if (searchParams.get('slug')) {
        slug = searchParams.get('slug') || '';
      } else if (subdomainSlug) {
        slug = subdomainSlug;
      }

      if (slug && slug !== '127' && slug !== 'localhost' && slug !== '0') {
        const table = searchParams.get('table') || '';
        setCustomerTable(table);
        loadCustomerBusiness(slug);
        setCurrentRoute('customer');
      } else {
        setCurrentRoute('business');
      }
    } else {
      // If this device is an approved waiter terminal and not logged in as business admin
      const hasWaiterToken = localStorage.getItem('restiva_waiter_device_token');
      const hasBizSession = sessionStorage.getItem('restiva_biz_session') || localStorage.getItem('restiva_biz_session');
      const hasSaAuth = sessionStorage.getItem('restiva_sa_auth') || localStorage.getItem('restiva_sa_auth');

      if (hasWaiterToken && !hasBizSession && !hasSaAuth) {
        setCurrentRoute('waiter');
      } else {
        // Default directly to Business Login / Dashboard
        setCurrentRoute('business');
      }
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
        .maybeSingle();

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

  // 0. WAITER PAIRING ROUTE
  if (currentRoute === 'pair_waiter') {
    return <PairWaiter />;
  }

  // 1. WAITER MOBILE POS ROUTE
  if (currentRoute === 'waiter') {
    return <WaiterApp />;
  }

  // 2. SUPER ADMIN PANEL ROUTE
  if (currentRoute === 'superadmin') {
    if (!isSuperAdminAuth) {
      return (
        <SuperAdminLogin
          onSuccess={() => {
            sessionStorage.setItem('restiva_sa_auth', 'true');
            localStorage.setItem('restiva_sa_auth', 'true');
            setIsSuperAdminAuth(true);
          }}
        />
      );
    }
    return (
      <SuperAdminDashboard
        onLogout={() => {
          sessionStorage.removeItem('restiva_sa_auth');
          localStorage.removeItem('restiva_sa_auth');
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
          sessionStorage.setItem('restiva_biz_id', biz.id);
          sessionStorage.setItem('restiva_biz_session', JSON.stringify(biz));
          localStorage.setItem('restiva_biz_id', biz.id);
          localStorage.setItem('restiva_biz_session', JSON.stringify(biz));
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
        sessionStorage.setItem('restiva_biz_session', JSON.stringify(updated));
        localStorage.setItem('restiva_biz_session', JSON.stringify(updated));
      }}
      onLogout={() => {
        sessionStorage.removeItem('restiva_biz_id');
        sessionStorage.removeItem('restiva_biz_session');
        localStorage.removeItem('restiva_biz_id');
        localStorage.removeItem('restiva_biz_session');
        sessionStorage.removeItem('zagroja_business_id');
        sessionStorage.removeItem('zagroja_business_data');
        localStorage.removeItem('zagroja_business_id');
        localStorage.removeItem('zagroja_business_data');
        setActiveBusiness(null);
      }}
    />
  );
}
