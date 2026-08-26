-- ==============================================================================
-- RESTORAN & KAFE QR MENÜ VE CANLI SİPARİŞ SİSTEMİ - SUPABASE SQL ŞEMASI
-- ==============================================================================
-- Bu SQL kodunu Supabase Dashboard > SQL Editor alanına yapıştırıp "Run" butonuna basın.
-- ==============================================================================

-- 1. UUID Uzantısını Aktifleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Restoranlar Tablosu (Multi-Tenant & Abonelik Altyapısı)
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    cover_url TEXT,
    phone VARCHAR(50),
    address TEXT,
    wifi_ssid VARCHAR(100) DEFAULT 'Lezzet_Guest_WiFi',
    wifi_password VARCHAR(100) DEFAULT 'Lezzet2026!',
    currency VARCHAR(10) DEFAULT '₺',
    tax_rate NUMERIC(5,2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Masalar Tablosu
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    table_name VARCHAR(100) NOT NULL, -- örn: 'Masa 1', 'Bahçe 4', 'Teras 2'
    section VARCHAR(50) DEFAULT 'Ana Salon', -- 'Salon', 'Bahçe', 'Teras', 'VIP'
    qr_token VARCHAR(100) NOT NULL UNIQUE, -- QR güvenlik tokeni (bozulursa yenilenebilir)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, table_number)
);

