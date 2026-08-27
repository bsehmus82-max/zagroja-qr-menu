-- ============================================================
-- ZAGROJA QR MENU - PRODUCTION DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BUSINESSES (Ýþletmeler)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    banner_url TEXT DEFAULT '',
    working_hours TEXT DEFAULT '09:00 - 00:00',
    wifi_ssid TEXT DEFAULT '',
    wifi_password TEXT DEFAULT '',
    template_id TEXT DEFAULT 'clean', -- clean, dark_luxury, nordic, bistro, neon, vintage
    font_family TEXT DEFAULT 'Plus Jakarta Sans',
    table_limit INT DEFAULT 20,
    subscription_status TEXT DEFAULT 'active', -- active, suspended, expired
    subscription_days INT DEFAULT 30,
    subscription_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    is_onboarded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES (Kategoriler)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS (Ürünler)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    is_frozen BOOLEAN DEFAULT false, -- Tükendi / donduruldu
    is_active BOOLEAN DEFAULT true,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLES (Masalar)
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    table_no TEXT NOT NULL,
    qr_token TEXT NOT NULL,
    is_occupied BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, table_no)
);

-- 5. ORDERS (Sipariþler)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    table_no TEXT NOT NULL,
    session_token TEXT,
    order_source TEXT DEFAULT 'qr', -- 'qr' | 'manual_pos'
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{product_id, name, quantity, price, notes}]
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'pending', -- pending, preparing, served, paid, cancelled
    payment_method TEXT DEFAULT 'unpaid', -- unpaid, cash, credit_card
    customer_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SERVICE REQUESTS (Garson & Hesap Ýstekleri)
CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    table_no TEXT NOT NULL,
    session_token TEXT,
    request_type TEXT NOT NULL, -- 'waiter', 'bill_cash', 'bill_card'
    status TEXT DEFAULT 'pending', -- 'pending', 'resolved'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUPPORT MESSAGES (Canlý Destek: Super Admin <-> Ýþletme)
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    sender TEXT NOT NULL, -- 'superadmin' | 'business'
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SUPER ADMIN AUTH (Özel Þifreli Giriþ)
CREATE TABLE IF NOT EXISTS public.superadmin_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Realtime Replication Configuration
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;

-- Row Level Security (RLS) Enablement
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_auth ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow client queries for active businesses and anon QR clients)
CREATE POLICY "Allow public read for businesses" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Allow service role all for businesses" ON public.businesses FOR ALL USING (true);

CREATE POLICY "Allow public read for categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow service role all for categories" ON public.categories FOR ALL USING (true);

CREATE POLICY "Allow public read for products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow service role all for products" ON public.products FOR ALL USING (true);

CREATE POLICY "Allow public read for tables" ON public.tables FOR SELECT USING (true);
CREATE POLICY "Allow service role all for tables" ON public.tables FOR ALL USING (true);

CREATE POLICY "Allow public insert and read for orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow public insert and read for service_requests" ON public.service_requests FOR ALL USING (true);
CREATE POLICY "Allow all for support_messages" ON public.support_messages FOR ALL USING (true);
CREATE POLICY "Allow all for superadmin_auth" ON public.superadmin_auth FOR ALL USING (true);
