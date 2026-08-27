import React, { useState } from 'react';
import { 
  UtensilsCrossed, Layers, ChefHat, Calculator, 
  TrendingUp, Settings, MessageSquare, LogOut, ExternalLink, QrCode
} from 'lucide-react';
import { Business } from '../../types';
import { MenuManager } from './MenuManager';
import { TableManager } from './TableManager';
import { LiveOrders } from './LiveOrders';
import { ManualPos } from './ManualPos';
import { TurnoverReport } from './TurnoverReport';
import { BusinessSettings } from './BusinessSettings';
import { BusinessSupportChat } from './BusinessSupportChat';
import { BusinessOnboarding } from './BusinessOnboarding';

interface BusinessDashboardProps {
  initialBusiness: Business;
  onLogout: () => void;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({
  initialBusiness,
  onLogout,
}) => {
  const [business, setBusiness] = useState<Business>(initialBusiness);
  const [activeTab, setActiveTab] = useState<
    'orders' | 'pos' | 'menu' | 'tables' | 'turnover' | 'settings' | 'support'
  >('orders');

  // Check if onboarding needed (phone or address empty)
  const isFirstTime = !business.phone && !business.address;
  const [showOnboarding, setShowOnboarding] = useState(isFirstTime);

  if (showOnboarding) {
    return (
      <BusinessOnboarding
        business={business}
        onComplete={(updated) => {
          setBusiness(updated);
          setShowOnboarding(false);
        }}
      />
    );
  }

  const menuLiveUrl = `${window.location.origin}/m/${business.slug}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-xl sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-brand-500/20">
            {business.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base text-white tracking-tight">{business.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Aktif İşletme
              </span>
            </div>
            <p className="text-xs text-neutral-400">Yönetim & Mutfak Portalı</p>
          </div>
        </div>

        {/* Live Menu Link */}
        <div className="flex items-center gap-3">
          <a
            href={menuLiveUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-xs font-bold text-neutral-200 border border-neutral-700 transition"
          >
            <QrCode className="w-3.5 h-3.5 text-brand-400" />
            <span>Müşteri Menüsü Önizle</span>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </a>

          <button
            onClick={onLogout}
            title="Oturumu Kapat"
            className="p-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation Sub-Header */}
      <nav className="border-b border-neutral-800 bg-neutral-900/40 px-6 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'orders'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            Canlı Mutfak & Siparişler
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'pos'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Kasa / Manuel POS
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'menu'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Menü & Ürünler
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'tables'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Masalar & QR Kodlar
          </button>

          <button
            onClick={() => setActiveTab('turnover')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'turnover'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Ciro & Raporlar
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'support'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Canlı Destek
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'settings'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            İşletme Ayarları
          </button>
        </div>
      </nav>

      {/* Main Body */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'orders' && <LiveOrders business={business} />}
        {activeTab === 'pos' && <ManualPos business={business} />}
        {activeTab === 'menu' && <MenuManager business={business} />}
        {activeTab === 'tables' && <TableManager business={business} />}
        {activeTab === 'turnover' && <TurnoverReport business={business} />}
        {activeTab === 'support' && <BusinessSupportChat business={business} />}
        {activeTab === 'settings' && (
          <BusinessSettings
            business={business}
            onUpdate={(updated) => setBusiness(updated)}
          />
        )}
      </main>
    </div>
  );
};
