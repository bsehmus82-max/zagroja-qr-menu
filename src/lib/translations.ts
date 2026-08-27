export type Language = 'tr' | 'en' | 'ru';

export const translations = {
  tr: {
    table: 'Masa',
    qrMenu: 'QR Menü',
    callWaiter: 'Garson Çağır',
    requestBill: 'Hesap İste',
    wifiInfo: 'Wi-Fi',
    searchPlaceholder: 'Yiyecek veya içecek ara...',
    menuCategories: 'Menü Kategorileri',
    categoryCount: 'Kategori',
    categories: 'Kategoriler',
    all: 'Tümü',
    items: 'Çeşit',
    soldOut: 'Tükendi',
    addToCart: 'Sepete Ekle',
    viewCart: 'Siparişi İncele / Tamamla',
    noItemsFound: 'Aradığınız kriterlere uygun ürün bulunamadı.',
    noCategoryItems: 'Bu kategoride henüz ürün bulunmuyor.',
    loadingMenu: 'Menü yükleniyor...',
    loadingCategories: 'Kategoriler yükleniyor...',
    
    // Service Modal
    waiterModalTitle: 'Garson Çağır',
    waiterModalSubtitle: 'Servis personelimiz masanıza yönlendirilecektir.',
    billModalTitle: 'Hesap İste',
    billModalSubtitle: 'Lütfen ödeme yönteminizi seçiniz.',
    wifiModalTitle: 'Wi-Fi Bağlantı Bilgisi',
    waiterPrompt: 'masası için servis personelini çağırmak üzeresiniz.',
    callWaiterBtn: 'Garsonu Masaya Çağır',
    waiterReasonTitle: 'Hızlı İstek (Opsiyonel)',
    reasonOrder: 'Ek Sipariş',
    reasonClean: 'Masa Temizliği',
    reasonInfo: 'Soru / Destek',
    reasonOther: 'Genel İstek',
    paymentChoice: 'Ödeme Yönteminiz',
    posPayment: 'Kredi Kartı / POS',
    cashPayment: 'Nakit Ödeme',
    sendBillRequest: 'Hesap İsteğini İlet',
    wifiNetwork: 'Wi-Fi Ağı',
    wifiPassword: 'Şifre',
    copyWifiPassword: 'Şifreyi Kopyala',
    wifiCopied: 'Kopyalandı',
    noWifiPassword: 'Şifresiz',
    requestSubmittedTitle: 'İsteğiniz Mutfağa ve Personele İletildi',
    requestSubmittedDesc: 'Personelimiz en kısa sürede masanızda olacaktır.',
    sending: 'İletiliyor...',

    // Cart Drawer
    cartTitle: 'Sipariş Sepetiniz',
    orderNotes: 'Sipariş Notu (Opsiyonel)',
    orderNotesPlaceholder: 'Örn: Az şekerli olsun, acısız olsun...',
    totalCartAmount: 'Toplam Tutar:',
    confirmOrder: 'Siparişi Onayla & Mutfağa Gönder',
    sendingOrder: 'Mutfağa İletiliyor...',
    orderSuccessToast: 'Siparişiniz mutfağa iletildi! Şeflerimiz hazırlamaya başlıyor.',
    orderErrorToast: 'Sipariş iletilirken bir hata oluştu. Lütfen tekrar deneyiniz.',

    // Tracker
    orderReceived: 'Siparişiniz Alındı',
    orderReceivedSub: 'Mutfak onaylaması bekleniyor...',
    orderPreparing: 'Mutfakta Hazırlanıyor',
    orderPreparingSub: 'Şeflerimiz siparişinizi özenle hazırlıyor.',
    orderServed: 'Siparişiniz Masanızda',
    orderServedSub: 'Afiyet olsun! İlave istekleriniz için çağrı butonunu kullanabilirsiniz.',
  },
  en: {
    table: 'Table',
    qrMenu: 'QR Menu',
    callWaiter: 'Call Waiter',
    requestBill: 'Request Bill',
    wifiInfo: 'Wi-Fi',
    searchPlaceholder: 'Search food or drinks...',
    menuCategories: 'Menu Categories',
    categoryCount: 'Categories',
    categories: 'Categories',
    all: 'All',
    items: 'Items',
    soldOut: 'Sold Out',
    addToCart: 'Add to Cart',
    viewCart: 'View Cart / Checkout',
    noItemsFound: 'No items found matching your search.',
    noCategoryItems: 'No items in this category yet.',
    loadingMenu: 'Loading menu...',
    loadingCategories: 'Loading categories...',
    
    // Service Modal
    waiterModalTitle: 'Call Waiter',
    waiterModalSubtitle: 'Our service staff will be directed to your table.',
    billModalTitle: 'Request Bill',
    billModalSubtitle: 'Please select your preferred payment method.',
    wifiModalTitle: 'Wi-Fi Connection Info',
    waiterPrompt: 'You are about to call the service staff for',
    callWaiterBtn: 'Call Waiter to Table',
    waiterReasonTitle: 'Quick Reason (Optional)',
    reasonOrder: 'Extra Order',
    reasonClean: 'Table Cleaning',
    reasonInfo: 'Help / Question',
    reasonOther: 'General Request',
    paymentChoice: 'Payment Method',
    posPayment: 'Credit Card / POS',
    cashPayment: 'Cash Payment',
    sendBillRequest: 'Send Bill Request',
    wifiNetwork: 'Wi-Fi Network',
    wifiPassword: 'Password',
    copyWifiPassword: 'Copy Password',
    wifiCopied: 'Copied',
    noWifiPassword: 'No password',
    requestSubmittedTitle: 'Request Sent to Staff',
    requestSubmittedDesc: 'Our staff will be at your table shortly.',
    sending: 'Sending...',

    // Cart Drawer
    cartTitle: 'Your Cart',
    orderNotes: 'Order Notes (Optional)',
    orderNotesPlaceholder: 'e.g. Less sugar, no spice...',
    totalCartAmount: 'Total Amount:',
    confirmOrder: 'Confirm & Send to Kitchen',
    sendingOrder: 'Sending to Kitchen...',
    orderSuccessToast: 'Your order has been sent to the kitchen!',
    orderErrorToast: 'An error occurred while sending order. Please try again.',

    // Tracker
    orderReceived: 'Order Received',
    orderReceivedSub: 'Waiting for kitchen confirmation...',
    orderPreparing: 'Preparing in Kitchen',
    orderPreparingSub: 'Our chefs are carefully preparing your order.',
    orderServed: 'Order Served',
    orderServedSub: 'Enjoy your meal! You can use the call button for more requests.',
  },
  ru: {
    table: 'Стол',
    qrMenu: 'QR Меню',
    callWaiter: 'Официант',
    requestBill: 'Счет',
    wifiInfo: 'Wi-Fi',
    searchPlaceholder: 'Поиск блюд и напитков...',
    menuCategories: 'Категории меню',
    categoryCount: 'Категорий',
    categories: 'Категории',
    all: 'Все',
    items: 'Позиций',
    soldOut: 'Закончилось',
    addToCart: 'В корзину',
    viewCart: 'Оформить заказ',
    noItemsFound: 'По вашему запросу ничего не найдено.',
    noCategoryItems: 'В этой категории пока нет блюд.',
    loadingMenu: 'Загрузка меню...',
    loadingCategories: 'Загрузка категорий...',
    
    // Service Modal
    waiterModalTitle: 'Вызвать официанта',
    waiterModalSubtitle: 'Наш персонал подойдет к вашему столу.',
    billModalTitle: 'Попросить счет',
    billModalSubtitle: 'Пожалуйста, выберите способ оплаты.',
    wifiModalTitle: 'Информация о сети Wi-Fi',
    waiterPrompt: 'Вы вызываете официанта к столу',
    callWaiterBtn: 'Вызвать официанта к столу',
    waiterReasonTitle: 'Причина вызова (необязательно)',
    reasonOrder: 'Дозаказ',
    reasonClean: 'Убрать стол',
    reasonInfo: 'Вопрос / Помощь',
    reasonOther: 'Общий запрос',
    paymentChoice: 'Способ оплаты',
    posPayment: 'Банковская карта / POS',
    cashPayment: 'Наличный расчет',
    sendBillRequest: 'Запросить счет',
    wifiNetwork: 'Сеть Wi-Fi',
    wifiPassword: 'Пароль',
    copyWifiPassword: 'Скопировать пароль',
    wifiCopied: 'Скопировано',
    noWifiPassword: 'Без пароля',
    requestSubmittedTitle: 'Запрос передан персоналу',
    requestSubmittedDesc: 'Наш персонал скоро подойдет к вашему столу.',
    sending: 'Отправка...',

    // Cart Drawer
    cartTitle: 'Ваша корзина',
    orderNotes: 'Комментарий к заказу (необязательно)',
    orderNotesPlaceholder: 'Например: без сахара, не острое...',
    totalCartAmount: 'Итоговая сумма:',
    confirmOrder: 'Подтвердить и отправить на кухню',
    sendingOrder: 'Отправка на кухню...',
    orderSuccessToast: 'Ваш заказ отправлен на кухню!',
    orderErrorToast: 'Ошибка при отправке заказа. Пожалуйста, попробуйте еще раз.',

    // Tracker
    orderReceived: 'Заказ принят',
    orderReceivedSub: 'Ожидает подтверждения кухни...',
    orderPreparing: 'Готовится на кухне',
    orderPreparingSub: 'Наши шеф-повара готовят ваш заказ.',
    orderServed: 'Заказ подан',
    orderServedSub: 'Приятного аппетита! Вы можете вызвать персонал в любое время.',
  },
};

