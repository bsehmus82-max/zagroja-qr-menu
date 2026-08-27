# -*- coding: utf-8 -*-
"""
RESTIVA ADİSYON - 7/24 REALTIME TERMAL YAZICI SERVİSİ
- Windows RAW Spooler (ESC/POS) + CP857 Türkçe Karakter Seti + Otomatik Kağıt Kesme (\x1d\x56\x00)
- Supabase Realtime WebSocket Dinleyicisi (Sıfır gecikmeli anlık bildirim ve yazdırma)
- PowerShell Bağımlılığı Olmayan Saf Donanım Sinyali
"""

import sys
import os
import json
import time
import threading
import ctypes
from ctypes import wintypes
import urllib.request
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import websocket

# Windows Sound Support
try:
    import winsound
    HAS_WINSOUND = True
except ImportError:
    HAS_WINSOUND = False

SUPABASE_URL = "https://jphbijgwszlohotouwmy.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_N5N7cQcQ_PkC8oaDWUJRwg_Q0o1HBNg"
WS_URL = f"wss://jphbijgwszlohotouwmy.supabase.co/realtime/v1/websocket?apikey={SUPABASE_ANON_KEY}&vsn=1.0.0"
HTTP_PORT = 9100

APP_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(APP_DIR, "config.json")
PRINTED_CACHE_FILE = os.path.join(APP_DIR, "printed_orders.json")

PRINTED_ORDERS = set()

