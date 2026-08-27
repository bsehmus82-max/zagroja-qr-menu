import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit3, 
  ChevronLeft, ChevronRight, Check, X,
  Eye, EyeOff, Layers, Sparkles, Smartphone, ArrowRight
} from 'lucide-react';
import { Business, Category, Product } from '../../types';
import { supabase } from '../../lib/supabase';
import { DEFAULT_CATEGORIES } from '../../data/defaultCatalog';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { CustomerMenu } from '../customer/CustomerMenu';

interface MenuManagerProps {
  business: Business;
}

export const MenuManager: React.FC<MenuManagerProps> = ({ business }) => {
  const toast = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Live Phone Preview Toggle
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Modals
  const [showCategoryManagerModal, setShowCategoryManagerModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number | ''>('');

  // Confirm Modal
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
        if (catsRes.data.length > 0 && (!selectedCatId || !catsRes.data.some(c => c.id === selectedCatId))) {
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

  // Scroll Category Navigation Bar horizontally
  const scrollCategories = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Toggle Sold Out (Tükendi / Satışta) Instantly
  const handleToggleSoldOut = async (prod: Product) => {
    const nextState = !prod.is_frozen;

    // Instant local state update
    setProducts((prev) =>
      prev.map((p) => (p.id === prod.id ? { ...p, is_frozen: nextState } : p))
    );

    const { error } = await supabase
      .from('products')
      .update({ is_frozen: nextState })
      .eq('id', prod.id);

    if (error) {
      // Revert if error
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, is_frozen: !nextState } : p))
      );
      toast.error('Durum güncellenirken hata oluştu.');
    } else {
      toast.info(nextState ? `${prod.name} tükendi olarak işaretlendi.` : `${prod.name} tekrar satışa açıldı.`);
    }
  };

  // Open Edit Product Modal
  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setShowEditProductModal(true);
  };

  // Save Edited Product Instantly
  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name.trim()) return;

    const updatedPrice = Number(editingProduct.price) || 0;

    // Instant local update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: editingProduct.name.trim(),
              description: editingProduct.description?.trim() || '',
              price: updatedPrice,
              category_id: editingProduct.category_id,
            }
          : p
      )
    );

    setShowEditProductModal(false);

    const { error } = await supabase
      .from('products')
      .update({
        name: editingProduct.name.trim(),
        description: editingProduct.description?.trim() || '',
        price: updatedPrice,
        category_id: editingProduct.category_id,
      })
      .eq('id', editingProduct.id);

    if (error) {
      toast.error('Ürün kaydedilirken hata oluştu.');
      loadMenuData();
    } else {
      toast.success(`${editingProduct.name} başarıyla güncellendi.`);
    }
  };

  // Add Product to Selected Category
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
      toast.success(`${payload.name} menüye eklendi.`);
    } else {
      toast.error('Ürün eklenirken bir hata oluştu.');
    }
  };

  // Delete Product
  const handleDeleteProduct = (prod: Product) => {
    setConfirmConfig({
      isOpen: true,
      title: `${prod.name} Silinsin mi?`,
      message: 'Bu ürünü menüden tamamen silmek istediğinize emin misiniz?',
      type: 'danger',
      action: async () => {
        setProducts((prev) => prev.filter((p) => p.id !== prod.id));
        await supabase.from('products').delete().eq('id', prod.id);
        toast.success(`${prod.name} silindi.`);
      },
    });
  };

  // Toggle Standard Category in Category Manager Modal
  const handleToggleCategory = async (catTemplate: (typeof DEFAULT_CATEGORIES)[0]) => {
    const existingCat = categories.find(
      (c) => c.name.toLowerCase() === catTemplate.name.toLowerCase()
    );

    if (existingCat) {
      // Toggle active status or delete
      const nextActive = !existingCat.is_active;
      setCategories((prev) =>
        prev.map((c) => (c.id === existingCat.id ? { ...c, is_active: nextActive } : c))
      );

      await supabase
        .from('categories')
        .update({ is_active: nextActive })
        .eq('id', existingCat.id);

      toast.info(
        nextActive
          ? `${existingCat.name} menüde gösteriliyor.`
          : `${existingCat.name} menüden gizlendi.`
      );
    } else {
      // Create new category and its products
      const { data: newCat, error } = await supabase
        .from('categories')
        .insert([
          {
            business_id: business.id,
            name: catTemplate.name,
            image_url: catTemplate.image_url,
            order_index: categories.length,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (!error && newCat) {
        const cat = newCat as Category;
        setCategories((prev) => [...prev, cat]);
        if (!selectedCatId) setSelectedCatId(cat.id);

        const prodsToInsert = catTemplate.products.map((p, pIdx) => ({
          business_id: business.id,
          category_id: cat.id,
          name: p.name,
          description: p.description,
          price: p.price,
          is_frozen: false,
          is_active: true,
          order_index: pIdx,
        }));

        const { data: newProds } = await supabase
          .from('products')
          .insert(prodsToInsert)
          .select();

        if (newProds) {
          setProducts((prev) => [...prev, ...(newProds as Product[])]);
        }

        toast.success(`${cat.name} ve ürünleri menüye eklendi.`);
      }
    }
  };

  const activeCategories = categories.filter((c) => c.is_active);
  const currentProducts = products
    .filter((p) => p.category_id === selectedCatId)
    .sort((a, b) => {
      if (a.is_frozen === b.is_frozen) return (a.order_index || 0) - (b.order_index || 0);
      return a.is_frozen ? 1 : -1;
    });

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

      {/* Main Grid: Management Panel Left, Optional Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className={`${showLivePreview ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} space-y-4`}>
          {/* Top Bar: Left Category Scroller, Right Manager & Live Preview Buttons */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              {/* Category Carousel with Left / Right Chevron Controls */}
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => scrollCategories('left')}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 shrink-0"
                  title="Sola Kaydır"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div
                  ref={scrollContainerRef}
                  className="flex items-center gap-1.5 overflow-x-auto scrollbar-none scroll-smooth px-1 py-0.5"
                >
                  {activeCategories.map((cat) => {
                    const isSelected = selectedCatId === cat.id;
                    const count = products.filter((p) => p.category_id === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCatId(cat.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate max-w-[140px]">{cat.name}</span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                            isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => scrollCategories('right')}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 shrink-0"
                  title="Sağa Kaydır"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons: Kategori Yönetimi & Ürün Ekle & Canlı Önizleme */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setShowCategoryManagerModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5 text-orange-400" />
                  <span>Kategoriler ({categories.length})</span>
                </button>

                {selectedCatId && (
                  <button
                    onClick={() => setShowAddProdModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1 transition active:scale-95 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Ürün Ekle</span>
                  </button>
                )}

                {/* Toggle Live Phone Preview */}
                <button
                  onClick={() => setShowLivePreview(!showLivePreview)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 border ${
                    showLivePreview
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Canlı Menü Önizlemesi"
                >
                  <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">Önizleme</span>
                </button>
              </div>
            </div>
          </div>

          {/* Selected Category Header & Product Cards */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-sm text-slate-900">
                  {selectedCategory?.name || 'Kategori Seçiniz'}
                </h2>
                <span className="text-[11px] font-bold text-slate-400">
                  ({currentProducts.length} Ürün)
                </span>
              </div>
            </div>

            {/* Products Grid */}
            {currentProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                Bu kategoride henüz ürün bulunmuyor. Sağ üstteki &quot;+ Ürün Ekle&quot; butonuna basarak ekleyebilirsiniz.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                      prod.is_frozen
                        ? 'bg-slate-50/90 border-slate-200 opacity-80'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Top Row: Name, Price & Action Buttons */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                            {prod.name}
                          </h3>
                          <span className={`font-black text-xs ${
                            prod.is_frozen ? 'text-slate-400 line-through' : 'text-orange-600'
                          }`}>
                            {prod.price.toFixed(2)} ₺
                          </span>
                        </div>

                        {/* Edit & Delete Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditProduct(prod)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                            title="Düzenle"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {prod.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {prod.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Row: Pure Text "Tükendi Olarak İşaretle" / "Satışa Aç" Button */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        prod.is_frozen
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {prod.is_frozen ? 'Tükendi (Menüde En Altta)' : 'Satışta (Aktif)'}
                      </span>

                      <button
                        onClick={() => handleToggleSoldOut(prod)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition active:scale-95 ${
                          prod.is_frozen
                            ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                            : 'bg-slate-50 hover:bg-amber-50 border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-800'
                        }`}
                      >
                        {prod.is_frozen ? 'Satışa Aç' : 'Tükendi Olarak İşaretle'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Phone Mockup Preview on Right */}
        {showLivePreview && (
          <div className="lg:col-span-5 xl:col-span-4 sticky top-4 max-h-[85vh] overflow-hidden rounded-3xl border-4 border-slate-900 shadow-2xl bg-black">
            <div className="bg-slate-900 text-white text-[10px] font-bold px-4 py-2 flex items-center justify-between">
              <span>Canlı Müşteri QR Menü Önizlemesi</span>
              <button
                onClick={() => setShowLivePreview(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(85vh-36px)]">
              <CustomerMenu business={business} initialTable="Önizleme Masası" />
            </div>
          </div>
        )}
      </div>

      {/* MASTER CATEGORY SELECTOR / MANAGER MODAL */}
      {showCategoryManagerModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-black text-base text-slate-900">Kategori Yönetimi</h3>
                <p className="text-xs text-slate-500">
                  16 hazır restoran kategorisini tek tıkla menünüze ekleyin veya gizleyin.
                </p>
              </div>
              <button
                onClick={() => setShowCategoryManagerModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {DEFAULT_CATEGORIES.map((catTemplate, index) => {
                const existing = categories.find(
                  (c) => c.name.toLowerCase() === catTemplate.name.toLowerCase()
                );
                const isInstalled = !!existing;
                const isActive = existing?.is_active ?? false;

                return (
                  <div
                    key={catTemplate.name}
                    className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-white transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={catTemplate.image_url}
                        alt={catTemplate.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {index + 1}. {catTemplate.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {catTemplate.products.length} Hazır Lezzet İçeriği
                        </p>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() => handleToggleCategory(catTemplate)}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs transition active:scale-95 shrink-0 ${
                        !isInstalled
                          ? 'bg-slate-900 hover:bg-slate-800 text-white'
                          : isActive
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {!isInstalled ? '+ Menüye Ekle' : isActive ? 'Menüde Aktif' : 'Gizlendi (Aç)'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-3 flex justify-end">
              <button
                onClick={() => setShowCategoryManagerModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {showEditProductModal && editingProduct && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-black text-sm text-slate-900">Ürünü Düzenle</h3>
              <button
                onClick={() => setShowEditProductModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ürün Adı</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fiyat (₺)</label>
                <input
                  type="number"
                  step="0.5"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-orange-600 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={editingProduct.category_id}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, category_id: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Malzeme & Servis Açıklaması
                </label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProductModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddProdModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-black text-sm text-slate-900">
                {selectedCategory?.name} Kategorisine Yeni Ürün Ekle
              </h3>
              <button
                onClick={() => setShowAddProdModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ürün Adı</label>
                <input
                  type="text"
                  placeholder="Örn: Özel Soslu Tavuk Wrap"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fiyat (₺)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="185.00"
                  value={newProdPrice}
                  onChange={(e) =>
                    setNewProdPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-orange-600 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Malzeme & Servis Açıklaması
                </label>
                <textarea
                  placeholder="Örn: Marine edilmiş tavuk bonfile, kaşar peyniri, patates tava ile..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProdModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
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
