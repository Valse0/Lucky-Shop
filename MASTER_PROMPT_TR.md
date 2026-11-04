# LUCKY SHOP — MASTER IMPLEMENTATION PROMPT

Sen bu projede kıdemli bir oyun istemcisi mühendisi, teknik sanatçı, UI implementasyon uzmanı ve QA sorumlusu olarak çalışıyorsun. Görevin sıfırdan farklı bir oyun icat etmek değil; mevcut Lucky Shop projesini, sağlanan referans ekran görüntüsünün görsel diline mümkün olduğunca sadık, oynanabilir ve bakımı kolay bir dikey slot + mağaza yönetimi oyununa dönüştürmek.

## 0. ÇALIŞMA PROTOKOLÜ — PAZARLIK KONUSU DEĞİL

1. İlk iş repoyu incele. Framework, dil, paket yöneticisi, entry point, mevcut oyun state'i, asset klasörleri, build/test komutları, sürümleme ve mevcut çalışan özellikleri raporla.
2. İlk cevapta kod değiştirme. Önce:
   - repo mimarisi özeti,
   - bulunan asset ZIP'leri ve içlerindeki dosya türleri,
   - referansla eşleşen asset adayları,
   - eksik/bozuk asset listesi,
   - riskler,
   - dosya bazında uygulama planı,
   - test planı sun.
3. Kullanıcı onayı olmadan büyük refactor yapma. Mevcut çalışan oyun mekaniğini, ekonomiyi, kayıt sistemini, paketleri veya build ayarlarını bozma.
4. Bilinmeyenleri uydurma. Repo içinde doğrulanamayan bir özelliği varmış gibi anlatma.
5. ZIP içeriğini doğrudan production klasörüne topluca açma. Önce geçici inceleme alanına çıkar, dosyaları sınıflandır, sonra seçilmiş varlıkları kopyala.
6. Her aşama sonunda değişen dosyaları, neden değiştiğini, test sonucunu ve kalan sorunları raporla.
7. Bir işi tamamlamadan sonraki aşamaya atlama. Build/test başarısızsa sebebi çözmeden yeni özellik ekleme.
8. Uygulamayı küçük, geri alınabilir değişikliklerle geliştir. Her aşamadan önce mevcut Git durumunu kontrol et; kullanıcı değişikliklerini silme veya resetleme.
9. Çalışan mevcut mimariyi sırf tercih ettiğin için değiştirme. React/Vite/TypeScript değilse mevcut stack'te kal; yalnızca gerekçeli ve onaylı migrasyon yap.
10. Kullanıcıdan gereksiz yere çok sayıda komut isteme. Mümkünse tek bir tanı raporu üret.

## 1. PROJE ÖZETİ

**Lucky Shop**, dikey ekranda oynanan, fantastik ve renkli bir kasaba atmosferinde geçen slot + mağaza geliştirme oyunudur.

- Slot makinesi oyunun kısa döngülü ana motorudur.
- Mağaza yönetimi, oyuncuya uzun vadeli hedef ve ilerleme hissi verir.
- Oyuncu spin için altın harcar; sonuçlara göre altın kazanabilir veya kaybedebilir.
- Kazançlar, görevler ve ilerleme oyuncunun mağazasını geliştirmesine katkı sağlar.
- Oyun tek elle oynanabilecek şekilde portrait tasarlanır.
- Temel hedef: referans görseldeki sıcak, canlı, detaylı, oyuncak/masal dünyası estetiğini gerçek oyun arayüzüne dönüştürmek.

## 2. REFERANS GÖRSELİN GÖRSEL HİYERARŞİSİ

Kullanıcının verdiği referans, görsel yön için ana kaynaktır. Piksel piksel kopyalanması gerekmiyor; ancak kompozisyon, renk, materyal ve görsel yoğunluk korunmalı.

Yukarıdan aşağı ana bölümler:

1. **Üst kaynak çubuğu:** Altın bakiyesi, gem bakiyesi, ekleme butonları ve ayarlar.
2. **Oyuncu ilerlemesi:** Sol üstte level kartı ve XP barı; sağ üstte günlük bonus kartı ve sayaç.
3. **Marka/mağaza başlığı:** Ortada neşeli maskot, büyük Lucky Shop tabelası, arka planda fantastik kasaba ve mağaza çatısı.
4. **Slot makinesi:** Altın/ahşap/renkli çerçeve içinde 5 sütun × 3 satır. Her makara ayrı bir dikey şerit gibi davranır.
5. **Bahis ve sonuç alanı:** Solda BET ve azalt/artır; ortada büyük SPIN; sağda WIN.
6. **Mağaza gelişimi:** Shop Upgrade kartı ve kilitli slot/alan açma kartı.
7. **Alt navigasyon:** Missions, Rewards, Leaderboard.