class DOC_INFO_1(ctypes.Structure):
    _fields_ = [
        ("pDocName", wintypes.LPWSTR),
        ("pOutputFile", wintypes.LPWSTR),
        ("pDatatype", wintypes.LPWSTR)
    ]

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
        recent = list(PRINTED_ORDERS)[-500:]
        with open(PRINTED_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(recent, f)
    except Exception:
        pass

def get_default_printer_name():
    try:
        winspool = ctypes.WinDLL("winspool.drv")
        buf_size = wintypes.DWORD(0)
        winspool.GetDefaultPrinterW(None, ctypes.byref(buf_size))
        if buf_size.value > 0:
            buf = ctypes.create_unicode_buffer(buf_size.value)
            if winspool.GetDefaultPrinterW(buf, ctypes.byref(buf_size)):
                return buf.value
    except Exception:
        pass
    return None

def send_raw_escpos(printer_name, raw_bytes):
    target_printer = printer_name
    if not target_printer or target_printer == "(Varsayılan Windows Yazıcısı)":
        target_printer = get_default_printer_name()
        
    if not target_printer:
        return False, "Sistemde varsayılan yazıcı bulunamadı."

    winspool = ctypes.WinDLL("winspool.drv")
    p_handle = wintypes.HANDLE()
    if not winspool.OpenPrinterW(target_printer, ctypes.byref(p_handle), None):
        return False, f"Yazıcı açılamadı: {target_printer}"
        
    try:
        doc_info = DOC_INFO_1("Restiva Adisyon Fisi", None, "RAW")
        if not winspool.StartDocPrinterW(p_handle, 1, ctypes.byref(doc_info)):
            return False, "StartDocPrinterW başarısız."
        try:
            if not winspool.StartPagePrinter(p_handle):
                return False, "StartPagePrinter başarısız."
            written = wintypes.DWORD(0)
            winspool.WritePrinter(p_handle, raw_bytes, len(raw_bytes), ctypes.byref(written))
            winspool.EndPagePrinter(p_handle)
        finally:
            winspool.EndDocPrinter(p_handle)
    finally:
        winspool.ClosePrinter(p_handle)
    return True, "Success"

def build_escpos_ticket(b_name, b_phone, table_no, order_id, items, total, notes, source="QR Menü"):
    time_str = datetime.now().strftime("%d.%m.%Y %H:%M:%S")
    buf = bytearray()
    
    # 1. ESC @ : Initialize printer
    buf.extend(b'\x1b\x40')
    
    # 2. ESC t 18 : Select Code Page CP857 (Turkish)
    buf.extend(b'\x1b\x74\x12')
    
    def add_line(text, align="left", bold=False, double_size=False):
        if align == "center":
            buf.extend(b'\x1b\x61\x01')
        elif align == "right":
            buf.extend(b'\x1b\x61\x02')
        else:
            buf.extend(b'\x1b\x61\x00')
            
        buf.extend(b'\x1b\x45\x01' if bold else b'\x1b\x45\x00')
        buf.extend(b'\x1d\x21\x11' if double_size else b'\x1d\x21\x00')
        
        try:
            encoded = text.encode('cp857', errors='replace')
        except Exception:
            encoded = text.encode('utf-8', errors='replace')
        buf.extend(encoded + b'\n')

    # Header
    add_line("================================", align="center")
    add_line(b_name.upper(), align="center", bold=True)
    if b_phone:
        add_line(f"Tel: {b_phone}", align="center")
    add_line("--------------------------------", align="center")
    
    # Table & Order
    add_line(f">>> {table_no.upper()} <<<", align="center", bold=True, double_size=True)
    add_line(f"Tarih: {time_str}", align="left")
    add_line(f"Siparis No: #{str(order_id)[:8]}", align="left")
    add_line(f"Kaynak: {source}", align="left")
    add_line("--------------------------------", align="left")
    
    # Items
    add_line("ÜRÜN              ADET     TUTAR", align="left", bold=True)
    add_line("--------------------------------", align="left")
    
    for item in items:
        name = item.get("name", "Ürün")[:16].ljust(16)
        qty = str(item.get("quantity", 1)).rjust(3)
        price_val = float(item.get("price", 0)) * int(item.get("quantity", 1))
        p = f"{price_val:.2f} TL".rjust(9)
        add_line(f"{name} {qty} {p}", align="left")
        if item.get("notes"):
            add_line(f" * Not: {item.get('notes')}", align="left")
            
    if notes:
        add_line("--------------------------------", align="left")
        add_line(f"MÜŞTERİ NOTU: {notes}", align="left", bold=True)
        
    add_line("================================", align="center")
    add_line(f"TOPLAM: {float(total):.2f} TL", align="right", bold=True, double_size=True)
    add_line("================================", align="center")
    add_line("* Afiyet Olsun *", align="center")
    
    # Feed 4 lines before cut
    buf.extend(b'\n\n\n\n')
    
    # GS V 0 (\x1d\x56\x00) : Full Paper Cut
    buf.extend(b'\x1d\x56\x00')
    
    return bytes(buf)

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

def run_ws_realtime(config):
    b_id = config["business_id"]
    b_name = config["business_name"]
    b_phone = config.get("business_phone", "")

    print(f"\n[*] 7/24 Supabase Realtime WebSocket başlatılıyor: {b_name}...")

    def on_open(ws):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Realtime WebSocket Bağlandı! Siparişler bekleniyor...")
        join_msg = {
            "topic": "realtime:public:orders",
            "event": "phx_join",
            "payload": {
                "config": {
                    "postgres_changes": [
                        {"event": "INSERT", "schema": "public", "table": "orders"}
                    ]
                }
            },
            "ref": "1"
        }
        ws.send(json.dumps(join_msg))

    def on_message(ws, raw_message):
        try:
            msg = json.loads(raw_message)
            event = msg.get("event")
            
            if event == "postgres_changes":
                data_payload = msg.get("payload", {}).get("data", {})
                record = data_payload.get("record", {})
                order_biz_id = record.get("business_id")
                order_id = record.get("id")
                
                if order_biz_id == b_id and order_id and order_id not in PRINTED_ORDERS:
                    PRINTED_ORDERS.add(order_id)
                    save_printed_cache()
                    
                    t_no = record.get("table_no", "MASA")
                    tot = float(record.get("total_amount", 0.0))
                    print(f"\n⚡ [{datetime.now().strftime('%H:%M:%S')}] REALTIME YENİ SİPARİŞ! {t_no} - {tot:.2f} TL")
                    
                    if HAS_WINSOUND:
                        try:
                            winsound.Beep(1400, 250)
                            time.sleep(0.08)
                            winsound.Beep(1800, 350)
                        except Exception:
                            pass
                            
                    raw_bytes = build_escpos_ticket(
                        b_name=b_name,
                        b_phone=b_phone,
                        table_no=t_no,
                        order_id=order_id,
                        items=record.get("items", []),
                        total=tot,
                        notes=record.get("customer_notes", ""),
                        source="QR Menü" if record.get("order_source") == "qr" else "POS"
                    )
                    
                    success, res_msg = send_raw_escpos(None, raw_bytes)
                    if success:
                        print(f"✓ Fiş başarıyla basıldı ve otomatik kesildi: #{order_id[:8]}")
                    else:
                        print(f"✗ Yazdırma hatası: {res_msg}")

        except Exception as e:
            print(f"[HATA] {e}")

    def on_error(ws, error):
        print(f"[WS UYARI] {error}")

    def on_close(ws, code, msg):
        print("[WS KAPANDI] Yeniden bağlanılıyor...")

    while True:
        try:
            ws = websocket.WebSocketApp(
                WS_URL,
                on_open=on_open,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close
            )
            
            def _hb():
                while ws and ws.sock and ws.sock.connected:
                    try:
                        ws.send(json.dumps({"topic": "phoenix", "event": "heartbeat", "payload": {}, "ref": "hb"}))
                    except Exception:
                        break
                    time.sleep(20)
                    
            threading.Thread(target=_hb, daemon=True).start()
            ws.run_forever()
        except Exception as e:
            print(f"Bağlantı koptu ({e}), 3 sn sonra tekrar deneniyor...")
            time.sleep(3)

def main():
    print("="*60)
    print("      RESTIVA ADİSYON - 7/24 REALTIME YAZICI KÖPRÜSÜ       ")
    print("   (RAW ESC/POS + CP857 Türkçe Karakter + Otomatik Kesme)   ")
    print("="*60)
    
    load_printed_cache()
    config = get_config()
    if not config:
        config = setup_config()
    else:
        print(f"[*] Aktif İşletme: {config.get('business_name')} (ID: {config.get('business_id')})")

    run_ws_realtime(config)

if __name__ == "__main__":
    main()
