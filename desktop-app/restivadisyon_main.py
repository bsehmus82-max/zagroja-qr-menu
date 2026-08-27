# -*- coding: utf-8 -*-
"""
RESTIVADISYON - BAĞIMSIZ MASAÜSTÜ POS & ARKA PLAN YAZICI MOTORU
- Yerel Gömülü React Arayüzü (Embedded Local Assets - Offline Server)
- Supabase Realtime WebSocket Dinleyicisi & sync_missed_orders (Son 15 dk Kontrolü)
- winspool.drv RAW ESC/POS Termal Fiş Yazdırma + CP857 Türkçe Karakter Seti + Otomatik Kağıt Kesme
- 127.0.0.1:9100 Yerel Hızlı Yazdırma Köprüsü
- Win32 Tekil Örnek (Singleton Mutex) & Arka Planda Kesintisiz Çalışma
"""

import sys
import os
import json
import time
import socket
import threading
import ctypes
from ctypes import wintypes
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
from http.server import HTTPServer, SimpleHTTPRequestHandler, BaseHTTPRequestHandler
import mimetypes

import webview
import websocket

# Windows Sound
try:
    import winsound
    HAS_WINSOUND = True
except ImportError:
    HAS_WINSOUND = False

# Supabase Configurations
SUPABASE_URL = "https://jphbijgwszlohotouwmy.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_N5N7cQcQ_PkC8oaDWUJRwg_Q0o1HBNg"
WS_URL = f"wss://jphbijgwszlohotouwmy.supabase.co/realtime/v1/websocket?apikey={SUPABASE_ANON_KEY}&vsn=1.0.0"
PRINT_BRIDGE_PORT = 9100
WEB_SERVER_PORT = 28472

# Directory Paths
APPDATA_DIR = os.path.join(os.environ.get("APPDATA", os.path.expanduser("~")), "RestivAdisyon")
os.makedirs(APPDATA_DIR, exist_ok=True)
PRINTED_CACHE_FILE = os.path.join(APPDATA_DIR, "printed_orders.json")

# In-memory printed orders cache
PRINTED_ORDERS = set()
LOCK = threading.Lock()
ACTIVE_BUSINESS_ID = None

class DOC_INFO_1(ctypes.Structure):
    _fields_ = [
        ("pDocName", wintypes.LPWSTR),
        ("pOutputFile", wintypes.LPWSTR),
        ("pDatatype", wintypes.LPWSTR)
    ]

def load_printed_cache():
    global PRINTED_ORDERS
    with LOCK:
        if os.path.exists(PRINTED_CACHE_FILE):
            try:
                with open(PRINTED_CACHE_FILE, "r", encoding="utf-8") as f:
                    PRINTED_ORDERS = set(json.load(f))
            except Exception:
                PRINTED_ORDERS = set()

