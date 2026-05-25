# Unysol — Addon Functions

> **Purpose:** Functions to be added that are NOT listed in BLUEPRINT.md
> **Source:** Competitor analysis, user feedback, testing discoveries, market research
> **Status:** Proposed — not in current development scope
> **Last Updated:** 25 May 2026

---

## A. DISCOVERED FROM COMPETITOR ANALYSIS

### From Filojistik (filojistik.org)

```
F01 — TOPLU SEVKİYAT YAZDIRMA
  Batch print multiple shipment documents at once.
  Source: Filojistik "Toplu Sevkiyat Yazdırma" feature.
  Priority: HIGH — Turkish truckers need physical docs.

F02 — FABRİKA VE İŞLETME TAKİBİ
  Track customer factories/depots as managed entities.
  Link production schedules to logistics planning.
  Source: Filojistik "Fabrika ve İşletme Takibi".
  Priority: MEDIUM

F03 — ÜRÜN / HİZMET KAYITLARI
  Register products/services being transported.
  Link to trips for cargo type tracking.
  Source: Filojistik "Ürün / Hizmet Kayıtları".
  Priority: MEDIUM

F04 — ÖDEME / TAHSİLAT / ÇEK MODÜLÜ
  ✅ BUILT — Çek/Senet module implemented (cek_senet table + handler + CekSenetPage).
  Full payment tracking including promissory notes (senet) and cheques.
  Source: Filojistik "Ödeme, Tahsilat ve Çek Modülü".
  Priority: HIGH

F05 — WHATSAPP OTOMATİK BİLDİRİM
  Auto-send shipment notifications to drivers via WhatsApp.
  Source: Filojistik WhatsApp integration.
  Priority: HIGH

F06 — SİZİ ARAYALIM FORMU
  "We'll call you" lead capture form on landing page.
  Nakliyeciler form doldurmaz, aranmak ister.
  Source: Filojistik landing page widget.
  Priority: MEDIUM

F07 — DEMO HESAP OLUŞTURMA SAYFASI
  One-click demo account creation without registration.
  Pre-loaded with sample data for instant evaluation.
  Source: Filojistik app.filojistik.org/DemoOlustur.aspx
  Priority: HIGH
```

### From Kamyoon (kamyoon.com)

```
F08 — KARBON AYAK İZİ SAYACI
  Live CO2 counter on landing page showing total emissions saved.
  "Kurtarılan kg CO2" + "Ağaç Kurtuldu" display.
  Source: Kamyoon homepage carbon counter.
  Priority: LOW

F09 — ÖDÜLLER / DESTEKÇİLER BÖLÜMÜ
  Display awards, grants, and institutional backers on landing page.
  Builds trust with enterprise customers.
  Source: Kamyoon homepage EU/World Bank/Ministry logos.
  Priority: LOW (requires actual awards first)

F10 — NAKLİYE FİYATI HESAPLAMA ARACI
  Public freight cost calculator (distance × weight × rate).
  Lead generation tool on website.
  Source: Kamyoon "Nakliye Fiyatı Hesaplama".
  Priority: LOW
```

### From FiloMetrik (filometrik.com)

```
F11 — CANLI DEMO (GERÇEK ÇALIŞAN)
  Working demo environment with pre-loaded data.
  Priority: HIGH

F12 — YILLIK/AYLIK FİYAT TOGGLE
  Monthly vs annual pricing switch with discount display.
  Source: FiloMetrik pricing page.
  Priority: MEDIUM

F13 — CANLI DESTEK CHAT WIDGET
  Live chat widget on landing page and in-app.
  Source: FiloMetrik tawk.to-style chat widget.
  Priority: MEDIUM

F14 — GÜVENLİ ÖDEME BADGE'LERİ
  3D Secure, 256-bit SSL, PayTR, Troy logos in footer.
  Source: FiloMetrik footer.
  Priority: LOW
```

### From Navlungo (navlungo.com)

```
F15 — MÜŞTERİ YORUMLARI (GERÇEK FOTOĞRAFLI)
  Real customer testimonials with photos, names, and company.
  Source: Navlungo "Müşteri Hikayeleri".
  Priority: MEDIUM

F16 — ÇOKLU DEPO ADRESLERİ GÖSTERİMİ
  Display company warehouse locations on landing page.
  Schema has depo_adresleri JSONB but no public display.
  Source: Navlungo footer warehouse addresses.
  Priority: LOW
```

