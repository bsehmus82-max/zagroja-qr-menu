export interface DefaultCategoryTemplate {
  name: string;
  image_url: string;
  products: {
    name: string;
    description: string;
    price: number;
  }[];
}

export const DEFAULT_CATEGORIES: DefaultCategoryTemplate[] = [
  {
    name: 'Serpme & Kahvaltılıklar',
    image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
    products: [
      {
        name: 'Zagroja Gurme Serpme Kahvaltı (2 Kişilik)',
        description: 'Ezine beyaz peynir, eski kaşar, van otlu peynir, petek bal & kaymak, ev reçelleri, siyah & yeşil zeytin, sahanda tereyağlı yumurta, pişi ve sınırsız demlik çay ile',
        price: 480.0,
      },
      {
        name: 'Sucuklu & Kaşarlı Menemen',
        description: 'Köy domatesi, tatlı köy biberi, kasap sucuk ve taze kaşar eritmesi ile',
        price: 185.0,
      },
      {
        name: 'Çıtır Sıcak Pişi Tabağı',
        description: '4 adet taze kızartılmış pişi, tulum peyniri ve böğürtlen reçeli eşliğinde',
        price: 130.0,
      },
    ],
  },
  {
    name: 'Sıcak & Soğuk Kahveler',
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',
    products: [
      {
        name: 'Geleneksel Türk Kahvesi',
        description: 'Çifte kavrulmuş taze çekim kahve, lokum ve damla sakızlı su ile',
        price: 75.0,
      },
      {
        name: 'Caramel Macchiato (Sıcak/Soğuk)',
        description: 'Espresso, ipeksi buharda süt, vanilya şurubu ve ev yapımı karamel sos',
        price: 125.0,
      },
      {
        name: 'Iced Spanish Latte',
        description: 'Duble espresso, tatlandırılmış yoğunlaştırılmış süt, taze süt ve buz',
        price: 135.0,
      },
      {
        name: 'Cortado Special',
        description: 'Eşit oranda yoğun espresso ve sıcak kadifemsi süt köpüğü',
        price: 110.0,
      },
    ],
  },
  {
    name: 'Gurme Burgerler',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    products: [
      {
        name: 'Zagroja Trüflü Smash Burger',
        description: '2x90 gr dana eti, trüflü mayonez, karamelize soğan, eritilmiş cheddar peyniri, çıtır baharatlı patates tava ile',
        price: 295.0,
      },
      {
        name: 'Smoked BBQ Bacon Burger',
        description: '180 gr dana köfte, dana füme kaburga, füme barbekü sos, çıtır soğan halkası, patates kızartması ile',
        price: 320.0,
      },
      {
        name: 'Crispy Sweet Chili Tavuk Burger',
        description: 'Özel marinasyonlu panelenmiş çıtır tavuk fileto, coleslaw salata, sweet chili mayonez',
        price: 240.0,
      },
    ],
  },
  {
    name: 'Taş Fırın Pizzalar',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
    products: [
      {
        name: 'Pizza Margherita Di Bufala',
        description: 'İtalyan domates sosu, manda mozzarellası, taze fesleğen yaprakları ve sızma zeytinyağı',
        price: 260.0,
      },
      {
        name: 'Pizza Al Funghi & Tartufo',
        description: 'Trüf kreması, mozzarella, kültür ve kestane mantarları, taze kekik',
        price: 290.0,
      },
      {
        name: 'Pizza Bresaola & Roka',
        description: 'Mozzarella, dana bresaola dilimleri, bebek roka, parmesan tekeri rendesi, balsamik glaze',
        price: 345.0,
      },
    ],
  },
  {
    name: 'Izgaralar & Ana Yemekler',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    products: [
      {
        name: 'Közde Izgara Kasap Köfte',
        description: '200 gr zırh kıyması kasap köfte, közlenmiş domates ve biber, tırnak pide, sumaklı soğan ve tereyağlı pilav ile',
        price: 310.0,
      },
      {
        name: 'Lokum Dana Bonfile (220 gr)',
        description: 'Izgara dana bonfile dilimleri, trüflü patates püresi, ızgara kuşkonmaz ve biberiye sosu ile',
        price: 520.0,
      },
      {
        name: 'Kremalı Mantarlı Tavuk Külbastı',
        description: 'Marine edilmiş ızgara tavuk kalça, taze mantar kreması sosu, fırınlanmış bebek patates ile',
        price: 275.0,
      },
    ],
  },
  {
    name: 'Çıtır Atıştırmalıklar & Mezeler',
    image_url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&q=80',
    products: [
      {
        name: 'Zagroja Combo Snack Sepeti',
        description: 'Mozzarella sticks, çıtır soğan halkaları, cajun baharatlı tavuk tenders, elma dilim patates, 3 çeşit özel dip sos ile',
        price: 245.0,
      },
      {
        name: 'Trüflü & Parmesanlı Patates Tava',
        description: 'Taze trüf yağı, rendelenmiş parmesan peyniri ve frenk maydanozu ile',
        price: 155.0,
      },
    ],
  },
  {
    name: 'Tatlılar & Pastalar',
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
    products: [
      {
        name: 'San Sebastian Cheesecake',
        description: 'İpeksi yumuşak dokulu fırınlanmış peynir keki, sıcak eritilmiş Belçika sütlü çikolatası eşliğinde',
        price: 175.0,
      },
      {
        name: 'Sıcak Çikolatalı Sufle',
        description: 'Hakiki Callebaut bitter çikolatalı akışkan sufle, Maraş kesme dondurması ile',
        price: 165.0,
      },
      {
        name: 'Geleneksel Fıstıklı Havuç Dilim Baklava',
        description: 'Gaziantep sade yağlı çıtır baklava, yanında manda kaymağı ile',
        price: 195.0,
      },
    ],
  },
  {
    name: 'Meşrubat & Soğuk İçecekler',
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80',
    products: [
      {
        name: 'Ev Yapımı Taze Nane-Limonata',
        description: 'Sıkma limon suyu, taze nane yaprakları ve az şekerli doğal ferahlık',
        price: 95.0,
      },
      {
        name: 'Organik Hibiscus & Böğürtlen Çayı',
        description: 'Buzlu demlenmiş hibiscus çiçeği, taze böğürtlen taneleri ve çubuk tarçın aroması',
        price: 105.0,
      },
      {
        name: 'Maden Suyu & Soda Çeşitleri',
        description: 'Doğal mineralli soda, limon dilimi eşliğinde',
        price: 45.0,
      },
      {
        name: 'Kutu Meşrubatlar (Coca-Cola, Fanta, Sprite, Fuse Tea)',
        description: '330 ml soğuk teneke kutu',
        price: 65.0,
      },
    ],
  },
  {
    name: 'Enerji İçecekleri',
    image_url: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=600&q=80',
    products: [
      {
        name: 'Red Bull Energy Drink (250 ml)',
        description: 'Klasik, Sugarfree veya Summer Edition seçenekleriyle buz ve limon dilimi eşliğinde',
        price: 90.0,
      },
      {
        name: 'Monster Energy (500 ml)',
        description: 'Orijinal Green veya Mango Loco seçenekleriyle',
        price: 110.0,
      },
    ],
  },
  {
    name: 'Alkollü İçecekler & Kokteyller',
    image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80',
    products: [
      {
        name: 'Klasik Mojito Kokteyl',
        description: 'Beyaz rom, taze misket limonu, taze nane, esmer şeker ve soda',
        price: 280.0,
      },
      {
        name: 'Aperol Spritz',
        description: 'Aperol, Prosecco, soda ve taze portakal dilimi ile kadehte',
        price: 295.0,
      },
      {
        name: 'Fıçı Bira (50 cl)',
        description: 'Buz gibi taze çekim fıçı bira, tuzlu fıstık eşliğinde',
        price: 160.0,
      },
      {
        name: 'Şişe Bira Çeşitleri (33 cl / 50 cl)',
        description: 'Efes Özel Seri, Tuborg Gold, Corona veya Heineken seçenekleriyle',
        price: 175.0,
      },
    ],
  },
];
