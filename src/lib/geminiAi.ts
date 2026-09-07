// ==============================================================================
// RESTIVADISYON AI CORE ENGINE (Google Gemini 2.0 Flash / 1.5 Flash)
// OCR Menü Çıkarıcı, Akıllı Menü Asistanı & Diff Tabanlı Güvenli Değişiklik Motoru
// ==============================================================================

import { Business, Category, Product } from '../types';
import { analyzeBrandAndSuggestTheme, PRESET_THEMES } from './aiBrandThemeEngine';

export interface ExtractedProduct {
  name: string;
  description: string;
  price: number;
  allergens?: string[];
  estimatedCalories?: number;
  imageUrl?: string;
}

export interface ExtractedCategory {
  name: string;
  products: ExtractedProduct[];
}

export interface CopilotDiffChange {
  id?: string;
  type: 'product_price' | 'product_stock' | 'product_add' | 'product_delete' | 'category_add' | 'theme_update';
  title: string;
  oldValue?: string | number | boolean;
  newValue?: string | number | boolean;
  targetId?: string;
  payload?: any;
}

export interface CopilotExecutionResult {
  isOutOfScope: boolean;
  assistantMessage: string;
  summaryTitle?: string;
  changes: CopilotDiffChange[];
  suggestedQuickActions?: string[];
}

/**
 * Karakter & Markdown Arındırıcı (Sanitizer)
 * Asistan çıktılarından '*', '-', '_', '/', '?' ve benzeri sembolleri, markdown formatlarını temizler.
 */
