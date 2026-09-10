# RESTIVADISYON — İLERLEME VE FAZ HARİTASI

================================================================================
ESAS VE TEMEL KURALLAR:
1. HER YENİ EKLENEN VEYA YÜRÜTÜLEN FAZ İÇİN `RESTIVADISYON_DESIGN_GUIDELINES.md` DOSYASININ
   OKUNMASI VE TÜM KURALLARINA (ÇİZGİSİZ DİZAYN, BORDER YASAĞI, #0C1017 VE #111622 RENK TONLARI,
   NO AI GLOW/NEON, İÇ İÇE KART YASAĞI, BUTON STANDARTLARI) EKSİKSİZ UYULMASI ZORUNLUDUR.
2. CANLIDA AKTİF ÇALIŞAN MÜŞTERİMİZ VARDIR.
   HİÇBİR İŞLEM KULLANICI "BAŞLA / KOD YAZ" DEMEDEN BAŞLATILAMAZ.
   TÜM İŞLEMLER ÖNCE YERELDE (LOCALHOST) YAPILIR, ANTIGRAVITY TARAFINDAN TARANIR VE
   KULLANICI TEST EDİP ONAY VERMEDEN CANLIYA ASLA AKTARILMAZ.
3. LOGO VE GÖRSEL KURALI (MUTLAK KURAL): Kullanıcı (Şehmus) açıkça istemediği sürece katiyen
   yeni logo üretilemez, eklenemez, oluşturulamaz veya değiştirilemez. Yalnızca canlıda/projede
   var olan orijinal logolar kullanılır.
4. KOD VE VERİTABANI GÜVENLİĞİ: Her gece 23:59'da tüm işletmelerin sipariş, adisyon, ciro ve
   menü verileri işletme bazlı olarak Google Drive (`G:\Drive'ım\RestivAdisyon_Bulut_Arsivi`)
   altına otomatik ve şifreli arşivlenir. Canlıdaki temel veriler (şifre, ayar vb.) asla silinmez.
5. Maddelerin başlıkların hemen önüne açılan parantezler içerisindeki notları bizzat ben yani
   Şehmus yazmıştır; o notlar daima esas alınmalı ve not içeriğine göre hareket edilmelidir.
================================================================================

- FAZ: QR MENÜ YÖNETİM PANELİ YENİLENMESİ (BÖLÜNMÜŞ PANEL & CANLI ÖNİZLEME)
  - Zorunlu Kural: Bu faza başlarken `RESTIVADISYON_DESIGN_GUIDELINES.md` okunması şarttır.
  - İkiye Bölünmüş Panel Mimarisi (Split Screen):
    - Sol Taraf (Yönetim & Yapılandırma Alanı):
      - Eylem Toggles: "Garson Çağır", "Hesap İste (Nakit / Kart)", "Masadan Sipariş Ver" açık/kapalı butonları.
      - Ürün ve Kategori Yönetimi: Yeni ürün/kategori ekleme, fiyat, açıklama ve porsiyon düzenleme.
      - Sıralama Düzeni: Kategorilerin ve yemeklerin menüdeki görüntülenme sırasını kolayca değiştirme (sıra no / sıralama kontrolü).
      - Görünürlük Ayarları: Hangi kategori veya ürünün panelde/QR menüde gözükeceğinin belirlenmesi.
      - Görsel Kütüphanesi (Medya Galerisi): Daha önce yüklenmiş veya URL ile girilmiş görsellerin bir havuzda tutulması, yeni bir yemek eklerken veya güncellerken bu kütüphaneden tek tıkla tekrar seçilebilmesi.
    - Sağ Taraf (Canlı Telefon Mockup & Önizleme):
      - Gerçekçi, kurumsal ve sınırları net bir akıllı telefon çerçevesi içerisinde müşterinin göreceği QR menünün anlık canlı önizlemesi.
      - Sol tarafta yapılan her değişiklik (başlık, renk, ürün sırası, buton açma/kapama) anında sağdaki telefon ekranında eşzamanlı render edilecek.
      - İşletme değişiklikleri kaydettiği anda önizlemede görüldüğü gibi anlık olarak işletmenin qr menüsüne render eder. Bunun için uygun bir yere değişiklikleri kaydet butonu olması şart.

- FAZ: POS FİRMALARI İŞ ORTAKLIĞI ARAŞTIRMASI & ENTEGRASYON STRATEJİSİ
  - Zorunlu Kural: Bu faza başlarken `RESTIVADISYON_DESIGN_GUIDELINES.md` okunması şarttır.
  - Kapsam:
    - Sanal POS Ortaklıkları (Masadan QR ile Online Kredi Kartı Ödemesi): PayTR, ParamPOS, İyzico, Sipay komisyon ve entegrasyon karşılaştırması.
    - Fiziki / Yeni Nesil Yazar Kasa POS Ortaklıkları (Garson el terminali & Kasa entegrasyonu): Ödeal, Hugin, Beko, Sipay Android POS entegrasyon imkanlarının değerlendirilmesi.
    - İşletmelere en düşük komisyon ve en sorunsuz donanım deneyimi sunacak çözümün seçilmesi.

