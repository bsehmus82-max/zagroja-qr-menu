-- ============================================================
-- RESTIVA ADISYON & QR MENU - PRODUCTION DATABASE SCHEMA
-- ============================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BUSINESSES
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    template_id TEXT DEFAULT 'clean',
    font_family TEXT DEFAULT 'Plus Jakarta Sans',
    table_limit INT DEFAULT 20,
    subscription_status TEXT DEFAULT 'active',
    subscription_days INT DEFAULT 30,
    subscription_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    is_onboarded BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    is_frozen BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLES
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    table_no TEXT NOT NULL,
    qr_token TEXT NOT NULL,
    is_occupied BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, table_no)
);

-- 5. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    table_no TEXT NOT NULL,
    session_token TEXT,
    order_source TEXT DEFAULT 'qr',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'unpaid',
    customer_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SERVICE REQUESTS
CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    table_no TEXT NOT NULL,
    session_token TEXT,
    request_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUPPORT MESSAGES
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. WAITERS
CREATE TABLE IF NOT EXISTS public.waiters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. WAITER DEVICES
CREATE TABLE IF NOT EXISTS public.waiter_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    waiter_id UUID REFERENCES public.waiters(id) ON DELETE SET NULL,
    device_token UUID UNIQUE DEFAULT gen_random_uuid(),
    device_name TEXT DEFAULT 'Garson Cihazı',
    pairing_token TEXT UNIQUE,
    pairing_expires_at TIMESTAMPTZ,
    is_trusted BOOLEAN DEFAULT false,
    failed_pin_attempts INT DEFAULT 0,
    pin_locked_until TIMESTAMPTZ DEFAULT NULL,
    last_active_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.waiter_devices ADD COLUMN IF NOT EXISTS failed_pin_attempts INT DEFAULT 0;
ALTER TABLE public.waiter_devices ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ DEFAULT NULL;

-- 10. DAILY SUMMARY (Günlük Ciro & Satış Defteri)
CREATE TABLE IF NOT EXISTS public.daily_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    summary_date DATE NOT NULL,
    total_revenue NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    cash_revenue NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    card_revenue NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_orders INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, summary_date)
);

-- ============================================================
-- SAFE REALTIME REPLICATION
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'service_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'support_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tables'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'waiter_devices'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_devices;
    END IF;
END $$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) ETKİNLEŞTİRME
-- ============================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiter_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summary ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION: İŞLETME AKTİFLİK KONTROLÜ
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_business_active(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.businesses
        WHERE id = p_business_id 
          AND COALESCE(subscription_status, 'active') <> 'suspended'
          AND (subscription_expires_at IS NULL OR subscription_expires_at > now())
    );
END;
$$;

-- ============================================================
-- RLS POLİTİKALARI
-- ============================================================

-- Businesses
DROP POLICY IF EXISTS "Allow public read for businesses" ON public.businesses;
CREATE POLICY "Allow public read for businesses" ON public.businesses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service role all for businesses" ON public.businesses;
CREATE POLICY "Allow service role all for businesses" ON public.businesses FOR ALL USING (true);

-- Categories
DROP POLICY IF EXISTS "Allow public read for categories" ON public.categories;
CREATE POLICY "Allow public read for categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service role all for categories" ON public.categories;
CREATE POLICY "Allow service role all for categories" ON public.categories FOR ALL USING (true);

-- Products
DROP POLICY IF EXISTS "Allow public read for products" ON public.products;
CREATE POLICY "Allow public read for products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service role all for products" ON public.products;
CREATE POLICY "Allow service role all for products" ON public.products FOR ALL USING (true);

-- Tables
DROP POLICY IF EXISTS "Allow public read for tables" ON public.tables;
CREATE POLICY "Allow public read for tables" ON public.tables FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service role all for tables" ON public.tables;
CREATE POLICY "Allow service role all for tables" ON public.tables FOR ALL USING (true);

-- Orders
DROP POLICY IF EXISTS "Allow select orders" ON public.orders;
CREATE POLICY "Allow select orders" 
ON public.orders 
FOR SELECT 
USING (public.is_business_active(business_id));

