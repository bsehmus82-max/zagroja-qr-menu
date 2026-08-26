import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'tr' | 'en' | 'ru';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
  tDynamic: (text: string) => string;
}

const UI_TRANSLATIONS: Record<Language, Record<string, string>> = {
  tr: {},
  en: {
    "Tümü": "All",
    "Ürün ara...": "Search products...",
    "Sepetim": "My Cart",
    "Sepete Ekle": "Add to Cart",
    "Sipariş Ver": "Place Order",
    "Toplam": "Total",
    "Tükendi": "Sold Out",
    "Sipariş Notu": "Order Note",
    "Sipariş notu veya özel tercih...": "Order notes or special preferences...",
    "Sepetiniz boş": "Your cart is empty",
    "Masa": "Table",
    "Masaya özel sipariş vermek için ürün ekleyin.": "Add items to place an order for your table.",
    "Bizi Tercih Ettiğiniz İçin Teşekkürler!": "Thank you for choosing us!",
    "Lütfen Bekleyiniz...": "Please wait...",
    "Siparişiniz başarıyla alındı!": "Order placed successfully!",
    "Ödeme Yöntemi": "Payment Method",
    "Nakit": "Cash",
    "Kredi Kartı": "Credit Card",
    "Garson Çağır": "Call Waiter",
    "Hesap İste": "Request Bill",
    "Menü": "Menu",
    "Popüler": "Popular",
    "Sepeti Onayla": "Confirm Cart",
    "adet": "pcs",
    "Masa Seçimi": "Table Selection"
  },
  ru: {
    "Tümü": "Все",
    "Ürün ara...": "Поиск товаров...",
    "Sepetim": "Моя корзина",
    "Sepete Ekle": "В корзину",
    "Sipariş Ver": "Оформить заказ",
    "Toplam": "Итого",
    "Tükendi": "Распродано",
    "Sipariş Notu": "Примечание к заказу",
    "Sipariş notu veya özel tercih...": "Примечание к заказу или пожелания...",
    "Sepetiniz boş": "Ваша корзина пуста",
    "Masa": "Стол",
    "Masaya özel sipariş vermek için ürün ekleyin.": "Добавьте товары, чтобы сделать заказ для вашего стола.",
    "Bizi Tercih Ettiğiniz İçin Teşekkürler!": "Спасибо, что выбрали нас!",
    "Lütfen Bekleyiniz...": "Пожалуйста, подождите...",
    "Siparişiniz başarıyla alındı!": "Заказ успешно оформлен!",
    "Ödeme Yöntemi": "Способ оплаты",
    "Nakit": "Наличные",
    "Kredi Kartı": "Кредитная карта",
    "Garson Çağır": "Позвать официанта",
    "Hesap İste": "Попросить счет",
    "Menü": "Меню",
    "Popüler": "Популярные",
    "Sepeti Onayla": "Подтвердить корзину",
    "adet": "шт",
    "Masa Seçimi": "Выбор стола"
  }
};

