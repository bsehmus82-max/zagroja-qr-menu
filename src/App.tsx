import React, { useState, useEffect } from 'react';
import { ShieldCheck, Store, QrCode, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';
import { Business } from './types';
import { supabase } from './lib/supabase';
import { SuperAdminLogin } from './components/superadmin/SuperAdminLogin';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { BusinessLogin } from './components/business/BusinessLogin';
import { BusinessDashboard } from './components/business/BusinessDashboard';
import { CustomerMenu } from './components/customer/CustomerMenu';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'portal' | 'superadmin' | 'business' | 'customer'>('portal');
  
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

  // All Businesses list for Portal selector
  const [portalBusinesses, setPortalBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const pathname = window.location.pathname.toLowerCase();
    const searchParams = url.searchParams;

    // 1. Check Subdomain (e.g. bistro.zagroja.com)
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const isSubdomain = parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'localhost';
    const subdomainSlug = isSubdomain ? parts[0] : null;

    // 2. Check Route
    if (pathname.includes('/superadmin') || pathname.includes('/hq') || searchParams.get('panel') === 'superadmin') {
      setCurrentRoute('superadmin');
    } else if (pathname.includes('/admin') || pathname.includes('/panel') || searchParams.get('panel') === 'admin') {
      setCurrentRoute('business');
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
      setCurrentRoute('portal');
      loadPortalBusinesses();
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
        setCustomerError('İşletme veya QR menü bulunamadı.');
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

  const loadPortalBusinesses = async () => {
    try {
      const { data } = await supabase.from('businesses').select('*').limit(6);
      if (data) setPortalBusinesses(data as Business[]);
    } catch {
      // fallback
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
          setCurrentRoute('portal');
        }}
      />
    );
  }

  // 2. BUSINESS ADMIN PANEL ROUTE
  if (currentRoute === 'business') {
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
          setCurrentRoute('portal');
        }}
      />
    );
  }

  // 3. CUSTOMER QR MENU ROUTE
  if (currentRoute === 'customer') {
    if (customerLoading) {
      return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-500 mb-3" />
          <h2 className="font-bold text-sm text-white">Menü Yükleniyor...</h2>
        </div>
      );
    }

    if (customerError || !customerBusiness) {
      return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mb-4">
            <QrCode className="w-8 h-8" />
          </div>
          <h2 className="font-bold text-lg text-white mb-2">{customerError || 'Menü Bulunamadı'}</h2>
          <p className="text-xs text-neutral-400 max-w-sm mb-6">
            Lütfen masanızdaki QR kodu tekrar okutunuz veya işletme yetkilisine danışınız.
          </p>
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="px-6 py-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-neutral-300 rounded-2xl"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      );
    }

    return <CustomerMenu business={customerBusiness} initialTable={customerTable} />;
  }

  // 4. MAIN PLATFORM PORTAL & ROUTE SELECTOR
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-neutral-800/60 bg-neutral-900/40 backdrop-blur-xl px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 font-black">
            Z
          </div>
          <span className="font-black text-lg tracking-tight text-white">ZAGROJA</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentRoute('business')}
            className="px-4 py-2 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-xs font-bold transition"
          >
            İşletme Girişi
          </button>
          <button
            onClick={() => setCurrentRoute('superadmin')}
            className="px-4 py-2 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition"
          >
            Platform Merkezi
          </button>
        </div>
      </header>

      {/* Hero Body */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 flex flex-col justify-center z-10 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            3 Panelli Yeni Nesil Restoran Sistemi
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Zagroja QR Menü & Restoran Yönetim Platformu
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Sıfır gecikme, tam veri izolasyonu, sanat eseri estetiğinde QR menüler, anlık adisyon fişi ve canlı garson çağrı sistemi.
          </p>
        </div>

        {/* 3 Main Panels Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Super Admin */}
          <div
            onClick={() => setCurrentRoute('superadmin')}
            className="bg-neutral-900/90 border border-neutral-800 hover:border-brand-500/50 rounded-3xl p-6 transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white mb-1">1. Süper Yönetici Paneli</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Platform sahibine özel şifreli alan. İşletme hesabı açma, masa limitleri, canlı destek ve toplu duyuru merkezi.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs font-bold text-brand-400">
              <span>Panele Git</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: Business Admin */}
          <div
            onClick={() => setCurrentRoute('business')}
            className="bg-neutral-900/90 border border-neutral-800 hover:border-purple-500/50 rounded-3xl p-6 transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white mb-1">2. İşletme Yönetim Paneli</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Menü ve ürün düzenleme, "Tükendi" dondurma, yuvarlatılmış QR üretici, kasa/POS, adisyon fişi ve ciro Z-raporu.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs font-bold text-purple-400">
              <span>Giriş Yap</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 3: Customer QR Menu */}
          <div
            onClick={() => {
              if (portalBusinesses.length > 0) {
                window.location.href = `/m/${portalBusinesses[0].slug}?table=Masa%201`;
              } else {
                setCurrentRoute('superadmin');
              }
            }}
            className="bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/50 rounded-3xl p-6 transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white mb-1">3. Müşteri QR Menü</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Uygulamasız tarayıcı arayüzü. Sadece kategoride görsel, içerik bazlı ürün listesi, Garson Çağır, Hesap İste ve Wi-Fi kopyala.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Menüyü İncele</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 p-6 text-center text-xs text-neutral-600 z-10">
        © 2026 Zagroja QR Menü Platformu. Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
