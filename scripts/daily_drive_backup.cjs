const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        env[key] = value;
      }
    });
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://jphbijgwszlohotouwmy.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_N5N7cQcQ_PkC8oaDWUJRwg_Q0o1HBNg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function sanitizeFolderName(name) {
  if (!name) return 'Bilinmeyen_Isletme';
  return name.replace(/[/\\?%*:|"<>]/g, '_').trim().replace(/\s+/g, '_');
}

async function runDailyOffloadArchive() {
  const now = new Date();
  const year = now.getFullYear().toString();
  const monthNumber = String(now.getMonth() + 1).padStart(2, '0');
  const monthNames = [
    '01-Ocak', '02-Subat', '03-Mart', '04-Nisan', '05-Mayis', '06-Haziran',
    '07-Temmuz', '08-Agustos', '09-Eylul', '10-Ekim', '11-Kasim', '12-Aralik'
  ];
  const monthFolder = monthNames[now.getMonth()];
  const monthKey = `${year}-${monthNumber}`;
  const dateStr = `${year}-${monthNumber}-${String(now.getDate()).padStart(2, '0')}`;

  console.log(`[${new Date().toISOString()}] Supabase Yük Hafifletme & Google Drive Arşivleme Başlatılıyor...`);

  const gDriveRoot = 'G:\\Drive\'ım\\RestivAdisyon_Bulut_Arsivi';
  const oneDriveRoot = 'C:\\Users\\bsehm\\OneDrive\\RestivAdisyon_Bulut_Yedekleri\\Gunluk_Arsiv';

  const targetRoots = [];
  if (fs.existsSync('G:\\')) {
    targetRoots.push(gDriveRoot);
  } else {
    targetRoots.push(oneDriveRoot);
  }

  // 1. Fetch businesses
  const { data: businesses, error: bizErr } = await supabase.from('businesses').select('id, name, phone, slug');
  if (bizErr || !businesses) {
    console.error('İşletmeler çekilemedi:', bizErr?.message);
    return;
  }

  // 2. Fetch heavy data
  const [ordersRes, supportRes, productsRes] = await Promise.all([
    supabase.from('orders').select('*'),
    supabase.from('support_messages').select('*'),
    supabase.from('products').select('id, business_id, name, image_url, price, category_id'),
  ]);

  const allOrders = ordersRes.data || [];
  const allSupport = supportRes.data || [];
  const allProducts = productsRes.data || [];

  for (const biz of businesses) {
    const bizFolderName = `${sanitizeFolderName(biz.name)}_${biz.id.slice(0, 8)}`;
    const bizOrders = allOrders.filter((o) => o.business_id === biz.id);
    const bizSupport = allSupport.filter((m) => m.business_id === biz.id);
    const bizProductsWithImages = allProducts.filter((p) => p.business_id === biz.id && p.image_url);

    // Calculate Ciro & Financial Summary
    const paidOrders = bizOrders.filter((o) => o.status === 'paid');
    const totalTurnover = paidOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
    const cashTurnover = paidOrders.filter((o) => o.payment_method === 'cash').reduce((acc, o) => acc + (o.total_amount || 0), 0);
    const cardTurnover = paidOrders.filter((o) => o.payment_method === 'credit_card' || o.payment_method === 'pos').reduce((acc, o) => acc + (o.total_amount || 0), 0);
    const otherTurnover = paidOrders.filter((o) => o.payment_method === 'other' || o.payment_method === 'online' || o.payment_method === 'bank_transfer').reduce((acc, o) => acc + (o.total_amount || 0), 0);

    // Group orders by date for clean monthly ledger
    const dailyBreakdown = {};
    for (const ord of paidOrders) {
      const d = ord.created_at ? ord.created_at.slice(0, 10) : dateStr;
      if (!dailyBreakdown[d]) {
        dailyBreakdown[d] = { tarih: d, siparis_sayisi: 0, nakit: 0, kart: 0, diger: 0, toplam: 0 };
      }
      dailyBreakdown[d].siparis_sayisi += 1;
      dailyBreakdown[d].toplam += ord.total_amount || 0;
      if (ord.payment_method === 'cash') dailyBreakdown[d].nakit += ord.total_amount || 0;
      else if (ord.payment_method === 'credit_card' || ord.payment_method === 'pos') dailyBreakdown[d].kart += ord.total_amount || 0;
      else dailyBreakdown[d].diger += ord.total_amount || 0;
    }

    // Process each root
    for (const root of targetRoots) {
      const bizDir = path.join(root, 'Isletmeler', bizFolderName);

      // 1. Ciro & Geçmiş Sipariş Aylık Tek Raporu
      const ciroDir = path.join(bizDir, 'Ciro_ve_Gecmis_Siparis_Arsivi', year, monthFolder);
      if (!fs.existsSync(ciroDir)) fs.mkdirSync(ciroDir, { recursive: true });

      const monthlyCiroFile = path.join(ciroDir, `${monthKey}_Aylik_Ciro_ve_Hesap_Raporu.json`);
      const monthlyCiroData = {
        donem: `${monthKey} (${monthFolder} ${year})`,
        isletme_adi: biz.name,
        son_guncelleme: now.toISOString(),
        aylik_genel_toplam_tl: totalTurnover,
        aylik_nakit_toplam_tl: cashTurnover,
        aylik_kart_toplam_tl: cardTurnover,
        aylik_diger_iban_toplam_tl: otherTurnover,
        toplam_kapanan_adisyon: paidOrders.length,
        gun_gun_dokumler: Object.values(dailyBreakdown),
        aylik_tum_adisyon_kayitlari: bizOrders,
      };

      fs.writeFileSync(monthlyCiroFile, JSON.stringify(monthlyCiroData, null, 2), 'utf8');

      // 2. Destek Sohbetleri & Ticket Arşivi (Talebi Kodlu Aylık Döküm)
      const supportDir = path.join(bizDir, 'Destek_Sohbetleri_ve_Gorseller', year, monthFolder);
      if (!fs.existsSync(supportDir)) fs.mkdirSync(supportDir, { recursive: true });

      const monthlySupportFile = path.join(supportDir, `${monthKey}_Aylik_Destek_Gorusmeleri.json`);
      const monthlySupportData = {
        donem: `${monthKey} (${monthFolder} ${year})`,
        isletme_adi: biz.name,
        son_guncelleme: now.toISOString(),
        toplam_destek_mesaji: bizSupport.length,
        talepler: bizSupport.map((m) => {
          const match = m.subject ? m.subject.match(/\[#TKT-\d+\]/) : null;
          const ticketCode = match ? match[0] : `#TKT-${m.id.slice(0, 6).toUpperCase()}`;
          return {
            talep_kodu: ticketCode,
            tarih: m.created_at,
            gonderen: m.sender === 'business' ? 'İşletme' : 'SuperAdmin Destek Masası',
            konu: m.subject || 'Konusuz Bildirim',
            mesaj: m.message,
            gorsel_url: m.image_url || null,
            durum: m.status,
            cozuldu_mu: m.is_resolved,
          };
        }),
      };

      fs.writeFileSync(monthlySupportFile, JSON.stringify(monthlySupportData, null, 2), 'utf8');

      // 3. QR & Ürün Görselleri Kataloğu
      const qrImageDir = path.join(bizDir, 'QR_ve_Urun_Gorselleri');
      if (!fs.existsSync(qrImageDir)) fs.mkdirSync(qrImageDir, { recursive: true });

      fs.writeFileSync(
        path.join(qrImageDir, 'Urun_Gorsel_Katalogu.json'),
        JSON.stringify({
          isletme: biz.name,
          guncelleme_tarihi: now.toISOString(),
          toplam_gorselli_urun: bizProductsWithImages.length,
          gorseller: bizProductsWithImages.map((p) => ({
            urun_adi: p.name,
            fiyat: p.price,
            gorsel_linki: p.image_url,
          })),
        }, null, 2),
        'utf8'
      );
    }
  }

  console.log(`[${new Date().toISOString()}] Aylık konsolide arşivleme 100% Google Drive'a işlendi!`);
}

runDailyOffloadArchive().catch((err) => {
  console.error('Arşivleme hatası:', err);
});
