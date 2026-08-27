import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Snowflake, Check, Search, 
  Layers, Utensils, Image, RefreshCw, EyeOff, Eye
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
  const [searchTerm, setSearchTerm] = useState('');

  // Category Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState('');

  // Product Modal
  const [showProdModal, setShowProdModal] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');

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

  // Toggle Freeze / Tükendi status for Product
  const toggleFreeze = async (product: Product) => {
    const nextState = !product.is_frozen;
    const { error } = await supabase
      .from('products')
      .update({ is_frozen: nextState })
      .eq('id', product.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_frozen: nextState } : p))
      );
    }
  };

  // Save / Update Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCat) {
      const { error } = await supabase
        .from('categories')
        .update({ name: catName.trim(), image_url: catImage.trim() })
        .eq('id', editingCat.id);

      if (!error) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCat.id ? { ...c, name: catName.trim(), image_url: catImage.trim() } : c
          )
        );
        setShowCatModal(false);
      }
    } else {
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            business_id: business.id,
            name: catName.trim(),
            image_url: catImage.trim() || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
            order_index: categories.length,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        setCategories((prev) => [...prev, data as Category]);
        setSelectedCatId(data.id);
        setShowCatModal(false);
      }
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat: Category) => {
    if (!window.confirm(`"${cat.name}" kategorisini ve içindeki tüm ürünleri silmek istediðinizden emin misiniz?`)) return;

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
    if (!selectedCatId || !prodName.trim()) return;

    const priceNum = parseFloat(prodPrice) || 0;

    if (editingProd) {
      const { error } = await supabase
        .from('products')
        .update({
          name: prodName.trim(),
          description: prodDesc.trim(),
          price: priceNum,
        })
        .eq('id', editingProd.id);

      if (!error) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProd.id
              ? { ...p, name: prodName.trim(), description: prodDesc.trim(), price: priceNum }
              : p
          )
        );
        setShowProdModal(false);
      }
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            business_id: business.id,
            category_id: selectedCatId,
            name: prodName.trim(),
            description: prodDesc.trim(),
            price: priceNum,
            is_frozen: false,
            is_active: true,
            order_index: products.filter((p) => p.category_id === selectedCatId).length,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        setProducts((prev) => [...prev, data as Product]);
        setShowProdModal(false);
      }
    }
  };

  // Delete Product
  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`"${prod.name}" ürününü silmek istediðinize emin misiniz?`)) return;

    const { error } = await supabase.from('products').delete().eq('id', prod.id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== prod.id));
    }
  };

  const currentProducts = products
    .filter((p) => (selectedCatId ? p.category_id === selectedCatId : true))
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Menü ve Ürün Yönetimi</h2>
          <p className="text-xs text-neutral-400">
            Kategorileri düzenleyin, ürün içeriklerini girin ve gün içinde biten ürünleri tek týkla dondurun.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingCat(null);
              setCatName('');
              setCatImage('');
              setShowCatModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition border border-neutral-700"
          >
            <Plus className="w-4 h-4" />
            Yeni Kategori Ekle
          </button>
          <button
            onClick={() => {
              if (!selectedCatId) {
                alert('Lütfen önce bir kategori seçiniz veya oluþturunuz.');
                return;
              }
              setEditingProd(null);
              setProdName('');
              setProdDesc('');
              setProdPrice('');
              setShowProdModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Yeni Ürün Ekle
          </button>
        </div>
      </div>

      {/* Main Grid: Left Categories, Right Products */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 space-y-2">
          <div className="font-bold text-xs text-neutral-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
            <span>Kategoriler ({categories.length})</span>
          </div>

          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`p-3 rounded-2xl cursor-pointer transition flex items-center justify-between group ${
                  selectedCatId === cat.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'bg-neutral-950/40 text-neutral-300 hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-xl bg-neutral-800 overflow-hidden shrink-0 border border-white/10">
                    <img src={cat.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-xs truncate">{cat.name}</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCat(cat);
                      setCatName(cat.name);
                      setCatImage(cat.image_url);
                      setShowCatModal(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-black/30 text-white/80 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/40 text-red-200 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products List Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search bar inside selected category */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Bu kategorideki ürünlerde ara..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-neutral-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
              <span className="text-xs">Menü yükleniyor...</span>
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="py-20 text-center bg-neutral-900/40 border border-dashed border-neutral-800 rounded-3xl p-8">
              <Utensils className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-white">Bu Kategoride Henüz Ürün Yok</h4>
              <p className="text-xs text-neutral-400 mt-1">
                Yukarýdaki <strong>"Yeni Ürün Ekle"</strong> butonuna basarak ürün ekleyebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentProducts.map((prod) => (
                <div
                  key={prod.id}
                  className={`bg-neutral-900 border ${
                    prod.is_frozen ? 'border-amber-500/40 bg-neutral-900/70' : 'border-neutral-800'
                  } rounded-3xl p-5 flex flex-col justify-between transition hover:border-neutral-700`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-bold text-sm text-white">{prod.name}</h4>
                      <span className="text-sm font-black text-brand-400 shrink-0">
                        {prod.price.toFixed(2)} ?
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                      {prod.description || 'Ýçerik açýklamasý belirtilmedi.'}
                    </p>
                  </div>

                  {/* Actions & Freeze button */}
                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                    <button
                      onClick={() => toggleFreeze(prod)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        prod.is_frozen
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                      }`}
                    >
                      <Snowflake className="w-3.5 h-3.5" />
                      {prod.is_frozen ? 'Tükendi (Donduruldu)' : 'Tükendi Olarak Ýþaretle'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingProd(prod);
                          setProdName(prod.name);
                          setProdDesc(prod.description);
                          setProdPrice(prod.price.toString());
                          setShowProdModal(true);
                        }}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= CATEGORY MODAL ================= */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-black text-white mb-4">
              {editingCat ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Kategori Adý
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Örn: Sýcak Ýçecekler"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Kategori Kapak Görseli URL
                </label>
                <input
                  type="url"
                  value={catImage}
                  onChange={(e) => setCatImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-5 py-2.5 bg-neutral-800 text-neutral-300 text-xs font-bold rounded-2xl"
                >
                  Ýptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-2xl shadow-lg shadow-brand-600/30"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PRODUCT MODAL ================= */}
      {showProdModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-base font-black text-white mb-4">
              {editingProd ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Ürün Adý
                  </label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Örn: Klasik Çift Kaþarlý Tost"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Fiyat (?)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="180"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Ýçerik & Malzeme Açýklamasý
                </label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Örn: Trakya kaþar peyniri, tereyaðý, domates dilimleri ve kekik ile..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowProdModal(false)}
                  className="px-5 py-2.5 bg-neutral-800 text-neutral-300 text-xs font-bold rounded-2xl"
                >
                  Ýptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-2xl shadow-lg shadow-brand-600/30"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
