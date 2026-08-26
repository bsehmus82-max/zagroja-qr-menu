import React, { useState } from 'react';
import { Category, Product } from '../../types';
import { store } from '../../lib/store';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Ban, 
  CheckCircle, 
  Sparkles,
  FolderPlus,
  DollarSign,
  Image as ImageIcon,
  UploadCloud
} from 'lucide-react';
import { getCategoryIcon } from '../customer/CategoryNav';
import { uploadImage } from '../../lib/supabase';

interface MenuManagerProps {
  categories: Category[];
  products: Product[];
  currency: string;
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  categories,
  products,
  currency,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Utensils');

  // New/Edit Product Form State
  const [prodForm, setProdForm] = useState({
    name: '',
    category_id: categories[0]?.id || '',
    description: '',
    price: 0,
    image_url: '',
    is_available: true,
    is_featured: false,
    prep_time_minutes: 15,
    calories: 250,
  });

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCatId === 'all' || p.category_id === selectedCatId;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleToggleAvailable = (productId: string) => {
    store.toggleProductAvailability(productId);
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdForm({
      name: '',
      category_id: categories[0]?.id || '',
      description: '',
      price: 150,
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      is_available: true,
      is_featured: false,
      prep_time_minutes: 15,
      calories: 300,
    });
    setIsAddingProduct(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name,
      category_id: prod.category_id,
      description: prod.description,
      price: prod.price,
      image_url: prod.image_url,
      is_available: prod.is_available,
      is_featured: prod.is_featured || false,
      prep_time_minutes: prod.prep_time_minutes || prod.preparation_time_minutes || 0,
      calories: prod.calories || 0,
    });
    setIsAddingProduct(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || prodForm.price <= 0) return;

    if (editingProduct) {
      store.updateProduct(editingProduct.id, {
        name: prodForm.name,
        category_id: prodForm.category_id,
        description: prodForm.description,
        price: Number(prodForm.price),
        image_url: prodForm.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        is_available: prodForm.is_available,
        is_featured: prodForm.is_featured,
        preparation_time_minutes: Number(prodForm.prep_time_minutes),
        prep_time_minutes: Number(prodForm.prep_time_minutes),
        calories: Number(prodForm.calories),
      });
    } else {
      store.addProduct({
        restaurant_id: store.getRestaurant().id,
        name: prodForm.name,
        category_id: prodForm.category_id,
        description: prodForm.description,
        price: Number(prodForm.price),
        image_url: prodForm.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        is_available: prodForm.is_available,
        is_featured: prodForm.is_featured,
        preparation_time_minutes: Number(prodForm.prep_time_minutes),
        prep_time_minutes: Number(prodForm.prep_time_minutes),
        calories: Number(prodForm.calories),
        sort_order: products.filter(p => p.category_id === prodForm.category_id).length + 1,
      });
    }