def save_printed_cache():
    with LOCK:
        try:
            recent = list(PRINTED_ORDERS)[-1000:]
            with open(PRINTED_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(recent, f, ensure_ascii=False)
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
    target_printer = printer_name or get_default_printer_name()
    if not target_printer:
        return False, "Sistemde varsayılan yazıcı bulunamadı."

    winspool = ctypes.WinDLL("winspool.drv")
    p_handle = wintypes.HANDLE()
    if not winspool.OpenPrinterW(target_printer, ctypes.byref(p_handle), None):
        return False, f"Yazıcı açılamadı: {target_printer}"

    try:
        doc_info = DOC_INFO_1("RestivAdisyon Fiş", None, "RAW")
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

def build_escpos_ticket(b_name, b_phone, table_no, order_id, items, total, notes, source="POS"):
    time_str = datetime.now().strftime("%d.%m.%Y %H:%M:%S")
    buf = bytearray()

    # 1. ESC @ : Reset & Init
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
    add_line((b_name or "RESTIVADİSYON").upper(), align="center", bold=True)
    if b_phone:
        add_line(f"Tel: {b_phone}", align="center")
    add_line("--------------------------------", align="center")

    # Table Info
    add_line(f">>> {str(table_no).upper()} <<<", align="center", bold=True, double_size=True)
    add_line(f"Tarih: {time_str}", align="left")
    add_line(f"Sipariş No: #{str(order_id)[:8]}", align="left")
    add_line(f"Kaynak: {source}", align="left")
    add_line("--------------------------------", align="left")

    # Column Headers
    add_line("ÜRÜN              ADET     TUTAR", align="left", bold=True)
    add_line("--------------------------------", align="left")

    # Items
    if isinstance(items, list):
        for item in items:
            name = str(item.get("name", "Ürün"))[:16].ljust(16)
            qty = str(item.get("quantity", 1)).rjust(3)
            price_val = float(item.get("price", 0)) * int(item.get("quantity", 1))
            p = f"{price_val:.2f} TL".rjust(9)
            add_line(f"{name} {qty} {p}", align="left")
            if item.get("notes"):
                add_line(f" * Not: {item.get('notes')}", align="left")

    # Customer Notes
    if notes:
        add_line("--------------------------------", align="left")
        add_line(f"SİPARİŞ NOTU: {notes}", align="left", bold=True)

    # Total
    add_line("================================", align="center")
    add_line(f"TOPLAM: {float(total):.2f} TL", align="right", bold=True, double_size=True)
    add_line("================================", align="center")
    add_line("* RestivAdisyon *", align="center")

    # Feed 4 lines before auto cut
    buf.extend(b'\n\n\n\n')

    # GS V 0 (\x1d\x56\x00) : Cut paper
    buf.extend(b'\x1d\x56\x00')

    return bytes(buf)

def print_order_record(record, source_label="Sipariş"):
    order_id = record.get("id")
    if not order_id:
        return

    with LOCK:
        if order_id in PRINTED_ORDERS:
            return
        PRINTED_ORDERS.add(order_id)
        save_printed_cache()

    if HAS_WINSOUND:
        try:
            winsound.Beep(1400, 250)
            time.sleep(0.08)
            winsound.Beep(1800, 350)
        except Exception:
            pass

    raw_bytes = build_escpos_ticket(
        b_name="RESTIVADİSYON",
        b_phone="",
        table_no=record.get("table_no", "MASA"),
        order_id=order_id,
        items=record.get("items", []),
        total=float(record.get("total_amount", 0.0)),
        notes=record.get("customer_notes", ""),
        source=source_label
    )
    send_raw_escpos(None, raw_bytes)

def sync_missed_orders():
    """
    Polls Supabase REST endpoint for pending orders created in the last 15 minutes
    that have not been printed yet.
    """
    try:
        fifteen_min_ago = (datetime.utcnow() - timedelta(minutes=15)).strftime("%Y-%m-%dT%H:%M:%SZ")
        url = f"{SUPABASE_URL}/rest/v1/orders?order_status=eq.pending&created_at=gte.{fifteen_min_ago}&select=*"
        
        req = urllib.request.Request(url)
        req.add_header("apikey", SUPABASE_ANON_KEY)
        req.add_header("Authorization", f"Bearer {SUPABASE_ANON_KEY}")
        
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                orders = json.loads(response.read().decode("utf-8"))
                for order in orders:
                    oid = order.get("id")
                    if oid and oid not in PRINTED_ORDERS:
                        src = "QR Menü" if order.get("order_source") == "qr" else "Garson / Kasa"
                        print_order_record(order, src)
    except Exception:
        pass

def background_missed_orders_worker():
    while True:
        try:
            sync_missed_orders()
        except Exception:
            pass
        time.sleep(20)

def background_printer_worker():
    load_printed_cache()

    # 1. Start Local Fast-Track HTTP Print Server (127.0.0.1:9100)
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
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            resp = {
                "status": "online",
                "service": "RestivAdisyon POS Engine",
                "printer": get_default_printer_name() or "Varsayılan Yazıcı Yok"
            }
            self.wfile.write(json.dumps(resp, ensure_ascii=False).encode("utf-8"))

        def do_POST(self):
            if self.path == '/print':
                length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(length)
                try:
                    data = json.loads(post_data.decode('utf-8'))
                    order_id = data.get("order_id")
                    if order_id:
                        with LOCK:
                            PRINTED_ORDERS.add(order_id)
                            save_printed_cache()

                    if HAS_WINSOUND:
                        try:
                            winsound.Beep(1400, 250)
                            time.sleep(0.08)
                            winsound.Beep(1800, 350)
                        except Exception:
                            pass

                    raw_bytes = build_escpos_ticket(
                        b_name=data.get("business_name", "RESTIVADİSYON"),
                        b_phone=data.get("business_phone", ""),
                        table_no=data.get("table_no", "MASA"),
                        order_id=order_id or "MANUEL",
                        items=data.get("items", []),
                        total=float(data.get("total_amount", 0.0)),
                        notes=data.get("customer_notes", ""),
                        source=data.get("order_source", "Kasa")
                    )
                    success, res_msg = send_raw_escpos(None, raw_bytes)
                    self.send_response(200 if success else 500)
                    self._set_cors_headers()
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": success, "message": res_msg}, ensure_ascii=False).encode("utf-8"))
                except Exception as e:
                    self.send_response(400)
                    self._set_cors_headers()
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}, ensure_ascii=False).encode("utf-8"))

    def start_http():
        try:
            httpd = HTTPServer(('127.0.0.1', PRINT_BRIDGE_PORT), LocalHttpHandler)
            httpd.serve_forever()
        except Exception:
            pass

    threading.Thread(target=start_http, daemon=True).start()

    # 2. Start Missed Orders Poller
    threading.Thread(target=background_missed_orders_worker, daemon=True).start()

    # 3. Start Realtime WebSocket Listener with Auto Reconnect
    while True:
        try:
            # Sync any missed orders right upon connection attempt
            sync_missed_orders()

            def on_open(ws):
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
                        src = "QR Menü" if record.get("order_source") == "qr" else "Garson / Kasa"
                        print_order_record(record, src)
                except Exception:
                    pass

            ws = websocket.WebSocketApp(
                WS_URL,
                on_open=on_open,
                on_message=on_message
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
        except Exception:
            time.sleep(4)

def start_embedded_web_server():
    """
    Starts internal local HTTP server that serves bundled React assets
    with client-side SPA fallback.
    """
    if getattr(sys, 'frozen', False):
        base_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
        dist_dir = os.path.join(base_dir, 'web_dist')
    else:
        dist_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dist')

    if not os.path.exists(dist_dir):
        # Fallback to local dist
        dist_dir = os.path.abspath("dist")

    class SpaHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=dist_dir, **kwargs)

        def do_GET(self):
            # Parse path
            parsed = urllib.parse.urlparse(self.path)
            clean_path = parsed.path.lstrip('/')
            file_path = os.path.join(dist_dir, clean_path)

            if os.path.isfile(file_path):
                return super().do_GET()
            else:
                # SPA Fallback to index.html
                self.path = '/index.html'
                return super().do_GET()

        def log_message(self, format, *args):
            pass  # Quiet logs

    def run_server():
        try:
            httpd = HTTPServer(('127.0.0.1', WEB_SERVER_PORT), SpaHandler)
            httpd.serve_forever()
        except Exception:
            pass

    threading.Thread(target=run_server, daemon=True).start()

