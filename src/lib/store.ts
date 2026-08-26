import { 
  Restaurant, RestaurantTable, Category, Product, 
  Order, OrderItem, ServiceCall, EndOfDayReportData, TableSummary
} from '../types';
import { supabase } from './supabase';
import { showToast } from './toast';
import { defaultMenuTemplate, defaultTables } from '../data/menuTemplate';

// ============================================================
// SUPER ADMIN KREDENSİYELLERİ — SADECE BURASI BİLİR
// ============================================================
export const SUPER_ADMIN_KEY = 'k9Z_super_p2X';  // URL'de ?panel=super
export const SUPER_ADMIN_PASSWORD = 'ZgR_82#M@x!_2026_qRtY'; // Kırılması imkansız şifre
export const SUPER_ADMIN_SESSION_KEY = 'sa_session_v2';

// ============================================================
// BİLDİRİM SESİ
// ============================================================
export const playNotificationSound = (type: 'order' | 'call' | 'success' = 'order', message?: string) => {
  try {
    // 1. Audio Notification
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'order') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.setValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      } else if (type === 'call') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(900, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      }
      osc.start(now);
      osc.stop(now + 1);
    }

    // 2. Vibration API
    if ('vibrate' in navigator) {
      if (type === 'order') {
        navigator.vibrate([200, 100, 200]); // double pulse
      } else if (type === 'call') {
        navigator.vibrate([300]); // single long pulse
      } else {
        navigator.vibrate([100]); // short pulse
      }
    }

    // 3. System Notification API
    if (message && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(type === 'order' ? 'Yeni Sipariş' : 'Masa Çağrısı', {
        body: message,
        icon: '/favicon.ico'
      });
    }

  } catch (e) {
    console.warn('Audio/Notification error:', e);
  }
};

// ============================================================
// ABONELIK KONTROLÜ
// ============================================================
export const getSubscriptionStatus = (restaurant: Restaurant): {
  isActive: boolean;
  daysLeft: number | null;
  isExpiringSoon: boolean;
  isExpired: boolean;
} => {
  if (!restaurant.is_active) {
    return { isActive: false, daysLeft: null, isExpiringSoon: false, isExpired: true };
  }
  if (restaurant.subscription_type === 'unlimited') {
    return { isActive: true, daysLeft: null, isExpiringSoon: false, isExpired: false };
  }
  if (!restaurant.subscription_expires_at) {
    return { isActive: false, daysLeft: null, isExpiringSoon: false, isExpired: true };
  }
  const now = new Date();
  const expires = new Date(restaurant.subscription_expires_at);
  const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    isActive: daysLeft > 0,
    daysLeft,
    isExpiringSoon: daysLeft > 0 && daysLeft <= 3,
    isExpired: daysLeft <= 0,
  };
};

// ============================================================
// RESTAURANT STORE — ÇOK KİRACILI MİMARİ
// ============================================================

class RestaurantStore {
  private static instance: RestaurantStore;
  private listeners: Set<() => void> = new Set();
  private currentRestaurantId: string | null = null;
  private channel: BroadcastChannel | null = null;

