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
  // 1. En Üstte: Þefin Özel Menüleri
  {
    name: 'Þefin Özel Menüleri & Spesiyaller',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    products: [
      {
        name: 'Þefin Özel Gurme Karýþýk Izgara Tabaðý',
        description: 'Kuzu pirzola, antrikot dilimi, kasap köfte, tavuk külbastý, tereyaðlý köz patlýcan beðendi, köz sebzeler ve sýcak týrnak pide ile',
        price: 0.0,
      },
      {
        name: 'Kaya Fýrýnýnda Aðýr Ateþte Kuzu Ýncik',
        description: '8 saat kýsýk ateþte fýrýnlanmýþ kuzu incik, safranlý arpa þehriye pilavý ve taze kekikli kemik iliði sosu ile',
        price: 0.0,
      },
      {
        name: 'Trüf Soslu Dana Madalyon',
        description: 'Izgara dana bonfile madalyonlarý, trüf mantarý kremasý, fýrýnlanmýþ bebek patates ve taze kuþkonmaz eþliðinde',
        price: 0.0,
      },
    ],
  },
  // 2. Serpme & Kahvaltýlýklar
  {
    name: 'Serpme & Kahvaltýlýklar',
    image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
    products: [
      {
        name: 'Gurme Serpme Kahvaltý (2 Kiþilik)',
        description: 'Ezine beyaz peynir, eski kaþar, van otlu peynir, petek bal & kaymak, ev reçelleri, siyah & yeþil zeytin, sahanda tereyaðlý yumurta, piþi ve sýnýrsýz demlik çay ile',
        price: 0.0,
      },
      {
        name: 'Sucuklu & Kaþarlý Menemen',
        description: 'Köy domatesi, tatlý köy biberi, kasap sucuk ve taze kaþar eritmesi ile bakýr tavada',
        price: 0.0,
      },
      {
        name: 'Çýtýr Sýcak Piþi Tabaðý',
        description: '4 adet taze kýzartýlmýþ piþi, tulum peyniri ve böðürtlen reçeli eþliðinde',
        price: 0.0,
      },
    ],
  },
  // 3. Izgaralar & Ekmek Arasý Çeþitleri
  {
    name: 'Izgaralar & Ekmek Arasý Çeþitler',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
    products: [
      {
        name: 'Közde Izgara Kasap Köfte',
        description: '200 gr zýrh kýymasý kasap köfte, közlenmiþ domates ve biber, sumaklý soðan ve tereyaðlý pilav ile',
        price: 0.0,
      },
      {
        name: 'Ekmek Arasý Izgara Kasap Köfte',
        description: 'Taze çýtýr somun ekmekte ýzgara köfte, domates, marul, sumaklý soðan ve çýtýr patates kýzartmasý ile',
        price: 0.0,
      },
      {
        name: 'Ekmek Arasý Izgara Tavuk But',
        description: 'Özel marinasyonlu ýzgara tavuk kalça dilimleri, marul, turþu, domates ve sarýmsaklý mayonez',
        price: 0.0,
      },
      {
        name: 'Özel Marine Kuzu Þiþ Porsiyon',
        description: 'Taze kekik ve zeytinyaðý ile dinlendirilmiþ kuzu but eti, köz sebzeler ve lavaþ eþliðinde',
        price: 0.0,
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
        description: '2x90 gr dana eti, trüflü mayonez, karamelize soðan, eritilmiþ cheddar peyniri, çýtýr baharatlý patates tava ile',
        price: 0.0,
      },
      {
        name: 'Füme Barbekü Burger',
        description: '180 gr dana köfte, dana füme eti, füme barbekü sos, çýtýr soðan halkasý, patates kýzartmasý ile',
        price: 0.0,
      },
      {
        name: 'Club Sandviç Spesiyal',
        description: 'Tost ekmeðinde ýzgara tavuk, dana jambon, kaþar peyniri, haþlanmýþ yumurta, domates, marul ve patates tava',
        price: 0.0,
      },
      {
        name: 'Çýtýr Tavuk Burger',
        description: 'Özel marinasyonlu panelenmiþ çýtýr tavuk fileto, coleslaw salata, ballý hardal sos',
        price: 0.0,
      },
    ],
  },
  // 5. Taþ Fýrýn & Pizzalar
  {
    name: 'Taþ Fýrýn & Pizzalar',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
    products: [
      {
        name: 'Pizza Margherita Di Bufala',
        description: 'Ýtalyan domates sosu, manda mozzarellasý, taze fesleðen yapraklarý ve sýzma zeytinyaðý',
        price: 0.0,
      },
      {
        name: 'Pizza Al Funghi & Tartufo',
        description: 'Trüf kremasý, mozzarella, kültür ve kestane mantarlarý, taze kekik yapraklarý',
        price: 0.0,
      },
      {
        name: 'Taþ Fýrýn Dört Peynirli Pizza (Quattro Formaggi)',
        description: 'Mozzarella, gorgonzola, parmesan ve taze keçi peyniri',
        price: 0.0,
      },
    ],
  },
  // 6. Pideler & Lahmacunlar
  {
    name: 'Pideler & Lahmacunlar',
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80',
    products: [
      {
        name: 'Taþ Fýrýn Çýtýr Lahmacun (Adet)',
        description: 'Zýrh kýymasý, maydanoz, domates, biber ve özel baharatlar ile çýtýr ince hamur, yanýnda yeþillik tabaðý ile',
        price: 0.0,
      },
      {
        name: 'Kuþbaþýlý & Kaþarlý Taþ Fýrýn Pidesi',
        description: 'Marine dana kuþbaþý et, taze kaþar eritmesi, tereyaðý dokunuþu ile',
        price: 0.0,
      },
      {
        name: 'Geleneksel Kýymalý & Yumurtalý Pide',
        description: 'Taþ fýrýnda tereyaðlý çýtýr kenarlý, özel dana kýyma harçlý kapalý pide',
        price: 0.0,
      },
    ],
  },
  // 7. Tava & Fýrýn Yemekleri
  {
    name: 'Tava & Fýrýn Yemekleri',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    products: [
      {
        name: 'Tereyaðlý Güveçte Dana Kavurma',
        description: 'Fýrýnda güveç kabýnda dinlendirilmiþ dana eti, arpacýk soðan, domates, biber ve týrnak pide ile',
        price: 0.0,
      },
      {
        name: 'Kremalý Mantarlý Tavuk Sote Tava',
        description: 'Wok tavada sote tavuk bonfile parçalarý, taze mantar, renkli biberler, krema sos ve tereyaðlý pirinç pilavý ile',
        price: 0.0,
      },
      {
        name: 'Fýrýnda Kaþarlý Köfte Güveç',
        description: 'Izgara köfteler, domates sos, fýrýnlanmýþ eritme kaþar peyniri ve köz biber eþliðinde',
        price: 0.0,
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
        description: 'Taze el yapýmý fettuccine, ýzgara tavuk dilimleri, mantar, krema ve rendelenmiþ parmesan',
        price: 0.0,
      },
      {
        name: 'Penne All Arrabbiata',
        description: 'Acýlý Ýtalyan domates sosu, sarýmsak, taze fesleðen, dilimlenmiþ siyah zeytin ve parmesan',
        price: 0.0,
      },
      {
        name: 'Izgara Tavuklu Sezar Salata',
        description: 'Taze marul yapraklarý, ýzgara tavuk göðsü, kruton ekmek, parmesan rendesi ve özel sezar sos',
        price: 0.0,
      },
      {
        name: 'Akdeniz Tulum Peynirli Salata',
        description: 'Mevsim yeþillikleri, ceviz içi, kuru incir, Erzincan tulum peyniri ve nar ekþisi sosu',
        price: 0.0,
      },
    ],
  },
  // 9. Deniz Ürünleri & Balýklar
  {
    name: 'Deniz Ürünleri & Balýklar',
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
    products: [
      {
        name: 'Izgara Levrek Fileto',
        description: 'Kömür ateþinde ýzgara taze deniz levreði, roka, kýrmýzý soðan, fýrýnlanmýþ bebek patates ve limon sosu ile',
        price: 0.0,
      },
      {
        name: 'Izgara Somon Stek',
        description: 'Norveç somon fileto, sote ýspanak, kuþkonmaz ve kapari limon sos eþliðinde',
        price: 0.0,
      },
      {
        name: 'Tereyaðlý Sarýmsaklý Karides Güveç',
        description: 'Güveçte tereyaðý, sarýmsak, pul biber ve domates sos ile fýrýnlanmýþ jumbo karidesler',
        price: 0.0,
      },
      {
        name: 'Çýtýr Kalamar Tava',
        description: 'Taze altýn rengi kýzarmýþ çýtýr kalamar halkalarý, ev yapýmý tarator sos ile',
        price: 0.0,
      },
    ],
  },
  // 10. Mezeler & Çorbalar
  {
    name: 'Mezeler & Çorbalar',
    image_url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&q=80',
    products: [
      {
        name: 'Günün Taze Süzme Mercimek Çorbasý',
        description: 'Kýtýr kruton ekmek, tereyaðlý nane sosu ve taze limon dilimi ile',
        price: 0.0,
      },
      {
        name: 'Karamelize Soðanlý Sýcak Humus',
        description: 'Tereyaðýnda kavrulmuþ çam fýstýðý, karamelize soðan ve taze çýtýr pide eþliðinde',
        price: 0.0,
      },
      {
        name: 'Atom & Haydari Tabaðý',
        description: 'Süzme yoðurt, taze nane, sarýmsak ve tereyaðýnda hafif acý kurutulmuþ Arnavut biberi',
        price: 0.0,
      },
      {
        name: 'Girit Ezmesi & Þakþuka Ýkilisi',
        description: 'Antep fýstýklý peynir ezmesi ve zeytinyaðlý patlýcan þakþuka',
        price: 0.0,
      },
    ],
  },
  // 11. Tatlýlar & Pastalar
  {
    name: 'Tatlýlar & Pastalar',
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
    products: [
      {
        name: 'San Sebastian Cheesecake',
        description: 'Ýpeksi yumuþak dokulu fýrýnlanmýþ peynir keki, sýcak eritilmiþ Belçika sütlü çikolatasý eþliðinde',
        price: 0.0,
      },
      {
        name: 'Sýcak Çikolatalý Sufle',
        description: 'Hakiki bitter çikolatalý akýþkan sufle, Maraþ kesme dondurmasý ile',
        price: 0.0,
      },
      {
        name: 'Geleneksel Fýstýklý Havuç Dilim Baklava',
        description: 'Gaziantep sade yaðlý çýtýr baklava, yanýnda manda kaymaðý ile',
        price: 0.0,
      },
      {
        name: 'Tiramisu Tradizionale',
        description: 'Ýtalyan savoiardi bisküvisi, espresso kahve, mascarpone kremasý ve kakao tozu ile',
        price: 0.0,
      },
    ],
  },
  // 12. Sýcak Ýçecekler & Kahveler
  {
    name: 'Sýcak Ýçecekler & Kahveler',
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',
    products: [
      {
        name: 'Geleneksel Türk Kahvesi',
        description: 'Çifte kavrulmuþ taze çekim kahve, lokum ve damla sakýzlý su ile',
        price: 0.0,
      },
      {
        name: 'Caffe Latte & Cappuccino',
        description: 'Espresso, ipeksi sýcak kadifemsi süt köpüðü ile fincanda',
        price: 0.0,
      },
      {
        name: 'Demleme Taze Rize Çayý (Fincan)',
        description: 'Özel harman bergamot kokulu taze demlenmiþ çay',
        price: 0.0,
      },
      {
        name: 'Doðal Bitki Çaylarý (Ihlamur / Adaçayý / Yeþil Çay)',
        description: 'Doðal kurutulmuþ bitki yapraklarý, bal ve taze limon dilimi eþliðinde',
        price: 0.0,
      },
    ],
  },
  // 13. Soðuk Ýçecekler & Meyve Sularý
  {
    name: 'Soðuk Ýçecekler & Meyve Sularý',
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80',
    products: [
      {
        name: 'Taze Sýkýlmýþ Portakal Suyu',
        description: '%100 doðal taze sýkýlmýþ tatlý Akdeniz portakalý',
        price: 0.0,
      },
      {
        name: 'Ev Yapýmý Taze Nane-Limonata',
        description: 'Sýkma limon suyu, taze nane yapraklarý ve az þekerli doðal ferahlýk',
        price: 0.0,
      },
      {
        name: 'Geleneksel Köy Yayýk Ayraný',
        description: 'Köpüklü soðuk yayýk ayraný, kuru nane ile',
        price: 0.0,
      },
      {
        name: 'Kutu Soðuk Meþrubat Çeþitleri (330 ml)',
        description: 'Kola, Þekersiz Kola, Portakallý Gazoz, Gazoz, Soðuk Þeftali Çayý',
        price: 0.0,
      },
      {
        name: 'Doðal Kaynak Maden Suyu',
        description: 'Zengin mineralli soda, buz ve limon dilimi eþliðinde',
        price: 0.0,
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
        description: 'Taze çilek püresi, misket limonu, taze nane yapraklarý ve buzlu soda ile',
        price: 0.0,
      },
      {
        name: 'Buzlu Orman Meyveli Hibiscus Mocktail',
        description: 'Demlenmiþ soðuk hibiscus çiçeði, taze böðürtlen ve frambuaz taneleri',
        price: 0.0,
      },
      {
        name: 'Tropikal Passion Fruit Cooler',
        description: 'Çarkýfelek meyvesi püresi, ananas suyu, mango ve zencefil gazozu',
        price: 0.0,
      },
    ],
  },
  // 15. Alkollü Ýçecekler
  {
    name: 'Alkollü Ýçecekler',
    image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80',
    products: [
      {
        name: 'Fýçý Bira (50 cl)',
        description: 'Buz gibi taze çekim soðuk fýçý bira, tuzlu fýstýk eþliðinde',
        price: 0.0,
      },
      {
        name: 'Þiþe Bira Çeþitleri (33 cl / 50 cl)',
        description: 'Klasik Malt, Özel Seri veya Ýthal bira seçenekleriyle',
        price: 0.0,
      },
      {
        name: 'Kýrmýzý / Beyaz / Roze Kadeh Þarap',
        description: 'Seçkin yerli baðlardan fýçýda dinlendirilmiþ kadeh þarap',
        price: 0.0,
      },
      {
        name: 'Klasik Mojito / Aperol Spritz',
        description: 'Taze meyveler, nane ve özel reçetelerle hazýrlanan kokteyl',
        price: 0.0,
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
        description: 'Hakiki trüf yaðý ile harmanlanmýþ ev yapýmý mayonez (50 gr)',
        price: 0.0,
      },
      {
        name: 'Ballý Hardal & Sweet Chili Sos',
        description: 'Özel acý tatlý ve ballý hardal dip sos ikilisi',
        price: 0.0,
      },
      {
        name: 'Ekstra Cheddar Peyniri Sosu',
        description: 'Sýcak eritilmiþ yoðun cheddar sos (60 gr)',
        price: 0.0,
      },
      {
        name: 'Ekstra Çýtýr Patates Porsiyonu',
        description: 'Baharatlý çýtýr patates kýzartmasý ve sarýmsaklý mayonez',
        price: 0.0,
      },
    ],
  },
];