---

## B. DISCOVERED FROM TESTING & UX REVIEW

```
T01 — KARANLIK/AYDINLIK TEMA TOGGLE
  Dark/light mode switch in settings.
  Currently: only dark theme implemented.
  Priority: MEDIUM

T02 — KLAVYE KISAYOLLARI
  Power-user keyboard shortcuts for common actions.
  CTRL+N = new trip, CTRL+I = new invoice, etc.
  Priority: LOW

T03 — TOPLU İŞLEMLER (MULTI-SELECT)
  Bulk select + action for tables (delete multiple, export selected).
  Currently: DataGrid supports bulk operations.
  Priority: MEDIUM

T04 — SON İŞLEMLER / AKTİVİTE AKIŞI
  Activity feed showing last actions across all modules.
  Currently: actions table + ActionsPage mevcut.
  Priority: LOW

T05 — ÖZELLEŞTİRİLEBİLİR DASHBOARD WIDGET'LARI
  User can add/remove/reorder KPI cards on dashboard.
  Priority: LOW

T06 — YAZDIRMAYA UYGUN GÖRÜNÜMLER
  Print-optimized CSS for invoices, trip sheets, reports.
  Priority: MEDIUM

T07 — ÇEVRİMDIŞI MOD
  Basic offline functionality for driver mobile app.
  Queue GPS data when no signal, sync when online.
  Priority: HIGH (for driver app)

T08 — PWA ANA EKRANA EKLE PROMPT'U
  "Add to Home Screen" prompt for mobile users.
  Priority: LOW
```

---

## C. SECURITY & COMPLIANCE ADDITIONS

```
S01 — İKİ FAKTÖRLÜ DOĞRULAMA (2FA)
  SMS or TOTP-based second factor.
  Priority: MEDIUM (required before enterprise adoption)

S02 — OTURUM YÖNETİMİ
  View and revoke active sessions per user.
  Priority: LOW

S03 — IP BEYAZ LİSTELEME (TENANT BAZINDA)
  Restrict tenant access to specific IP ranges.
  Priority: LOW

S04 — ŞİFRE POLİTİKASI
  Minimum length, complexity requirements, expiry.
  Priority: MEDIUM

S05 — RATE LIMITING PER TENANT
  Global + per-IP rate limiting middleware.
  Priority: HIGH (required before production)

S06 — GİRİŞ DENEMESİ KİLİTLEME
  Lock account after N failed login attempts.
  Priority: MEDIUM
```

---

## D. INTEGRATION ADDITIONS

```
I01 — YAKIT KARTI ENTEGRASYONU (DKV, PETROL OFİSİ)
  Auto-import fuel transactions from fuel card providers.
  DKV Mobility API integration.
  Priority: MEDIUM

I02 — BANKA HESAP ÖZETİ EŞLEŞTİRME
  Auto-match bank statements with invoices/expenses.
  Priority: LOW

I03 — TRAFİK CEZASI SORGULAMA (EGM API)
  Auto-fetch traffic fines by plate number.
  Priority: LOW

I04 — HGS/OTOYOL OTOMATİK VERİ ÇEKME
  Auto-import toll records from PTT HGS portal.
  Priority: MEDIUM

I05 — MUHASEBE YAZILIMI EXPORT (LOGO, NETSiS, MiKRO)
  Export financial data to popular Turkish accounting software.
  Priority: MEDIUM

I06 — E-DEVLET ENTEGRASYONU
  Verify tax numbers, plate numbers via e-Devlet APIs.
  Priority: LOW

I07 — U-ETDS ENTEGRASYONU
  Auto-report to Ulaştırma Elektronik Takip ve Denetim Sistemi.
  Legal requirement for certain transport types.
  Priority: MEDIUM
```

---

## E. FLEET & OPERATIONS ADDITIONS

