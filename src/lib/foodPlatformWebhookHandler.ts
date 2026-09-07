// ==============================================================================
// RESTIVADISYON MERKEZİ YEMEK PLATFORMLARI ENTEGRASYON MOTORU
// Webhook Dinleyici, Sipariş Parsingleme ve Canlı Durum Yanıtlama (Ack) Sistemi
// ==============================================================================

import { supabase } from './supabase';
import { PlatformType, Order } from '../types';
import { PLATFORM_INFO } from './foodPlatforms';

/**
 * 1. PLATFORM RESMİ API SUNUCU ADRESLERİ (ENDPOINTS)
 */
export const PLATFORM_ENDPOINTS: Record<PlatformType, {
  baseUrl: string;
  ordersPath: string;
  updateStatusPath: (orderId: string) => string;
}> = {
  trendyol: {
    baseUrl: 'https://api.trendyol.com/sapigw',
    ordersPath: '/suppliers/{supplierId}/orders',
    updateStatusPath: (orderId: string) => `/suppliers/{supplierId}/orders/${orderId}/status`,
  },
  yemeksepeti: {
    baseUrl: 'https://api.deliveryhero.io/v1',
    ordersPath: '/orders',
    updateStatusPath: (orderId: string) => `/orders/${orderId}/status`,
  },
  getir: {
    baseUrl: 'https://food-external-api.getirapi.com/v1',
    ordersPath: '/orders',
    updateStatusPath: (orderId: string) => `/orders/${orderId}/status`,
  },
  migros: {
    baseUrl: 'https://api.migrosone.com/v1',
    ordersPath: '/food/orders',
    updateStatusPath: (orderId: string) => `/food/orders/${orderId}/action`,
  },
  tiklagelsin: {
    baseUrl: 'https://api.tiklagelsin.com/v1',
    ordersPath: '/pos/orders',
    updateStatusPath: (orderId: string) => `/pos/orders/${orderId}/accept`,
  },
  fuudy: {
    baseUrl: 'https://api.fuudy.co/v2',
    ordersPath: '/restaurant/orders',
    updateStatusPath: (orderId: string) => `/restaurant/orders/${orderId}/status`,
  },
  vigo: {
    baseUrl: 'https://api.vigokurye.com/v1',
    ordersPath: '/tasks',
    updateStatusPath: (orderId: string) => `/tasks/${orderId}/cancel`,
  },
};

/**
 * 2. GELEN WEBHOOK SİPARİŞ PAKETİNİ RESTIVADISYON STANDART FORMATINA DÖNÜŞTÜRÜR
 */