const categoryTranslations: Record<string, { en: string; ru: string }> = {
  'serpme & kahvaltılıklar': { en: 'Breakfast & Brunch', ru: 'Завтраки и сеты' },
  'kahvaltılıklar': { en: 'Breakfast', ru: 'Завтраки' },
  'kahvaltı': { en: 'Breakfast', ru: 'Завтрак' },
  'ızgara & kebap çeşitleri': { en: 'Grills & Kebabs', ru: 'Гриль и кебабы' },
  'ızgaralar & ana yemekler': { en: 'Grills & Main Courses', ru: 'Гриль и основные блюда' },
  'ana yemekler': { en: 'Main Courses', ru: 'Основные блюда' },
  'ızgaralar': { en: 'Grills', ru: 'Гриль' },
  'kebaplar': { en: 'Kebabs', ru: 'Кебабы' },
  'taş fırın & pizzalar': { en: 'Stone Oven & Pizzas', ru: 'Пиццы из каменной печи' },
  'taş fırın pizzalar': { en: 'Stone Oven Pizzas', ru: 'Пиццы из каменной печи' },
  'pizzalar': { en: 'Pizzas', ru: 'Пицца' },
  'pizza': { en: 'Pizza', ru: 'Пицца' },
  'gurme burgerler': { en: 'Gourmet Burgers', ru: 'Бургеры для гурманов' },
  'burgerler': { en: 'Burgers', ru: 'Бургеры' },
  'burger': { en: 'Burger', ru: 'Бургер' },
  'makarnalar & salatalar': { en: 'Pastas & Salads', ru: 'Паста и салаты' },
  'makarnalar': { en: 'Pastas', ru: 'Паста' },
  'salatalar': { en: 'Fresh Salads', ru: 'Салаты' },
  'taze mezeler & başlangıçlar': { en: 'Fresh Mezes & Starters', ru: 'Свежие мезе и закуски' },
  'çıtır atıştırmalıklar & mezeler': { en: 'Crispy Snacks & Appetizers', ru: 'Закуски и снеки' },
  'mezeler': { en: 'Appetizers & Mezes', ru: 'Мезе и закуски' },
  'atıştırmalıklar': { en: 'Snacks & Bites', ru: 'Закуски' },
  'tatlılar & pastalar': { en: 'Desserts & Cakes', ru: 'Десерты и выпечка' },
  'tatlılar': { en: 'Desserts', ru: 'Десерты' },
  'pastalar': { en: 'Cakes', ru: 'Торты и десерты' },
  'sıcak kahveler & çaylar': { en: 'Hot Coffees & Teas', ru: 'Горячий кофе и чай' },
  'sıcak & soğuk kahveler': { en: 'Hot & Cold Coffees', ru: 'Горячий и холодный кофе' },
  'kahveler': { en: 'Coffees', ru: 'Кофе' },
  'kahve': { en: 'Coffee', ru: 'Кофе' },
  'çaylar': { en: 'Teas', ru: 'Чай' },
  'soğuk içecekler & meşrubatlar': { en: 'Cold Drinks & Beverages', ru: 'Холодные напитки' },
  'meşrubat & soğuk içecekler': { en: 'Cold Drinks & Beverages', ru: 'Холодные напитки' },
  'soğuk içecekler': { en: 'Cold Beverages', ru: 'Холодные напитки' },
  'sıcak içecekler': { en: 'Hot Beverages', ru: 'Горячие напитки' },
  'içecekler': { en: 'Beverages', ru: 'Напитки' },
  'taze meyve suları & mocktailler': { en: 'Fresh Juices & Mocktails', ru: 'Свежие соки и моктейли' },
  'taze meyve suları': { en: 'Fresh Juices', ru: 'Свежие соки' },
  'çorbalar': { en: 'Soups', ru: 'Супы' },
  'sandviçler': { en: 'Sandwiches', ru: 'Сэндвичи' },
  'dürüm & wrapler': { en: 'Wraps & Rolls', ru: 'Роллы и врапы' },
  'döneler': { en: 'Doner Kebabs', ru: 'Донеры' },
  'pideler': { en: 'Turkish Pides', ru: 'Пиде' },
};

