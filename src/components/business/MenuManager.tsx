import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit3, 
  ChevronLeft, ChevronRight, Check, X,
  Eye, EyeOff, Layers, Sparkles, Smartphone, ArrowRight,
  RotateCcw, Image as ImageIcon, QrCode, Palette, Wand2
} from 'lucide-react';
import { Business, Category, Product } from '../../types';
import { supabase } from '../../lib/supabase';
import { DEFAULT_CATEGORIES } from '../../data/defaultCatalog';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { CustomerMenu } from '../customer/CustomerMenu';
import { FoodImagePickerModal } from './FoodImagePickerModal';

interface MenuManagerProps {
  business: Business;
  onOpenThemeStudio?: () => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({ 
  business,
  onOpenThemeStudio,
}) => {
  const toast = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(() => {
    return localStorage.getItem(`menu_selected_cat_${business.id}`) || null;
  });
  const [loading, setLoading] = useState(true);

  const handleSelectCategory = (id: string) => {
    setSelectedCatId(id);
    localStorage.setItem(`menu_selected_cat_${business.id}`, id);
  };

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  // Live Phone Preview Toggle
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Food Image Inventory Picker Modal
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<'new' | 'edit'>('new');

  // Modals
  const [showCategoryManagerModal, setShowCategoryManagerModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number | ''>('');
  const [newProdImageUrl, setNewProdImageUrl] = useState('');

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
        const savedCatId = localStorage.getItem(`menu_selected_cat_${business.id}`);
        if (savedCatId && catsRes.data.some((c) => c.id === savedCatId)) {
          setSelectedCatId(savedCatId);
        } else if (catsRes.data.length > 0) {
          setSelectedCatId(catsRes.data[0].id);
          localStorage.setItem(`menu_selected_cat_${business.id}`, catsRes.data[0].id);
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

  const scrollCategories = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Add Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId) {
      toast.error('Lütfen önce bir kategori seçiniz.');
      return;
    }
    if (!newProdName.trim() || newProdPrice === '') {
      toast.error('Lütfen ürün adı ve fiyatını giriniz.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            business_id: business.id,
            category_id: selectedCatId,
            name: newProdName.trim(),
            description: newProdDesc.trim() || null,
            price: Number(newProdPrice),
            image_url: newProdImageUrl.trim() || null,
            is_frozen: false,
            is_active: true,
            order_index: products.filter((p) => p.category_id === selectedCatId).length,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProducts((prev) => [...prev, data as Product]);
        toast.success(`${newProdName} başarıyla eklendi!`);
        setNewProdName('');
        setNewProdDesc('');
        setNewProdPrice('');
        setNewProdImageUrl('');
        setShowAddProdModal(false);
      }
    } catch (err: any) {
      toast.error('Ürün eklenirken bir hata oluştu: ' + err.message);
    }
  };

  // Edit Product
  const openEditProduct = (prod: Product) => {
    setEditingProduct({ ...prod });
    setShowEditProductModal(true);
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name.trim(),
          description: editingProduct.description?.trim() || null,
          price: Number(editingProduct.price),
          category_id: editingProduct.category_id,
          image_url: editingProduct.image_url?.trim() || null,
        })
        .eq('id', editingProduct.id)
        .eq('business_id', business.id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? editingProduct : p))
      );
      toast.success('Ürün güncellendi.');
      setShowEditProductModal(false);
    } catch (err: any) {
      toast.error('Güncelleme hatası: ' + err.message);
    }
  };

  // Delete Product
  const handleDeleteProduct = (prod: Product) => {
    setConfirmConfig({
      isOpen: true,
      title: `${prod.name} Silinsin mi?`,
      message: 'Bu ürün menünüzden kalıcı olarak silinecektir.',
      type: 'danger',
      action: async () => {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', prod.id)
          .eq('business_id', business.id);

        if (!error) {
          setProducts((prev) => prev.filter((p) => p.id !== prod.id));
          toast.success(`${prod.name} silindi.`);
        } else {
          toast.error('Ürün silinemedi.');
        }
      },
    });
  };

  // Toggle Sold Out (Freeze)
  const handleToggleSoldOut = async (prod: Product) => {
    const nextState = !prod.is_frozen;
    const { error } = await supabase
      .from('products')
      .update({ is_frozen: nextState })
      .eq('id', prod.id)
      .eq('business_id', business.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, is_frozen: nextState } : p))
      );
      toast.success(nextState ? `${prod.name} tükendi olarak işaretlendi.` : `${prod.name} satışa açıldı.`);
    }
  };

  // Category Toggle & Clean
  const handleToggleCategory = async (template: typeof DEFAULT_CATEGORIES[0]) => {
    const existing = categories.find(
      (c) => c.name.toLowerCase() === template.name.toLowerCase()
    );

    if (existing) {
      const nextActive = !existing.is_active;
      const { error } = await supabase
        .from('categories')
        .update({ is_active: nextActive })
        .eq('id', existing.id)
        .eq('business_id', business.id);

      if (!error) {
        setCategories((prev) =>
          prev.map((c) => (c.id === existing.id ? { ...c, is_active: nextActive } : c))
        );
        toast.success(`${existing.name} kategorisi ${nextActive ? 'aktif edildi' : 'gizlendi'}.`);
      }
    } else {
      const { data: newCat, error: catErr } = await supabase
        .from('categories')
        .insert([
          {
            business_id: business.id,
            name: template.name,
            image_url: template.image_url,
            order_index: categories.length,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (!catErr && newCat) {
        setCategories((prev) => [...prev, newCat as Category]);
        if (template.products && template.products.length > 0) {
          const prodsToInsert = template.products.map((p, idx) => ({
            business_id: business.id,
            category_id: newCat.id,
            name: p.name,
            description: p.description,
            price: p.price,
            is_frozen: false,
            is_active: true,
            order_index: idx,
          }));

          const { data: insertedProds } = await supabase
            .from('products')
            .insert(prodsToInsert)
            .select();

          if (insertedProds) {
            setProducts((prev) => [...prev, ...(insertedProds as Product[])]);
          }
        }
        toast.success(`${template.name} kategorisi ve lezzetleri eklendi!`);
      }
    }
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    setConfirmConfig({
      isOpen: true,
      title: `${catName} Kategorisi Silinsin mi?`,
      message: 'Bu kategoriyi ve altındaki tüm ürünleri kalıcı olarak silmek istediğinizden emin misiniz?',
      type: 'danger',
      action: async () => {
        await supabase.from('products').delete().eq('category_id', catId).eq('business_id', business.id);
        const { error } = await supabase.from('categories').delete().eq('id', catId).eq('business_id', business.id);

        if (!error) {
          setCategories((prev) => prev.filter((c) => c.id !== catId));
          setProducts((prev) => prev.filter((p) => p.category_id !== catId));
          if (selectedCatId === catId) {
            setSelectedCatId(null);
          }
          toast.success(`${catName} kategorisi silindi.`);
        }
      },
    });
  };

  const handleResetAndCleanTo16 = async () => {
    if (!confirm('Menünüzdeki tüm kategoriler sıfırlanacak ve 16 standart hazır kategoriye eşitlenecektir. Onaylıyor musunuz?')) {
      return;
    }

    setLoading(true);
    try {
      await supabase.from('products').delete().eq('business_id', business.id);
      await supabase.from('categories').delete().eq('business_id', business.id);

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
      toast.success('Menünüz 16 standart kategori ile sıfırlandı ve yenilendi.');
      setShowCategoryManagerModal(false);
    } catch {
      toast.error('Sıfırlama sırasında hata oluştu.');
    } finally {
      setLoading(false);
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
    <div className="space-y-4 font-medium text-slate-200">
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
          <div className="bg-[#111622] p-3.5 rounded-3xl shadow-lg space-y-3">
            <div className="flex items-center justify-between gap-2">
              {/* Category Carousel with Left / Right Chevron Controls */}
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => scrollCategories('left')}
                  className="w-8 h-8 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-slate-300 flex items-center justify-center transition active:scale-95 shrink-0"
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
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-white/20 text-white border border-white/25 shadow-sm'
                            : 'bg-[#182030] text-slate-400 hover:text-slate-100 hover:bg-[#1C2433] border border-white/[0.06] hover:border-white/[0.12]'
                        }`}
                      >
                        <span className="truncate max-w-[140px]">{cat.name}</span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-[#0C1017] text-slate-400'
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
                  className="w-8 h-8 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-slate-300 flex items-center justify-center transition active:scale-95 shrink-0"
                  title="Sağa Kaydır"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons: Kategori Yönetimi & Ürün Ekle & Canlı Önizleme */}
              <div className="flex items-center gap-1.5 shrink-0">
                {onOpenThemeStudio && (
                  <button
                    onClick={onOpenThemeStudio}
                    className="px-3 py-2 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                    title="Mekan Teması & Yazı Tipi"
                  >
                    <Palette className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden sm:inline">Tema & Font</span>
                  </button>
                )}

                <button
                  onClick={() => setShowCategoryManagerModal(true)}
                  className="px-3 py-2 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-slate-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm border border-white/[0.06] hover:border-white/[0.12]"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-300" />
                  <span>Kategoriler ({categories.length})</span>
                </button>

                {selectedCatId && (
                  <button
                    onClick={() => setShowAddProdModal(true)}
                    onMouseMove={handleSpotlightMove}
                    className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs flex items-center gap-1 transition active:scale-95 shadow-md border border-white/25 spotlight-card spotlight-glow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Ürün Ekle</span>
                  </button>
                )}

                {/* Toggle Live Phone Preview */}
                <button
                  onClick={() => setShowLivePreview(!showLivePreview)}
                  className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                    showLivePreview
                      ? 'bg-white/20 text-white border border-white/25 shadow-sm'
                      : 'bg-[#1C2433] text-slate-400 hover:text-slate-200 hover:bg-[#253043] border border-white/[0.06]'
                  }`}
                  title="Canlı Menü Önizlemesi"
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-300" />
                  <span className="hidden sm:inline">Önizleme</span>
                </button>
              </div>
            </div>
          </div>

          {/* Selected Category Header & Product Cards */}
          <div className="bg-[#111622] p-5 rounded-3xl shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-sm text-slate-100">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {currentProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className={`p-4 rounded-2xl transition flex flex-col justify-between gap-3 shadow-sm spotlight-card spotlight-glow ${
                      prod.is_frozen
                        ? 'bg-[#0C1017]/60 opacity-60'
                        : 'bg-[#0C1017] hover:bg-[#141A26]'
                    }`}
                  >
                    {/* Top Row: Thumbnail + Name, Price & Action Buttons */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        {/* Food Thumbnail with Change Photo Button */}
                        <div
                          onClick={() => {
                            setEditingProduct(prod);
                            setImagePickerTarget('edit');
                            setShowImagePickerModal(true);
                          }}
                          className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-xl overflow-hidden bg-[#1C2433] shrink-0 relative group/img cursor-pointer shadow-sm"
                          title="Fotoğrafı Değiştir"
                        >
                          <img
                            src={
                              prod.image_url ||
                              selectedCategory?.image_url ||
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
                            }
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                            Değiştir
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-xs sm:text-sm text-slate-100 truncate">
                            {prod.name}
                          </h3>
                          <span className={`font-black text-xs ${
                            prod.is_frozen ? 'text-slate-500 line-through' : 'text-white'
                          }`}>
                            {prod.price.toFixed(2)} ₺
                          </span>
                          {prod.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {prod.description}
                            </p>
                          )}
                        </div>

                        {/* Edit & Delete Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditProduct(prod)}
                            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-[#1C2433] transition"
                            title="Düzenle"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Pure Text "Tükendi Olarak İşaretle" / "Satışa Aç" Button */}
                    <div className="pt-2 border-t border-[#1F293D]/60 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        prod.is_frozen
                          ? 'bg-[#1C2433] text-slate-400'
                          : 'bg-[#1C2433] text-slate-200'
                      }`}>
                        {prod.is_frozen ? 'Tükendi (Menüde En Altta)' : 'Satışta (Aktif)'}
                      </span>

                      <button
                        onClick={() => handleToggleSoldOut(prod)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition active:scale-95 ${
                          prod.is_frozen
                            ? 'bg-[#1C2433] hover:bg-[#253043] text-slate-200 border border-white/[0.08]'
                            : 'bg-[#161E2E] hover:bg-[#1C2433] text-slate-300 hover:text-white border border-white/[0.06]'
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
          <div className="lg:col-span-5 xl:col-span-4 sticky top-4 max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl bg-black">
            <div className="bg-[#111622] text-slate-200 text-[10px] font-bold px-4 py-2 flex items-center justify-between">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-[#1F293D] rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F293D] mb-3">
              <div>
                <h3 className="font-black text-base text-white">Kategori Yönetimi</h3>
                <p className="text-xs text-slate-400">
                  Toplam {categories.length} kategori mevcut.
                </p>
              </div>
              <button
                onClick={() => setShowCategoryManagerModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#1C2433]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Clean & Reset Button for 16 Categories */}
            <div className="mb-3 bg-[#161E2E] border border-[#1F293D] rounded-2xl p-3 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                <strong className="font-black text-white block">Mükerrer veya Karışmış Kategoriler?</strong>
                <span className="text-slate-400">Tek tıkla menünüzü temiz 16 standart kategoriye eşitleyin.</span>
              </div>
              <button
                type="button"
                onClick={handleResetAndCleanTo16}
                disabled={loading}
                className="px-3 py-2 bg-[#1C2433] hover:bg-[#253043] border border-[#2B384E] text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>16 Kategoriye Sıfırla</span>
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
                    className="p-3 rounded-2xl border border-[#1F293D] bg-[#0C1017] flex items-center justify-between gap-3 hover:border-slate-600 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={catTemplate.image_url}
                        alt={catTemplate.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-[#1F293D]"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-100 truncate">
                          {index + 1}. {catTemplate.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {catTemplate.products.length} Hazır Lezzet İçeriği
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Toggle Button */}
                      <button
                        onClick={() => handleToggleCategory(catTemplate)}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition active:scale-95 ${
                          !isInstalled
                            ? 'bg-white/20 hover:bg-white/30 text-white border border-white/25 shadow-sm'
                            : isActive
                            ? 'bg-[#1C2433] hover:bg-[#253043] border border-[#2B384E] text-white'
                            : 'bg-[#161E2E] hover:bg-[#1C2433] text-slate-400 border border-[#1F293D]'
                        }`}
                      >
                        {!isInstalled ? '+ Menüye Ekle' : isActive ? 'Menüde Aktif' : 'Gizlendi (Aç)'}
                      </button>

                      {/* Delete Button if exists */}
                      {existing && (
                        <button
                          onClick={() => handleDeleteCategory(existing.id, existing.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                          title="Kategoriyi ve Ürünlerini Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#1F293D] mt-3 flex justify-end">
              <button
                onClick={() => setShowCategoryManagerModal(false)}
                className="px-5 py-2.5 bg-[#1C2433] hover:bg-[#253043] border border-[#2B384E] text-white text-xs font-bold rounded-xl transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {showEditProductModal && editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-[#1F293D] rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F293D] mb-4">
              <h3 className="font-black text-sm text-white">Ürünü Düzenle</h3>
              <button
                onClick={() => setShowEditProductModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#1C2433]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Ürün Adı</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Fiyat (₺)</label>
                <input
                  type="number"
                  step="0.5"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                  }
                  className="w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Kategori</label>
                <select
                  value={editingProduct.category_id}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, category_id: e.target.value })
                  }
                  className="w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Photo Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Ürün Görseli</label>
                <div className="flex items-center gap-3 p-2.5 bg-[#0C1017] border border-[#1F293D] rounded-2xl">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#1C2433] shrink-0 border border-[#2B384E] relative">
                    <img
                      src={
                        editingProduct.image_url ||
                        categories.find((c) => c.id === editingProduct.category_id)?.image_url ||
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={editingProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget('edit');
                        setShowImagePickerModal(true);
                      }}
                      className="px-3 py-1.5 bg-[#1C2433] hover:bg-[#253043] border border-[#2B384E] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-slate-300" />
                      <span>Hazır Galeriden Seç / Yükle</span>
                    </button>
                    {editingProduct.image_url && (
                      <button
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, image_url: undefined })}
                        className="text-[10px] text-rose-400 hover:underline block font-semibold"
                      >
                        Özel Fotoğrafı Kaldır
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Malzeme & Servis Açıklaması
                </label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-[#0C1017] border border-[#1F293D] focus:border-slate-500 rounded-xl p-3 text-xs font-medium text-slate-100 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProductModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-xs font-bold text-slate-400 hover:text-white hover:bg-[#1C2433] transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-extrabold rounded-xl transition shadow-md border border-white/25 active:scale-95"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111622] rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]/60 mb-4">
              <h3 className="font-black text-sm text-white">
                {selectedCategory?.name} Kategorisine Yeni Ürün Ekle
              </h3>
              <button
                onClick={() => setShowAddProdModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#1C2433]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Ürün Adı</label>
                <input
                  type="text"
                  placeholder="Örn: Özel Soslu Tavuk Wrap"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Fiyat (₺)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="185.00"
                  value={newProdPrice}
                  onChange={(e) =>
                    setNewProdPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none"
                  required
                />
              </div>

              {/* Product Photo Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Ürün Görseli</label>
                <div className="flex items-center gap-3 p-3 bg-[#0C1017] rounded-2xl">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#1C2433] shrink-0 border border-white/[0.08] relative">
                    <img
                      src={
                        newProdImageUrl ||
                        selectedCategory?.image_url ||
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
                      }
                      alt="Yeni Ürün"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget('new');
                        setShowImagePickerModal(true);
                      }}
                      className="px-3 py-1.5 bg-[#1C2433] hover:bg-[#253043] border border-white/[0.08] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-slate-300" />
                      <span>Hazır Galeriden Seç / Yükle</span>
                    </button>
                    {newProdImageUrl && (
                      <button
                        type="button"
                        onClick={() => setNewProdImageUrl('')}
                        className="text-[10px] text-rose-400 hover:underline block font-semibold"
                      >
                        Görseli Temizle
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Malzeme & Servis Açıklaması
                </label>
                <textarea
                  placeholder="Örn: Marine edilmiş tavuk bonfile, kaşar peyniri, patates tava ile..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0C1017] rounded-xl p-3 text-xs font-medium text-slate-100 focus:outline-none leading-relaxed resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProdModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-xs font-bold text-slate-400 hover:text-white hover:bg-[#1C2433] transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-extrabold rounded-xl transition shadow-md border border-white/25 active:scale-95"
                >
                  Ürünü Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOD IMAGE GALLERY & INVENTORY PICKER MODAL */}
      <FoodImagePickerModal
        isOpen={showImagePickerModal}
        currentImageUrl={imagePickerTarget === 'new' ? newProdImageUrl : editingProduct?.image_url}
        onClose={() => setShowImagePickerModal(false)}
        onSelectImage={(url) => {
          if (imagePickerTarget === 'new') {
            setNewProdImageUrl(url);
          } else if (editingProduct) {
            setEditingProduct({ ...editingProduct, image_url: url });
          }
        }}
      />
    </div>
  );
};
