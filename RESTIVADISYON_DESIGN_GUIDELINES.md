RESTIVADISYON

DESIGN CONSTITUTION & NON-NEGOTIABLE UI RULES

«STATUS: CRITICAL / MANDATORY — CANLIDA AKTİF MÜŞTERİLERİMİZ VAR

Bu belge RestivAdisyon'un tüm kullanıcı arayüzleri, bileşenleri, sayfaları, modalları, panelleri, butonları, kartları, formları, navigasyonları, mimarisi ve görsel etkileşimleri için bağlayıcı tasarım ve çalışma anayasasıdır.

Bu dosya bizim TEMEL TAŞIMIZ, MİMARİMİZ VE KİMLİĞİMİZDİR.
HER İŞLEME BAŞLAMADAN ÖNCE BU DOSYANIN OKUNMASI KESİN VE NET BİR KURALDIR.

Bu kurallar birer "öneri" değildir.
Antigravity herhangi bir frontend, backend veya UI/UX değişikliği yaparken bu dosyadaki kurallara her zaman ve her seferinde uymak ZORUNDADIR.»

---

0. CANLIDA AKTİF MÜŞTERİLER VE ÇALIŞMA PRENSİBİ (PRODUCTION WORKFLOW)

1. RestivAdisyon artık sadece bir demo değil; canlıda (production) aktif olarak çalışan, sipariş alan ve operasyon yürüten gerçek işletmelerin/müşterilerin kullandığı profesyonel bir sistemdir.
2. Canlıdaki bir işletmenin operasyonunun (kasa, mutfak, adisyon, yazdırma, sipariş akışı) aksamaması hayati önem taşır. Bu sebeple iş ciddiyeti en üst seviyededir.
3. KESİN ÇALIŞMA DÖNGÜSÜ:
   - Kullanıcı "kod yaz / işlem yap" demediği sürece kesinlikle kod yazmaya başlanmaz, önce talep ve mimari tartışılır.
   - Tüm geliştirmeler ve düzeltmeler önce YERELDE (Localhost:5173 / Local Electron) yapılır.
   - Antigravity kodları ve build durumunu (`npm run build`, lint, type check) tarar ve doğrular.
   - Kullanıcı yerelde test eder ve onay verir.
   - Kullanıcı açık onay vermeden canlıya (production/master) hiçbir kod veya sürüm aktarılamaz.
4. Bu dosya her işlemin başlangıcında okunur, revize edilen kurallar anayasa hükmündedir.
5. KOD GÜVENLİĞİ VE YEDEKLEME KURALI: Kodlar ve kritik dosyalar sadece tek bir yerel cihazda tutulamaz; cihaz arızası, çalınma, donanım kaybı risklerine karşı her kritik aşamada ve onaylanan her sürümde uzak depolara (GitHub Remote / Bulut Yedekleme) güvenle yedeklenmelidir.
6. LOGO VE GÖRSEL KURALI (MUTLAK KURAL): Kullanıcı (Şehmus) açıkça talimat vermediği sürece katiyen yeni bir logo üretilemez, tasarlanamaz, eklenemez veya var olan logo değiştirilemez. Yalnızca projede ve canlı sistemde halihazırda bulunan orijinal/resmi logolar kullanılabilir.

---

1. TEMEL TASARIM FELSEFESİ

RestivAdisyon bir:

- AI demo sitesi,
- yapay zekâ landing page'i,
- startup showcase,
- SaaS template'i,
- oyun arayüzü,
- sosyal medya uygulaması,
- kripto dashboard'u,
- neon teknoloji paneli

DEĞİLDİR.

RestivAdisyon;

restoran, kafe, pastane ve benzeri işletmelerin günlük operasyonlarını yönetmesine yardımcı olan profesyonel bir ticari yazılım sistemidir.

Sistem;

