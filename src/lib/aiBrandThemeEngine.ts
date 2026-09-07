// ==============================================================================
// RESTIVADISYON AI BRAND & THEME ENGINE
// Gerçek Restoran Konseptlerine Dayalı Tema, Tipografi & QR Tasarım Motoru
// ==============================================================================

import { MenuThemeConfig, TemplateId, FontFamilyType, CardStyleType, Business } from '../types';

export interface PresetThemeDefinition {
  id: TemplateId;
  name: string;
  tagline: string;
  category: 'Lüks & Fine Dining' | 'Kafe & Fırın' | 'Bistro & Bar' | 'Geleneksel & Ocakbaşı' | 'Burger & Sokak' | 'Minimalist & Sağlıklı';
  config: MenuThemeConfig;
  previewGradient: string;
}

/**
 * Google Fonts Yükleyici ve CSS Font Family Eşleştirmesi
 */
export const FONT_FAMILY_MAP: Record<FontFamilyType, { label: string; cssFont: string; googleFontName: string; style: string }> = {
  inter: {
    label: 'Inter (Temiz & Modern)',
    cssFont: "'Inter', sans-serif",
    googleFontName: 'Inter:wght@400;600;700;800;900',
    style: 'Modern & Okunaklı',
  },
  playfair: {
    label: 'Playfair Display (Lüks & Zarif Serif)',
    cssFont: "'Playfair Display', serif",
    googleFontName: 'Playfair+Display:ital,wght@0,600;0,700;0,900;1,400',
    style: 'Lüks & Premium',
  },
  poppins: {
    label: 'Poppins (Yumuşak & Dinamik)',
    cssFont: "'Poppins', sans-serif",
    googleFontName: 'Poppins:wght@400;500;600;700;800',
    style: 'Kafe & Butik',
  },
  montserrat: {
    label: 'Montserrat (Prestijli Geometrik)',
    cssFont: "'Montserrat', sans-serif",
    googleFontName: 'Montserrat:wght@400;600;700;800',
    style: 'Bistro & Lounge',
  },
  bebas: {
    label: 'Bebas Neue (Kalın & Güçlü Başlıklar)',
    cssFont: "'Bebas Neue', cursive, sans-serif",
    googleFontName: 'Bebas+Neue',
    style: 'Burger & Sokak Lezzetleri',
  },
  cormorant: {
    label: 'Cormorant Garamond (Klasik & Asil)',
    cssFont: "'Cormorant Garamond', serif",
    googleFontName: 'Cormorant+Garamond:wght@500;600;700',
    style: 'Geleneksel & Otantik',
  },
};

/**
 * 6 Adet Gerçek Sektörel Restoran & Kafe Teması
 */