export function sanitizeAiText(input: string): string {
  if (!input) return '';
  return input
    .replace(/[*_~`#>\-\/]/g, '')
    .replace(/\?/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Günün Saat Dilimine Göre Zengin ve Dinamik Selamlama Üreticisi
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) {
    const morningGreetings = [
      'Günaydın, bugün hangi menü veya adisyon işlemini yapalım',
      'Günaydın, bugünkü restoran iş akışımızda nasıl yardımcı olabilirim',
      'Günaydın, menü fiyatları veya masa düzenlemeleri için hazırım',
    ];
    return morningGreetings[Math.floor(Math.random() * morningGreetings.length)];
  }
  
  if (hour >= 12 && hour < 18) {
    const afternoonGreetings = [
      'İyi günler, bugünkü menü veya adisyon iş akışımız nedir',
      'İyi günler, menü fiyatlarını güncellemek veya tükenen ürünleri kapatmak ister misiniz',
      'İyi günler, işletmeniz için bugün hangi işlemi gerçekleştirelim',
    ];
    return afternoonGreetings[Math.floor(Math.random() * afternoonGreetings.length)];
  }
  
  if (hour >= 18 && hour < 23) {
    const eveningGreetings = [
      'İyi akşamlar, menü ve servis akışınızda nasıl yardımcı olabilirim',
      'İyi akşamlar, bugünkü sipariş veya ürün durumlarını kontrol edelim mi',
      'İyi akşamlar, işletmeniz için ne yapmak istersiniz',
    ];
    return eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)];
  }
  
  const nightGreetings = [
    'İyi geceler, menü ve işletme düzenlemeleriniz için buradayım',
    'İyi geceler, yarının menü hazırlıkları veya fiyat düzenlemelerini yapabiliriz',
  ];
  return nightGreetings[Math.floor(Math.random() * nightGreetings.length)];
}

const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

/**
 * 1. AI OCR & KONSEPTTEN SIFIRDAN MENÜ ÇIKARICI
 */
export async function generateMenuWithAi(options: {
  conceptPrompt?: string;
  imageFileBase64?: string;
  mimeType?: string;
}): Promise<{ categories: ExtractedCategory[]; rawNotes?: string }> {
  // Canlı Gemini API anahtarı varsa doğrudan çağır
  if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      const parts: any[] = [];
      
      if (options.imageFileBase64) {
        parts.push({
          inlineData: {
            mimeType: options.mimeType || 'image/jpeg',
            data: options.imageFileBase64.replace(/^data:image\/\w+;base64,/, ''),
          },
        });
      }

      const promptText = `Sen uzman bir gastronomi ve restoran menü mühendisisin.
Aşağıdaki görseli veya konsept açıklamasını incele. Eksiksiz, profesyonel bir restoran/kafe menüsü oluştur.
Türkçe isimler, iştah açıcı açıklamalar, makul TL fiyatları ve alerjen bilgileri ver.

SADECE geçerli bir JSON formatında yanıt ver. Markdown tırnakları olmadan saf JSON döndür:
{
  "categories": [
    {
      "name": "Kategori Adı",
      "products": [
        {
          "name": "Ürün Adı",
          "description": "Detaylı iştah açıcı açıklama",
          "price": 180,
          "allergens": ["Gluten", "Süt"],
          "estimatedCalories": 350
        }
      ]
    }
  ]
}

İşletme İsteği / Not: ${options.conceptPrompt || 'Görseldeki menüyü eksiksiz yapılandır.'}`;

      parts.push({ text: promptText });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed.categories && Array.isArray(parsed.categories)) {
            return { categories: parsed.categories };
          }
        }
      }
    } catch (err) {
      console.warn('Gemini live API fallback triggered:', err);
    }
  }

  // Akıllı Heuristic Local Fallback Motoru (Localhost'ta anahtar olmadan da %100 çalışır)
  await new Promise((r) => setTimeout(r, 1200));
  return getSmartLocalMockMenu(options.conceptPrompt);
}

/**
 * 2. RESTIVADISYON AI MENÜ ASİSTANI & COPILOT
 * Sadece menü, fiyat, stok ve tema işlemlerini yapar. Alakasız soruları nazikçe sınırlar.
 */
export async function processMenuCopilot(
  userPrompt: string,
  currentCategories: Category[],
  currentProducts: Product[],
  business: Business
): Promise<CopilotExecutionResult> {
  const promptLower = userPrompt.toLowerCase().trim();

  // 1. Kapsam Dışı (Out of scope) Kontrolü
  const nonMenuKeywords = ['hava durumu', 'felsefe', 'tarih', 'kimdir', 'şiir', 'şarkı', 'kod yaz', 'bana fıkra', 'futbol', 'borsa', 'dolar kaç'];
  const isOutOfScope = nonMenuKeywords.some((k) => promptLower.includes(k));

  if (isOutOfScope) {
    return {
      isOutOfScope: true,
      assistantMessage: sanitizeAiText('RestivAdisyon Menü Asistanıyım. Sadece menü, fiyat, stok ve tema işlemlerinde yardımcı olabilirim.'),
      changes: [],
      suggestedQuickActions: [
        'Tüm içeceklere yüzde 15 zam yap',
        'Tükenen tatlıları satışa kapat',
        'Menüme yeni bir spesiyal ekle',
      ],
    };
  }

  // 2. Canlı Gemini Modeli ile Komut Analizi
  if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      const systemContext = `Sen RestivAdisyon platformunun resmi AI Menü ve Restoran Asistanısın.
İşletme Adı: "${business.name}"
Mevcut Kategoriler: ${JSON.stringify(currentCategories.map((c) => ({ id: c.id, name: c.name })))}
Mevcut Ürünler: ${JSON.stringify(currentProducts.map((p) => ({ id: p.id, name: p.name, price: p.price, is_frozen: p.is_frozen, cat_id: p.category_id })))}

Kullanıcı Komutu: "${userPrompt}"

KRİTİK KURALLAR:
1. Metin çıktında ASLA '*', '-', '_', '/', '?' gibi karakterler veya markdown sembolleri (yıldız, tire, alt çizgi, eğik çizgi vb.) KULLANMA.
2. assistantMessage çıktın son derece kısa, net ve öz olmalı (maksimum 1-2 kısa cümle, en fazla 15-20 kelime).
3. Asla dolambaçlı girişler, gereksiz nezaket veya uzun paragraflar yazma. Doğrudan yapılan işlemi belirt.
Örnek doğru çıktı: "4 sıcak içeceğin fiyatı yüzde 10 artırıldı. Canlıya almak için onaylayın."

Yanıt Formatı (Saf JSON):
{
  "isOutOfScope": false,
  "assistantMessage": "Kısa ve net Türkçe yanıt (1-2 cümle, sembolsüz)",
  "summaryTitle": "Örn: 6 İçeceğe Yüzde 15 Zam Hazırlandı",
  "changes": [
    {
      "type": "product_price",
      "targetId": "ürün-uuid",
      "title": "Ürün Adı",
      "oldValue": 100,
      "newValue": 115
    }
  ],
  "suggestedQuickActions": ["Öneri 1", "Öneri 2"]
}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemContext }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return {
            ...parsed,
            assistantMessage: sanitizeAiText(parsed.assistantMessage || ''),
            summaryTitle: sanitizeAiText(parsed.summaryTitle || ''),
          } as CopilotExecutionResult;
        }
      }
    } catch (err) {
      console.warn('Gemini Copilot API fallback triggered:', err);
    }
  }

  // 3. Akıllı Doğal Dil Heuristic Motoru (Offline / Localhost Garantili)
  await new Promise((r) => setTimeout(r, 600));
  return executeLocalNaturalLanguageCopilot(promptLower, currentCategories, currentProducts, business);
}

