import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, CheckCircle2, 
  AlertCircle, Clock, Trash2, Edit, ExternalLink, 
  RefreshCw, LogOut, Shield, MessageSquare, Database,
  Calendar, Layers, Check, Copy, Phone, MapPin, 
  TrendingUp, Users, DollarSign, ArrowUpRight, Sparkles,
  Radio, Gift, CreditCard, ChevronRight, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Business, PlanType } from '../../types';
import { SuperAdminChat } from './SuperAdminChat';
import { BroadcastModal } from './BroadcastModal';
import { CreateBusinessModal } from './CreateBusinessModal';
import { CreatedCredentialsModal } from './CreatedCredentialsModal';
import { RenewSubscriptionModal } from './RenewSubscriptionModal';
import { NotificationPrompt } from '../common/NotificationPrompt';
import { PwaInstallPrompt } from '../common/PwaInstallPrompt';

interface SuperAdminDashboardProps {
  onLogout: () => void;
  onBusinessesUpdated?: (updatedList: Business[]) => void;
}

type TabType = 'businesses' | 'chat';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ 
  onLogout,
  onBusinessesUpdated 
}) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('businesses');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [renewTargetBiz, setRenewTargetBiz] = useState<Business | null>(null);
  const [createdInfo, setCreatedInfo] = useState<{ business: Business; tempPass: string; days: number } | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'suspended'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | PlanType | 'paid'>('all');

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBusinesses(data as Business[]);
        onBusinessesUpdated?.(data as Business[]);
      }
    } catch (err) {
      console.warn('SuperAdmin fetch businesses error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();

    const channel = supabase
      .channel('sa_businesses_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        () => {
          fetchBusinesses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleToggleSuspend = async (biz: Business) => {
    const newStatus = biz.subscription_status === 'suspended' ? 'active' : 'suspended';
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          subscription_status: newStatus,
          is_active: newStatus === 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', biz.id);

      if (!error) {
        setBusinesses((prev) =>
          prev.map((b) => (b.id === biz.id ? { ...b, subscription_status: newStatus, is_active: newStatus === 'active' } : b))
        );
      }
    } catch (err) {
      console.warn('Toggle suspend error:', err);
    }
  };

  const handleDeleteBusiness = async (biz: Business) => {
    if (!window.confirm(`"${biz.name}" işletmesini ve tüm verilerini kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('businesses').delete().eq('id', biz.id);
      if (!error) {
        setBusinesses((prev) => prev.filter((b) => b.id !== biz.id));
      }
    } catch (err) {
      console.warn('Delete business error:', err);
    }
  };

  // Financial & Subscription KPI Analytics
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const activeCount = businesses.filter((b) => b.subscription_status === 'active' && new Date(b.subscription_expires_at) >= now).length;
  const expiringSoonCount = businesses.filter((b) => {
    const exp = new Date(b.subscription_expires_at);
    return b.subscription_status === 'active' && exp >= now && exp <= threeDaysFromNow;
  }).length;
  const expiredCount = businesses.filter((b) => new Date(b.subscription_expires_at) < now || b.subscription_status === 'expired').length;
  const suspendedCount = businesses.filter((b) => b.subscription_status === 'suspended').length;

  const totalMonthlyRevenue = businesses.reduce((acc, b) => {
    if (b.plan_price && b.subscription_status === 'active') {
      if (b.billing_period === 'annual') {
        return acc + Math.round(Number(b.plan_price) / 12);
      }
      return acc + Number(b.plan_price);
    }
    return acc;
  }, 0);

  const totalRegisteredTables = businesses.reduce((acc, b) => {
    return acc + (b.table_limit && b.table_limit < 9999 ? Number(b.table_limit) : 25);
  }, 0);

  // Filter Logic
  const filteredBusinesses = businesses.filter((b) => {
    const matchesSearch = 
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase()) ||
      b.username.toLowerCase().includes(search.toLowerCase()) ||
      (b.phone && b.phone.includes(search));

    if (!matchesSearch) return false;

    const expiryDate = new Date(b.subscription_expires_at);

    // Status Filter
    if (statusFilter === 'active') {
      if (b.subscription_status !== 'active' || expiryDate < now) return false;
    } else if (statusFilter === 'expiring') {
      if (b.subscription_status !== 'active' || expiryDate < now || expiryDate > threeDaysFromNow) return false;
    } else if (statusFilter === 'expired') {
      if (expiryDate >= now && b.subscription_status !== 'expired') return false;
    } else if (statusFilter === 'suspended') {
      if (b.subscription_status !== 'suspended') return false;
    }

    // Plan Filter
    if (planFilter === 'paid') {
      return b.plan_type === 'standard' || b.plan_type === 'pro' || b.plan_type === 'lite' || (b.plan_price && b.plan_price > 0);
    }
    if (planFilter === 'pro') return b.plan_type === 'pro';
    if (planFilter === 'standard') return b.plan_type === 'standard';
    if (planFilter === 'lite') return b.plan_type === 'lite';
    if (planFilter === 'trial') {
      return b.plan_type === 'trial' || (!b.plan_type && (b.plan_price === 0 || !b.plan_price));
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col selection:bg-orange-500/30 selection:text-orange-200">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-[#1E293B]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-slate-100">Yönetim Merkezi & Finans</h1>
            <p className="text-[11px] text-slate-400">Abonelik, Tahsilat & Platform Kontrol Paneli</p>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="flex items-center gap-1 bg-[#0F172A] p-1 rounded-2xl border border-slate-800 order-3 sm:order-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => handleTabChange('businesses')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'businesses' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            İşletmeler & Abonelikler ({businesses.length})
          </button>
          <button
            onClick={() => handleTabChange('chat')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'chat' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Canlı Destek
          </button>
        </div>

        {/* Right Actions: Notifications, PWA Install & Actions */}
        <div className="flex items-center gap-2 order-2 sm:order-3">
          <NotificationPrompt />
          <PwaInstallPrompt panelName="Super Admin" />

          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 hover:bg-orange-500/20 text-xs font-bold transition"
          >
            <Radio className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden md:inline">Toplu Duyuru & Bayram</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Yeni İşletme & Paket Aç</span>
          </button>
          <button
            onClick={onLogout}
            title="Çıkış Yap"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'businesses' && (
          <div className="space-y-5">
            {/* Financial & Subscription KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Monthly Run-Rate Revenue */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aylık Tahsilat Geliri</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                    {totalMonthlyRevenue.toLocaleString('tr-TR')} TL
                  </span>
                  <span className="text-[10px] text-slate-400">/ ay</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Aktif ücretli aboneliklerden</p>
              </div>

              {/* Active Businesses */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aktif İşletmeler</span>
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
                    {activeCount}
                  </span>
                  <span className="text-[10px] text-slate-400">/ {businesses.length} toplam</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Süresi devam eden mekanlar</p>
              </div>

              {/* Expiring Soon */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ödeme Yaklaşanlar</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                    {expiringSoonCount}
                  </span>
                  <span className="text-[10px] text-slate-400">işletme</span>
                </div>
                <p className="text-[10px] text-amber-400/80 mt-1 font-semibold">Son 3 gün içinde bitecekler</p>
              </div>

              {/* Expired / Overdue */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Süresi Bitenler</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                    {expiredCount}
                  </span>
                  <span className="text-[10px] text-slate-400">işletme</span>
                </div>
                <p className="text-[10px] text-rose-400/80 mt-1 font-semibold">Yenileme bekleniyor</p>
              </div>
            </div>

            {/* Controls Bar: Search & Status / Plan Filters */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    statusFilter === 'all'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-[#0F172A] text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  Tümü ({businesses.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    statusFilter === 'active'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#0F172A] text-emerald-400 hover:bg-emerald-500/10 border border-slate-800'
                  }`}
                >
                  Aktif ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('expiring')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    statusFilter === 'expiring'
                      ? 'bg-amber-600 text-white'
                      : 'bg-[#0F172A] text-amber-400 hover:bg-amber-500/10 border border-slate-800'
                  }`}
                >
                  Ödeme Yaklaşan ({expiringSoonCount})
                </button>
                <button
                  onClick={() => setStatusFilter('expired')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    statusFilter === 'expired'
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#0F172A] text-rose-400 hover:bg-rose-500/10 border border-slate-800'
                  }`}
                >
                  Süresi Biten ({expiredCount})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="İşletme, kullanıcı adı, tel ara..."
                  className="w-full bg-[#0F172A] border border-slate-700/80 focus:border-orange-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition font-medium"
                />
              </div>
            </div>

            {/* Businesses List */}
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                <p className="text-xs text-slate-400 mt-2">İşletmeler ve finansal veriler yükleniyor...</p>
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="py-16 text-center bg-[#1E293B] border border-slate-800 rounded-3xl p-6">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-200">Eşleşen İşletme Bulunamadı</h3>
                <p className="text-xs text-slate-400 mt-1">Arama kriterlerinizi değiştirebilir veya yeni bir işletme ekleyebilirsiniz.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBusinesses.map((biz) => {
                  const expiryDate = new Date(biz.subscription_expires_at);
                  const isExpired = expiryDate < now;
                  const isExpiringSoon = !isExpired && expiryDate <= threeDaysFromNow;

                  const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                  const planLabel = 
                    biz.plan_type === 'pro' ? 'Profesyonel' :
                    biz.plan_type === 'standard' ? 'Standart Kafe/Bistro' :
                    biz.plan_type === 'lite' ? 'Lite QR Menü' :
                    biz.plan_type === 'custom' ? 'Özel Paket' : '7 Günlük Deneme';

                  const billingLabel = 
                    biz.billing_period === 'annual' ? 'Yıllık' :
                    biz.billing_period === 'semi_annual' ? '6 Aylık' :
                    biz.billing_period === 'monthly' ? 'Aylık' : 'Deneme';

                  return (
                    <div
                      key={biz.id}
                      className={`bg-[#1E293B] border rounded-3xl p-5 relative flex flex-col justify-between hover:border-slate-700 transition shadow-xs ${
                        biz.subscription_status === 'suspended'
                          ? 'border-amber-500/30 bg-amber-950/5'
                          : isExpired
                          ? 'border-rose-500/30 bg-rose-950/5'
                          : isExpiringSoon
                          ? 'border-amber-500/40'
                          : 'border-slate-800'
                      }`}
                    >
                      <div>
                        {/* Header of Business Card */}
                        <div className="flex items-start justify-between gap-3 mb-3.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm text-slate-100 truncate">{biz.name}</h3>
                              
                              {/* Subscription Status Badge */}
                              {biz.subscription_status === 'suspended' ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Askıda
                                </span>
                              ) : isExpired ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  Süresi Doldu
                                </span>
                              ) : isExpiringSoon ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Ödeme Yaklaştı
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Aktif
                                </span>
                              )}

                              {/* Plan Badge */}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-300 border border-orange-500/20">
                                {planLabel} ({billingLabel})
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 mt-1 font-mono">
                              Kullanıcı: <span className="text-slate-200 font-semibold">{biz.username}</span> • slug: {biz.slug}
                            </div>
                          </div>

                          <button
                            onClick={() => setRenewTargetBiz(biz)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-orange-500 text-slate-300 hover:text-white transition shrink-0 shadow-xs"
                            title="Abonelik Süresi / Paket Yenile"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Financial & Time Metrics Inside Card */}
                        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-3.5 space-y-2 mb-4 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                              Kayıtlı Fiyat:
                            </span>
                            <span className="font-mono font-bold text-emerald-400">
                              {biz.plan_price ? `${Number(biz.plan_price).toLocaleString('tr-TR')} TL` : 'Ücretsiz'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-orange-400" />
                              Masa Limiti:
                            </span>
                            <span className="font-mono font-bold text-slate-200">
                              {biz.table_limit && biz.table_limit < 9999 ? `${biz.table_limit} Masa` : 'Sınırsız'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-orange-400" />
                              Kalan Süre:
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                isExpired
                                  ? 'text-rose-400'
                                  : isExpiringSoon
                                  ? 'text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            >
                              {isExpired ? `Bitti (${Math.abs(daysRemaining)} gün önce)` : `${daysRemaining} Gün Kaldı`}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                            <span>Bitiş: {expiryDate.toLocaleDateString('tr-TR')}</span>
                            {biz.phone && <span>Tel: {biz.phone}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                        <a
                          href={`/m/${biz.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 font-semibold"
                        >
                          <ExternalLink className="w-3 h-3 text-orange-400" />
                          <span>QR Menü</span>
                        </a>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleSuspend(biz)}
                            className={`px-2.5 py-1.5 rounded-xl font-bold transition text-[11px] ${
                              biz.subscription_status === 'suspended'
                                ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                                : 'bg-amber-600/10 text-amber-400 hover:bg-amber-600/20'
                            }`}
                          >
                            {biz.subscription_status === 'suspended' ? 'Aktifleştir' : 'Askıya Al'}
                          </button>

                          <button
                            onClick={() => handleDeleteBusiness(biz)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="İşletmeyi Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Live Chat Tab */}
        {activeTab === 'chat' && <SuperAdminChat businesses={businesses} />}
      </main>

      {/* Modals */}
      <CreateBusinessModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(info) => {
          setCreatedInfo(info);
          fetchBusinesses();
        }}
      />

      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        businesses={businesses}
        onBusinessesUpdated={(updated) => {
          setBusinesses(updated);
        }}
      />

      {renewTargetBiz && (
        <RenewSubscriptionModal
          isOpen={!!renewTargetBiz}
          onClose={() => setRenewTargetBiz(null)}
          business={renewTargetBiz}
          onSuccess={(updated) => {
            setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
          }}
        />
      )}

      {createdInfo && (
        <CreatedCredentialsModal
          isOpen={!!createdInfo}
          onClose={() => setCreatedInfo(null)}
          business={createdInfo.business}
          tempPass={createdInfo.tempPass}
          days={createdInfo.days}
        />
      )}
    </div>
  );
};