export const PRESET_THEMES: Record<TemplateId, PresetThemeDefinition> = {
  fine_dining: {
    id: 'fine_dining',
    name: 'Lüks Gastronomi & Steakhouse',
    tagline: 'Kömür siyahı, mat altın ışıltısı ve zarif serif tipografi.',
    category: 'Lüks & Fine Dining',
    previewGradient: 'from-amber-600 via-neutral-900 to-black',
    config: {
      template_id: 'fine_dining',
      font_family: 'playfair',
      card_style: 'glass_card',
      primary_color: '#D4AF37', // Varak Altın
      secondary_color: '#E6CA65',
      background_color: '#0A0D12',
      surface_color: '#131822',
      text_primary: '#FFFFFF',
      text_secondary: '#94A3B8',
      accent_glow: true,
      qr_theme: {
        pattern: 'diamond',
        fg_color: '#D4AF37',
        bg_color: '#0A0D12',
        has_gradient: true,
        gradient_color: '#F3E5AB',
        logo_in_center: true,
        frame_style: 'luxury_border',
        frame_text: 'Özel Menü & Rezervasyon',
      },
    },
  },

  boutique_cafe: {
    id: 'boutique_cafe',
    name: '3. Nesil Butik Kafe & Bakery',
    tagline: 'Sıcak kavrulmuş kahve tonları, doğal bej ve yumuşak modern fontlar.',
    category: 'Kafe & Fırın',
    previewGradient: 'from-amber-700 via-orange-950 to-stone-900',
    config: {
      template_id: 'boutique_cafe',
      font_family: 'poppins',
      card_style: 'rounded_card',
      primary_color: '#C07A38', // Roasted Amber
      secondary_color: '#E0A96D',
      background_color: '#120F0D',
      surface_color: '#1E1916',
      text_primary: '#FAF5EF',
      text_secondary: '#A89F91',
      accent_glow: true,
      qr_theme: {
        pattern: 'rounded',
        fg_color: '#C07A38',
        bg_color: '#120F0D',
        has_gradient: true,
        gradient_color: '#E0A96D',
        logo_in_center: true,
        frame_style: 'simple_badge',
        frame_text: 'Taze Kahve & Fırın Menüsü',
      },
    },
  },

  modern_bistro: {
    id: 'modern_bistro',
    name: 'Modern Bistro & Brasserie',
    tagline: 'Gece mavisi zarafeti, kobalt vurgular ve büyük fotoğraflı şık kartlar.',
    category: 'Bistro & Bar',
    previewGradient: 'from-blue-600 via-slate-900 to-black',
    config: {
      template_id: 'modern_bistro',
      font_family: 'montserrat',
      card_style: 'modern_grid',
      primary_color: '#3B82F6', // Cobalt Electric
      secondary_color: '#60A5FA',
      background_color: '#080C14',
      surface_color: '#101726',
      text_primary: '#F8FAFC',
      text_secondary: '#94A3B8',
      accent_glow: true,
      qr_theme: {
        pattern: 'fluid',
        fg_color: '#3B82F6',
        bg_color: '#080C14',
        has_gradient: true,
        gradient_color: '#60A5FA',
        logo_in_center: true,
        frame_style: 'table_pill',
        frame_text: 'Bistro & Kokteyl Menüsü',
      },
    },
  },

  traditional_ocak: {
    id: 'traditional_ocak',
    name: 'Geleneksel Ocakbaşı & Kebap',
    tagline: 'Sıcak tuğla kırmızısı, döküm taş dokusu ve porsiyon odaklı detaylı kartlar.',
    category: 'Geleneksel & Ocakbaşı',
    previewGradient: 'from-red-800 via-neutral-900 to-black',
    config: {
      template_id: 'traditional_ocak',
      font_family: 'cormorant',
      card_style: 'compact_row',
      primary_color: '#DC2626', // Tuğla Kırmızısı
      secondary_color: '#F87171',
      background_color: '#0E0909',
      surface_color: '#1A1212',
      text_primary: '#FFF1F2',
      text_secondary: '#A1A1AA',
      accent_glow: true,
      qr_theme: {
        pattern: 'standard',
        fg_color: '#DC2626',
        bg_color: '#0E0909',
        has_gradient: false,
        logo_in_center: true,
        frame_style: 'simple_badge',
        frame_text: 'Ocakbaşı & Izgara Menüsü',
      },
    },
  },

  artisan_burger: {
    id: 'artisan_burger',
    name: 'Artisan Burger & Street Food',
    tagline: 'Kömür karası, alev turuncusu ve güçlü dinamik başlıklar.',
    category: 'Burger & Sokak',
    previewGradient: 'from-orange-600 via-zinc-900 to-black',
    config: {
      template_id: 'artisan_burger',
      font_family: 'inter',
      card_style: 'rounded_card',
      primary_color: '#F97316', // Flame Orange
      secondary_color: '#FB923C',
      background_color: '#090B0E',
      surface_color: '#13181F',
      text_primary: '#FFFFFF',
      text_secondary: '#9CA3AF',
      accent_glow: true,
      qr_theme: {
        pattern: 'dots',
        fg_color: '#F97316',
        bg_color: '#090B0E',
        has_gradient: true,
        gradient_color: '#FBBF24',
        logo_in_center: true,
        frame_style: 'table_pill',
        frame_text: 'Sıcak Burger & Atıştırmalıklar',
      },
    },
  },

  minimalist_zen: {
    id: 'minimalist_zen',
    name: 'Minimalist İskandinav & Bowls',
    tagline: 'Ferah zümrüt yeşili, temiz beyaz ve kalori/alerjen odaklı sade liste.',
    category: 'Minimalist & Sağlıklı',
    previewGradient: 'from-emerald-600 via-slate-900 to-black',
    config: {
      template_id: 'minimalist_zen',
      font_family: 'inter',
      card_style: 'minimal_list',
      primary_color: '#10B981', // Emerald Mint
      secondary_color: '#34D399',
      background_color: '#070C0A',
      surface_color: '#101A16',
      text_primary: '#ECFDF5',
      text_secondary: '#9CA3AF',
      accent_glow: true,
      qr_theme: {
        pattern: 'rounded',
        fg_color: '#10B981',
        bg_color: '#070C0A',
        has_gradient: true,
        gradient_color: '#34D399',
        logo_in_center: true,
        frame_style: 'none',
        frame_text: 'Taze & Sağlıklı Menü',
      },
    },
  },

  // Legacy mappings
  clean: {
    id: 'clean',
    name: 'Klasik Restiva Temiz',
    tagline: 'Sade ve zamansız arayüz.',
    category: 'Minimalist & Sağlıklı',
    previewGradient: 'from-slate-600 to-black',
    config: {
      template_id: 'clean',
      font_family: 'inter',
      card_style: 'rounded_card',
      primary_color: '#F97316',
      background_color: '#0C1017',
      surface_color: '#111622',
      text_primary: '#FFFFFF',
      text_secondary: '#94A3B8',
      accent_glow: true,
      qr_theme: {
        pattern: 'standard',
        fg_color: '#F97316',
        bg_color: '#0C1017',
        has_gradient: false,
        logo_in_center: true,
        frame_style: 'simple_badge',
        frame_text: 'QR Menü',
      },
    },
  },
  dark_luxury: {
    id: 'dark_luxury',
    name: 'Dark Luxury Gold',
    tagline: 'Lüks altın tonları.',
    category: 'Lüks & Fine Dining',
    previewGradient: 'from-amber-600 to-black',
    config: {
      template_id: 'dark_luxury',
      font_family: 'playfair',
      card_style: 'glass_card',
      primary_color: '#D4AF37',
      background_color: '#0A0D12',
      surface_color: '#131822',
      text_primary: '#FFFFFF',
      text_secondary: '#94A3B8',
      accent_glow: true,
      qr_theme: {
        pattern: 'diamond',
        fg_color: '#D4AF37',
        bg_color: '#0A0D12',
        has_gradient: true,
        gradient_color: '#F3E5AB',
        logo_in_center: true,
        frame_style: 'luxury_border',
        frame_text: 'QR Menü',
      },
    },
  },
  nordic: {
    id: 'nordic',
    name: 'Nordic Clean',
    tagline: 'İskandinav ferahlığı.',
    category: 'Minimalist & Sağlıklı',
    previewGradient: 'from-teal-600 to-black',
    config: {
      template_id: 'nordic',
      font_family: 'inter',
      card_style: 'minimal_list',
      primary_color: '#14B8A6',
      background_color: '#080E10',
      surface_color: '#101B1E',
      text_primary: '#F0FDFA',
      text_secondary: '#94A3B8',
      accent_glow: true,
      qr_theme: {
        pattern: 'rounded',
        fg_color: '#14B8A6',
        bg_color: '#080E10',
        has_gradient: false,
        logo_in_center: true,
        frame_style: 'none',
        frame_text: 'QR Menü',
      },
    },
  },
  bistro: {
    id: 'bistro',
    name: 'Retro Bistro',
    tagline: 'Sıcak bistro havası.',
    category: 'Bistro & Bar',
    previewGradient: 'from-indigo-600 to-black',
    config: {
      template_id: 'bistro',
      font_family: 'montserrat',
      card_style: 'modern_grid',
      primary_color: '#6366F1',
      background_color: '#090B14',
      surface_color: '#121624',
      text_primary: '#FFFFFF',
      text_secondary: '#94A3B8',
      accent_glow: true,
      qr_theme: {
        pattern: 'fluid',
        fg_color: '#6366F1',
        bg_color: '#090B14',
        has_gradient: true,
        gradient_color: '#A5B4FC',
        logo_in_center: true,
        frame_style: 'table_pill',
        frame_text: 'QR Menü',
      },
    },
  },
  neon: {
    id: 'neon',
    name: 'Night Lounge',
    tagline: 'Akşam ve gece mekanı zarafeti.',
    category: 'Bistro & Bar',
    previewGradient: 'from-purple-600 to-black',
    config: {
      template_id: 'neon',
      font_family: 'montserrat',
      card_style: 'glass_card',
      primary_color: '#A855F7',
      background_color: '#0C0814',
      surface_color: '#161024',
      text_primary: '#FAF5FF',
      text_secondary: '#A8A29E',
      accent_glow: true,
      qr_theme: {
        pattern: 'dots',
        fg_color: '#A855F7',
        bg_color: '#0C0814',
        has_gradient: true,
        gradient_color: '#EC4899',
        logo_in_center: true,
        frame_style: 'luxury_border',
        frame_text: 'Lounge Menü',
      },
    },
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage & Antik',
    tagline: 'Nostaljik ve otantik atmosfer.',
    category: 'Geleneksel & Ocakbaşı',
    previewGradient: 'from-amber-800 to-black',
    config: {
      template_id: 'vintage',
      font_family: 'cormorant',
      card_style: 'compact_row',
      primary_color: '#B45309',
      background_color: '#100B06',
      surface_color: '#1C140C',
      text_primary: '#FFFBEB',
      text_secondary: '#A8A29E',
      accent_glow: true,
      qr_theme: {
        pattern: 'standard',
        fg_color: '#B45309',
        bg_color: '#100B06',
        has_gradient: false,
        logo_in_center: true,
        frame_style: 'simple_badge',
        frame_text: 'QR Menü',
      },
    },
  },
};

