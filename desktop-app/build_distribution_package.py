# -*- coding: utf-8 -*-
"""
RESTIVADISYON - TEK PARÇA KURULUM SİHİRBAZI (ALL-IN-ONE SETUP WIZARD) ÜRETİCİSİ
- Resmi Vektör Logosu ile .ico ikon üretimi
- Resmi PDF Kılavuzu & Beni Oku belgesi
- Uninstall.exe (Temiz Kaldırıcı)
- RestivAdisyon.exe (Bağımsız POS & Arka Plan ESC/POS Yazıcı Motoru)
- RestivAdisyon_Kurulum.exe (Tüm bileşenleri içine gömen Tek Parça Windows Kurulum Sihirbazı)
"""

import sys
import os
import shutil
import subprocess

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DESKTOP_APP_DIR = os.path.join(BASE_DIR, "desktop-app")
DIST_DIR = os.path.join(BASE_DIR, "dist")
OUTPUT_PACKAGE_DIR = os.path.join(BASE_DIR, "RestivAdisyon-Kurulum-Paketi")
PAYLOAD_DIR = os.path.join(DESKTOP_APP_DIR, "payload")

def step(title):
    print(f"\n========================================================")
    print(f"[*] {title}")
    print(f"========================================================")

def main():
    step("1. Hazırlık ve Klasör Yapılandırması")
    os.makedirs(OUTPUT_PACKAGE_DIR, exist_ok=True)
    os.makedirs(DESKTOP_APP_DIR, exist_ok=True)
    os.makedirs(PAYLOAD_DIR, exist_ok=True)

    # 1. Official Logo Icon Generation
    icon_path = os.path.join(DESKTOP_APP_DIR, "app_icon.ico")
    subprocess.run([sys.executable, os.path.join(DESKTOP_APP_DIR, "generate_icon.py")], check=True)
    shutil.copyfile(icon_path, os.path.join(PAYLOAD_DIR, "app_icon.ico"))

    # 2. PDF Guide Generation
    step("2. Resmi PDF Kullanım Kılavuzu Üretimi")
    pdf_temp = os.path.join(DESKTOP_APP_DIR, "RestivaAdisyon_Kilavuzu.pdf")
    subprocess.run([sys.executable, os.path.join(DESKTOP_APP_DIR, "generate_pdf_manual.py")], check=True)
    shutil.copyfile(pdf_temp, os.path.join(PAYLOAD_DIR, "RestivaAdisyon_Kilavuzu.pdf"))
    print(f"[OK] Kılavuz payload klasörüne eklendi -> {os.path.join(PAYLOAD_DIR, 'RestivaAdisyon_Kilavuzu.pdf')}")

    # 3. Copy BENI_OKU.txt
    step("3. BENI_OKU.txt Dosyası Hazırlığı")
    beni_oku_src = os.path.join(DESKTOP_APP_DIR, "BENI_OKU.txt")
    shutil.copyfile(beni_oku_src, os.path.join(PAYLOAD_DIR, "BENI_OKU.txt"))
    print(f"[OK] BENI_OKU.txt payload klasörüne eklendi -> {os.path.join(PAYLOAD_DIR, 'BENI_OKU.txt')}")

    # 4. Compile Uninstall.exe
    step("4. Uninstall.exe (Temiz Kaldırıcı) Derleniyor")
    uninstaller_py = os.path.join(DESKTOP_APP_DIR, "uninstaller.py")
    uninst_cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--windowed",
        f"--icon={icon_path}",
        "--name=Uninstall",
        f"--distpath={PAYLOAD_DIR}",
        uninstaller_py
    ]
    subprocess.run(uninst_cmd, check=True)
    print(f"[OK] Uninstall.exe derlendi -> {os.path.join(PAYLOAD_DIR, 'Uninstall.exe')}")

    # 5. Compile RestivAdisyon.exe (Embedded Assets)
    step("5. RestivAdisyon.exe (Gömülü Arayüz & ESC/POS Motoru) Derleniyor")
    main_py = os.path.join(DESKTOP_APP_DIR, "restivadisyon_main.py")
    add_data_arg = f"{DIST_DIR};web_dist"

    pos_cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--windowed",
        f"--icon={icon_path}",
        f"--add-data={add_data_arg}",
        "--name=RestivAdisyon",
        f"--distpath={PAYLOAD_DIR}",
        "--hidden-import=webview.platforms.winforms",
        "--hidden-import=webview.platforms.edgechromium",
        "--hidden-import=websocket",
        "--hidden-import=urllib.request",
        "--hidden-import=mimetypes",
        main_py
    ]
    subprocess.run(pos_cmd, check=True)
    print(f"[OK] RestivAdisyon.exe derlendi -> {os.path.join(PAYLOAD_DIR, 'RestivAdisyon.exe')}")

    # 6. Compile RestivAdisyon_Kurulum.exe (All-In-One Setup Wizard)
    step("6. RestivAdisyon_Kurulum.exe (Tek Parça Kurulum Sihirbazı) Derleniyor")
    setup_py = os.path.join(DESKTOP_APP_DIR, "setup_wizard.py")
    payload_arg = f"{PAYLOAD_DIR};payload"

    setup_cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--windowed",
        "--uac-admin",
        f"--icon={icon_path}",
        f"--add-data={payload_arg}",
        "--name=RestivAdisyon_Kurulum",
        f"--distpath={OUTPUT_PACKAGE_DIR}",
        setup_py
    ]
    subprocess.run(setup_cmd, check=True)
    setup_exe = os.path.join(OUTPUT_PACKAGE_DIR, "RestivAdisyon_Kurulum.exe")
    print(f"[OK] RestivAdisyon_Kurulum.exe derlendi -> {setup_exe}")

    # 7. Verification & Easy Access Copy
    step("7. Kurulum Dosyası Doğrulaması & Kopyalama")
    if os.path.exists(setup_exe):
        size_mb = os.path.getsize(setup_exe) / (1024 * 1024)
        
        # Proje ana klasörüne de kopyala
        root_exe = os.path.join(BASE_DIR, "RestivAdisyon_Kurulum.exe")
        shutil.copyfile(setup_exe, root_exe)
        
        # Masaüstüne de kopyala (varsa)
        desktop_dir = os.path.join(os.path.expanduser("~"), "Desktop")
        onedrive_desktop = os.path.join(os.path.expanduser("~"), "OneDrive", "Masaüstü")
        if os.path.exists(onedrive_desktop):
            try:
                shutil.copyfile(setup_exe, os.path.join(onedrive_desktop, "RestivAdisyon_Kurulum.exe"))
            except Exception:
                pass
        elif os.path.exists(desktop_dir):
            try:
                shutil.copyfile(setup_exe, os.path.join(desktop_dir, "RestivAdisyon_Kurulum.exe"))
            except Exception:
                pass

        print(f"\n[BAŞARILI] Tek Parça Kurulum Sihirbazı Eksiksiz Olarak Üretildi:")
        print(f"1. Paket Klasörü: {setup_exe} ({size_mb:.2f} MB)")
        print(f"2. Ana Proje Klasörü: {root_exe}")
        print(f"3. Masaüstü: RestivAdisyon_Kurulum.exe")
    else:
        print(f"[HATA] Kurulum dosyası üretilemedi!")
        sys.exit(1)

if __name__ == "__main__":
    main()
