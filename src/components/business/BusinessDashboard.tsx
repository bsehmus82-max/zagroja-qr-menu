import React, { useState } from 'react';
import { 
  ChefHat, UtensilsCrossed, QrCode, Calculator, 
  TrendingUp, Settings, MessageSquare, ExternalLink, 
  LogOut, Store
} from 'lucide-react';
import { Business } from '../../types';
import { BusinessOnboarding } from './BusinessOnboarding';
import { MenuManager } from './MenuManager';
import { TableManager } from './TableManager';
import { LiveOrders } from './LiveOrders';
import { ManualPos } from './ManualPos';
import { TurnoverReport } from './TurnoverReport';
import { BusinessSettings } from './BusinessSettings';
import { BusinessSupportChat } from './BusinessSupportChat';

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
    'orders' | 'menu' | 'tables' | 'pos' | 'turnover' | 'settings' | 'support'
  >('orders');

  // If first time login, show onboarding wizard
  if (!business.is_onboarded) {
    return (
      <BusinessOnboarding
        business={business}
        onComplete={(updated) => setBusiness(updated)}
      />
    );
  }

  const menuUrl = `${window.location.origin}/m/${business.slug}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row selection:bg-brand-500 selection:text-white">
      {/* Left Sidebar */}
      <aside className="w-full md:w-64 bg-neutral-900/70 border-r border-neutral-800 p-5 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Business Brand */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-neutral-800">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 font-black">
              {business.name.charAt(0)}
            </div>
            <div className="truncate">
              <h1 className="font-black text-sm text-white truncate">{business.name}</h1>
              <div className="text-[11px] text-neutral-400 font-mono mt-0.5 truncate">
                @{business.username}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeTab === 'orders'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              Canlý Sipariþler
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeTab === 'pos'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Kasa & Manuel POS
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeTab === 'menu'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              Menü & Ürünler
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeTab === 'tables'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <QrCode className="w-4 h-4" />
              Masalar & QR Kod
            </button>

            <button
              onClick={() => setActiveTab('turnover')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeTab === 'turnover'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Ciro & Z-Raporu
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeTab === 'settings'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              Ayarlar & Þablon
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeTab === 'support'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Canlý Destek
            </button>
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-neutral-800 space-y-2">
          <a
            href={menuUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            QR Menümü Gör
          </a>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-red-500/20 text-neutral-500 hover:text-red-400 text-xs font-bold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Çýkýþ Yap
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'orders' && <LiveOrders business={business} />}
        {activeTab === 'pos' && <ManualPos business={business} />}
        {activeTab === 'menu' && <MenuManager business={business} />}
        {activeTab === 'tables' && <TableManager business={business} />}
        {activeTab === 'turnover' && <TurnoverReport business={business} />}
        {activeTab === 'settings' && (
          <BusinessSettings business={business} onUpdated={(up) => setBusiness(up)} />
        )}
        {activeTab === 'support' && <BusinessSupportChat business={business} />}
      </main>
    </div>
  );
};
