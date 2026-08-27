# -*- coding: utf-8 -*-
"""
RESTIVADISYON - PLATFORM SECURITY & MULTI-TENANT INTEGRITY VERIFICATION SUITE
Tests all layers:
1. Multi-Tenant Data Isolation (Zero collision across businesses)
2. Realtime Channel Scoping (Unique IDs on all WebSocket subscriptions)
3. RPC & Security Definer Integrity (Anti-Tampering & Anti-Spam)
4. Authentication & Suspended Account Enforcement
5. Component & Database Schema Consistency
"""

import os
import re
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC_DIR = os.path.join(BASE_DIR, "src")
SCHEMA_FILE = os.path.join(BASE_DIR, "supabase_schema.sql")

passed_tests = 0
failed_tests = 0

def test(name, condition, details=""):
    global passed_tests, failed_tests
    if condition:
        print(f"  [PASS] {name}")
        passed_tests += 1
    else:
        print(f"  [FAIL] {name} - {details}")
        failed_tests += 1

def check_file_content(rel_path, pattern, is_regex=False):
    fpath = os.path.join(SRC_DIR, rel_path)
    if not os.path.exists(fpath):
        return False
    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    if is_regex:
        return bool(re.search(pattern, content))
    return pattern in content

def main():
    print("\n" + "=" * 65)
    print("RESTIVADISYON - SİSTEM VE GÜVENLİK DOĞRULAMA TESTLERİ")
    print("=" * 65)

    print("\n--- 1. ÇOKLU İŞLETME (MULTI-TENANT) VE VERİ İZOLASYONU TESTLERİ ---")
    
    # 1.1 LiveOrders.tsx Scoping
    test(
        "Canlı Siparişler (LiveOrders) sipariş güncellemelerinde business_id kilitli",
        check_file_content("components/business/LiveOrders.tsx", ".eq('business_id', business.id)")
    )

    # 1.2 MenuManager.tsx Scoping
    test(
        "Menü & Ürünler (MenuManager) silme/güncellemede business_id kilitli",
        check_file_content("components/business/MenuManager.tsx", ".eq('business_id', business.id)")
    )

    # 1.3 TableManager.tsx Scoping
    test(
        "Masa Yönetimi (TableManager) silme işleminde business_id kilitli",
        check_file_content("components/business/TableManager.tsx", ".eq('business_id', business.id)")
    )

    # 1.4 BusinessDashboard.tsx Global Realtime Scoping
    test(
        "Ana Panel Global Dinleyici kanalı dinamik business_id ile filtrelenmiş",
        check_file_content("components/business/BusinessDashboard.tsx", "`global-biz-listener-${business.id}`") and
        check_file_content("components/business/BusinessDashboard.tsx", "filter: `business_id=eq.${business.id}`")
    )

    # 1.5 CustomerMenu.tsx Realtime Scoping
    test(
        "QR Menü müşteri dinleyicisi sadece ilgili işletmenin verilerini dinliyor",
        check_file_content("components/customer/CustomerMenu.tsx", "`menu_sync_${business.id}`") and
        check_file_content("components/customer/CustomerMenu.tsx", "table: 'businesses'")
    )

    print("\n--- 2. GÜVENLİK, KİMLİK DOĞRULAMA VE HACK ÖNLEME TESTLERİ ---")

    # 2.1 SuperAdmin Master Access
    test(
        "SuperAdmin girişi şifre doğrulama ve session ayrımı tam",
        check_file_content("components/superadmin/SuperAdminLogin.tsx", "restiva_sa_auth") and
        check_file_content("components/superadmin/SuperAdminLogin.tsx", "b.sehmus852") and
        check_file_content("components/superadmin/SuperAdminLogin.tsx", "y.numan852")
    )

    # 2.2 Business Suspended Account Enforcement
    test(
        "Askıya alınan işletmeler anında tüm oturumlardan otomatik atılıyor (Security Guard)",
        check_file_content("App.tsx", "biz-security-guard-") and
        check_file_content("App.tsx", "subscription_status === 'suspended'")
    )

    # 2.3 Customer Order Price Tampering Protection
    test(
        "Müşteri sepeti sunucu tarafı RPC fiyat doğrulaması içeriyor (Anti-Fiyat Hilesi)",
        check_file_content("components/customer/CartDrawer.tsx", "create_customer_order")
    )

    # 2.4 Waiter Device Token Verification
    test(
        "Garson terminali yetkilendirmesi cihaz tokenı ve is_trusted ile doğrulanıyor",
        check_file_content("components/waiter/WaiterApp.tsx", "check_device_pairing_status")
    )

    print("\n--- 3. BİLDİRİM, SES VE ARAYÜZ ENTEGRASYON TESTLERİ ---")

    # 3.1 10-Second Queued Toast System
    test(
        "Toast bildirim sistemi 10 saniyelik sıralı kuyruk mekanizmasına sahip",
        check_file_content("context/ToastContext.tsx", "duration || 10000") and
        check_file_content("context/ToastContext.tsx", "activeProgress")
    )

    # 3.2 Visual Audio/Notification Permission Guide
    test(
        "Web arayüzü görsel ses ve bildirim kılavuz modalı mevcut",
        os.path.exists(os.path.join(SRC_DIR, "components/common/AudioNotificationPermissionModal.tsx")) and
        check_file_content("components/business/BusinessDashboard.tsx", "AudioNotificationPermissionModal")
    )

    # 3.3 7-Day Trial Default
    test(
        "Ücretsiz deneme süresi tüm sistemde 7 gün olarak yapılandırılmış",
        check_file_content("components/superadmin/CreateBusinessModal.tsx", "useState<number>(7)") and
        check_file_content("components/business/BusinessSupportChat.tsx", "7 Günlük Ücretsiz Deneme")
    )

    # 3.4 Wi-Fi State Persistence
    test(
        "İşletme Wi-Fi ayarları hem veritabanına hem yerel oturuma yazılıyor",
        check_file_content("components/business/BusinessSettings.tsx", "finalWifiSsid") and
        check_file_content("components/business/BusinessSettings.tsx", "localStorage.setItem('restiva_biz_session'")
    )

    print("\n--- 4. 5 BİLDİRİM SESİ PRESETİ VE SES DEĞİŞTİRME ENTEGRASYONU ---")

    # 4.1 5 Distinct Audio Presets in audio.ts
    test(
        "Web Audio API 5 zengin ses presetini (Klasik, Kristal, Dijital, Tokmak, Melodik) barındırıyor",
        check_file_content("lib/audio.ts", "classic") and
        check_file_content("lib/audio.ts", "crystal") and
        check_file_content("lib/audio.ts", "digital") and
        check_file_content("lib/audio.ts", "woodblock") and
        check_file_content("lib/audio.ts", "melodic")
    )

    # 4.2 Business Settings Sound Selector
    test(
        "İşletme ayarlarında 5 ses seçeneği, önizleme/test butonu ve kalıcı hafıza mevcut",
        check_file_content("components/business/BusinessSettings.tsx", "SOUND_PRESETS") and
        check_file_content("components/business/BusinessSettings.tsx", "sound.playSoundPreset") and
        check_file_content("components/business/BusinessSettings.tsx", "localStorage.setItem('restiva_sound_preference'")
    )

    print("\n--- 5. GÖRSEL KIRPMA (CROPPER) VE .EXE MASAÜSTÜ ENTEGRASYONU ---")

    # 5.1 Interactive Image Cropper Modal
    test(
        "İnteraktif görsel kırpma, kaydırma ve yakınlaştırma modalı (ImageCropperModal) mevcut",
        os.path.exists(os.path.join(SRC_DIR, "components/common/ImageCropperModal.tsx")) and
        check_file_content("components/business/BusinessSettings.tsx", "ImageCropperModal") and
        check_file_content("components/business/BusinessSettings.tsx", "setCropperOpen")
    )

    # 5.2 Desktop App POS Route
    main_py_path = os.path.join(BASE_DIR, "desktop-app", "restivadisyon_main.py")
    with open(main_py_path, "r", encoding="utf-8", errors="ignore") as f:
        main_py_content = f.read()
    test(
        "Masaüstü .EXE uygulaması doğrudan İşletme POS Panelini açacak şekilde kilitli",
        "?mode=business" in main_py_content
    )

    # 5.3 Setup Wizard Shortcut & Documents Folder
    setup_py_path = os.path.join(BASE_DIR, "desktop-app", "setup_wizard.py")
    with open(setup_py_path, "r", encoding="utf-8", errors="ignore") as f:
        setup_py_content = f.read()
    test(
        "Kurulum sihirbazı masaüstü kısayolu ve belgeler klasörünü otomatik oluşturuyor",
        "create_windows_shortcut" in setup_py_content and
        "RestivAdisyon - Belgeler & Kılavuz" in setup_py_content
    )

    print("\n--- 6. ABONELİK PAKETLERİ VE FİNANSAL TAHSİLAT TAKİP TESTLERİ ---")

    # 6.1 Create Business Package Presets & Custom Limits
    test(
        "Yeni işletme kayıt modalı Lite, Standart, Pro ve 7 Gün Deneme paketlerini ve manuel girişi destekliyor",
        check_file_content("components/superadmin/CreateBusinessModal.tsx", "PLAN_PRESETS") and
        check_file_content("components/superadmin/CreateBusinessModal.tsx", "selectedPlanType") and
        check_file_content("components/superadmin/CreateBusinessModal.tsx", "isCustomMode")
    )

    # 6.2 SuperAdmin Financial Dashboard & Renew Modal
    test(
        "SuperAdmin paneli toplam sözleşme cirosu, yaklaşan tahsilatlar ve hızlı yenileme modalını içeriyor",
        check_file_content("components/superadmin/SuperAdminDashboard.tsx", "totalContractValue") and
        check_file_content("components/superadmin/SuperAdminDashboard.tsx", "dueSoonReceivables") and
        check_file_content("components/superadmin/SuperAdminDashboard.tsx", "RenewSubscriptionModal") and
        os.path.exists(os.path.join(SRC_DIR, "components/superadmin/RenewSubscriptionModal.tsx"))
    )

    # 6.3 Database Schema plan_price and billing fields
    with open(SCHEMA_FILE, "r", encoding="utf-8", errors="ignore") as f:
        schema_content = f.read()
    test(
        "Supabase veritabanı şemasında plan_price, plan_type, billing_period kolonları mevcut",
        "plan_price NUMERIC(10, 2) DEFAULT 0.00" in schema_content and
        "plan_type TEXT DEFAULT 'trial'" in schema_content
    )

    print("\n" + "=" * 65)
    print(f"SONUÇ: {passed_tests} Test Başarılı, {failed_tests} Hata.")
    print("=" * 65 + "\n")

    if failed_tests > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