- adisyon,
- canlı sipariş,
- masa yönetimi,
- garson işlemleri,
- menü yönetimi,
- stok,
- gider,
- ciro,
- yazıcı,
- QR menü,
- müşteri işlemleri,
- yemek platformları,
- işletme ayarları,
- AI destekli yönetim

gibi gerçek operasyonel süreçleri yönetir.

Bu nedenle arayüzün temel amacı:

«Gösterişli görünmek değil, profesyonel, güvenilir, hızlı, anlaşılır ve operasyon sırasında kullanılabilir olmak.»

---

2. EN ÖNEMLİ KURAL — KULLANICI TALİMATININ DIŞINA ÇIKMA

Antigravity, kullanıcı tarafından açıkça belirtilmeyen yeni bir UI davranışı, buton, kart, menü, aksiyon, özellik veya görsel öğe EKLEYEMEZ.

Örnek:

Kullanıcı:

«"Bu sayfaya sipariş filtreleme ekle."»

diyorsa yalnızca gerekli filtreleme deneyimi oluşturulmalıdır.

Bunun yanında:

- "Filtreleri kaydet"
- "Favorilere ekle"
- "Akıllı filtre"
- "AI ile filtrele"
- "Filtre geçmişi"
- "Hızlı filtre önerileri"

gibi kullanıcı tarafından istenmeyen özellikler EKLENMEMELİDİR.

---

3. KULLANICI İSTEMEDİKÇE YENİ BUTON EKLEME

Bu sistemde en sık yapılabilecek AI hatalarından biri gereksiz buton üretmektir.

MUTLAK KURAL

Kullanıcı istemediği sürece yeni buton oluşturma.

Bir butonun gerçekten gerekli olduğundan emin değilsen:

BUTON EKLEME.

Bir aksiyon mevcut bir UI elemanının içine mantıklı şekilde dahil edilebiliyorsa yeni bir buton oluşturma.

Her butonun sistem içerisinde gerçek bir operasyonel amacı olmalıdır.

Yasak örnekler:

- "Explore"
- "Learn More"
- "Get Started"
- "AI Magic"
- "Optimize"
- "Smart Action"
- "Quick Action"
- "View Insights"
- "Discover"
- "Generate"
- "Improve"

gibi pazarlama / demo hissi veren gereksiz aksiyonlar.

---

4. BELİRSİZLİK DURUMUNDA TAHMİN ETME — KULLANICIYA SOR

Antigravity bir talimatı:

- anlayamıyorsa,
- birden fazla şekilde yorumlanabiliyorsa,
- mevcut mimariyle çelişiyorsa,
- tasarım kararının kullanıcı niyetini değiştirme ihtimali varsa,
- yapılması gereken UI davranışı açık değilse,

kendi kararını vermemelidir.

Kullanıcıya soru sormalıdır.

Örnek:

Kullanıcı:

«"Buraya hızlı işlem ekle."»

Antigravity şunları kendi kafasına göre seçmemelidir:

- floating button,
- dropdown,
- modal,
- toolbar,
- yeni panel,
- üç nokta menüsü.

Bunun yerine açıklama istemelidir:

«"Hızlı işlem için buton mu, dropdown mu yoksa mevcut toolbar içerisine aksiyon mu istiyorsunuz?"»

---

5. MANTIKSAL OLARAK HATALI BİR TALEP GELİRSE

Kullanıcı tarafından verilen talimat mevcut sistem mantığı açısından sorunluysa sessizce yanlış uygulama yapılmamalıdır.

Antigravity:

1. Problemi tespit etmeli.
2. Neden problem olduğunu kısa şekilde açıklamalı.
3. Kullanıcıya alternatif sunmalı.
4. Kullanıcı onaylamadan mimariyi değiştirmemelidir.

Örnek:

«"Bu butonu her sipariş kartına koy."»

Eğer aynı işlem zaten kartın mevcut menüsünde varsa:

«"Bu işlem zaten kart menüsünde mevcut. Aynı aksiyonu ikinci kez eklemek arayüzü gereksiz kalabalıklaştırabilir. Ayrı buton olarak yine de eklememi ister misiniz?"»

