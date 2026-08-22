# Unysol — Ülke Taşınabilirliği (Country Portability) Tasarım Dokümanı

> **Durum: TASLAK / TASARIM DOKÜMANI** — bu doküman henüz implemente edilmiş
> bir özelliği değil, ülke profili seam'inin tasarım sözleşmesini tanımlar.
>
> **İlke:** Uygulama TEK ülkeye hizmet verir (bugün: Türkiye). Yeni bir ülkeye
> geçiş veya ek ülke desteği, çekirdek kod ve veritabanı şeması DEĞİŞTİRİLMEDEN,
> yalnızca "ülke profili" eklenerek yapılır.

---

## 1. Ülke Profili Nedir?

Ülke profili, uygulamanın "ülkeye özgü" davranışının tamamını tek bir seam
arkasında toplayan konfigürasyon paketidir. Kodun geri kalanı bu profilden
bağımsızdır; hiçbir iş mantığı "if country == TR" tarzı koşullar içermez.

```
Yeni ülke = yeni ülke profili + locale dosyası + uyumluluk modülü
Çekirdek kod ve şema = DEĞİŞMEZ
```

## 2. Ülke Profili İçeriği

Bir ülke profili şu bileşenlerden oluşur:

### 2.1 Temel Tanım (`countries` tablosu)
- `code` — ISO 3166-1 alpha-2 kodu (ör. "TR"). Bugün kayıtlı tek profil: TR.
- `name` — ülke adı ("Türkiye")
- `default_locale` — varsayılan locale ("tr")
- `currency` — para birimi ("TRY")

### 2.2 Lokalizasyon (locale dosyası)
- `frontend/src/i18n/locales/<locale>.json` — UI metinleri
- Tarih/saat formatları (`DD.MM.YYYY` — TR)
- Sayı formatları (ondalık ayracı, binlik ayracı, para formatı)
- API hata mesajları aktif profilin locale'inde döner

### 2.3 Vergi Kuralları (`country_configs`)
- KDV oranları (TR: %20; varsa indirimli oran %10 / %1)
- Tevkifat oranı (TR: %20 tevkifat dilimi)
- Stopaj, özel iletişim vergisi vb. ülkeye özel kalemler
- Fatura seri formatı (`UNY{YYYY}{SEQ:6d}`)

### 2.4 Kimlik / Kayıt Numarası Formatları
- Vergi numarası formatı (TR: 10 haneli TCKN/VKN + vergi dairesi zorunluluğu)
- Plaka formatı (`NN AAA NNN` + regex)
- Ehliyet sınıfları, SRC / psikoteknik zorunlulukları (TR'ye özgü sürücü kuralları)
- İrsaliye, fatura ve sevk belgesi zorunlu alanları

### 2.5 Uyumluluk (Compliance) Modülleri
- Ülkeye özgü entegrasyonlar profil modülleri olarak paketlenir:
  - TR: `tr_efatura` (e-Fatura / e-Arşiv — GIB), `tr_irsaliye` (e-İrsaliye),
    `kvkk` (KVKK onayları), `tr_vergi` (vergi dairesi kontrolleri)
- Başka bir ülke profili eklendiğinde kendi uyumluluk modülü gelir
  (ör. bir AB ülkesi için `eu_gdpr`); modüller platform genelinde (global)
  kayıtlıdır ve sistem yöneticisi tarafından backend üzerinden açılır/kapanır.

### 2.6 Ülkeye Özel İş Kuralları
- Sürücü süre limitleri, araç muayene periyodu
- Geçiş/tol entegrasyonu (TR: HGS — PTT CSV import)
- Yakıt fiyat kaynağı (TR: EPDK API) ve yakıt kartı sağlayıcıları

## 3. Yeni Ülke Ekleme — Adım Adım

> Tüm adımlar sistem yöneticisi tarafından backend üzerinden yürütülür.
> Uygulamada ülke yönetim ekranı YOKTUR.

1. **Locale dosyası:** `locales/<yeni_locale>.json` oluştur ve tüm UI key'lerini çevir.
2. **Profil kaydı:** `countries` tablosuna yeni ülkeyi ekle (ops script):
   `INSERT INTO countries (code, name, default_locale, currency) VALUES (...);`
3. **Konfigürasyon:** `country_configs`'a vergi, format, kimlik ve iş kuralı
   değerlerini gir (JSONB).
4. **Uyumluluk modülü:** Gerekliyse yeni compliance modülünü `modules` kayıt
   defterine ekle; `PLAN_MODULES` ile planlara eşle.
5. **Aktivasyon:** `countries.aktif = true` yap → ülke registration'a açılır.
6. **Seed:** `database/` seed dosyasına yeni ülke verilerini ekle.
7. **Ops testleri:** Mevcut ops scriptleri (tenant/plan/modül yönetimi) yeni
   ülkeyle birlikte çalışır durumda mı doğrula.

## 4. DEĞİŞMEYECEK OLANLAR (Sözleşme)

Aşağıdakiler yeni ülke eklerken ASLA değiştirilmez:

- **Veritabanı şeması:** tablolar, sütunlar, RLS politikaları
- **Çekirdek backend kodu:** auth, tenant middleware, servis mantığı,
  fatura/dosya iş akışları
- **Çekirdek frontend kodu:** sayfalar, router, modül loader
- **Rol modeli:** tüm roller tenant kapsamında kalır; süper admin eklenmez
- **Platform yönetim modeli:** yönetim hep backend üzerinden (SQL/ops) yapılır

Ülkeye özgü her şey profil bileşenlerinde (locale + country_configs +
compliance modülü) yaşar.

## 5. TR Profili (Aktif Profil) Özeti

| Bileşen | Değer |
|---------|-------|
| code / locale / currency | `TR` / `tr` / `TRY` |
| KDV | %20 (indirimli %10 / %1) |
| Vergi kimliği | VKN/TCKN 10 hane + vergi dairesi |
| Fatura | e-Fatura / e-Arşiv (GIB), e-İrsaliye |
| Plaka | `NN AAA NNN` |
| Sürücü | SRC + psikoteknik, günlük max 9 saat |
| Tol | HGS (PTT CSV import) |
| Yakıt | EPDK fiyat kaynağı; DKV, PetrolOfisi, Shell, Opet |
| Uyumluluk | KVKK (6698), veri saklama 24 ay |

## 6. Test Sözleşmesi

- TR profili çıkarıldığında uygulama başlamaz değil, hatasız çalışmalı —
  eksik profil net bir hata mesajı ile bildirilmeli.
- Yeni profil ile mevcut tenant verileri bozulmamalı (geriye dönük uyumluluk).
- Locale anahtar eksikliği CI gate'i ile yakalanmalı (her locale dosyası
  `types.ts` ile doğrulanır).

---

### İlgili Dokümanlar
- `README.md` — A.2 (Lokalizasyon), A.3 (Ülke Profili — Regülasyon Uyumu)
- `MODULES.md` — uyumluluk modülleri (COMPLIANCE kategorisi)
- `TODO.md` — "Yapısal Dönüşüm" bölümü
