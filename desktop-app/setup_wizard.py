# -*- coding: utf-8 -*-
"""
RESTIVADISYON - PROFESYONEL WINDOWS KURULUM SİHİRBAZI (SETUP WIZARD)
- Modern Dark/Clean Arayüz (Tkinter/ttk)
- Disk ve Klasör Seçimi (C:, D: vb.) + Boş Alan Göstergesi
- Masaüstü Kısayolu, Başlat Menüsü ve Başlangıçta Otomatik Başlatma
- Windows Program Ekle/Kaldır Kaydı (Uninstall Entegrasyonu)
- Kurulum Sonrası Otomatik Başlatma Seçeneği
"""

import sys
import os
import shutil
import subprocess
import threading
import time
import winreg
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

APP_NAME = "RestivAdisyon"
APP_VERSION = "2.0.0"
APP_PUBLISHER = "RestivAdisyon"

def get_default_install_dir():
    local_app_data = os.environ.get("LOCALAPPDATA", os.path.expanduser("~"))
    return os.path.join(local_app_data, "Programs", APP_NAME)

def get_free_space_gb(folder):
    try:
        drive = os.path.splitdrive(os.path.abspath(folder))[0] or "C:"
        usage = shutil.disk_usage(drive)
        return usage.free / (1024 ** 3)
    except Exception:
        return 50.0

def create_shortcut(target_exe, shortcut_path, icon_path, working_dir="", description=""):
    try:
        os.makedirs(os.path.dirname(shortcut_path), exist_ok=True)
        vbs_content = f"""
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "{shortcut_path}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "{target_exe}"
oLink.WorkingDirectory = "{working_dir or os.path.dirname(target_exe)}"
oLink.Description = "{description}"
oLink.IconLocation = "{icon_path}, 0"
oLink.Save
"""
        temp_vbs = os.path.join(os.environ.get("TEMP", "."), f"make_lnk_{int(time.time()*1000)}.vbs")
        with open(temp_vbs, "w", encoding="utf-8") as f:
            f.write(vbs_content)
        subprocess.run(["cscript", "//nologo", temp_vbs], check=False, creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
        try:
            os.remove(temp_vbs)
        except Exception:
            pass
        return True
    except Exception:
        return False

def register_uninstall_entry(install_dir):
    try:
        reg_path = f"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{APP_NAME}"
        key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, reg_path)
        
        target_exe = os.path.join(install_dir, f"{APP_NAME}.exe")
        uninstall_exe = os.path.join(install_dir, "Uninstall.exe")
        icon_path = os.path.join(install_dir, "app_icon.ico")
        
        winreg.SetValueEx(key, "DisplayName", 0, winreg.REG_SZ, f"{APP_NAME} POS & Adisyon Sistemi")
        winreg.SetValueEx(key, "DisplayVersion", 0, winreg.REG_SZ, APP_VERSION)
        winreg.SetValueEx(key, "Publisher", 0, winreg.REG_SZ, APP_PUBLISHER)
        winreg.SetValueEx(key, "DisplayIcon", 0, winreg.REG_SZ, icon_path)
        winreg.SetValueEx(key, "InstallLocation", 0, winreg.REG_SZ, install_dir)
        winreg.SetValueEx(key, "UninstallString", 0, winreg.REG_SZ, f'"{uninstall_exe}"')
        winreg.SetValueEx(key, "NoModify", 0, winreg.REG_DWORD, 1)
        winreg.SetValueEx(key, "NoRepair", 0, winreg.REG_DWORD, 1)
        winreg.CloseKey(key)
    except Exception:
        pass

