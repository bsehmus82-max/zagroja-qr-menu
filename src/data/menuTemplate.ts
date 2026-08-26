import { DefaultCategory } from '../types';

export const defaultMenuTemplate: DefaultCategory[] = [
  {
    name: 'Günün Spesiyalleri',
    icon: 'Sparkles',
    sort_order: 1,
    template_products: [
      {
        name: 'Şefin Özel Gurme Burger',
        description: '200g dinlendirilmiş dana köfte, karamelize soğan, cheddar peyniri, dana füme kaburga, trüflü mayonez ve özel baharatlı patates kızartması ile.',
        price: 340,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        calories: 850,
        preparation_time_minutes: 20,
        sort_order: 1,
      },
      {
        name: 'Çıtır Tavuk Sepeti',
        description: 'Özel baharatlarla panelenmiş çıtır tavuk bonfile parçaları, patates kızartması, çıtır soğan halkası, ballı hardal ve sarımsaklı mayonez sos.',
        price: 280,
        image_url: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&auto=format&fit=crop&q=80',
        calories: 620,
        preparation_time_minutes: 15,
        sort_order: 2,
      },
    ],
  },
  {
    name: 'Kahvaltılar & Başlangıçlar',
    icon: 'Coffee',
    sort_order: 2,
    template_products: [
      {
        name: 'İki Kişilik Serpme Köy Kahvaltısı',
        description: 'Ezine beyaz peynir, eski kaşar, tulum, siyah/yeşil zeytin, ev yapımı reçeller, petek bal-kaymak, sahanda tereyağlı sucuk, sigara böreği, pişi, domates-salatalık söğüş ve sınırsız çay.',
        price: 780,
        image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop&q=80',
        calories: 1200,
        preparation_time_minutes: 15,
        sort_order: 1,
      },
      {
        name: 'Sıcak Kahvaltı Tabağı',
        description: 'Izgara hellim peyniri, sosis, kasap sucuk, sahanda göz yumurta, patates tava ve ızgara mantar.',
        price: 360,
        image_url: 'https://images.unsplash.com/photo-1525351484163-9e45e52128b2?w=600&auto=format&fit=crop&q=80',
        calories: 750,
        preparation_time_minutes: 12,
        sort_order: 2,
      },
      {
        name: 'Geleneksel Tereyağlı Menemen',
        description: 'Közlenmiş yeşil biber, taze domates, tereyağı ve çiftlik yumurtası ile.',
        price: 190,
        image_url: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600&auto=format&fit=crop&q=80',
        calories: 420,
        preparation_time_minutes: 10,
        sort_order: 3,
      }
    ]
  },
  {
    name: 'Ana Yemekler & Izgaralar',
    icon: 'Utensils',
    sort_order: 3,
    template_products: [
      {
        name: 'Izgara Kasap Köfte Tabağı',
        description: 'Közlenmiş domates ve biber, tereyağlı pirinç pilavı, sumaklı soğan ve çıtır patates eşliğinde 200g özel kasap köfte.',
        price: 360,
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
        calories: 720,
        preparation_time_minutes: 18,
        sort_order: 1,
      },
      {
        name: 'Kremalı Mantarlı Tavuk Külbastı',
        description: 'Marine edilmiş taze tavuk göğsü, sote mantar, krema sos, brokoli ve fırınlanmış patates.',
        price: 320,
        image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80',
        calories: 590,
        preparation_time_minutes: 16,
        sort_order: 2,
      }
    ]
  },
  {
    name: 'Burgerler & Dürümler',
    icon: 'Flame',
    sort_order: 4,
    template_products: [
      {
        name: 'Klasik Cheeseburger',
        description: '160g dana burger köftesi, eritilmiş çift cheddar, marul, domates, turşu ve özel burger sos.',
        price: 290,
        image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
        calories: 780,
        preparation_time_minutes: 15,
        sort_order: 1,
      },
      {
        name: 'Çıtır Tavuk Dürüm',
        description: 'Özel panelenmiş tavuk parçaları, cheddar, iceberg marul, patates ve ranch sos.',
        price: 240,
        image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80',
        calories: 610,
        preparation_time_minutes: 12,
        sort_order: 2,
      }
    ]
  },
  {
    name: 'Makarna & Pizzalar',
    icon: 'Pizza',
    sort_order: 5,
    template_products: [
      {
        name: 'Penne Arabbiata',
        description: 'Acılı domates sos, sarımsak, taze fesleğen, siyah zeytin ve rendelenmiş parmesan peyniri ile.',
        price: 260,
        image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281564?w=600&auto=format&fit=crop&q=80',
        calories: 520,
        preparation_time_minutes: 14,
        sort_order: 1,
      },
      {
        name: 'Karışık Taş Fırın Pizza',
        description: 'Mozzarella, sucuk, sosis, mantar, mısır, yeşil biber ve siyah zeytin.',
        price: 340,
        image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
        calories: 890,
        preparation_time_minutes: 18,
        sort_order: 2,
      }
    ]
  },
  {
    name: 'Taze Salatalar',
    icon: 'Salad',
    sort_order: 6,
    template_products: [
      {
        name: 'Izgara Tavuklu Sezar Salata',
        description: 'Iceberg marul, ızgara tavuk bonfile, kruton ekmek, sezar sos ve parmesan talaşı.',
        price: 270,
        image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&auto=format&fit=crop&q=80',
        calories: 420,
        preparation_time_minutes: 10,
        sort_order: 1,
      },
      {
        name: 'Akdeniz Yeşillikli Tulum Salata',
        description: 'Mevsim yeşillikleri, ceviz içi, kuru domates, nar ekşisi sos ve Erzincan tulum peyniri.',
        price: 240,
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        calories: 360,
        preparation_time_minutes: 8,
        sort_order: 2,
      }
    ]
  },
  {
    name: 'Tatlılar & Pastalar',
    icon: 'Cake',
    sort_order: 7,
    template_products: [
      {
        name: 'San Sebastian Cheesecake',
        description: 'Fırınlanmış kremsi İspanyol keki, sıcak Belçika çikolatası sosu ile.',
        price: 210,
        image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80',
        calories: 490,
        preparation_time_minutes: 5,
        sort_order: 1,
      },
      {
        name: 'Sıcak Çikolatalı Sufle',
        description: 'Akışkan sıcak çikolata dolgulu sufle, vanilyalı Maraş dondurması ile.',
        price: 195,
        image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
        calories: 550,
        preparation_time_minutes: 10,
        sort_order: 2,
      }
    ]
  },
  {
    name: 'Sıcak İçecekler',
    icon: 'Coffee',
    sort_order: 8,
    template_products: [
      {
        name: 'Geleneksel Demleme Çay',
        description: 'Rize yaylalarından taze demlenmiş bardak çay.',
        price: 35,
        image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
        calories: 5,
        preparation_time_minutes: 2,
        sort_order: 1,
      },
      {
        name: 'Türk Kahvesi (Tek / Çift)',
        description: 'Geleneksel közde pişmiş köpüklü Türk kahvesi, lokum ve su ile.',
        price: 70,
        image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
        calories: 20,
        preparation_time_minutes: 4,
        sort_order: 2,
      },
      {
        name: 'Caffe Latte',
        description: 'Taze çekilmiş espresso ve buharda ısıtılmış kadifemsi süt.',
        price: 110,
        image_url: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&auto=format&fit=crop&q=80',
        calories: 140,
        preparation_time_minutes: 3,
        sort_order: 3,
      }
    ]
  },
  {
    name: 'Soğuk İçecekler & Meşrubatlar',
    icon: 'GlassWater',
    sort_order: 9,
    template_products: [
      {
        name: 'Ev Yapımı Nane-Limonata',
        description: 'Taze sıkılmış limon, taze nane yaprakları ve buz ile servis edilir.',
        price: 95,
        image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
        calories: 110,
        preparation_time_minutes: 3,
        sort_order: 1,
      },
      {
        name: 'Ice Caramel Latte',
        description: 'Espresso, soğuk süt, buz ve karamel şurubu.',
        price: 125,
        image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
        calories: 180,
        preparation_time_minutes: 3,
        sort_order: 2,
      },
      {
        name: 'Kutu Meşrubatlar (Kola / Fanta / Sprite)',
        description: '330ml kutu soğuk içecek.',
        price: 65,
        image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
        calories: 140,
        preparation_time_minutes: 1,
        sort_order: 3,
      }
    ]
  }
];

export const defaultTables = (max: number = 10) => {
  return Array.from({ length: Math.min(Math.max(max, 1), 50) }, (_, i) => ({
    table_number: i + 1,
    table_name: `Masa ${i + 1}`,
    section: i < 4 ? 'Salon' : i < 8 ? 'Bahçe' : 'Teras'
  }));
};

