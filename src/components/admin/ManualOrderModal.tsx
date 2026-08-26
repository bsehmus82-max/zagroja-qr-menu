import React, { useState } from 'react';
import { RestaurantTable, Category, Product, OrderItem } from '../../types';
import { store, playNotificationSound } from '../../lib/store';
import { showToast } from '../../lib/toast';
import { 
  X, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Search, 
  Check, 
  CreditCard, 
  Banknote, 
  Layers,
  UtensilsCrossed,
  Sparkles,
  Receipt
} from 'lucide-react';
import { getCategoryIcon } from '../customer/CategoryNav';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: RestaurantTable[];
  categories: Category[];
  products: Product[];
  currency: string;
  defaultTableNumber?: number;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  isOpen,
  onClose,
  tables,
  categories,
  products,
  currency,
  defaultTableNumber,
}) => {
  const [selectedTableNumber, setSelectedTableNumber] = useState<number>(
    defaultTableNumber || tables[0]?.table_number || 1
  );
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState<{ [productId: string]: { product: Product; quantity: number; notes: string } }>({});
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>('cash');
  const [orderStatus, setOrderStatus] = useState<'pending' | 'preparing' | 'served' | 'completed'>('served');

  if (!isOpen) return null;

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
      showToast('Lütfen masaya en az bir ürün ekleyin.', 'warning');
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
      orderNotes ? `(Admin/Garson Girişi) ${orderNotes}` : '(Admin/Garson Manuel Giriş)',
      paymentMethod
    );

    // If marked as served or completed, update status immediately
    if (orderStatus !== 'pending') {
      await store.updateOrderStatus(
        newOrder.id,
        orderStatus,
        orderStatus === 'completed' ? 'paid' : 'unpaid'
      );
    }

    playNotificationSound('success');
    setOrderItems({});
    setOrderNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center font-bold text-white shadow-md">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Manuel Masa Siparişi / Hızlı Satış Girişi
              </h3>
              <p className="text-xs text-slate-300">
                QR okutamayan müşteriler için masaya doğrudan ürün ve ciro girişi yapın.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left Product Picker, Right Cart Summary */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Category & Products */}
          <div className="flex-1 flex flex-col border-r border-slate-100 overflow-hidden bg-slate-50/50">
            {/* Search and Category Filter */}
            <div className="p-3 border-b border-slate-200/80 bg-white space-y-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ürün veya içecek hızlı ara..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50"
                />
              </div>

              {/* Category pills */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedCatId('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCatId === 'all'
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tümü
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCatId === cat.id
                        ? 'bg-orange-500 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {getCategoryIcon(cat.icon, 'w-3 h-3')}
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Product Quick Grid */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredProducts.map((product) => {
                const inCart = orderItems[product.id];
                return (
                  <div
                    key={product.id}
                    onClick={() => handleAddItem(product)}
                    className={`bg-white rounded-2xl p-2.5 border transition-all cursor-pointer flex flex-col justify-between select-none relative group ${
                      inCart
                        ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                        {inCart.quantity}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-xs truncate">
                          {product.name}
                        </h4>
                        <span className="text-[11px] font-extrabold text-orange-600">
                          {product.price.toFixed(2)} {currency}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium truncate">
                        {product.is_available ? 'Stokta' : 'Tükendi'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddItem(product);
                        }}
                        className="p-1 rounded-lg bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Table Select, Order Summary & Checkout */}
          <div className="w-full md:w-80 lg:w-96 bg-white p-4 flex flex-col justify-between border-t md:border-t-0 border-slate-200">
            <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              {/* 1. Masa Seçimi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-orange-500" />
                  <span>Sipariş Verilen Masa *</span>
                </label>
                <select
                  value={selectedTableNumber}
                  onChange={(e) => setSelectedTableNumber(Number(e.target.value))}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 text-slate-900"
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.table_number}>
                      {t.table_name} ({t.section})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Seçilen Ürünler Listesi */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />
                    <span>Masaya Giden Ürünler ({selectedItemsList.length})</span>
                  </label>
                  {selectedItemsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOrderItems({})}
                      className="text-[10px] text-rose-500 hover:underline font-semibold"
                    >
                      Temizle
                    </button>
                  )}
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                  {selectedItemsList.length === 0 ? (
                    <p className="text-center py-4 text-xs text-slate-400 italic">
                      Soldaki menüden ürünlere tıklayarak masaya ekleyin.
                    </p>
                  ) : (
                    selectedItemsList.map((item) => (
                      <div
                        key={item.product.id}
                        className="bg-white p-2 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-slate-800 truncate">
                            {item.product.name}
                          </h5>
                          <span className="text-[11px] font-semibold text-orange-600">
                            {(item.product.price * item.quantity).toFixed(2)} {currency}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.product.id, -1)}
                            className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.product.id, 1)}
                            className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Sipariş Durumu */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İşlem Türü / Durum
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                >
                  <option value="served">Masaya Servis Edildi (Açık Hesap)</option>
                  <option value="completed">Ödeme Alındı & Hesap Kapatıldı (Z Raporuna İşle)</option>
                  <option value="preparing">Mutfağa İlet (Hazırlanıyor)</option>
                  <option value="pending">Yeni Sipariş (Bekliyor)</option>
                </select>
              </div>

              {/* 4. Ödeme Yöntemi */}
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
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" /> Nakit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all ${
                      paymentMethod === 'credit_card'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Kredi Kartı
                  </button>
                </div>
              </div>

              {/* 5. Not */}
              <div>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ekstra not (İsteğe bağlı)..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            {/* Bottom Checkout Button */}
            <div className="pt-3 border-t border-slate-100 mt-2 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-500">Masa Toplamı</span>
                <div className="text-xl font-black text-slate-900">
                  {totalAmount.toFixed(2)} <span className="text-orange-600 text-sm">{currency}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={selectedItemsList.length === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:brightness-105 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
                <span>Masaya İşle & Kaydet ({totalAmount.toFixed(2)} {currency})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
