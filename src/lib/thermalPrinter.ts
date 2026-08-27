import { Order, Business } from '../types';

/**
 * Renders a clean 80mm/58mm thermal receipt window and triggers instant printing.
 * Works seamlessly in browsers, POS terminals, and thermal ESC/POS printers.
 */
export function printThermalReceipt(order: Order, business: Business) {
  const printWindow = window.open('', '_blank', 'width=350,height=600');
  if (!printWindow) {
    alert('Lütfen yazdýrma penceresi için tarayýcý açýlýr pencere (popup) iznini veriniz.');
    return;
  }

  const itemsHtml = order.items
    .map(
      (item) => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px;">
        <span style="flex: 1;">${item.quantity}x ${item.name}${item.notes ? `<br><small style="color: #666;">? ${item.notes}</small>` : ''}</span>
        <span style="font-weight: bold; margin-left: 8px;">${(item.price * item.quantity).toFixed(2)} ?</span>
      </div>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Adisyon - Masa ${order.table_no}</title>
        <style>
          @page { margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            width: 80mm;
            max-width: 100%;
            margin: 0 auto;
            padding: 8px;
            color: #000;
            background: #fff;
            box-sizing: border-box;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .double-divider { border-top: 2px dashed #000; margin: 8px 0; }
          .meta { font-size: 11px; margin-bottom: 4px; }
          .total-box { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin: 8px 0; }
          @media print {
            body { width: 100%; padding: 4px; }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase;">${business.name}</h2>
          ${business.phone ? `<div class="meta">Tel: ${business.phone}</div>` : ''}
          ${business.address ? `<div class="meta">${business.address}</div>` : ''}
        </div>

        <div class="double-divider"></div>

        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold;">
          <span>MASA: ${order.table_no}</span>
          <span>${order.order_source === 'manual_pos' ? 'KASA / POS' : 'QR MENÜ'}</span>
        </div>
        <div class="meta">Tarih: ${new Date(order.created_at).toLocaleString('tr-TR')}</div>
        <div class="meta">Sipariþ No: #${order.id.slice(0, 8).toUpperCase()}</div>

        <div class="divider"></div>

        <div style="margin: 8px 0;">
          ${itemsHtml}
        </div>

        ${order.customer_notes ? `
          <div class="divider"></div>
          <div style="font-size: 12px;"><strong>Müþteri Notu:</strong> ${order.customer_notes}</div>
        ` : ''}

        <div class="double-divider"></div>

        <div class="total-box">
          <span>TOPLAM TUTAR:</span>
          <span>${order.total_amount.toFixed(2)} ?</span>
        </div>

        <div class="meta center" style="margin-top: 12px;">
          Afiyet Olsun!<br>
          <small>Zagroja QR Menü Sistemi</small>
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

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
