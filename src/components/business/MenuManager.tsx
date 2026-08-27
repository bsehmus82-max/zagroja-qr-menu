import React, { useState, useEffect } from 'react';
import { 
  Plus, Snowflake, Flame, Trash2, Edit2, 
  Sparkles, RefreshCw, X, Check, Image as ImageIcon
} from 'lucide-react';
import { Business, Category, Product } from '../../types';
import { supabase } from '../../lib/supabase';
import { DEFAULT_CATEGORIES } from '../../data/defaultCatalog';

interface MenuManagerProps {
  business: Business;
}

export const MenuManager: React.FC<MenuManagerProps> = ({ business }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number | ''>('');

  const loadMenuData = async () => {
    setLoading(true);
    try {
      const [catsRes, prodsRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('business_id', business.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('products')
          .select('*')
          .eq('business_id', business.id)
          .order('order_index', { ascending: true }),
      ]);

      if (catsRes.data) {
        setCategories(catsRes.data as Category[]);
        if (catsRes.data.length > 0 && !selectedCatId) {
          setSelectedCatId(catsRes.data[0].id);
        }
      }
      if (prodsRes.data) {
        setProducts(prodsRes.data as Product[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, [business.id]);

  const toggleFreezeProduct = async (product: Product) => {
    const nextFreeze = !product.is_frozen;
    const { error } = await supabase
      .from('products')
      .update({ is_frozen: nextFreeze })
      .eq('id', product.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_frozen: nextFreeze } : p))
      );
    }
  };

  const deleteProduct = async (prodId: string) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('products').delete().eq('id', prodId);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== prodId));
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const payload = {
      business_id: business.id,
      name: newCatName.trim(),
      image_url: newCatImage.trim() || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
      order_index: categories.length,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('categories')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      setCategories((prev) => [...prev, data as Category]);
      setSelectedCatId(data.id);
      setNewCatName('');
      setNewCatImage('');
      setShowAddCatModal(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId || !newProdName.trim() || newProdPrice === '') return;

    const payload = {
      business_id: business.id,
      category_id: selectedCatId,
      name: newProdName.trim(),
      description: newProdDesc.trim(),
      price: Number(newProdPrice),
      is_frozen: false,
      is_active: true,
      order_index: products.filter((p) => p.category_id === selectedCatId).length,
    };

    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      setProducts((prev) => [...prev, data as Product]);
      setNewProdName('');
      setNewProdDesc('');
      setNewProdPrice('');
      setShowAddProdModal(false);
    }
  };

  const handleLoadDefaultCatalog = async () => {
    if (!window.confirm('Hazır zengin kategorileri menünüze yüklemek istiyor musunuz?')) return;
    setLoading(true);

    try {
      for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
        const catTemplate = DEFAULT_CATEGORIES[i];
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .insert([
            {
              business_id: business.id,
              name: catTemplate.name,
              image_url: catTemplate.image_url,
              order_index: i,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (!catError && catData) {
          const prodsToInsert = catTemplate.products.map((p, pIdx) => ({
            business_id: business.id,
            category_id: catData.id,
            name: p.name,
            description: p.description,
            price: p.price,
            is_frozen: false,
            is_active: true,
            order_index: pIdx,
          }));

          await supabase.from('products').insert(prodsToInsert);
        }
      }

      await loadMenuData();
    } finally {
      setLoading(false);
    }
  };

  const currentCategoryProducts = products.filter((p) => p.category_id === selectedCatId);

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111622] border border-[#1E2638] p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white">Menü & Ürün Yönetimi</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kategorileri düzenleyebilir, ürün ekleyebilir veya tükenen ürünleri tek tıkla dondurabilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {categories.length === 0 && (
            <button
              onClick={handleLoadDefaultCatalog}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Hazır Menüyü Yükle
            </button>
          )}

          <button
            onClick={() => setShowAddCatModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#182030] hover:bg-[#222E45] text-slate-200 text-xs font-semibold border border-[#25324A] transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            Yeni Kategori
          </button>

          <button
            disabled={!selectedCatId}
            onClick={() => setShowAddProdModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            Ürün Ekle
          </button>
        </div>
      </div>

      {/* Main Layout: Left Categories, Right Products */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Categories Column */}
        <div className="md:col-span-1 bg-[#111622] border border-[#1E2638] rounded-2xl p-3.5 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Kategoriler ({categories.length})
          </span>

          <div className="space-y-1 mt-2">
            {categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              const prodCount = products.filter((p) => p.category_id === cat.id).length;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'hover:bg-[#182030] text-slate-300'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#182030] text-slate-400'
                    }`}
                  >
                    {prodCount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Products Column */}
        <div className="md:col-span-3 space-y-3">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
              <span>Yükleniyor...</span>
            </div>
          ) : currentCategoryProducts.length === 0 ? (
            <div className="py-20 text-center bg-[#111622]/40 border border-dashed border-[#1E2638] rounded-2xl p-8 space-y-2">
              <h3 className="font-semibold text-slate-200 text-sm">Bu Kategoride Ürün Yok</h3>
              <p className="text-xs text-slate-400">
                Sağ üstteki "Ürün Ekle" butonu ile ilk ürünü tanımlayabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentCategoryProducts.map((prod) => (
                <div
                  key={prod.id}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                    prod.is_frozen
                      ? 'bg-[#0B0E14] border-amber-500/20 opacity-75'
                      : 'bg-[#111622] border-[#1E2638] hover:border-[#2A3754]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="font-bold text-xs text-white">{prod.name}</h4>
                      {prod.is_frozen ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 shrink-0">
                          <Snowflake className="w-3 h-3" />
                          Tükendi
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                          <Flame className="w-3 h-3" />
                          Satışta
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {prod.description || 'Açıklama girilmedi.'}
                    </p>

                    <div className="text-sm font-bold text-indigo-400 mt-2">
                      {prod.price.toFixed(2)} ₺
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#1E2638] flex items-center justify-between mt-3">
                    <button
                      onClick={() => toggleFreezeProduct(prod)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        prod.is_frozen
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      <Snowflake className="w-3 h-3" />
                      {prod.is_frozen ? 'Satışa Aç' : 'Dondur (Tükendi)'}
                    </button>

                    <button
                      onClick={() => deleteProduct(prod.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-[#182030] transition"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-[#1E2638] rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638] mb-4">
              <h3 className="font-bold text-xs text-white">Yeni Kategori Ekle</h3>
              <button onClick={() => setShowAddCatModal(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Kategori Adı
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Kategori adını giriniz"
                  className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Görsel URL
                </label>
                <input
                  type="url"
                  value={newCatImage}
                  onChange={(e) => setNewCatImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#182030] text-slate-300 text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProdModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-[#1E2638] rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638] mb-4">
              <h3 className="font-bold text-xs text-white">Yeni Ürün Ekle</h3>
              <button onClick={() => setShowAddProdModal(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Ürün Adı
                </label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ürün adını giriniz"
                  className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Açıklama / Malzemeler
                </label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="İçindekiler ve servis bilgisi..."
                  className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Fiyat (₺)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProdModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#182030] text-slate-300 text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20"
                >
                  Ürünü Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