DROP POLICY IF EXISTS "Deny direct anon order inserts" ON public.orders;
CREATE POLICY "Deny direct anon order inserts" 
ON public.orders 
FOR INSERT 
WITH CHECK (false);

DROP POLICY IF EXISTS "Allow update order status" ON public.orders;
CREATE POLICY "Allow update order status" 
ON public.orders 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Service Requests
DROP POLICY IF EXISTS "Allow public insert and read for service_requests" ON public.service_requests;
CREATE POLICY "Allow public insert and read for service_requests" ON public.service_requests FOR ALL USING (true);

-- Support Messages
DROP POLICY IF EXISTS "Allow all for support_messages" ON public.support_messages;
CREATE POLICY "Allow all for support_messages" ON public.support_messages FOR ALL USING (true);

-- Waiters
DROP POLICY IF EXISTS "Allow select waiters" ON public.waiters;
CREATE POLICY "Allow select waiters" ON public.waiters FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage waiters" ON public.waiters;
CREATE POLICY "Allow manage waiters" ON public.waiters FOR ALL USING (true) WITH CHECK (true);

-- Waiter Devices
DROP POLICY IF EXISTS "Allow select waiter_devices" ON public.waiter_devices;
CREATE POLICY "Allow select waiter_devices" ON public.waiter_devices FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage waiter_devices" ON public.waiter_devices;
CREATE POLICY "Allow manage waiter_devices" ON public.waiter_devices FOR ALL USING (true) WITH CHECK (true);

-- Daily Summary
DROP POLICY IF EXISTS "Allow select daily_summary" ON public.daily_summary;
CREATE POLICY "Allow select daily_summary" 
ON public.daily_summary 
FOR SELECT 
USING (public.is_business_active(business_id));

DROP POLICY IF EXISTS "Allow service role all daily_summary" ON public.daily_summary;
CREATE POLICY "Allow service role all daily_summary" 
ON public.daily_summary 
FOR ALL 
USING (true);

