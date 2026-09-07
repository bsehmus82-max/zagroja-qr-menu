import { supabase } from './supabase';
import { FoodPlatformConfig, PlatformType, Order } from '../types';

export const PLATFORM_INFO: Record<
  PlatformType,
  {
    name: string;
    description: string;
    logoColor: string;
    portalName: string;
    portalUrl: string;
    requiredFields: { key: keyof FoodPlatformConfig; label: string; placeholder: string }[];
  }
> = {
  trendyol: {
    name: 'Trendyol Yemek',
    description: 'Trendyol GO ve Trendyol Yemek siparişlerini anlık olarak adisyona düşürün ve onaylayın.',
    logoColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    portalName: 'Trendyol Satıcı Portalı',
    portalUrl: 'https://partner.trendyol.com',
    requiredFields: [
      { key: 'merchant_id', label: 'Satıcı ID (Supplier ID)', placeholder: 'Örn: 128450' },
      { key: 'api_key', label: 'Özel API Key (İsteğe Bağlı)', placeholder: 'Boş bırakılırsa Master API kullanılır' },
      { key: 'api_secret', label: 'Özel API Secret (İsteğe Bağlı)', placeholder: 'Boş bırakılırsa Master API kullanılır' },
    ],
  },
  yemeksepeti: {
    name: 'Yemeksepeti',
    description: 'Yemeksepeti ve Delivery Hero ağından gelen paket siparişleri doğrudan mutfağa aktarın.',
    logoColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    portalName: 'Yemeksepeti Partner Portalı',
    portalUrl: 'https://partner.yemeksepeti.com',
    requiredFields: [
      { key: 'merchant_id', label: 'Restoran ID (Vendor ID)', placeholder: 'Örn: tr_ist_4821' },
      { key: 'client_id', label: 'Özel Client ID (İsteğe Bağlı)', placeholder: 'Boş bırakılırsa Master API kullanılır' },
      { key: 'client_secret', label: 'Özel Client Secret (İsteğe Bağlı)', placeholder: 'Boş bırakılırsa Master API kullanılır' },
    ],
  },
  getir: {
    name: 'Getir Yemek',
    description: 'GetirYemek siparişlerini tek ekranda toplayın ve kurye aşamalarını takip edin.',
    logoColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    portalName: 'Getir Restoran Portalı',
    portalUrl: 'https://restoran.getir.com',
    requiredFields: [
      { key: 'merchant_id', label: 'Restoran ID', placeholder: 'Örn: getir_rest_902' },
      { key: 'api_key', label: 'Özel API Key / Token (İsteğe Bağlı)', placeholder: 'Boş bırakılırsa Master API kullanılır' },
    ],
  },
  migros: {
    name: 'Migros Yemek',
    description: 'Migros One Yemek restoran siparişlerini otomatik adisyona yönlendirin.',
    logoColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    portalName: 'Migros One Partner',
    portalUrl: 'https://migrosone.com',
    requiredFields: [
      { key: 'merchant_id', label: 'Mağaza Kodu (Store ID)', placeholder: 'Örn: mgr_str_104' },
      { key: 'api_key', label: 'Özel API Key (İsteğe Bağlı)', placeholder: 'Boş bırakılırsa Master API kullanılır' },
    ],
  },
  tiklagelsin: {
    name: 'Tıkla Gelsin',
    description: 'TAB Gıda ve Tıkla Gelsin restoran siparişlerini doğrudan adisyona bağlayın.',
    logoColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    portalName: 'Tıkla Gelsin Portal',
    portalUrl: 'https://tiklagelsin.com',
    requiredFields: [
      { key: 'merchant_id', label: 'Restoran / Şube Kodu', placeholder: 'Örn: TG_IST_082' },
      { key: 'api_key', label: 'Özel API Key (İsteğe Bağlı)', placeholder: 'Boş bırakılırsa Master API kullanılır' },
    ],
  },
  fuudy: {
    name: 'Fuudy',
    description: 'Fuudy gurme restoran siparişlerini ve özel kurye süreçlerini yönetin.',
    logoColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    portalName: 'Fuudy Partner',
    portalUrl: 'https://fuudy.co',
    requiredFields: [
      { key: 'merchant_id', label: 'Fuudy Mağaza ID', placeholder: 'Örn: FD_STORE_44' },
      { key: 'api_key', label: 'Özel API Key (İsteğe Bağlı)', placeholder: 'Boş bırakılırsa Master API kullanılır' },
    ],
  },
  vigo: {
    name: 'Vigo Kurye',
    description: 'Vigo entegre kurye ağı ile otomatik kurye çağırın ve siparişi teslim ettirin.',
    logoColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    portalName: 'Vigo Partner',
    portalUrl: 'https://vigokurye.com',
    requiredFields: [
      { key: 'merchant_id', label: 'Vigo Müşteri Kodu (Merchant Code)', placeholder: 'Örn: VIGO_9104' },
      { key: 'api_key', label: 'Özel API Token (İsteğe Bağlı)', placeholder: 'Boş bırakılırsa Master API kullanılır' },
    ],
  },
};

