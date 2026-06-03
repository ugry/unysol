# Unysol — Competitor Intelligence & Gap Analysis

> **Purpose:** Where do we lack against each competitor? What features should we build?
> **Updated:** 03 June 2026 (pricing refreshed via exa.ai)

---

## 1. COMPETITOR LANDSCAPE

```
┌────────────────────────────────────────────────────────────────────┐
│                    TURKISH LOGISTICS SOFTWARE MARKET               │
├──────────────┬────────────────────────────────────────────────────┤
│ CATEGORY     │ COMPETITORS                                        │
├──────────────┼────────────────────────────────────────────────────┤
│ SaaS Fleet   │ ★ Unysol, Tırport, Filom360 (satılık)             │
│ On-Premise   │ FiloMetrik, Lojisoft                               │
│ Hardware     │ Mobiliz, Arvento, ATSTakip                         │
│ Pazar Yeri   │ Navlungo, Yükal (yukal.net), Sahadan              │
│ Enterprise   │ Kamyoon TMS                                        │
│ Legacy Web   │ Filojistik (filojistik.org)                        │
│ Global       │ Samsara TR, Webfleet (Bridgestone), Fleetboard (MB)│
└──────────────┴────────────────────────────────────────────────────┘
```

---

## 2. COMPETITOR PROFILES

### FiloMetrik (filometrik.com)
```
Type:    On-Premise ERP (PHP + MySQL, self-hosted on cPanel)
Price:   Başlangıç ₺1,999/ay | İşletme ₺3,199/ay | Kurumsal ₺4,799/ay
Trial:   7 days free
Trucks:  2-5 / 5-20 / Unlimited
Founded: ~2023
Users:   120+ companies, 500+ vehicles
```

**Key Features:** Sefer yönetimi, yakıt takip, bakım & servis, teklif sistemi, kârlılık raporu, harcırah & avans, GPS (10+ sağlayıcı), şoför mobil panel, ön muhasebe, e-Fatura (KolayBi BETA), otomatik yedekleme, TCMB döviz, cari hesap, SMS bildirim, toplu import

