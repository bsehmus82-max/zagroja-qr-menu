import { 
  Restaurant, 
  RestaurantTable, 
  Category, 
  Product, 
  Order, 
  OrderItem, 
  ServiceCall, 
  EndOfDayReportData, 
  TableSummary 
} from '../types';
import { initialRestaurant, initialTables, initialCategories, initialProducts } from '../data/sampleMenu';
import { supabase, isSupabaseConfigured } from './supabase';

// BroadcastChannel for cross-tab realtime sync in local/demo mode
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('qr_menu_realtime_sync')
  : null;

// Audio notification generator using Web Audio API
export const playNotificationSound = (type: 'order' | 'call' | 'success' = 'order') => {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'order') {
      // Pleasant double chime for new order
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'call') {
      // Bell ding for waiter/bill call
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    } else {
      // Short success sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    console.warn('Audio notification failed:', e);
  }
};

// Storage keys
const STORAGE_KEYS = {
  RESTAURANT: 'qr_restaurant_data',
  TABLES: 'qr_tables_data',
  CATEGORIES: 'qr_categories_data',
  PRODUCTS: 'qr_products_data',
  ORDERS: 'qr_orders_data',
  SERVICE_CALLS: 'qr_service_calls_data',
};

// Initial state helpers
const getStored = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
};

const setStored = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (channel) {
      channel.postMessage({ type: 'STORE_UPDATED', key, timestamp: Date.now() });
    }
  } catch (e) {
    console.error('Storage error:', e);
  }
};

