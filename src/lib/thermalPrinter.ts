import { Business, Order, Table } from '../types';

/**
 * Check and manage Web Auto-Print setting
 */
export function isWebAutoPrintEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('restiva_web_autoprint');
  return saved !== 'false'; // Enabled by default
}

export function setWebAutoPrintEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('restiva_web_autoprint', enabled ? 'true' : 'false');
  }
}

declare global {
  interface Window {
    electronAPI?: {
      printReceipt: (options: {
        html?: string;
        title?: string;
        deviceName?: string;
        silent?: boolean;
      }) => Promise<{ success: boolean; failureReason?: string }>;
    };
  }
}

/**
 * Print HTML directly using Electron Silent Print (Zero-confirmation) or seamless hidden iframe for Web
 */
function printHtmlSilently(htmlContent: string, title = 'Adisyon') {
  if (typeof window !== 'undefined') {
    // 1. Electron POS Shell (Native Zero-confirmation Silent Print)
    if (window.electronAPI?.printReceipt) {
      window.electronAPI
        .printReceipt({ html: htmlContent, title, silent: true })
        .then((result) => {
          if (!result.success) {
            console.warn('Electron silent print notice:', result.failureReason);
          }
        })
        .catch((err) => {
          console.warn('Electron silent print failed, falling back to web iframe:', err);
          fallbackWebIframePrint(htmlContent, title);
        });
      return;
    }
  }

  // 2. Standard Web Browser Fallback (Hidden Iframe)
  fallbackWebIframePrint(htmlContent, title);
}

function fallbackWebIframePrint(htmlContent: string, title: string) {
  if (typeof document === 'undefined') return;

  const existingIframe = document.getElementById('restiva-print-frame');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'restiva-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.setAttribute('title', title);

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Wait for content to render then trigger print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print failed, falling back:', e);
    }
  }, 150);

  // Clean up iframe after printing dialog closes
  setTimeout(() => {
    try {
      iframe.remove();
    } catch {}
  }, 10000);
}

/**
 * 80mm / 58mm ESC/POS Thermal Receipt & Order Ticket Printing Utility
 * Works automatically in Web browsers and desktop environments
 */
export async function printKitchenTicket(business: Business, order: Order, force = false) {
  // Check if auto-print is disabled and not forced manually
  if (!force && !isWebAutoPrintEnabled()) {
    return;
  }

  // 1. Try local Windows Print Bridge Agent if running (http://localhost:9100/print)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600);
    const res = await fetch('http://localhost:9100/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'kitchen_ticket',
        business_name: business.name,
        business_phone: business.phone,
        table_no: order.table_no,
        order_id: order.id,
        order_source: order.order_source,
        items: order.items,
        total_amount: order.total_amount,
        customer_notes: order.customer_notes,
        created_at: order.created_at,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      console.log('Printed silently via Restiva Print Bridge Agent');
      return;
    }
  } catch {
    // Local bridge agent not running, proceed to web hidden iframe printing
  }

  const dateStr = new Date(order.created_at).toLocaleString('tr-TR');

  const itemsHtml = order.items
    .map(
      (item) => `
      <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-bottom: 4px;">
        <span>${item.quantity}x ${item.name}</span>
        <span>${(item.price * item.quantity).toFixed(2)} ₺</span>
      </div>
      ${item.notes ? `<div style="font-size: 11px; font-style: italic; margin-bottom: 6px; padding-left: 8px;">* ${item.notes}</div>` : ''}
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Adisyon Fişi - ${order.table_no}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 76mm;
            margin: 0 auto;
            padding: 8px;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .double-divider { border-top: 2px solid #000; margin: 8px 0; }
          .header { font-size: 16px; font-weight: bold; }
          .table-header { font-size: 20px; font-weight: 900; margin: 6px 0; padding: 4px; border: 2px solid #000; }
          .total { font-size: 16px; font-weight: 900; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="center header">${business.name}</div>
        <div class="center" style="font-size: 11px;">${business.phone || ''}</div>
        <div class="divider"></div>
        
        <div class="center table-header">${order.table_no}</div>
        
        <div style="font-size: 11px; display: flex; justify-content: space-between;">
          <span>Tarih: ${dateStr}</span>
        </div>
        <div style="font-size: 11px; display: flex; justify-content: space-between;">
          <span>Sipariş No: ${order.external_order_id || '#' + order.id.slice(0, 8)}</span>
          <span>Kaynak: ${
            order.order_source === 'qr'
              ? 'QR Menü'
              : order.order_source === 'pos'
              ? 'Kasa POS'
              : order.order_source === 'waiter'
              ? 'Garson'
              : order.order_source === 'trendyol'
              ? 'Trendyol Yemek'
              : order.order_source === 'yemeksepeti'
              ? 'Yemeksepeti'
              : order.order_source === 'getir'
              ? 'GetirYemek'
              : 'Migros Yemek'
          }</span>
        </div>

        ${order.platform_metadata ? `
          <div class="divider"></div>
          <div style="font-size: 12px; font-weight: bold;">MÜŞTERİ: ${order.platform_metadata.customer_name || ''}</div>
          ${order.platform_metadata.customer_phone ? `<div style="font-size: 11px;">TEL: ${order.platform_metadata.customer_phone}</div>` : ''}
          ${order.platform_metadata.delivery_address ? `<div style="font-size: 11px; font-weight: bold; margin-top: 2px;">ADRES: ${order.platform_metadata.delivery_address}</div>` : ''}
          ${order.platform_metadata.courier_name ? `<div style="font-size: 10px; margin-top: 2px;">KURYE: ${order.platform_metadata.courier_name}</div>` : ''}
        ` : ''}
        
        <div class="divider"></div>
        
        <div>
          ${itemsHtml}
        </div>
        
        ${order.customer_notes ? `
          <div class="divider"></div>
          <div style="font-size: 12px; font-weight: bold;">
            MÜŞTERİ NOTU: ${order.customer_notes}
          </div>
        ` : ''}
        
        <div class="double-divider"></div>
        
        <div class="total">
          <span>TOPLAM TUTAR:</span>
          <span>${order.total_amount.toFixed(2)} ₺</span>
        </div>
        
        <div class="center" style="font-size: 11px; margin-top: 12px;">
          * Afiyet Olsun *
        </div>
      </body>
    </html>
  `;

  // Print via seamless hidden iframe
  printHtmlSilently(html, `Adisyon - ${order.table_no}`);
}

