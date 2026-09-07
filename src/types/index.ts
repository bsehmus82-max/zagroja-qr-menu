export type SubscriptionStatus = 'active' | 'suspended' | 'expired';

export type TemplateId = 
  | 'fine_dining'       // Lüks Gastronomi / Kömür & Altın & Zarif Serif
  | 'boutique_cafe'     // 3. Nesil Kafe & Fırın / Doğal Bej & Sıcak Ahşap
  | 'modern_bistro'     // Modern Bistro / Gece Mavisi & Şık Kartlar
  | 'traditional_ocak'  // Geleneksel Ocakbaşı & Kebap & Meyhane / Sıcak Tuğla & Taş
  | 'artisan_burger'    // Artisan Burger & Street Food / Dinamik Bold Başlıklar
  | 'minimalist_zen'    // Minimalist İskandinav & Sağlıklı Yaşam / Ferah Temiz
  | 'clean' 
  | 'dark_luxury' 
  | 'nordic' 
  | 'bistro' 
  | 'neon' 
  | 'vintage';

export type FontFamilyType = 'inter' | 'playfair' | 'poppins' | 'montserrat' | 'bebas' | 'cormorant';
export type CardStyleType = 'rounded_card' | 'minimal_list' | 'modern_grid' | 'glass_card' | 'compact_row';
export type QrPatternType = 'standard' | 'rounded' | 'dots' | 'diamond' | 'fluid';

export interface QrThemeConfig {
  pattern: QrPatternType;
  fg_color: string;
  bg_color: string;
  gradient_color?: string;
  has_gradient: boolean;
  logo_in_center: boolean;
  frame_style: 'none' | 'simple_badge' | 'luxury_border' | 'table_pill';
  frame_text: string;
}

export interface MenuThemeConfig {
  template_id: TemplateId;
  font_family: FontFamilyType;
  card_style: CardStyleType;
  primary_color: string;
  secondary_color?: string;
  background_color: string;
  surface_color: string;
  text_primary: string;
  text_secondary: string;
  accent_glow: boolean;
  qr_theme: QrThemeConfig;
}

export type SoundPresetKey = 'classic' | 'crystal' | 'digital' | 'woodblock' | 'melodic';

export type PlanType = 'trial' | 'lite' | 'standard' | 'pro' | 'custom';
export type BillingPeriod = 'trial' | 'monthly' | 'semi_annual' | 'annual' | 'custom';

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
  sound_preference?: SoundPresetKey;
  plan_type?: PlanType;
  plan_price?: number;
  billing_period?: BillingPeriod;
  last_payment_date?: string;
  next_billing_date?: string;
  subscription_status: SubscriptionStatus;
  subscription_days: number;
  subscription_expires_at: string;
  template_id: TemplateId;
  theme_config?: MenuThemeConfig;
  auto_send_to_kitchen_on_accept?: boolean;
  auto_print_kitchen_ticket_on_accept?: boolean;
  is_kitchen_enabled?: boolean;
  active_modules?: string[];
  max_staff_count?: number;
  max_kitchen_screens?: number;
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

export type PlatformType = 
  | 'trendyol' 
  | 'yemeksepeti' 
  | 'getir' 
  | 'migros' 
  | 'tiklagelsin' 
  | 'fuudy' 
  | 'vigo';

export interface MasterPlatformConfig {
  id?: string;
  platform: PlatformType;
  master_api_key?: string;
  master_api_secret?: string;
  master_client_id?: string;
  master_client_secret?: string;
  app_id?: string;
  webhook_base_url?: string;
  is_enabled: boolean;
  notes?: string;
  updated_at?: string;
}

export interface PlatformOrderMetadata {
  platform: PlatformType;
  platform_order_code?: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  delivery_type?: 'delivery' | 'pickup';
  courier_status?: 'assigned' | 'at_restaurant' | 'on_way' | 'delivered';
  courier_name?: string;
  courier_phone?: string;
  delivery_fee?: number;
  preparation_time_minutes?: number;
  raw_payload?: any;
}

export interface FoodPlatformConfig {
  id?: string;
  business_id: string;
  platform: PlatformType;
  is_active: boolean;
  merchant_id?: string; // Satıcı ID / Vendor ID / Restoran ID
  api_key?: string; // Opsiyonel (Özel dükkan anahtarı varsa)
  api_secret?: string;
  client_id?: string;
  client_secret?: string;
  webhook_secret?: string;
  auto_accept?: boolean;
  courier_type?: 'platform' | 'restaurant';
  use_master_api?: boolean; // RestivAdisyon Ana Master API'sini kullan
  last_sync_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  business_id: string;
  table_no: string;
  session_token: string;
  order_source: 'qr' | 'pos' | 'waiter' | 'trendyol' | 'yemeksepeti' | 'getir' | 'migros' | 'tiklagelsin' | 'fuudy' | 'vigo';
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'preparing' | 'served' | 'paid' | 'cancelled';
  payment_method: 'cash' | 'credit_card' | 'online' | 'unpaid' | 'other' | 'bank_transfer';
  customer_notes?: string;
  waiter_name?: string;
  external_order_id?: string;
  platform_metadata?: PlatformOrderMetadata;
  created_at: string;
  updated_at: string;
}

export type StaffRole = 'manager' | 'waiter' | 'kitchen' | 'cashier' | 'custom';

export interface StaffPermissions {
  can_take_orders: boolean;     // Masalara sipariş girme
  can_view_orders: boolean;     // Canlı siparişleri takip etme
  can_handle_calls: boolean;    // Garson çağrılarını takip edip onaylama
  can_access_pos: boolean;      // Kasa / Hızlı POS erişimi
  can_access_kitchen: boolean;  // Mutfak KDS ekranına erişim
  can_manage_tables: boolean;   // Masa durumlarını yönetme
  can_manage_menu?: boolean;    // Menü ve tükenen ürünleri yönetme
  is_full_access?: boolean;     // Tam yetkili
}

export interface StaffMember {
  id: string;
  business_id: string;
  name: string;
  role: StaffRole;
  pin_code: string; // 6 haneli hızlı PIN kodu
  pin_hash?: string;
  permissions: StaffPermissions;
  is_active: boolean;
  created_at: string;
}

export type Waiter = StaffMember;

export interface WaiterDevice {
  id: string;
  business_id: string;
  waiter_id?: string;
  waiter_name?: string;
  staff_id?: string;
  staff_name?: string;
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

export interface Expense {
  id: string;
  business_id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method?: 'cash' | 'credit_card' | 'bank_transfer' | 'other';
  receipt_no?: string;
  created_at: string;
}

export const SUPERADMIN_CREDENTIALS = {
  usernames: ['admin', 'superadmin', 'restivadisyon', 'bsehmus', 'ynuman'],
  admin1Password: 'b.sehmus852',
  admin2Password: 'y.numan852',
};


