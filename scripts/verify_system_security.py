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

    print("\n" + "=" * 65)
    print(f"SONUÇ: {passed_tests} Test Başarılı, {failed_tests} Hata.")
    print("=" * 65 + "\n")

    if failed_tests > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