/**
 * İşletmenin geçerli tema yapılandırmasını döndürür
 */
export function getEffectiveThemeConfig(business: Business): MenuThemeConfig {
  if (business.theme_config && business.theme_config.primary_color) {
    return business.theme_config;
  }
  const tid = business.template_id || 'fine_dining';
  return PRESET_THEMES[tid]?.config || PRESET_THEMES.fine_dining.config;
}

/**
 * Mekan adı, logo veya konsept ipuçlarından yapay zeka ile en uygun temayı belirler
 */
export function analyzeBrandAndSuggestTheme(
  businessName: string,
  conceptKeywords?: string
): {
  recommendedTheme: PresetThemeDefinition;
  detectedMood: string;
  reasoning: string;
} {
  const combined = (businessName + ' ' + (conceptKeywords || '')).toLowerCase();

  if (combined.includes('steak') || combined.includes('et') || combined.includes('fine') || combined.includes('gourmet') || combined.includes('lüks')) {
    return {
      recommendedTheme: PRESET_THEMES.fine_dining,
      detectedMood: 'Lüks Gastronomi & Steakhouse',
      reasoning: `"${businessName}" için altın varak tonları, kömür siyahı arka plan ve prestijli Playfair Display tipografisi önerildi.`,
    };
  }

  if (combined.includes('kahve') || combined.includes('coffee') || combined.includes('roast') || combined.includes('bakery') || combined.includes('fırın') || combined.includes('tatlı') || combined.includes('croissant') || combined.includes('kafe')) {
    return {
      recommendedTheme: PRESET_THEMES.boutique_cafe,
      detectedMood: '3. Nesil Butik Kafe & Bakery',
      reasoning: `"${businessName}" için taze kavrulmuş sıcak kahve tonları, doğal bej zemin ve modern Poppins yazı tipi önerildi.`,
    };
  }

  if (combined.includes('kebap') || combined.includes('ocakbaşı') || combined.includes('döner') || combined.includes('lahmacun') || combined.includes('meyhane') || combined.includes('köfte')) {
    return {
      recommendedTheme: PRESET_THEMES.traditional_ocak,
      detectedMood: 'Geleneksel Ocakbaşı & Kebap',
      reasoning: `"${businessName}" için sıcak tuğla kırmızısı, taş dokusu ve geleneksel Cormorant Garamond tipografisi önerildi.`,
    };
  }

  if (combined.includes('burger') || combined.includes('pizza') || combined.includes('sokak') || combined.includes('fast') || combined.includes('tavuk') || combined.includes('fries')) {
    return {
      recommendedTheme: PRESET_THEMES.artisan_burger,
      detectedMood: 'Artisan Burger & Street Food',
      reasoning: `"${businessName}" için dinamik alev turuncusu, döküm kömür kartlar ve güçlü Bebas Neue başlıkları önerildi.`,
    };
  }

  if (combined.includes('bowl') || combined.includes('salat') || combined.includes('sağlık') || combined.includes('vegan') || combined.includes('smoothie') || combined.includes('fit')) {
    return {
      recommendedTheme: PRESET_THEMES.minimalist_zen,
      detectedMood: 'Minimalist İskandinav & Sağlıklı Yaşam',
      reasoning: `"${businessName}" için taze zümrüt nane tonları, ferah beyaz yüzeyler ve okunaklı Inter fontu önerildi.`,
    };
  }

  // Default to Modern Bistro
  return {
    recommendedTheme: PRESET_THEMES.modern_bistro,
    detectedMood: 'Modern Bistro & Brasserie',
    reasoning: `"${businessName}" için gece mavisi zarafeti, kobalt vurgular ve şık Montserrat tipografisi önerildi.`,
  };
}