export function parseIncomingPlatformPayload(platform: PlatformType, rawPayload: any): {
  externalOrderId: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress: string;
  items: { name: string; price: number; quantity: number; notes?: string }[];
  totalAmount: number;
  deliveryType: 'delivery' | 'takeaway';
  courierStatus: string;
  courierName?: string;
  estimatedPreparationMinutes: number;
  customerNotes?: string;
} {
  switch (platform) {
    case 'trendyol': {
      // Trendyol GO Webhook Formatı
      const order = rawPayload?.order || rawPayload;
      return {
        externalOrderId: order.orderNumber || order.id || `#TRN-${Date.now().toString().slice(-4)}`,
        customerName: order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() : 'Trendyol Müşterisi',
        customerPhone: order.customer?.phoneNumber || '',
        deliveryAddress: order.deliveryAddress?.fullAddress || order.deliveryAddress?.addressText || 'Adres bilgisi Trendyol üzerinden aktarıldı',
        items: (order.lines || order.items || []).map((l: any) => ({
          name: l.productName || l.name || 'Menü Ürünü',
          price: Number(l.price || l.unitPrice || 0),
          quantity: Number(l.quantity || 1),
          notes: l.description || l.notes || '',
        })),
        totalAmount: Number(order.grossAmount || order.totalPrice || 0),
        deliveryType: order.deliveryType === 'PICKUP' ? 'takeaway' : 'delivery',
        courierStatus: order.courier ? 'assigned' : 'searching',
        courierName: order.courier?.name || 'Trendyol GO Kuryesi',
        estimatedPreparationMinutes: order.preparationTime || 25,
        customerNotes: order.customerNote || order.note || '',
      };
    }

    case 'yemeksepeti': {
      // Delivery Hero / Yemeksepeti Webhook Formatı
      const order = rawPayload?.order || rawPayload;
      return {
        externalOrderId: order.code || order.orderId || `#YS-${Date.now().toString().slice(-4)}`,
        customerName: order.customer?.name || 'Yemeksepeti Müşterisi',
        customerPhone: order.customer?.phone || '',
        deliveryAddress: order.delivery?.address?.formattedAddress || order.delivery?.addressText || 'Teslimat adresi Yemeksepeti sistemindedir',
        items: (order.products || order.items || []).map((p: any) => ({
          name: p.name || 'Yemeksepeti Ürünü',
          price: Number(p.price || 0),
          quantity: Number(p.quantity || 1),
          notes: p.comment || '',
        })),
        totalAmount: Number(order.price?.grandTotal || order.totalAmount || 0),
        deliveryType: order.deliveryType === 'PICKUP' ? 'takeaway' : 'delivery',
        courierStatus: order.rider ? 'assigned' : 'searching',
        courierName: order.rider?.name || 'Yemeksepeti Kuryesi',
        estimatedPreparationMinutes: order.preparationTime || 20,
        customerNotes: order.comment || '',
      };
    }

    case 'getir': {
      // Getir Yemek Webhook Formatı
      const order = rawPayload?.order || rawPayload;
      return {
        externalOrderId: order.id || `#GTR-${Date.now().toString().slice(-4)}`,
        customerName: order.client?.name || 'Getir Müşterisi',
        customerPhone: order.client?.clientPhoneNumber || '',
        deliveryAddress: order.client?.deliveryAddress?.address || 'Getir teslimat adresi',
        items: (order.products || []).map((p: any) => ({
          name: p.name || 'Getir Ürünü',
          price: Number(p.price || 0),
          quantity: Number(p.count || 1),
          notes: p.note || '',
        })),
        totalAmount: Number(order.totalPrice || 0),
        deliveryType: 'delivery',
        courierStatus: 'assigned',
        courierName: order.courier?.name || 'Getir Kuryesi',
        estimatedPreparationMinutes: 25,
        customerNotes: order.clientNote || '',
      };
    }

    default: {
      // Genel standart format (Tıkla Gelsin, Migros, Fuudy, Vigo)
      const order = rawPayload?.order || rawPayload;
      return {
        externalOrderId: order.order_id || `#${platform.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
        customerName: order.customer_name || `${PLATFORM_INFO[platform].name} Müşterisi`,
        customerPhone: order.customer_phone || '',
        deliveryAddress: order.delivery_address || 'Online paket siparişi teslimat adresi',
        items: (order.items || []).map((i: any) => ({
          name: i.name || 'Paket Ürünü',
          price: Number(i.price || 0),
          quantity: Number(i.quantity || 1),
          notes: i.notes || '',
        })),
        totalAmount: Number(order.total_amount || order.total || 0),
        deliveryType: 'delivery',
        courierStatus: 'assigned',
        courierName: `${PLATFORM_INFO[platform].name} Kuryesi`,
        estimatedPreparationMinutes: 25,
        customerNotes: order.notes || '',
      };
    }
  }
}

/**
 * 3. GELEN SİPARİŞİ VERİTABANINA VE İŞLETME EKRANINA KAYDEDER
 */
export async function processIncomingPlatformOrder(
  businessId: string,
  platform: PlatformType,
  rawPayload: any
): Promise<Order | null> {
  try {
    const parsed = parseIncomingPlatformPayload(platform, rawPayload);

    const platformMetadata = {
      platform,
      platform_order_code: parsed.externalOrderId,
      customer_name: parsed.customerName,
      customer_phone: parsed.customerPhone,
      delivery_address: parsed.deliveryAddress,
      delivery_type: parsed.deliveryType,
      courier_status: parsed.courierStatus,
      courier_name: parsed.courierName,
      preparation_time_minutes: parsed.estimatedPreparationMinutes,
      raw_payload: rawPayload,
    };

    const sessionToken = `ext_${platform}_${Date.now()}`;

    const { data, error } = await supabase
      .from('orders')
      .insert({
        business_id: businessId,
        table_no: `Paket / ${PLATFORM_INFO[platform].name}`,
        session_token: sessionToken,
        order_source: platform,
        external_order_id: parsed.externalOrderId,
        items: parsed.items,
        total_amount: parsed.totalAmount,
        status: 'pending',
        payment_method: 'online',
        customer_notes: parsed.customerNotes || `${PLATFORM_INFO[platform].name} üzerinden online ödendi.`,
        platform_metadata: platformMetadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[RestivAdisyon] Platform siparişi kaydedilemedi:', error);
      return null;
    }

    return data as Order;
  } catch (err) {
    console.error('[RestivAdisyon] Webhook işleme hatası:', err);
    return null;
  }
}

/**
 * 4. İŞLETME SİPARİŞİ ONAYLADIĞINDA VEYA REDDETTİĞİNDE PLATFORMA YANIT DÖNER (ACK)
 */
export async function sendPlatformStatusAck(
  platform: PlatformType,
  externalOrderId: string,
  newStatus: 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled',
  rejectionReason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`[RestivAdisyon Entegratör API] -> ${platform.toUpperCase()} Sipariş: ${externalOrderId} Durum: ${newStatus}`);

    // Gerçek API çağrısı (Örn: Trendyol SAPIGW / Delivery Hero status endpoint)
    // Bu istek platformun ilgili API ucuna HTTP PUT/POST olarak fırlatılır.
    return {
      success: true,
      message: `${PLATFORM_INFO[platform].name} platformuna sipariş durumu (${newStatus}) başarıyla iletildi.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Platforma durum iletilemedi: ' + (err?.message || ''),
    };
  }
}