/**
 * Merkezi RestivAdisyon Master API Anahtarları (Doğrudan Kod Seviyesinde Entegre)
 */
export const SYSTEM_MASTER_CREDENTIALS: Record<PlatformType, {
  apiKey: string;
  apiSecret?: string;
  clientId?: string;
  clientSecret?: string;
}> = {
  trendyol: {
    apiKey: (import.meta as any).env?.VITE_TRENDYOL_API_KEY || 'RESTIVA_TR_MASTER_KEY',
    apiSecret: (import.meta as any).env?.VITE_TRENDYOL_API_SECRET || 'RESTIVA_TR_SECRET',
  },
  yemeksepeti: {
    apiKey: (import.meta as any).env?.VITE_YEMEKSEPETI_API_KEY || 'RESTIVA_YS_MASTER_KEY',
    clientId: (import.meta as any).env?.VITE_YEMEKSEPETI_CLIENT_ID || 'RESTIVA_YS_CLIENT',
    clientSecret: (import.meta as any).env?.VITE_YEMEKSEPETI_CLIENT_SECRET || 'RESTIVA_YS_SECRET',
  },
  getir: {
    apiKey: (import.meta as any).env?.VITE_GETIR_API_KEY || 'RESTIVA_GETIR_MASTER_KEY',
  },
  migros: {
    apiKey: (import.meta as any).env?.VITE_MIGROS_API_KEY || 'RESTIVA_MIGROS_MASTER_KEY',
  },
  tiklagelsin: {
    apiKey: (import.meta as any).env?.VITE_TIKLAGELSIN_API_KEY || 'RESTIVA_TG_MASTER_KEY',
  },
  fuudy: {
    apiKey: (import.meta as any).env?.VITE_FUUDY_API_KEY || 'RESTIVA_FUUDY_MASTER_KEY',
  },
  vigo: {
    apiKey: (import.meta as any).env?.VITE_VIGO_API_KEY || 'RESTIVA_VIGO_MASTER_KEY',
  },
};

/**
 * İşletmeyi tek satır kodla doğrudan platforma bağlar
 */
export async function activateBusinessPlatform(businessId: string, platform: PlatformType, merchantId: string) {
  return await savePlatformConfig({
    business_id: businessId,
    platform: platform,
    merchant_id: merchantId,
    is_active: true,
    use_master_api: true,
    auto_accept: false,
    courier_type: 'platform',
  });
}

/**
 * Superadmin Global Master API Ayarlarını Getirir
 */
export async function getMasterPlatformConfigs(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase.from('system_platform_master_configs').select('*');
    const result: Record<string, any> = {};
    if (!error && data) {
      data.forEach((row: any) => {
        result[row.platform] = row;
      });
    }
    // Local storage fallback
    const saved = localStorage.getItem('restiva_master_platform_configs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...parsed, ...result };
      } catch {}
    }
    return result;
  } catch {
    const saved = localStorage.getItem('restiva_master_platform_configs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {};
  }
}

/**
 * Superadmin Global Master API Ayarını Kaydeder
 */
export async function saveMasterPlatformConfig(config: any): Promise<boolean> {
  try {
    // 1. Save to local storage
    const current: Record<string, any> = await getMasterPlatformConfigs();
    current[config.platform] = config;
    localStorage.setItem('restiva_master_platform_configs', JSON.stringify(current));

    // 2. Try DB upsert
    await supabase.from('system_platform_master_configs').upsert({
      platform: config.platform,
      master_api_key: config.master_api_key,
      master_api_secret: config.master_api_secret,
      master_client_id: config.master_client_id,
      master_client_secret: config.master_client_secret,
      app_id: config.app_id,
      webhook_base_url: config.webhook_base_url,
      is_enabled: config.is_enabled ?? true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'platform' });

    return true;
  } catch (err) {
    console.warn('Master platform config DB save warning:', err);
    return true;
  }
}

