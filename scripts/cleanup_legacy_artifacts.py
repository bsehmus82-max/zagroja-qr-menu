# -*- coding: utf-8 -*-
"""
Safe Cleanup Script for Legacy and Unused Test Artifacts
- Removes legacy .spec files in root
- Removes obsolete test binaries (RestivaPOS.exe, old print-agent .exe)
- Cleans obsolete pyinstaller build caches
- Cleans old test installations if any
"""
import os
import shutil
import glob

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def cleanup():
    print("=== RestivAdisyon Legacy Artifact Cleanup ===")
    
    # 1. Obsolete root .spec files
    spec_files = glob.glob(os.path.join(PROJECT_ROOT, "*.spec"))
    for f in spec_files:
        try:
            os.remove(f)
            print(f"[REMOVED] Spec file: {os.path.basename(f)}")
        except Exception as e:
            print(f"[SKIP] {f}: {e}")

    # 2. Obsolete build directory
    build_dir = os.path.join(PROJECT_ROOT, "build")
    if os.path.exists(build_dir):
        try:
            shutil.rmtree(build_dir, ignore_errors=True)
            print("[REMOVED] Legacy build directory: build/")
        except Exception as e:
            print(f"[SKIP] build dir: {e}")

    # 3. Obsolete test binaries in desktop-app
    legacy_files = [
        os.path.join(PROJECT_ROOT, "desktop-app", "RestivaPOS.exe"),
        os.path.join(PROJECT_ROOT, "desktop-app", "restiva_pos_app.py"),
        os.path.join(PROJECT_ROOT, "print-agent", "RestivaAdisyonYazici.exe"),
    ]
    for f in legacy_files:
        if os.path.exists(f):
            try:
                os.remove(f)
                print(f"[REMOVED] Legacy file: {os.path.relpath(f, PROJECT_ROOT)}")
            except Exception as e:
                print(f"[SKIP] {f}: {e}")

    # 4. Clean AppData temp caches for RestivAdisyon if needed
    appdata = os.environ.get("APPDATA", "")
    if appdata:
        test_cache = os.path.join(appdata, "RestivAdisyon", "temp")
        if os.path.exists(test_cache):
            try:
                shutil.rmtree(test_cache, ignore_errors=True)
                print("[REMOVED] Old AppData temp cache")
            except Exception:
                pass

    print("[SUCCESS] Cleanup completed successfully.")

if __name__ == "__main__":
    cleanup()