Mobilde gerçek ekran oranına göre ölçekle; sabit piksel koordinatlarıyla ekran dışına taşma yaratma. Referansın yaklaşık 9:16 kompozisyonunu koru, fakat küçük ekranlarda okunabilirlik ve dokunma alanları önceliklidir.

## 3. OYUN DÖNGÜSÜ VE MEKANİKLER

### Spin döngüsü
1. Oyuncu BET değerini seçer.
2. SPIN'e basar.
3. Yeterli altın varsa bahis tutarı düşülür.
4. Sonuç, oyun mantığı tarafından belirlenir.
5. Beş makara aynı anda harekete başlar.
6. Makaralar soldan sağa sırayla durur.
7. Sonuç kombinasyonları değerlendirilir.
8. Kazanç varsa WIN alanında gösterilir ve bakiye güncellenir.
9. Kazanan semboller kısa süreli görsel vurgu alır.
10. Spin tamamlanınca kontrol yeniden oyuncuya geçer.

**Kritik:** Animasyon sonucu belirlemez. RNG/oyun mantığı sonucu animasyondan önce üretir. Görsel animasyon yalnızca önceden belirlenmiş sonucu gösterir. Animasyon kodu ödül/ekonomi hesabı yapmamalıdır.

### Slot düzeni
- Kesin düzen: **5 sütun × 3 satır**.
- 5 bağımsız dikey makara.
- Semboller ayrı asset dosyalarıdır; emoji kullanma.
- Makara durduğunda gösterilen 3 sembol, oyun motorunun belirlediği sonuçla birebir aynı olmalı.
- Spin devam ederken ikinci spin başlatılamaz.
- Bakiye yetersizse spin başlamaz; anlaşılır geri bildirim verilir.
- Animasyon iptal edilirse state kilitli kalmamalı; güvenli biçimde tamamlanmalı veya başlangıç durumuna dönmeli.

### Ekonomi ve ilerleme
Mevcut repoda tanımlı ekonomi varsa onu koru. Yoksa ilk aşamada basit ve yapılandırılabilir bir model uygula:
- Spin maliyeti = seçili BET.
- Ödül tablosu tek bir merkezi konfigürasyonda bulunur.
- Bakiye hiçbir zaman negatif olamaz.
- Kazanç hesaplaması animasyondan bağımsız ve test edilebilir olmalı.
- Shop Upgrade altın harcayarak mağaza seviyesini yükseltir.
- Level/XP ve kilit açma eşikleri tek yerde tanımlanır.
- Günlük bonus, cihaz saatine dayalı basit bir kontrol kullanabilir; çevrimdışı oyunda sunucu doğrulaması varmış gibi davranma.
- İlk sürümde sahte leaderboard veya gerçek para ödeme sistemi varmış gibi gösterme.

### Sembol seti
Mevcut asset paketlerinde bulunan gerçek sembolleri tespit et. Hedef sembol ailesi:
- Kiraz
- Çan
- Kırmızı 7
- Üzüm
- Elmas
- Taç
- Hazine sandığı
- Yonca
- Karpuz
- Diğer mevcut/kaliteli özel semboller

Sembol adları, asset yolları ve ödeme katsayıları merkezi bir manifest/config içinde tutulmalı. Dosya adlarını tahmin etme; gerçek dosyaları incele.

## 4. ASSET SEÇİMİ VE ÜRETİM SÖZLEŞMESİ

İki ZIP'i ayrı kaynak olarak incele:
- Claude paketi (yaklaşık 12 MB): sembol ikonları ağırlıklı.
- Dola paketi (yaklaşık 24 MB): referans ekran görüntüsünden çıkarılmış panel/arayüz/dekoratif varlıklar ağırlıklı.

Bu boyutlar kalite kanıtı değildir. Her dosyayı görsel olarak ve teknik olarak değerlendir.

