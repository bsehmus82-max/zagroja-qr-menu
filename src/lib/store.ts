// ============================================================
// ZAGROJA PLATFORM — UNIFIED CLOUD STORE
// ============================================================
import { 
  Restaurant, 
  RestaurantTable, 
  Category, 
  Product, 
  Order, 
  OrderItem, 
  ServiceCall, 
  SupportMessage 
} from '../types';
import { supabase } from './supabase';
import { defaultMenuTemplate } from '../data/menuTemplate';

export const SUPER_ADMIN_PASSWORD = 'zagroja2026!';
export const SUPER_ADMIN_SESSION_KEY = 'zagroja_super_admin_session';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const playNotificationSound = (type: 'order' | 'call' | 'bell' | 'success' = 'order', title?: string) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'order' || type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } else if (type === 'call') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime);
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    }

    if (title && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Zagroja Platform', { body: title, icon: '/favicon.svg' });
    }
  } catch { /* ignore */ }
};

class ZagrojaStore {
  private static instance: ZagrojaStore;
  private listeners: Set<() => void> = new Set();
  private currentRestaurantId: string | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        const lastId = localStorage.getItem('zagroja_active_restaurant_id');
        if (lastId) this.currentRestaurantId = lastId;

        const session = localStorage.getItem('zagroja_business_session');
        if (session) {
          const user = JSON.parse(session);
          if (user.restaurantId) this.currentRestaurantId = user.restaurantId;
        }
      } catch { /* ignore */ }
    }
  }

  static getInstance(): ZagrojaStore {
    if (!ZagrojaStore.instance) {
      ZagrojaStore.instance = new ZagrojaStore();
    }
    return ZagrojaStore.instance;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((cb) => cb());
  }

  getCurrentRestaurantId(): string | null {
    return this.currentRestaurantId;
  }

  setCurrentRestaurant(id: string) {
    this.currentRestaurantId = id;
    try {
      localStorage.setItem('zagroja_active_restaurant_id', id);
    } catch { /* ignore */ }
    this.notify();
  }

  private k(suffix: string): string {
    return this.currentRestaurantId ? `zg_${this.currentRestaurantId}_${suffix}` : `zg_${suffix}`;
  }

  // ============================================================
  // RESTAURANTS & MULTI-TENANT MANAGEMENT
  // ============================================================
  getAllRestaurants(): Restaurant[] {
    try {
      const d = localStorage.getItem('zg_all_restaurants');
      return d ? JSON.parse(d) : [];
    } catch { return []; }
  }

  saveAllRestaurants(restaurants: Restaurant[]) {
    try {
      localStorage.setItem('zg_all_restaurants', JSON.stringify(restaurants));
    } catch { /* ignore */ }
    this.notify();
  }

  getRestaurant(): Restaurant {
    const list = this.getAllRestaurants();
    if (this.currentRestaurantId) {
      const found = list.find(r => r.id === this.currentRestaurantId);
      if (found) return found;
    }
    if (list.length > 0) return list[0];
    return {
      id: generateUUID(),
      name: 'İşletme',
      slug: 'isletme',
      currency: '₺',
      owner_username: 'admin',
      subscription_type: 'unlimited',
      is_active: true,
      setup_completed: false,
      max_tables: 25,
      created_at: new Date().toISOString()
    };
  }

  getRestaurantBySlug(slug: string): Restaurant | null {
    return this.getAllRestaurants().find(r => r.slug.toLowerCase() === slug.toLowerCase()) || null;
  }

  getRestaurantByUsername(username: string): Restaurant | null {
    return this.getAllRestaurants().find(r => r.owner_username.toLowerCase() === username.toLowerCase()) || null;
  }

  async loadAllRestaurantsFromCloud(): Promise<Restaurant[]> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        this.saveAllRestaurants(data as Restaurant[]);
        return data as Restaurant[];
      }
    } catch (e) {
      console.warn('loadAllRestaurantsFromCloud error:', e);
    }
    return this.getAllRestaurants();
  }

  async loadRestaurantBySlug(slug: string): Promise<Restaurant | null> {
    try {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        const rest = data as Restaurant;
        const all = this.getAllRestaurants();
        this.saveAllRestaurants([...all.filter(r => r.id !== rest.id), rest]);
        this.setCurrentRestaurant(rest.id);
        await this.syncFromCloud();
        return rest;
      }
    } catch (e) {
      console.warn('loadRestaurantBySlug error:', e);
    }
    return null;
  }

  async createRestaurant(data: {
    name: string;
    slug: string;
    owner_username: string;
    owner_password?: string;
    subscription_type?: 'unlimited' | 'timed';
    subscription_days?: number;
    max_tables?: number;
  }): Promise<Restaurant> {
    const id = generateUUID();
    const newRest: Restaurant = {
      id,
      name: data.name.trim(),
      slug: data.slug.toLowerCase().trim(),
      owner_username: data.owner_username.trim(),
      owner_password: data.owner_password || '123456',
      subscription_type: data.subscription_type || 'unlimited',
      subscription_expires_at: data.subscription_type === 'timed' && data.subscription_days
        ? new Date(Date.now() + data.subscription_days * 24 * 60 * 60 * 1000).toISOString()
        : null,
      is_active: true,
      setup_completed: false,
      max_tables: data.max_tables || 25,
      currency: '₺',
      created_at: new Date().toISOString()
    };

    const all = this.getAllRestaurants();
    this.saveAllRestaurants([...all.filter(r => r.id !== id), newRest]);

    try {
      await supabase.from('restaurants').insert([newRest]);
    } catch (e) {
      console.warn('Supabase createRestaurant error:', e);
    }

    return newRest;
  }

  async updateRestaurant(id: string, updates: Partial<Restaurant>) {
    const all = this.getAllRestaurants();
    const updated = all.map(r => r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r);
    this.saveAllRestaurants(updated);

    try {
      await supabase.from('restaurants').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Supabase updateRestaurant error:', e);
    }
  }

  async deleteRestaurant(id: string) {
    const all = this.getAllRestaurants().filter(r => r.id !== id);
    this.saveAllRestaurants(all);

    try {
      await supabase.from('restaurants').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteRestaurant error:', e);
    }
  }

  async completeSetup(restId?: string, updates?: Partial<Restaurant>) {
    const targetId = restId || this.currentRestaurantId;
    if (targetId) {
      await this.updateRestaurant(targetId, { setup_completed: true, ...(updates || {}) });
    }
  }

  async authenticateOwner(username: string, password: string): Promise<{ success: boolean; restaurant?: Restaurant; error?: string }> {
    try {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .ilike('owner_username', username.trim())
        .maybeSingle();

      if (data) {
        const rest = data as Restaurant;
        if (!rest.is_active) {
          return { success: false, error: 'Hesabınız yönetici tarafından askıya alınmış.' };
        }
        if (rest.owner_password && rest.owner_password !== password.trim()) {
          return { success: false, error: 'Hatalı şifre girdiniz.' };
        }
        this.setCurrentRestaurant(rest.id);
        const all = this.getAllRestaurants();
        this.saveAllRestaurants([...all.filter(r => r.id !== rest.id), rest]);
        await this.syncFromCloud();
        return { success: true, restaurant: rest };
      }
    } catch { /* ignore */ }

    const local = this.getAllRestaurants().find(r => r.owner_username.toLowerCase() === username.toLowerCase());
    if (local) {
      if (!local.is_active) return { success: false, error: 'Hesabınız askıya alınmış.' };
      if (local.owner_password && local.owner_password !== password.trim()) return { success: false, error: 'Hatalı şifre.' };
      this.setCurrentRestaurant(local.id);
      return { success: true, restaurant: local };
    }

    return { success: false, error: 'Kullanıcı adı bulunamadı.' };
  }

  // ============================================================
  // TABLES MANAGEMENT (İSİMLİ MASALAR & QR KODLAR)
  // ============================================================
  getTables(): RestaurantTable[] {
    try {
      const d = localStorage.getItem(this.k('tables'));
      return d ? JSON.parse(d) : [];
    } catch { return []; }
  }

  saveTables(tables: RestaurantTable[]) {
    try {
      localStorage.setItem(this.k('tables'), JSON.stringify(tables));
    } catch { /* ignore */ }
    this.notify();
  }

  async addTable(data: { table_number: number; table_name: string; section?: string }): Promise<RestaurantTable> {
    const restId = this.currentRestaurantId || generateUUID();
    const newTable: RestaurantTable = {
      id: generateUUID(),
      restaurant_id: restId,
      table_number: data.table_number,
      table_name: data.table_name || `Masa ${data.table_number}`,
      section: data.section || 'Ana Salon',
      qr_token: generateUUID().substring(0, 8),
      is_active: true,
      created_at: new Date().toISOString()
    };

    const current = this.getTables();
    this.saveTables([...current, newTable]);

    try {
      await supabase.from('restaurant_tables').insert([newTable]);
    } catch (e) {
      console.warn('Supabase addTable error:', e);
    }
    return newTable;
  }

  async updateTable(id: string, updates: Partial<RestaurantTable>) {
    const current = this.getTables();
    const updated = current.map(t => t.id === id ? { ...t, ...updates } : t);
    this.saveTables(updated);

    try {
      await supabase.from('restaurant_tables').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Supabase updateTable error:', e);
    }
  }

  async regenerateTableQR(id: string): Promise<string> {
    const newToken = generateUUID().substring(0, 8);
    await this.updateTable(id, { qr_token: newToken });
    return newToken;
  }

  async deleteTable(id: string) {
    const current = this.getTables().filter(t => t.id !== id);
    this.saveTables(current);

    try {
      await supabase.from('restaurant_tables').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteTable error:', e);
    }
  }

  // ============================================================
  // CATEGORIES & PRODUCTS
  // ============================================================
  getCategories(): Category[] {
    try {
      const d = localStorage.getItem(this.k('categories'));
      return d ? JSON.parse(d) : [];
    } catch { return []; }
  }

  saveCategories(categories: Category[]) {
    try {
      localStorage.setItem(this.k('categories'), JSON.stringify(categories));
    } catch { /* ignore */ }
    this.notify();
  }

  async addCategory(name: string, icon?: string): Promise<Category> {
    const restId = this.currentRestaurantId || generateUUID();
    const newCat: Category = {
      id: generateUUID(),
      restaurant_id: restId,
      name: name.trim(),
      icon: icon || 'Utensils',
      sort_order: this.getCategories().length + 1,
      is_active: true,
      created_at: new Date().toISOString()
    };

    const current = this.getCategories();
    this.saveCategories([...current, newCat]);

    try {
      await supabase.from('categories').insert([newCat]);
    } catch (e) {
      console.warn('Supabase addCategory error:', e);
    }
    return newCat;
  }

  async deleteCategory(id: string) {
    const current = this.getCategories().filter(c => c.id !== id);
    this.saveCategories(current);
    try {
      await supabase.from('categories').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteCategory error:', e);
    }
  }

  getProducts(): Product[] {
    try {
      const d = localStorage.getItem(this.k('products'));
      return d ? JSON.parse(d) : [];
    } catch { return []; }
  }

  saveProducts(products: Product[]) {
    try {
      localStorage.setItem(this.k('products'), JSON.stringify(products));
    } catch { /* ignore */ }
    this.notify();
  }

  async addProduct(data: {
    category_id: string;
    name: string;
    price: number;
    description?: string;
    image_url?: string;
    is_available?: boolean;
    is_featured?: boolean;
    restaurant_id?: string;
    prep_time_minutes?: number;
    preparation_time_minutes?: number;
    calories?: number;
    sort_order?: number;
  }): Promise<Product> {
    const restId = data.restaurant_id || this.currentRestaurantId || generateUUID();
    const newProd: Product = {
      id: generateUUID(),
      restaurant_id: restId,
      category_id: data.category_id,
      name: data.name.trim(),
      price: data.price,
      description: data.description || '',
      image_url: data.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
      prep_time_minutes: data.prep_time_minutes || data.preparation_time_minutes || 15,
      is_available: data.is_available ?? true,
      sort_order: this.getProducts().length + 1,
      created_at: new Date().toISOString()
    };

    const current = this.getProducts();
    this.saveProducts([...current, newProd]);

    try {
      await supabase.from('products').insert([newProd]);
    } catch (e) {
      console.warn('Supabase addProduct error:', e);
    }
    return newProd;
  }

  async updateProduct(id: string, updates: Partial<Product>) {
    const current = this.getProducts();
    const updated = current.map(p => p.id === id ? { ...p, ...updates } : p);
    this.saveProducts(updated);

    try {
      await supabase.from('products').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Supabase updateProduct error:', e);
    }
  }

  async deleteProduct(id: string) {
    const current = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(current);

    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteProduct error:', e);
    }
  }

  async toggleProductAvailability(productId: string) {
    const product = this.getProducts().find(p => p.id === productId);
    if (product) {
      await this.updateProduct(productId, { is_available: !product.is_available });
    }
  }

  async loadFullDefaultMenu() {
    if (!this.currentRestaurantId) return;
    for (const catTpl of defaultMenuTemplate) {
      const cat = await this.addCategory(catTpl.name, catTpl.icon);
      if (catTpl.template_products) {
        for (const prodTpl of catTpl.template_products) {
          await this.addProduct({
            category_id: cat.id,
            name: prodTpl.name,
            price: prodTpl.price,
            description: prodTpl.description,
            image_url: prodTpl.image_url
          });
        }
      }
    }
  }

  // ============================================================
  // ORDERS & LIVE ORDER STREAM
  // ============================================================
  getOrders(): Order[] {
    try {
      const d = localStorage.getItem(this.k('orders'));
      return d ? JSON.parse(d) : [];
    } catch { return []; }
  }

  saveOrders(orders: Order[]) {
    try {
      localStorage.setItem(this.k('orders'), JSON.stringify(orders));
    } catch { /* ignore */ }
    this.notify();
  }

  async createOrder(
    tableNumOrData: number | {
      table_number: number;
      table_name?: string;
      items: any[];
      payment_method?: any;
      customer_note?: string;
      customer_notes?: string;
    },
    itemsArg?: any[],
    customerNotesArg?: string,
    paymentMethodArg?: any
  ): Promise<Order> {
    let table_number: number;
    let table_name: string;
    let items: any[];
    let payment_method: any = 'unpaid';
    let customer_note: string | null = null;

    if (typeof tableNumOrData === 'object') {
      table_number = tableNumOrData.table_number;
      table_name = tableNumOrData.table_name || `Masa ${table_number}`;
      items = tableNumOrData.items || [];
      payment_method = tableNumOrData.payment_method || 'unpaid';
      customer_note = tableNumOrData.customer_note || tableNumOrData.customer_notes || null;
    } else {
      table_number = tableNumOrData;
      table_name = `Masa ${table_number}`;
      items = itemsArg || [];
      customer_note = customerNotesArg || null;
      payment_method = paymentMethodArg || 'unpaid';
    }

    const restId = this.currentRestaurantId || generateUUID();
    const orderId = generateUUID();
    const total = items.reduce((sum: number, item: any) => sum + (item.unit_price || item.product?.price || 0) * (item.quantity || 1), 0);

    const orderItems: OrderItem[] = items.map((i: any) => ({
      id: generateUUID(),
      product_id: i.product_id || i.product?.id || generateUUID(),
      product_name: i.product_name || i.product?.name || 'Ürün',
      quantity: i.quantity || 1,
      unit_price: i.unit_price || i.product?.price || 0,
      total_price: (i.unit_price || i.product?.price || 0) * (i.quantity || 1),
      notes: i.notes || i.item_notes || ''
    }));

    const newOrder: Order = {
      id: orderId,
      restaurant_id: restId,
      table_number,
      table_name,
      status: 'pending',
      payment_status: payment_method && payment_method !== 'unpaid' ? 'paid' : 'unpaid',
      payment_method,
      total_amount: total,
      customer_note,
      customer_notes: customer_note,
      items: orderItems,
      created_at: new Date().toISOString()
    };

    const current = this.getOrders();
    this.saveOrders([newOrder, ...current]);
    playNotificationSound('order', `Masa ${table_number}: Yeni Sipariş Alındı!`);

    try {
      await supabase.from('orders').insert([{
        id: newOrder.id,
        restaurant_id: newOrder.restaurant_id,
        table_number: newOrder.table_number,
        table_name: newOrder.table_name,
        status: newOrder.status,
        payment_status: newOrder.payment_status,
        payment_method: newOrder.payment_method,
        total_amount: newOrder.total_amount,
        customer_note: newOrder.customer_note,
        created_at: newOrder.created_at
      }]);

      if (orderItems.length > 0) {
        await supabase.from('order_items').insert(
          orderItems.map(item => ({
            id: item.id,
            order_id: orderId,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            notes: item.notes
          }))
        );
      }
    } catch (e) {
      console.warn('Supabase createOrder error:', e);
    }

    return newOrder;
  }

  async updateOrderStatus(orderId: string, status: 'pending' | 'preparing' | 'delivered' | 'cancelled' | 'served' | 'completed', payment_status?: 'paid' | 'unpaid') {
    const current = this.getOrders();
    const updated = current.map(o => o.id === orderId ? { ...o, status, ...(payment_status ? { payment_status } : {}) } : o);
    this.saveOrders(updated);

    try {
      await supabase.from('orders').update({ status, ...(payment_status ? { payment_status } : {}) }).eq('id', orderId);
    } catch (e) {
      console.warn('Supabase updateOrderStatus error:', e);
    }
  }

  async updatePaymentStatus(orderId: string, payment_status: 'paid' | 'unpaid', payment_method: 'cash' | 'credit_card' | 'online' = 'cash', _notes?: string) {
    const current = this.getOrders();
    const updated = current.map(o => o.id === orderId ? { ...o, payment_status, payment_method } : o);
    this.saveOrders(updated);

    try {
      await supabase.from('orders').update({ payment_status, payment_method }).eq('id', orderId);
    } catch (e) {
      console.warn('Supabase updatePaymentStatus error:', e);
    }
  }

  // ============================================================
  // SERVICE CALLS (GARSON ÇAĞIR & HESAP İSTE)
  // ============================================================
  getServiceCalls(): ServiceCall[] {
    try {
      const d = localStorage.getItem(this.k('service_calls'));
      return d ? JSON.parse(d) : [];
    } catch { return []; }
  }

  saveServiceCalls(calls: ServiceCall[]) {
    try {
      localStorage.setItem(this.k('service_calls'), JSON.stringify(calls));
    } catch { /* ignore */ }
    this.notify();
  }

  async createServiceCall(
    tableNumOrData: number | { table_number: number; table_name?: string; call_type?: any; type?: any; payment_type?: string },
    callTypeArg?: any,
    paymentTypeArg?: string
  ): Promise<ServiceCall> {
    let table_number: number;
    let table_name: string;
    let call_type: any;
    let payment_type: string | undefined;

    if (typeof tableNumOrData === 'object') {
      table_number = tableNumOrData.table_number;
      table_name = tableNumOrData.table_name || `Masa ${table_number}`;
      call_type = tableNumOrData.call_type || tableNumOrData.type || 'waiter';
      payment_type = tableNumOrData.payment_type;
    } else {
      table_number = tableNumOrData;
      table_name = `Masa ${table_number}`;
      call_type = callTypeArg || 'waiter';
      payment_type = paymentTypeArg;
    }

    const restId = this.currentRestaurantId || generateUUID();
    const newCall: ServiceCall = {
      id: generateUUID(),
      restaurant_id: restId,
      table_number,
      table_name,
      call_type,
      type: call_type,
      payment_type,
      status: 'active',
      created_at: new Date().toISOString()
    };

    const current = this.getServiceCalls();
    this.saveServiceCalls([newCall, ...current]);
    playNotificationSound('call', `Masa ${table_number}: ${call_type === 'bill' ? 'Hesap İstendi' : 'Garson Çağrıldı'}!`);

    try {
      await supabase.from('service_calls').insert([newCall]);
    } catch (e) {
      console.warn('Supabase createServiceCall error:', e);
    }
    return newCall;
  }

  async completeServiceCall(id: string) {
    const current = this.getServiceCalls();
    const updated = current.map(c => c.id === id ? { ...c, status: 'completed' as const } : c);
    this.saveServiceCalls(updated);

    try {
      await supabase.from('service_calls').update({ status: 'completed' }).eq('id', id);
    } catch (e) {
      console.warn('Supabase completeServiceCall error:', e);
    }
  }

  async resolveServiceCall(id: string) {
    return this.completeServiceCall(id);
  }

  // ============================================================
  // END OF DAY REPORT
  // ============================================================
  getEndOfDayReport(): any {
    const orders = this.getOrders();
    const tables = this.getTables();
    const calls = this.getServiceCalls();

    const total_revenue = orders
      .filter(o => o.payment_status === 'paid' || o.status === 'completed' || o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const cash_revenue = orders
      .filter(o => o.payment_method === 'cash' && (o.payment_status === 'paid' || o.status === 'completed'))
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const card_revenue = orders
      .filter(o => o.payment_method === 'credit_card' && (o.payment_status === 'paid' || o.status === 'completed'))
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const online_revenue = orders
      .filter(o => o.payment_method === 'online' && (o.payment_status === 'paid' || o.status === 'completed'))
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    let total_items_sold = 0;
    const productMap = new Map<string, { name: string; count: number; quantity: number; revenue: number }>();
    orders.forEach(o => {
      o.items?.forEach(item => {
        const qty = item.quantity || 1;
        total_items_sold += qty;
        const existing = productMap.get(item.product_name) || { name: item.product_name, count: 0, quantity: 0, revenue: 0 };
        existing.count += qty;
        existing.quantity += qty;
        existing.revenue += item.total_price || (item.unit_price * qty) || 0;
        productMap.set(item.product_name, existing);
      });
    });

    const top_products = Array.from(productMap.values()).sort((a, b) => b.count - a.count);

    const table_summaries = tables.map(t => {
      const tOrders = orders.filter(o => o.table_number === t.table_number);
      const total_sales = tOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const paid_sales = tOrders.filter(o => o.payment_status === 'paid' || o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const active_orders = tOrders.filter(o => o.status === 'pending' || o.status === 'preparing').length;

      const items_sold: { [name: string]: number } = {};
      tOrders.forEach(o => {
        o.items?.forEach(item => {
          items_sold[item.product_name] = (items_sold[item.product_name] || 0) + (item.quantity || 1);
        });
      });

      return {
        table_number: t.table_number,
        table_name: t.table_name || `Masa ${t.table_number}`,
        order_count: tOrders.length,
        total_sales,
        paid_sales,
        active_orders,
        items_sold
      };
    });

    return {
      date: new Date().toLocaleDateString('tr-TR'),
      total_revenue,
      cash_revenue,
      cash_total: cash_revenue,
      card_revenue,
      credit_card_total: card_revenue,
      online_revenue,
      total_orders: orders.length,
      total_items_sold,
      completed_orders: orders.filter(o => o.status === 'completed' || o.status === 'delivered').length,
      cancelled_orders: orders.filter(o => o.status === 'cancelled').length,
      total_service_calls: calls.length,
      popular_products: top_products,
      top_products,
      table_performance: table_summaries.map(t => ({ table_number: t.table_number, order_count: t.order_count, revenue: t.total_sales })),
      table_summaries
    };
  }

  // ============================================================
  // CANLI DESTEK & SOHBET (5 GÜNLÜK DÖNGÜ)
  // ============================================================
  getSupportMessages(restaurantId?: string): SupportMessage[] {
    const targetId = restaurantId || this.currentRestaurantId;
    const all = this.getAllSupportMessages();
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    const valid = all.filter(m => new Date(m.created_at).getTime() >= fiveDaysAgo);

    if (valid.length !== all.length) {
      this.saveAllSupportMessages(valid);
    }

    if (!targetId) return valid;
    return valid.filter(m => m.restaurant_id === targetId);
  }

  private getAllSupportMessages(): SupportMessage[] {
    try {
      const d = localStorage.getItem('zg_support_messages');
      return d ? JSON.parse(d) : [];
    } catch { return []; }
  }

  private saveAllSupportMessages(messages: SupportMessage[]) {
    try {
      localStorage.setItem('zg_support_messages', JSON.stringify(messages));
    } catch { /* ignore */ }
    this.notify();
  }

  async sendSupportMessage(data: {
    restaurant_id: string;
    restaurant_name: string;
    sender_type: 'business' | 'superadmin';
    sender_name: string;
    message: string;
  }): Promise<SupportMessage> {
    const newMsg: SupportMessage = {
      id: generateUUID(),
      restaurant_id: data.restaurant_id,
      restaurant_name: data.restaurant_name,
      sender_type: data.sender_type,
      sender_name: data.sender_name,
      message: data.message.trim(),
      created_at: new Date().toISOString(),
      is_read: false
    };

    const all = this.getAllSupportMessages();
    this.saveAllSupportMessages([...all, newMsg]);

    try {
      await supabase.from('support_messages').insert([newMsg]);
    } catch (e) {
      console.warn('Supabase sendSupportMessage error:', e);
    }
    return newMsg;
  }

  async markSupportMessagesAsRead(restaurantId: string, readBy: 'business' | 'superadmin') {
    const all = this.getAllSupportMessages();
    const targetSender = readBy === 'superadmin' ? 'business' : 'superadmin';
    const updated = all.map(m => (m.restaurant_id === restaurantId && m.sender_type === targetSender) ? { ...m, is_read: true } : m);
    this.saveAllSupportMessages(updated);

    try {
      await supabase.from('support_messages').update({ is_read: true }).eq('restaurant_id', restaurantId).eq('sender_type', targetSender);
    } catch (e) {
      console.warn('Supabase markSupportMessagesAsRead error:', e);
    }
  }

  async loadSupportMessagesFromCloud(restaurantId?: string): Promise<SupportMessage[]> {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    try {
      let q = supabase.from('support_messages').select('*').gte('created_at', fiveDaysAgo).order('created_at', { ascending: true });
      if (restaurantId) q = q.eq('restaurant_id', restaurantId);
      const { data } = await q;
      if (data) {
        const local = this.getAllSupportMessages();
        const map = new Map<string, SupportMessage>();
        local.forEach(m => map.set(m.id, m));
        (data as SupportMessage[]).forEach(m => map.set(m.id, m));
        const merged = Array.from(map.values()).filter(m => new Date(m.created_at).getTime() >= (Date.now() - 5 * 24 * 60 * 60 * 1000));
        this.saveAllSupportMessages(merged);
        return restaurantId ? merged.filter(m => m.restaurant_id === restaurantId) : merged;
      }
    } catch (e) {
      console.warn('loadSupportMessagesFromCloud error:', e);
    }
    return this.getSupportMessages(restaurantId);
  }

  // ============================================================
  // FULL CLOUD SYNC
  // ============================================================
  async syncFromCloud() {
    if (!this.currentRestaurantId) return;
    const restId = this.currentRestaurantId;

    try {
      const [tRes, cRes, pRes, oRes, sRes] = await Promise.all([
        supabase.from('restaurant_tables').select('*').eq('restaurant_id', restId).order('table_number', { ascending: true }),
        supabase.from('categories').select('*').eq('restaurant_id', restId).order('sort_order', { ascending: true }),
        supabase.from('products').select('*').eq('restaurant_id', restId).order('sort_order', { ascending: true }),
        supabase.from('orders').select('*, items:order_items(*)').eq('restaurant_id', restId).order('created_at', { ascending: false }).limit(100),
        supabase.from('service_calls').select('*').eq('restaurant_id', restId).order('created_at', { ascending: false }).limit(50)
      ]);

      if (tRes.data) this.saveTables(tRes.data as RestaurantTable[]);
      if (cRes.data) this.saveCategories(cRes.data as Category[]);
      if (pRes.data) this.saveProducts(pRes.data as Product[]);
      if (oRes.data) this.saveOrders(oRes.data as Order[]);
      if (sRes.data) this.saveServiceCalls(sRes.data as ServiceCall[]);
    } catch (e) {
      console.warn('syncFromCloud error:', e);
    }
  }

  resetDay() {
    this.saveOrders([]);
    this.saveServiceCalls([]);
  }
}

export const store = ZagrojaStore.getInstance();