/**
 * Dinamik Google Font Linkini HTML Head'e Ekler
 */
export function injectGoogleFont(fontKey: FontFamilyType) {
  const fontMeta = FONT_FAMILY_MAP[fontKey];
  if (!fontMeta) return;

  const fontId = `google-font-${fontKey}`;
  if (!document.getElementById(fontId)) {
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontMeta.googleFontName}&display=swap`;
    document.head.appendChild(link);
  }
}

// ==============================================================================
// RESTIVADISYON SMART FOOD & DRINK IMAGE ENGINE
// Her yiyecek çeşidine, porsiyonuna (ekmek arası / tabakta porsiyon), adet sayısına
// ve içecek markasına göre en uygun yüksek çözünürlüklü görseli eşleştirir.
// ==============================================================================

function normText(text: string): string {
  return (text || '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/Ö/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/Ü/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/Ç/g, 'c')
    .replace(/ç/g, 'c')
    .replace(/Ğ/g, 'g')
    .replace(/ğ/g, 'g')
    .replace(/Ş/g, 's')
    .replace(/ş/g, 's')
    .toLowerCase();
}

function hasWordToken(text: string, token: string): boolean {
  const clean = normText(text);
  const t = normText(token);
  const regex = new RegExp(`(^|[^a-z0-9])${t}([^a-z0-9]|$)`, 'i');
  return regex.test(clean);
}

/**
 * Ürün adı, açıklaması ve kategoriye göre en doğru yüksek çözünürlüklü fotoğrafı belirler
 */
export function getProductSpecificImage(
  productName: string,
  productDescription?: string,
  categoryImage?: string
): string {
  const name = normText(productName);

  // 1. İÇECEKLER (Birebir Marka ve İçecek Tipi Eşleşmesi)
  if (hasWordToken(name, 'fanta') || hasWordToken(name, 'yedigun')) {
    return '/images/food/fanta.jpg'; // Gerçek Soğuk Kutu Fanta
  }
  if (hasWordToken(name, 'sprite')) {
    return '/images/food/sprite.jpg'; // Buzlu Kutu Sprite Limon Gazozu
  }
  if (hasWordToken(name, 'gazoz') || hasWordToken(name, 'fruko') || hasWordToken(name, 'uludag')) {
    return '/images/food/gazoz.jpg'; // Buzlu Nostaljik Cam Şişe Gazoz
  }
  if (hasWordToken(name, 'coca-cola') || hasWordToken(name, 'coca cola') || hasWordToken(name, 'cola') || hasWordToken(name, 'kola') || hasWordToken(name, 'pepsi')) {
    return '/images/food/coca-cola.jpg'; // Orijinal Kırmızı Kutu Coca-Cola
  }
  if (hasWordToken(name, 'salgam')) {
    return '/images/food/salgam.jpg'; // Buzlu Kırmızı Adana Şalgam Suyu
  }
  if (hasWordToken(name, 'ayran')) {
    return '/images/food/ayran.jpg'; // Bol Köpüklü Taze Yayık Ayranı
  }
  if (hasWordToken(name, 'meyveli soda') || (hasWordToken(name, 'soda') && hasWordToken(name, 'meyveli'))) {
    return '/images/food/soda.jpg'; // Meyveli Soğuk Maden Suyu
  }
  if (hasWordToken(name, 'sade') || hasWordToken(name, 'maden suyu') || hasWordToken(name, 'soda')) {
    return '/images/food/soda.jpg'; // Limon Dilimli Doğal Maden Suyu
  }
  if (hasWordToken(name, 'su') || hasWordToken(name, 'kaynak suyu')) {
    return '/images/food/su.jpg'; // Doğal Kaynak Suyu
  }

  // 2. MİDYE DOLMA (Tekli Adet vs Jumbo vs 20'li Limonlu Porsiyon Tabak)
  if (hasWordToken(name, 'midye')) {
    if (hasWordToken(name, 'porsiyon') || hasWordToken(name, 'tabak') || hasWordToken(name, 'tabakta')) {
      return '/images/food/midye-porsiyon.jpg'; // 20 Adet Limon Dilimli Zengin Midye Dolma Porsiyon Tabağı
    }
    if (hasWordToken(name, 'jumbo')) {
      return '/images/food/midye-jumbo.jpg'; // Büyük Dolgun Jumbo Midye Dolma
    }
    return '/images/food/midye-tekli.jpg'; // Taze Limonlu Açılmış Midye Dolma (Tekli)
  }

  // 3. BOMBASTİK (Köfte + Sucuk Karışık)
  if (hasWordToken(name, 'bombastik')) {
    if (hasWordToken(name, 'porsiyon') || hasWordToken(name, 'tabak') || hasWordToken(name, 'tabakta')) {
      return '/images/food/bombastik-porsiyon.jpg'; // Tabakta Karışık Köfte & Sucuk Izgara Porsiyon Tabağı
    }
    return '/images/food/bombastik-ekmek.jpg'; // Çıtır Ekmek Arası Bombastik Karışık Izgara
  }

  // 4. SUCUK (Ekmek Arası vs Tabakta Porsiyon)
  if (hasWordToken(name, 'sucuk')) {
    if (hasWordToken(name, 'porsiyon') || hasWordToken(name, 'tabak') || hasWordToken(name, 'tabakta')) {
      return '/images/food/sucuk-porsiyon.jpg'; // Köz Sebzeli Tabakta Servis Edilen Kasap Sucuğu Porsiyon
    }
    return '/images/food/sucuk-ekmek.jpg'; // Çıtır Ekmek Arası Kızarmış Kasap Sucuğu
  }

  // 5. KÖFTE (Ekmek Arası vs Tabakta Porsiyon)
  if (hasWordToken(name, 'kofte')) {
    if (hasWordToken(name, 'porsiyon') || hasWordToken(name, 'tabak') || hasWordToken(name, 'tabakta')) {
      return '/images/food/kofte-porsiyon.jpg'; // Köz Biber-Domatesli Tabakta Anne Köftesi Porsiyon Tabağı
    }
    return '/images/food/kofte-ekmek.jpg'; // Çıtır Ekmek Arası Izgara Köfte
  }

  // 6. İZMİR USULÜ KOKOREÇ (İRİ KIYIM)
  if (hasWordToken(name, 'izmir') || hasWordToken(name, 'iri kiyim')) {
    if (hasWordToken(name, 'porsiyon') || hasWordToken(name, 'tabak') || hasWordToken(name, 'tabakta')) {
      return '/images/food/kokorec-izmir-porsiyon.jpg'; // Tabakta Sıcak Servis Edilen İri Kıyım İzmir Usulü Kokoreç
    }
    return '/images/food/kokorec-izmir-ekmek.jpg'; // Çıtır Ekmek Arası İri Kıyım İzmir Usulü Kokoreç
  }

  // 7. KLASİK KOKOREÇ
  if (hasWordToken(name, 'kokorec')) {
    if (hasWordToken(name, 'porsiyon') || hasWordToken(name, 'tabak') || hasWordToken(name, 'tabakta')) {
      return '/images/food/kokorec-porsiyon.jpg'; // Köz Biber ve Domates Eşliğinde Dilimli Porsiyon Kokoreç
    }
    return '/images/food/kokorec-ekmek.jpg'; // Köz Ateşinde Çıtır Ekmek Arası Kokoreç
  }

  // 8. Varsayılan Fallback
  return categoryImage || '/images/food/kofte-ekmek.jpg';
}

