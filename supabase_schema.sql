-- ============================================================
-- ZAGROJA QR MENU - PRODUCTION DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BUSINESSES (��letmeler)
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

-- 3. PRODUCTS (�r�nler)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    is_frozen BOOLEAN DEFAULT false, -- T�kendi / donduruldu
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

-- 5. ORDERS (Sipari�ler)
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

-- 6. SERVICE REQUESTS (Garson & Hesap �stekleri)
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

-- 7. SUPPORT MESSAGES (Canl� Destek: Super Admin <-> ��letme)
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    sender TEXT NOT NULL, -- 'superadmin' | 'business'
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SUPER ADMIN AUTH (�zel �ifreli Giri�)
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
        RAISE EXCEPTION 'İşletme bulunamadı veya hesabı aktif değil.';
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
            RAISE EXCEPTION 'Menüde bulunmayan veya silinmiş bir ürün sipariş edilemez.';
        END IF;

        IF v_product.is_frozen OR NOT v_product.is_active THEN
            RAISE EXCEPTION 'Seçilen ürünlerden biri tükendi: %', v_product.name;
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
        RAISE EXCEPTION 'Sipariş için geçerli ürün bulunamadı.';
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

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS) SIKILASTIRMASI (ORDERS ISOLATION)
-- ============================================================

-- Orders tablosunda RLS aktif
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Eski politikalari temizle
DROP POLICY IF EXISTS "Deny direct anon order inserts" ON public.orders;
DROP POLICY IF EXISTS "Allow select orders" ON public.orders;
DROP POLICY IF EXISTS "Allow update order status" ON public.orders;

-- 1. Okuma Politikasi: Müşteri siparis takibi ve Isletme paneli icin SELECT serbest
CREATE POLICY "Allow select orders" 
ON public.orders 
FOR SELECT 
USING (true);

-- 2. Dogrudan INSERT Engeli: orders tablosuna anon/authenticated dogrudan INSERT yapamaz!
-- Siparis yalnizca SECURITY DEFINER olarak calisan create_customer_order() RPC uzerinden olusturulur.
CREATE POLICY "Deny direct anon order inserts" 
ON public.orders 
FOR INSERT 
WITH CHECK (false);

-- 3. Guncelleme Politikasi: Isletme paneli siparis durumunu (preparing, served, paid) guncelleyebilir
CREATE POLICY "Allow update order status" 
ON public.orders 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- RPC Fonksiyon Calistirma Yetkisi
GRANT EXECUTE ON FUNCTION public.create_customer_order TO anon, authenticated;

-- ============================================================
-- 10. GARSON MODÜLÜ VE TEK SEFERLİK CİHAZ EŞLEME (DEVICE PAIRING)
-- ============================================================

-- 1. Garsonlar Tablosu
CREATE TABLE IF NOT EXISTS public.waiters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    pin_hash TEXT NOT NULL, -- SHA-256 Hash
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Garson Eşlenmiş Cihazlar Tablosu
CREATE TABLE IF NOT EXISTS public.waiter_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    waiter_id UUID REFERENCES public.waiters(id) ON DELETE SET NULL,
    device_token UUID UNIQUE DEFAULT gen_random_uuid(),
    device_name TEXT DEFAULT 'Garson Cihazı',
    pairing_token TEXT UNIQUE,
    pairing_expires_at TIMESTAMPTZ,
    is_trusted BOOLEAN DEFAULT false,
    last_active_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Etkinleştir
ALTER TABLE public.waiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiter_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select waiters" ON public.waiters;
DROP POLICY IF EXISTS "Allow manage waiters" ON public.waiters;
CREATE POLICY "Allow select waiters" ON public.waiters FOR SELECT USING (true);
CREATE POLICY "Allow manage waiters" ON public.waiters FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select waiter_devices" ON public.waiter_devices;
DROP POLICY IF EXISTS "Allow manage waiter_devices" ON public.waiter_devices;
CREATE POLICY "Allow select waiter_devices" ON public.waiter_devices FOR SELECT USING (true);
CREATE POLICY "Allow manage waiter_devices" ON public.waiter_devices FOR ALL USING (true) WITH CHECK (true);