  private constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('qr_menu_sync');
      this.channel.onmessage = () => {
        // MUST NOT rebroadcast when receiving from another tab!
        this.notify(false);
      };
    }
  }

  static getInstance(): RestaurantStore {
    if (!RestaurantStore.instance) {
      RestaurantStore.instance = new RestaurantStore();
    }
    return RestaurantStore.instance;
  }

  setCurrentRestaurant(id: string) {
    this.currentRestaurantId = id;
  }

  getCurrentRestaurantId(): string | null {
    return this.currentRestaurantId;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(broadcast: boolean = true) {
    this.listeners.forEach(l => {
      try { l(); } catch (e) { console.error('Listener error', e); }
    });
    if (broadcast && this.channel) {
      try {
        this.channel.postMessage({ ts: Date.now() });
      } catch (e) {
        console.warn('Channel post error', e);
      }
    }
  }

  // LocalStorage key prefixed by restaurant_id for tenant isolation
  private key(suffix: string): string {
    if (!this.currentRestaurantId) return `qr_${suffix}`;
    return `qr_${this.currentRestaurantId}_${suffix}`;
  }

  private get<T>(suffix: string, fallback: T): T {
    try {
      const d = localStorage.getItem(this.key(suffix));
      return d ? JSON.parse(d) : fallback;
    } catch { return fallback; }
  }

  private set<T>(suffix: string, value: T) {
    try {
      localStorage.setItem(this.key(suffix), JSON.stringify(value));
    } catch (e) { console.error('Storage error', e); }
  }

  // ===== ALL RESTAURANTS (for super admin & login) =====
  getAllRestaurants(): Restaurant[] {
    try {
      const d = localStorage.getItem('qr_all_restaurants');
      return d ? JSON.parse(d) : [];
    } catch { return []; }
  }

  saveAllRestaurants(restaurants: Restaurant[]) {
    try {
      localStorage.setItem('qr_all_restaurants', JSON.stringify(restaurants));
    } catch { /* ignore */ }
    this.notify();
  }

  getRestaurantById(id: string): Restaurant | null {
    return this.getAllRestaurants().find(r => r.id === id) || null;
  }

  getRestaurantBySlug(slug: string): Restaurant | null {
    return this.getAllRestaurants().find(r => r.slug === slug) || null;
  }

  async loadRestaurantBySlug(slug: string): Promise<Restaurant | null> {
    let rest = this.getRestaurantBySlug(slug);
    if (!rest) {
      try {
        const { data } = await supabase.from('restaurants').select('*').eq('slug', slug).single();
        if (data) {
          rest = data as Restaurant;
          const all = this.getAllRestaurants();
          if (!all.some(r => r.id === data.id)) {
            this.saveAllRestaurants([...all, rest]);
          }
        }
      } catch (e) {
        console.warn('loadRestaurantBySlug error:', e);
      }
    }
    if (rest) {
      this.setCurrentRestaurant(rest.id);
      await this.syncFromCloud();
    }
    return rest;
  }

  getRestaurantByUsername(username: string): Restaurant | null {
    return this.getAllRestaurants().find(r => r.owner_username === username) || null;
  }

  async createRestaurant(data: {
    name: string;
    slug: string;
    owner_username: string;
    owner_password: string;
    subscription_type: 'unlimited' | 'timed';
    subscription_days?: number;
    max_tables?: number;
  }): Promise<Restaurant> {
    const id = `rest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const expiresAt = data.subscription_type === 'timed' && data.subscription_days
      ? new Date(Date.now() + data.subscription_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const restaurant: Restaurant = {
      id,
      slug: data.slug,
      name: data.name,
      description: '',
      logo_url: '',
      cover_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80&auto=format&fit=crop',
      currency: '₺',
      wifi_name: '',
      wifi_password: '',
      phone: '',
      address: '',
      owner_username: data.owner_username,
      owner_password: data.owner_password,
      setup_completed: false,
      subscription_type: data.subscription_type,
      subscription_expires_at: expiresAt,
      is_active: true,
      payment_pending: false,
      payment_proof_url: null,
      created_at: new Date().toISOString(),
      max_tables: data.max_tables || 25,
      active_sessions: []
    };

    const all = this.getAllRestaurants();
    all.push(restaurant);
    this.saveAllRestaurants(all);

    // Supabase sync
    try {
      await supabase.from('restaurants').insert([{
        id: restaurant.id,
        slug: restaurant.slug,
        name: restaurant.name,
        owner_username: restaurant.owner_username,
        owner_password: restaurant.owner_password,
        subscription_type: restaurant.subscription_type,
        subscription_expires_at: restaurant.subscription_expires_at,
        is_active: true,
        setup_completed: false,
        payment_pending: false,
        created_at: restaurant.created_at,
      }]);
    } catch (e) { console.warn('Supabase createRestaurant:', e); }

    return restaurant;
  }

  async updateRestaurant(id: string, data: Partial<Restaurant>) {
    const all = this.getAllRestaurants().map(r => r.id === id ? { ...r, ...data } : r);
    this.saveAllRestaurants(all);
    // Update current restaurant data in per-tenant store too
    if (this.currentRestaurantId === id) {
      this.set('restaurant', { ...this.getRestaurant(), ...data });
    }
    this.notify();
    try {
      await supabase.from('restaurants').update(data).eq('id', id);
    } catch (e) { console.warn('Supabase updateRestaurant:', e); }
  }

  async deleteRestaurant(id: string) {
    const all = this.getAllRestaurants().filter(r => r.id !== id);
    this.saveAllRestaurants(all);
    try {
      await supabase.from('restaurants').delete().eq('id', id);
    } catch (e) { console.warn('Supabase deleteRestaurant:', e); }
    this.notify();
  }

  // ===== SETUP WIZARD =====
  async completeSetup(restaurantId: string, setupData: {
    name: string;
    logo_url: string;
    cover_url?: string;
    phone?: string;
    address?: string;
    wifi_name?: string;
    wifi_password?: string;
    currency?: string;
  }) {
    const restaurantData: Partial<Restaurant> = {
      ...setupData,
      setup_completed: true,
    };

    await this.updateRestaurant(restaurantId, restaurantData);

    // Initialize default menu template for this restaurant
    this.setCurrentRestaurant(restaurantId);
    await this.initializeDefaultMenu(restaurantId);
    await this.initializeDefaultTables(restaurantId);
  }

  private async initializeDefaultMenu(restaurantId: string) {
    const categories: Category[] = [];
    const products: Product[] = [];

    defaultMenuTemplate.forEach((cat) => {
      const catId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 5)}_${cat.sort_order}`;
      categories.push({
        id: catId,
        restaurant_id: restaurantId,
        name: cat.name,
        icon: cat.icon,
        sort_order: cat.sort_order,
        is_active: true,
      });

      cat.template_products.forEach((prod, pIdx) => {
        const prodId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 5)}_${pIdx}`;
        products.push({
          id: prodId,
          category_id: catId,
          restaurant_id: restaurantId,
          name: prod.name,
          description: prod.description,
          price: prod.price || 0,
          image_url: prod.image_url,
          calories: prod.calories,
          preparation_time_minutes: prod.preparation_time_minutes,
          is_available: true,
          sort_order: prod.sort_order,
        });
      });
    });

    this.set('categories', categories);
    this.set('products', products);

    try {
      await supabase.from('categories').insert(categories.map(c => ({
        id: c.id, restaurant_id: c.restaurant_id, name: c.name,
        icon: c.icon, sort_order: c.sort_order, is_active: true
      })));
      for (const p of products) {
        await supabase.from('products').insert([{
          id: p.id, category_id: p.category_id, restaurant_id: p.restaurant_id,
          name: p.name, description: p.description, price: p.price,
          image_url: p.image_url, calories: p.calories,
          preparation_time_minutes: p.preparation_time_minutes,
          is_available: true, sort_order: p.sort_order
        }]);
      }
    } catch (e) { console.warn('Supabase initMenu:', e); }
  }

  async loadFullDefaultMenu(restaurantId?: string) {
    const id = restaurantId || this.currentRestaurantId;
    if (!id) return;
    try {
      await supabase.from('products').delete().eq('restaurant_id', id);
      await supabase.from('categories').delete().eq('restaurant_id', id);
    } catch (e) { console.warn('Clear old categories error:', e); }
    await this.initializeDefaultMenu(id);
    this.notify();
  }

  private async initializeDefaultTables(restaurantId: string) {
    const rest = this.getRestaurantById(restaurantId);
    const max = rest?.max_tables || 10;
    const tables: RestaurantTable[] = defaultTables(max).map((t, idx) => ({
      id: `tbl_${Date.now()}_${idx}`,
      restaurant_id: restaurantId,
      table_number: t.table_number,
      table_name: t.table_name,
      section: t.section,
      qr_token: `tok_${Math.random().toString(36).substring(2, 10)}`,
      is_active: true,
    }));
    this.set('tables', tables);
    try {
      await supabase.from('restaurant_tables').insert(tables);
    } catch (e) { console.warn('Supabase initTables:', e); }
  }

  // ===== PER-TENANT DATA =====
  getRestaurant(): Restaurant {
    const id = this.currentRestaurantId;
    if (!id) return this.getAllRestaurants()[0] || ({} as Restaurant);
    const all = this.getAllRestaurants();
    return all.find(r => r.id === id) || ({} as Restaurant);
  }

  getTables(): RestaurantTable[] {
    return this.get<RestaurantTable[]>('tables', []);
  }

  getCategories(): Category[] {
    return this.get<Category[]>('categories', []);
  }

  getProducts(): Product[] {
    return this.get<Product[]>('products', []);
  }

  getOrders(): Order[] {
    return this.get<Order[]>('orders', []);
  }

  getServiceCalls(): ServiceCall[] {
    return this.get<ServiceCall[]>('service_calls', []);
  }

  // ===== TABLE MANAGEMENT =====
  async addTable(table: Pick<RestaurantTable, 'table_number' | 'table_name' | 'section'>) {
    const tables = this.getTables();
    const newTable: RestaurantTable = {
      id: `tbl_${Date.now()}`,
      restaurant_id: this.currentRestaurantId || '',
      table_number: table.table_number,
      table_name: table.table_name,
      section: table.section,
      qr_token: `tok_${Math.random().toString(36).substring(2, 10)}`,
      is_active: true,
    };
    const { error } = await supabase.from('restaurant_tables').insert([newTable]);
    
    if (error) {
      showToast('Masa eklenemedi: ' + error.message, 'error');
      throw error;
    }

    this.set('tables', [...tables, newTable]);
    this.notify();
    return newTable;
  }

  async updateTable(id: string, data: Partial<RestaurantTable>) {
    const tables = this.getTables().map(t => t.id === id ? { ...t, ...data } : t);
    this.set('tables', tables);
    this.notify();
    try { await supabase.from('restaurant_tables').update(data).eq('id', id); } catch { /* ignore */ }
  }

  async regenerateTableQR(id: string) {
    const newToken = `tok_${Math.random().toString(36).substring(2, 10)}`;
    await this.updateTable(id, { qr_token: newToken });
  }

  async deleteTable(id: string) {
    this.set('tables', this.getTables().filter(t => t.id !== id));
    this.notify();
    try { await supabase.from('restaurant_tables').delete().eq('id', id); } catch { /* ignore */ }
  }

  // ===== CATEGORY MANAGEMENT =====
  async addCategory(name: string, icon: string = 'Utensils') {
    const cats = this.getCategories();
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      restaurant_id: this.currentRestaurantId || '',
      name, icon,
      sort_order: cats.length + 1,
      is_active: true,
    };
    this.set('categories', [...cats, newCat]);
    this.notify();
    try { await supabase.from('categories').insert([newCat]); } catch { /* ignore */ }
    return newCat;
  }

  async updateCategory(id: string, data: Partial<Category>) {
    this.set('categories', this.getCategories().map(c => c.id === id ? { ...c, ...data } : c));
    this.notify();
    try { await supabase.from('categories').update(data).eq('id', id); } catch { /* ignore */ }
  }

  async deleteCategory(id: string) {
    this.set('categories', this.getCategories().filter(c => c.id !== id));
    this.set('products', this.getProducts().filter(p => p.category_id !== id));
    this.notify();
    try { await supabase.from('categories').delete().eq('id', id); } catch { /* ignore */ }
  }

  // ===== PRODUCT MANAGEMENT =====
  async addProduct(product: Omit<Product, 'id'>) {
    const newProd: Product = { ...product, id: `prod_${Date.now()}` };
    this.set('products', [newProd, ...this.getProducts()]);
    this.notify();
    try { await supabase.from('products').insert([newProd]); } catch { /* ignore */ }
    return newProd;
  }

  async updateProduct(id: string, data: Partial<Product>) {
    this.set('products', this.getProducts().map(p => p.id === id ? { ...p, ...data } : p));
    this.notify();
    try { await supabase.from('products').update(data).eq('id', id); } catch { /* ignore */ }
  }

  async deleteProduct(id: string) {
    this.set('products', this.getProducts().filter(p => p.id !== id));
    this.notify();
    try { await supabase.from('products').delete().eq('id', id); } catch { /* ignore */ }
  }

  // ===== ORDER MANAGEMENT =====
  async createOrder(
    tableNumber: number,
    items: OrderItem[],
    notes: string = '',
    paymentMethod: 'cash' | 'credit_card' = 'cash'
  ): Promise<Order> {
    const total = items.reduce((s, i) => s + i.total_price, 0);
    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      restaurant_id: this.currentRestaurantId || '',
      table_number: tableNumber,
      status: 'pending',
      total_amount: total,
      customer_notes: notes,
      payment_status: 'unpaid',
      payment_method: paymentMethod,
      items,
      created_at: new Date().toISOString(),
    };
    this.set('orders', [newOrder, ...this.getOrders()]);
    this.notify();
    try {
      const { data: ins } = await supabase.from('orders').insert([{
        id: newOrder.id, restaurant_id: newOrder.restaurant_id,
        table_number: tableNumber, status: 'pending',
        total_amount: total, customer_notes: notes,
        payment_method: paymentMethod, payment_status: 'unpaid',
      }]).select().single();
      if (ins) {
        await supabase.from('order_items').insert(items.map(i => ({
          order_id: ins.id, product_name: i.product_name,
          unit_price: i.unit_price, quantity: i.quantity,
          total_price: i.total_price, item_notes: i.item_notes || '',
        })));
      }
    } catch (e) { console.warn('Supabase createOrder:', e); }
    return newOrder;
  }

  async updateOrderStatus(orderId: string, status: Order['status'], paymentStatus?: Order['payment_status']) {
    this.set('orders', this.getOrders().map(o => {
      if (o.id === orderId) return { ...o, status, payment_status: paymentStatus ?? o.payment_status };
      return o;
    }));
    this.notify();
    try {
      await supabase.from('orders').update({ status, ...(paymentStatus ? { payment_status: paymentStatus } : {}) }).eq('id', orderId);
    } catch { /* ignore */ }
  }

  // ===== SERVICE CALLS =====
  async createServiceCall(tableNumber: number, type: 'waiter' | 'bill', paymentType?: 'cash' | 'credit_card'): Promise<ServiceCall> {
    const newCall: ServiceCall = {
      id: `call_${Date.now()}`,
      restaurant_id: this.currentRestaurantId || '',
      table_number: tableNumber,
      type, payment_type: paymentType,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    this.set('service_calls', [newCall, ...this.getServiceCalls()]);
    this.notify();
    try { await supabase.from('service_calls').insert([newCall]); } catch { /* ignore */ }
    return newCall;
  }

  async resolveServiceCall(callId: string) {
    this.set('service_calls', this.getServiceCalls().map(c => c.id === callId ? { ...c, status: 'completed' as const } : c));
    this.notify();
    try { await supabase.from('service_calls').update({ status: 'completed' }).eq('id', callId); } catch { /* ignore */ }
  }

  // ===== END OF DAY REPORT =====
  getEndOfDayReport(): EndOfDayReportData {
    const orders = this.getOrders();
    const tables = this.getTables();
    let total_revenue = 0, total_items_sold = 0, cash_total = 0, credit_card_total = 0;
    const productCounts: { [name: string]: { count: number; revenue: number } } = {};
    const tableMap: { [num: number]: TableSummary } = {};

    tables.forEach(t => {
      tableMap[t.table_number] = {
        table_number: t.table_number, table_name: t.table_name,
        order_count: 0, total_sales: 0, paid_sales: 0, active_orders: 0, items_sold: {},
      };
    });

    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      total_revenue += o.total_amount;
      if (o.payment_method === 'cash') cash_total += o.total_amount;
      if (o.payment_method === 'credit_card') credit_card_total += o.total_amount;
      if (!tableMap[o.table_number]) {
        tableMap[o.table_number] = {
          table_number: o.table_number, table_name: `Masa ${o.table_number}`,
          order_count: 0, total_sales: 0, paid_sales: 0, active_orders: 0, items_sold: {},
        };
      }
      const ts = tableMap[o.table_number];
      ts.order_count++; ts.total_sales += o.total_amount;
      if (o.payment_status === 'paid') ts.paid_sales += o.total_amount;
      if (o.status === 'pending' || o.status === 'preparing') ts.active_orders++;
      (o.items || []).forEach(item => {
        total_items_sold += item.quantity;
        ts.items_sold[item.product_name] = (ts.items_sold[item.product_name] || 0) + item.quantity;
        if (!productCounts[item.product_name]) productCounts[item.product_name] = { count: 0, revenue: 0 };
        productCounts[item.product_name].count += item.quantity;
        productCounts[item.product_name].revenue += item.total_price;
      });
    });

    return {
      date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      total_revenue, total_orders: orders.filter(o => o.status !== 'cancelled').length,
      total_items_sold, cash_total, credit_card_total,
      table_summaries: Object.values(tableMap).sort((a, b) => a.table_number - b.table_number),
      top_products: Object.entries(productCounts).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.count - a.count),
    };
  }

  resetDay() {
    this.set('orders', []);
    this.set('service_calls', []);
    this.notify();
  }

  async registerAdminSession(restaurantId: string, sessionId: string) {
    try {
      await supabase.rpc('enforce_session_limit', {
        p_restaurant_id: restaurantId,
        p_session_id: sessionId
      });
    } catch (e) {
      console.warn('Supabase registerAdminSession:', e);
    }
  }

  // ===== SUPABASE SYNC (initial load) =====
  async syncFromCloud() {
    const id = this.currentRestaurantId;
    if (!id) return;

    try {
      const [{ data: rest }, { data: cats }, { data: prods }, { data: tbls }, { data: ords }, { data: calls }] = await Promise.all([
        supabase.from('restaurants').select('*').eq('id', id).single(),
        supabase.from('categories').select('*').eq('restaurant_id', id).order('sort_order'),
        supabase.from('products').select('*').eq('restaurant_id', id).order('sort_order'),
        supabase.from('restaurant_tables').select('*').eq('restaurant_id', id).order('table_number'),
        supabase.from('orders').select('*, items:order_items(*)').eq('restaurant_id', id).order('created_at', { ascending: false }),
        supabase.from('service_calls').select('*').eq('restaurant_id', id).order('created_at', { ascending: false }),
      ]);

      if (rest) {
        const all = this.getAllRestaurants();
        this.saveAllRestaurants(all.map(r => r.id === id ? { ...r, ...rest } : r));

        const localSession = localStorage.getItem('admin_session_id');
        if (localSession && rest.active_sessions && !rest.active_sessions.includes(localSession)) {
          // Bu oturum atılmış!
          localStorage.removeItem('app_admin_session');
          localStorage.removeItem('admin_session_id');
          window.location.href = '/';
        }
      }

      if (cats && cats.length > 0) this.set('categories', cats);
      if (prods && prods.length > 0) this.set('products', prods);
      if (tbls && tbls.length > 0) this.set('tables', tbls);
      if (ords) this.set('orders', ords);
      if (calls) this.set('service_calls', calls);

      this.notify();
    } catch (e) { console.warn('Supabase syncFromCloud:', e); }
  }

  subscribeToRealtimeUpdates() {
    const id = this.currentRestaurantId;
    if (!id) return;

    supabase.channel(`rt_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants', filter: `id=eq.${id}` }, () => this.syncFromCloud())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${id}` }, (payload) => {
        this.syncFromCloud();
        if (window.location.pathname.startsWith('/admin') || new URLSearchParams(window.location.search).get('admin') === 'true') {
          playNotificationSound('order', `Masa ${(payload.new as any).table_number} Yeni Sipariş Gönderdi!`);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${id}` }, () => this.syncFromCloud())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${id}` }, () => this.syncFromCloud())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'service_calls', filter: `restaurant_id=eq.${id}` }, (payload) => {
        this.syncFromCloud();
        if (window.location.pathname.startsWith('/admin') || new URLSearchParams(window.location.search).get('admin') === 'true') {
          playNotificationSound('call', `Masa ${(payload.new as any).table_number} Çağrı Yaptı!`);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'service_calls', filter: `restaurant_id=eq.${id}` }, () => this.syncFromCloud())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'service_calls', filter: `restaurant_id=eq.${id}` }, () => this.syncFromCloud())
      .subscribe();
  }

  // ===== BACKWARD COMPAT METHODS =====
  async toggleProductAvailability(productId: string) {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      await this.updateProduct(productId, { is_available: !product.is_available });
    }
  }

  resetAllToSample() {
    // Clears all tenant data - for legacy compat
    this.resetDay();
  }
}

export const store = RestaurantStore.getInstance();
