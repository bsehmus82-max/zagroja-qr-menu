-- ==============================================================================
-- RESTIVADISYON YEMEK PLATFORMLARI ENTEGRASYON ŞEMASI (SQL)
-- Desteklenen 7 Platform: 
-- 1. Trendyol Yemek (Trendyol GO)
-- 2. Yemeksepeti (Delivery Hero)
-- 3. Getir Yemek
-- 4. Migros Yemek (Migros One)
-- 5. Tıkla Gelsin (TAB Gıda)
-- 6. Fuudy (Lüks Gastronomi)
-- 7. Vigo (Entegre Kurye Ağı)
-- ==============================================================================

-- 1. Orders Tablosuna Entegrasyon Alanlarını Ekle
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'external_order_id') THEN
        ALTER TABLE public.orders ADD COLUMN external_order_id TEXT DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'platform_metadata') THEN
        ALTER TABLE public.orders ADD COLUMN platform_metadata JSONB DEFAULT NULL;
    END IF;

    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_source_check;
END $$;

-- 2. Global Master Platform API Havuzu (Superadmin'in 1 Seferlik Tanımlayacağı Anahtarlar)
CREATE TABLE IF NOT EXISTS public.system_platform_master_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL UNIQUE CHECK (platform IN ('trendyol', 'yemeksepeti', 'getir', 'migros', 'tiklagelsin', 'fuudy', 'vigo')),
    master_api_key TEXT DEFAULT NULL,
    master_api_secret TEXT DEFAULT NULL,
    master_client_id TEXT DEFAULT NULL,
    master_client_secret TEXT DEFAULT NULL,
    app_id TEXT DEFAULT NULL,
    webhook_base_url TEXT DEFAULT NULL,
    is_enabled BOOLEAN DEFAULT true,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. İşletme Bazlı Platform Yapılandırması (Dükkan ID Eşleştirme)
CREATE TABLE IF NOT EXISTS public.food_platforms_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('trendyol', 'yemeksepeti', 'getir', 'migros', 'tiklagelsin', 'fuudy', 'vigo')),
    is_active BOOLEAN DEFAULT false,
    merchant_id TEXT DEFAULT NULL,       -- Satıcı ID / Restoran ID / Şube No (YETERLİ OLAN BİLGİ)
    api_key TEXT DEFAULT NULL,           -- Özel API Key (Boş ise Master API kullanılır)
    api_secret TEXT DEFAULT NULL,        -- Özel Secret
    client_id TEXT DEFAULT NULL,
    client_secret TEXT DEFAULT NULL,
    webhook_secret TEXT DEFAULT NULL,
    auto_accept BOOLEAN DEFAULT false,   -- Otomatik onay
    courier_type TEXT DEFAULT 'platform' CHECK (courier_type IN ('platform', 'restaurant')),
    use_master_api BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (business_id, platform)
);

-- 4. RLS Güvenlik Politikaları
ALTER TABLE public.system_platform_master_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_platforms_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to system_platform_master_configs" ON public.system_platform_master_configs;
CREATE POLICY "Public access to system_platform_master_configs"
    ON public.system_platform_master_configs
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to food_platforms_config" ON public.food_platforms_config;
CREATE POLICY "Public access to food_platforms_config"
    ON public.food_platforms_config
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Realtime Yayınlarını Etkinleştir
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_platform_master_configs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_platforms_config;

-- 6. Fonksiyon: İşletme Platform Ayarını Kaydet (Upsert)
CREATE OR REPLACE FUNCTION public.upsert_food_platform_config(
    p_business_id UUID,
    p_platform TEXT,
    p_is_active BOOLEAN,
    p_merchant_id TEXT DEFAULT NULL,
    p_api_key TEXT DEFAULT NULL,
    p_api_secret TEXT DEFAULT NULL,
    p_client_id TEXT DEFAULT NULL,
    p_client_secret TEXT DEFAULT NULL,
    p_auto_accept BOOLEAN DEFAULT false,
    p_courier_type TEXT DEFAULT 'platform'
)
RETURNS public.food_platforms_config
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record public.food_platforms_config;
BEGIN
    INSERT INTO public.food_platforms_config (
        business_id, platform, is_active, merchant_id,
        api_key, api_secret, client_id, client_secret,
        auto_accept, courier_type, use_master_api, updated_at
    )
    VALUES (
        p_business_id, p_platform, p_is_active, p_merchant_id,
        p_api_key, p_api_secret, p_client_id, p_client_secret,
        p_auto_accept, p_courier_type, true, now()
    )
    ON CONFLICT (business_id, platform)
    DO UPDATE SET
        is_active = EXCLUDED.is_active,
        merchant_id = EXCLUDED.merchant_id,
        api_key = EXCLUDED.api_key,
        api_secret = EXCLUDED.api_secret,
        client_id = EXCLUDED.client_id,
        client_secret = EXCLUDED.client_secret,
        auto_accept = EXCLUDED.auto_accept,
        courier_type = EXCLUDED.courier_type,
        use_master_api = EXCLUDED.use_master_api,
        updated_at = now()
    RETURNING * INTO v_record;

    RETURN v_record;
END;
$$;

-- 7. Fonksiyon: Canlı Test Siparişi Simülasyonu
CREATE OR REPLACE FUNCTION public.simulate_incoming_platform_order(
    p_business_id UUID,
    p_platform TEXT,
    p_customer_name TEXT,
    p_delivery_address TEXT,
    p_items JSONB,
    p_total NUMERIC,
    p_notes TEXT DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order public.orders;
    v_order_code TEXT;
    v_token TEXT;
BEGIN
    v_order_code := '#' || UPPER(SUBSTRING(p_platform, 1, 3)) || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
    v_token := 'ext_' || p_platform || '_' || EXTRACT(EPOCH FROM now())::BIGINT;

    INSERT INTO public.orders (
        business_id,
        table_no,
        session_token,
        order_source,
        external_order_id,
        items,
        total_amount,
        status,
        payment_method,
        customer_notes,
        platform_metadata,
        created_at,
        updated_at
    )
    VALUES (
        p_business_id,
        'Paket / ' || INITCAP(p_platform),
        v_token,
        p_platform,
        v_order_code,
        p_items,
        p_total,
        'pending',
        'online',
        COALESCE(p_notes, 'Temassız teslimat rica ediyorum.'),
        jsonb_build_object(
            'platform', p_platform,
            'platform_order_code', v_order_code,
            'customer_name', p_customer_name,
            'customer_phone', '05' || LPAD(FLOOR(RANDOM() * 90000000 + 10000000)::TEXT, 8, '0'),
            'delivery_address', p_delivery_address,
            'delivery_type', 'delivery',
            'courier_status', 'assigned',
            'courier_name', 'Ahmet K. (Platform Kuryesi)',
            'preparation_time_minutes', 25
        ),
        now(),
        now()
    )
    RETURNING * INTO v_order;

    RETURN v_order;
END;
$$;