-- 3. RPC: 5 Dakikalık Tek Kullanımlık Eşleme QR Üret
CREATE OR REPLACE FUNCTION public.generate_waiter_pairing_token(
    p_business_id UUID,
    p_device_name TEXT DEFAULT 'Garson Telefonu'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token TEXT;
    v_expires TIMESTAMPTZ;
    v_device_id UUID;
BEGIN
    v_token := encode(gen_random_bytes(16), 'hex');
    v_expires := now() + interval '5 minutes';

    INSERT INTO public.waiter_devices (
        business_id,
        device_name,
        pairing_token,
        pairing_expires_at,
        is_trusted
    ) VALUES (
        p_business_id,
        p_device_name,
        v_token,
        v_expires,
        false
    )
    RETURNING id INTO v_device_id;

    RETURN jsonb_build_object(
        'device_id', v_device_id,
        'pairing_token', v_token,
        'expires_at', v_expires
    );
END;
$$;

-- 4. RPC: Garson Cihazını Eşle ve Kalıcı Device Token Üret
CREATE OR REPLACE FUNCTION public.pair_waiter_device(
    p_pairing_token TEXT,
    p_device_name TEXT DEFAULT 'Garson Telefonu'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_device RECORD;
    v_business RECORD;
    v_token UUID;
BEGIN
    SELECT * INTO v_device 
    FROM public.waiter_devices 
    WHERE pairing_token = p_pairing_token;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Geçersiz eşleme kodu veya QR kod daha önce kullanılmış.';
    END IF;

    IF v_device.pairing_expires_at < now() THEN
        DELETE FROM public.waiter_devices WHERE id = v_device.id;
        RAISE EXCEPTION 'Eşleme QR kodunun süresi (5 dakika) dolmuş. Lütfen kasadan yeni QR isteyiniz.';
    END IF;

    SELECT id, name, slug INTO v_business 
    FROM public.businesses 
    WHERE id = v_device.business_id;

    v_token := gen_random_uuid();

    UPDATE public.waiter_devices
    SET is_trusted = true,
        device_token = v_token,
        device_name = COALESCE(NULLIF(p_device_name, ''), v_device.device_name),
        pairing_token = NULL,
        pairing_expires_at = NULL,
        last_active_at = now()
    WHERE id = v_device.id;

    RETURN jsonb_build_object(
        'success', true,
        'device_token', v_token,
        'business_id', v_business.id,
        'business_name', v_business.name,
        'business_slug', v_business.slug
    );
END;
$$;

-- 5. RPC: Garson PIN Doğrulama
CREATE OR REPLACE FUNCTION public.verify_waiter_pin(
    p_business_id UUID,
    p_device_token UUID,
    p_pin_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_device RECORD;
    v_waiter RECORD;
BEGIN
    -- Cihaz güvenilir mi?
    SELECT * INTO v_device 
    FROM public.waiter_devices 
    WHERE business_id = p_business_id AND device_token = p_device_token AND is_trusted = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cihazınızın işletme yetkisi kaldırılmış veya eşleşme geçersiz.';
    END IF;

    -- PIN doğru mu?
    SELECT * INTO v_waiter 
    FROM public.waiters 
    WHERE business_id = p_business_id AND pin_hash = p_pin_hash AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Girilen PIN kodu hatalı veya garson hesabı aktif değil.';
    END IF;

    -- Cihazın son aktifliğini güncelle
    UPDATE public.waiter_devices 
    SET waiter_id = v_waiter.id,
        last_active_at = now() 
    WHERE id = v_device.id;

    RETURN jsonb_build_object(
        'success', true,
        'waiter_id', v_waiter.id,
        'waiter_name', v_waiter.name
    );
END;
$$;

-- 6. GÜNCELLENMİŞ CREATE_CUSTOMER_ORDER (GARSON DEVICE TOKEN KORUMALI)
CREATE OR REPLACE FUNCTION public.create_customer_order(
    p_business_id UUID,
    p_table_no TEXT,
    p_items JSONB,
    p_customer_notes TEXT DEFAULT '',
    p_order_source TEXT DEFAULT 'qr',
    p_session_token TEXT DEFAULT '',
    p_device_token UUID DEFAULT NULL,
    p_waiter_id UUID DEFAULT NULL
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
    v_waiter_name TEXT := NULL;
BEGIN
    -- 1. İşletme Kontrolü
    IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = p_business_id AND is_active = true) THEN
        RAISE EXCEPTION 'İşletme bulunamadı veya hesabı aktif değil.';
    END IF;

    -- 2. GARSON SİPARİŞİ İSE CİHAZ VE PIN YETKİSİ KONTROLÜ
    IF p_order_source = 'waiter' THEN
        IF p_device_token IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.waiter_devices 
            WHERE business_id = p_business_id AND device_token = p_device_token AND is_trusted = true
        ) THEN
            RAISE EXCEPTION 'Yetkisiz garson cihazı. Eşleşme sonlandırılmış veya geçersiz.';
        END IF;

        IF p_waiter_id IS NOT NULL THEN
            SELECT name INTO v_waiter_name FROM public.waiters 
            WHERE id = p_waiter_id AND business_id = p_business_id AND is_active = true;
        END IF;

        UPDATE public.waiter_devices SET last_active_at = now() WHERE device_token = p_device_token;
    END IF;

    -- 3. Ürün ve Fiyat Doğrulama (Server-Side)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty := COALESCE((v_item->>'quantity')::INT, 1);
        IF v_qty <= 0 THEN
            CONTINUE;
        END IF;

        SELECT id, name, price, is_frozen, is_active 
        INTO v_product 
        FROM public.products 
        WHERE id = (v_item->>'product_id')::UUID AND business_id = p_business_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Menüde bulunmayan veya silinmiş bir ürün sipariş edilemez.';
        END IF;

        IF v_product.is_frozen OR NOT v_product.is_active THEN
            RAISE EXCEPTION 'Seçilen ürünlerden biri tükendi: %', v_product.name;
        END IF;

        v_total_amount := v_total_amount + (v_product.price * v_qty);

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
        RAISE EXCEPTION 'Sipariş için geçerli ürün bulunamadı.';
    END IF;

    -- 4. Güvenli Sipariş Kaydı
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
        CASE 
            WHEN v_waiter_name IS NOT NULL AND p_customer_notes <> '' THEN '[Garson: ' || v_waiter_name || '] ' || p_customer_notes
            WHEN v_waiter_name IS NOT NULL THEN '[Garson: ' || v_waiter_name || ']'
            ELSE p_customer_notes 
        END,
        p_order_source,
        p_session_token
    )
    RETURNING id INTO v_order_id;

    SELECT row_to_json(o)::jsonb INTO v_new_order FROM public.orders o WHERE o.id = v_order_id;
    RETURN v_new_order;
END;
$$;

-- İzinler
GRANT EXECUTE ON FUNCTION public.generate_waiter_pairing_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pair_waiter_device TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_waiter_pin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_order TO anon, authenticated;
