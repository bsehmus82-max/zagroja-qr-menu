export interface DefaultCatalogCategory {
  id: string;
  name: string;
  image_url: string;
  products: {
    name: string;
    description: string;
    price: number;
  }[];
}

export const DEFAULT_CATALOG: DefaultCatalogCategory[] = [
  {
    id: 'kahvalti',
    name: 'Kahvaltýlýklar',
    image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
    products: [
      { name: 'Serpme Köy Kahvaltýsý (2 Kiþilik)', description: 'Ezine peyniri, kaþar, tulum, petek bal, kaymak, reçel, zeytin çeþitleri, tereyaðý, sahanda yumurta, piþi ve sýnýrsýz çay ile.', price: 580 },
      { name: 'Hýzlý Kahvaltý Tabaðý', description: 'Beyaz peynir, kaþar, zeytin, haþlanmýþ yumurta, domates, salatalýk, reçel, tereyaðý ve 1 fincan çay.', price: 240 },
      { name: 'Geleneksel Menemen', description: 'Tereyaðýnda sotelenmiþ taze köy domatesi, tatlý köy biberi ve çiftlik yumurtasý.', price: 170 },
      { name: 'Kaþarlý Menemen', description: 'Taze köy domatesi, tatlý biber, çiftlik yumurtasý ve eritilmiþ Trakya kaþar peyniri.', price: 195 },
      { name: 'Kayseri Sucuklu Sahanda Yumurta', description: 'Hakiki dana kangal sucuk ve çiftlik yumurtasý.', price: 210 },
      { name: 'Karýþýk Bazlama Tost', description: 'Kasap sucuðu, eritme kaþar peyniri, domates dilimleri ve yanýnda patates kýzartmasý ile.', price: 185 },
      { name: 'Köy Peynirli & Domatesli Tost', description: 'Ezine beyaz peyniri, taze domates, kekik ve zeytinyaðý.', price: 160 }
    ]
  },
  {
    id: 'sicak_icecekler',
    name: 'Sýcak Ýçecekler',
    image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    products: [
      { name: 'Rize Demleme Çay (Ýnce Belli)', description: 'Özel harman taze demlenmiþ geleneksel siyah çay.', price: 35 },
      { name: 'Fincan Çay', description: 'Büyük porsiyon taze demlenmiþ çay.', price: 50 },
      { name: 'Geleneksel Türk Kahvesi', description: 'Taþ fýrýnda taze çekilmiþ, lokum ve su ile servis edilir.', price: 75 },
      { name: 'Damla Sakýzlý Türk Kahvesi', description: 'Hakiki sakýz aromasý, lokum ve su eþliðinde.', price: 85 },
      { name: 'Sütlü Sýcak Çikolata', description: 'Yoðun Belçika çikolatasý ve tam yaðlý süt.', price: 120 },
      { name: 'Hakiki Dað Sahlepi', description: 'Hakiki dað orkidesi sahlebi, tarçýn eþliðinde.', price: 130 },
      { name: 'Ihlamur & Bal', description: 'Taze yaprak ýhlamur, limon dilimi ve organik bal.', price: 90 },
      { name: 'Kýþ Çayý (Zencefil & Tarçýn)', description: 'Zencefil, zerdeçal, çubuk tarçýn, karanfil, elma ve bal.', price: 95 }
    ]
  },
  {
    id: 'kahveler',
    name: 'Özel Kahveler (Espresso Bar)',
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    products: [
      { name: 'Single Espresso', description: '%100 Arabica özel çekirdek harmaný.', price: 70 },
      { name: 'Double Espresso', description: 'Çift shot yoðun Ýtalyan espressosu.', price: 90 },
      { name: 'Americano', description: 'Sýcak su üzerine çift shot espresso.', price: 100 },
      { name: 'Caffe Latte', description: 'Espresso, buharda ýsýtýlmýþ ipeksi süt ve hafif süt kremasý.', price: 115 },
      { name: 'Cappuccino', description: 'Eþit oranda espresso, sýcak süt ve yoðun süt köpüðü.', price: 115 },
      { name: 'Flat White', description: 'Çift shot ristretto ve mikro köpüklü sýcak süt.', price: 120 },
      { name: 'Caramel Macchiato', description: 'Vanilya þurubu, sýcak süt, espresso ve üzerinde karamel sos.', price: 135 },
      { name: 'Mocha (Dark / White)', description: 'Espresso, yoðun çikolata sosu ve buharlanmýþ süt.', price: 135 },
      { name: 'Filtre Kahve (Günün Çekirdeði)', description: 'Taze demlenmiþ single origin filtre kahve.', price: 95 }
    ]
  },
  {
    id: 'soguk_icecekler',
    name: 'Soðuk Ýçecekler & Meþrubatlar',
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    products: [
      { name: 'Coca-Cola (330ml Kutu)', description: 'Orijinal tat soðuk servis.', price: 65 },
      { name: 'Coca-Cola Zero Sugar (330ml Kutu)', description: 'Þekersiz ferahlýk.', price: 65 },
      { name: 'Fanta Portakal (330ml Kutu)', description: 'Buz gibi portakal lezzeti.', price: 65 },
      { name: 'Sprite (330ml Kutu)', description: 'Limon ve misket limonu ferahlýðý.', price: 65 },
      { name: 'Ev Yapýmý Naneli Limonata', description: 'Taze sýkýlmýþ limon suyu, nane yapraklarý ve buz.', price: 95 },
      { name: 'Soðuk Çay (Þeftali / Limon / Mango)', description: '330ml kutu ferahlatýcý soðuk çay.', price: 65 },
      { name: 'Taze Sýkma Portakal Suyu', description: '%100 doðal taze sýkýlmýþ Akdeniz portakalý.', price: 110 },
      { name: 'Geleneksel Yayýk Ayraný', description: 'Köpüklü bol naneli köy ayraný.', price: 45 },
      { name: 'Doðal Kaynak Maden Suyu', description: '200ml cam þiþe maden suyu.', price: 35 },
      { name: 'Limonlu / Elmalý Soda', description: '200ml meyve aromalý maden suyu.', price: 40 }
    ]
  },
  {
    id: 'enerji_icecekleri',
    name: 'Enerji Ýçecekleri',
    image_url: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=600&q=80',
    products: [
      { name: 'Klasik Enerji Ýçeceði (250ml)', description: 'Taurin ve B vitaminleri içeren yüksek enerjili içecek.', price: 90 },
      { name: 'Þekersiz Enerji Ýçeceði (250ml Zero)', description: 'Sýfýr þeker, tam performans.', price: 90 },
      { name: 'Tropikal Meyveli Enerji Ýçeceði (250ml)', description: 'Egzotik sarý meyve aromalý enerji içeceði.', price: 95 },
      { name: 'Karpuz & Orman Meyveli Enerji (250ml Red)', description: 'Ferahlatýcý yaz meyveleri aromalý.', price: 95 }
    ]
  },
  {
    id: 'burgerler',
    name: 'Gurme Burgerler',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    products: [
      { name: 'Klasik Zagroja Burger', description: '150 gr dinlendirilmiþ dana köfte, karamelize soðan, marul, domates, turþu, özel sos ve çýtýr patates ile.', price: 310 },
      { name: 'Cheddar & Bacon Cheeseburger', description: '150 gr dana köfte, çift kat eritme cheddar, dana füme bacon, trüflü mayonez ve patates tava.', price: 345 },
      { name: 'Smokehouse BBQ Burger', description: '150 gr köfte, füme et dilimleri, çýtýr soðan halkasý, füme barbekü sos ve patates tava.', price: 350 },
      { name: 'Çýtýr But Tavuk Burger', description: 'Özel baharatlý marine edilmiþ panelenmiþ tavuk budu, coleslaw salatasý, ballý hardal sos ve patates tava.', price: 275 }
    ]
  },
  {
    id: 'pizzalar',
    name: 'Taþ Fýrýn Pizzalar & Makarnalar',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    products: [
      { name: 'Pizza Margherita', description: 'Özel Ýtalyan domates sosu, taze mozzarella, taze fesleðen ve sýzma zeytinyaðý.', price: 260 },
      { name: 'Karýþýk Gurme Pizza', description: 'Sucuk, sosis, mantar, mýsýr, siyah zeytin, yeþil biber, domates sosu ve mozzarella.', price: 320 },
      { name: 'Dört Peynirli Pizza (Quattro Formaggi)', description: 'Mozzarella, gorgonzola, parmesan ve ezine keçi peyniri harmaný.', price: 330 },
      { name: 'Penne Arrabbiata', description: 'Acýlý taze domates sosu, siyah zeytin dilimleri, sarýmsak, fesleðen ve parmesan.', price: 230 },
      { name: 'Fettuccine Alfredo (Tavuklu & Mantarlý)', description: 'Izgara tavuk göðsü dilimleri, kültür mantarý, taze krema ve rende parmesan.', price: 270 }
    ]
  },
  {
    id: 'ana_yemekler',
    name: 'Ana Yemekler & Izgaralar',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    products: [
      { name: 'Geleneksel Izgara Köfte', description: '200 gr anne köftesi, közlenmiþ domates & biber, tereyaðlý pirinç pilavý ve patates kýzartmasý.', price: 340 },
      { name: 'Özel Marine Tavuk Þiþ', description: 'Taze kekik ve zeytinyaðý ile marine edilmiþ tavuk göðsü þiþ, pilav ve köz sebzeler.', price: 290 },
      { name: 'Kremalý Mantarlý Tavuk Külbastý', description: 'Izgara tavuk külbastý üzerine mantarlý krema sosu, fýrýn patates ve ýzgara sebzeler.', price: 310 },
      { name: 'Dana Antrikot Izgara (220 gr)', description: 'Dry-aged dinlendirilmiþ dana antrikot, sarýmsaklý tereyaðý, fýrýn patates ve sotelenmiþ mevsim sebzeleri.', price: 540 }
    ]
  },
  {
    id: 'aperatifler_mezeler',
    name: 'Aperatifler & Mezeler',
    image_url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80',
    products: [
      { name: 'Baharatlý Patates Tava', description: 'Cajun baharat harmaný, sarýmsaklý mayonez ve ketçap ile.', price: 130 },
      { name: 'Çýtýr Atýþtýrmalýk Sepeti', description: 'Çýtýr tavuk parçalarý, mozzarella sticks, soðan halkasý, sigara böreði, patates ve dip soslar.', price: 280 },
      { name: 'Çýtýr Soðan Halkasý (10 Adet)', description: 'Altýn sarýsý pane kaplý soðan halkalarý ve ranch sos.', price: 140 },
      { name: 'Zeytinyaðlý Humus (Tahinli)', description: 'Taze çekilmiþ nohut, tahin, kimyon, sýzma zeytinyaðý ve sýcak tereyaðý sosu.', price: 160 },
      { name: 'Süzme Haydari', description: 'Süzme yoðurt, taze nane, sarýmsak, tereyaðý ve ceviz içi.', price: 150 },
      { name: 'Geleneksel Þakþuka', description: 'Kýzartýlmýþ patlýcan, kabak ve biberlerin taze domates sosuyla buluþmasý.', price: 155 }
    ]
  },
  {
    id: 'tatlilar',
    name: 'Tatlýlar & Pastalar',
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    products: [
      { name: 'San Sebastian Cheesecake', description: 'Ýçi akýþkan Ýspanyol usulü yanýk cheesecake, sýcak Belçika çikolatasý sosu ile.', price: 210 },
      { name: 'Sýcak Çikolatalý Sufle', description: 'Hakiki bitter çikolatalý fýrýn sufle, yanýnda vanilyalý dondurma ile.', price: 195 },
      { name: 'Antep Fýstýklý Havuç Dilim Baklava', description: 'Özel Antep fýstýklý çýtýr baklava, yanýnda Maraþ kesme dondurma ile.', price: 250 },
      { name: 'Ýtalyan Tiramisu', description: 'Espresso ile ýslatýlmýþ kedi dili, mascarpone kremasý ve kakao tozu.', price: 190 },
      { name: 'Karýþýk Meyveli Çikolatalý Waffle', description: 'Taze çilek, muz, kivi, sütlü çikolata ve fýndýk parçacýklarý.', price: 230 }
    ]
  },
  {
    id: 'alkollu_icecekler',
    name: 'Alkollü Ýçecekler & Kokteyller',
    image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
    products: [
      { name: 'Fýçý Bira (50cl)', description: 'Buz gibi soðuk servis taze fýçý bira.', price: 160 },
      { name: 'Þiþe Bira (33cl)', description: 'Premium þiþe bira.', price: 140 },
      { name: 'Efes Malt (50cl)', description: '%100 malt bira.', price: 165 },
      { name: 'Yeni Raký (Tek)', description: 'Buz ve soðuk su eþliðinde tek kadeh.', price: 170 },
      { name: 'Yeni Raký (Duble)', description: 'Buz ve soðuk su eþliðinde duble kadeh.', price: 240 },
      { name: 'Yeni Raký (35cl Þiþe)', description: 'Masa için 35cl þiþe raký.', price: 750 },
      { name: 'Yeni Raký (70cl Þiþe)', description: 'Masa için 70cl büyük þiþe raký.', price: 1350 },
      { name: 'Kýrmýzý Þarap (Öküzgözü / Boðazkere 75cl)', description: 'Gövdesi zengin kuru kýrmýzý þarap þiþesi.', price: 680 },
      { name: 'Beyaz Þarap (Sauvignon Blanc 75cl)', description: 'Ferahlatýcý meyvemsi beyaz þarap þiþesi.', price: 680 },
      { name: 'Kadeh Kýrmýzý / Beyaz Þarap', description: 'Seçmeli kadeh ev þarabý.', price: 180 },
      { name: 'Klasik Mojito Kokteyl', description: 'Beyaz rom, taze nane, misket limonu, esmer þeker ve soda.', price: 260 },
      { name: 'Aperol Spritz', description: 'Aperol, prosecco, soda ve portakal dilimi.', price: 270 }
    ]
  }
];
