export type TemplateId = 'clean' | 'dark_luxury' | 'nordic' | 'bistro' | 'neon' | 'vintage';

export interface Business {
  id: string;
  name: string;
  slug: string;
  username: string;
  password_hash: string;
  phone: string;
  address: string;
  logo_url: string;
  banner_url: string;
  working_hours: string;
  wifi_ssid: string;
  wifi_password: string;
  template_id: TemplateId;
  font_family: string;
  table_limit: number;
  subscription_status: 'active' | 'suspended' | 'expired';
  subscription_days: number;
  subscription_expires_at: string;
  is_onboarded: boolean;
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
  is_frozen: boolean; // Tükendi / Donduruldu
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

export type OrderStatus = 'pending' | 'preparing' | 'served' | 'paid' | 'cancelled';
export type PaymentMethod = 'unpaid' | 'cash' | 'credit_card';

export interface Order {
  id: string;
  business_id: string;
  table_id?: string;
  table_no: string;
  session_token?: string;
  order_source: 'qr' | 'manual_pos';
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  customer_notes: string;
  created_at: string;
  updated_at: string;
}

export type ServiceRequestType = 'waiter' | 'bill_cash' | 'bill_card';
export type ServiceRequestStatus = 'pending' | 'resolved';

export interface ServiceRequest {
  id: string;
  business_id: string;
  table_id?: string;
  table_no: string;
  session_token?: string;
  request_type: ServiceRequestType;
  status: ServiceRequestStatus;
  created_at: string;
}

export interface SupportMessage {
  id: string;
  business_id: string;
  sender: 'superadmin' | 'business';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SuperAdminAuth {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}