class SetupWizardApp:
    def __init__(self, root):
        self.root = root
        self.root.title(f"{APP_NAME} - Kurulum Sihirbazı")
        self.root.geometry("640x480")
        self.root.resizable(False, False)
        self.root.configure(bg="#0B0F17")

        # Center on screen
        self.center_window()

        # State Variables
        self.install_dir_var = tk.StringVar(value=get_default_install_dir())
        self.shortcut_desktop_var = tk.BooleanVar(value=True)
        self.shortcut_startmenu_var = tk.BooleanVar(value=True)
        self.shortcut_startup_var = tk.BooleanVar(value=True)
        self.launch_app_var = tk.BooleanVar(value=True)
        self.open_manual_var = tk.BooleanVar(value=False)
        self.free_space_var = tk.StringVar()

        self.current_step = 1

        # Determine payload location
        if getattr(sys, 'frozen', False):
            self.base_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
            self.payload_dir = os.path.join(self.base_dir, "payload")
        else:
            self.base_dir = os.path.dirname(os.path.abspath(__file__))
            self.payload_dir = os.path.join(self.base_dir, "..", "dist", "RestivAdisyon-Paket")

        # Fallback payload check
        if not os.path.exists(self.payload_dir):
            self.payload_dir = self.base_dir

        self.update_free_space()

        # Setup Container UI
        self.build_header()
        
        self.content_frame = tk.Frame(self.root, bg="#0B0F17")
        self.content_frame.pack(fill=tk.BOTH, expand=True, padx=30, pady=15)

        self.build_footer()

        # Show initial step
        self.show_step(1)

    def center_window(self):
        self.root.update_idletasks()
        w = 640
        h = 480
        x = (self.root.winfo_screenwidth() // 2) - (w // 2)
        y = (self.root.winfo_screenheight() // 2) - (h // 2)
        self.root.geometry(f"{w}x{h}+{x}+{y}")

    def build_header(self):
        self.header_frame = tk.Frame(self.root, bg="#12161F", height=75)
        self.header_frame.pack(fill=tk.X, side=tk.TOP)

        self.header_title_label = tk.Label(
            self.header_frame,
            text=f"{APP_NAME} Kurulum Sihirbazı",
            font=("Segoe UI", 13, "bold"),
            fg="#F8FAFC",
            bg="#12161F"
        )
        self.header_title_label.place(x=25, y=14)

        self.header_desc_label = tk.Label(
            self.header_frame,
            text="Bağımsız Masaüstü POS & Otomatik Termal Fiş Yazıcı Sistemi",
            font=("Segoe UI", 9),
            fg="#94A3B8",
            bg="#12161F"
        )
        self.header_desc_label.place(x=25, y=40)

        # Indigo accent line
        self.accent_line = tk.Frame(self.root, bg="#4F46E5", height=2)
        self.accent_line.pack(fill=tk.X, side=tk.TOP)

    def build_footer(self):
        self.footer_line = tk.Frame(self.root, bg="#1E293B", height=1)
        self.footer_line.pack(fill=tk.X, side=tk.BOTTOM)

        self.footer_frame = tk.Frame(self.root, bg="#12161F", height=60)
        self.footer_frame.pack(fill=tk.X, side=tk.BOTTOM)

        self.cancel_btn = tk.Button(
            self.footer_frame,
            text="İptal",
            command=self.root.quit,
            font=("Segoe UI", 9),
            bg="#1E293B",
            fg="#E2E8F0",
            activebackground="#334155",
            activeforeground="#FFFFFF",
            relief=tk.FLAT,
            padx=16,
            pady=5,
            cursor="hand2"
        )
        self.cancel_btn.place(x=25, y=14)

        self.next_btn = tk.Button(
            self.footer_frame,
            text="İleri >",
            command=self.go_next,
            font=("Segoe UI", 9, "bold"),
            bg="#4F46E5",
            fg="#FFFFFF",
            activebackground="#4338CA",
            activeforeground="#FFFFFF",
            relief=tk.FLAT,
            padx=22,
            pady=5,
            cursor="hand2"
        )
        self.next_btn.place(x=525, y=14)

        self.back_btn = tk.Button(
            self.footer_frame,
            text="< Geri",
            command=self.go_back,
            font=("Segoe UI", 9),
            bg="#1E293B",
            fg="#E2E8F0",
            activebackground="#334155",
            activeforeground="#FFFFFF",
            relief=tk.FLAT,
            padx=16,
            pady=5,
            cursor="hand2"
        )
        self.back_btn.place(x=435, y=14)

    def clear_content(self):
        for widget in self.content_frame.winfo_children():
            widget.destroy()

    def update_free_space(self, *args):
        free_gb = get_free_space_gb(self.install_dir_var.get())
        self.free_space_var.set(f"Kullanılabilir Disk Alanı: {free_gb:.1f} GB (Gereken Alan: ~65 MB)")

    def browse_folder(self):
        chosen = filedialog.askdirectory(
            title="Kurulum Klasörünü Seçin",
            initialdir=self.install_dir_var.get()
        )
        if chosen:
            clean_path = os.path.join(chosen, APP_NAME) if not chosen.endswith(APP_NAME) else chosen
            self.install_dir_var.set(clean_path)
            self.update_free_space()

    def show_step(self, step):
        self.current_step = step
        self.clear_content()

        if step == 1:
            # STEP 1: WELCOME
            self.header_title_label.config(text=f"{APP_NAME} v{APP_VERSION} Kurulumu")
            self.header_desc_label.config(text="Kurulum Sihirbazına Hoş Geldiniz")
            self.back_btn.config(state=tk.DISABLED)
            self.next_btn.config(text="İleri >", state=tk.NORMAL)

            card = tk.Frame(self.content_frame, bg="#12161F", relief=tk.FLAT, bd=1)
            card.pack(fill=tk.BOTH, expand=True, pady=10)

            tk.Label(
                card,
                text="Bu sihirbaz, RestivAdisyon uygulamasını ve arka plan termal fiş yazıcı\nmotorunu bilgisayarınıza kuracaktır.",
                font=("Segoe UI", 10),
                fg="#E2E8F0",
                bg="#12161F",
                justify=tk.LEFT
            ).pack(anchor="w", padx=25, pady=(25, 15))

            features = [
                "• Gömülü yerel arayüz (Harici web sitesine gitmez, bağımsız çalışır)",
                "• Windows RAW ESC/POS CP857 Türkçe termal fiş dökümü ve kağıt kesme",
                "• Süper Admin, Kasa POS, Masa QR Menü ve Garson Terminali entegrasyonu",
                "• Masaüstü kısayolu oluşturarak tek tıkla kesintisiz erişim"
            ]

            for feat in features:
                tk.Label(
                    card,
                    text=feat,
                    font=("Segoe UI", 9),
                    fg="#94A3B8",
                    bg="#12161F"
                ).pack(anchor="w", padx=30, pady=3)

            tk.Label(
                card,
                text="Devam etmek için 'İleri' butonuna tıklayınız.",
                font=("Segoe UI", 9, "italic"),
                fg="#64748B",
                bg="#12161F"
            ).pack(anchor="w", padx=25, pady=(20, 15))

        elif step == 2:
            # STEP 2: INSTALLATION DIRECTORY
            self.header_title_label.config(text="Kurulum Hedef Konumu")
            self.header_desc_label.config(text="Uygulamanın kurulacağı sürücü ve klasörü seçin")
            self.back_btn.config(state=tk.NORMAL)
            self.next_btn.config(text="İleri >", state=tk.NORMAL)

            tk.Label(
                self.content_frame,
                text=f"{APP_NAME} aşağıdaki klasöre kurulacaktır. Farklı bir diske veya klasöre kurmak için 'Gözat' butonuna tıklayınız:",
                font=("Segoe UI", 9),
                fg="#CBD5E1",
                bg="#0B0F17",
                justify=tk.LEFT
            ).pack(anchor="w", pady=(5, 12))

            dir_box = tk.Frame(self.content_frame, bg="#0B0F17")
            dir_box.pack(fill=tk.X, pady=5)

            dir_entry = tk.Entry(
                dir_box,
                textvariable=self.install_dir_var,
                font=("Segoe UI", 9),
                bg="#12161F",
                fg="#F8FAFC",
                insertbackground="#FFFFFF",
                relief=tk.FLAT,
                bd=6
            )
            dir_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=4)

            browse_btn = tk.Button(
                dir_box,
                text="Gözat...",
                command=self.browse_folder,
                font=("Segoe UI", 9, "bold"),
                bg="#1E293B",
                fg="#E2E8F0",
                relief=tk.FLAT,
                padx=14,
                cursor="hand2"
            )
            browse_btn.pack(side=tk.RIGHT, padx=(10, 0))

            space_label = tk.Label(
                self.content_frame,
                textvariable=self.free_space_var,
                font=("Segoe UI", 9, "bold"),
                fg="#38BDF8",
                bg="#0B0F17"
            )
            space_label.pack(anchor="w", pady=(18, 0))

        elif step == 3:
            # STEP 3: ADDITIONAL OPTIONS & SHORTCUTS
            self.header_title_label.config(text="Ek Kısayol & Başlangıç Seçenekleri")
            self.header_desc_label.config(text="Masaüstü kısayolu ve başlangıç tercihlerini belirleyin")
            self.back_btn.config(state=tk.NORMAL)
            self.next_btn.config(text="Kurulumu Başlat", state=tk.NORMAL)

            tk.Label(
                self.content_frame,
                text="Kurulum sırasında oluşturulmasını istediğiniz ek kısayolları seçiniz:",
                font=("Segoe UI", 9),
                fg="#CBD5E1",
                bg="#0B0F17"
            ).pack(anchor="w", pady=(5, 15))

            opt_card = tk.Frame(self.content_frame, bg="#12161F", bd=1)
            opt_card.pack(fill=tk.BOTH, expand=True, pady=5)

            cb_style = {
                "font": ("Segoe UI", 9, "bold"),
                "fg": "#F8FAFC",
                "bg": "#12161F",
                "selectcolor": "#0B0F17",
                "activebackground": "#12161F",
                "activeforeground": "#FFFFFF"
            }

            tk.Checkbutton(
                opt_card,
                text="Masaüstünde Kısayol Oluştur (RestivAdisyon)",
                variable=self.shortcut_desktop_var,
                **cb_style
            ).pack(anchor="w", padx=20, pady=(20, 10))

            tk.Checkbutton(
                opt_card,
                text="Başlat Menüsü Programlar Listesine Ekle",
                variable=self.shortcut_startmenu_var,
                **cb_style
            ).pack(anchor="w", padx=20, pady=10)

            tk.Checkbutton(
                opt_card,
                text="Windows Başlangıcında Otomatik Başlat (Önerilen)",
                variable=self.shortcut_startup_var,
                **cb_style
            ).pack(anchor="w", padx=20, pady=10)

            tk.Label(
                opt_card,
                text="* Otomatik başlatma, sistem açıldığında sipariş fişlerini arka planda dinlemeyi sağlar.",
                font=("Segoe UI", 8, "italic"),
                fg="#64748B",
                bg="#12161F"
            ).pack(anchor="w", padx=25, pady=(5, 15))

        elif step == 4:
            # STEP 4: INSTALLATION PROGRESS
            self.header_title_label.config(text="Kuruluyor...")
            self.header_desc_label.config(text="Dosyalar kopyalanıyor ve sistem yapılandırılıyor")
            self.back_btn.config(state=tk.DISABLED)
            self.next_btn.config(state=tk.DISABLED)
            self.cancel_btn.config(state=tk.DISABLED)

            self.status_label = tk.Label(
                self.content_frame,
                text="Kuruluma başlanıyor...",
                font=("Segoe UI", 9),
                fg="#CBD5E1",
                bg="#0B0F17"
            )
            self.status_label.pack(anchor="w", pady=(30, 10))

            self.prog_bar = ttk.Progressbar(self.content_frame, orient="horizontal", mode="determinate", length=560)
            self.prog_bar.pack(fill=tk.X, pady=10)

            # Start installation in background thread
            threading.Thread(target=self.execute_installation, daemon=True).start()

        elif step == 5:
            # STEP 5: FINISH
            self.header_title_label.config(text="Kurulum Tamamlandı")
            self.header_desc_label.config(text="RestivAdisyon başarıyla bilgisayarınıza yüklendi")
            self.back_btn.config(state=tk.DISABLED)
            self.cancel_btn.config(state=tk.DISABLED)
            self.next_btn.config(text="Bitir", state=tk.NORMAL, bg="#059669")

            card = tk.Frame(self.content_frame, bg="#12161F", bd=1)
            card.pack(fill=tk.BOTH, expand=True, pady=10)

            tk.Label(
                card,
                text="Kurulum Başarıyla Tamamlandı!",
                font=("Segoe UI", 12, "bold"),
                fg="#34D399",
                bg="#12161F"
            ).pack(anchor="w", padx=25, pady=(25, 10))

            tk.Label(
                card,
                text=f"{APP_NAME} bilgisayarınıza başarıyla kuruldu ve masaüstü kısayolu oluşturuldu.\nArtık doğrudan masaüstündeki kısayola çift tıklayarak giriş yapabilirsiniz.",
                font=("Segoe UI", 9),
                fg="#CBD5E1",
                bg="#12161F",
                justify=tk.LEFT
            ).pack(anchor="w", padx=25, pady=(0, 20))

            cb_style = {
                "font": ("Segoe UI", 9, "bold"),
                "fg": "#F8FAFC",
                "bg": "#12161F",
                "selectcolor": "#0B0F17",
                "activebackground": "#12161F",
                "activeforeground": "#FFFFFF"
            }

            tk.Checkbutton(
                card,
                text=f"{APP_NAME}'u Şimdi Başlat",
                variable=self.launch_app_var,
                **cb_style
            ).pack(anchor="w", padx=25, pady=5)

            tk.Checkbutton(
                card,
                text="Resmi Kullanım Kılavuzunu Görüntüle (PDF)",
                variable=self.open_manual_var,
                **cb_style
            ).pack(anchor="w", padx=25, pady=5)

    def execute_installation(self):
        install_dir = os.path.abspath(self.install_dir_var.get())
        os.makedirs(install_dir, exist_ok=True)

        files_to_copy = [
            f"{APP_NAME}.exe",
            "Uninstall.exe",
            "RestivaAdisyon_Kilavuzu.pdf",
            "BENI_OKU.txt",
            "app_icon.ico"
        ]

        total_steps = len(files_to_copy) + 4
        current = 0

        # Copy Payload Files
        for fname in files_to_copy:
            current += 1
            src_path = os.path.join(self.payload_dir, fname)
            dst_path = os.path.join(install_dir, fname)
            
            self.root.after(0, self.update_progress, (current / total_steps) * 100, f"Kopyalanıyor: {fname}...")
            
            if os.path.exists(src_path):
                try:
                    shutil.copyfile(src_path, dst_path)
                except Exception as err:
                    print(f"Kopyalama uyarısı ({fname}):", err)
            else:
                # If running directly, check local desktop-app
                local_src = os.path.join(self.base_dir, fname)
                if os.path.exists(local_src):
                    try:
                        shutil.copyfile(local_src, dst_path)
                    except Exception:
                        pass
            time.sleep(0.1)

        # 1. Desktop Shortcut
        current += 1
        self.root.after(0, self.update_progress, (current / total_steps) * 100, "Masaüstü kısayolları oluşturuluyor...")
        target_exe = os.path.join(install_dir, f"{APP_NAME}.exe")
        icon_path = os.path.join(install_dir, "app_icon.ico")

        if self.shortcut_desktop_var.get():
            desktop_dir = os.path.join(os.environ.get("USERPROFILE", ""), "Desktop")
            onedrive_desktop = os.path.join(os.environ.get("USERPROFILE", ""), "OneDrive", "Masaüstü")
            
            create_shortcut(target_exe, os.path.join(desktop_dir, f"{APP_NAME}.lnk"), icon_path, install_dir, f"{APP_NAME} POS")
            if os.path.exists(os.path.join(os.environ.get("USERPROFILE", ""), "OneDrive")):
                create_shortcut(target_exe, os.path.join(onedrive_desktop, f"{APP_NAME}.lnk"), icon_path, install_dir, f"{APP_NAME} POS")

        # 2. Start Menu Shortcut
        current += 1
        self.root.after(0, self.update_progress, (current / total_steps) * 100, "Başlat menüsü yapılandırılıyor...")
        if self.shortcut_startmenu_var.get():
            start_menu_dir = os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs", APP_NAME)
            create_shortcut(target_exe, os.path.join(start_menu_dir, f"{APP_NAME}.lnk"), icon_path, install_dir, f"{APP_NAME} POS")
            create_shortcut(os.path.join(install_dir, "Uninstall.exe"), os.path.join(start_menu_dir, f"{APP_NAME} Kaldır.lnk"), icon_path, install_dir, "Kaldır")

        # 3. Startup Shortcut
        current += 1
        self.root.after(0, self.update_progress, (current / total_steps) * 100, "Başlangıç ayarları kaydediliyor...")
        if self.shortcut_startup_var.get():
            startup_dir = os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs", "Startup")
            create_shortcut(target_exe, os.path.join(startup_dir, f"{APP_NAME}.lnk"), icon_path, install_dir, f"{APP_NAME} POS")

        # 4. Registry Uninstall Entry
        current += 1
        self.root.after(0, self.update_progress, 100, "Kurulum tamamlandı.")
        register_uninstall_entry(install_dir)
        time.sleep(0.3)

        self.root.after(0, self.show_step, 5)

    def update_progress(self, percent, text):
        self.prog_bar['value'] = percent
        self.status_label.config(text=text)

    def go_next(self):
        if self.current_step == 1:
            self.show_step(2)
        elif self.current_step == 2:
            target = self.install_dir_var.get().strip()
            if not target:
                messagebox.showerror("Hata", "Lütfen geçerli bir kurulum klasörü seçiniz.")
                return
            self.show_step(3)
        elif self.current_step == 3:
            self.show_step(4)
        elif self.current_step == 5:
            # Finish action
            install_dir = os.path.abspath(self.install_dir_var.get())
            target_exe = os.path.join(install_dir, f"{APP_NAME}.exe")
            pdf_path = os.path.join(install_dir, "RestivaAdisyon_Kilavuzu.pdf")

            if self.open_manual_var.get() and os.path.exists(pdf_path):
                try:
                    os.startfile(pdf_path)
                except Exception:
                    pass

            if self.launch_app_var.get() and os.path.exists(target_exe):
                try:
                    subprocess.Popen([target_exe], cwd=install_dir)
                except Exception:
                    pass

            self.root.destroy()

    def go_back(self):
        if self.current_step == 2:
            self.show_step(1)
        elif self.current_step == 3:
            self.show_step(2)

def main():
    root = tk.Tk()
    try:
        icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app_icon.ico")
        if os.path.exists(icon_path):
            root.iconbitmap(icon_path)
    except Exception:
        pass
    app = SetupWizardApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