```
FL01 — ROTA OPTİMİZASYONU
  Multi-stop route optimization with traffic consideration.
  Compare routes by: time, fuel cost, toll cost.
  Priority: MEDIUM

FL02 — GEOFENCING UYARILARI
  Alert when truck enters/leaves defined zones.
  Depot arrival/departure auto-detection.
  Priority: MEDIUM

FL03 — SOĞUK ZİNCİR TAKİBİ (FRIGO)
  Temperature monitoring for refrigerated transport.
  Priority: LOW (niche)

FL04 — YAKIT HIRSIZLIĞI TESPİTİ
  Compare OBD fuel data vs manual receipts.
  Alert on >5% discrepancy.
  Priority: MEDIUM

FL05 — SÜRÜCÜ DAVRANIŞ ANALİZİ
  Score drivers on: harsh braking, acceleration, speeding, idling.
  Gamification with leaderboard.
  Priority: LOW

FL06 — OTOMATİK GİDER OCR
  Scan fuel/maintenance receipts via phone camera.
  Auto-extract amount, date, category.
  Priority: LOW

FL07 — LASTİK DERİNLİK TAKİBİ
  Periodic tire depth measurement logging with alerts.
  Priority: MEDIUM

FL08 — ARAÇ MUAYENE / SİGORTA / MTV TAKVİMİ
  Countdown to inspection, insurance, tax deadlines.
  Auto-calculate MTV based on vehicle age and engine size.
  Schema has date fields (muayene_bitis, insurance expiry) but no reminder system.
  Priority: HIGH
```

---

## F. CUSTOMER EXPERIENCE ADDITIONS

```
C01 — MÜŞTERİ PORTALI (SELF-SERVICE)
  Customers can log in to view their own trips, invoices, payment status.
  Reduces support calls.
  Priority: MEDIUM

C02 — MÜŞTERİ DEĞERLENDİRME SİSTEMİ
  Rate customers by payment speed, communication, volume.
  Priority: LOW

C03 — SÖZLEŞME YÖNETİMİ
  Upload, track expiry, and link contracts to customers.
  Schema has sozlesme_url but no management UI.
  Priority: MEDIUM
```

---

## G. DEVELOPER/API ADDITIONS

```
D01 — API GELİŞTİRİCİ PORTALI
  Public API documentation with Swagger UI.
  API key management for Premium tenants.
  Priority: MEDIUM

D02 — WEBHOOK SİSTEMİ
  Configurable webhooks for events (trip completed, invoice paid, etc.).
  Priority: LOW

D03 — BEYAZ ETİKET ÖZELLEŞTİRME
  Premium tenants can upload custom logo, colors, domain.
  Priority: LOW (Premium feature)
```

---

## H. REPORTING ADDITIONS

```
R01 — ÖZEL RAPOR OLUŞTURUCU
  Drag-and-drop custom report builder.
  Priority: LOW

R02 — FİLO EMİSYON RAPORU
  Fleet-wide CO2 emission report for sustainability compliance.
  Priority: LOW

R03 — SÜRDÜRÜLEBİLİRLİK DASHBOARD'U
  Green logistics metrics: fuel efficiency trends, emission reductions.
  Priority: LOW
```

---

## SUMMARY — PRIORITY MATRIX

