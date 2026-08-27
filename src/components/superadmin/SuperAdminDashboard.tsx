import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, MessageSquare, Shield, Power, 
  Calendar, Layers, Search, AlertTriangle, 
  RefreshCw, Lock, Trash2, Radio, Database, LogOut
} from 'lucide-react';
import { supabase, hashPassword, generateTempPassword } from '../../lib/supabase';
import { Business } from '../../types';
import { sound } from '../../lib/audio';
import { CreateBusinessModal } from './CreateBusinessModal';
import { CreatedCredentialsModal } from './CreatedCredentialsModal';
import { BroadcastModal } from './BroadcastModal';
import { SuperAdminChat } from './SuperAdminChat';

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'businesses' | 'chat' | 'database'>('businesses');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<{
    business: Business;
    tempPass: string;
    days: number;
  } | null>(null);

  const [selectedBizForChat, setSelectedBizForChat] = useState<Business | null>(null);

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

  // Listen for realtime chat
  useEffect(() => {
    const channel = supabase
      .channel('superadmin-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        (payload) => {
          if (payload.new && (payload.new as { sender: string }).sender === 'business') {
            sound.playMessageTone();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      alert(`${biz.name} iþletmesine ${additionalDays} gün süre eklendi.`);
    }
  };

  const handleResetPassword = async (biz: Business) => {
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
    }
  };

  const handleDeleteBusiness = async (biz: Business) => {
    if (!window.confirm(`"${biz.name}" iþletmesini ve tüm menüsünü silmek istediðinize emin misiniz?`)) {
      return;
    }

    const { error } = await supabase.from('businesses').delete().eq('id', biz.id);
    if (!error) {
      setBusinesses((prev) => prev.filter((b) => b.id !== biz.id));
      if (selectedBizForChat?.id === biz.id) {
        setSelectedBizForChat(null);
      }
    }
  };

  const filtered = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-xl sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg tracking-tight text-white">ZAGROJA PLATFORM HQ</h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-neutral-400">Merkezi Ýþletme Yönetimi & Canlý Ýletiþim Aðý</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800">
          <button
            onClick={() => setActiveTab('businesses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'businesses' ? 'bg-brand-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Ýþletmeler ({businesses.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'chat' ? 'bg-brand-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Canlý Destek
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'database' ? 'bg-brand-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            SQL Þemasý
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600/10 border border-purple-500/30 text-purple-300 hover:bg-purple-600/20 text-xs font-bold transition"
          >
            <Radio className="w-4 h-4 text-purple-400" />
            Toplu Duyuru Gönder
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Yeni Ýþletme Aç
          </button>
          <button
            onClick={onLogout}
            title="Güvenli Çýkýþ"
            className="p-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'businesses' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                <span className="text-xs font-medium text-neutral-400">Toplam Ýþletme</span>
                <p className="text-3xl font-black text-white mt-1">{businesses.length}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                <span className="text-xs font-medium text-neutral-400">Aktif Abonelik</span>
                <p className="text-3xl font-black text-emerald-400 mt-1">
                  {businesses.filter((b) => b.subscription_status === 'active').length}
                </p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                <span className="text-xs font-medium text-neutral-400">Askýya Alýnan</span>
                <p className="text-3xl font-black text-amber-400 mt-1">
                  {businesses.filter((b) => b.subscription_status === 'suspended').length}
                </p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl flex items-center">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ýþletme ara..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 transition"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-neutral-500 flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
                <span>Ýþletmeler yükleniyor...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center bg-neutral-900/40 border border-dashed border-neutral-800 rounded-3xl p-8">
                <Building2 className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h3 className="font-bold text-white text-base">Henüz Ýþletme Bulunmuyor</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Sað üstteki <strong>"Yeni Ýþletme Aç"</strong> butonuna týklayarak ilk iþletmeyi oluþturabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map((biz) => {
                  const daysLeft = Math.ceil(
                    (new Date(biz.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  const isExpiringSoon = daysLeft <= 3 && daysLeft >= 0;
                  const isExpired = daysLeft < 0;

                  return (
                    <div
                      key={biz.id}
                      className={`bg-neutral-900 border ${
                        biz.subscription_status === 'suspended'
                          ? 'border-amber-500/30 opacity-75'
                          : isExpiringSoon
                          ? 'border-red-500/50'
                          : 'border-neutral-800'
                      } rounded-3xl p-6 relative flex flex-col justify-between hover:border-neutral-700 transition`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-lg text-white tracking-tight">{biz.name}</h3>
                              {biz.subscription_status === 'suspended' ? (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Askýya Alýndý
                                </span>
                              ) : isExpired ? (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                                  Süresi Doldu
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-400 mt-1 font-mono">
                              Kullanýcý: <span className="text-neutral-200 font-bold">{biz.username}</span> | Slug: {biz.slug}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedBizForChat(biz);
                              setActiveTab('chat');
                            }}
                            className="p-2.5 rounded-2xl bg-neutral-800 hover:bg-brand-600 text-neutral-300 hover:text-white transition shrink-0"
                            title="Canlý Destek"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800/80">
                            <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
                              <Layers className="w-3.5 h-3.5 text-brand-400" />
                              <span>Masa Limiti</span>
                            </div>
                            <div className="text-sm font-bold text-white">
                              {biz.table_limit ? `${biz.table_limit} Masa` : 'Sýnýrsýz'}
                            </div>
                          </div>

                          <div className={`p-3 rounded-2xl border ${
                            isExpiringSoon ? 'bg-red-500/10 border-red-500/30' : 'bg-neutral-950/60 border-neutral-800/80'
                          }`}>
                            <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
                              <Calendar className="w-3.5 h-3.5 text-brand-400" />
                              <span>Kalan Süre</span>
                            </div>
                            <div className={`text-sm font-bold ${isExpiringSoon ? 'text-red-400' : 'text-white'}`}>
                              {isExpired ? 'Süresi Doldu (0 Gün)' : `${daysLeft} Gün`}
                            </div>
                          </div>
                        </div>

                        {isExpiringSoon && (
                          <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-400">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Son 3 gün kaldý! Yenileme uyarýsý gönderilebilir.</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSuspend(biz)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                              biz.subscription_status === 'suspended'
                                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                                : 'bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            {biz.subscription_status === 'suspended' ? 'Askýdan Çýkar' : 'Askýya Al'}
                          </button>

                          <button
                            onClick={() => handleAddDays(biz, 30)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition border border-neutral-700"
                          >
                            +30 Gün Ekle
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleResetPassword(biz)}
                            title="Yeni Þifre Belirle"
                            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBusiness(biz)}
                            title="Ýþletmeyi Sil"
                            className="p-2 rounded-xl bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition"
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
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-black text-lg text-white">Supabase Veritabaný Kurulumu</h3>
            <p className="text-xs text-neutral-400">
              Veritabaný tablolarýnýn tam olarak çalýþmasý için <code>supabase_schema.sql</code> dosyasý projenizde hazýrdýr.
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
    </div>
  );
};
