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
  phone?: string;
  address?: string;
  working_hours?: string;
  wifi_ssid?: string;
  wifi_password?: string;
  table_limit?: number | null;
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
  order_source: 'qr' | 'pos';
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'preparing' | 'served' | 'paid' | 'cancelled';
  payment_method: 'cash' | 'credit_card' | 'online' | 'unpaid';
  customer_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  business_id: string;
  table_no: string;
  type: 'waiter' | 'bill' | 'wifi';
  details?: string;
  is_completed: boolean;
  created_at: string;
}

export interface SupportMessage {
  id: string;
  business_id: string;
  sender: 'superadmin' | 'business';
  sender_name?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}
