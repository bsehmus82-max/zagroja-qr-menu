// ============================================================
// ZAGROJA PLATFORM — TYPES & INTERFACES
// ============================================================

export type SubscriptionType = 'unlimited' | 'timed';

export type ZagrojaSystemType = 'qr_menu' | 'booking' | 'ecommerce' | 'hotel_services' | 'crm_services';

export interface ZagrojaSystemConfig {
  id: ZagrojaSystemType;
  name: string;
  short_name: string;
  icon: string;
  color: string;
  badge_bg: string;
  badge_text: string;
  description: string;
}

export const ZAGROJA_SYSTEMS: ZagrojaSystemConfig[] = [
  {
    id: 'qr_menu',
    name: 'QR Menü & Restoran POS',
    short_name: 'QR Menü',
    icon: 'Utensils',
    color: 'from-orange-500 to-amber-600',
    badge_bg: 'bg-orange-500/10 border-orange-500/20',
    badge_text: 'text-orange-400',
    description: 'Restoran ve kafeler için masaya sipariş, çağrı ve adisyon sistemi'
  },
  {
    id: 'booking',
    name: 'Randevu & Rezervasyon',
    short_name: 'Randevu',
    icon: 'Calendar',
    color: 'from-blue-500 to-cyan-600',
    badge_bg: 'bg-blue-500/10 border-blue-500/20',
    badge_text: 'text-blue-400',
    description: 'Güzellik salonları, klinikler ve danışmanlıklar için online randevu ve takvim'
  },
  {
    id: 'ecommerce',
    name: 'Dijital Katalog & E-Ticaret',
    short_name: 'E-Ticaret',
    icon: 'ShoppingBag',
    color: 'from-emerald-500 to-teal-600',
    badge_bg: 'bg-emerald-500/10 border-emerald-500/20',
    badge_text: 'text-emerald-400',
    description: 'Ürün satışı, WhatsApp sipariş ve dijital vitrin kataloğu'
  },
  {
    id: 'hotel_services',
    name: 'Otel & Vale Hizmetleri',
    short_name: 'Otel/Vale',
    icon: 'BedDouble',
    color: 'from-purple-500 to-indigo-600',
    badge_bg: 'bg-purple-500/10 border-purple-500/20',
    badge_text: 'text-purple-400',
    description: 'Otel oda servisi, vale çağırma ve konuk destek sistemi'
  },
  {
    id: 'crm_services',
    name: 'Müşteri & Servis Takibi',
    short_name: 'Servis/CRM',
    icon: 'Briefcase',
    color: 'from-rose-500 to-pink-600',
    badge_bg: 'bg-rose-500/10 border-rose-500/20',
    badge_text: 'text-rose-400',
    description: 'Teknik servis, iş takibi ve müşteri yönetim sistemi'
  }
];

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  system_type?: ZagrojaSystemType;
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
