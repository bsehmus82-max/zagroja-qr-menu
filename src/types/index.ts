// ===== TEMEL TİPLER =====

// Backward compat alias
export type OrderStatus = 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled';

// Defined below — forward reference resolved at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CartItem {
  product: any; // Product type (defined below, avoids circular ref)
  quantity: number;
  notes: string;
}


export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo_url: string;
  cover_url: string;
  currency: string;
  wifi_name: string;
  wifi_password: string;
  phone: string;
  address: string;
  owner_username: string;
  owner_password: string;
  setup_completed: boolean;
  subscription_type: 'unlimited' | 'timed';
  subscription_expires_at: string | null;
  is_active: boolean;
  payment_pending: boolean;
  payment_proof_url: string | null;
  created_at: string;
  // Backward compat & optional extras
  wifi_ssid?: string;
  tax_rate?: number;
}


export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  table_number: number;
  table_name: string;
  section: string;
  qr_token: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  calories?: number;
  preparation_time_minutes?: number;
  prep_time_minutes?: number; // backward compat alias
  is_available: boolean;
  is_featured?: boolean; // backward compat
  sort_order: number;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  item_notes?: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_number: number;
  status: 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled';
  total_amount: number;
  customer_notes?: string;
  payment_status: 'unpaid' | 'paid';
  payment_method: 'cash' | 'credit_card';
  items: OrderItem[];
  created_at: string;
  updated_at?: string;
}

export interface ServiceCall {
  id: string;
  restaurant_id: string;
  table_number: number;
  type: 'waiter' | 'bill';
  payment_type?: 'cash' | 'credit_card';
  status: 'active' | 'completed';
  notes?: string;
  created_at: string;
}

export interface TableSummary {
  table_number: number;
  table_name: string;
  order_count: number;
  total_sales: number;
  paid_sales: number;
  active_orders: number;
  items_sold: { [productName: string]: number };
}

export interface EndOfDayReportData {
  date: string;
  total_revenue: number;
  total_orders: number;
  total_items_sold: number;
  cash_total: number;
  credit_card_total: number;
  table_summaries: TableSummary[];
  top_products: { name: string; count: number; revenue: number }[];
}

// Menü şablonu için (her işletme açıldığında yüklenen varsayılan kategoriler)
export interface DefaultCategory {
  name: string;
  icon: string;
  sort_order: number;
  template_products: DefaultProduct[];
}

export interface DefaultProduct {
  name: string;
  description: string;
  price: number; // Her zaman 0 başlar
  image_url: string;
  calories?: number;
  preparation_time_minutes?: number;
  sort_order: number;
}