-- ============================================================
-- 1. RPC: 5 DAKİKALIK İMZALI CİHAZ EŞLEME QR ÜRET
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_waiter_pairing_token(
    p_business_id UUID,
    p_device_name TEXT DEFAULT 'Garson Telefonu'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token TEXT;
    v_expires TIMESTAMPTZ;
    v_device_id UUID;
BEGIN
    IF NOT public.is_business_active(p_business_id) THEN
        RAISE EXCEPTION 'İşletme hesabı aktif değil veya askıya alınmış.';
    END IF;

    v_token := encode(gen_random_bytes(16), 'hex');
    v_expires := now() + interval '5 minutes';

    INSERT INTO public.waiter_devices (
        business_id,
        device_name,
        pairing_token,
        pairing_expires_at,
        is_trusted,
        failed_pin_attempts,
        pin_locked_until
    ) VALUES (
        p_business_id,
        p_device_name,
        v_token,
        v_expires,
        false,
        0,
        NULL
    )
    RETURNING id INTO v_device_id;

    RETURN jsonb_build_object(
        'device_id', v_device_id,
        'pairing_token', v_token,
        'expires_at', v_expires
    );
END;
$$;

-- ============================================================
-- 2. RPC: CİHAZI EŞLE VE KALICI DEVICE TOKEN ONAYLA
-- ============================================================
CREATE OR REPLACE FUNCTION public.pair_waiter_device(
    p_pairing_token TEXT,
    p_device_name TEXT DEFAULT 'Garson Telefonu'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

    IF NOT public.is_business_active(v_business.id) THEN
        RAISE EXCEPTION 'İşletme hesabı askıya alınmış.';
    END IF;

    v_token := gen_random_uuid();

    UPDATE public.waiter_devices
    SET is_trusted = true,
        device_token = v_token,
        device_name = COALESCE(NULLIF(p_device_name, ''), v_device.device_name),
        pairing_token = NULL,
        pairing_expires_at = NULL,
        failed_pin_attempts = 0,
        pin_locked_until = NULL,
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

-- ============================================================
-- 3. RPC: GARSON PIN DOĞRULAMA (SUNUCU TARAFLI 5 DAKİKA KİLİT KORUMALI)
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_waiter_pin(
    p_business_id UUID,
    p_device_token UUID,
    p_pin_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_device RECORD;
    v_waiter RECORD;
    v_remaining_secs INT;
BEGIN
    SELECT * INTO v_device 
    FROM public.waiter_devices 
    WHERE business_id = p_business_id AND device_token = p_device_token AND is_trusted = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cihazınızın işletme yetkisi kaldırılmış veya eşleşme geçersiz.';
    END IF;

    IF v_device.pin_locked_until IS NOT NULL AND v_device.pin_locked_until > now() THEN
        v_remaining_secs := EXTRACT(EPOCH FROM (v_device.pin_locked_until - now()))::INT;
        RAISE EXCEPTION 'Cihaz çok sayıda hatalı deneme nedeniyle kilitlendi. Lütfen % saniye sonra tekrar deneyiniz.', v_remaining_secs;
    END IF;

    SELECT * INTO v_waiter 
    FROM public.waiters 
    WHERE business_id = p_business_id AND pin_hash = p_pin_hash AND is_active = true;

    IF NOT FOUND THEN
        IF COALESCE(v_device.failed_pin_attempts, 0) + 1 >= 3 THEN
            UPDATE public.waiter_devices 
            SET failed_pin_attempts = 0,
                pin_locked_until = now() + interval '5 minutes',
                last_active_at = now()
            WHERE id = v_device.id;
            RAISE EXCEPTION '3 kez hatalı PIN girildi. Cihaz 5 dakika süreyle kilitlendi.';
        ELSE
            UPDATE public.waiter_devices 
            SET failed_pin_attempts = COALESCE(failed_pin_attempts, 0) + 1,
                last_active_at = now()
            WHERE id = v_device.id;
            RAISE EXCEPTION 'Girilen PIN kodu hatalı. Kalan deneme hakkı: %', (3 - (COALESCE(v_device.failed_pin_attempts, 0) + 1));
        END IF;
    END IF;

    UPDATE public.waiter_devices 
    SET waiter_id = v_waiter.id,
        failed_pin_attempts = 0,
        pin_locked_until = NULL,
        last_active_at = now() 
    WHERE id = v_device.id;

    RETURN jsonb_build_object(
        'success', true,
        'waiter_id', v_waiter.id,
        'waiter_name', v_waiter.name
    );
END;
$$;

-- ============================================================
-- 4. RPC: GÜVENLİ SİPARİŞ OLUŞTURMA (RATE LIMITING + FİYAT DOĞRULAMA)
-- ============================================================
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
SET search_path = public
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
    IF NOT public.is_business_active(p_business_id) THEN
        RAISE EXCEPTION 'İşletme bulunamadı veya hesabı aktif değil.';
    END IF;

    IF p_order_source = 'qr' THEN
        IF EXISTS (
            SELECT 1 FROM public.orders 
            WHERE business_id = p_business_id 
              AND table_no = p_table_no 
              AND created_at > (now() - interval '10 seconds')
        ) THEN
            RAISE EXCEPTION 'Çok hızlı sipariş gönderiliyor. Lütfen birkaç saniye bekleyin.';
        END IF;
    END IF;

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

-- ============================================================
-- 5. CRON FONKSİYONLARI (ZAMANLANMIŞ GÖREVLER)
-- ============================================================

CREATE OR REPLACE FUNCTION public.cron_auto_suspend_expired_businesses()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.businesses
    SET subscription_status = 'suspended',
        updated_at = NOW()
    WHERE subscription_expires_at < NOW()
      AND subscription_status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION public.cron_generate_daily_summary(p_target_date DATE DEFAULT (CURRENT_DATE - INTERVAL '1 day')::DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.daily_summary (
        business_id,
        summary_date,
        total_revenue,
        cash_revenue,
        card_revenue,
        total_orders
    )
    SELECT 
        b.id AS business_id,
        p_target_date AS summary_date,
        COALESCE(SUM(o.total_amount), 0.00) AS total_revenue,
        COALESCE(SUM(CASE WHEN o.payment_method = 'cash' THEN o.total_amount ELSE 0 END), 0.00) AS cash_revenue,
        COALESCE(SUM(CASE WHEN o.payment_method = 'credit_card' THEN o.total_amount ELSE 0 END), 0.00) AS card_revenue,
        COUNT(o.id) AS total_orders
    FROM public.businesses b
    LEFT JOIN public.orders o ON o.business_id = b.id 
        AND o.status = 'paid' 
        AND o.created_at::DATE = p_target_date
    GROUP BY b.id
    ON CONFLICT (business_id, summary_date) 
    DO UPDATE SET 
        total_revenue = EXCLUDED.total_revenue,
        cash_revenue = EXCLUDED.cash_revenue,
        card_revenue = EXCLUDED.card_revenue,
        total_orders = EXCLUDED.total_orders;
END;
$$;

CREATE OR REPLACE FUNCTION public.cron_purge_previous_month_daily_summary()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.daily_summary
    WHERE summary_date < date_trunc('month', CURRENT_DATE)::DATE;
END;
$$;

-- ============================================================
-- İZİNLER (GRANTS)
-- ============================================================
GRANT EXECUTE ON FUNCTION public.is_business_active TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_waiter_pairing_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pair_waiter_device TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_waiter_pin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_order TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_auto_suspend_expired_businesses TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_generate_daily_summary TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_purge_previous_month_daily_summary TO anon, authenticated;
-- ============================================================
-- RESTIVA ADISYON - GARSON CIHAZ ESLEME VE CANLI ONAY MIMARISI
-- ============================================================

-- 1. waiter_devices tablosu status alanı
ALTER TABLE public.waiter_devices 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS failed_pin_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ DEFAULT NULL;

-- 2. RPC: Garson Cihaz Eşleme Talebi Gönderme (Garson Telefonundan)
CREATE OR REPLACE FUNCTION public.request_waiter_pairing(
    p_business_slug TEXT,
    p_device_name TEXT DEFAULT 'Garson Cihazı'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_business RECORD;
    v_token UUID;
    v_device_id UUID;
BEGIN
    SELECT * INTO v_business 
    FROM public.businesses 
    WHERE slug = p_business_slug;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'İşletme bulunamadı.';
    END IF;

    IF NOT public.is_business_active(v_business.id) THEN
        RAISE EXCEPTION 'İşletme hesabı aktif değil veya askıya alınmış.';
    END IF;

    v_token := gen_random_uuid();

    INSERT INTO public.waiter_devices (
        business_id,
        device_name,
        device_token,
        status,
        is_trusted,
        failed_pin_attempts,
        pin_locked_until,
        last_active_at
    ) VALUES (
        v_business.id,
        COALESCE(NULLIF(p_device_name, ''), 'Garson Telefonu'),
        v_token,
        'pending',
        false,
        0,
        NULL,
        now()
    )
    RETURNING id INTO v_device_id;

    RETURN jsonb_build_object(
        'success', true,
        'device_id', v_device_id,
        'device_token', v_token,
        'business_id', v_business.id,
        'business_name', v_business.name,
        'business_slug', v_business.slug
    );
END;
$$;

-- 3. RPC: Kasadan Garson Cihaz Talebini Onaylama (Kasa Panelinden)
CREATE OR REPLACE FUNCTION public.approve_waiter_device(
    p_device_id UUID,
    p_waiter_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_device RECORD;
    v_waiter RECORD;
BEGIN
    SELECT * INTO v_device FROM public.waiter_devices WHERE id = p_device_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cihaz kaydı bulunamadı.';
    END IF;

    SELECT * INTO v_waiter FROM public.waiters WHERE id = p_waiter_id AND is_active = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Seçilen garson hesabı aktif değil veya bulunamadı.';
    END IF;

    UPDATE public.waiter_devices
    SET status = 'approved',
        is_trusted = true,
        waiter_id = v_waiter.id,
        last_active_at = now()
    WHERE id = p_device_id;

    RETURN jsonb_build_object(
        'success', true,
        'waiter_id', v_waiter.id,
        'waiter_name', v_waiter.name
    );
END;
$$;

-- 4. RPC: Kasadan Garson Cihaz Talebini Reddetme (Kasa Panelinden)
CREATE OR REPLACE FUNCTION public.reject_waiter_device(
    p_device_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.waiter_devices WHERE id = p_device_id;
    RETURN jsonb_build_object('success', true);
END;
$$;

-- 5. RPC: Cihazın Eşleşme ve Onay Durumunu Kontrol Etme
CREATE OR REPLACE FUNCTION public.check_device_pairing_status(
    p_device_token UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_device RECORD;
    v_business RECORD;
    v_waiter RECORD;
BEGIN
    SELECT * INTO v_device FROM public.waiter_devices WHERE device_token = p_device_token;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'not_found', 'is_trusted', false);
    END IF;

    SELECT name, slug INTO v_business FROM public.businesses WHERE id = v_device.business_id;

    IF v_device.waiter_id IS NOT NULL THEN
        SELECT name INTO v_waiter FROM public.waiters WHERE id = v_device.waiter_id;
    END IF;

    RETURN jsonb_build_object(
        'status', v_device.status,
        'is_trusted', v_device.is_trusted,
        'business_id', v_device.business_id,
        'business_name', COALESCE(v_business.name, ''),
        'business_slug', COALESCE(v_business.slug, ''),
        'waiter_id', v_device.waiter_id,
        'waiter_name', COALESCE(v_waiter.name, '')
    );
END;
$$;

-- 6. GÜNCELLENMİŞ PIN DOĞRULAMA (Approved & Trusted kontrolü)
CREATE OR REPLACE FUNCTION public.verify_waiter_pin(
    p_business_id UUID,
    p_device_token UUID,
    p_pin_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_device RECORD;
    v_waiter RECORD;
    v_remaining_secs INT;
BEGIN
    SELECT * INTO v_device 
    FROM public.waiter_devices 
    WHERE business_id = p_business_id 
      AND device_token = p_device_token 
      AND is_trusted = true 
      AND status = 'approved';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cihazınızın işletme yetkisi kaldırılmış veya eşleşme henüz onaylanmamış.';
    END IF;

    IF v_device.pin_locked_until IS NOT NULL AND v_device.pin_locked_until > now() THEN
        v_remaining_secs := EXTRACT(EPOCH FROM (v_device.pin_locked_until - now()))::INT;
        RAISE EXCEPTION 'Cihaz çok sayıda hatalı deneme nedeniyle kilitlendi. Lütfen % saniye sonra tekrar deneyiniz.', v_remaining_secs;
    END IF;

    SELECT * INTO v_waiter 
    FROM public.waiters 
    WHERE business_id = p_business_id AND pin_hash = p_pin_hash AND is_active = true;

    IF NOT FOUND THEN
        IF COALESCE(v_device.failed_pin_attempts, 0) + 1 >= 3 THEN
            UPDATE public.waiter_devices 
            SET failed_pin_attempts = 0,
                pin_locked_until = now() + interval '5 minutes',
                last_active_at = now()
            WHERE id = v_device.id;
            RAISE EXCEPTION '3 kez hatalı PIN girildi. Cihaz 5 dakika süreyle kilitlendi.';
        ELSE
            UPDATE public.waiter_devices 
            SET failed_pin_attempts = COALESCE(failed_pin_attempts, 0) + 1,
                last_active_at = now()
            WHERE id = v_device.id;
            RAISE EXCEPTION 'Girilen PIN kodu hatalı. Kalan deneme hakkı: %', (3 - (COALESCE(v_device.failed_pin_attempts, 0) + 1));
        END IF;
    END IF;

    UPDATE public.waiter_devices 
    SET waiter_id = v_waiter.id,
        failed_pin_attempts = 0,
        pin_locked_until = NULL,
        last_active_at = now() 
    WHERE id = v_device.id;

    RETURN jsonb_build_object(
        'success', true,
        'waiter_id', v_waiter.id,
        'waiter_name', v_waiter.name
    );
END;
$$;

-- 7. GÜNCELLENMİŞ SİPARİŞ OLUŞTURMA
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
SET search_path = public
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
    IF NOT public.is_business_active(p_business_id) THEN
        RAISE EXCEPTION 'İşletme bulunamadı veya hesabı aktif değil.';
    END IF;

    IF p_order_source = 'qr' THEN
        IF EXISTS (
            SELECT 1 FROM public.orders 
            WHERE business_id = p_business_id 
              AND table_no = p_table_no 
              AND created_at > (now() - interval '10 seconds')
        ) THEN
            RAISE EXCEPTION 'Çok hızlı sipariş gönderiliyor. Lütfen birkaç saniye bekleyin.';
        END IF;
    END IF;

    IF p_order_source = 'waiter' THEN
        IF p_device_token IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.waiter_devices 
            WHERE business_id = p_business_id 
              AND device_token = p_device_token 
              AND is_trusted = true 
              AND status = 'approved'
        ) THEN
            RAISE EXCEPTION 'Yetkisiz garson cihazı. Eşleşme onaylanmamış veya yetki kaldırılmış.';
        END IF;

        IF p_waiter_id IS NOT NULL THEN
            SELECT name INTO v_waiter_name FROM public.waiters 
            WHERE id = p_waiter_id AND business_id = p_business_id AND is_active = true;
        END IF;

        UPDATE public.waiter_devices SET last_active_at = now() WHERE device_token = p_device_token;
    END IF;

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
GRANT EXECUTE ON FUNCTION public.request_waiter_pairing TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_waiter_device TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_waiter_device TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_device_pairing_status TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_waiter_pin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_order TO anon, authenticated;
-- ============================================================
-- GARSON QR YENİLEME VE GÜVENLİK ANAHTARI (PAIRING SECRET)
-- ============================================================

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS pairing_secret TEXT DEFAULT gen_random_uuid();

CREATE OR REPLACE FUNCTION public.rotate_business_pairing_secret(p_business_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_secret TEXT;
BEGIN
    v_new_secret := encode(gen_random_bytes(12), 'hex');
    UPDATE public.businesses
    SET pairing_secret = v_new_secret,
        updated_at = now()
    WHERE id = p_business_id;
    RETURN v_new_secret;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_waiter_pairing(
    p_business_slug TEXT,
    p_device_name TEXT DEFAULT 'Garson Cihazı',
    p_pairing_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_business RECORD;
    v_token UUID;
    v_device_id UUID;
BEGIN
    SELECT * INTO v_business 
    FROM public.businesses 
    WHERE slug = p_business_slug;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'İşletme bulunamadı.';
    END IF;

    IF NOT public.is_business_active(v_business.id) THEN
        RAISE EXCEPTION 'İşletme hesabı aktif değil veya askıya alınmış.';
    END IF;

    IF v_business.pairing_secret IS NOT NULL AND v_business.pairing_secret <> '' THEN
        IF p_pairing_key IS NOT NULL AND p_pairing_key <> '' AND p_pairing_key <> v_business.pairing_secret THEN
            RAISE EXCEPTION 'Bu QR kodun geçerlilik süresi dolmuş veya yenilenmiştir. Lütfen kasadaki güncel QR kodu okutunuz.';
        END IF;
    END IF;

    v_token := gen_random_uuid();

    INSERT INTO public.waiter_devices (
        business_id,
        device_name,
        device_token,
        status,
        is_trusted,
        failed_pin_attempts,
        pin_locked_until,
        last_active_at
    ) VALUES (
        v_business.id,
        COALESCE(NULLIF(p_device_name, ''), 'Garson Telefonu'),
        v_token,
        'pending',
        false,
        0,
        NULL,
        now()
    )
    RETURNING id INTO v_device_id;

    RETURN jsonb_build_object(
        'success', true,
        'device_id', v_device_id,
        'device_token', v_token,
        'business_id', v_business.id,
        'business_name', v_business.name,
        'business_slug', v_business.slug
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rotate_business_pairing_secret TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_waiter_pairing TO anon, authenticated;
