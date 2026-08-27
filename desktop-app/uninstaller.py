# -*- coding: utf-8 -*-
"""
RESTIVADISYON - TEK TIKLA TEMİZ KALDIRMA ARACI (UNINSTALLER)
- Açık olan RestivAdisyon.exe süreçlerini sonlandırır (taskkill)
- %APPDATA% ve %LOCALAPPDATA% altındaki oturum, önbellek ve veri dosyalarını temizler
- Masaüstü ve Başlat Menüsü kısayollarını siler
- Temizleme tamamlandığında bilgilendirme mesajı görüntüler
"""

import sys
import os
import shutil
import subprocess
import ctypes

def kill_process(proc_name):
    try:
        subprocess.run(["taskkill", "/F", "/IM", proc_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

def show_message_box(title, text, is_error=False):
    # Win32 MessageBoxW: MB_OK (0x00) | MB_ICONINFORMATION (0x40) or MB_ICONWARNING (0x30)
    icon_flag = 0x10 if is_error else 0x40
    user32 = ctypes.WinDLL("user32")
    user32.MessageBoxW(None, text, title, 0x00 | icon_flag)

def main():
    # 1. Kill running processes
    kill_process("RestivAdisyon.exe")
    kill_process("RestivaPOS.exe")
    kill_process("RestivaAdisyonYazici.exe")

    # 2. Cleanup AppData and LocalAppData
    appdata = os.environ.get("APPDATA", "")
    localappdata = os.environ.get("LOCALAPPDATA", "")
    userprofile = os.environ.get("USERPROFILE", "")

    dirs_to_remove = [
        os.path.join(appdata, "RestivAdisyon"),
        os.path.join(localappdata, "RestivAdisyon"),
        os.path.join(appdata, "RestivaPOS"),
        os.path.join(appdata, "RestivaAdisyon"),
        os.path.join(localappdata, "RestivaPOS"),
    ]

    for d in dirs_to_remove:
        if d and os.path.exists(d):
            try:
                shutil.rmtree(d, ignore_errors=True)
            except Exception:
                pass

    # 3. Cleanup Shortcuts
    desktop_dir = os.path.join(userprofile, "Desktop")
    onedrive_desktop = os.path.join(userprofile, "OneDrive", "Masaüstü")
    start_menu_dir = os.path.join(appdata, "Microsoft", "Windows", "Start Menu", "Programs")

    shortcuts = [
        os.path.join(desktop_dir, "RestivAdisyon.lnk"),
        os.path.join(onedrive_desktop, "RestivAdisyon.lnk"),
        os.path.join(desktop_dir, "RestivaPOS.lnk"),
        os.path.join(onedrive_desktop, "RestivaPOS.lnk"),
        os.path.join(start_menu_dir, "RestivAdisyon.lnk"),
    ]

    for sc in shortcuts:
        if sc and os.path.exists(sc):
            try:
                os.remove(sc)
            except Exception:
                pass

    # 4. Display confirmation
    show_message_box(
        "RestivAdisyon Kaldırma Sihirbazı",
        "Restiva Adisyon başarıyla kaldırıldı.\nTüm yerel oturum, önbellek ve kısayol dosyaları temizlendi."
    )

if __name__ == "__main__":
    main()
