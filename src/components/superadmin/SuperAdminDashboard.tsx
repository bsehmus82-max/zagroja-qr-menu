import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, MessageSquare, Shield, Power, 
  Calendar, Layers, Search, AlertTriangle, 
  RefreshCw, Lock, Trash2, Radio, Database, LogOut,
  CreditCard, DollarSign, Wallet, Clock, CheckCircle2,
  TrendingUp, Sparkles, Filter, AlertCircle
} from 'lucide-react';
import { supabase, hashPassword, generateTempPassword } from '../../lib/supabase';
import { Business, PlanType } from '../../types';
import { sound } from '../../lib/audio';
import { sendNativeNotification } from '../../lib/notifications';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { NotificationPrompt } from '../common/NotificationPrompt';
import { PwaInstallPrompt } from '../common/PwaInstallPrompt';
import { CreateBusinessModal } from './CreateBusinessModal';
import { CreatedCredentialsModal } from './CreatedCredentialsModal';
import { BroadcastModal } from './BroadcastModal';
import { SuperAdminChat } from './SuperAdminChat';
import { RenewSubscriptionModal } from './RenewSubscriptionModal';

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

type FilterCategory = 'all' | 'due_soon' | 'expired' | 'pro' | 'standard' | 'lite' | 'trial';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onLogout }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'businesses' | 'chat' | 'database'>(() => {
    return (localStorage.getItem('superadmin_active_tab') as any) || 'businesses';
  });
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<FilterCategory>('all');

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    localStorage.setItem('superadmin_active_tab', tab);
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [renewingBiz, setRenewingBiz] = useState<Business | null>(null);
  const [createdInfo, setCreatedInfo] = useState<{
    business: Business;
    tempPass: string;
    days: number;
  } | null>(null);

  const [selectedBizForChat, setSelectedBizForChat] = useState<Business | null>(null);

  // In-app Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    action: () => {},
  });

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBusinesses(data as Business[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Super Admin';
    loadBusinesses();
  }, []);

  // Realtime notification & Background Push
  useEffect(() => {
    const channel = supabase
      .channel('superadmin-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        (payload) => {
          if (payload.new && (payload.new as { sender: string }).sender === 'business') {
            sound.playMessageTone();
            toast.info('İşletmeden yeni bir destek mesajı geldi.');
            sendNativeNotification({
              title: 'Yeni Destek Mesajı',
              body: 'Bir işletme platform yöneticisine mesaj gönderdi.',
              url: '/superadmin',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const toggleSuspend = async (biz: Business) => {
    const nextStatus = biz.subscription_status === 'suspended' ? 'active' : 'suspended';
    const { error } = await supabase
      .from('businesses')
      .update({ subscription_status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', biz.id);

    if (!error) {
      setBusinesses((prev) =>
        prev.map((b) => (b.id === biz.id ? { ...b, subscription_status: nextStatus } : b))
      );
      if (nextStatus === 'suspended') {
        toast.warning(`"${biz.name}" hesabı askıya alındı.`);
      } else {
        toast.success(`"${biz.name}" hesabı aktifleştirildi.`);
      }
    }
  };

  const handleAddDays = async (biz: Business, additionalDays: number) => {
    const currentExpiry = new Date(biz.subscription_expires_at);
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    baseDate.setDate(baseDate.getDate() + additionalDays);

    const { error } = await supabase
      .from('businesses')
      .update({
        subscription_expires_at: baseDate.toISOString(),
        subscription_status: 'active',
        subscription_days: (biz.subscription_days || 0) + additionalDays,
        updated_at: new Date().toISOString()
      })
      .eq('id', biz.id);

    if (!error) {
      setBusinesses((prev) =>
        prev.map((b) =>
          b.id === biz.id
            ? { ...b, subscription_expires_at: baseDate.toISOString(), subscription_status: 'active' }
            : b
        )
      );
      toast.success(`"${biz.name}" süresi +${additionalDays} gün uzatıldı.`);
    }
  };

  const promptResetPassword = (biz: Business) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Şifre Sıfırlama',
      message: `"${biz.name}" işletmesi için yeni bir geçici şifre üretmek istiyor musunuz?`,
      type: 'warning',
      action: async () => {
        const newPass = generateTempPassword(8);
        const newHash = await hashPassword(newPass);

        const { error } = await supabase
          .from('businesses')
          .update({ password_hash: newHash, updated_at: new Date().toISOString() })
          .eq('id', biz.id);

        if (!error) {
          setCreatedInfo({
            business: biz,
            tempPass: newPass,
            days: Math.max(0, Math.ceil((new Date(biz.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
          });
          toast.success('Yeni geçici şifre başarıyla üretildi.');
        }
      },
    });
  };

  const promptDeleteBusiness = (biz: Business) => {
    setConfirmConfig({
      isOpen: true,
      title: 'İşletmeyi Kalıcı Olarak Sil',
      message: `"${biz.name}" işletmesine ait tüm menü, masa, sipariş, servis çağrısı ve destek mesajı verileri geri alınamaz şekilde silinecektir. Devam etmek istiyor musunuz?`,
      type: 'danger',
      action: async () => {
        try {
          // 1. Delete all child records in parallel to prevent foreign key constraint violations & ghost data
          await Promise.allSettled([
            supabase.from('orders').delete().eq('business_id', biz.id),
            supabase.from('service_requests').delete().eq('business_id', biz.id),
            supabase.from('support_messages').delete().eq('business_id', biz.id),
            supabase.from('products').delete().eq('business_id', biz.id),
            supabase.from('categories').delete().eq('business_id', biz.id),
            supabase.from('tables').delete().eq('business_id', biz.id),
            supabase.from('waiter_devices').delete().eq('business_id', biz.id),
            supabase.from('waiters').delete().eq('business_id', biz.id),
            supabase.from('daily_summary').delete().eq('business_id', biz.id),
          ]);

          // 2. Delete the parent business record
          const { error } = await supabase.from('businesses').delete().eq('id', biz.id);

          if (!error) {
            setBusinesses((prev) => prev.filter((b) => b.id !== biz.id));
            if (selectedBizForChat?.id === biz.id) {
              setSelectedBizForChat(null);
            }
            toast.success(`"${biz.name}" ve tüm ilişkili verileri kalıcı olarak silindi.`);
          } else {
            toast.error('İşletme silinirken bir hata oluştu: ' + error.message);
          }
        } catch {
          toast.error('Silme işlemi sırasında bağlantı hatası oluştu.');
        }
      },
    });
  };

  // Financial & Subscription Calculations
  const nowTime = Date.now();
  let totalContractValue = 0;
  let dueSoonCount = 0;
  let dueSoonReceivables = 0;
  let expiredCount = 0;
  let activePaidCount = 0;

  businesses.forEach((b) => {
    const daysLeft = Math.ceil(
      (new Date(b.subscription_expires_at).getTime() - nowTime) / (1000 * 60 * 60 * 24)
    );
    const planPrice = Number(b.plan_price || 0);

    if (b.subscription_status === 'active') {
      totalContractValue += planPrice;
      if (planPrice > 0) activePaidCount++;
    }

    if (daysLeft < 0 || b.subscription_status === 'suspended') {
      expiredCount++;
    } else if (daysLeft <= 7 && daysLeft >= 0) {
      dueSoonCount++;
      dueSoonReceivables += planPrice;
    }
  });

  // Filter Logic
  const filtered = businesses.filter((b) => {
    const matchesSearch = 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const daysLeft = Math.ceil(
      (new Date(b.subscription_expires_at).getTime() - nowTime) / (1000 * 60 * 60 * 24)
    );

    if (planFilter === 'due_soon') {
      return daysLeft <= 7 && daysLeft >= 0 && b.subscription_status === 'active';
    }
    if (planFilter === 'expired') {
      return daysLeft < 0 || b.subscription_status === 'suspended';
    }
    if (planFilter === 'pro') {
      return b.plan_type === 'pro';
    }
    if (planFilter === 'standard') {
      return b.plan_type === 'standard';
    }
    if (planFilter === 'lite') {
      return b.plan_type === 'lite';
    }
    if (planFilter === 'trial') {
      return b.plan_type === 'trial' || (!b.plan_type && (b.plan_price === 0 || !b.plan_price));
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#090C10] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header */}
      <header className="border-b border-[#212634] bg-[#12161F]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-slate-100">Yönetim Merkezi & Finans</h1>
            <p className="text-[11px] text-slate-400">Abonelik, Tahsilat & Platform Kontrol Paneli</p>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="flex items-center gap-1 bg-[#0A0D14] p-1 rounded-xl border border-[#212634] order-3 sm:order-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => handleTabChange('businesses')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              activeTab === 'businesses' ? 'bg-[#1E2433] text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            İşletmeler & Abonelikler ({businesses.length})
          </button>
          <button
            onClick={() => handleTabChange('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              activeTab === 'chat' ? 'bg-[#1E2433] text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            Canlı Destek
          </button>
          <button
            onClick={() => handleTabChange('database')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              activeTab === 'database' ? 'bg-[#1E2433] text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            Veritabanı
          </button>
        </div>

        {/* Right Actions: Notifications, PWA Install & Actions */}
        <div className="flex items-center gap-2 order-2 sm:order-3">
          <NotificationPrompt />
          <PwaInstallPrompt panelName="Super Admin" />

          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 text-xs font-medium transition"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Toplu Duyuru</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Yeni İşletme & Paket Aç</span>
          </button>
          <button
            onClick={onLogout}
            title="Çıkış Yap"
            className="p-2 rounded-xl bg-[#181E2B] hover:bg-[#222A3C] text-slate-400 hover:text-rose-400 transition"
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Total Contract / Subscription Value */}
              <div className="bg-[#12161F] border border-[#212634] p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-medium">Toplam Abonelik Değeri</span>
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                  {totalContractValue.toLocaleString('tr-TR')} ₺
                </p>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                  {activePaidCount} Ücretli Aktif Müşteri
                </span>
              </div>

              {/* Receivables & Renewals Due in 7 Days */}
              <div className="bg-[#12161F] border border-[#212634] p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-medium">Yaklaşan Tahsilatlar (7 Gün)</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-amber-400">
                  {dueSoonReceivables.toLocaleString('tr-TR')} ₺
                </p>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {dueSoonCount} İşletmenin Ödemesi Yaklaştı
                </span>
              </div>

              {/* Expired / Overdue */}
              <div className="bg-[#12161F] border border-[#212634] p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-medium">Süresi Dolan / Askıda</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-rose-400">
                  {expiredCount}
                </p>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Yenileme Bekleyen İşletmeler
                </span>
              </div>

              {/* Active Businesses */}
              <div className="bg-[#12161F] border border-[#212634] p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-medium">Toplam Kayıtlı İşletme</span>
                  <Building2 className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-slate-100">
                  {businesses.length}
                </p>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {businesses.filter(b => b.subscription_status === 'active').length} Aktif / {businesses.filter(b => b.subscription_status === 'suspended').length} Askıda
                </span>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#12161F] p-2.5 rounded-2xl border border-[#212634]">
              {/* Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setPlanFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    planFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-[#0A0D14] text-slate-400 hover:text-slate-200 border border-[#212634]'
                  }`}
                >
                  Tümü ({businesses.length})
                </button>
                <button
                  onClick={() => setPlanFilter('due_soon')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                    planFilter === 'due_soon'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-[#0A0D14] text-amber-400 hover:text-amber-300 border border-amber-500/20'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Ödemesi Yaklaşanlar ({dueSoonCount})
                </button>
                <button
                  onClick={() => setPlanFilter('expired')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                    planFilter === 'expired'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-[#0A0D14] text-rose-400 hover:text-rose-300 border border-rose-500/20'
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  Süresi Dolanlar ({expiredCount})
                </button>
                <button
                  onClick={() => setPlanFilter('pro')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    planFilter === 'pro'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#0A0D14] text-slate-400 hover:text-slate-200 border border-[#212634]'
                  }`}
                >
                  Pro Restoran
                </button>
                <button
                  onClick={() => setPlanFilter('standard')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    planFilter === 'standard'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#0A0D14] text-slate-400 hover:text-slate-200 border border-[#212634]'
                  }`}
                >
                  Standart Bistro
                </button>
                <button
                  onClick={() => setPlanFilter('lite')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    planFilter === 'lite'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#0A0D14] text-slate-400 hover:text-slate-200 border border-[#212634]'
                  }`}
                >
                  Lite QR
                </button>
                <button
                  onClick={() => setPlanFilter('trial')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    planFilter === 'trial'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#0A0D14] text-slate-400 hover:text-slate-200 border border-[#212634]'
                  }`}
                >
                  7 Gün Deneme
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative shrink-0 w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="İşletme adı veya kullanıcı ara..."
                  className="w-full bg-[#0A0D14] border border-[#212634] focus:border-indigo-500/60 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="text-xs">Yükleniyor...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center bg-[#12161F]/40 border border-dashed border-[#212634] rounded-2xl p-8">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h3 className="font-semibold text-slate-200 text-sm">Filtreye Uygun İşletme Bulunamadı</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Arama kriterlerinizi değiştirebilir veya yeni bir işletme kaydı oluşturabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {filtered.map((biz) => {
                  const daysLeft = Math.ceil(
                    (new Date(biz.subscription_expires_at).getTime() - nowTime) / (1000 * 60 * 60 * 24)
                  );
                  const isExpiringSoon = daysLeft <= 7 && daysLeft >= 0;
                  const isExpired = daysLeft < 0;
                  const planPrice = Number(biz.plan_price || 0);

                  const planLabel = 
                    biz.plan_type === 'pro' ? 'Profesyonel Restoran' :
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
                      className={`bg-[#12161F] border rounded-3xl p-5 relative flex flex-col justify-between hover:border-[#2E3648] transition shadow-xs ${
                        biz.subscription_status === 'suspended'
                          ? 'border-amber-500/30 bg-amber-950/5'
                          : isExpired
                          ? 'border-rose-500/30 bg-rose-950/5'
                          : isExpiringSoon
                          ? 'border-amber-500/40 bg-[#12161F]'
                          : 'border-[#212634]'
                      }`}
                    >
                      <div>
                        {/* Header of Business Card */}
                        <div className="flex items-start justify-between gap-3 mb-3.5">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm text-slate-100">{biz.name}</h3>
                              
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
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                                {planLabel} ({billingLabel})
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 mt-1 font-mono">
                              Kullanıcı: <span className="text-slate-200 font-semibold">{biz.username}</span> • slug: {biz.slug}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedBizForChat(biz);
                              setActiveTab('chat');
                            }}
                            className="p-2 rounded-xl bg-[#1A202C] hover:bg-indigo-600 text-slate-300 hover:text-white transition shrink-0"
                            title="Destek Sohbeti"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Financial & Limit Details Grid */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {/* Plan Price */}
                          <div className="bg-[#0A0D14] p-2.5 rounded-2xl border border-[#212634]">
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                              <DollarSign className="w-3 h-3 text-emerald-400" />
                              <span>Paket Bedeli</span>
                            </div>
                            <div className="text-xs font-bold text-emerald-400 font-mono">
                              {planPrice > 0 ? `${planPrice.toLocaleString('tr-TR')} ₺` : '0 TL (Deneme)'}
                            </div>
                          </div>

                          {/* Table Limit */}
                          <div className="bg-[#0A0D14] p-2.5 rounded-2xl border border-[#212634]">
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                              <Layers className="w-3 h-3 text-indigo-400" />
                              <span>Masa Limiti</span>
                            </div>
                            <div className="text-xs font-semibold text-slate-200">
                              {biz.table_limit ? `${biz.table_limit} Masa` : 'Sınırsız'}
                            </div>
                          </div>

                          {/* Days Left */}
                          <div className={`p-2.5 rounded-2xl border ${
                            isExpired ? 'bg-rose-500/10 border-rose-500/20' :
                            isExpiringSoon ? 'bg-amber-500/10 border-amber-500/20' :
                            'bg-[#0A0D14] border-[#212634]'
                          }`}>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                              <Calendar className="w-3 h-3 text-indigo-400" />
                              <span>Kalan Süre</span>
                            </div>
                            <div className={`text-xs font-bold ${
                              isExpired ? 'text-rose-400' :
                              isExpiringSoon ? 'text-amber-400' :
                              'text-slate-200'
                            }`}>
                              {isExpired ? 'Süresi Doldu' : `${daysLeft} Gün`}
                            </div>
                          </div>
                        </div>

                        {/* Expiration date line */}
                        <div className="text-[11px] text-slate-400 flex items-center justify-between px-1 mb-3.5">
                          <span>Bitiş: {new Date(biz.subscription_expires_at).toLocaleDateString('tr-TR')}</span>
                          {planPrice > 0 && isExpiringSoon && (
                            <span className="text-amber-400 font-bold">
                              Tahsil Edilecek: {planPrice.toLocaleString('tr-TR')} ₺
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-[#212634] flex flex-wrap items-center justify-between gap-2">
                        {/* Primary Subscription Action: Ödeme Al & Yenile Modal Trigger */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setRenewingBiz(biz)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center gap-1 transition active:scale-95"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Ödeme Al / Yenile</span>
                          </button>

                          <button
                            onClick={() => handleAddDays(biz, 30)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#1A202C] hover:bg-[#252D3D] text-slate-300 transition border border-[#262E3E]"
                            title="Hızlı +30 Gün Ekle"
                          >
                            +30 Gün
                          </button>

                          <button
                            onClick={() => toggleSuspend(biz)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition ${
                              biz.subscription_status === 'suspended'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            {biz.subscription_status === 'suspended' ? 'Aktifleştir' : 'Askıya Al'}
                          </button>
                        </div>

                        {/* Secondary Tools: Password Reset & Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => promptResetPassword(biz)}
                            title="Şifre Sıfırla"
                            className="p-2 rounded-xl bg-[#1A202C] hover:bg-[#252D3D] text-slate-400 hover:text-slate-200 transition"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => promptDeleteBusiness(biz)}
                            title="İşletmeyi Sil"
                            className="p-2 rounded-xl bg-[#1A202C] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
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

        {activeTab === 'chat' && (
          <SuperAdminChat
            businesses={businesses}
            selectedBiz={selectedBizForChat}
            onSelectBiz={(b) => setSelectedBizForChat(b)}
          />
        )}

        {activeTab === 'database' && (
          <div className="bg-[#12161F] border border-[#212634] rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#212634]">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">Veritabanı & Şema Yönetimi</h3>
                <p className="text-xs text-slate-400">Tüm tablolar, RLS politikaları ve RPC fonksiyonları</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Veritabanı tablolarının en güncel halini (Abonelik, Fiyatlandırma, Ses Tercihleri, Termal Yazıcı Eşleşmeleri) doğrudan <code>supabase_schema.sql</code> dosyası üzerinden Supabase SQL Editörüne yapıştırarak uygulayabilirsiniz.
            </p>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateBusinessModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(info) => {
          setBusinesses((prev) => [info.business, ...prev]);
          setCreatedInfo(info);
          toast.success(`"${info.business.name}" hesabı başarıyla açıldı.`);
        }}
      />

      <RenewSubscriptionModal
        isOpen={!!renewingBiz}
        business={renewingBiz}
        onClose={() => setRenewingBiz(null)}
        onUpdated={(updated) => {
          setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
          if (renewingBiz?.id === updated.id) setRenewingBiz(null);
        }}
      />

      <CreatedCredentialsModal
        info={createdInfo}
        onClose={() => setCreatedInfo(null)}
      />

      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        businesses={businesses}
        onBusinessesUpdated={(updatedList) => setBusinesses(updatedList)}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={() => {
          confirmConfig.action();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