şeklinde sorulmalıdır.

---

6. AI ESTETİĞİ KESİNLİKLE İSTENMİYOR

RestivAdisyon'un arayüzü AI tarafından oluşturulmuş gibi görünmemelidir.

Aşağıdaki estetik anlayışlardan kaçınılmalıdır:

- aşırı gradient,
- neon renkler,
- parlak mor,
- parlak mavi,
- cyan glow,
- RGB ışık efektleri,
- büyük renkli gradient yazılar,
- aşırı glassmorphism,
- aşırı blur,
- sürekli glow,
- gereksiz ışık efektleri,
- holographic görünüm,
- futuristic dashboard görünümü,
- aşırı yuvarlak kartlar,
- oyuncak benzeri UI,
- Dribbble showcase tarzı tasarım,
- AI SaaS template görünümü.

RestivAdisyon gerçek bir ticari işletme yazılımı gibi görünmelidir.

---

7. RENK KURALI

Sistemin mevcut renk paleti korunmalıdır.

Mevcut tasarım sisteminde tanımlanan renklerin dışında yeni bir ana renk paleti oluşturulamaz.

Mevcut temel palet:

Background

"#0C1017"

Main Surface

"#111622"

Secondary Surface

"#141A26"

Additional Surface

"#161E2E"

Hover / Elevated Surface

"#1C2433"

Additional Elevated Surface

"#253043"

Primary Button

"#FFFFFF"

Primary Button Text

"#0F172A"

---

8. YENİ RENK ÜRETME YASAĞI

Antigravity;

"tasarım daha güzel olsun",

"kontrast artsın",

"modern görünsün",

"AI hissi versin",

"kartlar birbirinden ayrılsın"

gibi gerekçelerle kendi başına yeni renkler üretemez.

Özellikle:

- neon mor,
- neon pembe,
- neon mavi,
- cyan,
- lime,
- parlak turuncu,
- gradient mor/mavi,
- gradient pembe/turuncu

gibi renkler kullanılmamalıdır.

Bir renk durum göstergesi için gerçekten gerekiyorsa mevcut tasarım diline uygun minimum kullanım tercih edilmelidir.

---

9. GRADIENT KULLANIMI

Gradient kullanımı varsayılan olarak YASAKTIR.

Özellikle:

- buton gradientleri,
- kart gradientleri,
- başlık gradientleri,
- background gradientleri,
- AI gradientleri,
- glow gradientleri

kullanılmamalıdır.

Gradient ancak kullanıcı açıkça talep ederse kullanılabilir.

---

10. NEON VE GLOW YASAĞI

Neon estetik kesinlikle kullanılmayacaktır.

Yasak:

- neon border,
- neon button,
- neon text,
- glow card,
- glowing icon,
- RGB shadow,
- luminous border,
- excessive box-shadow,
- colored aura.

Sistem profesyonel bir operasyon panelidir.

Cyberpunk / futuristic / gaming UI estetiği kullanılmayacaktır.

---

10.1. KUTU, BUTON VE KART KENARLARINDA ÇİZGİ / BORDER KESİNLİKLE YASAKTIR

Katiyen kutu, buton, kart, panel, form veya input kenarlarında belirgin/farklı renkli çizgi (border / outline) kullanılmayacaktır.

- Bütün paneller, kartlar ve butonlar tamamen ÇİZGİSİZ (borderless) olmalıdır.
- Katman ve hiyerarşi derinliği sadece ve sadece arka plan renk tonları (`#0C1017` zemin, `#111622` ana kart, `#141A26` ikincil alan, `#1C2433` buton/hover, `#FFFFFF` birincil buton) ile sağlanmalıdır.
- Ayrıştırma için yapay border çizgileri çizilmeyecek; geniş, tok, keskin ve kurumsal bloklar tercih edilecektir.
- Birbiriyle doğrudan ilişkili yönetim alanları (örneğin Personeller ve Eşleşen Cihazlar) gereksiz tab / sekme karmaşasına bölünmeden tek ekranda, derli toplu ve geniş kartlar halinde sunulacaktır.

