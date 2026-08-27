import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, MessageSquare, Shield, Power, 
  Calendar, Layers, Search, AlertTriangle, 
  RefreshCw, Lock, Trash2, Radio, Database, LogOut
} from 'lucide-react';
import { supabase, hashPassword, generateTempPassword } from '../../lib/supabase';
import { Business } from '../../types';
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

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onLogout }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'businesses' | 'chat' | 'database'>(() => {
    return (localStorage.getItem('superadmin_active_tab') as any) || 'businesses';
  });
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    localStorage.setItem('superadmin_active_tab', tab);
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
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
        subscription_days: biz.subscription_days + additionalDays,
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

  const filtered = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090C10] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header */}
      <header className="border-b border-[#212634] bg-[#12161F]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-slate-100">Yönetim Merkezi</h1>
            <p className="text-[11px] text-slate-400">Platform Kontrol Paneli</p>
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
            İşletmeler ({businesses.length})
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
            <span className="hidden sm:inline">Yeni İşletme</span>
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
            {/* Metric KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#12161F] border border-[#212634] p-4 rounded-2xl">
                <span className="text-[11px] font-medium text-slate-400">Toplam İşletme</span>
                <p className="text-2xl font-bold text-slate-100 mt-0.5">{businesses.length}</p>
              </div>
              <div className="bg-[#12161F] border border-[#212634] p-4 rounded-2xl">
                <span className="text-[11px] font-medium text-slate-400">Aktif Durumda</span>
                <p className="text-2xl font-bold text-emerald-400 mt-0.5">
                  {businesses.filter((b) => b.subscription_status === 'active').length}
                </p>
              </div>
              <div className="bg-[#12161F] border border-[#212634] p-4 rounded-2xl">
                <span className="text-[11px] font-medium text-slate-400">Askıya Alınan</span>
                <p className="text-2xl font-bold text-amber-400 mt-0.5">
                  {businesses.filter((b) => b.subscription_status === 'suspended').length}
                </p>
              </div>
              <div className="bg-[#12161F] border border-[#212634] p-4 rounded-2xl flex items-center col-span-2 md:col-span-1">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="İşletme ara..."
                    className="w-full bg-[#0A0D14] border border-[#212634] focus:border-indigo-500/60 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
                  />
                </div>
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
                <h3 className="font-semibold text-slate-200 text-sm">Kayıtlı İşletme Bulunmuyor</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sağ üstteki "Yeni İşletme" butonu ile ilk kaydı oluşturabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {filtered.map((biz) => {
                  const daysLeft = Math.ceil(
                    (new Date(biz.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  const isExpiringSoon = daysLeft <= 3 && daysLeft >= 0;
                  const isExpired = daysLeft < 0;

                  return (
                    <div
                      key={biz.id}
                      className={`bg-[#12161F] border rounded-2xl p-5 relative flex flex-col justify-between hover:border-[#2E3648] transition ${
                        biz.subscription_status === 'suspended'
                          ? 'border-amber-500/20 opacity-80'
                          : isExpiringSoon
                          ? 'border-rose-500/40'
                          : 'border-[#212634]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-slate-100">{biz.name}</h3>
                              {biz.subscription_status === 'suspended' ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Askıda
                                </span>
                              ) : isExpired ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  Süresi Doldu
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Aktif
                                </span>
                              )}
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

                        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                          <div className="bg-[#0A0D14] p-2.5 rounded-xl border border-[#212634]">
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                              <Layers className="w-3 h-3 text-indigo-400" />
                              <span>Masa Limiti</span>
                            </div>
                            <div className="text-xs font-semibold text-slate-200">
                              {biz.table_limit ? `${biz.table_limit} Masa` : 'Sınırsız'}
                            </div>
                          </div>

                          <div className={`p-2.5 rounded-xl border ${
                            isExpiringSoon ? 'bg-rose-500/10 border-rose-500/20' : 'bg-[#0A0D14] border-[#212634]'
                          }`}>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                              <Calendar className="w-3 h-3 text-indigo-400" />
                              <span>Kalan Süre</span>
                            </div>
                            <div className={`text-xs font-semibold ${isExpiringSoon ? 'text-rose-400' : 'text-slate-200'}`}>
                              {isExpired ? 'Süresi Doldu' : `${daysLeft} Gün`}
                            </div>
                          </div>
                        </div>

                        {isExpiringSoon && (
                          <div className="mb-3.5 p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-1.5 text-[11px] text-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                            <span>Son 3 gün kaldı.</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#212634] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleSuspend(biz)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                              biz.subscription_status === 'suspended'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            {biz.subscription_status === 'suspended' ? 'Aktifleştir' : 'Askıya Al'}
                          </button>

                          <button
                            onClick={() => handleAddDays(biz, 30)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#1A202C] hover:bg-[#252D3D] text-slate-300 transition border border-[#262E3E]"
                          >
                            +30 Gün
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => promptResetPassword(biz)}
                            title="Şifre Sıfırla"
                            className="p-1.5 rounded-lg bg-[#1A202C] hover:bg-[#252D3D] text-slate-400 hover:text-slate-200 transition"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => promptDeleteBusiness(biz)}
                            title="Sil"
                            className="p-1.5 rounded-lg bg-[#1A202C] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
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
          <div className="bg-[#12161F] border border-[#212634] rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-sm text-slate-100">Veritabanı Şeması</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Veritabanı tablolarının kurulumu için <code>supabase_schema.sql</code> dosyası hazır bulunmaktadır.
            </p>
          </div>
        )}
      </main>

      <CreateBusinessModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(info) => {
          setBusinesses((prev) => [info.business, ...prev]);
          setCreatedInfo(info);
          toast.success(`"${info.business.name}" hesabı açıldı.`);
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