**What Unysol LACKS vs FiloMetrik:**
- Harcırah & avans yönetimi (❌ — schema'da henüz yok)
- TCMB döviz kurları (❌ — schema'da henüz yok)
- SMS bildirim (❌ — schema var, entegrasyon yok)
- Toplu CSV import (❌ — yok)
- cPanel hosting desteği (❌ — Docker only)
- Canlı demo sayfası (❌ — yok)

### Kamyoon (kamyoon.com)
```
Type:    Enterprise TMS (SaaS, custom pricing)
Price:   Custom quote (B2B sales)
Founded: 2017
Team:    31 employees
Scale:   200+ projects, 250,000+ loads/year
Location: Balıkesir Teknokent
Backers: EU, World Bank, Kalkınma Bankası, Sanayi Bakanlığı
```

**Key Features:** FTL/LTL operations, 3PL/4PL infrastructure, yük borsası (load board), navlun hesaplama, mutabakat & ödeme, uçtan uca izlenebilirlik, kamyoncu mobil app, kooperatif yazılımı, TİO yazılımı, yapay zeka, karbon ayak izi hesaplama

**What Unysol LACKS vs Kamyoon:**
- 3PL/4PL altyapısı (❌ — kompleks, Faz 3)
- Kooperatif yazılımı (❌ — niche)
- TİO yazılımı (❌ — niche, regülasyon ağır)
- Karbon ayak izi (❌ — schema yok)
- Kurumsal referanslar (❌ — sıfır müşteri)
- Ödüller / devlet desteği (❌ — yok)

### Tırport (tirport.com)
```
Type:    SaaS marketplace + fleet management
Price:   Estimated ~2,500 TL/month
Trial:   14 days
Focus:   Medium-large fleets (20-500+ trucks)
```

**Key Features:** Yük panosu (load matching), fleet tracking, digital document management, financial modules

**What Unysol LACKS vs Tırport:**
- Yük panosu / load matching (⬜ — load_board tablosu var, UI yok)
- Banka/sigorta entegrasyonları (❌)
- Marka bilinirliği (❌ — Tırport 10+ yıllık)

### Filojistik (filojistik.org)
```
Type:    Web-based logistics ERP (ASP.NET)
Price:   Not public (demo request)
Company: Divizyon Yazılım Çözümleri Ltd. Şti. (Çorum Teknokent)
Mobile:  Native iOS + Android apps
```

**15 Features (Tüm Özellikler menu):**
1. Özmal Araç Yönetimi
2. Sevkiyat Modülü
3. Toplu Sevkiyat Yazdırma
4. Fabrika Sevkiyat Ekleme ve İzleme Ekranı
5. Toplu Sevkiyat Yönetimi
6. Sürücü Yönetimi
7. Ödeme, Tahsilat ve Çek Modülü
8. Araç Tanımları
9. Fabrika ve İşletme Takibi
10. Ürün / Hizmet Kayıtları
11. Fatura, Fiş Kasa Modülü
12. Genel Gider – Masraf Modülü
13. Kullanıcı ve Rol Yönetimi
14. Filo Yönetim Modülü
15. Araç Yönetimi ve Gider Takibi

**What Unysol LACKS vs Filojistik:**
- Toplu sevkiyat yazdırma (❌ — yok)
- Fabrika sevkiyat izleme (❌ — yok)
- Fabrika ve işletme takibi (❌ — yok)
- Ürün/hizmet kayıtları (❌ — yok)
- Ödeme/tahsilat/çek modülü (✅ — cek_senet modülü mevcut)
- Native iOS/Android app (❌ — sadece PWA)
- WhatsApp otomatik bildirim (❌ — yok)
- Demo hesap oluşturma sayfası (❌ — yok)
- "Sizi Arayalım" formu (❌ — yok)

### Navlungo (navlungo.com)
```
Type:    Digital freight forwarder (not direct competitor)
Focus:   International cargo, e-commerce, FBA, fulfillment
```

**Relevant features:**
- Customer testimonials with photos (❌ — yok)
- Extensive partner/integrator logos (❌ — yok)
- Multi-city warehouse addresses (❌ — depo_adresleri JSONB var ama UI'da yok)
- ISO certifications displayed (❌ — yok)

### Mobiliz / Arvento
```
Type:    Hardware-centric vehicle tracking
Price:   ~1,200-1,500 TL/month (device + software)
Focus:   GPS tracking, CAN bus, fleet monitoring
```

**What we offer they don't:** Full business automation (not just tracking)

---

## 3. FEATURE GAP MATRIX — All Competitors

```
✅ = Unysol has this    ⬜ = Partially    ❌ = Missing
```

| Feature | FiloMetrik | Kamyoon | Tırport | Filojistik | Navlungo | Mobiliz | Unysol GAP |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|------|
| **Fleet Management** |
| GPS tracking | ✅ | ✅ | ✅ | — | — | ✅ | ✅ No gap |
| Phone GPS tracking | — | — | — | — | — | — | ✅ Unique advantage |
| **Operations** |
| Trip management | ✅ | ✅ | ✅ | ✅ | — | — | ✅ No gap |
| Batch shipping | — | — | — | ✅ | — | — | ❌ Missing |
| Factory tracking | — | — | — | ✅ | — | — | ❌ Missing |
| Product records | — | — | — | ✅ | — | — | ❌ Missing |
| Load board | — | ✅ | ✅ | — | ✅ | — | ⬜ Schema exists, no UI |
| **Finance** |
| Invoicing | ✅ | ✅ | ✅ | ✅ | — | — | ✅ No gap |
| e-Invoice | ✅ | — | — | — | — | — | ⬜ Endpoint only |
| Payment/cheque | — | — | — | ✅ | — | — | ✅ Çek/Senet modülü |
| Expense tracking | ✅ | ✅ | — | ✅ | — | — | ✅ No gap |
| Payroll/bordro | ✅ | — | — | — | — | — | ⬜ Partial |
| **HR** |
| Driver management | ✅ | — | — | ✅ | — | — | ✅ No gap |
| Per-diem/allowance | ✅ | — | — | — | — | — | ❌ Missing |
| Leave calendar | — | — | — | — | — | — | ✅ driver_leave table |
| **Analytics** |
| Predictions | — | — | — | — | — | — | ✅ Unique advantage |
| Carbon tracking | — | ✅ | — | — | — | — | ❌ Missing |
| **Platform** |
| Multi-language | — | — | — | — | — | — | ✅ Unique advantage |
| On-Premise | ✅ | — | — | — | — | — | ⬜ Docker only |
| Native mobile | — | ✅ | — | ✅ | — | — | ❌ PWA only |
| WhatsApp integration | — | — | — | ✅ | — | — | ❌ Missing |
| SMS notifications | ✅ | — | — | ✅ | — | — | ❌ Missing |
| Bulk CSV import | ✅ | — | — | — | — | — | ❌ Missing |

**Summary:** 14 features missing across all competitors
- 3 have backend schema support (load board, e-invoice, leave calendar)
- 11 need new development

---

## 4. PRICING COMPARISON (5 trucks, monthly)

```
Unysol PRO:       200 TL  ◀────────────────────┐
FiloMetrik Başl.:  1,999 TL  (2-5 araç)          │
FiloAsistan Başl.: 5,990 TL  (5-25 araç)         │
FiloAsistan Pro:   7,990 TL  (25-100 araç)        │
FiloAsistan Kur.:  12,990 TL (100+ araç)          │
Nakliye Yazılımı:  65,000 TL (one-time lisans)    │
Kamyoon TMS:       B2B (özel fiyat)                │
──────────────────────────────────────────────────┘
Unysol is 10x to 60x CHEAPER than every competitor
```

### Detailed Competitor Package Comparison (June 2026)

| Feature | **Unysol FREE** | **Unysol PRO** | **FiloMetrik** | **FiloAsistan** | **Kamyoon** |
|---------|:---:|:---:|:---:|:---:|:---:|
| Price | **0 TL** | **200 TL/ay** | 1,999 TL/ay | 5,990-12,990 TL/ay | B2B |
| Trucks | 5 | 10 | 2-5 | 5-25+ | Unlimited |
| GPS tracking | ✅ | ✅ | 10+ providers | ✅ | ✅ |
| Trip management | Manual | Auto | ✅ | ✅ | ✅ Uçtan uca |
| Invoice | Manual | ✅ e-Fatura | ✅ | ✅ | ✅ |
| Expense tracking | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fuel tracking | ✅ | ✅ | ✅ | — | ✅ |
| Maintenance | ✅ | ✅ | ✅ | ✅ (Pro) | — |
| Customer CRM | — | ✅ | ✅ | ✅ | ✅ |
| Employee mgmt | — | ✅ | ✅ | — | — |
| Load board | ✅ | ✅ | — | — | ✅ Yük Borsası |
| Predictions/AI | — | ✅ | — | AI agent (Pro) | AI |
| HGS/Toll tracking | — | ✅ | — | ✅ | — |
| Çek/Senet | — | ✅ | ✅ | — | — |
| Mobile app | PWA | PWA | Şoför paneli | ❌ | ✅ Native |
| WhatsApp integration | — | — | ❌ | ✅ AI Ajan | ❌ |
| Multi-language | TR+EN | TR+EN | TR | TR | TR |
| Free tier | ✅ Forever | — | ❌ 7-day trial | ❌ | ❌ |
| On-premise | ✅ | ✅ | ✅ cPanel | ❌ | ✅ |
| Open docs | ✅ GitHub | ✅ | ❌ | ❌ | ❌ |

---

## 5. UNIQUE UNYSOL ADVANTAGES (No Competitor Has)

| Advantage | Detail |
|-----------|--------|
| **Free forever tier** | No competitor offers a truly free plan |
| **Phone GPS (no hardware)** | Start with zero hardware cost |
| **12-month predictions** | AI-driven forecast — unique in TR market |
| **Multi-language** | Ready for TR+EN+AR+RU expansion |
| **Multi-country** | Country config system — expand to AZ, GE, Balkans |
| **On-Premise option** | SaaS OR self-host — only FiloMetrik does this |
| **49 modules planned** | Most comprehensive feature set designed |
| **Open design docs** | Transparent blueprint on GitHub |
| **Go backend** | High performance, low resource usage, stateless |
| **Çek/Senet tracking** | Built-in Turkish financial instrument support |
| **Modular architecture** | Feature flags per country/plan/tenant |

---

## 6. PRIORITY ACTION ITEMS (Ordered)

| # | IMP | What | Why | From Competitor |
|---|-----|------|-----|----------------|
| 1 | IMP-003 | **WhatsApp notification** | Critical for driver comms — they live on WhatsApp | FiloAsistan, Filojistik |
| 2 | IMP-014 | **SMS notifications** | Trip status, invoice reminders for non-smartphone drivers | FiloMetrik, Filojistik |
| 3 | IMP-015 | **Bulk CSV import** | Data migration from Excel/competitors for new tenants | FiloMetrik |
| 4 | IMP-016 | **Native mobile app** | PWA limits on iOS; competitors have native | Kamyoon, Filojistik |
| 5 | IMP-007 | **WhatsApp share on load board** | Viral growth — drivers share loads in WhatsApp groups | Filojistik |
| 6 | IMP-017 | **Harcırah/avans** | Driver allowance tracking — FiloMetrik has full module | FiloMetrik |
| 7 | IMP-018 | **TCMB döviz kurları** | Auto currency rates for international loads | FiloMetrik |
| 8 | IMP-021 | **Toplu sevkiyat yazdırma** | Turkish truckers print physical docs regularly | Filojistik |
| 9 | IMP-022 | **Fabrika/depo takibi** | Customer factory integration for logistics | Filojistik |
| 10 | IMP-023 | **Ürün/hizmet kayıtları** | Product records linked to trips | Filojistik |
| 11 | IMP-035 | **Canlı destek chat** | Build trust, reduce support emails | FiloMetrik |
| 12 | IMP-020 | **"Sizi Arayalım" formu** | Lead capture — truckers prefer calls over forms | Filojistik |
| 13 | IMP-033 | **Karbon sayacı** | ESG signaling on landing page | Kamyoon |
| 14 | IMP-034 | **Nakliye fiyat hesaplama** | Lead gen tool on website | Kamyoon |
| 15 | IMP-036 | **Yıllık/aylık fiyat toggle** | Annual discount display on pricing | FiloMetrik |
| 16 | IMP-043 | **Yakıt kartı entegrasyonu** | DKV/PetrolOfisi auto fuel import | Integration |
| 17 | IMP-044 | **HGS otomatik veri çekme** | PTT portal auto toll import | Integration |
| 18 | IMP-045 | **Muhasebe export** | LOGO/NetSis/Mikro interoperability | Integration |
| 19 | IMP-046 | **U-ETDS entegrasyonu** | Legal requirement for certain transports | Integration |
| 20 | IMP-047 | **Rota optimizasyonu** | Multi-stop route planning | Fleet |
| 21 | IMP-048 | **Geofencing** | Depot arrival/departure alerts | Fleet |
| 22 | IMP-049 | **Yakıt hırsızlığı tespiti** | OBD vs manual receipt comparison | Fleet |
| 23 | IMP-050 | **Araç muayene/sigorta/MTV takvimi** | Countdown reminders for deadlines | Fleet |
| 24 | IMP-024 | **Müşteri yorumları** | Social proof with real photos | Navlungo |
| 25 | IMP-042 | **2FA** | Two-factor auth for enterprise adoption | Security |
