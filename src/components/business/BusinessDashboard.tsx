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
    <div className="min-h-screen bg-[#080B10] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header */}
      <header className="border-b border-[#1E2638] bg-[#10141E]/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
            {business.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-white tracking-tight">{business.name}</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Aktif
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Yönetim & Mutfak Portalı</p>
          </div>
        </div>

        {/* Live Menu Link & Logout */}
        <div className="flex items-center gap-2.5">
          <a
            href={menuLiveUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#182030] hover:bg-[#222E45] text-xs font-semibold text-slate-200 border border-[#25324A] transition"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-400" />
            <span>Müşteri Menüsü</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          <button
            onClick={onLogout}
            title="Çıkış Yap"
            className="p-2 rounded-xl bg-[#182030] hover:bg-[#222E45] text-slate-400 hover:text-rose-400 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Modern Navigation Tabs */}
      <nav className="border-b border-[#1E2638] bg-[#0C1018] px-6 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            Canlı Mutfak & Siparişler
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'pos'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            Kasa / POS
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'menu'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Menü & Ürünler
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'tables'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Masalar & QR Kodlar
          </button>

          <button
            onClick={() => setActiveTab('turnover')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'turnover'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Ciro Raporları
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'support'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Canlı Destek
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Ayarlar & Şablon
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
