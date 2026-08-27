# -*- coding: utf-8 -*-
"""
RESTIVA ADİSYON - MASAÜSTÜ TERMAL YAZICI UYGULAMASI (.EXE)
- Windows RAW Spooler (ESC/POS) + CP857 Türkçe Karakter Seti + Otomatik Kağıt Kesme (\x1d\x56\x00)
- Supabase Realtime WebSocket Dinleyicisi (Sıfır gecikmeli anlık bildirim ve yazdırma)
- Otomatik Bağlantı Kurtarma & Kaçırılan Siparişleri Senkronize Etme (Catch-up Sync)
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

import tkinter as tk
from tkinter import ttk, messagebox
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

def get_installed_printers():
    printers = ["(Varsayılan Windows Yazıcısı)"]
    try:
        import subprocess
        cmd = 'powershell "Get-Printer | Select-Object -ExpandProperty Name"'
        out = subprocess.check_output(cmd, shell=True, text=True)
        for line in out.splitlines():
            line = line.strip()
            if line and line not in printers:
                printers.append(line)
    except Exception:
        pass
    return printers

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

    # Brand Header
    add_line("================================", align="center")
    add_line(b_name.upper(), align="center", bold=True)
    if b_phone:
        add_line(f"Tel: {b_phone}", align="center")
    add_line("--------------------------------", align="center")
    
    # Table & Order details
    add_line(f">>> {table_no.upper()} <<<", align="center", bold=True, double_size=True)
    add_line(f"Tarih: {time_str}", align="left")
    add_line(f"Sipariş No: #{str(order_id)[:8]}", align="left")
    add_line(f"Kaynak: {source}", align="left")
    add_line("--------------------------------", align="left")
    
    # Columns Header: ÜRÜN (16) ADET (3) TUTAR (9)
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

class RestivaApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Restiva Adisyon - 7/24 Otomatik Termal Yazıcı v2.1")
        self.geometry("660x620")
        self.minsize(600, 540)
        self.configure(bg="#0F172A")
        
        load_printed_cache()
        self.is_running = False
        self.ws = None
        self.ws_thread = None
        self.businesses = []
        self.selected_business = None
        
        self.build_ui()
        self.fetch_businesses()
        
    def build_ui(self):
        header = tk.Frame(self, bg="#1E293B", pady=12, padx=16)
        header.pack(fill="x")
        
        lbl_title = tk.Label(header, text="RESTIVA ADİSYON", font=("Arial", 16, "bold"), fg="#F97316", bg="#1E293B")
        lbl_title.pack(anchor="w")
        
        lbl_sub = tk.Label(
            header, 
            text="7/24 Realtime WebSocket + RAW ESC/POS + CP857 Türkçe Otomatik Fiş Yazıcı", 
            font=("Arial", 9), fg="#94A3B8", bg="#1E293B"
        )
        lbl_sub.pack(anchor="w")
        
        card = tk.Frame(self, bg="#1E293B", padx=16, pady=14)
        card.pack(fill="x", padx=16, pady=10)
        
        tk.Label(card, text="İşletme Seçiniz veya Bağlantı Kodu Giriniz:", font=("Arial", 10, "bold"), fg="#E2E8F0", bg="#1E293B").pack(anchor="w")
        
        self.biz_var = tk.StringVar()
        self.biz_combo = ttk.Combobox(card, textvariable=self.biz_var, font=("Arial", 10))
        self.biz_combo.pack(fill="x", pady=(4, 10))
        
        tk.Label(card, text="Termal Fiş Yazıcısı (RAW ESC/POS):", font=("Arial", 10, "bold"), fg="#E2E8F0", bg="#1E293B").pack(anchor="w")
        
        self.printer_var = tk.StringVar()
        printers = get_installed_printers()
        self.printer_combo = ttk.Combobox(card, textvariable=self.printer_var, values=printers, font=("Arial", 10))
        if printers:
            self.printer_combo.current(0)
        self.printer_combo.pack(fill="x", pady=(4, 14))
        
        btn_row = tk.Frame(card, bg="#1E293B")
        btn_row.pack(fill="x")
        
        self.btn_toggle = tk.Button(
            btn_row, text="▶ REALTIME BAĞLANTIYI BAŞLAT", font=("Arial", 10, "bold"),
            bg="#F97316", fg="white", activebackground="#EA580C", activeforeground="white",
            relief="flat", padx=16, pady=8, cursor="hand2", command=self.toggle_service
        )
        self.btn_toggle.pack(side="left", padx=(0, 8))
        
        btn_test = tk.Button(
            btn_row, text="🧾 RAW Test Fişi & Kağıt Kes", font=("Arial", 9, "bold"),
            bg="#334155", fg="white", activebackground="#475569", activeforeground="white",
            relief="flat", padx=12, pady=8, cursor="hand2", command=self.print_test_ticket
        )
        btn_test.pack(side="left")
        
        self.lbl_status = tk.Label(self, text="● Servis Durumu: Durduruldu", font=("Arial", 10, "bold"), fg="#EF4444", bg="#0F172A")
        self.lbl_status.pack(anchor="w", padx=18, pady=(4, 4))
        
        log_frame = tk.Frame(self, bg="#0F172A", padx=16, pady=4)
        log_frame.pack(fill="both", expand=True)
        
        tk.Label(log_frame, text="Canlı WebSocket Sipariş Akışı (Realtime):", font=("Arial", 9, "bold"), fg="#94A3B8", bg="#0F172A").pack(anchor="w")
        
        self.log_text = tk.Text(log_frame, bg="#020617", fg="#38BDF8", font=("Consolas", 9), relief="flat", padx=8, pady=8)
        self.log_text.pack(fill="both", expand=True, pady=(4, 12))
        self.log("Restiva Realtime Adisyon Motoru v2.1 Başlatıldı.")

    def log(self, msg):
        ts = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert("end", f"[{ts}] {msg}\n")
        self.log_text.see("end")

    def fetch_businesses(self):
        def _fetch():
            headers = {"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_ANON_KEY}"}
            url = f"{SUPABASE_URL}/rest/v1/businesses?select=id,name,slug,phone"
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req) as resp:
                    self.businesses = json.loads(resp.read().decode("utf-8"))
                    names = [f"{b['name']} ({b['slug']})" for b in self.businesses]
                    self.biz_combo["values"] = names
                    if names:
                        self.biz_combo.current(0)
            except Exception as e:
                self.log(f"İşletmeler çekilemedi: {e}")
        threading.Thread(target=_fetch, daemon=True).start()

    def sync_missed_orders(self):
        """
        Reconnect Catch-up: Queries Supabase for any unprinted pending orders during offline periods.
        """
        try:
            b_id = self.selected_business["id"]
            b_name = self.selected_business["name"]
            b_phone = self.selected_business.get("phone", "")
            headers = {"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_ANON_KEY}"}
            url = f"{SUPABASE_URL}/rest/v1/orders?business_id=eq.{b_id}&status=eq.pending&order=created_at.desc&limit=15"
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as resp:
                orders = json.loads(resp.read().decode("utf-8"))
                unprinted = [o for o in reversed(orders) if o["id"] not in PRINTED_ORDERS]
                if unprinted:
                    self.log(f"⚡ [SENKRONİZASYON] Kesinti sonrası {len(unprinted)} adet bekleyen sipariş yakalandı!")
                    for order in unprinted:
                        order_id = order["id"]
                        PRINTED_ORDERS.add(order_id)
                        save_printed_cache()
                        
                        t_no = order.get("table_no", "MASA")
                        tot = float(order.get("total_amount", 0.0))
                        self.log(f"-> Yazdırılıyor: {t_no} ({tot:.2f} TL)")
                        
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
                            items=order.get("items", []),
                            total=tot,
                            notes=order.get("customer_notes", ""),
                            source="QR Menü" if order.get("order_source") == "qr" else "POS"
                        )
                        
                        printer = self.printer_var.get()
                        send_raw_escpos(printer, raw_bytes)
        except Exception as e:
            self.log(f"Senkronizasyon uyarısı: {e}")

    def print_test_ticket(self):
        printer = self.printer_var.get()
        raw_bytes = build_escpos_ticket(
            b_name="RESTIVA TEST LEZZET",
            b_phone="0850 123 45 67",
            table_no="MASA 1",
            order_id="TEST0001",
            items=[
                {"name": "Türkçe Çorba Şiş", "quantity": 1, "price": 185.0},
                {"name": "Közde Künefe & Şöbiyet", "quantity": 2, "price": 120.0}
            ],
            total=425.0,
            notes="Çatal bıçak bol olsun lütfen (Türkçe karakter testi: ğüşiöç)",
            source="RAW ESC/POS Testi"
        )
        success, msg = send_raw_escpos(printer, raw_bytes)
        if success:
            self.log("ESC/POS Test fişi RAW modda basıldı ve kağıt otomatik kesildi!")
            messagebox.showinfo("Başarılı", "Test fişi yazıcıya RAW modda gönderildi ve kesildi!")
        else:
            self.log(f"HATA: {msg}")
            messagebox.showerror("Hata", f"Yazıcıya gönderilemedi: {msg}")

    def toggle_service(self):
        if self.is_running:
            self.is_running = False
            if self.ws:
                self.ws.close()
            self.btn_toggle.config(text="▶ REALTIME BAĞLANTIYI BAŞLAT", bg="#F97316")
            self.lbl_status.config(text="● Servis Durumu: Durduruldu", fg="#EF4444")
            self.log("Realtime dinleyici durduruldu.")
        else:
            sel_text = self.biz_var.get()
            selected_b = None
            for b in self.businesses:
                if f"{b['name']} ({b['slug']})" == sel_text or b['slug'] == sel_text or b['id'] == sel_text:
                    selected_b = b
                    break
            
            if not selected_b and self.businesses:
                selected_b = self.businesses[0]
                
            if not selected_b:
                messagebox.showwarning("Uyarı", "Lütfen bir işletme seçiniz.")
                return

            self.selected_business = selected_b
            self.is_running = True
            self.btn_toggle.config(text="⏹ BAĞLANTIYI DURDUR", bg="#EF4444")
            self.lbl_status.config(text=f"● 7/24 Realtime WebSocket Aktif: {selected_b['name']}", fg="#10B981")
            self.log(f"Supabase Realtime WebSocket başlatılıyor: {selected_b['name']} ({selected_b['id']})")
            
            self.ws_thread = threading.Thread(target=self._ws_runner, daemon=True)
            self.ws_thread.start()

    def _ws_runner(self):
        while self.is_running:
            try:
                b_id = self.selected_business["id"]
                
                def on_open(ws):
                    self.log("WebSocket bağlantısı kuruldu. Realtime kanalına abone olunuyor...")
                    # Run catch-up on connect/reconnect
                    self.sync_missed_orders()
                    
                    join_payload = {
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
                    ws.send(json.dumps(join_payload))

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
                                self.log(f"⚡ [REALTIME YENİ SİPARİŞ!] {t_no} - {tot:.2f} TL (Anında Yazdırılıyor...)")
                                
                                if HAS_WINSOUND:
                                    try:
                                        winsound.Beep(1400, 250)
                                        time.sleep(0.08)
                                        winsound.Beep(1800, 350)
                                    except Exception:
                                        pass
                                        
                                raw_bytes = build_escpos_ticket(
                                    b_name=self.selected_business["name"],
                                    b_phone=self.selected_business.get("phone", ""),
                                    table_no=t_no,
                                    order_id=order_id,
                                    items=record.get("items", []),
                                    total=tot,
                                    notes=record.get("customer_notes", ""),
                                    source="QR Menü" if record.get("order_source") == "qr" else "POS"
                                )
                                
                                printer = self.printer_var.get()
                                success, res_msg = send_raw_escpos(printer, raw_bytes)
                                if success:
                                    self.log(f"✓ Fiş başarıyla basıldı ve otomatik kesildi: #{order_id[:8]}")
                                else:
                                    self.log(f"✗ Yazdırma hatası: {res_msg}")

                    except Exception as err:
                        self.log(f"Mesaj işleme hatası: {err}")

                def on_error(ws, error):
                    self.log(f"WebSocket Uyarısı: {error}")

                def on_close(ws, close_status_code, close_msg):
                    self.log("WebSocket bağlantısı kapandı. 3 sn içinde yeniden bağlanılacak...")

                self.ws = websocket.WebSocketApp(
                    WS_URL,
                    on_open=on_open,
                    on_message=on_message,
                    on_error=on_error,
                    on_close=on_close
                )
                
                def _heartbeat():
                    while self.is_running and self.ws and self.ws.sock and self.ws.sock.connected:
                        try:
                            self.ws.send(json.dumps({"topic": "phoenix", "event": "heartbeat", "payload": {}, "ref": "hb"}))
                        except Exception:
                            break
                        time.sleep(20)
                
                threading.Thread(target=_heartbeat, daemon=True).start()
                self.ws.run_forever()
                
            except Exception as e:
                self.log(f"Yeniden bağlanılıyor... ({e})")
                time.sleep(3)

if __name__ == "__main__":
    app = RestivaApp()
    app.mainloop()