export function getCategoryTitle(catName: string, lang: Language): string {
  if (lang === 'tr') return catName;
  const key = catName.trim().toLowerCase();
  const match = categoryTranslations[key];
  if (match && match[lang]) {
    return match[lang];
  }
  return catName;
}

export function getTranslatedWorkingHours(hoursStr: string | undefined, lang: Language): string {
  if (!hoursStr) return '';
  if (lang === 'tr') {
    return hoursStr
      .replace(/24 saat/gi, '7/24 Açık')
      .replace(/24 saat açık/gi, '7/24 Açık');
  }

  let result = hoursStr;

  if (lang === 'en') {
    if (result.toLowerCase().includes('24 saat') || result.toLowerCase().includes('7/24')) {
      return 'Open 24/7 (Every Day)';
    }
    result = result
      .replace(/her gün/gi, 'Every Day')
      .replace(/hafta içi/gi, 'Weekdays')
      .replace(/pzt/gi, 'Mon')
      .replace(/sal/gi, 'Tue')
      .replace(/çar/gi, 'Wed')
      .replace(/per/gi, 'Thu')
      .replace(/cum/gi, 'Fri')
      .replace(/cmt/gi, 'Sat')
      .replace(/paz/gi, 'Sun');
    return result;
  }

  if (lang === 'ru') {
    if (result.toLowerCase().includes('24 saat') || result.toLowerCase().includes('7/24')) {
      return 'Открыто 24/7 (Каждый день)';
    }
    result = result
      .replace(/her gün/gi, 'Каждый день')
      .replace(/hafta içi/gi, 'Будни')
      .replace(/pzt/gi, 'Пн')
      .replace(/sal/gi, 'Вт')
      .replace(/çar/gi, 'Ср')
      .replace(/per/gi, 'Чт')
      .replace(/cum/gi, 'Пт')
      .replace(/cmt/gi, 'Сб')
      .replace(/paz/gi, 'Вс');
    return result;
  }

  return hoursStr;
}

