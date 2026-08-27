export type SubscriptionStatus = 'active' | 'suspended' | 'expired';

export type TemplateId = 
  | 'clean' 
  | 'dark_luxury' 
  | 'nordic' 
  | 'bistro' 
  | 'neon' 
  | 'vintage';

export interface Business {
  id: string;
  name: string;
  slug: string;
  username: string;
  password_hash: string;
  logo_url?: string;
  banner_url?: string;
  cover_image_url?: string;
  phone?: string;
  address?: string;
  working_hours?: string;
  wifi_ssid?: string;
  wifi_password?: string;
  show_wifi?: boolean;
  table_limit?: number | null;
  pairing_secret?: string;
  subscription_status: SubscriptionStatus;
  subscription_days: number;
  subscription_expires_at: string;
  template_id: TemplateId;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
  image_url: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_frozen: boolean;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export interface Table {
  id: string;
  business_id: string;
  table_no: string;
  qr_token: string;
  is_occupied: boolean;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  business_id: string;
  table_no: string;
  session_token: string;
  order_source: 'qr' | 'pos' | 'waiter';
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'preparing' | 'served' | 'paid' | 'cancelled';
  payment_method: 'cash' | 'credit_card' | 'online' | 'unpaid';
  customer_notes?: string;
  waiter_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Waiter {
  id: string;
  business_id: string;
  name: string;
  pin_hash: string;
  is_active: boolean;
  created_at: string;
}

export interface WaiterDevice {
  id: string;
  business_id: string;
  waiter_id?: string;
  waiter_name?: string;
  device_token: string;
  device_name: string;
  status?: 'pending' | 'approved' | 'rejected';
  pairing_token?: string;
  pairing_expires_at?: string;
  is_trusted: boolean;
  last_active_at: string;
  created_at: string;
  waiters?: Waiter;
}

export interface ServiceRequest {
  id: string;
  business_id: string;
  table_no: string;
  request_type: 'waiter' | 'bill_cash' | 'bill_card';
  status: 'pending' | 'resolved';
  notes?: string;
  created_at: string;
}

export interface SupportMessage {
  id: string;
  business_id: string;
  sender: 'superadmin' | 'business' | 'system';
  message: string;
  subject?: string;
  image_url?: string;
  is_read: boolean;
  status?: 'open' | 'closed';
  is_resolved?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface DailySummary {
  id: string;
  business_id: string;
  summary_date: string;
  total_revenue: number;
  cash_revenue: number;
  card_revenue: number;
  total_orders: number;
  created_at: string;
}
