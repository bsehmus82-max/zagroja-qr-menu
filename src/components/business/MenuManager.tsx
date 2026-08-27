import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Snowflake, Check, X, 
  Layers, UtensilsCrossed, AlertCircle, RefreshCw
} from 'lucide-react';
import { Business, Category, Product } from '../../types';
import { supabase } from '../../lib/supabase';

interface MenuManagerProps {
  business: Business;
}

export const MenuManager: React.FC<MenuManagerProps> = ({ business }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals / Editors
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');

  const [showAddProd, setShowAddProd] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [editingProd, setEditingProd] = useState<Product | null>(null);

  const loadData = async () => {
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
    loadData();
  }, [business.id]);

  // Toggle "Tükendi / Dondur"
  const toggleFreezeProduct = async (product: Product) => {
    const nextState = !product.is_frozen;
    const { error } = await supabase
      .from('products')
      .update({ is_frozen: nextState, updated_at: new Date().toISOString() })
      .eq('id', product.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_frozen: nextState } : p))
      );
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat = {
      business_id: business.id,
      name: newCatName.trim(),
      image_url: newCatImage.trim() || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80',
      order_index: categories.length,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('categories')
      .insert([newCat])
      .select()
      .single();

    if (!error && data) {
      setCategories((prev) => [...prev, data as Category]);
      setSelectedCatId(data.id);
      setNewCatName('');
      setNewCatImage('');
      setShowAddCat(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat: Category) => {
    if (!window.confirm(`"${cat.name}" kategorisini ve içerisindeki tüm ürünleri silmek istediğinize emin misiniz?`)) {
      return;
    }

    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setProducts((prev) => prev.filter((p) => p.category_id !== cat.id));
      if (selectedCatId === cat.id) {
        setSelectedCatId(categories.find((c) => c.id !== cat.id)?.id || null);
      }
    }
  };

  // Save / Update Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || prodPrice === '' || !selectedCatId) return;

    if (editingProd) {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: prodName.trim(),
          description: prodDesc.trim(),
          price: Number(prodPrice),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingProd.id)
        .select()
        .single();

      if (!error && data) {
        setProducts((prev) => prev.map((p) => (p.id === data.id ? (data as Product) : p)));
        closeProdModal();
      }
    } else {
      const newProd = {
        business_id: business.id,
        category_id: selectedCatId,
        name: prodName.trim(),
        description: prodDesc.trim(),
        price: Number(prodPrice),
        is_frozen: false,
        is_active: true,
        order_index: products.filter((p) => p.category_id === selectedCatId).length,
      };

      const { data, error } = await supabase
        .from('products')
        .insert([newProd])
        .select()
        .single();

      if (!error && data) {
        setProducts((prev) => [...prev, data as Product]);
        closeProdModal();
      }
    }
  };

  const deleteProduct = async (prod: Product) => {
    if (!window.confirm(`"${prod.name}" ürününü silmek istediğinize emin misiniz?`)) return;

    const { error } = await supabase.from('products').delete().eq('id', prod.id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== prod.id));
    }
  };

  const openEditProd = (p: Product) => {
    setEditingProd(p);
    setProdName(p.name);
    setProdDesc(p.description);
    setProdPrice(p.price);
    setShowAddProd(true);
  };

  const closeProdModal = () => {
    setEditingProd(null);
    setProdName('');
    setProdDesc('');
    setProdPrice('');
    setShowAddProd(false);
  };

  const currentProducts = products.filter((p) => p.category_id === selectedCatId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
        <div>
          <h2 className="text-xl font-black text-white">Menü & Ürün Yönetimi</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Kategorileri düzenleyin, ürün ekleyin ve tükenen lezzetleri tek tıkla dondurun.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddCat(true)}
            className="px-4 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition border border-neutral-700 flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-brand-400" />
            Yeni Kategori Ekle
          </button>
          <button
            disabled={!selectedCatId}
            onClick={() => {
              setEditingProd(null);
              setProdName('');
              setProdDesc('');
              setProdPrice('');
              setShowAddProd(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Ürün Ekle
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Categories Sidebar */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Kategoriler ({categories.length})
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              const count = products.filter((p) => p.category_id === cat.id).length;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between group ${
                    isSelected
                      ? 'bg-brand-600/15 border-brand-500 text-white'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={cat.image_url}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10"
                    />
                    <div className="truncate">
                      <h4 className="font-bold text-xs truncate text-white">{cat.name}</h4>
                      <span className="text-[10px] text-neutral-400">{count} Ürün</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition"
                    title="Kategoriyi Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Products Grid */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
              <div>
                <h3 className="font-bold text-sm text-white">
                  {categories.find((c) => c.id === selectedCatId)?.name || 'Kategori Seçiniz'}
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Bu kategoride {currentProducts.length} adet lezzet listeleniyor.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center flex flex-col items-center gap-2 text-neutral-500">
                <RefreshCw className="w-5 h-5 animate-spin text-brand-500" />
                <span className="text-xs">Menü yükleniyor...</span>
              </div>
            ) : currentProducts.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 text-xs">
                Bu kategoride henüz ürün bulunmuyor. Sağ üstteki "Ürün Ekle" butonuna basarak ekleyebilirsiniz.
              </div>
            ) : (
              <div className="space-y-3">
                {currentProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                      prod.is_frozen
                        ? 'bg-neutral-950/40 border-neutral-800/60 opacity-60'
                        : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-white">{prod.name}</h4>
                        {prod.is_frozen && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Tükendi (Donduruldu)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed mt-1">
                        {prod.description || 'İçerik açıklaması belirtilmemiş.'}
                      </p>
                      <div className="text-xs font-black text-brand-400 mt-1.5">
                        {prod.price.toFixed(2)} ₺
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Freeze Button */}
                      <button
                        onClick={() => toggleFreezeProduct(prod)}
                        title={prod.is_frozen ? 'Satışa Aç' : 'Tükendi Olarak Dondur'}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          prod.is_frozen
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                        }`}
                      >
                        <Snowflake className="w-3.5 h-3.5" />
                        <span>{prod.is_frozen ? 'Donduruldu' : 'Dondur'}</span>
                      </button>

                      <button
                        onClick={() => openEditProd(prod)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteProduct(prod)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition"
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
      </div>

      {/* Add Category Modal */}
      {showAddCat && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-sm text-white">Yeni Kategori Ekle</h3>
              <button onClick={() => setShowAddCat(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Kategori Adı
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Örn: Burger Çeşitleri"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Kapak Görseli URL (İsteğe Bağlı)
                </label>
                <input
                  type="url"
                  value={newCatImage}
                  onChange={(e) => setNewCatImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCat(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-xs font-bold text-neutral-300"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showAddProd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-sm text-white">
                {editingProd ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
              <button onClick={closeProdModal} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Ürün / Lezzet Adı
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Örn: Trüflü Dana Burger"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  İçerik / Malzeme Açıklaması
                </label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Örn: 180 gr dana köfte, trüf mayonez, karamelize soğan, cheddar peyniri, çıtır patates ile"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Fiyat (₺)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="280.00"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeProdModal}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-xs font-bold text-neutral-300"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30"
                >
                  {editingProd ? 'Güncelle' : 'Ürünü Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
