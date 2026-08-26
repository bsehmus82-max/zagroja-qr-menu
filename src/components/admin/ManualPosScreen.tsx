import React, { useState } from 'react';
import { RestaurantTable, Category, Product, OrderItem } from '../../types';
import { store, playNotificationSound } from '../../lib/store';
import { 
  Plus, 
  Minus, 
  ShoppingBag, 
  Search, 
  Check, 
  CreditCard, 
  Banknote, 
  Layers,
  UtensilsCrossed,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { getCategoryIcon } from '../customer/CategoryNav';

interface ManualPosScreenProps {
  tables: RestaurantTable[];
  categories: Category[];
  products: Product[];
  currency: string;
}

export const ManualPosScreen: React.FC<ManualPosScreenProps> = ({
  tables,
  categories,
  products,
  currency,
}) => {
  const [selectedTableNumber, setSelectedTableNumber] = useState<number>(
    tables[0]?.table_number || 1
  );
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState<{ [productId: string]: { product: Product; quantity: number; notes: string } }>({});
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>('cash');
  const [orderStatus, setOrderStatus] = useState<'served' | 'completed' | 'preparing'>('served');
  const [successMessage, setSuccessMessage] = useState('');

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCatId === 'all' || p.category_id === selectedCatId;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddItem = (product: Product) => {
    setOrderItems((prev) => {
      const current = prev[product.id];
      const newQty = current ? current.quantity + 1 : 1;
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: newQty,
          notes: current?.notes || '',
        },
      };
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setOrderItems((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      const newQty = current.quantity + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return {
        ...prev,
        [productId]: {
          ...current,
          quantity: newQty,
        },
      };
    });
  };

  const selectedItemsList = Object.values(orderItems);
  const totalAmount = selectedItemsList.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemsList.length === 0) {
      alert('Lütfen masaya en az bir ürün seçin.');
      return;
    }

    const items: OrderItem[] = selectedItemsList.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      unit_price: item.product.price,
      quantity: item.quantity,
      total_price: item.product.price * item.quantity,
      item_notes: item.notes,
    }));

    const newOrder = await store.createOrder(
      selectedTableNumber,
      items,
      orderNotes ? `(Garson/Kasa Girişi) ${orderNotes}` : '(Garson/Kasa Girişi)',
      paymentMethod
    );

    // Status update
    await store.updateOrderStatus(
      newOrder.id,
      orderStatus,
      orderStatus === 'completed' ? 'paid' : 'unpaid'
    );

    playNotificationSound('success');
    setSuccessMessage(`Masa ${selectedTableNumber} için ${totalAmount.toFixed(2)} ${currency} tutarındaki sipariş başarıyla kaydedildi!`);
    setOrderItems({});
    setOrderNotes('');

    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  const currentTableName = tables.find((t) => t.table_number === selectedTableNumber)?.table_name || `Masa ${selectedTableNumber}`;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-500" />
            <span>Manuel Masa Satışı & Sipariş Girişi (POS)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            QR kod okutmayan veya doğrudan kasadan/garsona sipariş veren masalar için hızlı ürün ve ciro girişi.
          </p>
        </div>

        {successMessage && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Main POS Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Product Selector (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          {/* 1. Masa Seçim Şeridi */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-orange-500" />
              <span>1. Masayı Seçin (Aktif Masa: {currentTableName})</span>
            </label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {tables.map((tbl) => (
                <button
                  key={tbl.id}
                  type="button"
                  onClick={() => setSelectedTableNumber(tbl.table_number)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex flex-col items-center ${
                    selectedTableNumber === tbl.table_number
                      ? 'bg-slate-900 text-white shadow-md scale-[1.03] ring-2 ring-orange-500'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{tbl.table_name}</span>
                  <span className="text-[10px] font-medium opacity-75">{tbl.section}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Arama ve Kategoriler */}
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Yemek veya içecek ara..."
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setSelectedCatId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCatId === 'all'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tüm Menü
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCatId === cat.id
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {getCategoryIcon(cat.icon, 'w-3 h-3')}
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Ürünler Grid */}
          <div className="p-4 overflow-y-auto max-h-[500px] grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 bg-slate-50/30 flex-1">
            {filteredProducts.map((product) => {
              const inCart = orderItems[product.id];
              return (
                <div
                  key={product.id}
                  onClick={() => handleAddItem(product)}
                  className={`bg-white rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between select-none relative group hover:shadow-md ${
                    inCart
                      ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/30'
                      : 'border-slate-200 hover:border-orange-200'
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-extrabold flex items-center justify-center shadow-md">
                      {inCart.quantity}
                    </span>
                  )}

                  <div>
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-24 rounded-xl object-cover bg-slate-100 mb-2"
                      loading="lazy"
                    />
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-1">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-extrabold text-orange-600 text-xs">
                      {product.price.toFixed(2)} {currency}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddItem(product);
                      }}
                      className="w-7 h-7 rounded-lg bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 flex items-center justify-center transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Order Summary & Checkout (4-5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-orange-500 text-white font-extrabold text-xs flex items-center justify-center">
                  M{selectedTableNumber}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{currentTableName} Sipariş Özeti</h3>
                  <span className="text-[10px] text-slate-400">{selectedItemsList.length} çeşit seçildi</span>
                </div>
              </div>

              {selectedItemsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOrderItems({})}
                  className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Temizle
                </button>
              )}
            </div>

            {/* Selected Items List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {selectedItemsList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                  <p className="text-xs font-semibold text-slate-600">Henüz Ürün Seçilmedi</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Soldaki menüden yemek veya içeceklere tıklayarak masaya ekleyin.
                  </p>
                </div>
              ) : (
                selectedItemsList.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-slate-900 truncate">
                        {item.product.name}
                      </h5>
                      <span className="text-xs font-extrabold text-orange-600">
                        {(item.product.price * item.quantity).toFixed(2)} {currency}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.product.id, 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Durum Seçimi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                İşlem Türü
              </label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none"
              >
                <option value="served">Masaya Servis Edildi (Açık Hesap)</option>
                <option value="completed">Ödeme Alındı & Hesap Kapatıldı (Z Raporuna İşle)</option>
                <option value="preparing">Mutfağa İlet (Hazırlanıyor)</option>
              </select>
            </div>

            {/* Ödeme Türü */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ödeme Yöntemi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" /> Nakit Kasa
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all ${
                    paymentMethod === 'credit_card'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Kredi Kartı
                </button>
              </div>
            </div>

            {/* Sipariş Notu */}
            <div>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Özel masa notu (İsteğe bağlı)..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
              />
            </div>
          </div>

          {/* Total and Submit */}
          <div className="pt-4 border-t border-slate-100 mt-4 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Masa Toplamı</span>
              <div className="text-2xl font-black text-slate-900">
                {totalAmount.toFixed(2)} <span className="text-orange-600 text-sm font-bold">{currency}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedItemsList.length === 0}
              className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:brightness-105 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              <span>{currentTableName} İçin Kaydet ({totalAmount.toFixed(2)} {currency})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
