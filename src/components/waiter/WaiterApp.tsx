import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Search, Plus, Minus, Trash2, 
  Send, RefreshCw, CheckCircle2, Utensils, LogOut, Download,
  Bell, BellRing, ChefHat, Users, KeyRound, ArrowRight,
  Clock, AlertCircle, Check
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { Business, Category, Product, Table, StaffMember, ServiceRequest, Order } from '../../types';
import { injectGoogleFont, FONT_FAMILY_MAP } from '../../lib/aiBrandThemeEngine';
import { sound } from '../../lib/audio';
import { KitchenKds } from '../kitchen/KitchenKds';

export const WaiterApp: React.FC = () => {
  const toast = useToast();
  const [deviceToken, setDeviceToken] = useState<string | null>(() => localStorage.getItem('restiva_waiter_device_token'));
  const [businessId, setBusinessId] = useState<string | null>(() => localStorage.getItem('restiva_waiter_biz_id'));
  const [business, setBusiness] = useState<Business | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [isApproved, setIsApproved] = useState<boolean>(false);

  // Staff Authentication & Profile State
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [activeStaff, setActiveStaff] = useState<StaffMember | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

  // Active Tab: 'pos' | 'calls' | 'orders' | 'kitchen'
  const [activeTab, setActiveTab] = useState<'pos' | 'calls' | 'orders' | 'kitchen'>('pos');

  // POS State
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<{ product: Product; quantity: number; notes: string }[]>([]);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Live Service Requests (Calls) State
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);

  // Set browser tab title
  useEffect(() => {
    const staffTitle = activeStaff ? `${activeStaff.name} • Personel Terminali` : 'Personel Terminali';
    document.title = business?.name ? `${business.name} • ${staffTitle}` : `RestivAdisyon • ${staffTitle}`;
    if (business?.theme_config?.font_family) {
      injectGoogleFont(business.theme_config.font_family);
    }
  }, [business, activeStaff]);

  // Check device validity on mount
  useEffect(() => {
    if (!deviceToken) {
      setIsVerifying(false);
      setIsApproved(false);
      return;
    }

    const verifyDevice = async () => {
      try {
        setIsVerifying(true);
        const { data, error } = await supabase.rpc('check_device_pairing_status', {
          p_device_token: deviceToken,
        });

        if (error || !data || data.status !== 'approved' || !data.is_trusted) {
          localStorage.removeItem('restiva_waiter_device_token');
          setDeviceToken(null);
          setIsApproved(false);
        } else {
          setIsApproved(true);
          if (data.business_id && data.business_id !== businessId) {
            setBusinessId(data.business_id);
            localStorage.setItem('restiva_waiter_biz_id', data.business_id);
          }
        }
      } catch {
        // fallback
      } finally {
        setIsVerifying(false);
      }
    };

    verifyDevice();
  }, [deviceToken]);

  // Load business, staff list, products & calls
  const loadTerminalData = async () => {
    if (!businessId || !isApproved) return;

    try {
      setLoadingData(true);
      const [bRes, cRes, pRes, tRes, sRes, callsRes, ordersRes] = await Promise.all([
        supabase.from('businesses').select('*').eq('id', businessId).single(),
        supabase.from('categories').select('*').eq('business_id', businessId).eq('is_active', true).order('order_index'),
        supabase.from('products').select('*').eq('business_id', businessId).eq('is_active', true).order('order_index'),
        supabase.from('tables').select('*').eq('business_id', businessId).order('table_no'),
        supabase.from('waiters').select('*').eq('business_id', businessId).eq('is_active', true),
        supabase.from('service_requests').select('*').eq('business_id', businessId).eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').eq('business_id', businessId).in('status', ['pending', 'preparing']).order('created_at', { ascending: false }),
      ]);

      if (bRes.data) setBusiness(bRes.data);
      if (cRes.data) setCategories(cRes.data);
      if (pRes.data) setProducts(pRes.data);
      if (tRes.data) {
        setTables(tRes.data);
        if (tRes.data.length > 0 && !selectedTable) {
          setSelectedTable(tRes.data[0].table_no);
        }
      }
      if (callsRes.data) setServiceRequests(callsRes.data as ServiceRequest[]);
      if (ordersRes.data) setLiveOrders(ordersRes.data as Order[]);

      if (sRes.data) {
        const staff: StaffMember[] = sRes.data.map((w: any) => ({
          id: w.id,
          business_id: w.business_id,
          name: w.name,
          role: w.role || 'waiter',
          pin_code: w.pin_code || '123456',
          permissions: w.permissions || {
            can_take_orders: true,
            can_view_orders: true,
            can_handle_calls: true,
            can_access_pos: false,
            can_access_kitchen: false,
            can_manage_tables: true,
            is_full_access: false,
          },
          is_active: w.is_active !== false,
          created_at: w.created_at,
        }));
        setStaffList(staff);

        // Check if saved staff exists and is still valid
        const savedStaffId = localStorage.getItem('restiva_active_staff_id');
        if (savedStaffId) {
          const found = staff.find((s) => s.id === savedStaffId && s.is_active);
          if (found) {
            setActiveStaff(found);
          } else {
            // Staff was deleted or disabled by the business
            localStorage.removeItem('restiva_active_staff_id');
            setActiveStaff(null);
            setIsPinModalOpen(true);
          }
        } else if (staff.length > 0) {
          setIsPinModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadTerminalData();

    if (!businessId) return;

    // Realtime listener for Calls, Orders, Staff Permissions and Device Revocation
    const channel = supabase
      .channel(`staff-terminal-${businessId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests', filter: `business_id=eq.${businessId}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
            sound.playWaiterCall(business?.sound_preference);
            toast.warning(`Yeni Çağrı: ${payload.new.table_no} masası servis bekliyor!`);
          }
          loadTerminalData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` },
        () => {
          loadTerminalData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'waiters', filter: `business_id=eq.${businessId}` },
        (payload: any) => {
          const currentStaffId = localStorage.getItem('restiva_active_staff_id');
          if (payload.eventType === 'DELETE' && payload.old?.id === currentStaffId) {
            localStorage.removeItem('restiva_active_staff_id');
            setActiveStaff(null);
            setIsPinModalOpen(true);
            toast.error('Personel kaydınız silindi veya erişim yetkiniz kaldırıldı.');
          } else if (payload.eventType === 'UPDATE' && payload.new?.id === currentStaffId && payload.new.is_active === false) {
            localStorage.removeItem('restiva_active_staff_id');
            setActiveStaff(null);
            setIsPinModalOpen(true);
            toast.error('Personel hesabınız devre dışı bırakıldı.');
          }
          loadTerminalData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'waiter_devices', filter: `business_id=eq.${businessId}` },
        (payload: any) => {
          if (deviceToken) {
            if (
              (payload.eventType === 'DELETE' && payload.old?.device_token === deviceToken) ||
              (payload.eventType === 'UPDATE' && payload.new?.device_token === deviceToken && (payload.new?.status !== 'approved' || !payload.new?.is_trusted))
            ) {
              localStorage.removeItem('restiva_waiter_device_token');
              localStorage.removeItem('restiva_waiter_biz_id');
              localStorage.removeItem('restiva_active_staff_id');
              localStorage.removeItem('restiva_waiter_name');
              setDeviceToken(null);
              setIsApproved(false);
              setActiveStaff(null);
              toast.error('Bu cihazın terminal yetkisi işletme tarafından kaldırıldı.');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, isApproved]);

  // Handle PIN Login
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    const matched = staffList.find((s) => s.pin_code === cleanPin);

    if (matched) {
      setActiveStaff(matched);
      localStorage.setItem('restiva_active_staff_id', matched.id);
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError('');
      toast.success(`Hoş geldiniz, ${matched.name}!`);
    } else {
      setPinError('Hatalı PIN kodu. Lütfen tekrar deneyin.');
    }
  };

  const handleSwitchStaff = () => {
    setPinInput('');
    setPinError('');
    setIsPinModalOpen(true);
  };

  const handleAddToCart = (product: Product) => {
    if (product.is_frozen) {
      toast.error('Bu ürün şu an tükendi!');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [{ product, quantity: 1, notes: '' }, ...prev];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number; notes: string }[]
    );
  };

  const handleUpdateItemNote = (productId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, notes: note } : item))
    );
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleSendOrder = async () => {
    if (cart.length === 0) {
      toast.error('Sepete henüz ürün eklemediniz.');
      return;
    }
    if (!selectedTable) {
      toast.error('Lütfen bir masa seçiniz.');
      return;
    }
    if (!businessId || !deviceToken) {
      toast.error('Oturum bilgisi eksik.');
      return;
    }

    const staffName = activeStaff?.name || 'Garson';

    try {
      setIsSendingOrder(true);
      const rpcPayload = {
        p_business_id: businessId,
        p_table_no: selectedTable,
        p_items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          notes: item.notes.trim(),
        })),
        p_customer_notes: orderNotes.trim(),
        p_order_source: 'waiter',
        p_session_token: `waiter_${Date.now()}`,
        p_device_token: deviceToken,
      };

      const { data, error } = await supabase.rpc('create_customer_order', rpcPayload);

      if (error) throw error;

      // Tag the order with the staff name
      if (data?.id) {
        await supabase
          .from('orders')
          .update({ waiter_name: staffName, updated_at: new Date().toISOString() })
          .eq('id', data.id);
      }

      sound.playSuccessTone();
      toast.success(`${selectedTable} siparişi iletildi! (${staffName})`);
      setCart([]);
      setOrderNotes('');
      loadTerminalData();
    } catch (err: any) {
      toast.error('Sipariş iletilemedi: ' + err.message);
    } finally {
      setIsSendingOrder(false);
    }
  };

  // Resolve Service Request (Call)
  const handleResolveCall = async (reqId: string, tableNo: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: 'resolved', updated_at: new Date().toISOString() })
        .eq('id', reqId);

      if (error) throw error;
      toast.success(`${tableNo} çağrısı tamamlandı.`);
      setServiceRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch (err: any) {
      toast.error('İşlem başarısız: ' + err.message);
    }
  };

  // 1. VERIFYING LOADING SCREEN
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#0C1017] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Personel Terminali Doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  // 2. UNPAIRED DEVICE SCREEN
  if (!isApproved || !deviceToken || !businessId) {
    return (
      <div className="min-h-screen bg-[#0C1017] flex items-center justify-center p-4 selection:bg-white/20 selection:text-white font-medium text-slate-200">
        <div className="w-full max-w-sm bg-[#111622] border border-[#1F293D] rounded-3xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1C2433] border border-[#2B384E] text-slate-200 mx-auto flex items-center justify-center shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-base font-black text-white">Terminal Yetkisi Yok</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Bu cihaz henüz işletme yönetiminden onaylanmamıştır. Lütfen işletme panelindeki 
            <strong className="text-white"> "Terminal Eşleme QR Kodu"</strong>nu okutunuz.
          </p>
          <a
            href="/?mode=pair-waiter"
            className="w-full py-3 bg-white hover:bg-slate-200 text-slate-900 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition block"
          >
            <span>Eşleme Talebi Ekranına Git</span>
          </a>
        </div>
      </div>
    );
  }

  const permissions = activeStaff?.permissions || {
    can_take_orders: true,
    can_view_orders: true,
    can_handle_calls: true,
    can_access_pos: false,
    can_access_kitchen: false,
    can_manage_tables: true,
  };

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const fontConfig = business?.theme_config?.font_family
    ? FONT_FAMILY_MAP[business.theme_config.font_family]?.cssFont
    : undefined;

  return (
    <div 
      className="min-h-screen bg-[#0C1017] text-slate-200 flex flex-col selection:bg-white/20 selection:text-white font-medium select-none"
      style={{ fontFamily: fontConfig }}
    >
      {/* Top Header Bar with Staff Profile & Tab Selectors */}
      <header className="sticky top-0 z-30 bg-[#111622] border-b border-white/[0.08] px-4 py-2.5 flex items-center justify-between shadow-md">
        {/* Left: Staff Profile & Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSwitchStaff}
            title="Personel Değiştir"
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/[0.06] transition text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1C2433] border border-white/[0.1] text-white flex items-center justify-center font-black text-xs shadow-sm">
              {activeStaff?.name.slice(0, 1).toUpperCase() || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-black text-white">{activeStaff?.name || 'Personel'}</h1>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400">
                {activeStaff?.role === 'manager' ? 'Müdür' : activeStaff?.role === 'kitchen' ? 'Mutfak Şefi' : activeStaff?.role === 'cashier' ? 'Kasiyer' : 'Garson'}
                {' • '}
                <span className="text-slate-500">Değiştir</span>
              </p>
            </div>
          </button>
        </div>

        {/* Center: Module Tabs */}
        <div className="flex items-center gap-1 bg-[#0C1017] p-1 rounded-xl border border-white/[0.06]">
          {permissions.can_take_orders && (
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'pos'
                  ? 'bg-[#1C2433] text-white border border-white/[0.12] shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Sipariş Gir</span>
            </button>
          )}

          {permissions.can_handle_calls && (
            <button
              onClick={() => setActiveTab('calls')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 relative ${
                activeTab === 'calls'
                  ? 'bg-[#1C2433] text-white border border-white/[0.12] shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Çağrılar</span>
              {serviceRequests.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {serviceRequests.length}
                </span>
              )}
            </button>
          )}

          {permissions.can_view_orders && (
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-[#1C2433] text-white border border-white/[0.12] shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Canlı ({liveOrders.length})</span>
            </button>
          )}

          {permissions.can_access_kitchen && (
            <button
              onClick={() => setActiveTab('kitchen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'kitchen'
                  ? 'bg-[#1C2433] text-white border border-white/[0.12] shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Mutfak Ekranı</span>
            </button>
          )}
        </div>

        {/* Right: Table Selector or Reset */}
        <div className="flex items-center gap-2">
          {activeTab === 'pos' && (
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#0C1017] border border-white/[0.08] text-white text-xs font-bold focus:outline-none"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.table_no}>
                  {t.table_no}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              if (confirm('Bu cihazın eşleşmesini sıfırlamak istiyor musunuz?')) {
                localStorage.removeItem('restiva_waiter_device_token');
                localStorage.removeItem('restiva_active_staff_id');
                setDeviceToken(null);
                setIsApproved(false);
              }
            }}
            title="Cihaz Eşleşmesini Sıfırla"
            className="p-2 rounded-xl bg-[#1C2433] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition border border-white/[0.06]"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* TAB 1: POS WORKSPACE (Masaya Sipariş Gir) */}
      {activeTab === 'pos' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left / Top: Categories & Products Grid */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 pb-28 md:pb-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111622] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none shadow-sm font-medium"
              />
            </div>

            {/* Category Horizontal Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-[#111622] text-slate-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                Tümü ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === c.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'bg-[#111622] text-slate-400 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className={`relative p-3 rounded-2xl border transition cursor-pointer select-none active:scale-95 flex flex-col justify-between ${
                      product.is_frozen
                        ? 'bg-[#111622]/40 border-red-500/20 opacity-50'
                        : inCart
                        ? 'bg-white/10 border-white shadow-sm ring-1 ring-white'
                        : 'bg-[#111622] border-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-slate-900 text-[10px] font-black flex items-center justify-center shadow-sm">
                        {inCart.quantity}
                      </span>
                    )}
                    <div>
                      <h3 className="text-xs font-bold text-white line-clamp-2">{product.name}</h3>
                      {product.description && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{product.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.06]">
                      <span className="text-xs font-extrabold text-white">
                        {product.price.toFixed(2)} ₺
                      </span>
                      <button className="w-6 h-6 rounded-lg bg-[#1C2433] text-slate-300 flex items-center justify-center hover:bg-white hover:text-slate-900 transition border border-white/[0.08]">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right / Bottom Drawer: Active Cart */}
          <div className="w-full md:w-80 lg:w-96 bg-[#111622] border-t md:border-t-0 md:border-l border-white/[0.08] p-4 flex flex-col justify-between shadow-2xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-slate-300" />
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">
                    {selectedTable} Sepeti ({cart.reduce((a, b) => a + b.quantity, 0)})
                  </h2>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Temizle
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="max-h-64 md:max-h-[50vh] overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Henüz ürün eklenmedi.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-2.5 rounded-xl bg-[#0C1017] border border-white/[0.06] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-200">{item.product.name}</h4>
                        <span className="text-xs font-extrabold text-white">
                          {(item.product.price * item.quantity).toFixed(2)} ₺
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, -1)}
                            className="w-6 h-6 rounded-lg bg-[#1C2433] hover:bg-[#253043] text-slate-300 flex items-center justify-center text-xs border border-white/[0.08]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, 1)}
                            className="w-6 h-6 rounded-lg bg-[#1C2433] hover:bg-[#253043] text-slate-300 flex items-center justify-center text-xs border border-white/[0.08]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          placeholder="Not (Örn: Az pişmiş)..."
                          value={item.notes}
                          onChange={(e) => handleUpdateItemNote(item.product.id, e.target.value)}
                          className="w-36 px-2 py-1 rounded-lg bg-[#111622] border border-white/[0.06] text-[10px] text-slate-300 placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* General Order Note */}
              {cart.length > 0 && (
                <div>
                  <input
                    type="text"
                    placeholder="Masa Notu..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0C1017] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Bottom Send Order Action */}
            <div className="pt-3 border-t border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Toplam Tutar:</span>
                <span className="text-base font-black text-white">{totalAmount.toFixed(2)} ₺</span>
              </div>

              <button
                onClick={handleSendOrder}
                disabled={cart.length === 0 || isSendingOrder}
                className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-50 active:scale-95 text-slate-900 font-extrabold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {isSendingOrder ? 'İletiliyor...' : `${selectedTable} Siparişini Gönder (${activeStaff?.name || 'Garson'})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GARSON ÇAĞRILARI */}
      {activeTab === 'calls' && (
        <div className="flex-1 p-4 overflow-y-auto max-w-4xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-400" />
              <span>Bekleyen Garson Çağrıları ({serviceRequests.length})</span>
            </h2>
          </div>

          {serviceRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2 bg-[#111622] rounded-3xl border border-white/[0.06]">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">Bekleyen masa çağrısı yok</p>
              <p className="text-xs text-slate-400">Müşteriler masadan çağrı yaptığında burada anında belirecektir.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {serviceRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-2xl bg-[#111622] border border-amber-500/30 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-white">{req.table_no}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      {req.request_type === 'waiter' ? 'Garson Çağrısı' : req.request_type === 'bill_cash' ? 'Hesap (Nakit)' : 'Hesap (Kart)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(req.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} • Masaya servis bekleniyor
                  </p>
                  <button
                    onClick={() => handleResolveCall(req.id, req.table_no)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Masaya Gittim / Tamamla</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CANLI SİPARİŞ TAKİBİ */}
      {activeTab === 'orders' && (
        <div className="flex-1 p-4 overflow-y-auto max-w-4xl mx-auto w-full space-y-4">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-white" />
            <span>Aktif Masa Siparişleri ({liveOrders.length})</span>
          </h2>

          {liveOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-[#111622] rounded-3xl border border-white/[0.06]">
              Henüz aktif sipariş yok.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {liveOrders.map((order) => (
                <div key={order.id} className="p-4 rounded-2xl bg-[#111622] border border-white/[0.08] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white">{order.table_no}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      order.status === 'preparing' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-slate-300'
                    }`}>
                      {order.status === 'preparing' ? 'Hazırlanıyor' : 'Bekliyor'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-bold text-white">{(item.price * item.quantity).toFixed(2)} ₺</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Toplam: {order.total_amount.toFixed(2)} ₺</span>
                    <span>{order.waiter_name ? `Garson: ${order.waiter_name}` : 'QR Sipariş'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MUTFAK KDS EMBEDDED VIEW */}
      {activeTab === 'kitchen' && business && (
        <div className="flex-1">
          <KitchenKds business={business} />
        </div>
      )}

      {/* MODAL: Personel PIN Girişi / Değiştirme */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#111622] border border-white/[0.1] rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-[#1C2433] flex items-center justify-center mx-auto text-white">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">Personel PIN Girişi</h3>
              <p className="text-xs text-slate-400 mt-0.5">Lütfen 6 haneli personel PIN kodunuzu girin</p>
            </div>

            {pinError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="w-full py-3 bg-[#0C1017] border border-white/[0.1] focus:border-white/40 rounded-2xl text-center text-2xl font-mono tracking-widest text-white focus:outline-none"
              />

              <div className="flex items-center gap-2 pt-2">
                {activeStaff && (
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#1C2433] text-slate-300 font-bold text-xs"
                  >
                    Kapat
                  </button>
                )}
                <button
                  type="submit"
                  disabled={pinInput.length !== 6}
                  className="flex-1 py-2.5 rounded-xl bg-white disabled:opacity-40 text-slate-900 font-black text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Giriş Yap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