### Seçim önceliği
1. Referans görsele görsel benzerlik.
2. Netlik ve çözünürlük.
3. Şeffaf arka planın doğru olması.
4. Kenar temizliği / halo / kırpılma.
5. Stil tutarlılığı.
6. Oyunda farklı boyutlarda kullanılabilirlik.

En iyi parçaları iki paketten birlikte seç. Bir ZIP'i bütünüyle seçmek zorunda değilsin.

### Eksik asset onarımı
- Önce mevcut dosyayı kurtarmayı dene: temiz kırpma, arka plan temizleme, ölçekleme, kenar düzeltme.
- Yeniden üretim gerekiyorsa, mevcut asset'i ve referansı stil referansı olarak kullan.
- Yeni asset aynı ışık yönü, perspektif, bevel, materyal, kontur, gölge, doygunluk ve detay seviyesine uymalı.
- Yeni üretilen sembolün anlamı mevcut sembol ailesiyle karışmamalı.
- Birden fazla sembolü tek sprite içine gömme; atlas kullanılacaksa atlas metadata'sı üret.
- Referans ekran görüntüsünün tamamını tek arka plan görseli olarak kullanıp üstüne sahte buton bindirme. Arayüz gerçek, ayrı ve etkileşimli bileşenlerden oluşmalı.
- Görsel üretim aracı mevcut değilse varmış gibi davranma; eksik asset'i raporla ve placeholder'ı yalnızca geliştirme ortamında kullan.

### Asset teknik kuralları
- Mümkünse şeffaf PNG veya WebP.
- Sembol dosyaları kare ve merkezlenmiş olmalı.
- Sembol görsel alanı canvas'ın yaklaşık %80–88'ini doldurmalı.
- Kenarlarda kesilme olmamalı.
- Görsellerde metin, watermark, rastgele imza veya fazladan çerçeve bulunmamalı.
- UI yazıları gerçek metin olarak koddan çizilmeli; SPIN/BET/WIN gibi metinleri görsele gömme.
- Renk profili sRGB olmalı.
- Dosya isimleri küçük harf, ASCII ve tutarlı olmalı.
- Kaynak dosyaları silme; seçilen ve normalize edilen kopyaları ayrı klasöre koy.
- `assets-manifest.json` oluştur: id, path, type, dimensions, sourcePackage, status, notes alanları bulunsun.

## 5. GÖRSEL KALİTE KURALLARI

- Genel estetik: canlı, sıcak, fantastik kasaba, premium casual mobile game.
- Materyaller: cilalı ahşap, altın kenar, emaye, parlak mücevher, sıcak ışık.
- Renkler güçlü ve neşeli; aşırı neon, düz renk blokları veya plastik çocuk oyuncağı görünümü yok.
- UI derinliği katmanlı olmalı: dış gölge, iç gölge, bevel, highlight ve kontrollü glow.
- Her öğeye aynı anda glow verme. Işık efektleri hiyerarşi yaratmalı.
- Sembol ikonları renklerini kaybetmemeli; CSS filter ile tüm sembolleri tek renge boyama.
- Metin okunabilirliği için yeterli kontrast ve tutarlı font ağırlığı kullan.
- Butonlar gerçek dokunma alanına sahip olmalı.
- Referansın zenginliğini korurken küçük ekranı aşırı kalabalıklaştırma.
- Rastgele gradient, rastgele emoji ve jenerik dashboard kartlarıyla referansı ikame etme.

## 6. TEKNİK VE KOD KURALLARI

- Önce mevcut teknolojiye uy.
- Slot sonucu, ekonomi, animasyon, UI ve kayıt katmanlarını birbirinden ayır.
- Tek bir global component içine tüm oyunu yığma.
- Magic number'ları config'e taşı.
- Animasyon frame loop'ları ve timer'lar cleanup edilmelidir.
- Kullanılmayan interval/timeout bırakma.
- `prefers-reduced-motion` veya eşdeğer erişilebilirlik tercihini dikkate al.
- Mobil performansı koru; her frame'de gereksiz React render üretme.
- Görsel asset'leri gereksiz base64'e çevirme.
- Kullanıcı arayüzü ölçeklenebilir ve safe-area uyumlu olmalı.
- Oyun state'i tek doğruluk kaynağına sahip olmalı.
- Kaydetme formatına sürüm alanı ekle; eski kayıtları sessizce bozma.
- Hata durumlarında oyun kilitlenmemeli.

## 7. SLOT ANİMASYONU SÖZLEŞMESİ

