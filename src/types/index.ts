export type Currency = '₺' | '$' | '€' | '£';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  cover_url: string;
  phone: string;
  address: string;
  wifi_ssid: string;
  wifi_password: string;
  currency: Currency;
  tax_rate: number;
  is_active: boolean;
  created_at?: string;
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
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean; // Tükendi mi / Stokta var mı
  is_featured: boolean;
  prep_time_minutes: number;
  calories?: number;
  sort_order?: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid';
export type PaymentMethod = 'cash' | 'credit_card' | 'online';

export interface OrderItem {
  id?: string;
  order_id?: string;
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
  table_id?: string;
  table_number: number;
  status: OrderStatus;
  total_amount: number;
  customer_notes?: string;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  items?: OrderItem[];
  created_at: string;
  updated_at?: string;
}

export type ServiceCallType = 'waiter' | 'bill';
export type ServiceCallStatus = 'active' | 'attended' | 'completed';

export interface ServiceCall {
  id: string;
  restaurant_id: string;
  table_id?: string;
  table_number: number;
  type: ServiceCallType;
  payment_type?: 'cash' | 'credit_card';
  status: ServiceCallStatus;
  notes?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}

export interface TableSummary {
  table_number: number;
  table_name: string;
  order_count: number;
  total_sales: number;
  paid_sales: number;
  active_orders: number;
  items_sold: { [product_name: string]: number };
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
