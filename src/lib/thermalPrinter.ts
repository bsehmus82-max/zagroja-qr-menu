import { Business, Order, Table } from '../types';

/**
 * 80mm / 58mm ESC/POS Thermal Receipt & Order Ticket Printing Utility
 */
export function printKitchenTicket(business: Business, order: Order) {
  const printWindow = window.open('', '_blank', 'width=350,height=600');
  if (!printWindow) return;

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
          <span>Sipariş No: #${order.id.slice(0, 8)}</span>
          <span>Kaynak: ${order.order_source === 'qr' ? 'QR Menü' : 'POS'}</span>
        </div>
        
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
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * End-of-Day Z-Report Thermal Printing
 */
export function printZReport(
  business: Business,
  orders: Order[],
  total: number,
  cash: number,
  card: number
) {
  const printWindow = window.open('', '_blank', 'width=350,height=600');
  if (!printWindow) return;

  const dateStr = new Date().toLocaleString('tr-TR');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Gün Sonu Z-Raporu</title>
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
        <div class="center" style="font-size: 14px; font-weight: bold; margin-top: 4px;">GÜN SONU Z-RAPORU</div>
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
        
        <div class="double-divider"></div>
        
        <div class="row" style="font-size: 16px; font-weight: 900;">
          <span>GENEL TOPLAM:</span>
          <span>${total.toFixed(2)} ₺</span>
        </div>
        
        <div class="divider"></div>
        <div class="center" style="font-size: 10px; margin-top: 10px;">
          Zagroja QR Menü & Restoran Sistemi
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Print Single Table QR Code
 */
export function printSingleQrCard(business: Business, table: Table) {
  const printWindow = window.open('', '_blank', 'width=400,height=500');
  if (!printWindow) return;

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
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Print Batch Table QR Cards (Full Page Grid)
 */
export function printBatchQrCards(business: Business, tables: Table[]) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;

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
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
