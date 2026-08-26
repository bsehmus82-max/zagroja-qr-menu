import React, { useState, useEffect, useRef } from 'react';
import { 
  SUPER_ADMIN_PASSWORD, 
  SUPER_ADMIN_SESSION_KEY, 
  store, 
  playNotificationSound 
} from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { Restaurant, SupportMessage, ZagrojaSystemType, ZAGROJA_SYSTEMS } from '../../types';
import { 
  Shield, 
  Plus, 
  Building2, 
  Key, 
  Calendar, 
  Trash2, 
  Edit, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  ExternalLink,
  Power,
  Sparkles,
  Headphones,
  Smartphone,
  Send,
  Info,
  Download,
  Share2,
  Lock,
  LogOut,
  Utensils,
  ShoppingBag,
  BedDouble,
  Briefcase,
  Layers,
  Check
} from 'lucide-react';

const generateResetLink = (slug: string): string => {
  const expires = Date.now() + 15 * 60 * 1000;
  const token = btoa(`${slug}:${expires}`);
  return `${window.location.origin}/?reset=${token}`;
};

export const SuperAdminHQ: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem(SUPER_ADMIN_SESSION_KEY))
  );

  const [activeTab, setActiveTab] = useState<'restaurants' | 'support'>('restaurants');
  const [selectedSystemFilter, setSelectedSystemFilter] = useState<'all' | ZagrojaSystemType>('all');
  const [restaurants, setRestaurants] = useState<Restaurant[]>(store.getAllRestaurants());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRestId, setEditingRestId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Live Support State
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>(() => store.getSupportMessages());
  const [selectedRestId, setSelectedRestId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // PWA Modal
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaModal, setShowPwaModal] = useState(false);

  // Forms with string-friendly number inputs to prevent locking
  const [form, setForm] = useState({
    name: '',
    slug: '',
    username: '',
    password: '',
    system_type: 'qr_menu' as ZagrojaSystemType,
    type: 'unlimited' as 'unlimited' | 'timed',
    days: '30',
    max_tables: '25'
  });

  const [editForm, setEditForm] = useState({
    max_tables: '25',
    system_type: 'qr_menu' as ZagrojaSystemType,
    type: 'unlimited' as 'unlimited' | 'timed',
    days: '0'
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCloudData = async () => {
    setIsLoading(true);
    const [rests, msgs] = await Promise.all([
      store.loadAllRestaurantsFromCloud(),
      store.loadSupportMessagesFromCloud()
    ]);
    setRestaurants(rests);
    setSupportMessages(msgs);
    setIsLoading(false);
  };

  useEffect(() => {
    document.title = "Zagroja Master HQ — Platform Yönetim Merkezi";
  }, []);

  useEffect(() => {
    const pwaHandler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', pwaHandler);
    return () => window.removeEventListener('beforeinstallprompt', pwaHandler);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCloudData();

      const restSub = supabase.channel('zagroja_hq_restaurants')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => {
          store.loadAllRestaurantsFromCloud().then(setRestaurants);
        })
        .subscribe();

      const supportSub = supabase.channel('zagroja_hq_support')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload) => {
          const newMsg = payload.new as SupportMessage;
          setSupportMessages(prev => [...prev.filter(m => m.id !== newMsg.id), newMsg]);
          if (newMsg.sender_type === 'business') {
            playNotificationSound('call', `${newMsg.restaurant_name}: Yeni Destek Mesajı!`);
            showToast(`💬 ${newMsg.restaurant_name} yeni bir mesaj gönderdi!`);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(restSub);
        supabase.removeChannel(supportSub);
      };
    }
  }, [isAuthenticated]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages, selectedRestId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SUPER_ADMIN_PASSWORD) {
      localStorage.setItem(SUPER_ADMIN_SESSION_KEY, 'true');
      setIsAuthenticated(true);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 3000);
    }
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('Zagroja HQ başarıyla yüklendi!');
        setDeferredPrompt(null);
      }
    } else {
      setShowPwaModal(true);
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedTables = parseInt(form.max_tables) || 25;
      const parsedDays = parseInt(form.days) || 30;

      await store.createRestaurant({
        name: form.name,
        slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        owner_username: form.username,
        owner_password: form.password,
        system_type: form.system_type,
        subscription_type: form.type,
        subscription_days: parsedDays,
        max_tables: parsedTables
      });
      await fetchCloudData();
      setShowAddModal(false);
      setForm({
        name: '',
        slug: '',
        username: '',
        password: '',
        system_type: 'qr_menu',
        type: 'unlimited',
        days: '30',
        max_tables: '25'
      });
      showToast('İşletme hesabı oluşturuldu ve buluta kaydedildi.');
    } catch (err: any) {
      showToast('Hata: ' + (err?.message || 'İşletme açılamadı.'), 'error');
    }
  };

  const handleEditRestaurant = async (e: React.FormEvent, rest: Restaurant) => {
    e.preventDefault();
    const parsedTables = parseInt(editForm.max_tables) || 25;
    const parsedDays = parseInt(editForm.days) || 0;

    let newExpiresAt = rest.subscription_expires_at;
    if (editForm.type === 'timed' && parsedDays > 0) {
      const baseDate = rest.subscription_expires_at && new Date(rest.subscription_expires_at).getTime() > Date.now()
        ? new Date(rest.subscription_expires_at) : new Date();
      newExpiresAt = new Date(baseDate.getTime() + parsedDays * 24 * 60 * 60 * 1000).toISOString();
    }

    await store.updateRestaurant(rest.id, {
      max_tables: parsedTables,
      system_type: editForm.system_type,
      subscription_type: editForm.type,
      ...(editForm.type === 'timed' && parsedDays > 0 ? { subscription_expires_at: newExpiresAt } : {})
    });

    await fetchCloudData();
    setEditingRestId(null);
    showToast('İşletme ayarları güncellendi.');
  };

  const handleToggleStatus = async (rest: Restaurant) => {
    const nextStatus = !rest.is_active;
    await store.updateRestaurant(rest.id, { is_active: nextStatus });
    await fetchCloudData();
    showToast(nextStatus ? `"${rest.name}" aktif edildi.` : `"${rest.name}" askıya alındı.`);
  };

  const handleDeleteRestaurant = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" işletmesini ve tüm verilerini silmek istediğinize emin misiniz?`)) return;
    await store.deleteRestaurant(id);
    await fetchCloudData();
    showToast('İşletme silindi.', 'error');
  };

  const copyResetLink = async (id: string, slug: string) => {
    const url = generateResetLink(slug);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      showToast('Şifre sıfırlama linki kopyalandı! (15 dakika geçerli)');
      setTimeout(() => setCopiedId(null), 3000);
    } catch {
      showToast('Kopyalanamadı. Manuel link: ' + url, 'error');
    }
  };

  const handleSendSupportReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestId || !replyText.trim() || isSending) return;

    const rest = restaurants.find(r => r.id === selectedRestId);
    const text = replyText.trim();
    setReplyText('');
    setIsSending(true);

    try {
      const msg = await store.sendSupportMessage({
        restaurant_id: selectedRestId,
        restaurant_name: rest?.name || 'İşletme',
        sender_type: 'superadmin',
        sender_name: 'Zagroja Master Admin',
        message: text
      });
      setSupportMessages(prev => [...prev.filter(m => m.id !== msg.id), msg]);
    } catch (err) {
      console.warn('Mesaj gönderilemedi:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Filter by System and Search
  const filteredRestaurants = restaurants.filter(r => {
    const currentSys = r.system_type || 'qr_menu';
    const matchesSystem = selectedSystemFilter === 'all' || currentSys === selectedSystemFilter;
    const matchesSearch = 
      (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.owner_username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.slug || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSystem && matchesSearch;
  });

  const getSystemConfig = (sysType?: ZagrojaSystemType) => {
    const type = sysType || 'qr_menu';
    return ZAGROJA_SYSTEMS.find(s => s.id === type) || ZAGROJA_SYSTEMS[0];
  };

  const getSystemIcon = (iconName: string, className: string = "w-4 h-4") => {
    switch (iconName) {
      case 'Utensils': return <Utensils className={className} />;
      case 'Calendar': return <Calendar className={className} />;
      case 'ShoppingBag': return <ShoppingBag className={className} />;
      case 'BedDouble': return <BedDouble className={className} />;
      case 'Briefcase': return <Briefcase className={className} />;
      default: return <Building2 className={className} />;
    }
  };

  const totalUnreadSupport = supportMessages.filter(m => m.sender_type === 'business' && !m.is_read).length;
  const currentChatRest = restaurants.find(r => r.id === selectedRestId);
  const activeChatMessages = supportMessages.filter(m => m.restaurant_id === selectedRestId);

  // ============================================================
  // LOGIN SCREEN
  // ============================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
        <form onSubmit={handleLogin} className="bg-slate-900 p-8 rounded-3xl w-full max-w-sm border border-slate-800 shadow-2xl animate-slide-up">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Shield className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-xl font-black text-white text-center mb-1">Zagroja Master HQ</h1>
          <p className="text-xs text-slate-400 text-center mb-6">Merkezi Platform Yönetim Girişi</p>
          
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              placeholder="Master Giriş Şifresi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-10 pr-4 py-3.5 bg-slate-800 border text-white text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                loginError ? 'border-rose-500' : 'border-slate-700'
              }`}
            />
          </div>

          {loginError && (
            <p className="text-rose-400 text-xs mb-3 flex items-center gap-1 font-medium">
              <XCircle className="w-4 h-4" /> Hatalı şifre girdiniz
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-sm active:scale-95"
          >
            Yönetim Merkezine Giriş Yap
          </button>
        </form>
      </div>
    );
  }

  // ============================================================
  // MASTER HQ DASHBOARD
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-8 selection:bg-indigo-500 selection:text-white">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold animate-slide-up ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}

      {/* PWA Mobile Install Modal */}
      {showPwaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-center mb-1">Zagroja HQ'yu Telefona Yükle</h3>
            <p className="text-xs text-slate-400 text-center mb-4">
              Yönetim merkezini telefonunuzda bağımsız native uygulama olarak kullanmak için:
            </p>

            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <span className="font-bold text-indigo-400">iOS (iPhone):</span>
                <span className="text-slate-300">Safari'de alttaki <strong>Paylaş (<Share2 className="inline w-3.5 h-3.5" />)</strong> butonuna basıp <strong>"Ana Ekrana Ekle"</strong> seçin.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-emerald-400">Android:</span>
                <span className="text-slate-300">Chrome menüsünden <strong>"Uygulamayı Yükle"</strong> veya <strong>"Ana Ekrana Ekle"</strong> seçin.</span>
              </div>
            </div>

            <button
              onClick={() => setShowPwaModal(false)}
              className="mt-5 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all"
            >
              Anladım
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/30">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">Zagroja Master HQ</h1>
                <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-500/30">
                  Platform Yöneticisi
                </span>
              </div>
              <p className="text-xs text-slate-400">Tüm Zagroja Sistemleri, Müşteriler & Canlı İletişim ({restaurants.length} İşletme)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleInstallPwa}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Telefona Yükle</span>
            </button>
            <button
              onClick={() => setShowAddModal(!showAddModal)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Yeni Hesap Ekle
            </button>
            <button
              onClick={onLogout}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs (İşletmeler / Canlı Destek) */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 shadow-md">
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'restaurants'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Kayıtlı İşletmeler ({restaurants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative ${
              activeTab === 'support'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Zagroja Canlı Destek</span>
            {totalUnreadSupport > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                {totalUnreadSupport}
              </span>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: RESTAURANTS & MULTI-SYSTEM DISTRIBUTION */}
        {/* ========================================================================= */}
        {activeTab === 'restaurants' && (
          <div className="space-y-4 animate-fade-in">
            {/* System Filter Category Hub */}
            <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setSelectedSystemFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedSystemFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tüm Sistemler ({restaurants.length})</span>
              </button>

              {ZAGROJA_SYSTEMS.map(sys => {
                const sysCount = restaurants.filter(r => (r.system_type || 'qr_menu') === sys.id).length;
                const isSelected = selectedSystemFilter === sys.id;

                return (
                  <button
                    key={sys.id}
                    onClick={() => setSelectedSystemFilter(sys.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? `bg-gradient-to-r ${sys.color} text-white shadow-md`
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {getSystemIcon(sys.icon, "w-3.5 h-3.5")}
                    <span>{sys.name} ({sysCount})</span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="İşletme adı, kullanıcı adı veya bağlantı kodu ile ara..."
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md"
              />
            </div>

            {/* Add Modal */}
            {showAddModal && (
              <form onSubmit={handleCreateRestaurant} className="bg-slate-900 p-6 rounded-3xl border border-indigo-500/40 shadow-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
                <div className="sm:col-span-2 lg:col-span-3 border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Yeni İşletme & Sistem Hesabı Oluştur</span>
                  </h3>
                  <button type="button" onClick={() => setShowAddModal(false)} className="text-xs text-slate-400 hover:text-white">Kapat</button>
                </div>

                {/* System Module Selection */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-xs font-bold text-slate-400 mb-1.5 block">Kurulacak Zagroja Sistemi *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {ZAGROJA_SYSTEMS.map(sys => {
                      const isSelected = form.system_type === sys.id;
                      return (
                        <div
                          key={sys.id}
                          onClick={() => setForm({ ...form, system_type: sys.id })}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/20'
                              : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                          }`}
                        >
                          <div className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {getSystemIcon(sys.icon, "w-4 h-4")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs text-white">{sys.name}</h4>
                              {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{sys.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">İşletme / Müşteri Adı *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="İşletme Adı" className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Kalıcı URL Slug *</label>
                  <input required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="isletme-kodu" className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Giriş Kullanıcı Adı *</label>
                  <input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="kullanici_adi" className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Giriş Şifresi *</label>
                  <input required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Maksimum Kapasite / Masa Sınırı</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={999} 
                    value={form.max_tables} 
                    onChange={e => setForm({ ...form, max_tables: e.target.value })} 
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Abonelik Türü</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl text-xs outline-none">
                    <option value="unlimited">Sınırsız (Ömür Boyu)</option>
                    <option value="timed">Süreli (Günlük/Aylık)</option>
                  </select>
                </div>
                {form.type === 'timed' && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Abonelik Süresi (Gün)</label>
                    <input 
                      type="number" 
                      min={1} 
                      value={form.days} 
                      onChange={e => setForm({ ...form, days: e.target.value })} 
                      className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl text-xs outline-none" 
                    />
                  </div>
                )}
                <div className="sm:col-span-2 lg:col-span-3 pt-2">
                  <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all">
                    Hesabı Doğrudan Buluta Kaydet
                  </button>
                </div>
              </form>
            )}

            {/* List of Businesses */}
            <div className="space-y-3">
              {filteredRestaurants.map(rest => {
                const sys = getSystemConfig(rest.system_type);

                return (
                  <div key={rest.id} className="bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-3 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
                          rest.is_active ? `${sys.badge_bg} ${sys.badge_text} border` : 'bg-slate-800 text-slate-500'
                        }`}>
                          {getSystemIcon(sys.icon, "w-5 h-5")}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-extrabold text-sm sm:text-base text-white">{rest.name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sys.badge_bg} ${sys.badge_text}`}>
                              {sys.name}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              rest.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {rest.is_active ? 'Aktif' : 'Askıda'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-0.5">
                            <span className="font-mono text-indigo-300">/{rest.slug}</span>
                            <span className="flex items-center gap-1 text-slate-300"><Key className="w-3 h-3 text-slate-500" /> {rest.owner_username}</span>
                            <span className="flex items-center gap-1 text-slate-400"><Calendar className="w-3 h-3 text-slate-500" />
                              {rest.subscription_type === 'unlimited' ? 'Sınırsız Lisans' : `Bitiş: ${new Date(rest.subscription_expires_at!).toLocaleDateString('tr-TR')}`}
                            </span>
                            <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 text-[10px]">
                              Maks {rest.max_tables || 25} Masa
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setActiveTab('support');
                            setSelectedRestId(rest.id);
                          }}
                          title="İşletmeyle Canlı Sohbet Aç"
                          className="p-2 text-indigo-400 hover:bg-indigo-950/50 rounded-xl transition-all"
                        >
                          <Headphones className="w-4 h-4" />
                        </button>
                        <a
                          href={`/?r=${rest.slug}&table=1`}
                          target="_blank"
                          rel="noreferrer"
                          title="Sistemi / Müşteri Menüsünü Aç"
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => copyResetLink(rest.id, rest.slug)}
                          title="Şifre Sıfırlama Linki Kopyala (15 dakika geçerli)"
                          className={`p-2 rounded-xl transition-all ${
                            copiedId === rest.id ? 'text-emerald-400 bg-emerald-950/40' : 'text-indigo-400 hover:bg-indigo-950/50'
                          }`}
                        >
                          {copiedId === rest.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(rest)}
                          title={rest.is_active ? 'Hesabı Askıya Al' : 'Hesabı Aktif Et'}
                          className={`p-2 rounded-xl transition-all ${
                            rest.is_active ? 'text-emerald-400 hover:bg-emerald-950/40' : 'text-slate-500 hover:bg-slate-800'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditForm({
                              max_tables: String(rest.max_tables || 25),
                              system_type: rest.system_type || 'qr_menu',
                              type: rest.subscription_type,
                              days: '0'
                            });
                            setEditingRestId(editingRestId === rest.id ? null : rest.id);
                          }}
                          title="Masa Sınırı ve Sistem Düzenle"
                          className="p-2 text-blue-400 hover:bg-blue-950/50 rounded-xl transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRestaurant(rest.id, rest.name)}
                          title="İşletmeyi Kalıcı Sil"
                          className="p-2 text-rose-400 hover:bg-rose-950/50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Edit dropdown */}
                    {editingRestId === rest.id && (
                      <form onSubmit={(e) => handleEditRestaurant(e, rest)} className="mt-2 p-4 bg-slate-800/80 rounded-2xl border border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fade-in text-xs">
                        <div>
                          <label className="text-slate-400 font-bold mb-1 block">Zagroja Sistemi</label>
                          <select 
                            value={editForm.system_type} 
                            onChange={e => setEditForm({ ...editForm, system_type: e.target.value as any })} 
                            className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded-xl"
                          >
                            {ZAGROJA_SYSTEMS.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-400 font-bold mb-1 block">Masa / Kapasite Sınırı</label>
                          <input 
                            type="number" 
                            min={1} 
                            max={999} 
                            value={editForm.max_tables} 
                            onChange={e => setEditForm({ ...editForm, max_tables: e.target.value })} 
                            className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded-xl" 
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 font-bold mb-1 block">Lisans Türü</label>
                          <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value as any })} className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded-xl">
                            <option value="unlimited">Sınırsız (Ömür Boyu)</option>
                            <option value="timed">Süreli (Süre Ekle)</option>
                          </select>
                        </div>
                        {editForm.type === 'timed' ? (
                          <div>
                            <label className="text-slate-400 font-bold mb-1 block">Süre Ekle (Gün)</label>
                            <input 
                              type="number" 
                              min={0} 
                              value={editForm.days} 
                              onChange={e => setEditForm({ ...editForm, days: e.target.value })} 
                              className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded-xl" 
                              placeholder="+ Gün Sayısı" 
                            />
                          </div>
                        ) : <div />}
                        <div className="flex items-end gap-2 sm:col-span-4 justify-end">
                          <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl">Ayarları Kaydet</button>
                          <button type="button" onClick={() => setEditingRestId(null)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl">İptal</button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}

              {filteredRestaurants.length === 0 && !isLoading && (
                <div className="bg-slate-900 rounded-3xl border border-slate-800 p-12 text-center text-slate-500">
                  <Building2 className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                  <p className="font-bold text-slate-300 text-sm">Bu Sistemde Kayıtlı İşletme Bulunmuyor</p>
                  <p className="text-xs text-slate-500 mt-1">Yukarıdaki "Yeni Hesap Ekle" butonuna basarak bu sisteme işletme kaydedebilirsiniz.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LIVE SUPPORT HUB */}
        {/* ========================================================================= */}
        {activeTab === 'support' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-180px)] animate-fade-in">
            {/* Left: Businesses List */}
            <div className="border-r border-slate-800 flex flex-col bg-slate-950/50">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-indigo-400" />
                  <span>Destek Talepleri</span>
                </h3>
                <button onClick={fetchCloudData} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="bg-indigo-950/30 px-3 py-2 border-b border-indigo-900/30 text-[10px] text-indigo-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Mesajlar depolama tasarrufu için 5 gün sonra otomatik silinir.</span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                {restaurants.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">Henüz kayıtlı işletme yok.</div>
                ) : (
                  restaurants.map(r => {
                    const rMsgs = supportMessages.filter(m => m.restaurant_id === r.id);
                    const lastMsg = rMsgs[rMsgs.length - 1];
                    const unread = rMsgs.filter(m => m.sender_type === 'business' && !m.is_read).length;
                    const isSelected = selectedRestId === r.id;
                    const sys = getSystemConfig(r.system_type);

                    return (
                      <button
                        key={r.id}
                        onClick={async () => {
                          setSelectedRestId(r.id);
                          await store.markSupportMessagesAsRead(r.id, 'superadmin');
                          setSupportMessages(store.getSupportMessages());
                        }}
                        className={`w-full text-left p-3.5 transition-all flex items-center justify-between gap-3 ${
                          isSelected ? 'bg-indigo-600/20 border-l-4 border-indigo-500' : 'hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white truncate">{r.name}</span>
                            {lastMsg && (
                              <span className="text-[10px] text-slate-500">
                                {new Date(lastMsg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[9px] font-bold px-1 rounded ${sys.badge_bg} ${sys.badge_text}`}>
                              {sys.short_name}
                            </span>
                            <p className="text-[11px] text-slate-400 truncate flex-1">
                              {lastMsg ? `${lastMsg.sender_type === 'superadmin' ? 'Siz: ' : ''}${lastMsg.message}` : 'Henüz mesaj yok'}
                            </p>
                          </div>
                        </div>

                        {unread > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Message Stream */}
            <div className="md:col-span-2 flex flex-col bg-slate-900 h-full">
              {selectedRestId && currentChatRest ? (
                <>
                  <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                        {currentChatRest.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{currentChatRest.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">@{currentChatRest.owner_username}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/60">
                    {activeChatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                        <Headphones className="w-10 h-10 text-slate-700 mb-2" />
                        <p className="text-xs text-slate-400">Bu işletmeyle henüz mesajlaşma bulunmuyor.</p>
                      </div>
                    ) : (
                      activeChatMessages.map(msg => {
                        const isSuperAdmin = msg.sender_type === 'superadmin';
                        const timeStr = new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isSuperAdmin ? 'items-end' : 'items-start'} animate-slide-up`}
                          >
                            <span className="text-[10px] text-slate-500 mb-0.5 px-1 font-semibold">
                              {isSuperAdmin ? 'Siz (Master Admin)' : `${msg.sender_name} (${msg.restaurant_name})`}
                            </span>
                            <div
                              className={`max-w-[85%] sm:max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-md ${
                                isSuperAdmin
                                  ? 'bg-indigo-600 text-white rounded-tr-xs'
                                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-xs'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                              <span className="block text-right text-[9px] text-indigo-200/80 mt-1">
                                {timeStr}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleSendSupportReply} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`${currentChatRest.name} işletmesine cevap yazın...`}
                      className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || isSending}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
                    >
                      <span>Gönder</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <Headphones className="w-12 h-12 text-slate-700 mb-2" />
                  <h4 className="font-bold text-white text-sm">Bir İşletme Seçin</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Sol listeden destek mesajı gönderen veya sohbet etmek istediğiniz işletmeyi seçin.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
