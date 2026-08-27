# -*- coding: utf-8 -*-
"""
RESTIVADISYON - DAĞITIM PAKETİ (DISTRIBUTION BUNDLE) ÜRETİCİSİ
Tüm 4 bileşeni derler, birleştirir ve 'dist/RestivAdisyon-Paket' klasöründe hazır hale getirir.
"""

import sys
import os
import shutil
import subprocess

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DESKTOP_APP_DIR = os.path.join(BASE_DIR, "desktop-app")
DIST_DIR = os.path.join(BASE_DIR, "dist")
OUTPUT_PACKAGE_DIR = os.path.join(DIST_DIR, "RestivAdisyon-Paket")

def step(title):
    print(f"\n========================================================")
    print(f"[*] {title}")
    print(f"========================================================")

def main():
    step("1. Hazırlık ve Klasör Yapılandırması")
    os.makedirs(OUTPUT_PACKAGE_DIR, exist_ok=True)
    os.makedirs(DESKTOP_APP_DIR, exist_ok=True)

    # 1. Icon Generation
    icon_path = os.path.join(DESKTOP_APP_DIR, "app_icon.ico")
    if not os.path.exists(icon_path):
        subprocess.run([sys.executable, os.path.join(DESKTOP_APP_DIR, "generate_icon.py")], check=True)

    # 2. PDF Guide Generation
    step("2. Resmi PDF Kullanım Kılavuzu Üretimi")
    pdf_out = os.path.join(OUTPUT_PACKAGE_DIR, "RestivaAdisyon_Kilavuzu.pdf")
    subprocess.run([sys.executable, os.path.join(DESKTOP_APP_DIR, "generate_pdf_manual.py")], check=True)
    shutil.copyfile(os.path.join(DESKTOP_APP_DIR, "RestivaAdisyon_Kilavuzu.pdf"), pdf_out)
    print(f"[OK] Kılavuz kopyalandı -> {pdf_out}")

    # 3. Copy BENI_OKU.txt
    step("3. BENI_OKU.txt Dosyası Hazırlığı")
    beni_oku_src = os.path.join(DESKTOP_APP_DIR, "BENI_OKU.txt")
    beni_oku_dst = os.path.join(OUTPUT_PACKAGE_DIR, "BENI_OKU.txt")
    shutil.copyfile(beni_oku_src, beni_oku_dst)
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
    print(f"[OK] Uninstall.exe derlendi -> {os.path.join(OUTPUT_PACKAGE_DIR, 'Uninstall.exe')}")

    # 5. Compile RestivAdisyon.exe (Embedded Assets)
    step("5. RestivAdisyon.exe (Gömülü Arayüz & ESC/POS Motoru) Derleniyor")
    main_py = os.path.join(DESKTOP_APP_DIR, "restivadisyon_main.py")
    
    # Path to static dist folder (excluding RestivAdisyon-Paket to avoid circular nesting)
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
    print(f"[OK] RestivAdisyon.exe derlendi -> {os.path.join(OUTPUT_PACKAGE_DIR, 'RestivAdisyon.exe')}")

    # 6. Verification
    step("6. Dağıtım Paketi Doğrulaması (Verification)")
    expected_files = [
        "RestivAdisyon.exe",
        "BENI_OKU.txt",
        "RestivaAdisyon_Kilavuzu.pdf",
        "Uninstall.exe"
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
        print(f"\n[BAŞARILI] RestivAdisyon-Paket eksiksiz olarak oluşturuldu:")
        print(f"Klasör Konumu: {OUTPUT_PACKAGE_DIR}")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
