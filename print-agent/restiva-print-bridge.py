# -*- coding: utf-8 -*-
"""
RESTIVA ADİSYON - 7/24 OTOMATİK TERMAL YAZICI KÖPRÜSÜ
Tarayıcı kapalı olsa bile Supabase bulut veritabanını arka planda dinler,
yeni sipariş düştüğü an sesi çalar ve fişi termal yazıcıdan otomatik basar.
"""

import sys
import os
import time
import json
import threading
import subprocess
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

# Windows Sound Support
try:
    import winsound
    HAS_WINSOUND = True
except ImportError:
    HAS_WINSOUND = False

# Supabase Credentials
SUPABASE_URL = "https://jphbijgwszlohotouwmy.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_N5N7cQcQ_PkC8oaDWUJRwg_Q0o1HBNg"
HTTP_PORT = 9100

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
PRINTED_CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "printed_orders.json")

# In-memory printed order IDs cache to prevent double-printing
PRINTED_ORDERS = set()

def load_printed_cache():
    global PRINTED_ORDERS
    if os.path.exists(PRINTED_CACHE_FILE):
        try:
            with open(PRINTED_CACHE_FILE, "r", encoding="utf-8") as f:
                PRINTED_ORDERS = set(json.load(f))
        except Exception:
            PRINTED_ORDERS = set()

def save_printed_cache():
    try:
        # Keep last 500 orders
        recent = list(PRINTED_ORDERS)[-500:]
        with open(PRINTED_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(recent, f)
    except Exception as e:
        print(f"[CACHE HATA] {e}")

def play_order_sound():
    if HAS_WINSOUND:
        try:
            winsound.Beep(1400, 250)
            time.sleep(0.08)
            winsound.Beep(1800, 350)
        except Exception:
            pass

def send_to_windows_printer(text_content):
    """
    Sends raw thermal ticket directly to default Windows Thermal Printer
    without any popup dialogs.
    """
    try:
        temp_file = os.path.join(os.environ.get("TEMP", "."), "restiva_auto_ticket.txt")
        with open(temp_file, "w", encoding="utf-8") as f:
            f.write(text_content)
        
        cmd = f'Get-Content -Path "{temp_file}" -Raw | Out-Printer'
        proc = subprocess.run(["powershell", "-Command", cmd], capture_output=True, text=True)
        if proc.returncode == 0:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] >>> FİŞ YAZICIYA GÖNDERİLDİ! <<<")
            return True
        else:
            print(f"[YAZICI UYARI] PowerShell Çıktısı: {proc.stderr}")
            return False
    except Exception as e:
        print(f"[YAZICI HATA] {e}")
        return False

def format_ticket(b_name, b_phone, table_no, order_id, items, total, notes, source="QR Menü"):
    time_str = datetime.now().strftime("%d.%m.%Y %H:%M:%S")
    ticket = []
    ticket.append("================================")
    ticket.append(f"       {b_name.upper()}       ")
    if b_phone:
        ticket.append(f"       Tel: {b_phone}       ")
    ticket.append("--------------------------------")
    ticket.append(f"  >>>  {table_no.upper()}  <<<  ")
    ticket.append(f"Tarih: {time_str}")
    ticket.append(f"Sipariş No: #{str(order_id)[:8]}")
    ticket.append(f"Kaynak: {source}")
    ticket.append("--------------------------------")
    ticket.append("ÜRÜN                   ADET  TUTAR")
    ticket.append("--------------------------------")
    
    for item in items:
        name = item.get("name", "Ürün")[:18].ljust(18)
        qty = str(item.get("quantity", 1)).rjust(3)
        price_val = item.get("price", 0) * item.get("quantity", 1)
        p = f"{price_val:.2f} TL".rjust(9)
        ticket.append(f"{name} {qty} {p}")
        if item.get("notes"):
            ticket.append(f" * Not: {item.get('notes')}")
    
    if notes:
        ticket.append("--------------------------------")
        ticket.append(f"MÜŞTERİ NOTU: {notes}")
    
    ticket.append("================================")
    ticket.append(f"TOPLAM TUTAR:        {total:.2f} TL")
    ticket.append("================================")
    ticket.append("\n\n\n") # feed cut
    return "\n".join(ticket)

def get_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return None

def setup_config():
    print("\n--- RESTIVA ADİSYON YAPILANDIRMASI ---")
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
    }
    url = f"{SUPABASE_URL}/rest/v1/businesses?select=id,name,slug,phone"
    req = urllib.request.Request(url, headers=headers)
    businesses = []
    try:
        with urllib.request.urlopen(req) as resp:
            businesses = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"İşletmeler çekilemedi: {e}")
    
    if not businesses:
        b_id = input("İşletme ID'nizi girin: ").strip()
        cfg = {"business_id": b_id, "business_name": "RESTIVA", "business_phone": ""}
    elif len(businesses) == 1:
        cfg = {
            "business_id": businesses[0]["id"],
            "business_name": businesses[0]["name"],
            "business_phone": businesses[0].get("phone", "")
        }
        print(f"-> Otomatik Seçilen İşletme: {cfg['business_name']} ({cfg['business_id']})")
    else:
        print("\nSistemdeki İşletmeler:")
        for idx, b in enumerate(businesses):
            print(f"[{idx + 1}] {b['name']} (Slug: {b['slug']})")
        choice = input("Lütfen numarasını seçin (Örn: 1): ").strip()
        try:
            sel = businesses[int(choice) - 1]
            cfg = {
                "business_id": sel["id"],
                "business_name": sel["name"],
                "business_phone": sel.get("phone", "")
            }
        except Exception:
            cfg = {
                "business_id": businesses[0]["id"],
                "business_name": businesses[0]["name"],
                "business_phone": businesses[0].get("phone", "")
            }

    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)
    return cfg

