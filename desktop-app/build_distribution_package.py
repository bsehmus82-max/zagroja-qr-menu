# -*- coding: utf-8 -*-
"""
RESTIVADISYON - DAĞITIM PAKETİ & KURULUM SİHİRBAZI ÜRETİCİSİ
- Resmi Vektör Logosu ile .ico ikon üretimi
- Resmi PDF Kılavuzu & Beni Oku belgesi
- Uninstall.exe (Temiz Kaldırıcı)
- RestivAdisyon.exe (Bağımsız POS & Arka Plan ESC/POS Yazıcı Motoru)
- RestivAdisyon_Kurulum.exe (Disk Seçimi, Kısayol ve Otomatik Başlangıç Sihirbazı)
"""

import sys
import os
import shutil
import subprocess

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DESKTOP_APP_DIR = os.path.join(BASE_DIR, "desktop-app")
DIST_DIR = os.path.join(BASE_DIR, "dist")
OUTPUT_PACKAGE_DIR = os.path.join(DIST_DIR, "RestivAdisyon-Paket")
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
    shutil.copyfile(icon_path, os.path.join(OUTPUT_PACKAGE_DIR, "app_icon.ico"))
    shutil.copyfile(icon_path, os.path.join(PAYLOAD_DIR, "app_icon.ico"))

    # 2. PDF Guide Generation
    step("2. Resmi PDF Kullanım Kılavuzu Üretimi")
    pdf_out = os.path.join(OUTPUT_PACKAGE_DIR, "RestivaAdisyon_Kilavuzu.pdf")
    subprocess.run([sys.executable, os.path.join(DESKTOP_APP_DIR, "generate_pdf_manual.py")], check=True)
    shutil.copyfile(os.path.join(DESKTOP_APP_DIR, "RestivaAdisyon_Kilavuzu.pdf"), pdf_out)
    shutil.copyfile(pdf_out, os.path.join(PAYLOAD_DIR, "RestivaAdisyon_Kilavuzu.pdf"))
    print(f"[OK] Kılavuz kopyalandı -> {pdf_out}")

    # 3. Copy BENI_OKU.txt
    step("3. BENI_OKU.txt Dosyası Hazırlığı")
    beni_oku_src = os.path.join(DESKTOP_APP_DIR, "BENI_OKU.txt")
    beni_oku_dst = os.path.join(OUTPUT_PACKAGE_DIR, "BENI_OKU.txt")
    shutil.copyfile(beni_oku_src, beni_oku_dst)
    shutil.copyfile(beni_oku_src, os.path.join(PAYLOAD_DIR, "BENI_OKU.txt"))
    print(f"[OK] BENI_OKU.txt kopyalandı -> {beni_oku_dst}")

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
        f"--distpath={OUTPUT_PACKAGE_DIR}",
        uninstaller_py
    ]
    subprocess.run(uninst_cmd, check=True)
    uninst_exe = os.path.join(OUTPUT_PACKAGE_DIR, "Uninstall.exe")
    shutil.copyfile(uninst_exe, os.path.join(PAYLOAD_DIR, "Uninstall.exe"))
    print(f"[OK] Uninstall.exe derlendi -> {uninst_exe}")

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
        f"--distpath={OUTPUT_PACKAGE_DIR}",
        "--hidden-import=webview.platforms.winforms",
        "--hidden-import=webview.platforms.edgechromium",
        "--hidden-import=websocket",
        "--hidden-import=urllib.request",
        "--hidden-import=mimetypes",
        main_py
    ]
    subprocess.run(pos_cmd, check=True)
    app_exe = os.path.join(OUTPUT_PACKAGE_DIR, "RestivAdisyon.exe")
    shutil.copyfile(app_exe, os.path.join(PAYLOAD_DIR, "RestivAdisyon.exe"))
    print(f"[OK] RestivAdisyon.exe derlendi -> {app_exe}")

    # 6. Compile RestivAdisyon_Kurulum.exe (Setup Wizard Installer)
    step("6. RestivAdisyon_Kurulum.exe (Kurulum Sihirbazı & Kısayol Oluşturucu) Derleniyor")
    setup_py = os.path.join(DESKTOP_APP_DIR, "setup_wizard.py")
    payload_arg = f"{PAYLOAD_DIR};payload"

    setup_cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--windowed",
        f"--icon={icon_path}",
        f"--add-data={payload_arg}",
        "--name=RestivAdisyon_Kurulum",
        f"--distpath={OUTPUT_PACKAGE_DIR}",
        setup_py
    ]
    subprocess.run(setup_cmd, check=True)
    setup_exe = os.path.join(OUTPUT_PACKAGE_DIR, "RestivAdisyon_Kurulum.exe")
    print(f"[OK] RestivAdisyon_Kurulum.exe derlendi -> {setup_exe}")

    # 7. Verification
    step("7. Dağıtım Paketi Doğrulaması (Verification)")
    expected_files = [
        "RestivAdisyon_Kurulum.exe",
        "RestivAdisyon.exe",
        "BENI_OKU.txt",
        "RestivaAdisyon_Kilavuzu.pdf",
        "Uninstall.exe",
        "app_icon.ico"
    ]

    all_ok = True
    for fname in expected_files:
        fpath = os.path.join(OUTPUT_PACKAGE_DIR, fname)
        if os.path.exists(fpath):
            size_mb = os.path.getsize(fpath) / (1024 * 1024)
            size_kb = os.path.getsize(fpath) / 1024
            if size_mb >= 1.0:
                print(f"[MEVCUT] {fname} ({size_mb:.2f} MB)")
            else:
                print(f"[MEVCUT] {fname} ({size_kb:.1f} KB)")
        else:
            print(f"[HATA] Eksik dosya: {fname}")
            all_ok = False

    if all_ok:
        print(f"\n[BAŞARILI] RestivAdisyon-Paket ve Kurulum Sihirbazı eksiksiz olarak oluşturuldu:")
        print(f"Klasör Konumu: {OUTPUT_PACKAGE_DIR}")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
