# Unysol — Competitor Intelligence & Gap Analysis

> **Purpose:** Where do we lack against each competitor? What features should we build?
> **Updated:** 25 May 2026

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
Filom360 Temel:   ~500 TL  (site satılık)       │
Arvento:        ~1,200 TL                        │
Mobiliz:        ~1,500 TL                        │
FiloMetrik:     ~1,999 TL  (10x Unysol)         │
Tırport:        ~2,500 TL  (12.5x Unysol)       │
Samsara TR:     ~3,500 TL                        │
Webfleet:       ~4,000 TL                        │
─────────────────────────────────────────────────┘
Unysol is 2.5x to 20x CHEAPER than every competitor
```

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

| # | What | Why | From Competitor |
|---|------|-----|----------------|
| 1 | **Test suite** | Zero tests currently, critical for production | Best practice |
| 2 | **Load board UI** | Schema exists, no frontend | Tırport, Kamyoon |
| 3 | **e-Fatura GİB** | Legal requirement for scaling | FiloMetrik |
| 4 | **Batch shipping** | Turkish truckers need this | Filojistik |
| 5 | **Factory/depot tracking** | Customer factory integration | Filojistik |
| 6 | **Product/service records** | Link products to trips | Filojistik |
| 7 | **Native mobile app** | PWA limits on iOS | Kamyoon, Filojistik |
| 8 | **WhatsApp auto-notify** | Critical for driver comms | Filojistik |
| 9 | **Allowances UI** | Harcırah/avans for drivers | FiloMetrik |
| 10 | **SMS notifications** | Schema exists, integration missing | FiloMetrik, Filojistik |
| 11 | **Bulk CSV import** | Data migration for new tenants | FiloMetrik |
| 12 | **Carbon tracking UI** | Growing EU requirement | Kamyoon |
