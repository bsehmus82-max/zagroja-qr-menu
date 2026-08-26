import React, { useState } from 'react';
import { SUPER_ADMIN_PASSWORD, SUPER_ADMIN_SESSION_KEY, store } from '../../lib/store';
import { Shield, Plus, Building2, Key, Calendar, Trash2, Edit, Link as LinkIcon } from 'lucide-react';
import { Restaurant } from '../../types';

export const SuperAdmin = ({ onLogout }: { onLogout: () => void }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem(SUPER_ADMIN_SESSION_KEY))
  );

  const [restaurants, setRestaurants] = useState(store.getAllRestaurants());
  
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: '', slug: '', username: '', password: '', 
    type: 'unlimited' as 'unlimited' | 'timed', days: 30, max_tables: 25
  });
  const [editForm, setEditForm] = useState({
    max_tables: 25, type: 'unlimited' as 'unlimited' | 'timed', days: 0
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SUPER_ADMIN_PASSWORD) {
      localStorage.setItem(SUPER_ADMIN_SESSION_KEY, 'true');
      setIsAuthenticated(true);
    } else {
      alert('Hatalı Şifre');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await store.createRestaurant({
      name: form.name,
      slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      owner_username: form.username,
      owner_password: form.password,
      subscription_type: form.type,
      subscription_days: form.days,
      max_tables: form.max_tables
    });
    setRestaurants(store.getAllRestaurants());
    setShowAdd(false);
    setForm({ name: '', slug: '', username: '', password: '', type: 'unlimited', days: 30, max_tables: 25 });
  };

  const handleEditSubmit = async (e: React.FormEvent, rest: Restaurant) => {
    e.preventDefault();
    let newExpiresAt = rest.subscription_expires_at;
    if (editForm.type === 'timed' && editForm.days > 0) {
      const baseDate = rest.subscription_expires_at && new Date(rest.subscription_expires_at).getTime() > Date.now() 
        ? new Date(rest.subscription_expires_at) 
        : new Date();
      newExpiresAt = new Date(baseDate.getTime() + editForm.days * 24 * 60 * 60 * 1000).toISOString();
    }
    
    await store.updateRestaurant(rest.id, {
      max_tables: editForm.max_tables,
      subscription_type: editForm.type,
      ...(editForm.type === 'timed' && editForm.days > 0 ? { subscription_expires_at: newExpiresAt } : {})
    });
    setRestaurants(store.getAllRestaurants());
    setShowEdit(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu işletmeyi kalıcı olarak silmek istediğinize emin misiniz?')) {
      await store.deleteRestaurant(id);
      setRestaurants(store.getAllRestaurants());
    }
  };

  const copyResetLink = (slug: string) => {
    const url = `${window.location.origin}/?r=${slug}&reset=true`;
    navigator.clipboard.writeText(url);
    alert('Şifre sıfırlama bağlantısı kopyalandı! İşletmeye gönderebilirsiniz:\n' + url);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl">
          <div className="flex justify-center mb-6">
            <Shield className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-white text-center mb-6">Platform Yönetimi</h1>
          <input
            type="password"
            placeholder="Super Admin Şifresi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
            Giriş Yap
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              Dijital Menü Yönetimi
            </h1>
            <p className="text-slate-500">Müşteri İşletme Yönetimi</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4" /> Yeni İşletme
            </button>
            <button onClick={onLogout} className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-semibold">
              Çıkış
            </button>
          </div>
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-semibold mb-1 block">İşletme Adı</label><input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full border p-2 rounded" /></div>
            <div><label className="text-sm font-semibold mb-1 block">URL Slug (örn: cafe-aria)</label><input required value={form.slug} onChange={e=>setForm({...form, slug: e.target.value})} className="w-full border p-2 rounded" /></div>
            <div><label className="text-sm font-semibold mb-1 block">Kullanıcı Adı (Giriş)</label><input required value={form.username} onChange={e=>setForm({...form, username: e.target.value})} className="w-full border p-2 rounded" /></div>
            <div><label className="text-sm font-semibold mb-1 block">Şifre</label><input required value={form.password} onChange={e=>setForm({...form, password: e.target.value})} className="w-full border p-2 rounded" /></div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Masa Sınırı</label>
              <select value={form.max_tables} onChange={e=>setForm({...form, max_tables: parseInt(e.target.value)})} className="w-full border p-2 rounded">
                <option value={15}>15 Masa</option>
                <option value={30}>30 Masa</option>
                <option value={50}>50 Masa</option>
                <option value={100}>100 Masa (Büyük Tesis)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Abonelik Türü</label>
              <select value={form.type} onChange={e=>setForm({...form, type: e.target.value as 'unlimited'|'timed'})} className="w-full border p-2 rounded">
                <option value="unlimited">Sınırsız (Ömür Boyu)</option>
                <option value="timed">Süreli</option>
              </select>
            </div>
            {form.type === 'timed' && (
              <div><label className="text-sm font-semibold mb-1 block">Süre (Gün)</label><input type="number" required value={form.days} onChange={e=>setForm({...form, days: parseInt(e.target.value)})} className="w-full border p-2 rounded" /></div>
            )}
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full py-3 bg-green-600 text-white font-bold rounded-xl">Oluştur</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 gap-4">
          {restaurants.map(rest => (
            <div key={rest.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{rest.name || 'İsimsiz'}</h3>
                    <div className="flex gap-4 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Key className="w-3 h-3" /> {rest.owner_username}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {rest.subscription_type === 'unlimited' ? 'Sınırsız' : new Date(rest.subscription_expires_at!).toLocaleDateString()}</span>
                      <span>Masa Sınırı: {rest.max_tables || 25}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyResetLink(rest.slug)} title="Şifre Sıfırlama Linki Kopyala" className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg">
                    <LinkIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => {
                    setEditForm({ max_tables: rest.max_tables || 25, type: rest.subscription_type, days: 0 });
                    setShowEdit(showEdit === rest.id ? null : rest.id);
                  }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(rest.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {showEdit === rest.id && (
                <form onSubmit={(e) => handleEditSubmit(e, rest)} className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Masa Sınırı</label>
                    <select value={editForm.max_tables} onChange={e=>setEditForm({...editForm, max_tables: parseInt(e.target.value)})} className="w-full border p-2 rounded text-sm">
                      <option value={15}>15 Masa</option>
                      <option value={30}>30 Masa</option>
                      <option value={50}>50 Masa</option>
                      <option value={100}>100 Masa</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Abonelik Türü</label>
                    <select value={editForm.type} onChange={e=>setEditForm({...editForm, type: e.target.value as 'unlimited'|'timed'})} className="w-full border p-2 rounded text-sm">
                      <option value="unlimited">Sınırsız (Ömür Boyu)</option>
                      <option value="timed">Süreli (Süre Ekle)</option>
                    </select>
                  </div>
                  {editForm.type === 'timed' ? (
                    <div>
                      <label className="text-xs font-semibold mb-1 block">Süre Ekle (Gün)</label>
                      <input type="number" min="0" value={editForm.days} onChange={e=>setEditForm({...editForm, days: parseInt(e.target.value)})} className="w-full border p-2 rounded text-sm" placeholder="+30 gün vs" />
                    </div>
                  ) : <div></div>}
                  <div className="flex items-end">
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg text-sm">Kaydet</button>
                  </div>
                </form>
              )}
            </div>
          ))}
          {restaurants.length === 0 && (
            <div className="text-center py-12 text-slate-500">Henüz hiç işletme hesabı açılmamış.</div>
          )}
        </div>
      </div>
    </div>
  );
};