def cloud_listener_loop(config):
    """
    Background worker that monitors Supabase for new orders 24/7 without a browser.
    """
    b_id = config["business_id"]
    b_name = config.get("business_name", "Restiva")
    b_phone = config.get("business_phone", "")
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
    }

    # Initial priming: fetch existing orders so we don't print historical orders on first startup
    init_url = f"{SUPABASE_URL}/rest/v1/orders?business_id=eq.{b_id}&order=created_at.desc&limit=30"
    try:
        req = urllib.request.Request(init_url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            orders = json.loads(resp.read().decode("utf-8"))
            for o in orders:
                PRINTED_ORDERS.add(o["id"])
            save_printed_cache()
            print(f"[BAŞLANGIÇ] {len(orders)} geçmiş sipariş hafızaya alındı (yeniden basılmayacak).")
    except Exception as e:
        print(f"[BAŞLANGIÇ UYARI] {e}")

    print(f"[*] 7/24 Bulut Dinleme Aktif: {b_name} işletmesi dinleniyor...\n")

    while True:
        try:
            url = f"{SUPABASE_URL}/rest/v1/orders?business_id=eq.{b_id}&order=created_at.desc&limit=10"
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as resp:
                orders = json.loads(resp.read().decode("utf-8"))
                
                # Check for new unprinted orders (process oldest new order first)
                new_orders = [o for o in reversed(orders) if o["id"] not in PRINTED_ORDERS]
                
                for order in new_orders:
                    PRINTED_ORDERS.add(order["id"])
                    save_printed_cache()
                    
                    print("\n" + "="*45)
                    print(f"[YENİ SİPARİŞ!] Masa: {order.get('table_no')} - Tutar: {order.get('total_amount')} TL")
                    print(f"Zaman: {datetime.now().strftime('%H:%M:%S')}")
                    print("="*45)
                    
                    play_order_sound()
                    
                    ticket_text = format_ticket(
                        b_name=b_name,
                        b_phone=b_phone,
                        table_no=order.get("table_no", "MASA"),
                        order_id=order.get("id", ""),
                        items=order.get("items", []),
                        total=float(order.get("total_amount", 0.0)),
                        notes=order.get("customer_notes", ""),
                        source="QR Menü" if order.get("order_source") == "qr" else "POS"
                    )
                    
                    send_to_windows_printer(ticket_text)
                    
        except Exception as e:
            # Silent connection retry
            pass
            
        time.sleep(2.0)

class LocalHttpHandler(BaseHTTPRequestHandler):
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
        self.wfile.write(json.dumps({"status": "online", "port": HTTP_PORT}).encode("utf-8"))

    def do_POST(self):
        if self.path == '/print':
            length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                order_id = data.get("order_id")
                if order_id:
                    PRINTED_ORDERS.add(order_id)
                    save_printed_cache()

                play_order_sound()
                ticket_text = format_ticket(
                    b_name=data.get("business_name", "RESTIVA"),
                    b_phone=data.get("business_phone", ""),
                    table_no=data.get("table_no", "MASA"),
                    order_id=order_id or "MANUEL",
                    items=data.get("items", []),
                    total=float(data.get("total_amount", 0.0)),
                    notes=data.get("customer_notes", ""),
                    source=data.get("order_source", "Web")
                )
                success = send_to_windows_printer(ticket_text)
                
                self.send_response(200 if success else 500)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": success}).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

def main():
    print("="*60)
    print("      RESTIVA ADİSYON - 7/24 OTOMATİK YAZICI KÖPRÜSÜ      ")
    print("      (Tarayıcı Kapalı Olsa Bile Fişi Otomatik Basar)     ")
    print("="*60)
    
    load_printed_cache()
    
    config = get_config()
    if not config:
        config = setup_config()
    else:
        print(f"[*] İşletme: {config.get('business_name')} (ID: {config.get('business_id')})")

    # Start Cloud Background Poller Thread (Zero Browser)
    cloud_thread = threading.Thread(target=cloud_listener_loop, args=(config,), daemon=True)
    cloud_thread.start()

    # Start Local HTTP Fast-Track Server
    try:
        httpd = HTTPServer(('127.0.0.1', HTTP_PORT), LocalHttpHandler)
        print(f"[*] Yerel Hızlı Köprü (127.0.0.1:{HTTP_PORT}) hazır.")
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServis durduruldu.")

if __name__ == '__main__':
    main()