// Common descriptions translator for gourmet catalog
const descriptionMap: Record<string, { en: string; ru: string }> = {
  'Ezine beyaz peynir, eski kaşar, van otlu peynir, petek bal & kaymak, ev reçelleri, siyah & yeşil zeytin, sahanda tereyağlı yumurta, pişi ve sınırsız demlik çay ile': {
    en: 'Ezine white cheese, aged kashar, Van herb cheese, honeycomb & clotted cream, homemade jams, olives, fried eggs in butter, pişi and unlimited brewed tea',
    ru: 'Сыр Эзине, выдержанный кашар, сыр с травами, мед в сотах и каймак, домашнее варенье, оливки, яичница на сливочном масле, пиши и чай без ограничений',
  },
  'Köy domatesi, tatlı köy biberi, kasap sucuk ve taze kaşar eritmesi ile bakır tavada': {
    en: 'Village tomatoes, sweet peppers, butcher soujouk, and melted kashar cheese served in a copper pan',
    ru: 'Деревенские томаты, сладкий перец, суджук и расплавленный кашар в медной сковороде',
  },
  '4 adet taze kızartılmış pişi, tulum peyniri ve böğürtlen reçeli eşliğinde': {
    en: '4 pieces of freshly fried Turkish pişi, served with tulum cheese and blackberry jam',
    ru: '4 шт. свежеобжаренных турецких пышек пиши, сыр тулум и ежевичное варенье',
  },
  '200 gr zırh kıyması kasap köfte, közlenmiş domates ve biber, tırnak pide, sumaklı soğan ve tereyağlı pilav ile': {
    en: '200g hand-minced butcher meatballs, roasted tomatoes & peppers, flatbread, sumac onions and buttered rice',
    ru: '200 г рубленых котлет кёфте на углях, запеченные томаты и перец, лаваш, лук с сумахом и рис на масле',
  },
  'Meşe kömüründe ızgara dana bonfile dilimleri, fırınlanmış patates püresi ve biberiye sosu ile': {
    en: 'Charcoal-grilled beef tenderloin slices, baked mashed potatoes and rosemary sauce',
    ru: 'Ломтики говяжьей вырезки на углях, запеченное картофельное пюре и розмариновый соус',
  },
  'Taze kekik ve zeytinyağı ile dinlendirilmiş kuzu but eti, köz sebzeler ve lavaş eşliğinde': {
    en: 'Marinated lamb leg with fresh thyme and olive oil, served with grilled vegetables and lavash',
    ru: 'Нежное мясо ягненка с тимьяном и оливковым маслом, запеченные овощи и лаваш',
  },
  'Marine edilmiş ızgara tavuk kalça, taze mantar kreması sosu ve fırınlanmış bebek patates ile': {
    en: 'Marinated grilled chicken thigh, fresh creamy mushroom sauce, and roasted baby potatoes',
    ru: 'Маринованное куриное филе на гриле, сливочно-грибной соус и молодой картофель',
  },
  'İtalyan domates sosu, manda mozzarellası, taze fesleğen yaprakları ve sızma zeytinyağı': {
    en: 'Italian tomato sauce, buffalo mozzarella, fresh basil leaves, and extra virgin olive oil',
    ru: 'Итальянский томатный соус, моцарелла из молока буйволицы, свежий базилик и оливковое масло',
  },
  'Trüf kreması, mozzarella, kültür ve kestane mantarları, taze kekik yaprakları': {
    en: 'Truffle cream, mozzarella, button and chestnut mushrooms, fresh thyme leaves',
    ru: 'Трюфельный крем, моцарелла, шампиньоны и каштановые грибы, свежий тимьян',
  },
  'Özel domates sos, mozzarella, dana sucuk, mantar, köz biber, mısır ve siyah zeytin': {
    en: 'Special tomato sauce, mozzarella, beef soujouk, mushrooms, roasted peppers, corn, and black olives',
    ru: 'Фирменный томатный соус, моцарелла, говяжий суджук, грибы, сладкий перец, кукуруза и маслины',
  },
  '2x90 gr dana eti, trüflü mayonez, karamelize soğan, eritilmiş cheddar peyniri, çıtır baharatlı patates tava ile': {
    en: '2x90g smash beef patties, truffle mayo, caramelized onions, melted cheddar cheese, served with seasoned fries',
    ru: '2x90 г котлеты из говядины, трюфельный майонез, карамелизированный лук, чеддер и картофель фри',
  },
  '180 gr dana köfte, dana füme eti, füme barbekü sos, çıtır soğan halkası, patates kızartması ile': {
    en: '180g beef patty, smoked beef, smoked BBQ sauce, crispy onion rings, served with fries',
    ru: '180 г говяжья котлета, копченая говядина, соус барбекю, луковые кольца и картофель фри',
  },
  'Özel marinasyonlu panelenmiş çıtır tavuk fileto, coleslaw salata, ballı hardal sos': {
    en: 'Specially marinated crispy breaded chicken fillet, coleslaw salad, honey mustard sauce',
    ru: 'Хрустящее куриное филе в панировке, салат коулслоу, медово-горчичный соус',
  },
  'Taze el yapımı fettuccine, ızgara tavuk dilimleri, mantar, krema ve rendelenmiş parmesan': {
    en: 'Fresh handmade fettuccine, grilled chicken slices, mushrooms, cream, and grated parmesan',
    ru: 'Свежая домашняя феттуччине, курица на гриле, грибы, сливочный соус и пармезан',
  },
  'Acılı İtalyan domates sosu, sarımsak, taze fesleğen, dilimlenmiş siyah zeytin ve parmesan': {
    en: 'Spicy Italian tomato sauce, garlic, fresh basil, sliced black olives, and parmesan',
    ru: 'Острый итальянский томатный соус, чеснок, свежий базилик, маслины и пармезан',
  },
  'Taze marul yaprakları, ızgara tavuk göğsü, kruton ekmek, parmesan rendesi ve özel sezar sos': {
    en: 'Fresh romaine lettuce, grilled chicken breast, croutons, grated parmesan, and signature caesar dressing',
    ru: 'Листья салата романо, куриная грудка на гриле, крутоны, пармезан и соус цезарь',
  },
  'İpeksi yumuşak dokulu fırınlanmış peynir keki, sıcak eritilmiş Belçika sütlü çikolatası eşliğinde': {
    en: 'Silky smooth baked Basque cheesecake, served with warm melted Belgian milk chocolate',
    ru: 'Нежнейший чизкейк Сан-Себастьян с теплым бельгийским молочным шоколадом',
  },
  'Hakiki bitter çikolatalı akışkan sufle, Maraş kesme dondurması ile': {
    en: 'Authentic dark chocolate molten lava souffle, served with traditional Maraş ice cream',
    ru: 'Горячее шоколадное суфле с жидким центром из бельгийского шоколада и мороженым',
  },
  'Gaziantep sade yağlı çıtır baklava, yanında manda kaymağı ile': {
    en: 'Authentic Gaziantep crispy pistachio baklava, served with buffalo clotted cream',
    ru: 'Традиционная хрустящая пахлава с фисташками и каймаком',
  },
  'Çifte kavrulmuş taze çekim kahve, lokum ve damla sakızlı su ile': {
    en: 'Double roasted freshly ground Turkish coffee, served with Turkish delight and mastic water',
    ru: 'Свежемолотый турецкий кофе двойной обжарки с лукумом',
  },
  'Sıkma limon suyu, taze nane yaprakları ve az şekerli doğal ferahlık': {
    en: 'Fresh squeezed lemon juice, fresh mint leaves, low sugar natural refreshment',
    ru: 'Свежевыжатый лимонный сок, свежая мята, натуральный освежающий лимонад',
  },
  '%100 doğal taze sıkılmış tatlı Akdeniz portakalı': {
    en: '100% natural freshly squeezed sweet Mediterranean oranges',
    ru: '100% натуральный свежевыжатый сок из средиземноморских апельсинов',
  },
};

export function getTranslatedDescription(desc: string | undefined, lang: Language): string {
  if (!desc) return '';
  if (lang === 'tr') return desc;
  const match = descriptionMap[desc.trim()];
  if (match && match[lang]) {
    return match[lang];
  }
  return desc;
}
