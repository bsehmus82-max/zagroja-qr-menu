# -*- coding: utf-8 -*-
"""
RESTIVADISYON - PROFESYONEL WINDOWS KURULUM SİHİRBAZI (SETUP WIZARD)
- Otomatik Kurulum Dizini: C:\\Program Files\\RestivAdisyon
- Gelişmiş Modern Wizard UI (DPI Duyarlı, Sabit Buton Yerleşimi)
- Masaüstü Kısayolu + Masaüstü 'RestivAdisyon - Belgeler & Kılavuz' Klasörü
- Windows Program Ekle/Kaldır (Uninstall Registry) Entegrasyonu
- Başlat Menüsü ve Başlangıçta Otomatik Başlatma Seçenekleri
"""

import sys
import os
import shutil
import subprocess
import threading
import time
import winreg
import ctypes
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

# Enable DPI Awareness for crisp fonts on Windows 10/11
try:
    ctypes.windll.shcore.SetProcessDpiAwareness(1)
except Exception:
    try:
        ctypes.windll.user32.SetProcessDPIAware()
    except Exception:
        pass

APP_NAME = "RestivAdisyon"
APP_DISPLAY_NAME = "RestivAdisyon POS & Adisyon Sistemi"
APP_VERSION = "2.0.0"
APP_PUBLISHER = "RestivAdisyon"

def get_default_install_dir():
    program_files = os.environ.get("ProgramFiles", r"C:\Program Files")
    return os.path.join(program_files, APP_NAME)

def get_all_desktop_folders():
    folders = []
    # 1. Active desktop from registry (Handles OneDrive & localized Desktop)
    try:
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER, 
            r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders"
        )
        val, _ = winreg.QueryValueEx(key, "Desktop")
        expanded = os.path.expandvars(val)
        if os.path.exists(expanded) and expanded not in folders:
            folders.append(expanded)
        winreg.CloseKey(key)
    except Exception:
        pass

    # 2. Known standard paths fallback
    u = os.environ.get("USERPROFILE", "")
    for sub in [
        os.path.join(u, "OneDrive", "Masaüstü"),
        os.path.join(u, "OneDrive", "Desktop"),
        os.path.join(u, "Masaüstü"),
        os.path.join(u, "Desktop"),
    ]:
        if os.path.exists(sub) and sub not in folders:
            folders.append(sub)

    return folders

def get_free_space_gb(folder):
    try:
        drive = os.path.splitdrive(os.path.abspath(folder))[0] or "C:"
        usage = shutil.disk_usage(drive)
        return usage.free / (1024 ** 3)
    except Exception:
        return 50.0

def create_windows_shortcut(target, link_path, icon_path="", working_dir="", description=""):
    try:
        os.makedirs(os.path.dirname(link_path), exist_ok=True)
        vbs_lines = [
            'Set oWS = CreateObject("WScript.Shell")',
            f'Set oLink = oWS.CreateShortcut("{link_path}")',
            f'oLink.TargetPath = "{target}"',
            f'oLink.WorkingDirectory = "{working_dir or os.path.dirname(target)}"',
            f'oLink.Description = "{description}"'
        ]
        if icon_path and os.path.exists(icon_path):
            vbs_lines.append(f'oLink.IconLocation = "{icon_path},0"')
        vbs_lines.append('oLink.Save')

        vbs_content = "\r\n".join(vbs_lines)
        temp_vbs = os.path.join(os.environ.get("TEMP", "."), f"lnk_{int(time.time()*1000)}.vbs")
        with open(temp_vbs, "w", encoding="cp1254", errors="ignore") as f:
            f.write(vbs_content)

        subprocess.run(
            ["cscript", "//nologo", temp_vbs],
            check=False,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )
        try:
            os.remove(temp_vbs)
        except Exception:
            pass
        return os.path.exists(link_path)
    except Exception:
        return False