10.2. İKONLARI KUTU / KART İÇİNE HAPSETME YASAĞI (NESTED ICON BOXES FORBIDDEN)

Kartların, ayar satırlarının ve butonların içinde ikonları ayrıca `w-10 h-10 bg-[#1C2433] rounded-2xl` gibi yapay mini kutucuklara / kapsüllere hapsetmek KESİNLİKLE YASAKTIR.

- İkon doğrudan başlığın veya metnin yanında (`w-4 h-4 text-slate-400 shrink-0`) sade ve kurumsal bir hiyerarşide yer almalıdır.
- İç içe kutu kirliliği (`Card -> Box -> Badge -> Button`) arayüzü kalabalıklaştırır ve ciddiyetini bozar.
- Ayar satırlarında sadece sol başta yalın ikon ve başlık, sağ başta ise doğrudan eylem butonu veya switch yer almalıdır.

---

11. KÖŞE YUVARLATMA — AŞIRI ROUNDED TASARIM YASAK

RestivAdisyon'da her şeyi kapsül veya baloncuk haline getirmek yasaktır.

Özellikle:

- aşırı yuvarlak butonlar,
- pill-shaped butonlar,
- büyük radiuslu kartlar,
- tamamen yuvarlatılmış inputlar,
- kapsül şeklinde navigation elemanları

kullanılmamalıdır.

Tasarım karakteri:

Keskin / kontrollü / kurumsal / teknik / profesyonel

olmalıdır.

Border-radius kullanılabilir ancak ölçülü kullanılmalıdır.

Bir UI elementinin yuvarlatılmış olması onu otomatik olarak daha modern yapmaz.

---

12. BUTON TASARIMI VE AŞIRI BEYAZLIK YASAĞI

Butonlar:

- sade,
- net,
- kompakt,
- profesyonel,
- işlev odaklı

olmalıdır.

12.1. AŞIRI BEYAZ VE PARLAK BUTON YASAĞI (NO FLASHBANG BUTTONS)

Koyu arayüz zemininde göz alan, kontrastı patlatan saf beyaz (`bg-white`) butonlar veya saf beyaz aktif switch'ler KULLANILMAYACAKTIR.

- Tüm butonlar ve kontroller `#1C2433` zemin, hover durumunda `#253043`, metin rengi `#E2E8F0` / `#FFFFFF` veya kurumsal slate tonları ile tasarlanacaktır.
- Switch ve toggle kontrollerinde aktif durumda saf beyaz yerine `#253043` zemin ve `bg-slate-200` gösterge kullanılacaktır.
- Butonların altına "Windows 11 uyumlu", "64-bit Installer" gibi gereksiz marketing alt yazıları KESİNLİKLE yazılmayacaktır.
- Ayar satırlarının yanına gereksiz yeşil/mavi durum rozetleri (`Aktif`, `Sıfır Onaylı` vb.) eklenmeyecektir.

Butonlarda:

- aşırı radius,
- gradient,
- glow,
- büyük padding,
- gereksiz ikon,
- dekoratif efekt

kullanılmamalıdır.

Bir buton yalnızca gerçekten bir aksiyon gerçekleştiriyorsa bulunmalıdır.

---

13. HER ŞEY KART OLMAK ZORUNDA DEĞİL

AI tarafından oluşturulan arayüzlerde sık görülen problem:

«Her bilgiyi bir card içerisine koymak.»

RestivAdisyon'da bu yapılmayacaktır.

Bir içerik zaten sayfanın doğal akışı içerisinde anlaşılabiliyorsa ayrıca kart içine alınmamalıdır.

Gereksiz:

Card → Card → Card → Card

yerine gerektiğinde:

- düz içerik alanı,
- divider,
- tablo,
- liste,
- toolbar,
- section,
- inline control

