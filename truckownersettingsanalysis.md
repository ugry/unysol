# Unysol — Truck Owner Perspective: Settings Page + Industry Pain Points

> **Role:** Truck company owner (5-10 trucks, newly registered)
> **Account:** uguryardimci82@gmail.com (FREE plan, 3/5 trucks used)
> **Date:** 27 May 2026
> **Research:** exa.ai + Turkish news sources

---

## 1. What I See on Settings Page

As a newly registered truck owner opening Settings:

### Firma Bilgileri
- Shows empty/non-editable fields for company info
- Vergi Dairesi, Vergi No fields exist but empty

### Kullanıcı Yönetimi
- Shows 3 mock users (Kemal Aras, Ayşe Demir, Can Yıldız) with `@unysolar.com` emails
- These are hardcoded fake users — NOT my actual employees
- "Kullanıcı Ekle" button exists

### Bildirim Tercihleri
- Toggle checkboxes for: Sefer başladığında, Sefer tamamlandığında, Fatura vadesi, Bakım hatırlatması, Haftalık özet
- These are UI-only — no backend notification system active (SMTP broken, no WhatsApp)

### Paket Bilgisi
- Shows "Ücretsiz Plan — Mevcut"
- "5 kamyon, 3 kullanıcı, temel raporlama"
- "Kamyon: 3/5, Kullanıcı: 3/3"
- "PRO'ya Yükselt" button → but Stripe not configured, does nothing
- Lists PRO features: Sınırsız kamyon, sınırsız kullanıcı, gelişmiş raporlama, yapay zeka tahminleri, WhatsApp otomasyonu, öncelikli destek

---

## 2. Real Industry Pain Points (exa.ai Research)

### Top Turkish Trucker Problems (May 2026)

| # | Pain Point | Source | Frequency |
|---|-----------|--------|:---:|
| 1 | **Fuel costs (mazot)** — "Bu şekilde devam etmemiz mümkün değil" | CungusHaber, Evrensel, AkcakocaHaber | 🔴 Every source |
| 2 | **Cannot find loads** — "800 TIR şoförü kontak kapattı: çalıştıkça batıyoruz" | AkcakocaHaber | 🔴 |
| 3 | **Rising costs, fixed revenue** — nakliye ücretleri 3-4 yıldır aynı | Evrensel, CungusHaber | 🔴 |
| 4 | **Tax + penalty burden** — "vergi bizde, cezalar bizde" | Multiple sources | 🟠 |
| 5 | **No cost visibility** — owner-operators lose $2-4K/month to untracked expenses | HeavyDutyJournal | 🟠 |
| 6 | **Excel dependency** — "hala Excel'den kurtulamayan firmalar" | Medium/Deniz Cengiz | 🟠 |
| 7 | **Bureaucracy** — excessive paperwork, manual processes | Kamyoon interview | 🟡 |
| 8 | **Competition driving rates down** — ton başı 60$ → 30$ | AkcakocaHaber | 🟠 |
| 9 | **No load matching** — "daha fazla yüke erişim" is #1 demand | Kamyoon, Filomla | 🟠 |
| 10 | **Mobile-first need** — "kamyoncu gözüyle dijitalleştirme" | Kamyoon | 🟡 |

### What Competitors Promise (Kamyoon, Filomla, ATS PRO, Liman Logistics)
- "Tek panelden yönetin" — single dashboard
- "Artık Excel'e gerek yok" — replaces spreadsheets
- "Gerçek zamanlı takip" — real-time tracking
- "Gelir-gider görün" — revenue/expense visibility
- "Daha fazla yük" — load finding
- "Saha operasyonunu dijitalleştirme" — field ops digitalization

---

## 3. Settings Page — Truck Owner Verdict

### What Works ✅
- Settings page loads, navigation works
- Firma Bilgileri form is present
- Kullanıcı Ekle button visible
- Paket Bilgisi shows plan details clearly
- PRO upgrade path is advertised

### What's Broken ❌
| Issue | Detail |
|-------|--------|
| **Mock users in my company** | Kemal Aras, Ayşe Demir, Can Yıldız with `@unysolar.com` emails — these are NOT my employees. Hardcoded fake data |
| **PRO upgrade does nothing** | Stripe not configured, button is dead |
| **Bildirimler don't work** | SMTP not connected, no WhatsApp integration |
| **Vergi bilgileri** | Empty fields, can't save tax info |

### What's Missing 🟡
| Missing Feature | Why It Matters |
|-----------------|---------------|
| **Fuel cost tracking widget** | #1 pain point for Turkish truckers — no fuel price integration |
| **Load board shortcut** | #2 pain point — "yük bulma" should be front and center |
| **Revenue/profit snapshot** | Owner-operators need to see "bu ay ne kazandım" instantly |
| **Bakım takvimi** | Advertised but no frontend page exists (module registered only) |
| **WhatsApp notification** | Turkish truckers live on WhatsApp — "Sefer başladı" should be a WhatsApp message, not an in-app toggle |
| **Phone number in settings** | Can't add/change my phone — critical for load board contacts |
| **Company logo** | Premium feature advertised but not implemented |

---

## 4. Competitive Gap Analysis

| Feature | Unysol | Kamyoon | Filomla | ATS PRO |
|---------|:---:|:---:|:---:|:---:|
| GPS tracking | ✅ | ✅ | ✅ | ✅ |
| Load board | ✅ | ✅ | ❌ | ❌ |
| Fuel tracking | ❌ | ✅ | ✅ | ✅ |
| Maintenance calendar | ❌ | ✅ | ✅ | ✅ |
| Mobile app | PWA only | Native iOS/Android | Web | Web |
| WhatsApp integration | ❌ | ✅ | ❌ | ❌ |
| Cost/profit dashboard | Partial | ✅ | ✅ | ✅ |
| Free tier | ✅ 5 trucks | ❌ | Demo only | ❌ |
| Multi-language | ✅ TR/EN | TR only | TR only | TR only |

---

## 5. Immediate Recommendations for Settings Page

| # | Action | Impact |
|---|--------|:---:|
| 1 | **Remove hardcoded mock users** — show real employees or empty state | Trust |
| 2 | **Wire PRO upgrade to Stripe** — dead button kills credibility | Revenue |
| 3 | **Add "Bu Ay Özet" KPI card** to settings — gelir/gider/kar | Retention |
| 4 | **Integrate fuel price tracking** — even a manual entry with EPDK reference | Differentiation |
| 5 | **WhatsApp notification toggle** — not just in-app, actual WhatsApp messages | Engagement |
| 6 | **Add telefon field to firma bilgileri** — needed for load board contacts | Utility |
