import sys
import os
import json
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

PORT = 9100

def send_to_windows_printer(text_content):
    """
    Sends raw thermal text directly to default Windows printer via PowerShell Out-Printer
    without any popup dialogs.
    """
    try:
        temp_file = os.path.join(os.environ.get("TEMP", "."), "restiva_ticket.txt")
        with open(temp_file, "w", encoding="utf-8") as f:
            f.write(text_content)
        
        cmd = f'Get-Content -Path "{temp_file}" -Raw | Out-Printer'
        subprocess.run(["powershell", "-Command", cmd], capture_output=True, text=True)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Fiş başarıyla varsayılan yazıcıya gönderildi.")
        return True
    except Exception as e:
        print(f"[HATA] Yazıcıya gönderilemedi: {e}")
        return False

class PrintBridgeHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self._set_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        response = {
            "status": "online",
            "service": "Restiva Thermal Print Bridge",
            "port": PORT,
            "time": datetime.now().isoformat()
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def do_POST(self):
        if self.path == '/print':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Format 80mm Thermal Receipt Text
                b_name = data.get('business_name', 'RESTIVA ADİSYON')
                b_phone = data.get('business_phone', '')
                table_no = data.get('table_no', 'MASA')
                order_id = str(data.get('order_id', ''))[:8]
                items = data.get('items', [])
                total = data.get('total_amount', 0.0)
                notes = data.get('customer_notes', '')
                time_str = datetime.now().strftime('%d.%m.%Y %H:%M:%S')
                
                ticket = []
                ticket.append("================================")
                ticket.append(f"       {b_name.upper()}       ")
                if b_phone:
                    ticket.append(f"       Tel: {b_phone}       ")
                ticket.append("--------------------------------")
                ticket.append(f"  >>>  {table_no.upper()}  <<<  ")
                ticket.append(f"Tarih: {time_str}")
                ticket.append(f"Sipariş No: #{order_id}")
                ticket.append("--------------------------------")
                ticket.append("ÜRÜN                   ADET  TUTAR")
                ticket.append("--------------------------------")
                
                for item in items:
                    name = item.get('name', 'Ürün')[:18].ljust(18)
                    qty = str(item.get('quantity', 1)).rjust(3)
                    p = f"{(item.get('price', 0) * item.get('quantity', 1)):.2f} TL".rjust(9)
                    ticket.append(f"{name} {qty} {p}")
                    if item.get('notes'):
                        ticket.append(f" * Not: {item.get('notes')}")
                
                if notes:
                    ticket.append("--------------------------------")
                    ticket.append(f"MÜŞTERİ NOTU: {notes}")
                
                ticket.append("================================")
                ticket.append(f"TOPLAM TUTAR:        {total:.2f} TL")
                ticket.append("================================")
                ticket.append("\n\n\n") # feed lines
                
                ticket_text = "\n".join(ticket)
                success = send_to_windows_printer(ticket_text)
                
                self.send_response(200 if success else 500)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": success}).encode('utf-8'))
                
            except Exception as e:
                self.send_response(400)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

def run_server():
    server_address = ('127.0.0.1', PORT)
    httpd = HTTPServer(server_address, PrintBridgeHandler)
    print("==================================================")
    print("      RESTIVA ADİSYON OTOMATİK YAZICI KÖPRÜSÜ     ")
    print(f"  Servis 127.0.0.1:{PORT} portunda arka planda aktif! ")
    print("  Yeni sipariş geldiğinde fiş otomatik basılacak.   ")
    print("==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServis kapatıldı.")

if __name__ == '__main__':
    run_server()