kullanılmalıdır.

---

14. BOŞLUK VE HİYERARŞİ

Profesyonel görünüm büyük boşluklar oluşturarak sağlanmamalıdır.

Her bölümün:

- bilgi yoğunluğu,
- kullanım sıklığı,
- önem seviyesi,
- ekran boyutu

dikkate alınmalıdır.

RestivAdisyon bir marketing website değildir.

Kullanıcı aynı ekranda çok sayıda operasyonel bilgi görebilmelidir.

Bilgi yoğunluğu gerektiğinde yüksek olabilir.

---

15. DASHBOARD TASARIMI

Dashboard'da kullanıcıyı görsel efektlerle etkilemeye çalışmak yerine bilgi hızlı şekilde okunabilir olmalıdır.

Öncelik:

1. kritik operasyon,
2. aktif sipariş,
3. bekleyen işlem,
4. finansal bilgi,
5. sistem durumu,
6. ikincil bilgiler.

Her metrik için ayrı devasa kart oluşturulmamalıdır.

---

16. İKON KURALLARI

Sistemde ikonografi için mevcut:

Lucide React

kullanılmalıdır.

Yeni ikon kütüphanesi eklenmemelidir.

İkonlar:

- işlevsel,
- sade,
- tutarlı

olmalıdır.

Dekoratif ikon kullanımı sınırlandırılmalıdır.

Bir ikon sadece "güzel görünüyor" diye eklenmemelidir.

---

17. EMOJI KULLANIMI

UI içerisinde emoji kullanımı YASAKTIR.

Özellikle:

- başlıklar,
- butonlar,
- menüler,
- dashboard kartları,
- navigation,
- modal başlıkları,
- bildirimler

içerisinde emoji kullanılmayacaktır.

Örnek:

❌ "🍔 Siparişler"

❌ "💰 Ciro"

❌ "🤖 AI Asistan"

❌ "⚡ Hızlı İşlemler"

Bunlar yerine profesyonel tipografi ve Lucide ikonografisi kullanılmalıdır.

---

18. AI KOMPONENTLERİ DE AI GİBİ GÖRÜNMEMELİ

RestivAdisyon'da AI Copilot bulunmasına rağmen AI bölümü:

- neon,
- mor gradient,
- parlayan yıldızlar,
- magic wand,
- hologram,
- glowing border,
- büyük AI animasyonları

ile tasarlanmamalıdır.

AI sistemin bir parçasıdır.

Sistemin tamamından ayrı bir "AI showcase" gibi görünmemelidir.

---

19. AI MASCOT

"RestivaAiMascot.tsx" mevcut sistem mimarisinin parçasıdır.

Mascot kullanılabilir ancak:

- gereksiz büyütülmemeli,
- ekranı domine etmemeli,
- sürekli animasyon yapmamalı,
- neon/glow ile süslenmemeli,
- kullanıcıyı rahatsız edecek şekilde öne çıkarılmamalıdır.

AI asistanı sistemin yardımcısıdır.

Sistemin kendisi değildir.

---

20. ANİMASYON KURALLARI

Animasyon:

işlevsel olduğu zaman kullanılmalıdır.

Kullanılabilecek örnekler:

- drawer açılması,
- modal açılması,
- hover,
- panel genişlemesi,
- state transition,
- toast,
- loading.

Kaçınılması gerekenler:

- sürekli hareket eden objeler,
- sürekli pulse,
- floating elementler,
- gereksiz parallax,
- sürekli glow,
- dekoratif particle,
- background animation,
- dikkat dağıtan hareketler.

Animasyon kullanıcıya bilgi vermeli veya etkileşimi desteklemelidir.

Sadece "cool" görünmek için animasyon yapılmamalıdır.

---

21. SIDEBAR KURALI

Mevcut sistemde tanımlanan:

"76px → 288px"

hover-to-peek davranışı korunmalıdır.

Pin mekanizması:

"isPinned"

