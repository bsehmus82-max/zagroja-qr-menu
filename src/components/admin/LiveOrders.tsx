import React, { useState } from 'react';
import { Order, ServiceCall, OrderStatus } from '../../types';
import { store, playNotificationSound } from '../../lib/store';
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  XCircle, 
  BellRing, 
  Receipt, 
  CreditCard, 
  Banknote,
  Volume2,
  VolumeX,
  Sparkles,
  ShoppingBag,
  Check
} from 'lucide-react';

interface LiveOrdersProps {
  orders: Order[];
  serviceCalls: ServiceCall[];
  currency: string;
  onOpenManualOrder?: () => void;
}

export const LiveOrders: React.FC<LiveOrdersProps> = ({
  orders,
  serviceCalls,
  currency,
  onOpenManualOrder,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'calls'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active service calls
  const activeCalls = serviceCalls.filter((c) => c.status === 'active');

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    if (filter === 'pending') return order.status === 'pending';
    if (filter === 'preparing') return order.status === 'preparing';
    return order.status !== 'completed' && order.status !== 'cancelled';
  });

  const handleUpdateStatus = (orderId: string, status: OrderStatus, paymentStatus?: 'paid' | 'unpaid') => {
    store.updateOrderStatus(orderId, status, paymentStatus);
    if (soundEnabled) playNotificationSound('success');
  };

  const handleResolveCall = (callId: string) => {
    store.resolveServiceCall(callId);
    if (soundEnabled) playNotificationSound('success');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Sound Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Canlı Sipariş & Servis Masası</span>
            {activeCalls.length > 0 && (
              <span className="bg-rose-500 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full animate-bounce">
                {activeCalls.length} Çağrı
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Masalardan gelen siparişler ve garson/hesap istekleri anlık olarak buraya düşer.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Manuel Masa Siparişi Butonu */}
          {onOpenManualOrder && (
            <button
              onClick={onOpenManualOrder}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-orange-500 to-amber-600 hover:brightness-105 text-white shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Receipt className="w-4 h-4" />
              <span>+ Masaya Sipariş / Ciro Ekle</span>
            </button>
          )}

          {/* Sound alert toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Ses Açık' : 'Ses Kapalı'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Aktif Siparişler ({orders.filter((o) => o.status === 'pending' || o.status === 'preparing').length})
        </button>

        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'pending'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          Bekleyenler ({orders.filter((o) => o.status === 'pending').length})
        </button>

        <button
          onClick={() => setFilter('preparing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'preparing'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
          }`}
        >
          Hazırlananlar ({orders.filter((o) => o.status === 'preparing').length})
        </button>

        <button
          onClick={() => setFilter('calls')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'calls'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
          }`}
        >
          Garson & Hesap Çağrıları ({activeCalls.length})
        </button>
      </div>

      {/* Active Service Calls Banner Section */}
      {activeCalls.length > 0 && filter !== 'pending' && filter !== 'preparing' && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
            <BellRing className="w-4 h-4 animate-pulse" /> Acil Masa Bildirimleri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeCalls.map((call) => (
              <div
                key={call.id}
                className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-pulse-subtle"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
                    {call.type === 'waiter' ? <BellRing className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      Masa {call.table_number}
                    </div>
                    <div className="text-xs font-semibold text-rose-700">
                      {call.type === 'waiter'
                        ? '🛎️ Garson Çağrısı'
                        : `💳 Hesap Talebi (${call.payment_type === 'cash' ? 'Nakit' : 'Kredi Kartı'})`}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(call.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleResolveCall(call.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 transition-all"
                >
                  <Check className="w-3.5 h-3.5" /> İlgilenildi
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Grid */}
      {filter !== 'calls' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">Aktif Sipariş Bulunmuyor</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Müşteriler masalardan QR kod okutup sipariş verdiklerinde burada anlık sesli ve görsel bildirimle belirecektir.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all ${
                  order.status === 'pending'
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : order.status === 'preparing'
                    ? 'border-blue-300'
                    : 'border-emerald-300'
                }`}
              >
                {/* Order Top Bar */}
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center">
                        M{order.table_number}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Masa {order.table_number}</h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {order.status === 'pending' && (
                        <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600 animate-spin" /> Yeni Sipariş
                        </span>
                      )}
                      {order.status === 'preparing' && (
                        <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <ChefHat className="w-3 h-3 text-blue-600 animate-bounce" /> Hazırlanıyor
                        </span>
                      )}
                      {order.status === 'served' && (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Servis Edildi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="py-3 space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs">
                        <div>
                          <span className="font-bold text-slate-800">
                            {item.quantity}x {item.product_name}
                          </span>
                          {item.item_notes && (
                            <p className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5">
                              Not: {item.item_notes}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-slate-600">
                          {item.total_price.toFixed(2)} {currency}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Customer General Note */}
                  {order.customer_notes && (
                    <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-2 text-[11px] text-amber-800 mb-3">
                      <strong>Masa Notu:</strong> {order.customer_notes}
                    </div>
                  )}

                  {/* Payment Method Badge */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                    <span className="flex items-center gap-1">
                      {order.payment_method === 'credit_card' ? (
                        <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      {order.payment_method === 'credit_card' ? 'Kredi Kartı' : 'Nakit'}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {order.total_amount.toFixed(2)} {currency}
                    </span>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 mt-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <ChefHat className="w-3.5 h-3.5" /> Mutfağa Al (Hazırla)
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'served')}
                      className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Masaya Servis Et
                    </button>
                  )}

                  {order.status === 'served' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'completed', 'paid')}
                      className="col-span-2 bg-slate-900 hover:bg-black text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Hesabı Kapat (Ödendi)
                    </button>
                  )}

                  <button
                    onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                    className="col-span-2 text-rose-500 hover:bg-rose-50 py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <XCircle className="w-3 h-3" /> Siparişi İptal Et
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
