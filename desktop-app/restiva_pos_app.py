# -*- coding: utf-8 -*-
"""
RESTIVA ADİSYON & POS - TEK BİRLEŞİK MASAÜSTÜ UYGULAMASI (.EXE)
- Tam Ekran Webview2 İşletme Yönetim Paneli
- Arka Planda Eşzamanlı Çalışan Supabase Realtime WebSocket Dinleyicisi
- Windows RAW Spooler (ESC/POS) + CP857 Türkçe Karakter Seti + Otomatik Kağıt Kesme
- Yerel 127.0.0.1:9100 HTTP Köprüsü
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

import webview
import websocket

# Windows Sound
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
    target_printer = printer_name or get_default_printer_name()
    if not target_printer:
        return False, "Sistemde varsayılan yazıcı bulunamadı."

    winspool = ctypes.WinDLL("winspool.drv")
    p_handle = wintypes.HANDLE()
    if not winspool.OpenPrinterW(target_printer, ctypes.byref(p_handle), None):
        return False, f"Yazıcı açılamadı: {target_printer}"
        
    try:
        doc_info = DOC_INFO_1("Restiva Adisyon", None, "RAW")
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
    
    # 1. ESC @ : Init
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

    # Brand
    add_line("================================", align="center")
    add_line(b_name.upper(), align="center", bold=True)
    if b_phone:
        add_line(f"Tel: {b_phone}", align="center")
    add_line("--------------------------------", align="center")
    
    # Table & Order
    add_line(f">>> {table_no.upper()} <<<", align="center", bold=True, double_size=True)
    add_line(f"Tarih: {time_str}", align="left")
    add_line(f"Sipariş No: #{str(order_id)[:8]}", align="left")
    add_line(f"Kaynak: {source}", align="left")
    add_line("--------------------------------", align="left")
    
    # Grid
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
    
    # GS V 0 (\x1d\x56\x00) : Auto Cut
    buf.extend(b'\x1d\x56\x00')
    
    return bytes(buf)

def background_printer_worker():
    """
    Background Realtime WebSocket + HTTP Bridge Worker
    Runs concurrently with the WebView UI window in the same process.
    """
    load_printed_cache()
    
    # 1. Start Local HTTP Fast-Track Server (127.0.0.1:9100)
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
            self.wfile.write(json.dumps({"status": "online", "service": "Restiva Unified POS Desktop"}).encode("utf-8"))

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

                    if HAS_WINSOUND:
                        try:
                            winsound.Beep(1400, 250)
                            time.sleep(0.08)
                            winsound.Beep(1800, 350)
                        except Exception:
                            pass
                            
                    raw_bytes = build_escpos_ticket(
                        b_name=data.get("business_name", "RESTIVA"),
                        b_phone=data.get("business_phone", ""),
                        table_no=data.get("table_no", "MASA"),
                        order_id=order_id or "MANUEL",
                        items=data.get("items", []),
                        total=float(data.get("total_amount", 0.0)),
                        notes=data.get("customer_notes", ""),
                        source=data.get("order_source", "POS")
                    )
                    success, res_msg = send_raw_escpos(None, raw_bytes)
                    self.send_response(200 if success else 500)
                    self._set_cors_headers()
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": success, "message": res_msg}).encode("utf-8"))
                except Exception as e:
                    self.send_response(400)
                    self._set_cors_headers()
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

    def start_http():
        try:
            httpd = HTTPServer(('127.0.0.1', HTTP_PORT), LocalHttpHandler)
            httpd.serve_forever()
        except Exception:
            pass

    threading.Thread(target=start_http, daemon=True).start()

    # 2. Start Realtime WebSocket Listener with Reconnect Catch-up
    while True:
        try:
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
                        order_id = record.get("id")
                        
                        if order_id and order_id not in PRINTED_ORDERS:
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
                                b_name="RESTIVA ADISYON",
                                b_phone="",
                                table_no=record.get("table_no", "MASA"),
                                order_id=order_id,
                                items=record.get("items", []),
                                total=float(record.get("total_amount", 0.0)),
                                notes=record.get("customer_notes", ""),
                                source="QR Menü" if record.get("order_source") == "qr" else "POS"
                            )
                            send_raw_escpos(None, raw_bytes)
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
            time.sleep(3)

def main():
    # Start background printer worker
    t = threading.Thread(target=background_printer_worker, daemon=True)
    t.start()
    
    # Launch Single Unified Desktop Window
    webview.create_window(
        title="Restiva Adisyon & POS Yönetim Sistemi",
        url="https://restivadisyon.org/admin",
        width=1280,
        height=850,
        resizable=True,
        fullscreen=False,
        min_size=(900, 600),
        confirm_close=True,
        background_color='#0B0F17'
    )
    webview.start(private_mode=False)

if __name__ == "__main__":
    main()
