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
    }, 3000);
  };

  return (
    <div className="flex h-full bg-slate-50 relative">
      {/* SUCCESS TOAST */}
      {successMessage && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={20} />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* LEFT: Menu / Product List */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-white">
        {/* Categories */}
        <div className="p-4 border-b border-slate-200 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCatId('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCatId === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers size={16} />
              Tümü
            </button>
            {categories.map((cat) => {
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCatId === cat.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {getCategoryIcon(cat.icon, "w-4 h-4")}
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleAddItem(product)}
                disabled={!product.is_available}
                className={`relative flex flex-col bg-white border rounded-2xl overflow-hidden text-left transition-all hover:shadow-md ${
                  product.is_available
                    ? 'border-slate-200 hover:border-orange-500'
                    : 'border-slate-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="aspect-video w-full bg-slate-100 relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <UtensilsCrossed size={24} />
                    </div>
                  )}
                  {!product.is_available && (
                    <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center">
                      <span className="bg-white/90 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full">
                        TÜKENDİ
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-medium text-slate-900 text-sm line-clamp-1 mb-1">
                    {product.name}
                  </h3>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-semibold text-orange-600 text-sm">
                      {product.price.toFixed(2)} {currency}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <Plus size={14} />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Order Cart */}
      <div className="w-96 bg-white flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white">
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingBag size={18} className="text-orange-400" />
            Sipariş Detayı
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {/* Table Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Masa Seçimi
              </label>
              <select
                value={selectedTableNumber}
                onChange={(e) => setSelectedTableNumber(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.table_number}>
                    {t.table_name} ({t.section})
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Ürünler
              </label>
              {selectedItemsList.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <ShoppingBag size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Sepet boş</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItemsList.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 text-sm">
                          {item.product.name}
                        </h4>
                        <p className="text-orange-600 font-medium text-sm mt-0.5">
                          {(item.product.price * item.quantity).toFixed(2)} {currency}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 h-fit">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 text-slate-600 hover:bg-slate-200"
                        >
                          {item.quantity === 1 ? <Trash2 size={12} className="text-red-500" /> : <Minus size={12} />}
                        </button>
                        <span className="w-4 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 text-slate-600 hover:bg-slate-200"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Sipariş Notu
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Örn: Az pişmiş, buzsuz..."
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
              />
            </div>
            
            {/* Status Options */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Sipariş Durumu
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderStatus('preparing')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-colors ${
                    orderStatus === 'preparing' 
                      ? 'border-orange-500 bg-orange-50 text-orange-700' 
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Mutfakta
                </button>
                <button
                  type="button"
                  onClick={() => setOrderStatus('served')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-colors ${
                    orderStatus === 'served' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Servis Edildi
                </button>
                <button
                  type="button"
                  onClick={() => setOrderStatus('completed')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-colors ${
                    orderStatus === 'completed' 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Ödendi
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Ödeme Yöntemi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                    paymentMethod === 'cash'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote size={18} />
                  <span className="text-sm font-medium">Nakit</span>
                  {paymentMethod === 'cash' && <Check size={16} className="absolute right-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                    paymentMethod === 'credit_card'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard size={18} />
                  <span className="text-sm font-medium">Kart</span>
                  {paymentMethod === 'credit_card' && <Check size={16} className="absolute right-3" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-slate-600">Toplam</span>
              <span className="text-2xl font-bold text-slate-900">
                {totalAmount.toFixed(2)} {currency}
              </span>
            </div>
            <button
              type="submit"
              disabled={selectedItemsList.length === 0}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={20} />
              Siparişi Onayla ve Gönder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