export class AppDataStore {
  private static instance: AppDataStore;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => this.notify());
      if (channel) {
        channel.onmessage = () => this.notify();
      }
    }
  }

  public static getInstance(): AppDataStore {
    if (!AppDataStore.instance) {
      AppDataStore.instance = new AppDataStore();
    }
    return AppDataStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- RESTAURANT ---
  public getRestaurant(): Restaurant {
    return getStored<Restaurant>(STORAGE_KEYS.RESTAURANT, initialRestaurant);
  }

  public updateRestaurant(data: Partial<Restaurant>) {
    const current = this.getRestaurant();
    const updated = { ...current, ...data };
    setStored(STORAGE_KEYS.RESTAURANT, updated);
    this.notify();
  }

  // --- TABLES ---
  public getTables(): RestaurantTable[] {
    return getStored<RestaurantTable[]>(STORAGE_KEYS.TABLES, initialTables);
  }

  public addTable(table: Omit<RestaurantTable, 'id' | 'qr_token'>) {
    const tables = this.getTables();
    const newId = `tbl_${Date.now()}`;
    const qrToken = `tok_m${table.table_number}_${Math.random().toString(36).substring(2, 7)}`;
    const newTable: RestaurantTable = {
      ...table,
      id: newId,
      qr_token: qrToken,
      is_active: true,
    };
    setStored(STORAGE_KEYS.TABLES, [...tables, newTable]);
    this.notify();
    return newTable;
  }

  public updateTable(id: string, data: Partial<RestaurantTable>) {
    const tables = this.getTables();
    const updated = tables.map((t) => (t.id === id ? { ...t, ...data } : t));
    setStored(STORAGE_KEYS.TABLES, updated);
    this.notify();
  }

  public regenerateTableQR(id: string) {
    const tables = this.getTables();
    const updated = tables.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          qr_token: `tok_m${t.table_number}_${Math.random().toString(36).substring(2, 7)}_${Date.now().toString().slice(-4)}`,
        };
      }
      return t;
    });
    setStored(STORAGE_KEYS.TABLES, updated);
    this.notify();
  }

  public deleteTable(id: string) {
    const tables = this.getTables();
    setStored(STORAGE_KEYS.TABLES, tables.filter((t) => t.id !== id));
    this.notify();
  }

  // --- CATEGORIES ---
  public getCategories(): Category[] {
    return getStored<Category[]>(STORAGE_KEYS.CATEGORIES, initialCategories);
  }

  public addCategory(name: string, icon = 'Utensils') {
    const cats = this.getCategories();
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      restaurant_id: this.getRestaurant().id,
      name,
      icon,
      sort_order: cats.length + 1,
      is_active: true,
    };
    setStored(STORAGE_KEYS.CATEGORIES, [...cats, newCat]);
    this.notify();
    return newCat;
  }

  public updateCategory(id: string, data: Partial<Category>) {
    const cats = this.getCategories();
    setStored(STORAGE_KEYS.CATEGORIES, cats.map((c) => (c.id === id ? { ...c, ...data } : c)));
    this.notify();
  }

  public deleteCategory(id: string) {
    const cats = this.getCategories();
    setStored(STORAGE_KEYS.CATEGORIES, cats.filter((c) => c.id !== id));
    this.notify();
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return getStored<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts);
  }

  public addProduct(product: Omit<Product, 'id'>) {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}`,
    };
    setStored(STORAGE_KEYS.PRODUCTS, [newProduct, ...products]);
    this.notify();
    return newProduct;
  }

  public updateProduct(id: string, data: Partial<Product>) {
    const products = this.getProducts();
    setStored(STORAGE_KEYS.PRODUCTS, products.map((p) => (p.id === id ? { ...p, ...data } : p)));
    this.notify();
  }

  public toggleProductAvailability(id: string) {
    const products = this.getProducts();
    setStored(
      STORAGE_KEYS.PRODUCTS,
      products.map((p) => (p.id === id ? { ...p, is_available: !p.is_available } : p))
    );
    this.notify();
  }

  public deleteProduct(id: string) {
    const products = this.getProducts();
    setStored(STORAGE_KEYS.PRODUCTS, products.filter((p) => p.id !== id));
    this.notify();
  }

  // --- ORDERS ---
  public getOrders(): Order[] {
    return getStored<Order[]>(STORAGE_KEYS.ORDERS, []);
  }

  public createOrder(tableNumber: number, items: OrderItem[], notes = '', paymentMethod: 'cash' | 'credit_card' = 'cash'): Order {
    const orders = this.getOrders();
    const total = items.reduce((sum, item) => sum + item.total_price, 0);
    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      restaurant_id: this.getRestaurant().id,
      table_number: tableNumber,
      status: 'pending',
      total_amount: total,
      customer_notes: notes,
      payment_status: 'unpaid',
      payment_method: paymentMethod,
      items,
      created_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.ORDERS, [newOrder, ...orders]);
    playNotificationSound('order');
    this.notify();
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: Order['status'], paymentStatus?: Order['payment_status']) {
    const orders = this.getOrders();
    setStored(
      STORAGE_KEYS.ORDERS,
      orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status,
            payment_status: paymentStatus !== undefined ? paymentStatus : o.payment_status,
            updated_at: new Date().toISOString(),
          };
        }
        return o;
      })
    );
    this.notify();
  }

  // --- SERVICE CALLS (GARSON & HESAP) ---
  public getServiceCalls(): ServiceCall[] {
    return getStored<ServiceCall[]>(STORAGE_KEYS.SERVICE_CALLS, []);
  }

  public createServiceCall(tableNumber: number, type: 'waiter' | 'bill', paymentType?: 'cash' | 'credit_card', notes = ''): ServiceCall {
    const calls = this.getServiceCalls();
    const newCall: ServiceCall = {
      id: `call_${Date.now()}`,
      restaurant_id: this.getRestaurant().id,
      table_number: tableNumber,
      type,
      payment_type: paymentType,
      status: 'active',
      notes,
      created_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.SERVICE_CALLS, [newCall, ...calls]);
    playNotificationSound('call');
    this.notify();
    return newCall;
  }

  public resolveServiceCall(callId: string) {
    const calls = this.getServiceCalls();
    setStored(
      STORAGE_KEYS.SERVICE_CALLS,
      calls.map((c) => (c.id === callId ? { ...c, status: 'completed' as const } : c))
    );
    this.notify();
  }

  // --- END OF DAY (GÜN SONU / Z RAPORU) ---
  public getEndOfDayReport(): EndOfDayReportData {
    const orders = this.getOrders();
    const tables = this.getTables();

    let total_revenue = 0;
    let total_items_sold = 0;
    let cash_total = 0;
    let credit_card_total = 0;
    const productCounts: { [name: string]: { count: number; revenue: number } } = {};
    const tableMap: { [tableNum: number]: TableSummary } = {};

    // Initialize all tables in report
    tables.forEach((t) => {
      tableMap[t.table_number] = {
        table_number: t.table_number,
        table_name: t.table_name,
        order_count: 0,
        total_sales: 0,
        paid_sales: 0,
        active_orders: 0,
        items_sold: {},
      };
    });

    orders.forEach((o) => {
      if (o.status !== 'cancelled') {
        total_revenue += o.total_amount;
        if (o.payment_method === 'cash') cash_total += o.total_amount;
        if (o.payment_method === 'credit_card') credit_card_total += o.total_amount;

        if (!tableMap[o.table_number]) {
          tableMap[o.table_number] = {
            table_number: o.table_number,
            table_name: `Masa ${o.table_number}`,
            order_count: 0,
            total_sales: 0,
            paid_sales: 0,
            active_orders: 0,
            items_sold: {},
          };
        }

        const tSummary = tableMap[o.table_number];
        tSummary.order_count += 1;
        tSummary.total_sales += o.total_amount;
        if (o.payment_status === 'paid') tSummary.paid_sales += o.total_amount;
        if (o.status === 'pending' || o.status === 'preparing') tSummary.active_orders += 1;

        if (o.items) {
          o.items.forEach((item) => {
            total_items_sold += item.quantity;
            tSummary.items_sold[item.product_name] = (tSummary.items_sold[item.product_name] || 0) + item.quantity;

            if (!productCounts[item.product_name]) {
              productCounts[item.product_name] = { count: 0, revenue: 0 };
            }
            productCounts[item.product_name].count += item.quantity;
            productCounts[item.product_name].revenue += item.total_price;
          });
        }
      }
    });

    const top_products = Object.entries(productCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);

    return {
      date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      total_revenue,
      total_orders: orders.filter((o) => o.status !== 'cancelled').length,
      total_items_sold,
      cash_total,
      credit_card_total,
      table_summaries: Object.values(tableMap).sort((a, b) => a.table_number - b.table_number),
      top_products,
    };
  }

  public resetDay() {
    setStored(STORAGE_KEYS.ORDERS, []);
    setStored(STORAGE_KEYS.SERVICE_CALLS, []);
    this.notify();
  }

  public resetAllToSample() {
    localStorage.removeItem(STORAGE_KEYS.RESTAURANT);
    localStorage.removeItem(STORAGE_KEYS.TABLES);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.SERVICE_CALLS);
    this.notify();
  }
}

export const store = AppDataStore.getInstance();
