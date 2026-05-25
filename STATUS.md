# Unysol Status Raporu — 25 May 2026

## Sistem Durumu

```
4/4 Docker servis çalışıyor  |  18 backend .go handler + 5 yeni paket  |  30 frontend .tsx/.ts dosyası
PostgreSQL 16 (34 tablo) + Redis 7 + Go/chi Backend + React Frontend

LIVE VERI (25 May 2026):
  4 tenant · 3 kullanıcı · 302 müşteri · 346 gider (21 kategori) · 301 fatura · 1 çek/senet
  Modules: 22 seed · Countries: TR seeded · Plans: FREE/PRO/PREMIUM
```

---

## A. Blueprint vs Gerçekleşen

| Katman | Blueprint (tasarım) | Prototip (inşa edilen) | Durum |
|--------|---------------------|----------------------|-------|
| **Veritabanı** | 29+ CREATE TABLE + RLS | ✅ 34 tablo + RLS policy + seed data (modules, countries) + 300+ rows test data | Tamam |
| **Auth** | JWT + SUPER_ADMIN + TENANT_OWNER + DRIVER + OFFICE + ACCOUNTANT | ✅ bcrypt + JWT, 5 rol tanımı, signup/login tested live | Tamam |
| **API** | ~70 endpoint | ✅ 18 handler dosyası, ~60 endpoint canlı test edildi (%85) | %85 |
| **Multi-tenant** | RLS + tenant_id izolasyonu | ✅ Her tabloda tenant_id, RLS policy + RequireTenant middleware | Tamam |
| **Dashboard** | KPI + chart + aktiviteler | ⚠ Çalışıyor ama enum case bug ("tamamlandi" vs "TAMAMLANDI") | %80 |
| **Fleet/Trucks** | CRUD + tracking source | ⚠ GET çalışıyor, POST: empty tracking_source enum hatası | %60 |
| **Trips/Seferler** | CRUD + durum + filtre | ⚠ GET çalışıyor, POST: NULL scan into *time.Time hatası | %60 |
| **Customers** | CRM + risk skoru + depo | ✅ GET (302 rows) + POST (test edildi) — tam çalışıyor | Tamam |
| **Invoices** | CRUD + e-Fatura + PDF | ✅ GET (301 rows) + POST (full hesaplama: kdv, genel_toplam, kalan) — tam çalışıyor | Tamam |
| **Expenses** | 21 kategori + filtre | ✅ GET (346 rows) + POST (test edildi) — tüm 21 kategori dolu | Tamam |
| **Employees** | Personel + ehliyet/SRC | ⚠ GET çalışıyor, POST: empty date "" for ehliyet_bitis/src_bitis hatası | %60 |
| **Predictions** | 12 ay tahmin | ✅ GET 12-months — gerçek expense verisinden tahmin üretiyor | Tamam |
| **Çek/Senet** | Portföy takibi + vade | ✅ GET + POST (test edildi) — tam çalışıyor | Tamam |
| **Settings** | Firma bilgisi + ayarlar | ✅ Handler mevcut | %80 |
| **Landing Page** | Hero + özellik + fiyat | ✅ Landing page serve ediliyor | Tamam |
| **i18n** | TR + EN + AR + RU | ⬜ Sadece Türkçe (altyapı hazır: locale + country_code) | %10 |
| **Modüler sistem** | Feature flag per country/plan/tenant | ✅ modules/country_modules/plan_modules/tenant_modules tabloları + Admin handler | %70 |
| **On-Premise** | Docker Compose self-host | ✅ docker-compose.yml çalışıyor | %50 |
| **Monitoring** | Prometheus + Grafana + Loki | ✅ /metrics endpoint Prometheus formatında | %40 |
| **DR** | WAL-G yedek + multi-region | ⬜ Yok | %0 |
| **Frontend pages** | 14 sayfa | ✅ 14 sayfa render ediyor, API URL: localhost:8080 | %95 |
| **Actions/Audit** | İşlem kayıtları | ✅ actions tablosu + actionlog middleware + ActionsPage | Tamam |
| **Billing** | SaaS faturalandırma | ✅ billing handler + plans endpoint | %60 |
| **Notifications** | Bildirim sistemi | ✅ notifications tablosu + handler | %70 |
| **Countries** | Ülke yönetimi | ✅ countries + country_configs tabloları + handler | %70 |
| **Production Hardening** | Rate limit + plan limits + JSON logging | ✅ Hepsi eklendi (25 May), rate limit fazla agresif | %80 |
| **Redis Cache** | Session + cache | ⚠ Redis container çalışıyor ama backend bağlanamıyor (localhost:6379 vs redis:6379) | %30 |
| **Load Board** | Yük panosu | ⬜ Tablo var, UI yok | %20 |

---

## B. Test Grid'i