`src/slot/slotMotion.ts` dosyasındaki `animateSlotReels` yardımcı fonksiyonunu incele ve mevcut stack'e uygun şekilde entegre et.

Beklenen his:
- Beş makara birlikte hızlanır.
- Her makara farklı zamanda durur: soldan sağa.
- Durma aralıkları ritmik ve belirgin olmalı; aşırı uzun bekleme olmamalı.
- Her makara durduğunda kısa, kontrollü bir bounce/settle hissi olabilir.
- Hareket akıcı olmalı; ani sıçrama, sembol kaybolması veya renk filtresi olmamalı.
- Animasyonun son konumu önceden belirlenmiş 3 sembolü göstermeli.
- Sonuç RNG tarafından önceden hesaplanmalı.
- `onReelStop(index)` ve `onComplete()` olayları doğru zamanda tetiklenmeli.
- Kullanıcı spin sırasında kontrolleri tekrar tetikleyememeli.
- Unmount/iptal durumunda timer ve animation cleanup yapılmalı.
- `prefers-reduced-motion` açık ise daha kısa ve düşük hareketli alternatif kullan.

Önerilen başlangıç ritmi:
- 5 makara.
- İlk duruş yaklaşık 1.65–1.9 saniye.
- Her sonraki makara yaklaşık 220–300 ms sonra durur.
- Toplam animasyon yaklaşık 2.6–3.1 saniye.
Bunlar test sırasında ayarlanabilir değerlerdir; sabit gerçekler değildir.

## 8. UYGULAMA AŞAMALARI

### Aşama A — Audit (kod değişikliği yok)
Repo, ZIP'ler, referans ve mevcut mekaniklerin raporu.

### Aşama B — Asset Pack v1
Dosyaları seç, normalize et, manifest oluştur. Orijinal ZIP'leri koru. UI kodunu henüz değiştirme.

### Aşama C — UI iskeleti
Portrait layout, ana alanlar, gerçek asset'ler, responsive ölçekleme. Önce statik görünüm ve görsel karşılaştırma.

### Aşama D — Slot motoru
5×3 sonuç modeli, bahis, bakiye, ödül hesaplama, spin kilidi. Unit test ekle.

### Aşama E — Animasyon
Makaraları ayrı ayrı döndür, soldan sağa durdur, gerçek sonuçla eşleştir. Hızlı art arda spin, yetersiz bakiye, component unmount ve reduced-motion testleri yap.

### Aşama F — İlerleme ve kayıt
Shop upgrade, level/XP, daily bonus, missions/rewards/leaderboard ekranlarının mevcut kapsamına göre entegrasyonu. Gerçek backend yoksa çevrimdışı/demo olduğunu açıkça belirt.

### Aşama G — QA ve teslim
Build, lint, test, ekran boyutları, dokunma alanları, animasyon performansı ve asset yükleme kontrolü. Son rapor ve changelog.

## 9. KABUL KRİTERLERİ

- Ekran portrait ve 5×3 slot düzeninde.
- Görsel dil referansa belirgin biçimde yakın.
- Kullanılan semboller gerçek asset dosyalarından geliyor.
- İki ZIP'in en iyi parçaları değerlendirildi; tek kaynağa körü körüne bağlı kalınmadı.
- UI metinleri gerçek metin.
- Spin sonucu ile görünen 15 sembol eşleşiyor.
- Makaralar soldan sağa ayrı zamanlarda duruyor.
- Spin sırasında ikinci spin engelleniyor.
- Bakiye negatif olamıyor.
- Ödül hesabı animasyon kodundan bağımsız.
- Küçük ekranlarda taşma yok.
- Build ve test komutları başarılı.
- Orijinal asset ZIP'leri ve mevcut kullanıcı değişiklikleri korunuyor.
- Bilinen eksikler teslim raporunda açıkça listeleniyor.

## 10. TESLİM RAPORU FORMATI

Her aşama sonunda şu başlıklarla rapor ver:
1. Yapılanlar
2. Değiştirilen/eklenen dosyalar
3. Kullanılan asset'ler ve kaynak ZIP
4. Çalıştırılan testler ve sonuçları
5. Görsel referansla uyum değerlendirmesi
6. Bilinen sorunlar
7. Sonraki aşama

Şimdi yalnızca Aşama A'yı gerçekleştir. Kod değiştirme. Repo ve asset'leri analiz edip raporla; uygulamaya geçmek için onay bekle.
