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

-- ============================================================
-- 8. SECURE RPC: CREATE CUSTOMER ORDER WITH SERVER-SIDE PRICE VERIFICATION
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_customer_order(
    p_business_id UUID,
    p_table_no TEXT,
    p_items JSONB, -- [{"product_id": "...", "quantity": 1, "notes": "..."}]
    p_customer_notes TEXT DEFAULT '',
    p_order_source TEXT DEFAULT 'qr',
    p_session_token TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item JSONB;
    v_product RECORD;
    v_total_amount NUMERIC(10,2) := 0.00;
    v_verified_items JSONB := '[]'::jsonb;
    v_order_id UUID;
    v_new_order JSONB;
    v_qty INT;
BEGIN
    -- Validate business
    IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = p_business_id AND is_active = true) THEN
        RAISE EXCEPTION 'Ä°ÅŸletme bulunamadÄ± veya hesabÄ± aktif deÄŸil.';
    END IF;

    -- Iterate and calculate verified price directly from database
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty := COALESCE((v_item->>'quantity')::INT, 1);
        IF v_qty <= 0 THEN
            CONTINUE;
        END IF;

        -- Fetch live product price from database
        SELECT id, name, price, is_frozen, is_active 
        INTO v_product 
        FROM public.products 
        WHERE id = (v_item->>'product_id')::UUID AND business_id = p_business_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'MenÃ¼de bulunmayan veya silinmiÅŸ bir Ã¼rÃ¼n sipariÅŸ edilemez.';
        END IF;

        IF v_product.is_frozen OR NOT v_product.is_active THEN
            RAISE EXCEPTION 'SeÃ§ilen Ã¼rÃ¼nlerden biri tÃ¼kendi: %', v_product.name;
        END IF;

        -- Accumulate secure verified price
        v_total_amount := v_total_amount + (v_product.price * v_qty);

        -- Build verified item record
        v_verified_items := v_verified_items || jsonb_build_object(
            'id', v_product.id,
            'product_id', v_product.id,
            'name', v_product.name,
            'price', v_product.price,
            'quantity', v_qty,
            'notes', COALESCE(v_item->>'notes', '')
        );
    END LOOP;

    IF jsonb_array_length(v_verified_items) = 0 THEN
        RAISE EXCEPTION 'SipariÅŸ iÃ§in geÃ§erli Ã¼rÃ¼n bulunamadÄ±.';
    END IF;

    -- Insert secure order with server-calculated total
    INSERT INTO public.orders (
        business_id,
        table_no,
        items,
        total_amount,
        status,
        customer_notes,
        order_source,
        session_token
    ) VALUES (
        p_business_id,
        p_table_no,
        v_verified_items,
        v_total_amount,
        'pending',
        p_customer_notes,
        p_order_source,
        p_session_token
    )
    RETURNING id INTO v_order_id;

    SELECT row_to_json(o)::jsonb INTO v_new_order FROM public.orders o WHERE o.id = v_order_id;
    RETURN v_new_order;
END;
$$;
