import React, { useState, useEffect } from 'react';
import { 
  Plus, Snowflake, Trash2, Edit2, 
  RefreshCw, X, Check, UtensilsCrossed
} from 'lucide-react';
import { Business, Category, Product } from '../../types';
import { supabase } from '../../lib/supabase';
import { DEFAULT_CATEGORIES } from '../../data/defaultCatalog';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';

interface MenuManagerProps {
  business: Business;
}

export const MenuManager: React.FC<MenuManagerProps> = ({ business }) => {
  const toast = useToast();
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          business_id: business.id,
          name: newCatName.trim(),
          image_url: newCatImage.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
          order_index: categories.length,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setCategories((prev) => [...prev, data as Category]);
      setSelectedCatId(data.id);
      setNewCatName('');
      setNewCatImage('');
      setShowAddCatModal(false);
      toast.success(`${data.name} kategorisi eklendi.`);
    } else {
      toast.error('Kategori eklenirken bir hata oluştu.');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice || !selectedCatId) return;

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          business_id: business.id,
          category_id: selectedCatId,
          name: newProdName.trim(),
          description: newProdDesc.trim(),
          price: Number(newProdPrice),
          is_frozen: false,
          is_active: true,
          order_index: products.filter((p) => p.category_id === selectedCatId).length,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setProducts((prev) => [...prev, data as Product]);
      setNewProdName('');
      setNewProdDesc('');
      setNewProdPrice('');
      setShowAddProdModal(false);
      toast.success(`${data.name} ürünü eklendi.`);
    } else {
      toast.error('Ürün eklenirken bir hata oluştu.');
    }
  };

  const toggleFreezeProduct = async (prod: Product) => {
    const nextState = !prod.is_frozen;
    const { error } = await supabase
      .from('products')
      .update({ is_frozen: nextState })
      .eq('id', prod.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, is_frozen: nextState } : p))
      );
      toast.info(nextState ? `${prod.name} donduruldu (tükendi).` : `${prod.name} tekrar satışa açıldı.`);
    }
  };

  const handleDeleteProduct = (prod: Product) => {
    setConfirmConfig({
      isOpen: true,
      title: `${prod.name} Silinsin mi?`,
      message: 'Bu ürünü menüden silmek istediğinize emin misiniz?',
      type: 'danger',
      action: async () => {
        const { error } = await supabase.from('products').delete().eq('id', prod.id);
        if (!error) {
          setProducts((prev) => prev.filter((p) => p.id !== prod.id));
          toast.success(`${prod.name} silindi.`);
        }
      },
    });
  };

  const handleDeleteCategory = (cat: Category) => {
    setConfirmConfig({
      isOpen: true,
      title: `${cat.name} Kategorisi Silinsin mi?`,
      message: 'Bu kategoriyi ve içindeki tüm ürünleri silmek istediğinize emin misiniz?',
      type: 'danger',
      action: async () => {
        await supabase.from('products').delete().eq('category_id', cat.id);
        await supabase.from('categories').delete().eq('id', cat.id);
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        setProducts((prev) => prev.filter((p) => p.category_id !== cat.id));
        setSelectedCatId(categories.find((c) => c.id !== cat.id)?.id || null);
        toast.success(`${cat.name} kategorisi silindi.`);
      },
    });
  };

  const handleLoadSampleCatalog = () => {
    setConfirmConfig({
      isOpen: true,
      title: '16 Kategori Menü Kataloğu Yüklensin mi?',
      message: 'Menünüze 16 standart gurme kategori ve zengin ürün içerikleri eklenecektir.',
      type: 'info',
      action: async () => {
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
                  order_index: categories.length + i,
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
          toast.success('Örnek menü kataloğu başarıyla yüklendi!');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const currentProducts = products.filter((p) => p.category_id === selectedCatId);
  const selectedCategory = categories.find((c) => c.id === selectedCatId);

  return (
    <div className="space-y-4">
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

      {/* Top Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Category Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => {
            const isSelected = selectedCatId === cat.id;
            const count = products.filter((p) => p.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          {categories.length === 0 && (
            <button
              onClick={handleLoadSampleCatalog}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition flex items-center gap-1.5"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Örnek Menü Kataloğunu Yükle</span>
            </button>
          )}
        </div>

        {/* Buttons on Right */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedCategory && (
            <button
              onClick={() => handleDeleteCategory(selectedCategory)}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl border border-rose-200 text-xs font-bold transition"
              title="Seçili Kategoriyi Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setShowAddCatModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Kategori</span>
          </button>

          <button
            onClick={() => setShowAddProdModal(true)}
            disabled={!selectedCatId}
            className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ürün</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-xs font-bold">
          Menü yükleniyor...
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-14 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-800">Menünüzde Henüz Kategori Yok</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hemen yeni kategori ekleyebilir veya tek tıkla 10 hazır gurme kategorisini yükleyebilirsiniz.
          </p>
          <button
            onClick={handleLoadSampleCatalog}
            className="mt-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition"
          >
            Örnek Menü Kataloğunu Dahil Et
          </button>
        </div>
      ) : currentProducts.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs space-y-2">
          <h3 className="font-extrabold text-sm text-slate-800">
            {selectedCategory?.name} Kategorisinde Ürün Bulunmuyor
          </h3>
          <p className="text-xs text-slate-400">Bu kategoriye ilk ürününüzü ekleyin.</p>
          <button
            onClick={() => setShowAddProdModal(true)}
            className="px-4 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            + Ürün Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {currentProducts.map((prod) => (
            <div
              key={prod.id}
              className={`bg-white border rounded-2xl p-4 shadow-xs hover:shadow-sm transition flex flex-col justify-between space-y-3 ${
                prod.is_frozen ? 'border-sky-300 bg-sky-50/20' : 'border-slate-200/90'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">{prod.name}</h4>
                    <span className="font-black text-xs text-orange-600 mt-0.5 block">
                      {prod.price.toFixed(2)} ₺
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteProduct(prod)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition"
                    title="Ürünü Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {prod.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => toggleFreezeProduct(prod)}
                  className={`w-full py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    prod.is_frozen
                      ? 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Snowflake className="w-3.5 h-3.5 text-sky-500" />
                  <span>{prod.is_frozen ? 'Donduruldu (Tükendi)' : 'Satışta (Aktif)'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Yeni Kategori Ekle</h3>
              <button onClick={() => setShowAddCatModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Adı</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Örn: Sıcak Kahveler, Tatlılar"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Görsel URL (Opsiyonel)</label>
                <input
                  type="url"
                  value={newCatImage}
                  onChange={(e) => setNewCatImage(e.target.value)}
                  placeholder="https://... /category.jpg"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20"
                >
                  Kategoriyi Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProdModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                {selectedCategory?.name} Kategorisine Ürün Ekle
              </h3>
              <button onClick={() => setShowAddProdModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ürün Adı</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Örn: Double Espresso, San Sebastian"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fiyat (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Örn: 120.00"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ürün Açıklaması (Opsiyonel)</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="İçerik ve porsiyon detayları..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProdModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20"
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