```
┌───────┬──────────────────────────────────┬──────────┐
│ PRIO  │ FUNCTION                         │ SOURCE   │
├───────┼──────────────────────────────────┼──────────┤
│ HIGH  │ F01 Toplu Sevkiyat Yazdırma      │Filojistik│
│ HIGH  │ F04 Ödeme/Tahsilat/Çek Modülü    │Filojistik│ ✅ DONE
│ HIGH  │ F05 WhatsApp Otomatik Bildirim   │Filojistik│
│ HIGH  │ F07 Demo Hesap Oluşturma         │Filojistik│
│ HIGH  │ F11 Canlı Demo (çalışan)         │FiloMetrik│
│ HIGH  │ T07 Çevrimdışı Mod (şoför app)   │ Testing  │
│ HIGH  │ S05 Rate Limiting                │ Security │
│ HIGH  │ FL08 Muayene/Sigorta/MTV Takvimi │ Fleet    │
├───────┼──────────────────────────────────┼──────────┤
│ MEDIUM│ F02 Fabrika ve İşletme Takibi    │Filojistik│
│ MEDIUM│ F03 Ürün/Hizmet Kayıtları        │Filojistik│
│ MEDIUM│ F06 Sizi Arayalım Formu          │Filojistik│
│ MEDIUM│ F12 Yıllık/Aylık Fiyat (signup)  │FiloMetrik│
│ MEDIUM│ F13 Canlı Destek Chat            │FiloMetrik│
│ MEDIUM│ F15 Gerçek Müşteri Yorumları     │Navlungo │
│ MEDIUM│ T01 Karanlık/Aydınlık Tema       │ Testing  │
│ MEDIUM│ T03 Toplu İşlemler               │ Testing  │
│ MEDIUM│ T06 Yazdırma Görünümleri         │ Testing  │
│ MEDIUM│ S01 İki Faktörlü Doğrulama       │ Security │
│ MEDIUM│ S04 Şifre Politikası             │ Security │
│ MEDIUM│ S06 Giriş Kilitleme              │ Security │
│ MEDIUM│ I01 Yakıt Kartı Entegrasyonu     │ Integr.  │
│ MEDIUM│ I04 HGS Otomatik Veri Çekme      │ Integr.  │
│ MEDIUM│ I05 Muhasebe Export (Logo vb)    │ Integr.  │
│ MEDIUM│ I07 U-ETDS Entegrasyonu          │ Integr.  │
│ MEDIUM│ FL01 Rota Optimizasyonu          │ Fleet    │
│ MEDIUM│ FL02 Geofencing Uyarıları        │ Fleet    │
│ MEDIUM│ FL04 Yakıt Hırsızlığı Tespiti   │ Fleet    │
│ MEDIUM│ FL07 Lastik Derinlik Takibi      │ Fleet    │
│ MEDIUM│ C01 Müşteri Portalı              │ Customer │
│ MEDIUM│ C03 Sözleşme Yönetimi            │ Customer │
│ MEDIUM│ D01 API Geliştirici Portalı      │ Developer│
├───────┼──────────────────────────────────┼──────────┤
│ LOW   │ F08 Karbon Ayak İzi Sayacı       │ Kamyoon  │
│ LOW   │ F09 Ödüller/Destekçiler          │ Kamyoon  │
│ LOW   │ F10 Nakliye Fiyatı Hesaplama     │ Kamyoon  │
│ LOW   │ F14 Ödeme Badge'leri             │FiloMetrik│
│ LOW   │ F16 Çoklu Depo Adresleri         │Navlungo │
│ LOW   │ T02 Klavye Kısayolları           │ Testing  │
│ LOW   │ T04 Son İşlemler Akışı           │ Testing  │
│ LOW   │ T05 Dashboard Widget Özelleştirme│ Testing  │
│ LOW   │ T08 PWA Ana Ekrana Ekle          │ Testing  │
│ LOW   │ S02 Oturum Yönetimi              │ Security │
│ LOW   │ S03 IP Beyaz Listeleme           │ Security │
│ LOW   │ I02 Banka Hesap Eşleştirme       │ Integr.  │
│ LOW   │ I03 Trafik Cezası Sorgulama      │ Integr.  │
│ LOW   │ I06 e-Devlet Entegrasyonu        │ Integr.  │
│ LOW   │ FL03 Soğuk Zincir Takibi         │ Fleet    │
│ LOW   │ FL05 Sürücü Davranış Analizi     │ Fleet    │
│ LOW   │ FL06 Otomatik Gider OCR          │ Fleet    │
│ LOW   │ C02 Müşteri Değerlendirme        │ Customer │
│ LOW   │ D02 Webhook Sistemi              │ Developer│
│ LOW   │ D03 Beyaz Etiket Özelleştirme    │ Developer│
│ LOW   │ R01 Özel Rapor Oluşturucu        │ Reporting│
│ LOW   │ R02 Filo Emisyon Raporu          │ Reporting│
│ LOW   │ R03 Sürdürülebilirlik Dashboard  │ Reporting│
└───────┴──────────────────────────────────┴──────────┘

Total: 48 addon functions (1 DONE, 7 HIGH, 23 MEDIUM, 17 LOW)
```

---

## INTEGRATION WITH BLUEPRINT

These addon functions are NOT in BLUEPRINT.md. They represent:

1. **Competitor-driven additions** (F01-F16) — Features competitors have that we should match
2. **Testing discoveries** (T01-T08) — UX improvements found during QA
3. **Security hardening** (S01-S06) — Production-readiness requirements
4. **Integration expansion** (I01-I07) — Third-party service connections
5. **Fleet operations** (FL01-FL08) — Advanced fleet management features
6. **Customer experience** (C01-C03) — Self-service and relationship management
7. **Developer platform** (D01-D03) — API ecosystem and customization
8. **Reporting** (R01-R03) — Advanced analytics and compliance reports

When a function moves from ADDONFUNCTIONS.md to implementation, it should be added to BLUEPRINT.md and tracked in BUILT.md.