-- 4. Kategoriler Tablosu
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'Utensils',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Ürünler Tablosu
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE, -- Tükendi / Stokta Var toggle'ı
    is_featured BOOLEAN DEFAULT FALSE,
    prep_time_minutes INTEGER DEFAULT 15,
    calories INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Siparişler Tablosu
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    table_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'preparing', 'served', 'completed', 'cancelled'
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    customer_notes TEXT,
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'paid'
    payment_method VARCHAR(50) DEFAULT 'cash', -- 'cash', 'credit_card', 'online'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Sipariş Kalemleri (Order Items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC(10,2) NOT NULL,
    item_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Garson Çağrısı & Hesap İstekleri Tablosu
CREATE TABLE IF NOT EXISTS public.service_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'waiter' (Garson Çağır), 'bill' (Hesap İste)
    payment_type VARCHAR(50) DEFAULT 'credit_card', -- 'cash', 'credit_card'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'attended', 'completed'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. İndeksler (Yüksek Performans İçin)
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON public.restaurant_tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON public.categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_restaurant ON public.products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_service_calls_restaurant ON public.service_calls(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_service_calls_status ON public.service_calls(status);

-- 10. Supabase Realtime Replikasyonunu Etkinleştir
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;

-- 11. Row Level Security (RLS) - Herkesin Menüyü Okuyabilmesi ve Sipariş Verebilmesi İçin
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Allow public read access to tables" ON public.restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public create and read orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow public create and read order_items" ON public.order_items FOR ALL USING (true);
CREATE POLICY "Allow public create and read service_calls" ON public.service_calls FOR ALL USING (true);
CREATE POLICY "Allow public update to products (admin)" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow public update to categories (admin)" ON public.categories FOR ALL USING (true);
CREATE POLICY "Allow public update to tables (admin)" ON public.restaurant_tables FOR ALL USING (true);
CREATE POLICY "Allow public update to restaurants (admin)" ON public.restaurants FOR ALL USING (true);

-- ==============================================================================
-- BAŞLANGIÇ ÖRNEK VERİLERİ (SEED DATA)
-- ==============================================================================
DO $$
DECLARE
    r_id UUID;
    cat_sicak UUID;
    cat_soguk UUID;
    cat_ana UUID;
    cat_ara UUID;
    cat_kahvalti UUID;
    cat_tatli UUID;
    t1 UUID; t2 UUID; t3 UUID; t4 UUID; t5 UUID;
BEGIN
    -- Örnek Restoran Ekle
    INSERT INTO public.restaurants (name, slug, description, logo_url, cover_url, phone, wifi_ssid, wifi_password, currency)
    VALUES (
        'Bistro Gusto Restaurant & Lounge',
        'bistro-gusto',
        'Özenle hazırlanan gurme lezzetler, taze kahveler ve eşsiz tatlar.',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
        '+90 (212) 555 0199',
        'Gusto_Guest_5G',
        'GustoLezzet2026',
        '₺'
    ) RETURNING id INTO r_id;

    -- Masaları Ekle
    INSERT INTO public.restaurant_tables (restaurant_id, table_number, table_name, section, qr_token)
    VALUES 
    (r_id, 1, 'Masa 1', 'Salon', 'tok_t1_' || substr(md5(random()::text), 1, 8)) RETURNING id INTO t1;
    INSERT INTO public.restaurant_tables (restaurant_id, table_number, table_name, section, qr_token)
    VALUES 
    (r_id, 2, 'Masa 2', 'Salon', 'tok_t2_' || substr(md5(random()::text), 1, 8)) RETURNING id INTO t2;
    INSERT INTO public.restaurant_tables (restaurant_id, table_number, table_name, section, qr_token)
    VALUES 
    (r_id, 3, 'Masa 3', 'Bahçe', 'tok_t3_' || substr(md5(random()::text), 1, 8)) RETURNING id INTO t3;
    INSERT INTO public.restaurant_tables (restaurant_id, table_number, table_name, section, qr_token)
    VALUES 
    (r_id, 4, 'Masa 4', 'Bahçe', 'tok_t4_' || substr(md5(random()::text), 1, 8)) RETURNING id INTO t4;
    INSERT INTO public.restaurant_tables (restaurant_id, table_number, table_name, section, qr_token)
    VALUES 
    (r_id, 5, 'Teras 1', 'Teras', 'tok_t5_' || substr(md5(random()::text), 1, 8)) RETURNING id INTO t5;

    -- Kategorileri Ekle
    INSERT INTO public.categories (restaurant_id, name, icon, sort_order)
    VALUES (r_id, 'Sıcak İçecekler', 'Coffee', 1) RETURNING id INTO cat_sicak;

    INSERT INTO public.categories (restaurant_id, name, icon, sort_order)
    VALUES (r_id, 'Soğuk İçecekler', 'GlassWater', 2) RETURNING id INTO cat_soguk;

    INSERT INTO public.categories (restaurant_id, name, icon, sort_order)
    VALUES (r_id, 'Ana Yemekler', 'UtensilsCrossed', 3) RETURNING id INTO cat_ana;

    INSERT INTO public.categories (restaurant_id, name, icon, sort_order)
    VALUES (r_id, 'Ara Öğün & Atıştırmalık', 'Sandwich', 4) RETURNING id INTO cat_ara;

    INSERT INTO public.categories (restaurant_id, name, icon, sort_order)
    VALUES (r_id, 'Kahvaltılıklar', 'Egg', 5) RETURNING id INTO cat_kahvalti;

    INSERT INTO public.categories (restaurant_id, name, icon, sort_order)
    VALUES (r_id, 'Tatlılar', 'Cake', 6) RETURNING id INTO cat_tatli;

    -- Ürünleri Ekle: Sıcak İçecekler
    INSERT INTO public.products (restaurant_id, category_id, name, description, price, image_url, is_featured, calories)
    VALUES 
    (r_id, cat_sicak, 'Geleneksel Türk Kahvesi', 'Özel kavrulmuş taze çekirdekler ile lokum ve su eşliğinde sunulur.', 95.00, 'https://images.unsplash.com/photo-1596952954288-26159ca2a9d8?w=600&auto=format&fit=crop&q=80', true, 10),
    (r_id, cat_sicak, 'Caffè Latte & Karamel', 'İki shot taze espresso, buharda köpürtülmüş süt ve doğal karamel şurubu.', 145.00, 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&auto=format&fit=crop&q=80', true, 180),
    (r_id, cat_sicak, 'Sıcak Belçika Çikolatası', 'Eritilmiş gerçek Belçika çikolatası ve krema ile.', 160.00, 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&auto=format&fit=crop&q=80', false, 320),
    (r_id, cat_sicak, 'Bitki Çayları & Ihlamur', 'Bal ve taze limon dilimi ile demlenmiş organik kış çayı.', 110.00, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', false, 15);

    -- Ürünler: Soğuk İçecekler
    INSERT INTO public.products (restaurant_id, category_id, name, description, price, image_url, is_featured, calories)
    VALUES 
    (r_id, cat_soguk, 'Ev Yapımı Nane & Çilekli Limonata', 'Taze sıkılmış limon suyu, çilek püresi ve taze nane yaprakları.', 135.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80', true, 120),
    (r_id, cat_soguk, 'Iced Caramel Macchiato', 'Buz dolu bardakta süt, espresso katmanı ve karamel drizzle.', 155.00, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', true, 190),
    (r_id, cat_soguk, 'Detox Yeşil Smoothie', 'Elma, ıspanak, zencefil, salatalık ve limon karışımı taze enerji.', 150.00, 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=600&auto=format&fit=crop&q=80', false, 140),
    (r_id, cat_soguk, 'Belçika Çikolatalı Milkshake', 'Maraş dondurması, Belçika çikolatası ve çırpılmış krema.', 175.00, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80', false, 410);

    -- Ürünler: Ana Yemekler
    INSERT INTO public.products (restaurant_id, category_id, name, description, price, image_url, is_featured, calories)
    VALUES 
    (r_id, cat_ana, 'Gusto Gurme Burger (200gr)', 'Özel dinlendirilmiş dana köftesi, karamelize soğan, cheddar peyniri, trüflü mayonez ve patates kızartması.', 390.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', true, 850),
    (r_id, cat_ana, 'Izgara Antrikot & Trüflü Püre', '250gr dana antrikot, tereyağlı sebzeler ve trüf aromalı patates püresi.', 620.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80', true, 780),
    (r_id, cat_ana, 'Fettuccine Alfredo & Tavuk', 'Izgara tavuk göğsü, mantar, krema sos ve taze parmesan peyniri.', 340.00, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&auto=format&fit=crop&q=80', false, 680),
    (r_id, cat_ana, 'Taş Fırın Margherita Pizza', 'San Marzano domates sosu, manda mozzarellası ve taze fesleğen.', 310.00, 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80', false, 720);

    -- Ürünler: Ara Öğün & Atıştırmalık
    INSERT INTO public.products (restaurant_id, category_id, name, description, price, image_url, is_featured, calories)
    VALUES 
    (r_id, cat_ara, 'Çıtır Tavuk & Cajun Sepeti', 'Özel baharatlı çıtır tavuk parçaları, cajun baharatlı patates ve ballı hardal sos.', 270.00, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80', true, 590),
    (r_id, cat_ara, 'Meksika Nachos Supreme', 'Fırınlanmış mısır cipsi, eritilmiş peynir, jalapeno, guacamole ve salsa sos.', 260.00, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop&q=80', false, 520),
    (r_id, cat_ara, 'Mozzarella Sticks & Sos', 'Altın sarısı çıtır mozzarella çubukları ve fesleğenli marinara sos.', 210.00, 'https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=600&auto=format&fit=crop&q=80', false, 450);

    -- Ürünler: Kahvaltılıklar
    INSERT INTO public.products (restaurant_id, category_id, name, description, price, image_url, is_featured, calories)
    VALUES 
    (r_id, cat_kahvalti, 'Gusto Zengin Serpme Kahvaltı (2 Kişilik)', 'Peynir tabağı, reçel çeşitleri, bal-kaymak, sucuklu yumurta, menemen, sigara böreği ve sınırsız çay.', 780.00, 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop&q=80', true, 1200),
    (r_id, cat_kahvalti, 'Avokadolu & Poşe Yumurtalı Ekmek', 'Ekşi mayalı ekmek üzerinde ezilmiş avokado, poşe köy yumurtası ve çeri domatesler.', 260.00, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80', true, 410),
    (r_id, cat_kahvalti, 'Yaban Mersinli Pankek Kulesi', 'Akçaağaç şurubu, taze meyveler ve pudra şekeri eşliğinde 4 kat pankek.', 230.00, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop&q=80', false, 480);

    -- Ürünler: Tatlılar
    INSERT INTO public.products (restaurant_id, category_id, name, description, price, image_url, is_featured, calories)
    VALUES 
    (r_id, cat_tatli, 'San Sebastian Cheesecake & Çikolata', 'Fırın yanığı ipeksi kıvamlı cheesecake, sıcak Belçika çikolatası sosu ile.', 240.00, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80', true, 510),
    (r_id, cat_tatli, 'Sıcak Çikolatalı Sufle', 'İçi akışkan bitter çikolatalı sufle ve vanilyalı dondurma topu.', 220.00, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80', true, 460),
    (r_id, cat_tatli, 'Fıstıklı İtalyan Tiramisu', 'Mascarpone kreması, espressoya batırılmış kedi dili ve Antep fıstığı tozu.', 230.00, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80', false, 420);

END $$;

-- ==============================================================================
-- 12. CANLI DESTEK & MESAJLAŞMA TABLOSU (5 GÜNLÜK OTOMATİK TEMİZLİK)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    restaurant_name VARCHAR(255) NOT NULL,
    sender_type VARCHAR(20) NOT NULL, -- 'business' veya 'superadmin'
    sender_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_restaurant ON public.support_messages(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON public.support_messages(created_at);

-- RLS & Realtime
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to support_messages" ON public.support_messages FOR ALL USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- 5 Günden eski mesajları otomatik temizleyen fonksiyon
CREATE OR REPLACE FUNCTION delete_old_support_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM public.support_messages WHERE created_at < NOW() - INTERVAL '5 days';
END;
$$ LANGUAGE plpgsql;