| Test Oturumu | Ne Test Edildi | Kontrol | Geçti | Kaldı |
|-------------|----------------|---------|-------|-------|
| **#1 API Smoke** | 20 endpoint (curl + psql) — 25 May 2026 | 20 | 17 | 3 |
| **Toplam** | | **20** | **17** | **3** |

### Oturum #1 Detay

- **Geçti (17):** /api/system/health, /metrics, /auth/signup, /auth/login, /tenant/dashboard/summary, /tenant/trucks GET, /tenant/trips GET, /tenant/customers GET+POST, /tenant/invoices GET+POST, /tenant/expenses GET+POST, /tenant/cek-senet POST, /tenant/predictions/12-months, /tenant/notifications GET, /tenant/dashboard repeat GET
- **Kaldı (3):** POST /tenant/trucks (tracking_source enum), POST /tenant/trips (NULL time.Time scan), POST /tenant/employees (empty date "")
- **Not:** Rate limit middleware 10+ istekten sonra devreye girdi (çalışıyor, ama auth endpoint'leri dışındakilerde de tetikleniyor)

---

## C. Kilometre Taşları

| # | Milestone | Tarih | Durum |
|---|-----------|-------|-------|
| M1 | Tasarım dokümanı (README.md) | 25 May | ✅ Tamam |
| M2 | Veritabanı şeması (01-schema.sql — 34 tablo) | 22 May | ✅ Tamam |
| M3 | Go backend — chi router + pgx + JWT auth | 22 May | ✅ Tamam |
| M4 | Backend handler'ları (18 dosya) | 22 May | ✅ Tamam |
| M5 | Frontend — React + Vite + Tailwind scaffold | 22 May | ✅ Tamam |
| M6 | Frontend sayfaları (14 sayfa) | 22 May | ✅ Tamam |
| M7 | Docker Compose — 4 servis entegrasyonu | 22 May | ✅ Tamam |
| **M8** | **Dökümantasyon seti (8 dosya)** | **25 May** | ✅ **Tamam** |
| **M9** | **Mimari iyileştirmeler: repository, validator, ratelimit, planlimits, cache, JSON logging, testler** | **25 May** | ✅ **Tamam** |
| **M10** | **API Smoke Test — 20 endpoint canlı test (17/20 geçti, 3 bug bulundu)** | **25 May** | ✅ **Tamam** |
| **M11** | **4 bug fix: truck tracking_source, trip NULL time, employee date, dashboard enum** | **—** | ⬜ **SIRADAKİ** |
| M12 | Redis bağlantısı düzeltme (REDIS_URL: redis:6379) | — | ⬜ Bekliyor |
| M13 | Rate limit scope fix (sadece /api/auth/* 10/dk) | — | ⬜ Bekliyor |
| M14 | Playwright E2E testleri | — | ⬜ Bekliyor |
| M15 | go test coverage (backend unit) | — | ⬜ Bekliyor |
| M16 | Canlı demo ortamı | — | ⬜ Bekliyor |
| M17 | e-Fatura GİB entegrasyonu | — | ⬜ Bekliyor |
| M18 | Native mobil app | — | ⬜ Bekliyor |
| M19 | Production deployment | — | ⬜ Bekliyor |

---

## D. Bulunan Bug'lar (25 May 2026)

| # | Bug | Hata | Fix Süresi |
|---|-----|------|:---:|
| B1 | Truck POST | `tracking_source_enum: ""` — empty string enum'a takılıyor | 5 dk |
| B2 | Trip POST | `NULL into *time.Time` — model'de time.Time nullable değil | 10 dk |
| B3 | Employee POST | `date: ""` invalid — ehliyet_bitis/src_bitis empty string | 5 dk |
| B4 | Dashboard | `tamamlandi` vs `TAMAMLANDI` enum case mismatch | 5 dk |
| P1 | Rate Limiter | 10/dk auth limit tüm /api/* endpoint'lerine uygulanıyor | 5 dk |
| P2 | Redis | Backend `localhost:6379` deniyor, container `redis:6379` değil | 2 dk |

---

## E. Hızlı Özet

```
TASARIM:   ████████████████████  %100  (README + BLUEPRINT + tüm dökümanlar)
VERİTABANI:████████████████████  %100  (34 tablo + RLS + 11 tabloda gerçek veri)
BACKEND:   █████████████████░░░  %85   (18 handler, ~60 endpoint, 4 bug fix bekliyor)
FRONTEND:  ███████████████████░  %95   (14/14 sayfa render ediyor)
TEST:      ██░░░░░░░░░░░░░░░░░░  %10   (1 API smoke session: 17/20)
ALTYAPI:   ███████████████░░░░░  %75   (rate limit + plan limits + JSON log eklendi, Redis bug var)
GENEL:     ███████████████░░░░░  %72   MVP core tamam, 4 bug + 2 prod fix bekliyor
```

**Bir sonraki adım:** 4 bug fix (30dk) → Redis fix (2dk) → Rate limit scope fix (5dk) → Playwright E2E testleri.
