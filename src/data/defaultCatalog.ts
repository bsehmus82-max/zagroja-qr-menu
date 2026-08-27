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
        name: 'Gurme Serpme Kahvaltı (2 Kişilik)',
        description: 'Ezine beyaz peynir, eski kaşar, van otlu peynir, petek bal & kaymak, ev reçelleri, siyah & yeşil zeytin, sahanda tereyağlı yumurta, pişi ve sınırsız demlik çay ile',
        price: 480.0,
      },
      {
        name: 'Sucuklu & Kaşarlı Menemen',
        description: 'Köy domatesi, tatlı köy biberi, kasap sucuk ve taze kaşar eritmesi ile bakır tavada',
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
    name: 'Izgara & Kebap Çeşitleri',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    products: [
      {
        name: 'Közde Izgara Kasap Köfte',
        description: '200 gr zırh kıyması kasap köfte, közlenmiş domates ve biber, tırnak pide, sumaklı soğan ve tereyağlı pilav ile',
        price: 310.0,
      },
      {
        name: 'Lokum Dana Bonfile (220 gr)',
        description: 'Meşe kömüründe ızgara dana bonfile dilimleri, fırınlanmış patates püresi ve biberiye sosu ile',
        price: 520.0,
      },
      {
        name: 'Özel Marine Kuzu Şiş',
        description: 'Taze kekik ve zeytinyağı ile dinlendirilmiş kuzu but eti, köz sebzeler ve lavaş eşliğinde',
        price: 390.0,
      },
      {
        name: 'Kremalı Mantarlı Tavuk Külbastı',
        description: 'Marine edilmiş ızgara tavuk kalça, taze mantar kreması sosu ve fırınlanmış bebek patates ile',
        price: 275.0,
      },
    ],
  },
  {
    name: 'Taş Fırın & Pizzalar',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
    products: [
      {
        name: 'Pizza Margherita Di Bufala',
        description: 'İtalyan domates sosu, manda mozzarellası, taze fesleğen yaprakları ve sızma zeytinyağı',
        price: 260.0,
      },
      {
        name: 'Pizza Al Funghi & Tartufo',
        description: 'Trüf kreması, mozzarella, kültür ve kestane mantarları, taze kekik yaprakları',
        price: 290.0,
      },
      {
        name: 'Taş Fırın Karışık Şef Pizzası',
        description: 'Özel domates sos, mozzarella, dana sucuk, mantar, köz biber, mısır ve siyah zeytin',
        price: 315.0,
      },
    ],
  },
  {
    name: 'Gurme Burgerler',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    products: [
      {
        name: 'Trüflü Smash Burger',
        description: '2x90 gr dana eti, trüflü mayonez, karamelize soğan, eritilmiş cheddar peyniri, çıtır baharatlı patates tava ile',
        price: 295.0,
      },
      {
        name: 'Füme Barbekü Burger',
        description: '180 gr dana köfte, dana füme eti, füme barbekü sos, çıtır soğan halkası, patates kızartması ile',
        price: 320.0,
      },
      {
        name: 'Çıtır Tavuk Burger',
        description: 'Özel marinasyonlu panelenmiş çıtır tavuk fileto, coleslaw salata, ballı hardal sos',
        price: 240.0,
      },
    ],
  },
  {
    name: 'Makarnalar & Salatalar',
    image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&q=80',
    products: [
      {
        name: 'Fettuccine Alfredo con Pollo',
        description: 'Taze el yapımı fettuccine, ızgara tavuk dilimleri, mantar, krema ve rendelenmiş parmesan',
        price: 265.0,
      },
      {
        name: 'Penne All Arrabbiata',
        description: 'Acılı İtalyan domates sosu, sarımsak, taze fesleğen, dilimlenmiş siyah zeytin ve parmesan',
        price: 220.0,
      },
      {
        name: 'Izgara Tavuklu Sezar Salata',
        description: 'Taze marul yaprakları, ızgara tavuk göğsü, kruton ekmek, parmesan rendesi ve özel sezar sos',
        price: 240.0,
      },
      {
        name: 'Akdeniz Tulum Peynirli Salata',
        description: 'Mevsim yeşillikleri, ceviz içi, kuru incir, Erzincan tulum peyniri ve nar ekşisi sosu',
        price: 210.0,
      },
    ],
  },
  {
    name: 'Taze Mezeler & Başlangıçlar',
    image_url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&q=80',
    products: [
      {
        name: 'Karamelize Soğanlı Sıcak Humus',
        description: 'Tereyağında kavrulmuş çam fıstığı, karamelize soğan ve taze çıtır pide eşliğinde',
        price: 165.0,
      },
      {
        name: 'Atom & Haydari Tabağı',
        description: 'Süzme yoğurt, taze nane, sarımsak ve tereyağında hafif acı kurutulmuş Arnavut biberi',
        price: 155.0,
      },
      {
        name: 'Çıtır Atıştırmalık Sepeti',
        description: 'Mozzarella sticks, çıtır soğan halkaları, çıtır tavuk parçaları, baharatlı elma dilim patates ve dip soslar',
        price: 245.0,
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
        description: 'Hakiki bitter çikolatalı akışkan sufle, Maraş kesme dondurması ile',
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
    name: 'Sıcak Kahveler & Çaylar',
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',
    products: [
      {
        name: 'Geleneksel Türk Kahvesi',
        description: 'Çifte kavrulmuş taze çekim kahve, lokum ve damla sakızlı su ile',
        price: 75.0,
      },
      {
        name: 'Caffe Latte & Cappuccino',
        description: 'Espresso, ipeksi sıcak kadifemsi süt köpüğü ile fincanda',
        price: 115.0,
      },
      {
        name: 'Demleme Taze Rize Çayı (Fincan)',
        description: 'Özel harman bergamot kokulu taze demlenmiş çay',
        price: 35.0,
      },
      {
        name: 'Bitki Çayları (Adaçayı, Ihlamur, Yeşil Çay)',
        description: 'Doğal kurutulmuş bitki yaprakları, bal ve taze limon dilimi eşliğinde french press ile',
        price: 85.0,
      },
    ],
  },
  {
    name: 'Soğuk İçecekler & Meşrubatlar',
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80',
    products: [
      {
        name: 'Ev Yapımı Taze Nane-Limonata',
        description: 'Sıkma limon suyu, taze nane yaprakları ve az şekerli doğal ferahlık',
        price: 95.0,
      },
      {
        name: 'Geleneksel Köy Yayık Ayranı',
        description: 'Köpüklü soğuk yayık ayranı, kuru nane ile',
        price: 55.0,
      },
      {
        name: 'Kutu Soğuk Meşrubat Çeşitleri',
        description: 'Kola, Şekersiz Kola, Portakallı Gazoz, Gazoz, Soğuk Şeftali Çayı seçenekleriyle (330 ml)',
        price: 65.0,
      },
      {
        name: 'Doğal Kaynak Maden Suyu',
        description: 'Zengin mineralli soda, buz ve limon dilimi eşliğinde',
        price: 45.0,
      },
    ],
  },
  {
    name: 'Taze Meyve Suları & Mocktailler',
    image_url: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&q=80',
    products: [
      {
        name: 'Taze Sıkılmış Portakal Suyu',
        description: '%100 doğal taze sıkılmış tatlı Akdeniz portakalı',
        price: 110.0,
      },
      {
        name: 'Çilekli & Naneli Virgin Mojito',
        description: 'Taze çilek püresi, misket limonu, taze nane yaprakları ve buzlu soda ile',
        price: 145.0,
      },
      {
        name: 'Buzlu Orman Meyveli Hibiscus',
        description: 'Demlenmiş soğuk hibiscus, böğürtlen ve frambuaz taneleri ile',
        price: 125.0,
      },
    ],
  },
];