def register_uninstall_entry(install_dir):
    try:
        reg_path = f"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{APP_NAME}"
        key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, reg_path)
        
        target_exe = os.path.join(install_dir, f"{APP_NAME}.exe")
        uninstall_exe = os.path.join(install_dir, "Uninstall.exe")
        icon_path = os.path.join(install_dir, "app_icon.ico")
        
        winreg.SetValueEx(key, "DisplayName", 0, winreg.REG_SZ, APP_DISPLAY_NAME)
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
        self.root.geometry("640x490")
        self.root.minsize(640, 490)
        self.root.resizable(False, False)
        self.root.configure(bg="#0B0F17")

        # Center on screen
        self.center_window()

        # State Variables
        self.install_dir_var = tk.StringVar(value=get_default_install_dir())
        self.shortcut_desktop_var = tk.BooleanVar(value=True)
        self.shortcut_desktop_docs_var = tk.BooleanVar(value=True)
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
            self.payload_dir = os.path.join(self.base_dir, "payload")

        if not os.path.exists(self.payload_dir):
            self.payload_dir = self.base_dir

        self.update_free_space()

        # Build Fixed Header & Footer
        self.build_header()
        self.build_footer()
        
        # Content Container (Scrollable or dynamic)
        self.content_frame = tk.Frame(self.root, bg="#0B0F17")
        self.content_frame.pack(fill=tk.BOTH, expand=True, padx=25, pady=10)

        # Show initial step
        self.show_step(1)

    def center_window(self):
        self.root.update_idletasks()
        w = 640
        h = 490
        x = (self.root.winfo_screenwidth() // 2) - (w // 2)
        y = (self.root.winfo_screenheight() // 2) - (h // 2)
        self.root.geometry(f"{w}x{h}+{x}+{y}")

    def build_header(self):
        self.header_frame = tk.Frame(self.root, bg="#111827", height=80)
        self.header_frame.pack(fill=tk.X, side=tk.TOP)
        self.header_frame.pack_propagate(False)

        header_inner = tk.Frame(self.header_frame, bg="#111827")
        header_inner.pack(fill=tk.BOTH, expand=True, padx=25, pady=15)

        self.header_title_label = tk.Label(
            header_inner,
            text=f"{APP_NAME} Kurulum Sihirbazı",
            font=("Segoe UI", 12, "bold"),
            fg="#F8FAFC",
            bg="#111827",
            anchor="w"
        )
        self.header_title_label.pack(fill=tk.X)

        self.header_desc_label = tk.Label(
            header_inner,
            text="Bağımsız Masaüstü POS & Otomatik Termal Fiş Yazıcı Sistemi",
            font=("Segoe UI", 9),
            fg="#94A3B8",
            bg="#111827",
            anchor="w"
        )
        self.header_desc_label.pack(fill=tk.X, pady=(2, 0))

        # Indigo accent border line
        self.accent_line = tk.Frame(self.root, bg="#4F46E5", height=2)
        self.accent_line.pack(fill=tk.X, side=tk.TOP)

    def build_footer(self):
        # Footer container stuck at bottom
        self.footer_container = tk.Frame(self.root, bg="#111827", height=65)
        self.footer_container.pack(fill=tk.X, side=tk.BOTTOM)
        self.footer_container.pack_propagate(False)

        self.footer_line = tk.Frame(self.root, bg="#1E293B", height=1)
        self.footer_line.pack(fill=tk.X, side=tk.BOTTOM)

        footer_inner = tk.Frame(self.footer_container, bg="#111827")
        footer_inner.pack(fill=tk.BOTH, expand=True, padx=25, pady=12)

        # Left: Cancel
        self.cancel_btn = tk.Button(
            footer_inner,
            text="İptal",
            command=self.root.quit,
            font=("Segoe UI", 9),
            bg="#1E293B",
            fg="#E2E8F0",
            activebackground="#334155",
            activeforeground="#FFFFFF",
            relief=tk.FLAT,
            padx=18,
            pady=5,
            cursor="hand2"
        )
        self.cancel_btn.pack(side=tk.LEFT)

        # Right: Next & Back
        self.next_btn = tk.Button(
            footer_inner,
            text="İleri >",
            command=self.go_next,
            font=("Segoe UI", 9, "bold"),
            bg="#4F46E5",
            fg="#FFFFFF",
            activebackground="#4338CA",
            activeforeground="#FFFFFF",
            relief=tk.FLAT,
            padx=24,
            pady=5,
            cursor="hand2"
        )
        self.next_btn.pack(side=tk.RIGHT)

        self.back_btn = tk.Button(
            footer_inner,
            text="< Geri",
            command=self.go_back,
            font=("Segoe UI", 9),
            bg="#1E293B",
            fg="#E2E8F0",
            activebackground="#334155",
            activeforeground="#FFFFFF",
            relief=tk.FLAT,
            padx=18,
            pady=5,
            cursor="hand2"
        )
        self.back_btn.pack(side=tk.RIGHT, padx=(0, 10))

    def clear_content(self):
        for widget in self.content_frame.winfo_children():
            widget.destroy()

    def update_free_space(self, *args):
        free_gb = get_free_space_gb(self.install_dir_var.get())
        self.free_space_var.set(f"Hedef Sürücü Boş Alanı: {free_gb:.1f} GB (Gereken: ~65 MB)")

    def browse_folder(self):
        chosen = filedialog.askdirectory(
            title="Kurulum Klasörünü Seçin",
            initialdir=os.path.dirname(self.install_dir_var.get())
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
            self.header_title_label.config(text=f"{APP_NAME} v{APP_VERSION} Kurulumuna Hoş Geldiniz")
            self.header_desc_label.config(text="Sistem bileşenleri ve masaüstü kısayolları hazırlanıyor")
            self.back_btn.config(state=tk.DISABLED)
            self.next_btn.config(text="İleri >", state=tk.NORMAL, bg="#4F46E5")

            card = tk.Frame(self.content_frame, bg="#111827", padx=20, pady=18)
            card.pack(fill=tk.BOTH, expand=True)

            tk.Label(
                card,
                text="Bu sihirbaz, RestivAdisyon Bağımsız POS ve Otomatik Yazıcı Motorunu\nbilgisayarınıza güvenle kuracaktır.",
                font=("Segoe UI", 10),
                fg="#E2E8F0",
                bg="#111827",
                justify=tk.LEFT
            ).pack(anchor="w", pady=(0, 15))

            features = [
                "• SSD / Program Files dizinine yerel ve hızlı kurulum",
                "• Windows ESC/POS RAW CP857 Türkçe termal fiş dökümü ve kağıt kesme",
                "• Masaüstüne logolu ana kısayol ve 'Belgeler & Kılavuz' klasörü oluşturma",
                "• Tek tıkla çalışma: Kurulumdan sonra yükleme dosyasına gerek kalmaz"
            ]

            for feat in features:
                tk.Label(
                    card,
                    text=feat,
                    font=("Segoe UI", 9),
                    fg="#94A3B8",
                    bg="#111827"
                ).pack(anchor="w", pady=3)

            tk.Label(
                card,
                text="Kuruluma devam etmek için lütfen 'İleri' butonuna tıklayınız.",
                font=("Segoe UI", 9, "italic"),
                fg="#64748B",
                bg="#111827"
            ).pack(anchor="w", pady=(15, 0))

        elif step == 2:
            # STEP 2: INSTALLATION DIRECTORY
            self.header_title_label.config(text="Kurulum Hedef Konumu")
            self.header_desc_label.config(text="Uygulamanın kurulacağı SSD / Program Files dizini")
            self.back_btn.config(state=tk.NORMAL)
            self.next_btn.config(text="İleri >", state=tk.NORMAL, bg="#4F46E5")

            card = tk.Frame(self.content_frame, bg="#111827", padx=20, pady=18)
            card.pack(fill=tk.BOTH, expand=True)

            tk.Label(
                card,
                text=f"{APP_NAME} varsayılan olarak aşağıdaki 'Program Files' klasörüne kurulacaktır.\nFarklı bir diske (D:, E: vb.) kurmak isterseniz 'Gözat' butonunu kullanabilirsiniz:",
                font=("Segoe UI", 9),
                fg="#CBD5E1",
                bg="#111827",
                justify=tk.LEFT
            ).pack(anchor="w", pady=(0, 12))

            dir_box = tk.Frame(card, bg="#111827")
            dir_box.pack(fill=tk.X, pady=5)

            dir_entry = tk.Entry(
                dir_box,
                textvariable=self.install_dir_var,
                font=("Segoe UI", 9),
                bg="#0B0F17",
                fg="#F8FAFC",
                insertbackground="#FFFFFF",
                relief=tk.FLAT,
                bd=6
            )
            dir_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=3)

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
                card,
                textvariable=self.free_space_var,
                font=("Segoe UI", 9, "bold"),
                fg="#38BDF8",
                bg="#111827"
            )
            space_label.pack(anchor="w", pady=(15, 0))

        elif step == 3:
            # STEP 3: SHORTCUTS & OPTIONS
            self.header_title_label.config(text="Masaüstü & Kısayol Seçenekleri")
            self.header_desc_label.config(text="Masaüstü simgesi ve başlangıç tercihlerini belirleyin")
            self.back_btn.config(state=tk.NORMAL)
            self.next_btn.config(text="Kurulumu Başlat", state=tk.NORMAL, bg="#4F46E5")

            card = tk.Frame(self.content_frame, bg="#111827", padx=20, pady=18)
            card.pack(fill=tk.BOTH, expand=True)

            tk.Label(
                card,
                text="Kurulum sırasında oluşturulacak kısayol ve klasörleri seçiniz:",
                font=("Segoe UI", 9),
                fg="#CBD5E1",
                bg="#111827"
            ).pack(anchor="w", pady=(0, 10))

            cb_style = {
                "font": ("Segoe UI", 9, "bold"),
                "fg": "#F8FAFC",
                "bg": "#111827",
                "selectcolor": "#0B0F17",
                "activebackground": "#111827",
                "activeforeground": "#FFFFFF"
            }

            tk.Checkbutton(
                card,
                text="Masaüstünde 'RestivAdisyon' Ana Kısayolu Oluştur",
                variable=self.shortcut_desktop_var,
                **cb_style
            ).pack(anchor="w", pady=4)

            tk.Checkbutton(
                card,
                text="Masaüstünde 'RestivAdisyon - Belgeler & Kılavuz' Klasörü Oluştur (PDF & Kılavuzlar)",
                variable=self.shortcut_desktop_docs_var,
                **cb_style
            ).pack(anchor="w", pady=4)

            tk.Checkbutton(
                card,
                text="Başlat Menüsü Programlar Listesine Ekle",
                variable=self.shortcut_startmenu_var,
                **cb_style
            ).pack(anchor="w", pady=4)

            tk.Checkbutton(
                card,
                text="Windows Başlangıcında Otomatik Başlat (Önerilen)",
                variable=self.shortcut_startup_var,
                **cb_style
            ).pack(anchor="w", pady=4)

            tk.Label(
                card,
                text="* Otomatik başlatma, sistem açıldığında sipariş fişlerini arka planda dinlemeyi sağlar.",
                font=("Segoe UI", 8, "italic"),
                fg="#64748B",
                bg="#111827"
            ).pack(anchor="w", pady=(8, 0))

        elif step == 4:
            # STEP 4: PROGRESS
            self.header_title_label.config(text="Yükleniyor...")
            self.header_desc_label.config(text="Dosyalar kopyalanıyor ve sistem yapılandırılıyor")
            self.back_btn.config(state=tk.DISABLED)
            self.next_btn.config(state=tk.DISABLED)
            self.cancel_btn.config(state=tk.DISABLED)

            card = tk.Frame(self.content_frame, bg="#111827", padx=20, pady=25)
            card.pack(fill=tk.BOTH, expand=True)

            self.status_label = tk.Label(
                card,
                text="Kuruluma başlanıyor...",
                font=("Segoe UI", 9),
                fg="#CBD5E1",
                bg="#111827"
            )
            self.status_label.pack(anchor="w", pady=(10, 10))

            self.prog_bar = ttk.Progressbar(card, orient="horizontal", mode="determinate", length=540)
            self.prog_bar.pack(fill=tk.X, pady=10)

            threading.Thread(target=self.execute_installation, daemon=True).start()

        elif step == 5:
            # STEP 5: FINISH
            self.header_title_label.config(text="Kurulum Başarıyla Tamamlandı")
            self.header_desc_label.config(text="RestivAdisyon bilgisayarınıza hazırlandı")
            self.back_btn.config(state=tk.DISABLED)
            self.cancel_btn.config(state=tk.DISABLED)
            self.next_btn.config(text="Bitir", state=tk.NORMAL, bg="#059669")

            card = tk.Frame(self.content_frame, bg="#111827", padx=20, pady=18)
            card.pack(fill=tk.BOTH, expand=True)

            tk.Label(
                card,
                text="Tebrikler! Kurulum Başarıyla Tamamlandı.",
                font=("Segoe UI", 11, "bold"),
                fg="#34D399",
                bg="#111827"
            ).pack(anchor="w", pady=(0, 10))

            tk.Label(
                card,
                text=f"{APP_NAME} başarıyla Program Files dizinine kuruldu.\nMasaüstünüze resmi logolu 'RestivAdisyon' kısayolu ve 'Belgeler & Kılavuz' klasörü eklendi.\nArtık doğrudan masaüstünden tek tıkla kullanabilirsiniz.",
                font=("Segoe UI", 9),
                fg="#CBD5E1",
                bg="#111827",
                justify=tk.LEFT
            ).pack(anchor="w", pady=(0, 15))

            cb_style = {
                "font": ("Segoe UI", 9, "bold"),
                "fg": "#F8FAFC",
                "bg": "#111827",
                "selectcolor": "#0B0F17",
                "activebackground": "#111827",
                "activeforeground": "#FFFFFF"
            }

            tk.Checkbutton(
                card,
                text=f"{APP_NAME}'u Şimdi Başlat",
                variable=self.launch_app_var,
                **cb_style
            ).pack(anchor="w", pady=4)

            tk.Checkbutton(
                card,
                text="Resmi Kullanım Kılavuzunu Görüntüle (PDF)",
                variable=self.open_manual_var,
                **cb_style
            ).pack(anchor="w", pady=4)

    def execute_installation(self):
        install_dir = os.path.abspath(self.install_dir_var.get())
        try:
            os.makedirs(install_dir, exist_ok=True)
        except Exception as e:
            # Fallback to local appdata if Program Files permission issue
            fallback_dir = os.path.join(os.environ.get("LOCALAPPDATA", os.path.expanduser("~")), "Programs", APP_NAME)
            try:
                os.makedirs(fallback_dir, exist_ok=True)
                install_dir = fallback_dir
                self.install_dir_var.set(install_dir)
            except Exception:
                pass

        files_to_copy = [
            f"{APP_NAME}.exe",
            "Uninstall.exe",
            "RestivaAdisyon_Kilavuzu.pdf",
            "BENI_OKU.txt",
            "app_icon.ico"
        ]

        total_steps = len(files_to_copy) + 4
        current = 0

        # 1. Copy Files to Installation Directory
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
                local_src = os.path.join(self.base_dir, fname)
                if os.path.exists(local_src):
                    try:
                        shutil.copyfile(local_src, dst_path)
                    except Exception:
                        pass
            time.sleep(0.08)

        target_exe = os.path.join(install_dir, f"{APP_NAME}.exe")
        icon_path = os.path.join(install_dir, "app_icon.ico")
        pdf_path = os.path.join(install_dir, "RestivaAdisyon_Kilavuzu.pdf")
        txt_path = os.path.join(install_dir, "BENI_OKU.txt")
        uninst_exe = os.path.join(install_dir, "Uninstall.exe")

        # 2. Desktop Shortcuts & Documents Folder
        current += 1
        self.root.after(0, self.update_progress, (current / total_steps) * 100, "Masaüstü kısayolları ve belgeler klasörü oluşturuluyor...")
        
        desktop_folders = get_all_desktop_folders()
        for d in desktop_folders:
            # 2.1 Main Desktop Shortcut
            if self.shortcut_desktop_var.get():
                main_lnk = os.path.join(d, f"{APP_NAME}.lnk")
                create_windows_shortcut(target_exe, main_lnk, icon_path, install_dir, APP_DISPLAY_NAME)

            # 2.2 Desktop Documents Folder
            if self.shortcut_desktop_docs_var.get():
                docs_folder = os.path.join(d, f"{APP_NAME} - Belgeler & Kılavuz")
                try:
                    os.makedirs(docs_folder, exist_ok=True)
                    if os.path.exists(pdf_path):
                        shutil.copyfile(pdf_path, os.path.join(docs_folder, "RestivaAdisyon_Kilavuzu.pdf"))
                    if os.path.exists(txt_path):
                        shutil.copyfile(txt_path, os.path.join(docs_folder, "BENI_OKU.txt"))
                    # Inner shortcuts
                    create_windows_shortcut(target_exe, os.path.join(docs_folder, f"{APP_NAME} Başlat.lnk"), icon_path, install_dir, APP_DISPLAY_NAME)
                    create_windows_shortcut(uninst_exe, os.path.join(docs_folder, f"{APP_NAME} Kaldır (Uninstall).lnk"), icon_path, install_dir, "Kaldır")
                except Exception:
                    pass

        # 3. Start Menu Shortcuts
        current += 1
        self.root.after(0, self.update_progress, (current / total_steps) * 100, "Başlat menüsü yapılandırılıyor...")
        if self.shortcut_startmenu_var.get():
            start_menu_dir = os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs", APP_NAME)
            create_windows_shortcut(target_exe, os.path.join(start_menu_dir, f"{APP_NAME}.lnk"), icon_path, install_dir, APP_DISPLAY_NAME)
            create_windows_shortcut(uninst_exe, os.path.join(start_menu_dir, f"{APP_NAME} Kaldır.lnk"), icon_path, install_dir, "Kaldır")

        # 4. Windows Startup
        current += 1
        self.root.after(0, self.update_progress, (current / total_steps) * 100, "Başlangıç ayarları kaydediliyor...")
        if self.shortcut_startup_var.get():
            startup_dir = os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs", "Startup")
            create_windows_shortcut(target_exe, os.path.join(startup_dir, f"{APP_NAME}.lnk"), icon_path, install_dir, APP_DISPLAY_NAME)

        # 5. Registry Uninstall Entry
        register_uninstall_entry(install_dir)
        self.root.after(0, self.update_progress, 100, "Kurulum tamamlandı.")
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
