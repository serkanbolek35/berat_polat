# BEP CAR – Oto Galeri Web Sitesi

React 19 + Vite + TypeScript + Tailwind CSS 4 + Firebase (Auth, Firestore, Storage, Hosting).

## Durum

| Aşama | Kapsam | Durum |
|---|---|---|
| 1 | Altyapı: Firebase yapılandırması, tipler, güvenlik kuralları, indeksler, yönetici yetkilendirme betiği | Hazır |
| 2 | Genel site: ana sayfa, satılık/satılan araçlar (gerçek zamanlı), araç detayı, iletişim, favoriler, yasal sayfalar, 404 | Hazır |
| 3 | Yönetim paneli: `/admin/giris`, pano, 7 adımlı araç formu, fotoğraf yükleme, satıldı/geri al akışı, mesajlar | Hazır |
| 4 | Katalog yönetimi (marka/model/nesil/paket/kategori/donanım), formda dinamik seçim, site ayarları ekranı, SEO | Hazır |

## Yönetim paneli

Adres: `/admin` (giriş: `/admin/giris`). Genel sitede hiçbir yerde bağlantısı yoktur; adresi elle yazın.
Giriş yapan hesapta `admin` claim'i yoksa panel açılmaz; asıl koruma Firestore/Storage kurallarındadır.

- **Araçlar:** durum sekmeleri; yayınla, yayından kaldır, rezerve, **satıldı** (tarih ve isteğe bağlı fiyatla), **geri al**, arşivle, öne çıkar, kopyala, sil.
- **Kopyala:** fotoğraflar kopyalanmaz (iki ilan aynı dosyayı paylaşırsa biri silinince diğeri bozulur); kopya taslak olarak açılır.
- **Araç formu:** 7 adım; "Taslak olarak kaydet" doğrulamasızdır, "Kaydet ve yayınla" tüm zorunlu alanları doğrular.
- **Fotoğraflar:** çoklu yükleme, ilerleme çubuğu, otomatik küçültme (1920 px, WebP), sürükle-bırak veya ok tuşlarıyla sıralama, kapak seçme, silme. İlk fotoğraf kapaktır. Kaydedilmiş araçlarda fotoğraf değişiklikleri anında kaydedilir.
- **Bilinen sınırlar:** Kaydedilmemiş yeni bir araç için yüklenen fotoğraflar, form hiç kaydedilmezse Storage'da artık dosya olarak kalır.

## Kurulum

1. **Firebase projesi:** console.firebase.google.com → Proje ekle. Web uygulaması ekleyip yapılandırma değerlerini alın.
2. **Authentication:** Build → Authentication → Başlayın → *E-posta/Parola* sağlayıcısını açın. Kayıt sayfası yoktur; yönetici kullanıcıyı Console'dan elle ekleyin (Users → Add user).
3. **Firestore:** Build → Firestore Database → Create database (production mode).
4. **Storage:** Build → Storage → Get started. Not: Firebase, Storage için çoğu projede Blaze (kullandıkça öde) planı isteyebilir; ücretsiz kotası geniştir ama kredi kartı gerekebilir. Güncel koşulları Firebase fiyatlandırma sayfasından kontrol edin.
5. **Ortam değişkenleri:** `cp .env.example .env` ve değerleri doldurun.
6. **Bağımlılıklar:** `npm install`, geliştirme için `npm run dev`.
7. **İlk yönetici:** Console'dan eklediğiniz kullanıcı için, Proje Ayarları → Hizmet Hesapları'ndan indirdiğiniz anahtarı `serviceAccountKey.json` olarak proje köküne koyun ve çalıştırın:
   `npm run set-admin -- yonetici@ornek.com`
   Yetki sunucu tarafında *custom claim* (`admin: true`) olarak atanır. Anahtar dosyasını asla git'e eklemeyin.
8. **Kurallar ve indeksler:** `npm i -g firebase-tools && firebase login && firebase use <proje-id>` ardından `firebase deploy --only firestore:rules,firestore:indexes,storage`.
9. **Yayın:** `npm run build && firebase deploy --only hosting`.

## Veri yapısı (şimdilik elle ekleme)

`vehicles` koleksiyonuna belge ekleyin (alanlar `src/types/index.ts`). Gerekli alanlar: `listingNo, title, status, featured, category, brand, model, year, mileage, fuel, transmission, price, currency ('TRY'), images ([]), listedAt (timestamp)`. Satıldı için `status: "sold"` ve `soldAt` ekleyin; araç otomatik olarak portföye geçer.

Site ayarları: `siteSettings/main` belgesi (`phone, whatsapp (905551234567), instagram, email, address, mapsUrl, workingHours`).

## Güvenlik

- Ziyaretçiler yalnızca `published` ve `sold` araçları okuyabilir; yazma yalnızca `admin` claim'i olanlara açıktır.
- Mesaj formu yalnızca doğrulanmış `create` yapabilir; okuma yöneticiye aittir.
- Yetkiler arayüze değil, Firestore ve Storage kurallarına dayanır.

## Katalog (Aşama 4)

`/admin/katalog`: boşsa **Başlangıç verisini yükle** ile kategoriler, ~50 marka ve yaygın modeller eklenir; gerisini kendiniz genişletin. Nesil ve paketler boş başlar.
Formda seçim sırası: kategori → marka (kategoriye göre süzülür) → model → nesil → paket. Listede olmayan değer için "Listede yok, elle yaz" seçeneği vardır.
Marka veya model adını değiştirince o adı kullanan ilanlar da güncellenir. Marka/model silmek mevcut ilanları etkilemez (ilanlarda ad metin olarak saklanır).
Donanım sekmesinden eklenen özel donanımlar araç formunda hazır listenin yanında görünür.

## Site ayarları

`/admin/ayarlar`: telefon, WhatsApp (ülke koduyla, örn. 905550000000), e-posta, adres, saatler, harita ve sosyal bağlantılar, logo, ana sayfa başlıkları, hakkımızda metni, SEO başlığı ve açıklaması.

## SEO

- Her sayfada canonical, Open Graph ve açıklama meta etiketleri çalışma anında ayarlanır; araç sayfalarında schema.org `Car`/`Vehicle` yapılandırılmış verisi bulunur.
- `npm run build` sonunda `scripts/seo.mjs` çalışır: `sitemap.xml`, `robots.txt` (`/admin` engelli) ve her yayındaki/satılmış araç için meta etiketli statik giriş sayfası üretir (ücretli sunucu gerekmez). Bunun için `.env` içinde `VITE_SITE_URL` tanımlı olmalıdır.
- Bu dosyalar derleme anındaki araçları kapsar. Yeni ilan ekledikten veya araç sattıktan sonra `npm run build && firebase deploy --only hosting` çalıştırın. Sonradan eklenen araçlar da site içinde normal şekilde çalışır, yalnızca önceden üretilmiş meta etiketleri ve sitemap kaydı bir sonraki yayına kadar eksik kalır.
- Search Console'a `https://alanadiniz/sitemap.xml` adresini ekleyin.

## Araç sayfası ve karşılaştırma

- Detay sayfasında fotoğrafa tıklayınca tam ekran görüntüleyici açılır (yakınlaştırma, ok tuşları, Esc). Hasar/TRAMER bilgisi, kaporta tablosu, ekspertiz PDF, YouTube videosu ve konum bölümleri ilgili alanlar doluysa görünür.
- Araç kartlarındaki **Karşılaştır** ile en fazla 3 araç seçilir (`/karsilastir`); seçim yalnızca bu cihazda saklanır.