const DYNAMIC_TRANSLATIONS: Record<string, Record<Language, string>> = {
  // Categories
  "Günün Favorileri": { tr: "Günün Favorileri", en: "Today's Favorites", ru: "Фавориты дня" },
  "Kahvaltılar": { tr: "Kahvaltılar", en: "Breakfast", ru: "Завтраки" },
  "Ana Yemekler": { tr: "Ana Yemekler", en: "Main Courses", ru: "Главные блюда" },
  "Burger & Sandviç": { tr: "Burger & Sandviç", en: "Burger & Sandwich", ru: "Бургеры и Сэндвичи" },
  "Pizzalar": { tr: "Pizzalar", en: "Pizzas", ru: "Пицца" },
  "Makarnalar": { tr: "Makarnalar", en: "Pastas", ru: "Паста" },
  "Salatalar": { tr: "Salatalar", en: "Salads", ru: "Салаты" },
  "Tatlılar": { tr: "Tatlılar", en: "Desserts", ru: "Десерты" },
  "Sıcak İçecekler": { tr: "Sıcak İçecekler", en: "Hot Drinks", ru: "Горячие напитки" },
  "Soğuk İçecekler": { tr: "Soğuk İçecekler", en: "Cold Drinks", ru: "Холодные напитки" },
  "Nargile": { tr: "Nargile", en: "Hookah", ru: "Кальян" },

  // Items
  "Şefin Spesiyali Burger": { tr: "Şefin Spesiyali Burger", en: "Chef's Special Burger", ru: "Фирменный бургер от шефа" },
  "200g ev yapımı dana köfte, karamelize soğan, cheddar peyniri, füme kaburga, trüflü mayonez ve patates kızartması ile.": { 
    tr: "200g ev yapımı dana köfte, karamelize soğan, cheddar peyniri, füme kaburga, trüflü mayonez ve patates kızartması ile.", 
    en: "200g homemade beef patty, caramelized onions, cheddar cheese, smoked rib, truffle mayonnaise, served with fries.", 
    ru: "200 г домашней говяжьей котлеты, карамелизованный лук, сыр чеддер, копченые ребрышки, трюфельный майонез и картофель фри." 
  },
  "Çıtır Tavuk Sepeti": { tr: "Çıtır Tavuk Sepeti", en: "Crispy Chicken Basket", ru: "Корзина хрустящей курицы" },
  "Özel baharatlarla panelenmiş çıtır tavuk bonfile parçaları, patates kızartması, soğan halkası ve ballı hardal sos.": { 
    tr: "Özel baharatlarla panelenmiş çıtır tavuk bonfile parçaları, patates kızartması, soğan halkası ve ballı hardal sos.", 
    en: "Crispy chicken tenderloin pieces breaded with special spices, fries, onion rings, and honey mustard sauce.", 
    ru: "Хрустящие кусочки куриного филе в панировке со специями, картофель фри, луковые кольца и медово-горчичный соус." 
  },
  "İki Kişilik Serpme Kahvaltı": { tr: "İki Kişilik Serpme Kahvaltı", en: "Mixed Breakfast for Two", ru: "Смешанный завтрак на двоих" },
  "Ezine beyaz peynir, kaşar, tulum, siyah/yeşil zeytin, ev yapımı reçeller, bal-kaymak, sahanda sucuk, sigara böreği, pişi ve sınırsız çay.": {
    tr: "Ezine beyaz peynir, kaşar, tulum, siyah/yeşil zeytin, ev yapımı reçeller, bal-kaymak, sahanda sucuk, sigara böreği, pişi ve sınırsız çay.",
    en: "Ezine white cheese, kashkaval, tulum cheese, black/green olives, homemade jams, honey and clotted cream, fried sausage, cheese rolls, pishi, and unlimited tea.",
    ru: "Белый сыр эзине, кашар, сыр тулум, черные/зеленые оливки, домашнее варенье, мед и взбитые сливки, жареная колбаса, сырные рулетики, пиши и безлимитный чай."
  },
  "Sıcak Kahvaltı Tabağı": { tr: "Sıcak Kahvaltı Tabağı", en: "Hot Breakfast Plate", ru: "Горячая тарелка для завтрака" },
  "Izgara hellim, sosis, sucuk, sahanda yumurta, patates kızartması, ızgara mantar.": {
    tr: "Izgara hellim, sosis, sucuk, sahanda yumurta, patates kızartması, ızgara mantar.",
    en: "Grilled halloumi, sausage, soujouk, fried eggs, french fries, grilled mushrooms.",
    ru: "Халлуми на гриле, сосиски, суджук, яичница, картофель фри, грибы на гриле."
  },
  "Menemen": { tr: "Menemen", en: "Menemen", ru: "Менемен" },
  "Izgara Antrikot": { tr: "Izgara Antrikot", en: "Grilled Ribeye", ru: "Стейк Рибай на гриле" },
  "Tavuk Şinitzel": { tr: "Tavuk Şinitzel", en: "Chicken Schnitzel", ru: "Куриный шницель" },
  "Köri Soslu Tavuk": { tr: "Köri Soslu Tavuk", en: "Chicken with Curry Sauce", ru: "Курица в соусе карри" },
  "Klasik Cheeseburger": { tr: "Klasik Cheeseburger", en: "Classic Cheeseburger", ru: "Классический чизбургер" },
  "Club Sandwich": { tr: "Club Sandwich", en: "Club Sandwich", ru: "Клаб-сэндвич" },
  "Pizza Margherita": { tr: "Pizza Margherita", en: "Pizza Margherita", ru: "Пицца Маргарита" },
  "Pizza Karışık": { tr: "Pizza Karışık", en: "Mixed Pizza", ru: "Смешанная пицца" },
  "Fettuccine Alfredo": { tr: "Fettuccine Alfredo", en: "Fettuccine Alfredo", ru: "Феттучини Альфредо" },
  "Ev Yapımı Mantı": { tr: "Ev Yapımı Mantı", en: "Homemade Manti", ru: "Домашние Манты" },
  "Sezar Salata": { tr: "Sezar Salata", en: "Caesar Salad", ru: "Салат Цезарь" },
  "Çikolatalı Sufle": { tr: "Çikolatalı Sufle", en: "Chocolate Souffle", ru: "Шоколадный суфле" },
  "San Sebastian Cheesecake": { tr: "San Sebastian Cheesecake", en: "San Sebastian Cheesecake", ru: "Чизкейк Сан-Себастьян" },
  "Fırın Sütlaç": { tr: "Fırın Sütlaç", en: "Baked Rice Pudding", ru: "Запеченный рисовый пудинг" },
  "İnce Belli Çay": { tr: "İnce Belli Çay", en: "Traditional Turkish Tea", ru: "Традиционный турецкий чай" },
  "Türk Kahvesi": { tr: "Türk Kahvesi", en: "Turkish Coffee", ru: "Турецкий кофе" },
  "Caffe Latte": { tr: "Caffe Latte", en: "Caffe Latte", ru: "Кофе Латте" },
  "Ev Yapımı Limonata": { tr: "Ev Yapımı Limonata", en: "Homemade Lemonade", ru: "Домашний лимонад" },
  "Coca-Cola (Kutu)": { tr: "Coca-Cola (Kutu)", en: "Coca-Cola (Can)", ru: "Кока-Кола (банка)" },
  "Yayık Ayran": { tr: "Yayık Ayran", en: "Traditional Ayran", ru: "Традиционный айран" },
  "Klasik Elma-Nane": { tr: "Klasik Elma-Nane", en: "Classic Apple-Mint", ru: "Классическое Яблоко-Мята" },
  "Love 66": { tr: "Love 66", en: "Love 66", ru: "Love 66" }
};

const LanguageContext = createContext<I18nContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    if (saved === 'en' || saved === 'ru' || saved === 'tr') return saved;
    return 'tr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string, defaultText?: string): string => {
    if (language === 'tr') return defaultText || key;
    return UI_TRANSLATIONS[language]?.[key] || defaultText || key;
  };

  const tDynamic = (text: string): string => {
    if (language === 'tr') return text;
    if (DYNAMIC_TRANSLATIONS[text]) {
      return DYNAMIC_TRANSLATIONS[text][language] || text;
    }
    return text; // Fallback to original text if not in translation dictionary
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tDynamic }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): I18nContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