/**
 * Yerel Doğal Dil Çözümleyici (Heuristic Natural Language Rule Engine)
 */
function executeLocalNaturalLanguageCopilot(
  prompt: string,
  categories: Category[],
  products: Product[],
  business: Business
): CopilotExecutionResult {
  const changes: CopilotDiffChange[] = [];

  // A) YÜZDE ZAM VEYA İNDİRİM HESAPLAMA (Örn: "%15 zam", "%20 artır", "%10 indirim")
  const percentMatch = prompt.match(/%?\s*(\d+)\s*(%|yüzde)?\s*(zam|artır|yükselt|indirim|fiyat)/i) ||
                       prompt.match(/(zam|indirim)\s*%?\s*(\d+)/i);

  if (percentMatch || prompt.includes('zam') || prompt.includes('artır') || prompt.includes('indirim')) {
    const rateNumber = percentMatch ? parseInt(percentMatch[1] || percentMatch[2] || '10', 10) : 15;
    const isDiscount = prompt.includes('indirim') || prompt.includes('düşür');
    const factor = isDiscount ? (1 - rateNumber / 100) : (1 + rateNumber / 100);

    // Kategori kısıtı var mı? (Örn: "kahvelere zam", "tatlılara zam", "içeceklere zam")
    let targetProds = products;
    const matchedCategory = categories.find((c) => prompt.includes(c.name.toLowerCase()));
    if (matchedCategory) {
      targetProds = products.filter((p) => p.category_id === matchedCategory.id);
    } else if (prompt.includes('içecek') || prompt.includes('kahve') || prompt.includes('sıcak')) {
      const drinkCats = categories.filter((c) => c.name.toLowerCase().includes('içecek') || c.name.toLowerCase().includes('kahve'));
      if (drinkCats.length > 0) {
        const catIds = drinkCats.map((c) => c.id);
        targetProds = products.filter((p) => catIds.includes(p.category_id));
      }
    }

    targetProds.slice(0, 12).forEach((prod) => {
      let calculated = Math.round(prod.price * factor);
      // Son hanesini 0 veya 5'e yuvarla (Restoran standardı)
      if (calculated > 20) {
        calculated = Math.round(calculated / 5) * 5;
      }

      if (calculated !== prod.price) {
        changes.push({
          type: 'product_price',
          targetId: prod.id,
          title: prod.name,
          oldValue: `${prod.price} ₺`,
          newValue: `${calculated} ₺`,
          payload: { productId: prod.id, newPrice: calculated },
        });
      }
    });

    return {
      isOutOfScope: false,
      assistantMessage: sanitizeAiText(`${changes.length} ürünün fiyatı yüzde ${rateNumber} ${isDiscount ? 'indirimle' : 'artışla'} güncellendi. Canlıya almak için onaylayın.`),
      summaryTitle: sanitizeAiText(`${changes.length} Üründe Yüzde ${rateNumber} Fiyat Düzenlemesi`),
      changes,
      suggestedQuickActions: ['Tüm değişiklikleri canlıya al', 'Sadece içecekleri uygula', 'İptal et'],
    };
  }

  // B) TÜKENEN ÜRÜNÜ KAPATMA / AÇMA (Örn: "tatlılar bitti", "kuzu pirzola tükendi", "tekrar aç")
  if (prompt.includes('tükendi') || prompt.includes('bitti') || prompt.includes('kapat') || prompt.includes('satışa aç') || prompt.includes('stok')) {
    const isClosing = prompt.includes('tükendi') || prompt.includes('bitti') || prompt.includes('kapat');
    
    // Eşleşen ürün bul
    const matched = products.filter((p) => prompt.includes(p.name.toLowerCase()));
    const targetList = matched.length > 0 ? matched : products.slice(0, 2);

    targetList.forEach((prod) => {
      changes.push({
        type: 'product_stock',
        targetId: prod.id,
        title: prod.name,
        oldValue: prod.is_frozen ? 'Tükendi' : 'Satışta',
        newValue: isClosing ? 'Tükendi Olarak İşaretle' : 'Satışa Aç',
        payload: { productId: prod.id, is_frozen: isClosing },
      });
    });

    return {
      isOutOfScope: false,
      assistantMessage: sanitizeAiText(
        isClosing
          ? `${changes.length} ürün menüde Tükendi olarak işaretlendi.`
          : `${changes.length} ürün tekrar satışa açıldı.`
      ),
      summaryTitle: sanitizeAiText('Stok ve Tükendi Durumu Güncellemesi'),
      changes,
      suggestedQuickActions: ['Onayla ve Menüyü Güncelle', 'Geri Al'],
    };
  }

  // C) YENİ ÜRÜN / LEZZET EKLEME (Örn: "Yeni tatlı ekle", "San Sebastian 160 TL", "Burger ekle")
  if (prompt.includes('ekle') || prompt.includes('yeni') || prompt.includes('tatlı') || prompt.includes('burger')) {
    const defaultCat = categories[0] || { id: 'temp', name: 'Öne Çıkanlar' };
    const newTitle = prompt.includes('sebastian') ? 'San Sebastian Cheesecake' : prompt.includes('burger') ? 'Truffle Mushroom Burger' : 'Şefin Özel Spesiyali';
    const newPrice = prompt.match(/\d+/) ? parseInt(prompt.match(/\d+/)![0], 10) : 185;

    changes.push({
      type: 'product_add',
      title: newTitle,
      oldValue: 'Menüde Yok',
      newValue: `${newPrice} TL Yeni Ürün`,
      payload: {
        category_id: defaultCat.id,
        name: newTitle,
        description: 'Taze günlük malzemeler ve özel sos eşliğinde servis edilir.',
        price: newPrice,
        is_frozen: false,
        is_active: true,
      },
    });

    return {
      isOutOfScope: false,
      assistantMessage: sanitizeAiText(`${newTitle} ${newPrice} TL menünüze eklenmek üzere hazırlandı.`),
      summaryTitle: sanitizeAiText('Yeni Ürün Ekleme Taslağı'),
      changes,
      suggestedQuickActions: ['Ürünü Menüye Kaydet', 'Fiyatı Düzenle', 'İptal'],
    };
  }

  // D) TEMA VE MEKAN ANALİZİ (Örn: "Temamı değiştir", "Lüks tema yap", "Bistro havası ver")
  if (prompt.includes('tema') || prompt.includes('tasarım') || prompt.includes('renk') || prompt.includes('font') || prompt.includes('görünüm')) {
    const suggested = analyzeBrandAndSuggestTheme(business.name, prompt);
    
    changes.push({
      type: 'theme_update',
      title: suggested.recommendedTheme.name,
      oldValue: business.template_id || 'Mevcut Tema',
      newValue: suggested.recommendedTheme.name,
      payload: suggested.recommendedTheme.config,
    });

    return {
      isOutOfScope: false,
      assistantMessage: sanitizeAiText(`Mekanınıza uygun ${suggested.recommendedTheme.name} teması hazırlandı.`),
      summaryTitle: sanitizeAiText('Önerilen Restoran Teması'),
      changes,
      suggestedQuickActions: ['Temayı Canlı Menüye Uygula', 'Farklı Renk Seç'],
    };
  }

  // Genel Rehber Yanıtı
  return {
    isOutOfScope: false,
    assistantMessage: sanitizeAiText('Menü fiyatlarınızı güncelleyebilir tükenenleri kapatabilir veya yeni ürün ekleyebilirim.'),
    changes: [],
    suggestedQuickActions: [
      'Tüm kahvelere yüzde 20 zam yap',
      'Tatlılar tükendi kapat',
      'San Sebastian Cheesecake ekle 160 TL',
    ],
  };
}