- FAZ:(kayıt olma sayfası en sona aktarılmalı bu tür prototip işlemler için resticadisyon.org domaini üzerinden yeni sadece benim erişebileceğim bir domain açılmalı prototip önerilerini öncelikle bu domainden bana göstereceksin ardından işleme koyulup localde uygun olan alana derleyip render edip doğru domain ile bağlayacaksın uygun panele bağlayacaksın) İŞLETME KAYIT OLMA SAYFASI (REGISTER / ONBOARDING FLOW) DÜZENLEMESİ
  - Zorunlu Kural: Bu faza başlarken `RESTIVADISYON_DESIGN_GUIDELINES.md` okunması şarttır.
  - Hedef: Yeni işletmelerin sisteme zahmetsizce, kurumsal ve hızlı bir akışla kaydolabilmesi.
  - Düzenlemeler:
    - `.md` anayasasına uygun `#0C1017` zemin ve `#111622` yüzey uyumu, sıfır gereksiz input kirliliği.
    - İşletme Adı, Yetkili Kişi, Telefon, E-posta ve Şifre alanlarının sade ve tok tasarımı.
    - Kayıt sonrası doğrudan ilk kurulum sihirbazına (Masa sayısı, Kategori girişi) yumuşak geçiş.

- FAZ: MEVCUT CANLI MODÜL ANALİZİ, FİYATLANDIRMA PAKETLERİ & PAZARLAMA/REKLAM GÖRSELLERİ (EN SON SIRA)
  - Zorunlu Kural: Bu faza başlarken `RESTIVADISYON_DESIGN_GUIDELINES.md` okunması şarttır.
  - Mevcut Canlı Sistem Modüllerimiz:
    - 1. Canlı Kasa POS & Adisyon Yönetimi (Masa açma, parçalı tahsilat, iskonto, ikram, fiş kesme)
    - 2. Mutfak Ekranı (KDS - Kitchen Display System) (Sesli bildirim, hazırlık durumu takibi)
    - 3. Masa & Salon Yönetimi (Dinamik salon krokisi, masa taşıma/birleştirme)
    - 4. İnteraktif QR Menü & Masadan Sipariş (Garson çağırma, hesap isteme, sepet akışı)
    - 5. Garson El Terminali PWA (Mobil garson sipariş ve masa kontrol paneli)
    - 6. Stok, Gider & Maliyet Takibi (Kasa çıkışları, tedarikçi ve işletme masrafları)
    - 7. Ciro, Kasa & Gün Sonu Z-Raporları (Nakit/POS/Diğer ödeme kırılımları ve rapor yazdırma)
    - 8. Termal Fiş Yazıcı Entegrasyonu (Masaüstü .exe üzerinden sıfır onaylı sessiz yazdırma)
    - 9.(bu sistem canlıda olmamalı çünkü daha entegre sistemi kurulmadı bu not diikate alınmalı) Online Yemek Platformları (Trendyol Yemek, Yemeksepeti, GetirYemek, Migros Yemek entegrasyonu)
    - 10. Çoklu Personel & QR ile Hızlı Cihaz Eşleştirme (Rol bazlı yetkilendirme)
    - 11.(bu modül dha prototip aşamasında bu not dikkate alınarak render edilmemeli bilgim dahilinde bu modülle alakalı bir işlem yapılmamalı) Restiva AI Akıllı İşletme Asistanı (Satış ve menü analitiği)
    - 12. Canlı Destek & Ticket Sistemi (Görsel yüklemeli, doğrudan SuperAdmin iletişim hattı)
  - Fiyatlandırma ve Paket Modeli (Taslak Öneri):
    - Standart Paket (QR Menü & Masa Sipariş Odaklı): ~490 ₺ / Ay
    - Pro Paket (Adisyon + Mutfak KDS + Yazıcı + Garson Terminali): ~890 ₺ / Ay
    - Full Kurumsal Paket (Tüm Modüller + Yemek Platformları + Stok/Gider + AI Asistan): ~1.390 ₺ / Ay
  - Pazarlama & Reklam Görselleri:
    - `.md` anayasasına tam uyumlu (neon/glow/mor efekt içermeyen, gerçek kurumsal B2B restoran yazılımı hissi veren, keskin ve tok UI mockup'ları).
    - Sosyal medya, web sunumu ve broşür/satış sunumları için yüksek çözünürlüklü tanıtım görselleri.
