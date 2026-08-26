import React, { useState, useEffect, useRef } from 'react';
import { 
  SUPER_ADMIN_PASSWORD, 
  SUPER_ADMIN_SESSION_KEY, 
  store, 
  playNotificationSound,
  generateUUID
} from '../../lib/store';
import { 
  supabase, 
  getSupabaseConfig, 
  updateSupabaseCredentials, 
  testSupabaseConnection 
} from '../../lib/supabase';
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
  Database,
  Smartphone,
  Send,
  Clock,
  CheckCheck,
  Info,
  Server,
  Download,
  Share2,
  AlertTriangle
} from 'lucide-react';
import { Restaurant, SupportMessage } from '../../types';

const generateResetLink = (slug: string): string => {
  // 15 dakika geçerli
  const expires = Date.now() + 15 * 60 * 1000;
  const token = btoa(`${slug}:${expires}`);
  return `${window.location.origin}/?reset=${token}`;
};

export const SuperAdmin = ({ onLogout }: { onLogout: () => void }) => {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem(SUPER_ADMIN_SESSION_KEY))
  );

  // Active View Tab: 'restaurants' | 'support'
  const [activeView, setActiveView] = useState<'restaurants' | 'support'>('restaurants');

  // Restaurants State
  const [restaurants, setRestaurants] = useState<Restaurant[]>(store.getAllRestaurants());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  
  // Support Chat State
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>(() => store.getSupportMessages());
  const [selectedChatRestId, setSelectedChatRestId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Database Connection State
  const [dbConfig, setDbConfig] = useState(getSupabaseConfig());
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaModal, setShowPwaModal] = useState(false);

  const [form, setForm] = useState({
    name: '', 
    slug: '', 
    username: '', 
    password: '',
    type: 'unlimited' as 'unlimited' | 'timed', 
    days: 30, 
    max_tables: 25
  });

  const [editForm, setEditForm] = useState({
    max_tables: 25, 
    type: 'unlimited' as 'unlimited' | 'timed', 
    days: 0
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRestaurants = async () => {
    setIsLoading(true);
    const data = await store.loadAllRestaurantsFromCloud();
    setRestaurants(data);
    setIsLoading(false);
  };

  const fetchSupportMessages = async () => {
    const msgs = await store.loadSupportMessagesFromCloud();
    setSupportMessages(msgs);
  };

  useEffect(() => {
    // PWA Install prompt listener
    const pwaHandler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', pwaHandler);
    return () => window.removeEventListener('beforeinstallprompt', pwaHandler);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRestaurants();
      fetchSupportMessages();
      
      // Realtime Restaurants subscription
      const restSub = supabase.channel('super_admin_restaurants')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => {
          fetchRestaurants();
        })
        .subscribe();

      // Realtime Support Messages subscription with Sound Notification
      const supportSub = supabase.channel('super_admin_support_channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload) => {
          const newMsg = payload.new as SupportMessage;
          setSupportMessages((prev) => [...prev.filter(m => m.id !== newMsg.id), newMsg]);
          
          if (newMsg.sender_type === 'business') {
            playNotificationSound('call', `${newMsg.restaurant_name}: Yeni Destek Mesajı Geldi!`);
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
  }, [supportMessages, selectedChatRestId]);

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
        showToast('Uygulama başarıyla kuruldu!');
        setDeferredPrompt(null);
      }
    } else {
      setShowPwaModal(true);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await store.createRestaurant({
        name: form.name,
        slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        owner_username: form.username,
        owner_password: form.password,
        subscription_type: form.type,
        subscription_days: form.days,
        max_tables: form.max_tables
      });
      await fetchRestaurants();
      setShowAdd(false);
      setForm({ name: '', slug: '', username: '', password: '', type: 'unlimited', days: 30, max_tables: 25 });
      showToast('İşletme hesabı başarıyla oluşturuldu ve buluta kaydedildi.');
    } catch (e: any) {
      showToast('Hata: ' + (e?.message || 'İşletme oluşturulamadı.'), 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent, rest: Restaurant) => {
    e.preventDefault();
    let newExpiresAt = rest.subscription_expires_at;
    if (editForm.type === 'timed' && editForm.days > 0) {
      const baseDate = rest.subscription_expires_at && new Date(rest.subscription_expires_at).getTime() > Date.now()
        ? new Date(rest.subscription_expires_at) : new Date();
      newExpiresAt = new Date(baseDate.getTime() + editForm.days * 24 * 60 * 60 * 1000).toISOString();
    }
    await store.updateRestaurant(rest.id, {
      max_tables: editForm.max_tables,
      subscription_type: editForm.type,
      ...(editForm.type === 'timed' && editForm.days > 0 ? { subscription_expires_at: newExpiresAt } : {})
    });
    await fetchRestaurants();
    setShowEdit(null);
    showToast('İşletme ayarları kaydedildi.');
  };

  const handleToggleStatus = async (rest: Restaurant) => {
    const nextStatus = !rest.is_active;
    await store.updateRestaurant(rest.id, { is_active: nextStatus });
    await fetchRestaurants();
    showToast(nextStatus ? `"${rest.name}" aktif edildi.` : `"${rest.name}" askıya alındı.`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" işletmesini ve tüm verilerini silmek istediğinize emin misiniz?`)) return;
    await store.deleteRestaurant(id);
    await fetchRestaurants();
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
      showToast('Kopyalanamadı. Manuel seçin: ' + url, 'error');
    }
  };

  // Support Chat Actions
  const handleSelectChat = async (restId: string) => {
    setSelectedChatRestId(restId);
    await store.markSupportMessagesAsRead(restId, 'superadmin');
    setSupportMessages(store.getSupportMessages());
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatRestId || !chatInput.trim() || isSendingChat) return;

    const rest = restaurants.find(r => r.id === selectedChatRestId);
    const text = chatInput.trim();
    setChatInput('');
    setIsSendingChat(true);

    try {
      const newMsg = await store.sendSupportMessage({
        restaurant_id: selectedChatRestId,
        restaurant_name: rest?.name || 'İşletme',
        sender_type: 'superadmin',
        sender_name: 'Zagroja Süper Admin',
        message: text
      });

      setSupportMessages((prev) => [...prev.filter(m => m.id !== newMsg.id), newMsg]);
    } catch (err) {
      console.warn('Mesaj gönderilemedi:', err);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Database Connection Actions
  const handleTestAndSaveDb = async () => {
    setIsTestingDb(true);
    setDbTestResult(null);
    const res = await testSupabaseConnection(dbConfig.url, dbConfig.key);
    setIsTestingDb(false);
    if (res.success) {
      updateSupabaseCredentials(dbConfig.url, dbConfig.key);
      setDbTestResult({ success: true, msg: '✅ Supabase Bulut Veritabanı Bağlantısı Başarılı ve Kaydedildi!' });
      showToast('Bulut veritabanı ayarları güncellendi.');
      fetchRestaurants();
      fetchSupportMessages();
    } else {
      setDbTestResult({ success: false, msg: `❌ Bağlantı Başarısız: ${res.error || 'Adres veya Key hatalı'}` });
    }
  };

  const filteredRestaurants = restaurants.filter(r => 
    (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.owner_username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group support messages by restaurant
  const totalUnreadSupportCount = supportMessages.filter(m => m.sender_type === 'business' && !m.is_read).length;
  
  const currentChatRestaurant = restaurants.find(r => r.id === selectedChatRestId);
  const activeChatMessages = supportMessages.filter(m => m.restaurant_id === selectedChatRestId);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
        <form onSubmit={handleLogin} className="bg-slate-900 p-8 rounded-3xl w-full max-w-sm border border-slate-800 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <Shield className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-xl font-black text-white text-center mb-1">Süper Admin Girişi</h1>
          <p className="text-xs text-slate-400 text-center mb-6">Zagroja Platform Ana Yönetim Merkezi</p>
          
          <input
            type="password"
            placeholder="Süper Admin Şifresi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-3.5 bg-slate-800 border text-white rounded-xl mb-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${loginError ? 'border-red-500' : 'border-slate-700'}`}
          />
          {loginError && (
            <p className="text-red-400 text-xs mb-3 flex items-center gap-1 font-medium">
              <XCircle className="w-4 h-4" /> Hatalı şifre girdiniz
            </p>
          )}
          <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 text-sm">
            Yönetim Paneline Giriş Yap
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-8">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold animate-slide-up ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}

      {/* PWA Mobile Install Guide Modal */}
      {showPwaModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-center mb-1">Telefona Uygulama Olarak Yükle</h3>
            <p className="text-xs text-slate-400 text-center mb-4">
              Süper Admin panelini mobil cihazınızda tek tıkla açılan native uygulama olarak kullanabilirsiniz:
            </p>

            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-400">iOS (iPhone):</span>
                <span className="text-slate-300">Safari'de alttaki <strong>Paylaş (<Share2 className="inline w-3.5 h-3.5" />)</strong> butonuna basıp <strong>"Ana Ekrana Ekle"</strong> seçin.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-emerald-400">Android:</span>
                <span className="text-slate-300">Chrome menüsünden (üç nokta) <strong>"Uygulamayı Yükle"</strong> veya <strong>"Ana Ekrana Ekle"</strong> seçin.</span>
              </div>
            </div>

            <button
              onClick={() => setShowPwaModal(false)}
              className="mt-5 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all"
            >
              Anladım, Kapat
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Süper Admin Yönetim Merkezi</h1>
                <p className="text-xs text-slate-500">Zagroja Multi-Tenant SaaS Platformu ({restaurants.length} Kayıtlı İşletme)</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleInstallPwa}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95"
              title="Telefona veya Masaüstüne Native Uygulama Olarak Yükle"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Telefona Yükle</span>
            </button>
            <button 
              onClick={() => setShowAdd(!showAdd)} 
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Yeni İşletme Ekle
            </button>
            <button 
              onClick={onLogout} 
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all"
            >
              Çıkış
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
          <button
            onClick={() => setActiveView('restaurants')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeView === 'restaurants'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>İşletmeler ({restaurants.length})</span>
          </button>

          <button
            onClick={() => setActiveView('support')}
            className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative ${
              activeView === 'support'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Canlı Destek & Sohbet</span>
            {totalUnreadSupportCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                {totalUnreadSupportCount}
              </span>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: RESTAURANTS LIST */}
        {/* ========================================================================= */}
        {activeView === 'restaurants' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="İşletme adı, kullanıcı adı veya link slug ile ara..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>

            {/* Add New Restaurant Form Modal */}
            {showAdd && (
              <form onSubmit={handleAdd} className="bg-white p-6 rounded-3xl shadow-md border border-blue-200 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
                <div className="sm:col-span-2 lg:col-span-3 border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Yeni Müşteri / İşletme Hesabı Aç</span>
                  </h3>
                  <button type="button" onClick={() => setShowAdd(false)} className="text-xs text-slate-400 hover:text-slate-600">Kapat</button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">İşletme Adı *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Örn: Cafe Silvana" className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">URL Slug (Kalıcı Link) *</label>
                  <input required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="örn: cafe-silvana" className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Giriş Kullanıcı Adı *</label>
                  <input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="örn: silvana_admin" className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Giriş Şifresi *</label>
                  <input required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="örn: 123456" className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Masa Sınırı</label>
                  <input
                    type="number" required min={1} max={999}
                    value={form.max_tables}
                    onChange={e => setForm({ ...form, max_tables: parseInt(e.target.value) || 1 })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Abonelik Türü</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'unlimited' | 'timed' })} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-medium outline-none bg-white">
                    <option value="unlimited">Sınırsız (Ömür Boyu)</option>
                    <option value="timed">Süreli (Günlük/Aylık)</option>
                  </select>
                </div>
                {form.type === 'timed' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Abonelik Süresi (Gün)</label>
                    <input type="number" required min={1} value={form.days} onChange={e => setForm({ ...form, days: parseInt(e.target.value) || 30 })} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-medium outline-none" />
                  </div>
                )}
                <div className="sm:col-span-2 lg:col-span-3 pt-2">
                  <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all">
                    İşletmeyi Buluta Kaydet
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="space-y-4">
              {filteredRestaurants.map(rest => (
                <div key={rest.id} className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md transition-all flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${rest.is_active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900">{rest.name || 'İsimsiz İşletme'}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rest.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                            {rest.is_active ? 'Aktif' : 'Askıda'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                          <span className="font-mono text-slate-700">/{rest.slug}</span>
                          <span className="flex items-center gap-1 font-semibold text-slate-700"><Key className="w-3 h-3 text-slate-400" /> {rest.owner_username}</span>
                          <span className="flex items-center gap-1 text-slate-600"><Calendar className="w-3 h-3 text-slate-400" />
                            {rest.subscription_type === 'unlimited' ? 'Sınırsız Lisans' : `Bitiş: ${new Date(rest.subscription_expires_at!).toLocaleDateString('tr-TR')}`}
                          </span>
                          <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                            Maks: {rest.max_tables || 25} Masa
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => {
                          setActiveView('support');
                          handleSelectChat(rest.id);
                        }}
                        title="İşletmeyle Canlı Sohbet Aç"
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Headphones className="w-4 h-4" />
                      </button>
                      <a
                        href={`/?r=${rest.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Müşteri QR Menüsünü Aç"
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => copyResetLink(rest.id, rest.slug)}
                        title="Şifre Sıfırlama Linki Kopyala (15 dakika geçerli)"
                        className={`p-2 rounded-xl transition-all ${copiedId === rest.id ? 'text-emerald-600 bg-emerald-50' : 'text-indigo-600 hover:bg-indigo-50'}`}
                      >
                        {copiedId === rest.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(rest)}
                        title={rest.is_active ? 'Hesabı Askıya Al' : 'Hesabı Aktif Et'}
                        className={`p-2 rounded-xl transition-all ${rest.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setEditForm({ max_tables: rest.max_tables || 25, type: rest.subscription_type, days: 0 });
                          setShowEdit(showEdit === rest.id ? null : rest.id);
                        }} 
                        title="Masa Sınırı ve Abonelik Düzenle"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(rest.id, rest.name)} 
                        title="İşletmeyi Tamamen Sil"
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Edit Form Dropdown */}
                  {showEdit === rest.id && (
                    <form onSubmit={(e) => handleEditSubmit(e, rest)} className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fade-in">
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Masa Sınırı</label>
                        <input
                          type="number" min={1} max={999}
                          value={editForm.max_tables}
                          onChange={e => setEditForm({ ...editForm, max_tables: parseInt(e.target.value) || 1 })}
                          className="w-full border border-slate-200 p-2 rounded-xl text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Abonelik Türü</label>
                        <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value as 'unlimited' | 'timed' })} className="w-full border border-slate-200 p-2 rounded-xl text-xs font-semibold bg-white outline-none">
                          <option value="unlimited">Sınırsız (Ömür Boyu)</option>
                          <option value="timed">Süreli (Süre Ekle)</option>
                        </select>
                      </div>
                      {editForm.type === 'timed' ? (
                        <div>
                          <label className="text-xs font-bold text-slate-700 mb-1 block">Süre Ekle (Gün)</label>
                          <input type="number" min={0} value={editForm.days} onChange={e => setEditForm({ ...editForm, days: parseInt(e.target.value) || 0 })} className="w-full border border-slate-200 p-2 rounded-xl text-xs font-semibold bg-white outline-none" placeholder="+30 gün" />
                        </div>
                      ) : <div />}
                      <div className="flex items-end gap-2">
                        <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all">
                          Kaydet
                        </button>
                        <button type="button" onClick={() => setShowEdit(null)} className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all">
                          İptal
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}

              {filteredRestaurants.length === 0 && !isLoading && (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">Kayıtlı İşletme Bulunamadı</p>
                  <p className="text-xs text-slate-400 mt-0.5">Yukarıdaki "Yeni İşletme Ekle" butonuna basarak ilk müşterinizi ekleyebilirsiniz.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: LIVE SUPPORT CHAT HUB */}
        {/* ========================================================================= */}
        {activeView === 'support' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-180px)] animate-fade-in">
            {/* Left Column: Businesses List */}
            <div className="border-r border-slate-800 flex flex-col bg-slate-950/40">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-blue-400" />
                  <span>Destek Talepleri</span>
                </h3>
                <button onClick={fetchSupportMessages} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-blue-950/30 px-3 py-2 border-b border-blue-900/20 text-[10px] text-blue-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Mesajlar 5 gün sonra otomatik temizlenir.</span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                {restaurants.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">Henüz kayıtlı işletme yok.</div>
                ) : (
                  restaurants.map(r => {
                    const rMsgs = supportMessages.filter(m => m.restaurant_id === r.id);
                    const lastMsg = rMsgs[rMsgs.length - 1];
                    const unreadCount = rMsgs.filter(m => m.sender_type === 'business' && !m.is_read).length;
                    const isSelected = selectedChatRestId === r.id;

                    return (
                      <button
                        key={r.id}
                        onClick={() => handleSelectChat(r.id)}
                        className={`w-full text-left p-3.5 transition-all flex items-center justify-between gap-3 ${
                          isSelected ? 'bg-blue-600/20 border-l-4 border-blue-500' : 'hover:bg-slate-800/50'
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
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {lastMsg ? `${lastMsg.sender_type === 'superadmin' ? 'Siz: ' : ''}${lastMsg.message}` : 'Henüz mesaj yok'}
                          </p>
                        </div>

                        {unreadCount > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Chat Feed & Reply */}
            <div className="md:col-span-2 flex flex-col bg-slate-900 h-full">
              {selectedChatRestId && currentChatRestaurant ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {currentChatRestaurant.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{currentChatRestaurant.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">@{currentChatRestaurant.owner_username}</span>
                      </div>
                    </div>

                    <a
                      href={`/?r=${currentChatRestaurant.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>Menüyü Aç</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/60">
                    {activeChatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                        <Headphones className="w-10 h-10 text-slate-700 mb-2" />
                        <p className="text-xs text-slate-400">Bu işletmeyle henüz bir mesajlaşma bulunmuyor.</p>
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
                              {isSuperAdmin ? 'Siz (Süper Admin)' : `${msg.sender_name} (${msg.restaurant_name})`}
                            </span>
                            <div
                              className={`max-w-[85%] sm:max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                                isSuperAdmin
                                  ? 'bg-blue-600 text-white rounded-tr-xs'
                                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-xs'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                              <span className="block text-right text-[9px] text-slate-400 mt-1">
                                {timeStr}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Reply Input */}
                  <form onSubmit={handleSendReply} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`${currentChatRestaurant.name} işletmesine cevap yazın...`}
                      className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isSendingChat}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0"
                    >
                      <span>Gönder</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
                    <Headphones className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Bir İşletme Seçin</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Sol taraftaki listeden destek mesajı gönderen veya sohbet etmek istediğiniz işletmeyi seçin.
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