    setIsAddingProduct(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`"${name}" ürününü menüden silmek istediğinize emin misiniz?`)) {
      store.deleteProduct(id);
    }
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    store.addCategory(newCatName.trim(), newCatIcon);
    setNewCatName('');
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (catId: string, name: string) => {
    if (confirm(`"${name}" kategorisini ve altındaki ürün bağlantılarını silmek istediğinize emin misiniz?`)) {
      store.deleteCategory(catId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Menü ve Çeşit Yönetimi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ürünlerin fiyatlarını, stok tükenme durumlarını ve fotoğraflarını anında güncelleyin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingCategory(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4 text-slate-500" />
            <span>Kategori Ekle</span>
          </button>

          <button
            onClick={handleOpenAddProduct}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Ürün Ekle</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 items-center">
        <button
          onClick={() => setSelectedCatId('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            selectedCatId === 'all'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Tüm Çeşitler ({products.length})
        </button>

        {categories.map((cat) => (
          <div key={cat.id} className="relative group flex-shrink-0">
            <button
              onClick={() => setSelectedCatId(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCatId === cat.id
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {getCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-75">
                ({products.filter((p) => p.category_id === cat.id).length})
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Search and Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ürün adı veya açıklama ile ara..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50"
            />
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Toplam {filteredProducts.length} ürün listeleniyor
          </span>
        </div>

        {/* Product Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Görsel & Ürün Adı</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Fiyat</th>
                <th className="py-3 px-4">Stok Durumu (Tükendi mi?)</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    Ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const cat = categories.find((c) => c.id === product.category_id);
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Preview */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              {product.name}
                              {product.is_featured && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                  ⭐ Öneri
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {cat ? cat.name : 'Genel'}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-extrabold text-orange-600 text-sm whitespace-nowrap">
                        {product.price.toFixed(2)} {currency}
                      </td>

                      {/* Availability Toggle */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleAvailable(product.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            product.is_available
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Stok durumunu değiştirmek için tıklayın"
                        >
                          {product.is_available ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Stokta Var (Aktif)</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5 text-rose-600" />
                              <span>TÜKENDİ (Pasif)</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditProduct(product)}
                            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddingProduct(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingProduct ? 'Ürünü Düzenle' : 'Menüye Yeni Ürün Ekle'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ürün bilgileri kaydedildiğinde müşteri QR menüsünde anında güncellenir.
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="Örn: Double Cheese Gurme Burger"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={prodForm.category_id}
                    onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fiyat ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none font-bold text-orange-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İçindekiler / Açıklama (Malzemeler, Gramaj, vb.)
                </label>
                <textarea
                  rows={2}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  placeholder="Örn: 150g dana eti, cheddar, karamelize soğan, patates..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ürün Görseli (Dosya Yükle veya URL Gir)
                </label>
                <div className="flex gap-2 items-center">
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 rounded-xl cursor-pointer transition-colors text-xs font-bold shrink-0">
                    <UploadCloud className="w-4 h-4" />
                    <span>Yükle</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        alert('Görsel yükleniyor, lütfen bekleyin...');
                        const url = await uploadImage(file);
                        if (url) {
                          setProdForm({ ...prodForm, image_url: url });
                          alert('Görsel başarıyla yüklendi!');
                        } else {
                          alert('Yükleme başarısız oldu.');
                        }
                      }}
                    />
                  </label>
                  <input
                    type="url"
                    value={prodForm.image_url}
                    onChange={(e) => setProdForm({ ...prodForm, image_url: e.target.value })}
                    placeholder="veya https://..."
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  {prodForm.image_url && (
                    <img
                      src={prodForm.image_url}
                      alt="Önizleme"
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hazırlık Süresi (Dakika)
                  </label>
                  <input
                    type="number"
                    value={prodForm.prep_time_minutes}
                    onChange={(e) => setProdForm({ ...prodForm, prep_time_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kalori (kcal)
                  </label>
                  <input
                    type="number"
                    value={prodForm.calories}
                    onChange={(e) => setProdForm({ ...prodForm, calories: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={prodForm.is_available}
                    onChange={(e) => setProdForm({ ...prodForm, is_available: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <span>Stokta Var (Siparişe Açık)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={prodForm.is_featured}
                    onChange={(e) => setProdForm({ ...prodForm, is_featured: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <span>Şefin Önerisi / Popüler ⭐</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingProduct(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20"
                >
                  {editingProduct ? 'Güncellemeleri Kaydet' : 'Ürünü Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10">
            <button
              onClick={() => setIsAddingCategory(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Yeni Kategori Ekle</h3>
            <p className="text-xs text-slate-500 mb-4">
              Menüde görünecek yeni bir yemek veya içecek bölümü oluşturun.
            </p>

            <form onSubmit={handleSaveCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Adı *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Örn: Makarna & Risotto"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İkon Türü
                </label>
                <select
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium"
                >
                  <option value="Utensils">Varsayılan (Çatal Bıçak)</option>
                  <option value="Coffee">Kahve & Sıcak İçecek</option>
                  <option value="GlassWater">Soğuk İçecek</option>
                  <option value="UtensilsCrossed">Ana Yemek</option>
                  <option value="Sandwich">Atıştırmalık & Sandviç</option>
                  <option value="Egg">Kahvaltılık</option>
                  <option value="Cake">Tatlı & Pasta</option>
                  <option value="Pizza">Pizza</option>
                  <option value="Salad">Salata</option>
                  <option value="Wine">Şarap & Kokteyl</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md"
                >
                  Kategoriyi Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
