// ==============================================================================
// SUPABASE EDGE FUNCTION: RESTIVADISYON YEMEK PLATFORMLARI WEBHOOK ALICISI
// URL: https://<supabase-project-id>.supabase.co/functions/v1/food-platform-webhook
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-platform-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const platform = url.searchParams.get("platform") || "trendyol";
    const businessSlug = url.searchParams.get("business_slug");
    const merchantId = url.searchParams.get("merchant_id");

    const payload = await req.json();

    // 1. İşletmeyi Bul
    let query = supabase.from("businesses").select("id, name, slug");
    if (businessSlug) {
      query = query.eq("slug", businessSlug);
    }
    const { data: business, error: bizErr } = await query.single();

    if (bizErr || !business) {
      return new Response(
        JSON.stringify({ success: false, error: "Business not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Siparişi Oluştur ve Kaydet
    const externalOrderId = payload?.orderNumber || payload?.code || payload?.id || `#${platform.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`;
    const items = payload?.lines || payload?.products || payload?.items || [
      { name: "Standart Menü", price: Number(payload?.totalPrice || 150), quantity: 1 }
    ];
    const totalAmount = Number(payload?.grossAmount || payload?.totalPrice || payload?.total || 0);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        business_id: business.id,
        table_no: `Paket / ${platform.toUpperCase()}`,
        session_token: `ext_${platform}_${Date.now()}`,
        order_source: platform,
        external_order_id: externalOrderId,
        items: items,
        total_amount: totalAmount,
        status: "pending",
        payment_method: "online",
        customer_notes: payload?.note || `${platform} online siparişi`,
        platform_metadata: {
          platform,
          platform_order_code: externalOrderId,
          customer_name: payload?.customer?.name || "Online Müşteri",
          delivery_address: payload?.deliveryAddress?.fullAddress || "Adres teslimatı",
          courier_status: "assigned",
        },
      })
      .select()
      .single();

    if (orderErr) {
      return new Response(
        JSON.stringify({ success: false, error: orderErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Başarılı 200 OK yanıtı (Platforma siparişin alındığını bildirir)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Order successfully queued in RestivAdisyon",
        restiva_order_id: order.id,
        external_order_id: externalOrderId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