/**
 * İşletmeye ait tüm platform yapılandırmalarını getirir.
 */
export async function getPlatformConfigs(businessId: string): Promise<FoodPlatformConfig[]> {
  try {
    const { data, error } = await supabase
      .from('food_platforms_config')
      .select('*')
      .eq('business_id', businessId);

    if (error) throw error;
    return (data || []) as FoodPlatformConfig[];
  } catch (err) {
    console.error('Platform yapılandırmaları alınamadı:', err);
    return [];
  }
}

/**
 * Platform yapılandırmasını kaydeder veya günceller.
 */
export async function savePlatformConfig(config: FoodPlatformConfig): Promise<FoodPlatformConfig | null> {
  try {
    const { data, error } = await supabase.rpc('upsert_food_platform_config', {
      p_business_id: config.business_id,
      p_platform: config.platform,
      p_is_active: config.is_active,
      p_merchant_id: config.merchant_id || null,
      p_api_key: config.api_key || null,
      p_api_secret: config.api_secret || null,
      p_client_id: config.client_id || null,
      p_client_secret: config.client_secret || null,
      p_auto_accept: config.auto_accept || false,
      p_courier_type: config.courier_type || 'platform',
    });

    if (error) throw error;
    return data as FoodPlatformConfig;
  } catch (err) {
    console.error('Platform yapılandırması kaydedilemedi:', err);
    throw err;
  }
}

/**
 * İşletme için Webhook URL üretir.
 */
export function getPlatformWebhookUrl(businessSlug: string, platform: PlatformType): string {
  const origin = window.location.origin;
  return `${origin}/api/webhooks/${platform}/${businessSlug}`;
}

/**
 * Canlı Test Siparişi Tetikler (Yemeksepeti / Trendyol / Getir Simülasyonu)
 */
export async function sendSimulatedPlatformOrder(
  businessId: string,
  platform: PlatformType,
  sampleProducts: { name: string; price: number; quantity: number }[]
): Promise<Order | null> {
  try {
    const total = sampleProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const itemsJson = sampleProducts.map((p, i) => ({
      product_id: `sim_prod_${i + 1}`,
      name: p.name,
      price: p.price,
      quantity: p.quantity,
    }));

    const sampleAddresses = [
      'Atatürk Cad. No: 42 Daire: 5 Kadıköy / İstanbul',
      'Bağdat Cad. Nilüfer Apt. No: 18 Kat: 3 Çankaya / Ankara',
      'Cumhuriyet Mah. 1420 Sok. No: 12/A Konak / İzmir',
    ];
    const sampleNames = ['Caner Çelik', 'Elif Yılmaz', 'Burak Demir', 'Selin Aksoy'];

    const chosenName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const chosenAddress = sampleAddresses[Math.floor(Math.random() * sampleAddresses.length)];

    const { data, error } = await supabase.rpc('simulate_incoming_platform_order', {
      p_business_id: businessId,
      p_platform: platform,
      p_customer_name: chosenName,
      p_delivery_address: chosenAddress,
      p_items: itemsJson,
      p_total: total,
      p_notes: 'Zil bozuk lütfen kapıyı çalınız, soslar ayrı olsun.',
    });

    if (error) throw error;
    return data as Order;
  } catch (err) {
    console.error('Simüle sipariş oluşturulamadı:', err);
    throw err;
  }
}

/**
 * Platform Sipariş Durumunu Günceller (Onaylandı, Hazırlandı, Kuryede vb.)
 * Gerçek API çağrısı yapılabilir ya da simüle edilir.
 */
export async function updatePlatformOrderStatus(
  order: Order,
  newStatus: 'preparing' | 'served' | 'paid' | 'cancelled'
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Veritabanında sipariş durumunu güncelle
    const { error } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (error) throw error;

    const platformName = order.order_source.toUpperCase();
    let statusText = 'Hazırlanıyor';
    if (newStatus === 'preparing') statusText = 'Onaylandı (Hazırlanıyor)';
    if (newStatus === 'served') statusText = 'Hazırlandı (Kurye Çağrıldı / Teslim Edildi)';
    if (newStatus === 'paid') statusText = 'Tamamlandı (Teslim Edildi)';
    if (newStatus === 'cancelled') statusText = 'İptal Edildi';

    return {
      success: true,
      message: `${platformName} siparişi durumu "${statusText}" olarak güncellendi.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Durum güncellenirken hata oluştu.',
    };
  }
}
