import { DefaultCategory } from '../types';

export const defaultMenuTemplate: DefaultCategory[] = [
  {
    name: 'Günün Favorileri',
    icon: 'Sparkles',
    sort_order: 1,
    template_products: [
      {
        name: 'Şefin Spesiyali Burger',
        description: '200g ev yapımı dana köfte, karamelize soğan, cheddar peyniri, füme kaburga, trüflü mayonez ve patates kızartması ile.',
        price: 320,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        calories: 850,
        preparation_time_minutes: 20,
        sort_order: 1,
      },
      {
        name: 'Çıtır Tavuk Sepeti',
        description: 'Özel baharatlarla panelenmiş çıtır tavuk bonfile parçaları, patates kızartması, soğan halkası ve ballı hardal sos.',
        price: 260,
        image_url: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&auto=format&fit=crop&q=80',
        calories: 620,
        preparation_time_minutes: 15,
        sort_order: 2,
      },
    ],
  },
  {
    name: 'Kahvaltılar',
    icon: 'Coffee',
    sort_order: 2,
    template_products: [
      {
        name: 'İki Kişilik Serpme Kahvaltı',
        description: 'Ezine beyaz peynir, kaşar, tulum, siyah/yeşil zeytin, ev yapımı reçeller, bal-kaymak, sahanda sucuk, sigara böreği, pişi ve sınırsız çay.',
        price: 750,
        image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop&q=80',
        calories: 1200,
        preparation_time_minutes: 15,
        sort_order: 1,
      },
      {
        name: 'Sıcak Kahvaltı Tabağı',
        description: 'Izgara hellim, sosis, sucuk, sahanda yumurta, patates kızartması, ızgara mantar.',
        price: 350,
        image_url: 'https://images.unsplash.com/photo-1525351484163-9e45e52128b2?w=600&auto=format&fit=crop&q=80',
        calories: 750,
        preparation_time_minutes: 12,
        sort_order: 2,
      }
    ]
  }
];

export const defaultTables = [
  { table_number: 1, table_name: 'Masa 1', section: 'Bahçe' },
  { table_number: 2, table_name: 'Masa 2', section: 'Bahçe' },
  { table_number: 3, table_name: 'Masa 3', section: 'Salon' },
  { table_number: 4, table_name: 'Masa 4', section: 'Salon' },
  { table_number: 5, table_name: 'Masa 5', section: 'Teras' }
];
