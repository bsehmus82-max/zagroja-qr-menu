export interface FoodImageItem {
  id: string;
  title: string;
  category: string;
  tags: string[];
  url: string;
}

export const FOOD_IMAGE_CATEGORIES = [
  'Tümü',
  'Izgara & Kebap',
  'Burger & Sandviç',
  'Pizza & Fırın',
  'Pide & Lahmacun',
  'Kahvaltı',
  'Makarna & Salata',
  'Çorba & Meze',
  'Tava & Ev Yemekleri',
  'Deniz Ürünleri',
  'Tatlılar & Pastalar',
  'Kahve & Sıcak İçecek',
  'Soğuk İçecek & Meşrubat',
  'Kokteyller',
  'Atıştırmalık & Soslar',
];

export const FOOD_IMAGE_INVENTORY: FoodImageItem[] = [
  // IZGARA & KEBAP
  {
    id: 'kebab-1',
    title: 'Adana & Urfa Kebap',
    category: 'Izgara & Kebap',
    tags: ['kebap', 'adana', 'urfa', 'kıyma', 'şiş', 'ızgara', 'et', 'köz biber', 'lavaş'],
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'kebab-2',
    title: 'Kasap Köfte',
    category: 'Izgara & Kebap',
    tags: ['köfte', 'ızgara', 'kasap köfte', 'patates', 'ızgara köfte', 'et'],
    url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'kebab-3',
    title: 'Kuzu Pirzola & Antrikot',
    category: 'Izgara & Kebap',
    tags: ['pirzola', 'antrikot', 'kuzu', 'biftek', 'steak', 'bonfile', 'ızgara et'],
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'kebab-4',
    title: 'Tavuk Şiş & Kanat',
    category: 'Izgara & Kebap',
    tags: ['tavuk', 'tavuk şiş', 'kanat', 'ızgara tavuk', 'tavuk pirzola', 'beyaz et'],
    url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'kebab-5',
    title: 'Karışık Izgara Tabağı',
    category: 'Izgara & Kebap',
    tags: ['karışık ızgara', 'kebap', 'köfte', 'tavuk', 'antrikot', 'et tabağı', 'şef spesiyali'],
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'kebab-6',
    title: 'Et Döner & İskender Kebap',
    category: 'Izgara & Kebap',
    tags: ['döner', 'iskender', 'et döner', 'pide', 'yoğurt', 'tereyağlı'],
    url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80',
  },

  // BURGER & SANDVİÇ
  {
    id: 'burger-1',
    title: 'Klasik Cheeseburger',
    category: 'Burger & Sandviç',
    tags: ['cheeseburger', 'burger', 'hamburger', 'cheddar', 'köfte', 'patates'],
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'burger-2',
    title: 'Füme Barbekü Burger',
    category: 'Burger & Sandviç',
    tags: ['barbekü', 'bbq', 'füme', 'bacon', 'double burger', 'gurme burger'],
    url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'burger-3',
    title: 'Çıtır Tavuk Burger (Crispy Chicken)',
    category: 'Burger & Sandviç',
    tags: ['tavuk burger', 'crispy chicken', 'çıtır tavuk', 'burger', 'marul'],
    url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'burger-4',
    title: 'Club Sandviç & Patates',
    category: 'Burger & Sandviç',
    tags: ['club sandviç', 'sandviç', 'tost', 'kaşar', 'jambon', 'ekmek'],
    url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'burger-5',
    title: 'Tavuk Wrap & Dürüm',
    category: 'Burger & Sandviç',
    tags: ['wrap', 'dürüm', 'tavuk wrap', 'et wrap', 'lavaş', 'tortilla'],
    url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80',
  },

  // PIZZA & FIRIN
  {
    id: 'pizza-1',
    title: 'Pizza Margherita',
    category: 'Pizza & Fırın',
    tags: ['margherita', 'pizza', 'mozzarella', 'fesleğen', 'domates sos', 'italyan'],
    url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'pizza-2',
    title: 'Karışık & Sucuklu Pizza',
    category: 'Pizza & Fırın',
    tags: ['karışık pizza', 'sucuklu pizza', 'pepperoni', 'zeytin', 'mantar', 'biber'],
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'pizza-3',
    title: 'Dört Peynirli Pizza (Quattro Formaggi)',
    category: 'Pizza & Fırın',
    tags: ['peynirli pizza', 'quattro formaggi', 'gorgonzola', 'parmesan', 'mozzarella'],
    url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'pizza-4',
    title: 'Trüflü & Mantarlı Gurme Pizza',
    category: 'Pizza & Fırın',
    tags: ['mantarlı pizza', 'trüf', 'gurme pizza', 'şef pizza', 'taş fırın'],
    url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&auto=format&fit=crop&q=80',
  },

  // PİDE & LAHMACUN
  {
    id: 'pide-1',
    title: 'Çıtır Lahmacun',
    category: 'Pide & Lahmacun',
    tags: ['lahmacun', 'fındık lahmacun', 'kıymalı', 'maydanoz', 'limon', 'taş fırın'],
    url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'pide-2',
    title: 'Kuşbaşılı & Kaşarlı Pide',
    category: 'Pide & Lahmacun',
    tags: ['pide', 'kuşbaşılı pide', 'kaşarlı pide', 'karışık pide', 'kıymalı pide'],
    url: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'pide-3',
    title: 'Sucuklu & Yumurtalı Pide',
    category: 'Pide & Lahmacun',
    tags: ['sucuklu pide', 'yumurtalı pide', 'karadeniz pidesi', 'kapalı pide'],
    url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop&q=80',
  },

  // KAHVALTI
  {
    id: 'bf-1',
    title: 'Zengin Serpme Kahvaltı',
    category: 'Kahvaltı',
    tags: ['serpme kahvaltı', 'kahvaltı', 'peynir tabağı', 'zeytin', 'bal kaymak', 'reçel', 'çay'],
    url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'bf-2',
    title: 'Sahanda Sucuklu Yumurta & Menemen',
    category: 'Kahvaltı',
    tags: ['menemen', 'sucuklu yumurta', 'sahanda yumurta', 'omlet', 'tava'],
    url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'bf-3',
    title: 'Kaşarlı & Karışık Tost',
    category: 'Kahvaltı',
    tags: ['tost', 'kaşarlı tost', 'karışık tost', 'sucuklu tost', 'ayvalık tostu', 'kahvaltı'],
    url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'bf-4',
    title: 'Çıtır Pişi & Gözleme Tabağı',
    category: 'Kahvaltı',
    tags: ['pişi', 'gözleme', 'peynirli gözleme', 'patatesli gözleme', 'hamur işi'],
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'bf-5',
    title: 'Kruvasan & Reçel Tabağı',
    category: 'Kahvaltı',
    tags: ['kruvasan', 'croissant', 'tereyağı', 'çilek reçeli', 'kahvaltı'],
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
  },

  // MAKARNA & SALATA
  {
    id: 'pasta-1',
    title: 'Fettuccine Alfredo & Tavuklu Makarna',
    category: 'Makarna & Salata',
    tags: ['makarna', 'fettuccine', 'alfredo', 'kremalı', 'tavuklu makarna', 'parmesan'],
    url: 'https://images.unsplash.com/photo-1621996346565-e3d5d628124b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'pasta-2',
    title: 'Penne Arrabbiata & Acılı Makarna',
    category: 'Makarna & Salata',
    tags: ['penne', 'arrabbiata', 'domatesli', 'acılı makarna', 'italyan'],
    url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'pasta-3',
    title: 'Tavuklu Sezar Salata',
    category: 'Makarna & Salata',
    tags: ['sezar salata', 'caesar salad', 'tavuklu salata', 'kruton', 'parmesan'],
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'pasta-4',
    title: 'Akdeniz & Tulum Peynirli Salata',
    category: 'Makarna & Salata',
    tags: ['akdeniz salata', 'tulum peynirli', 'roka', 'cevizli', 'zeytinyağlı', 'yeşil salata'],
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
  },

  // ÇORBA & MEZE
  {
    id: 'soup-1',
    title: 'Süzme Mercimek Çorbası',
    category: 'Çorba & Meze',
    tags: ['çorba', 'mercimek çorbası', 'kırmızı mercimek', 'kıtır ekmek', 'limon'],
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'soup-2',
    title: 'Ezogelin & Domates Çorbası',
    category: 'Çorba & Meze',
    tags: ['ezogelin', 'domates çorbası', 'kaşarlı', 'sıcak çorba', 'çorbalar'],
    url: 'https://images.unsplash.com/photo-1588566565463-180a5b2090f2?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'meze-1',
    title: 'Humus & Nohut Mezesi',
    category: 'Çorba & Meze',
    tags: ['humus', 'tahin', 'nohut', 'tereyağlı humus', 'meze', 'soğuk meze'],
    url: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'meze-2',
    title: 'Karışık Meze Tabağı (Haydari, Şakşuka, Atom)',
    category: 'Çorba & Meze',
    tags: ['meze tabağı', 'haydari', 'şakşuka', 'atom', 'girit ezmesi', 'yoğurtlu meze'],
    url: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&auto=format&fit=crop&q=80',
  },

  // TAVA & EV YEMEKLERİ
  {
    id: 'main-1',
    title: 'Sac Tava & Dana Kavurma',
    category: 'Tava & Ev Yemekleri',
    tags: ['sac tava', 'kavurma', 'dana eti', 'biber', 'domates', 'fırın yemekleri'],
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'main-2',
    title: 'Kayseri Mantısı (Yoğurtlu & Soslu)',
    category: 'Tava & Ev Yemekleri',
    tags: ['mantı', 'kayseri mantısı', 'yoğurt', 'sarımsaklı', 'tereyağlı sos', 'sumak'],
    url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'main-3',
    title: 'Tavuk Sote & Pilav',
    category: 'Tava & Ev Yemekleri',
    tags: ['tavuk sote', 'pirinç pilavı', 'sebzeli tavuk', 'tava yemeği'],
    url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80',
  },

  // DENİZ ÜRÜNLERİ
  {
    id: 'fish-1',
    title: 'Izgara Levrek & Çipura',
    category: 'Deniz Ürünleri',
    tags: ['levrek', 'çipura', 'ızgara balık', 'balık', 'roka', 'limon', 'deniz ürünleri'],
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'fish-2',
    title: 'Somon Izgara & Kuşkonmaz',
    category: 'Deniz Ürünleri',
    tags: ['somon', 'somon ızgara', 'salmon', 'fırında somon', 'balık tabağı'],
    url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'fish-3',
    title: 'Çıtır Kalamar Tava & Tarator',
    category: 'Deniz Ürünleri',
    tags: ['kalamar', 'kalamar tava', 'tarator sos', 'karides', 'karides güveç'],
    url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&auto=format&fit=crop&q=80',
  },

  // TATLILAR & PASTALAR
  {
    id: 'dessert-1',
    title: 'San Sebastian Cheesecake',
    category: 'Tatlılar & Pastalar',
    tags: ['cheesecake', 'san sebastian', 'çikolata soslu', 'tatlı', 'pasta'],
    url: 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'dessert-2',
    title: 'Sıcak Çikolatalı Sufle & Dondurma',
    category: 'Tatlılar & Pastalar',
    tags: ['sufle', 'çikolata', 'sıcak sufle', 'dondurmalı', 'fondü'],
    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'dessert-3',
    title: 'Antep Fıstıklı Baklava',
    category: 'Tatlılar & Pastalar',
    tags: ['baklava', 'fıstıklı baklava', 'şerbetli tatlı', 'havuç dilimi', 'kaymaklı'],
    url: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'dessert-4',
    title: 'İtalyan Tiramisu',
    category: 'Tatlılar & Pastalar',
    tags: ['tiramisu', 'kahveli tatlı', 'mascarpone', 'kedidili', 'kakao'],
    url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'dessert-5',
    title: 'Çilekli & Muzlu Magnolia',
    category: 'Tatlılar & Pastalar',
    tags: ['magnolia', 'çilekli magnolia', 'muzlu magnolia', 'sütlü tatlı', 'kremalı'],
    url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&auto=format&fit=crop&q=80',
  },

  // KAHVE & SICAK İÇECEK
  {
    id: 'coffee-1',
    title: 'Közde Türk Kahvesi & Lokum',
    category: 'Kahve & Sıcak İçecek',
    tags: ['türk kahvesi', 'kahve', 'közde kahve', 'lokum', 'su', 'kahveler'],
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'coffee-2',
    title: 'Caffè Latte & Cappuccino',
    category: 'Kahve & Sıcak İçecek',
    tags: ['latte', 'cappuccino', 'sütlü kahve', 'latte art', 'espresso'],
    url: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'coffee-3',
    title: 'Taze Filtre Kahve & Americano',
    category: 'Kahve & Sıcak İçecek',
    tags: ['filtre kahve', 'americano', 'siyah kahve', 'v60', 'chemex', 'espresso'],
    url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tea-1',
    title: 'Demleme İnce Belli Çay',
    category: 'Kahve & Sıcak İçecek',
    tags: ['çay', 'türk çayı', 'ince belli', 'demlik çay', 'sıcak çay'],
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tea-2',
    title: 'Bitki Çayları & Ihlamur / Adaçayı',
    category: 'Kahve & Sıcak İçecek',
    tags: ['bitki çayı', 'ıhlamur', 'adaçayı', 'yeşil çay', 'papatya', 'bal', 'limon'],
    url: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80',
  },

  // SOĞUK İÇECEK & MEŞRUBAT
  {
    id: 'cold-1',
    title: 'Ev Yapımı Naneli Limonata',
    category: 'Soğuk İçecek & Meşrubat',
    tags: ['limonata', 'naneli limonata', 'soğuk içecek', 'buzlu', 'ferahlatıcı'],
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cold-2',
    title: 'Taze Sıkma Portakal Suyu',
    category: 'Soğuk İçecek & Meşrubat',
    tags: ['portakal suyu', 'meyve suyu', 'taze sıkma', 'vitamin', 'kahvaltılık içecek'],
    url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cold-3',
    title: 'Köpüklü Yayık Ayran',
    category: 'Soğuk İçecek & Meşrubat',
    tags: ['ayran', 'yayık ayran', 'köpüklü ayran', 'yoğurt', 'soğuk içecek'],
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cold-4',
    title: 'Soğuk Kahve (Iced Latte / Iced Americano)',
    category: 'Soğuk İçecek & Meşrubat',
    tags: ['iced latte', 'iced americano', 'soğuk kahve', 'frappe', 'buzlu kahve'],
    url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
  },

  // KOKTEYLLER
  {
    id: 'cocktail-1',
    title: 'Taze Mojito & Mint Cooler',
    category: 'Kokteyller',
    tags: ['mojito', 'mocktail', 'kokteyl', 'nane', 'misket limonu', 'alkolsüz kokteyl'],
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cocktail-2',
    title: 'Çilekli & Hibiscus Cooler',
    category: 'Kokteyller',
    tags: ['çilekli kokteyl', 'hibiscus', 'kırmızı kokteyl', 'buzlu kokteyl', 'mocktail'],
    url: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cocktail-3',
    title: 'Passion Fruit & Egzotik Spritz',
    category: 'Kokteyller',
    tags: ['passion fruit', 'spritz', 'egzotik kokteyl', 'meyveli', 'yaz kokteyli'],
    url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80',
  },

  // ATIŞTIRMALIK & SOSLAR
  {
    id: 'snack-1',
    title: 'Baharatlı Çıtır Patates Kızartması',
    category: 'Atıştırmalık & Soslar',
    tags: ['patates kızartması', 'french fries', 'parmak patates', 'elma dilim', 'çıtır'],
    url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'snack-2',
    title: 'Çıtır Soğan Halkası & Mozzarella Sticks',
    category: 'Atıştırmalık & Soslar',
    tags: ['soğan halkası', 'mozzarella sticks', 'atıştırmalık', 'finger food', 'dip sos'],
    url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'snack-3',
    title: 'Gurme Soslar (Trüflü Mayonez, Cheddar, BBQ)',
    category: 'Atıştırmalık & Soslar',
    tags: ['sos', 'trüflü mayonez', 'cheddar sos', 'barbekü sos', 'ranch sos', 'hardal'],
    url: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=600&auto=format&fit=crop&q=80',
  },
];