def main():
    # 1. Win32 Single-Instance Mutex
    mutex_name = "RestivAdisyon_Singleton_Mutex"
    kernel32 = ctypes.WinDLL("kernel32")
    mutex = kernel32.CreateMutexW(None, True, mutex_name)
    last_error = kernel32.GetLastError()
    if last_error == 183:  # ERROR_ALREADY_EXISTS
        user32 = ctypes.WinDLL("user32")
        hwnd = user32.FindWindowW(None, "RestivAdisyon - POS & Adisyon Yönetim Sistemi")
        if hwnd:
            user32.ShowWindow(hwnd, 9)  # SW_RESTORE
            user32.SetForegroundWindow(hwnd)
        sys.exit(0)

    # 2. Start Embedded Web Server
    start_embedded_web_server()

    # 3. Start Background Printer & WebSocket Worker
    threading.Thread(target=background_printer_worker, daemon=True).start()

    # 4. Give web server a brief moment to bind
    time.sleep(0.3)

    # 5. Launch Native Webview2 Window (Connecting to Local Embedded Server)
    webview.create_window(
        title="RestivAdisyon - POS & Adisyon Yönetim Sistemi",
        url=f"http://127.0.0.1:{WEB_SERVER_PORT}",
        width=1320,
        height=880,
        resizable=True,
        fullscreen=False,
        min_size=(960, 640),
        confirm_close=True,
        background_color='#080B10'
    )
    webview.start(private_mode=False)

if __name__ == "__main__":
    main()
