import React, { useState, useEffect } from 'react';
import { SUPER_ADMIN_PASSWORD, SUPER_ADMIN_SESSION_KEY, store } from '../../lib/store';
import { supabase } from '../../lib/supabase';
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
  Layers,
  Sparkles
} from 'lucide-react';
import { Restaurant } from '../../types';

const generateResetLink = (slug: string): string => {
  const expires = Date.now() + 24 * 60 * 60 * 1000;
  const token = btoa(`${slug}:${expires}`);
  return `${window.location.origin}/?r=${slug}&reset=${token}`;
};

export const SuperAdmin = ({ onLogout }: { onLogout: () => void }) => {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem(SUPER_ADMIN_SESSION_KEY))
  );
  const [restaurants, setRestaurants] = useState<Restaurant[]>(store.getAllRestaurants());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchRestaurants();
      
      const sub = supabase.channel('super_admin_restaurants')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => {
          fetchRestaurants();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(sub);
      };
    }
  }, [isAuthenticated]);

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
      showToast('İşletme hesabı başarıyla oluşturuldu.');
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
      showToast('Şifre sıfırlama linki kopyalandı! (24 saat geçerli)');
      setTimeout(() => setCopiedId(null), 3000);
    } catch {
      showToast('Kopyalanamadı. Manuel seçin: ' + url, 'error');
    }
  };

  const filteredRestaurants = restaurants.filter(r => 
    (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.owner_username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-blue-600" />
              <span>Süper Admin Yönetim Merkezi</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Platformdaki tüm kayıtlı işletmeler, masalar ve abonelikler ({restaurants.length} İşletme Kayıtlı)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchRestaurants} 
              disabled={isLoading}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setShowAdd(!showAdd)} 
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Yeni İşletme Ekle
            </button>
            <button 
              onClick={onLogout} 
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all"
            >
              Çıkış
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
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

        {/* Add New Restaurant Modal / Box */}
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
                İşletmeyi Sisteme Kaydet
              </button>
            </div>
          </form>
        )}

        {/* Restaurants List */}
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
                    title="Şifre Sıfırlama Linki Kopyala (24 saat geçerli)"
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
    </div>
  );
};