üzerinden çalışmalıdır.

Antigravity kullanıcı açıkça istemediği sürece:

- sidebar tasarımını değiştiremez,
- yeni navigation sistemi oluşturamaz,
- sidebar'a yeni dekoratif alan ekleyemez,
- sidebar davranışını değiştiremez.

---

22. AI DRAWER KURALI

Mevcut:

"RestivaAiCopilotDrawer"

davranışı korunmalıdır.

Hover:

"460px"

Peek davranışı,

click-to-pin,

backdrop,

X ile kapatma

mantığı korunmalıdır.

Bu yapı kullanıcı açıkça farklı bir davranış istemediği sürece yeniden tasarlanamaz.

---

23. MEVCUT COMPONENT'LERİ GEREKSİZ YERE YENİDEN YAZMA

Mevcut component zaten istenen davranışı sağlayabiliyorsa yeniden oluşturulmamalıdır.

Özellikle:

- yeni button component,
- yeni card component,
- yeni modal,
- yeni drawer,
- yeni navigation,
- yeni toast,
- yeni table

oluşturulmadan önce mevcut component yapısı kontrol edilmelidir.

Duplicate component oluşturma.

---

24. MEVCUT TASARIMI KORU, GEREKTİĞİ KADAR GELİŞTİR

Bir sayfa üzerinde küçük bir değişiklik isteniyorsa bütün sayfa yeniden tasarlanmamalıdır.

Örneğin kullanıcı:

«"Bu tabloya filtre ekle."»

diyorsa:

❌ tüm dashboard'u yeniden tasarlama.

❌ sidebar'ı değiştirme.

❌ renk sistemini değiştirme.

❌ kart sistemini değiştirme.

❌ yeni dashboard layout'u oluşturma.

Yalnızca istenen değişikliği uygula.

---

25. TASARIM DEĞİŞİKLİĞİ YAPMADAN ÖNCE ANALİZ

Her UI değişikliğinden önce Antigravity:

1. Mevcut component'i incelemeli.
2. Mevcut layout'u incelemeli.
3. Mevcut renk sistemini kontrol etmeli.
4. Mevcut spacing sistemini kontrol etmeli.
5. Mevcut component tekrar kullanılabilir mi kontrol etmeli.
6. Kullanıcı talebini mevcut sisteme minimum değişiklikle uygulamalıdır.

"Baştan yapmak daha kolay" yaklaşımı kabul edilmez.

---

26. RESPONSIVE TASARIM

Responsive tasarım gereklidir ancak masaüstü tasarımının karakteri bozulmamalıdır.

Mobilde:

- gereksiz elementler gösterilmemeli,
- butonlar rastgele büyütülmemeli,
- kartlar otomatik olarak devasa hale getirilmemeli,
- her şey ortalanmamalı,
- desktop layout körlemesine stack edilmemelidir.

Mobil kullanım senaryosu operasyonel kullanım dikkate alınarak tasarlanmalıdır.

---

27. FORM TASARIMI

Formlarda:

- gereksiz input,
- gereksiz açıklama,
- gereksiz ikon,
- gereksiz card,
- gereksiz buton

eklenmemelidir.

Kullanıcının gerçekten ihtiyaç duyduğu alanlar gösterilmelidir.

---

28. MODAL TASARIMI

Modal yalnızca gerçekten modal davranışı gerektiren durumlarda kullanılmalıdır.

Her işlem için modal açılması yasaktır.

Modal:

- sade,
- odaklı,
- kısa,
- işlevsel

olmalıdır.

Modal içerisine gereksiz dekorasyon eklenmemelidir.

---

29. TOAST / BİLDİRİM

Mevcut "ToastContext.tsx" kullanılmalıdır.

Aynı iş için yeni notification sistemi oluşturulmamalıdır.

Toast mesajları:

- kısa,
- açık,
- operasyonel

olmalıdır.

Pazarlama dili kullanılmamalıdır.

---

30. TABLOLAR

