# -*- coding: utf-8 -*-
"""
RESTIVA ADİSYON - MASAÜSTÜ YAZICI UYGULAMASI (.EXE)
Restoran ve Kafeler için 7/24 Arka Planda Çalışan Otomatik Adisyon Yazıcı Programı
"""

import sys
import os
import json
import time
import threading
import subprocess
import urllib.request
from datetime import datetime

import tkinter as tk
from tkinter import ttk, messagebox

# Windows Sound
try:
    import winsound
    HAS_WINSOUND = True
except ImportError:
    HAS_WINSOUND = False

SUPABASE_URL = "https://jphbijgwszlohotouwmy.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_N5N7cQcQ_PkC8oaDWUJRwg_Q0o1HBNg"

APP_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(APP_DIR, "config.json")
PRINTED_CACHE_FILE = os.path.join(APP_DIR, "printed_orders.json")

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
        recent = list(PRINTED_ORDERS)[-500:]
        with open(PRINTED_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(recent, f)
    except Exception:
        pass

def get_installed_printers():
    printers = ["(Varsayılan Windows Yazıcısı)"]
    try:
        cmd = 'powershell "Get-Printer | Select-Object -ExpandProperty Name"'
        out = subprocess.check_output(cmd, shell=True, text=True)
        for line in out.splitlines():
            line = line.strip()
            if line and line not in printers:
                printers.append(line)
    except Exception:
        pass
    return printers

def send_to_printer(text_content, printer_name=None):
    try:
        temp_file = os.path.join(os.environ.get("TEMP", "."), "restiva_ticket.txt")
        with open(temp_file, "w", encoding="utf-8") as f:
            f.write(text_content)
        
        if printer_name and printer_name != "(Varsayılan Windows Yazıcısı)":
            cmd = f'Get-Content -Path "{temp_file}" -Raw | Out-Printer -Name "{printer_name}"'
        else:
            cmd = f'Get-Content -Path "{temp_file}" -Raw | Out-Printer'
            
        subprocess.run(["powershell", "-Command", cmd], capture_output=True, text=True)
        return True
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
    ticket.append("\n\n\n")
    return "\n".join(ticket)

class RestivaApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Restiva Adisyon - Otomatik Termal Yazıcı v1.0")
        self.geometry("640x600")
        self.minsize(580, 520)
        self.configure(bg="#0F172A")
        
        load_printed_cache()
        self.is_running = False
        self.worker_thread = None
        self.businesses = []
        
        self.build_ui()
        self.fetch_businesses()
        
    def build_ui(self):
        # Header Banner
        header = tk.Frame(self, bg="#1E293B", pady=12, padx=16)
        header.pack(fill="x")
        
        lbl_title = tk.Label(header, text="RESTIVA ADİSYON", font=("Arial", 16, "bold"), fg="#F97316", bg="#1E293B")
        lbl_title.pack(anchor="w")
        
        lbl_sub = tk.Label(header, text="7/24 Otomatik Termal Fiş Yazıcı Servisi (Tarayıcı Kapalıyken de Çalışır)", font=("Arial", 9), fg="#94A3B8", bg="#1E293B")
        lbl_sub.pack(anchor="w")
        
        # Form Container
        card = tk.Frame(self, bg="#1E293B", padx=16, pady=16)
        card.pack(fill="x", padx=16, pady=12)
        
        # Business Selection
        tk.Label(card, text="İşletme Seçiniz veya Giriş Kodu Giriniz:", font=("Arial", 10, "bold"), fg="#E2E8F0", bg="#1E293B").pack(anchor="w")
        
        self.biz_var = tk.StringVar()
        self.biz_combo = ttk.Combobox(card, textvariable=self.biz_var, font=("Arial", 10))
        self.biz_combo.pack(fill="x", pady=(4, 12))
        
        # Printer Selection
        tk.Label(card, text="Termal Fiş Yazıcısı:", font=("Arial", 10, "bold"), fg="#E2E8F0", bg="#1E293B").pack(anchor="w")
        
        self.printer_var = tk.StringVar()
        printers = get_installed_printers()
        self.printer_combo = ttk.Combobox(card, textvariable=self.printer_var, values=printers, font=("Arial", 10))
        if printers:
            self.printer_combo.current(0)
        self.printer_combo.pack(fill="x", pady=(4, 16))
        
        # Action Buttons Row
        btn_row = tk.Frame(card, bg="#1E293B")
        btn_row.pack(fill="x")
        
        self.btn_toggle = tk.Button(
            btn_row, text="▶ BAĞLANTIYI BAŞLAT", font=("Arial", 10, "bold"),
            bg="#F97316", fg="white", activebackground="#EA580C", activeforeground="white",
            relief="flat", padx=16, pady=8, cursor="hand2", command=self.toggle_service
        )
        self.btn_toggle.pack(side="left", padx=(0, 8))
        
        btn_test = tk.Button(
            btn_row, text="🧾 Test Fişi Yazdır", font=("Arial", 9, "bold"),
            bg="#334155", fg="white", activebackground="#475569", activeforeground="white",
            relief="flat", padx=12, pady=8, cursor="hand2", command=self.print_test_ticket
        )
        btn_test.pack(side="left")
        
        # Status Label
        self.lbl_status = tk.Label(self, text="● Servis Durumu: Durduruldu", font=("Arial", 10, "bold"), fg="#EF4444", bg="#0F172A")
        self.lbl_status.pack(anchor="w", padx=18, pady=(4, 4))
        
        # Live Orders Log Window
        log_frame = tk.Frame(self, bg="#0F172A", padx=16, pady=4)
        log_frame.pack(fill="both", expand=True)
        
        tk.Label(log_frame, text="Canlı Sipariş Log Akışı:", font=("Arial", 9, "bold"), fg="#94A3B8", bg="#0F172A").pack(anchor="w")
        
        self.log_text = tk.Text(log_frame, bg="#020617", fg="#38BDF8", font=("Consolas", 9), relief="flat", padx=8, pady=8)
        self.log_text.pack(fill="both", expand=True, pady=(4, 12))
        self.log("Restiva Adisyon Yazıcı Programı Başlatıldı.")

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

    def print_test_ticket(self):
        printer = self.printer_var.get()
        test_text = format_ticket(
            b_name="RESTIVA TEST",
            b_phone="0850 123 45 67",
            table_no="MASA 1",
            order_id="TEST0001",
            items=[
                {"name": "Adana Kebap", "quantity": 1, "price": 280.0},
                {"name": "Ayran (Yayık)", "quantity": 1, "price": 40.0}
            ],
            total=320.0,
            notes="Acısız olsun lütfen",
            source="Test Baskısı"
        )
        success = send_to_printer(test_text, printer)
        if success:
            self.log("Test fişi yazıcıya başarıyla gönderildi!")
            messagebox.showinfo("Başarılı", "Test fişi yazıcıya gönderildi!")
        else:
            self.log("HATA: Test fişi yazıcıya gönderilemedi.")
            messagebox.showerror("Hata", "Test fişi yazıcıya gönderilemedi. Lütfen yazıcıyı kontrol edin.")

    def toggle_service(self):
        if self.is_running:
            self.is_running = False
            self.btn_toggle.config(text="▶ BAĞLANTIYI BAŞLAT", bg="#F97316")
            self.lbl_status.config(text="● Servis Durumu: Durduruldu", fg="#EF4444")
            self.log("Yazıcı servisi durduruldu.")
        else:
            # Find selected business ID
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

            self.is_running = True
            self.btn_toggle.config(text="⏹ BAĞLANTIYI DURDUR", bg="#EF4444")
            self.lbl_status.config(text=f"● 7/24 Canlı Dinleniyor: {selected_b['name']}", fg="#10B981")
            self.log(f"Bulut dinleyici başlatıldı: {selected_b['name']} ({selected_b['id']})")
            
            self.worker_thread = threading.Thread(target=self._cloud_worker, args=(selected_b,), daemon=True)
            self.worker_thread.start()

    def _cloud_worker(self, business):
        b_id = business["id"]
        b_name = business["name"]
        b_phone = business.get("phone", "")
        headers = {"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_ANON_KEY}"}

        # Prime initial orders
        try:
            url = f"{SUPABASE_URL}/rest/v1/orders?business_id=eq.{b_id}&order=created_at.desc&limit=25"
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as resp:
                orders = json.loads(resp.read().decode("utf-8"))
                for o in orders:
                    PRINTED_ORDERS.add(o["id"])
                save_printed_cache()
        except Exception:
            pass

        while self.is_running:
            try:
                url = f"{SUPABASE_URL}/rest/v1/orders?business_id=eq.{b_id}&order=created_at.desc&limit=10"
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req) as resp:
                    orders = json.loads(resp.read().decode("utf-8"))
                    new_orders = [o for o in reversed(orders) if o["id"] not in PRINTED_ORDERS]
                    
                    for order in new_orders:
                        PRINTED_ORDERS.add(order["id"])
                        save_printed_cache()
                        
                        t_no = order.get("table_no", "MASA")
                        tot = float(order.get("total_amount", 0.0))
                        self.log(f"YENİ SİPARİŞ! {t_no} - {tot:.2f} TL (Yazdırılıyor...)")
                        
                        if HAS_WINSOUND:
                            try:
                                winsound.Beep(1400, 250)
                                time.sleep(0.08)
                                winsound.Beep(1800, 350)
                            except Exception:
                                pass
                                
                        ticket_text = format_ticket(
                            b_name=b_name,
                            b_phone=b_phone,
                            table_no=t_no,
                            order_id=order.get("id", ""),
                            items=order.get("items", []),
                            total=tot,
                            notes=order.get("customer_notes", ""),
                            source="QR Menü" if order.get("order_source") == "qr" else "POS"
                        )
                        
                        printer = self.printer_var.get()
                        send_to_printer(ticket_text, printer)
                        
            except Exception:
                pass
            time.sleep(2.0)

if __name__ == "__main__":
    app = RestivaApp()
    app.mainloop()