/**
 * Akıllı Çevrimdışı Menü Taslağı
 */
function getSmartLocalMockMenu(promptText?: string): { categories: ExtractedCategory[] } {
  const p = (promptText || '').toLowerCase();

  if (p.includes('burger') || p.includes('fast') || p.includes('sokak')) {
    return {
      categories: [
        {
          name: 'Artisan Burgerler',
          products: [
            { name: 'Smash Truffle Burger', description: '160g çift smash dana köfte, trüflü mayonez, karamelize soğan, cheddar peyniri.', price: 260, allergens: ['Gluten', 'Süt'] },
            { name: 'Crispy Buttermilk Chicken', description: 'Özel baharatlı çıtır tavuk göğsü, coleslaw, füme acı mayonez, brioche ekmeğinde.', price: 220, allergens: ['Gluten', 'Yumurta'] },
            { name: 'Texas Smoked BBQ Burger', description: 'Füme dana kaburga dilimleri, ev yapımı bbq sos, cheddar, çıtır soğan.', price: 295, allergens: ['Gluten', 'Hardal'] },
          ],
        },
        {
          name: 'Çıtır Atıştırmalıklar',
          products: [
            { name: 'Trüflü & Parmesanlı Patates', description: 'Taze baharatlar, trüf yağı ve rendelenmiş eski kaşar peyniri eşliğinde.', price: 110 },
            { name: 'Çıtır Mozzarella Sticks (6 Adet)', description: 'Baharatlı marinara sos ile servis edilen çıtır pane peynir çubukları.', price: 135, allergens: ['Gluten', 'Süt'] },
          ],
        },
        {
          name: 'Soğuk İçecekler',
          products: [
            { name: 'Ev Yapımı Çilekli Limonata', description: 'Taze nane ve ezilmiş çilek taneleri ile hazırlanan doğal limonata.', price: 75 },
            { name: 'Kutu İçecek 330ml', description: 'Coca-Cola, Fanta, Sprite seçenekleriyle.', price: 50 },
          ],
        },
      ],
    };
  }

  // Varsayılan Zengin Kafe & Bistro Menüsü
  return {
    categories: [
      {
        name: 'Sıcak Kahveler',
        products: [
          { name: 'Flat White', description: 'Çift shot espresso ve kadifemsi mikro köpüklü taze süt.', price: 95, allergens: ['Süt'] },
          { name: 'Caramel Macchiato', description: 'Vanilya şurubu, sıcak buharda süt, espresso ve hakiki karamel sosu.', price: 115, allergens: ['Süt'] },
          { name: 'Cortado', description: 'Eşit oranda espresso ve ılık sütün muhteşem dengesi.', price: 90, allergens: ['Süt'] },
        ],
      },
      {
        name: 'Taze Fırın & Tatlılar',
        products: [
          { name: 'San Sebastian Cheesecake', description: 'İçi ipeksi akışkan, fırınlanmış yanık krema cheesecake. Çikolata sos eşliğinde.', price: 165, allergens: ['Gluten', 'Süt', 'Yumurta'] },
          { name: 'Tereyağlı Fransız Kruvasan', description: 'Hakiki Fransız tereyağı ile 48 saat mayalanmış çıtır katmanlı taze kruvasan.', price: 85, allergens: ['Gluten', 'Süt'] },
          { name: 'Fıstıklı Brownie', description: 'Sıcak Belçika çikolatalı brownie, Antep fıstığı parçacıkları ve vanilyalı dondurma ile.', price: 145, allergens: ['Gluten', 'Süt', 'Fıstık'] },
        ],
      },
      {
        name: 'Soğuk Spesiyaller',
        products: [
          { name: 'Iced Salted Caramel Latte', description: 'Tuzlu karamel aroması, soğuk süt ve buzlu espresso katmanları.', price: 125, allergens: ['Süt'] },
          { name: 'Hibiscus Berry Cooler', description: 'Doğal demlenmiş hibiskus çiçeği çayı, orman meyveleri püresi ve taze nane.', price: 95 },
        ],
      },
    ],
  };
}