Operasyonel veri tabloları mümkün olduğunca:

- okunabilir,
- yoğun,
- düzenli,
- hızlı taranabilir

olmalıdır.

Her satırın ayrı bir card'a dönüştürülmesi gerekmez.

Tablo yalnızca "modern görünsün" diye card listesine dönüştürülmemelidir.

---

31. GEREKSİZ DECORATION YASAĞI

Aşağıdaki dekorasyonlar kullanıcı istemediği sürece kullanılmayacaktır:

- abstract blobs,
- gradient blobs,
- decorative circles,
- floating shapes,
- sparkles,
- stars,
- background particles,
- decorative lines,
- random geometric shapes,
- glow orbs,
- AI sparkles.

RestivAdisyon bir tasarım showcase'i değildir.

---

32. MARKETING WEBSITE ESTETİĞİ YASAK

RestivAdisyon uygulamasının içerisindeki ekranlar:

- landing page,
- pricing page,
- startup homepage,
- portfolio,
- marketing dashboard

gibi tasarlanmamalıdır.

Kullanıcı uygulamayı açtığında:

«"Bu gerçek bir işletme yönetim sistemi."»

hissini almalıdır.

---

33. TASARIMDA ÖNCELİK SIRASI

Her tasarım kararında aşağıdaki öncelik uygulanmalıdır:

1. Kullanılabilirlik

Kullanıcı işlemi kolayca yapabiliyor mu?

2. Açıklık

Ne yapılacağı anlaşılabiliyor mu?

3. Hız

Operasyon sırasında gereksiz tıklama var mı?

4. Tutarlılık

Sistemin geri kalanıyla uyumlu mu?

5. Profesyonellik

Gerçek ticari yazılım hissi veriyor mu?

6. Estetik

Ancak yukarıdakiler sağlandıktan sonra görsel iyileştirme yapılabilir.

Estetik hiçbir zaman kullanılabilirliğin önüne geçemez.

---

34. "DAHA MODERN" BAHANESİYLE SİSTEMİ DEĞİŞTİRME

"Modernize etmek" gerekçesiyle:

- daha fazla radius,
- daha fazla gradient,
- daha fazla shadow,
- daha fazla animation,
- daha fazla color,
- daha fazla card,
- daha fazla icon

eklenmemelidir.

Modern görünüm = daha fazla efekt değildir.

RestivAdisyon'un modernliği:

iyi bilgi mimarisi + tutarlı component sistemi + doğru spacing + profesyonel typography + hızlı etkileşim

üzerinden oluşturulmalıdır.

---

35. KOD VE TASARIM ARASINDAKİ SINIR

Bu dosya yalnızca görsel tasarım için değildir.

UI değişikliği mevcut sistem mimarisini etkiliyorsa Antigravity:

- mevcut state yönetimini,
- mevcut component yapısını,
- mevcut veri akışını,
- mevcut Realtime davranışlarını,
- mevcut Supabase entegrasyonunu

gereksiz yere değiştirmemelidir.

Tasarım değişikliği için backend mimarisi değiştirilmez.

---

36. MEVCUT TEKNOLOJİ YIĞINI KORUNMALI

Mevcut sistem:

- React 18
- TypeScript
- Vite 6
- Tailwind CSS 3
- Lucide React
- Supabase
- PostgreSQL
- mevcut component mimarisi

üzerine kuruludur.

Tasarım görevi nedeniyle yeni bir UI framework veya component library eklenmemelidir.

---

37. "KULLANICI İSTEMEDİYSE EKLEME" PRENSİBİ

Bu dosyanın en önemli prensiplerinden biri:

«USER INTENT > AI CREATIVITY»

Antigravity'nin yaratıcılığı, kullanıcının talimatlarının önüne geçemez.

Kullanıcı:

«"Bu alanı düzelt."»

diyorsa Antigravity:

«"Ben daha güzel bir dashboard tasarladım."»

yapamaz.

İstenen alan düzeltilmelidir.