/**
 * End-of-Day Z-Report Thermal Printing
 */
export function printZReport(
  business: Business,
  orders: Order[],
  total: number,
  cash: number,
  card: number,
  other: number = 0
) {
  const dateStr = new Date().toLocaleString('tr-TR');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Gün Sonu Kasa Raporu</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 76mm;
            margin: 0 auto;
            padding: 8px;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .double-divider { border-top: 2px solid #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="center" style="font-size: 18px; font-weight: 900;">${business.name}</div>
        <div class="center" style="font-size: 14px; font-weight: bold; margin-top: 4px;">GÜN SONU KASA RAPORU</div>
        <div class="center" style="font-size: 11px;">Tarih: ${dateStr}</div>
        <div class="double-divider"></div>
        
        <div class="row">
          <span>Toplam Adisyon:</span>
          <span class="bold">${orders.length} Adet</span>
        </div>
        <div class="divider"></div>
        
        <div class="row">
          <span>Nakit Tahsilat:</span>
          <span class="bold">${cash.toFixed(2)} ₺</span>
        </div>
        
        <div class="row">
          <span>Kredi Kartı / POS:</span>
          <span class="bold">${card.toFixed(2)} ₺</span>
        </div>

        <div class="row">
          <span>Diğer (IBAN / Havale):</span>
          <span class="bold">${other.toFixed(2)} ₺</span>
        </div>
        
        <div class="double-divider"></div>
        
        <div class="row" style="font-size: 16px; font-weight: 900;">
          <span>GENEL TOPLAM:</span>
          <span>${total.toFixed(2)} ₺</span>
        </div>
      </body>
    </html>
  `;

  printHtmlSilently(html, 'Gün Sonu Kasa Raporu');
}

/**
 * Print Single Table QR Code
 */
export function printSingleQrCard(business: Business, table: Table) {
  const tableUrl = `${window.location.origin}/m/${business.slug}?table=${encodeURIComponent(table.table_no)}&token=${table.qr_token}`;
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(tableUrl)}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Masa QR - ${table.table_no}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            width: 76mm;
            margin: 0 auto;
            padding: 12px;
            text-align: center;
            color: #000;
          }
          .title { font-size: 16px; font-weight: 900; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
          .table-no { font-size: 22px; font-weight: 900; margin: 10px 0; border: 2px solid #000; border-radius: 8px; padding: 4px; }
          .desc { font-size: 11px; margin-top: 8px; font-weight: 600; color: #333; }
        </style>
      </head>
      <body>
        <div class="title">${business.name}</div>
        <div class="table-no">${table.table_no}</div>
        <img src="${qrSvgUrl}" width="200" height="200" style="margin: 6px auto; border-radius: 12px;" />
        <div class="desc">Kameranızla QR Kodu Okutarak Menüyü İnceleyebilir ve Sipariş Verebilirsiniz.</div>
      </body>
    </html>
  `;

  printHtmlSilently(html, `Masa QR - ${table.table_no}`);
}

/**
 * Print Batch Table QR Cards (Full Page Grid)
 */
export function printBatchQrCards(business: Business, tables: Table[]) {
  const cardsHtml = tables
    .map((table) => {
      const tableUrl = `${window.location.origin}/m/${business.slug}?table=${encodeURIComponent(table.table_no)}&token=${table.qr_token}`;
      const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(tableUrl)}`;

      return `
      <div class="card">
        <div class="biz-name">${business.name}</div>
        <div class="table-badge">${table.table_no}</div>
        <img src="${qrSvgUrl}" width="160" height="160" class="qr-img" />
        <div class="instructions">Menü & Sipariş İçin Okutunuz</div>
      </div>
    `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${business.name} - Toplu Masa QR Kartları</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            color: #000;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
          }
          .card {
            border: 2px dashed #333;
            border-radius: 16px;
            padding: 16px 12px;
            text-align: center;
            page-break-inside: avoid;
            background: #fff;
          }
          .biz-name { font-size: 14px; font-weight: 900; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
          .table-badge { font-size: 18px; font-weight: 900; margin-bottom: 8px; background: #000; color: #fff; padding: 4px 8px; border-radius: 6px; display: inline-block; }
          .qr-img { margin: 4px auto; border-radius: 8px; }
          .instructions { font-size: 10px; font-weight: bold; margin-top: 6px; color: #555; }
        </style>
      </head>
      <body>
        <div class="grid">
          ${cardsHtml}
        </div>
      </body>
    </html>
  `;

  printHtmlSilently(html, `${business.name} - Toplu Masa QR Kartları`);
}
