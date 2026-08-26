// ============================================================
// ZAGROJA PLATFORM — TYPES & INTERFACES
// ============================================================

export type SubscriptionType = 'unlimited' | 'timed';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  system_type?: string;
  description?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  phone?: string | null;
  address?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
  wifi_ssid?: string | null;
  currency: string;
  owner_username: string;
  owner_password?: string;
  subscription_type: SubscriptionType;
  subscription_expires_at?: string | null;
  is_active: boolean;
  setup_completed: boolean;
  payment_pending?: boolean;
  payment_proof_url?: string | null;
  max_tables?: number;
  tax_rate?: number;
  created_at: string;
  updated_at?: string;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  table_number: number;
  table_name: string;
  section: string;
  qr_token: string;
  is_active: boolean;
  created_at?: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface DefaultCategory {
  id?: string;
  name: string;
  icon?: string;
  sort_order: number;
  template_products?: any[];
}

export interface Product {
  id: string;
  restaurant_id?: string;
  category_id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  is_available: boolean;
  is_featured?: boolean;
  calories?: number | null;
  prep_time_minutes?: number | null;
  preparation_time_minutes?: number | null;
  allergens?: string[] | null;
  sort_order: number;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  selectedOptions?: { [key: string]: string };
}

export type OrderStatus = 'pending' | 'preparing' | 'delivered' | 'cancelled' | 'served' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid';
export type PaymentMethod = 'cash' | 'credit_card' | 'online' | 'unpaid';

export interface OrderItem {
  id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  item_notes?: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_number: number;
  table_name: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  total_amount: number;
  customer_note?: string | null;
  customer_notes?: string | null;
  items: OrderItem[];
  created_at: string;
}

export type ServiceCallType = 'waiter' | 'bill' | 'water' | 'cleanup' | 'other';
export type ServiceCallStatus = 'active' | 'completed' | 'cancelled';

export interface ServiceCall {
  id: string;
  restaurant_id: string;
  table_number: number;
  table_name: string;
  call_type: ServiceCallType;
  type?: ServiceCallType;
  payment_type?: string;
  status: ServiceCallStatus;
  created_at: string;
}

export interface SupportMessage {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  sender_type: 'business' | 'superadmin';
  sender_name: string;
  message: string;
  is_read: boolean;
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

export interface TopProduct {
  name: string;
  count: number;
  revenue: number;
}

export interface EndOfDayReportData {
  date: string;
  total_revenue: number;
  cash_revenue: number;
  cash_total: number;
  card_revenue: number;
  credit_card_total: number;
  online_revenue: number;
  total_orders: number;
  total_items_sold: number;
  completed_orders: number;
  cancelled_orders: number;
  total_service_calls: number;
  popular_products: TopProduct[];
  top_products: TopProduct[];
  table_performance: { table_number: number; order_count: number; revenue: number }[];
  table_summaries: TableSummary[];
}
