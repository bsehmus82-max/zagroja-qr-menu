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
  // 1. En Üstte: Şefin Özel Menüleri
  {
    name: 'Şefin Özel Menüleri & Spesiyaller',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    products: [
      {
        name: 'Şefin Özel Gurme Karışık Izgara Tabağı',
        description: 'Kuzu pirzola, antrikot dilimi, kasap köfte, tavuk külbastı, tereyağlı köz patlıcan beğendi, köz sebzeler ve sıcak tırnak pide ile',
        price: 590.0,
      },
      {
        name: 'Kaya Fırınında Ağır Ateşte Kuzu İncik',
        description: '8 saat kısık ateşte fırınlanmış kuzu incik, safranlı arpa şehriye pilavı ve taze kekikli kemik iliği sosu ile',
        price: 490.0,
      },
      {
        name: 'Trüf Soslu Dana Madalyon',
        description: 'Izgara dana bonfile madalyonları, trüf mantarı kreması, fırınlanmış bebek patates ve taze kuşkonmaz eşliğinde',
        price: 540.0,
      },
    ],
  },
  // 2. Serpme & Kahvaltılıklar
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
  // 3. Izgaralar & Ekmek Arası Çeşitleri
  {
    name: 'Izgaralar & Ekmek Arası Çeşitler',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
    products: [
      {
        name: 'Közde Izgara Kasap Köfte',
        description: '200 gr zırh kıyması kasap köfte, közlenmiş domates ve biber, sumaklı soğan ve tereyağlı pilav ile',
        price: 310.0,
      },
      {
        name: 'Ekmek Arası Izgara Kasap Köfte',
        description: 'Taze çıtır somun ekmekte ızgara köfte, domates, marul, sumaklı soğan ve çıtır patates kızartması ile',
        price: 210.0,
      },
      {
        name: 'Ekmek Arası Izgara Tavuk But',
        description: 'Özel marinasyonlu ızgara tavuk kalça dilimleri, marul, turşu, domates ve sarımsaklı mayonez',
        price: 190.0,
      },
      {
        name: 'Özel Marine Kuzu Şiş Porsiyon',
        description: 'Taze kekik ve zeytinyağı ile dinlendirilmiş kuzu but eti, köz sebzeler ve lavaş eşliğinde',
        price: 390.0,
      },
    ],
  },
  // 4. Burgerler & Sandviçler
  {
    name: 'Burgerler & Sandviçler',
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
        name: 'Club Sandviç Spesiyal',
        description: 'Tost ekmeğinde ızgara tavuk, dana jambon, kaşar peyniri, haşlanmış yumurta, domates, marul ve patates tava',
        price: 220.0,
      },
      {
        name: 'Çıtır Tavuk Burger',
        description: 'Özel marinasyonlu panelenmiş çıtır tavuk fileto, coleslaw salata, ballı hardal sos',
        price: 240.0,
      },
    ],
  },
  // 5. Taş Fırın & Pizzalar
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
        name: 'Taş Fırın Dört Peynirli Pizza (Quattro Formaggi)',
        description: 'Mozzarella, gorgonzola, parmesan ve taze keçi peyniri',
        price: 310.0,
      },
    ],
  },
  // 6. Pideler & Lahmacunlar
  {
    name: 'Pideler & Lahmacunlar',
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80',
    products: [
      {
        name: 'Taş Fırın Çıtır Lahmacun (Adet)',
        description: 'Zırh kıyması, maydanoz, domates, biber ve özel baharatlar ile çıtır ince hamur, yanında yeşillik tabağı ile',
        price: 95.0,
      },
      {
        name: 'Kuşbaşılı & Kaşarlı Taş Fırın Pidesi',
        description: 'Marine dana kuşbaşı et, taze kaşar eritmesi, tereyağı dokunuşu ile',
        price: 265.0,
      },
      {
        name: 'Geleneksel Kıymalı & Yumurtalı Pide',
        description: 'Taş fırında tereyağlı çıtır kenarlı, özel dana kıyma harçlı kapalı pide',
        price: 245.0,
      },
    ],
  },
  // 7. Tava & Fırın Yemekleri
  {
    name: 'Tava & Fırın Yemekleri',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    products: [
      {
        name: 'Tereyağlı Güveçte Dana Kavurma',
        description: 'Fırında güveç kabında dinlendirilmiş dana eti, arpacık soğan, domates, biber ve tırnak pide ile',
        price: 380.0,
      },
      {
        name: 'Kremalı Mantarlı Tavuk Sote Tava',
        description: 'Wok tavada sote tavuk bonfile parçaları, taze mantar, renkli biberler, krema sos ve tereyağlı pirinç pilavı ile',
        price: 285.0,
      },
      {
        name: 'Fırında Kaşarlı Köfte Güveç',
        description: 'Izgara köfteler, domates sos, fırınlanmış eritme kaşar peyniri ve köz biber eşliğinde',
        price: 320.0,
      },
    ],
  },
  // 8. Makarnalar & Salatalar
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
  // 9. Deniz Ürünleri & Balıklar
  {
    name: 'Deniz Ürünleri & Balıklar',
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
    products: [
      {
        name: 'Izgara Levrek Fileto',
        description: 'Kömür ateşinde ızgara taze deniz levreği, roka, kırmızı soğan, fırınlanmış bebek patates ve limon sosu ile',
        price: 420.0,
      },
      {
        name: 'Izgara Somon Stek',
        description: 'Norveç somon fileto, sote ıspanak, kuşkonmaz ve kapari limon sos eşliğinde',
        price: 460.0,
      },
      {
        name: 'Tereyağlı Sarımsaklı Karides Güveç',
        description: 'Güveçte tereyağı, sarımsak, pul biber ve domates sos ile fırınlanmış jumbo karidesler',
        price: 360.0,
      },
      {
        name: 'Çıtır Kalamar Tava',
        description: 'Taze altın rengi kızarmış çıtır kalamar halkaları, ev yapımı tarator sos ile',
        price: 320.0,
      },
    ],
  },
  // 10. Mezeler & Çorbalar
  {
    name: 'Mezeler & Çorbalar',
    image_url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&q=80',
    products: [
      {
        name: 'Günün Taze Süzme Mercimek Çorbası',
        description: 'Kıtır kruton ekmek, tereyağlı nane sosu ve taze limon dilimi ile',
        price: 95.0,
      },
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
        name: 'Girit Ezmesi & Şakşuka İkilisi',
        description: 'Antep fıstıklı peynir ezmesi ve zeytinyağlı patlıcan şakşuka',
        price: 160.0,
      },
    ],
  },
  // 11. Tatlılar & Pastalar
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
      {
        name: 'Tiramisu Tradizionale',
        description: 'İtalyan savoiardi bisküvisi, espresso kahve, mascarpone kreması ve kakao tozu ile',
        price: 160.0,
      },
    ],
  },
  // 12. Sıcak İçecekler & Kahveler
  {
    name: 'Sıcak İçecekler & Kahveler',
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
        name: 'Doğal Bitki Çayları (Ihlamur / Adaçayı / Yeşil Çay)',
        description: 'Doğal kurutulmuş bitki yaprakları, bal ve taze limon dilimi eşliğinde',
        price: 85.0,
      },
    ],
  },
  // 13. Soğuk İçecekler & Meyve Suları
  {
    name: 'Soğuk İçecekler & Meyve Suları',
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80',
    products: [
      {
        name: 'Taze Sıkılmış Portakal Suyu',
        description: '%100 doğal taze sıkılmış tatlı Akdeniz portakalı',
        price: 110.0,
      },
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
        name: 'Kutu Soğuk Meşrubat Çeşitleri (330 ml)',
        description: 'Kola, Şekersiz Kola, Portakallı Gazoz, Gazoz, Soğuk Şeftali Çayı',
        price: 65.0,
      },
      {
        name: 'Doğal Kaynak Maden Suyu',
        description: 'Zengin mineralli soda, buz ve limon dilimi eşliğinde',
        price: 45.0,
      },
    ],
  },
  // 14. Alkolsüz Kokteyller & Mocktailler
  {
    name: 'Alkolsüz Kokteyller & Mocktailler',
    image_url: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&q=80',
    products: [
      {
        name: 'Çilekli & Naneli Virgin Mojito',
        description: 'Taze çilek püresi, misket limonu, taze nane yaprakları ve buzlu soda ile',
        price: 145.0,
      },
      {
        name: 'Buzlu Orman Meyveli Hibiscus Mocktail',
        description: 'Demlenmiş soğuk hibiscus çiçeği, taze böğürtlen ve frambuaz taneleri',
        price: 135.0,
      },
      {
        name: 'Tropikal Passion Fruit Cooler',
        description: 'Çarkıfelek meyvesi püresi, ananas suyu, mango ve zencefil gazozu',
        price: 155.0,
      },
    ],
  },
  // 15. Alkollü İçecekler
  {
    name: 'Alkollü İçecekler',
    image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80',
    products: [
      {
        name: 'Fıçı Bira (50 cl)',
        description: 'Buz gibi taze çekim soğuk fıçı bira, tuzlu fıstık eşliğinde',
        price: 160.0,
      },
      {
        name: 'Şişe Bira Çeşitleri (33 cl / 50 cl)',
        description: 'Klasik Malt, Özel Seri veya İthal bira seçenekleriyle',
        price: 175.0,
      },
      {
        name: 'Kırmızı / Beyaz / Roze Kadeh Şarap',
        description: 'Seçkin yerli bağlardan fıçıda dinlendirilmiş kadeh şarap',
        price: 210.0,
      },
      {
        name: 'Klasik Mojito / Aperol Spritz',
        description: 'Taze meyveler, nane ve özel reçetelerle hazırlanan kokteyl',
        price: 280.0,
      },
    ],
  },
  // 16. Soslar & Ekstralar
  {
    name: 'Soslar & Ekstralar',
    image_url: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=600&q=80',
    products: [
      {
        name: 'Trüflü Mayonez Sos',
        description: 'Hakiki trüf yağı ile harmanlanmış ev yapımı mayonez (50 gr)',
        price: 40.0,
      },
      {
        name: 'Ballı Hardal & Sweet Chili Sos',
        description: 'Özel acı tatlı ve ballı hardal dip sos ikilisi',
        price: 35.0,
      },
      {
        name: 'Ekstra Cheddar Peyniri Sosu',
        description: 'Sıcak eritilmiş yoğun cheddar sos (60 gr)',
        price: 45.0,
      },
      {
        name: 'Ekstra Çıtır Patates Porsiyonu',
        description: 'Baharatlı çıtır patates kızartması ve sarımsaklı mayonez',
        price: 85.0,
      },
    ],
  },
];