---

38. DEĞİŞİKLİK KAPSAMI

Kullanıcı tarafından verilen görev mümkün olduğunca:

minimum değişiklik + maksimum sonuç

prensibiyle uygulanmalıdır.

Örneğin:

«"Sipariş kartındaki ödeme butonunun konumunu değiştir."»

Görev yalnızca butonun konumunu ilgilendiriyorsa:

- kart tasarımı değişmez,
- renkler değişmez,
- typography değişmez,
- diğer butonlar değişmez,
- sidebar değişmez,
- sayfa layout'u değişmez.

---

39. KULLANICI ONAYI GEREKTİREN DURUMLAR

Aşağıdaki durumlarda Antigravity kullanıcıdan onay istemelidir:

- yeni bir ana UI component'i oluşturulması,
- mevcut component'in kaldırılması,
- navigation değişikliği,
- renk paleti değişikliği,
- mevcut layout'un kökten değiştirilmesi,
- yeni kullanıcı aksiyonu eklenmesi,
- mevcut davranışın değiştirilmesi,
- sistem mimarisini etkileyen tasarım kararı,
- bir talimatın birden fazla mantıklı yorumu olması.

---

40. SON KONTROL — UI DEĞİŞİKLİĞİ TAMAMLANDIĞINDA

Antigravity yaptığı değişiklikten sonra aşağıdaki kontrolü yapmalıdır:

- [ ] Kullanıcının istemediği bir buton eklendi mi?
- [ ] Kullanıcının istemediği bir özellik eklendi mi?
- [ ] Yeni bir renk üretildi mi?
- [ ] Gradient kullanıldı mı?
- [ ] Neon/glow kullanıldı mı?
- [ ] Gereksiz emoji kullanıldı mı?
- [ ] Gereksiz card oluşturuldu mu?
- [ ] Gereksiz border-radius kullanıldı mı?
- [ ] Gereksiz animasyon eklendi mi?
- [ ] AI-generated SaaS görünümü oluştu mu?
- [ ] Mevcut component gereksiz yere yeniden yazıldı mı?
- [ ] Kullanıcı tarafından istenmeyen bir layout değişti mi?
- [ ] Mevcut tasarım dili korundu mu?
- [ ] İşletme operasyonu için kullanım kolaylığı korundu mu?
- [ ] Tasarım gerçek bir restoran/kafe yönetim yazılımı gibi görünüyor mu?

Herhangi bir cevap:

EVET

ise değişiklik tekrar değerlendirilmelidir.

---

41. FINAL DESIGN PRINCIPLE

RestivAdisyon'un arayüzü şu hissi vermelidir:

«"Bu sistemi gerçek bir restoran her gün kullanabilir."»

Şu hissi vermemelidir:

«"Bu sistemi bir AI birkaç saniyede tasarlamış."»

---

42. ABSOLUTE RULE

Son ve en önemli kural:

«Antigravity kullanıcıdan daha akıllı olduğunu varsayarak tasarım kararı alamaz.»

Kullanıcı bir tasarım kararını açıkça verdiyse uygulanmalıdır.

Talimat anlaşılmıyorsa:

SOR.

Talimat mantıksız görünüyorsa:

UYAR + SOR.

Talimat mevcut sistemle çelişiyorsa:

ÇELİŞKİYİ BELİRT + ONAY İSTE.

Talimat açıksa:

YALNIZCA İSTENENİ UYGULA.

Kendi başına özellik ekleme.

Kendi başına buton ekleme.

Kendi başına renk ekleme.

Kendi başına tasarım dili değiştirme.

Kendi başına sistemi yeniden tasarlama.

---

RESTIVADISYON DESIGN CONSTITUTION

Professional. Operational. Restrained. Consistent.

No unnecessary UI.
No AI-generated aesthetics.
No neon.
No excessive rounding.
No unnecessary colors.
No unnecessary buttons.
No unnecessary features.
No assumptions.

User intent always comes first.