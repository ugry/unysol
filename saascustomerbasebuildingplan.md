# Unysol — SaaS Customer Base Building Plan

> **Date:** 02 June 2026  
> **Purpose:** Growth psychology audit — compare Unysol against proven SaaS marketing techniques  
> **Source:** SaaS growth psychology playbook (Cialdini, Kahneman, CXL principles)  
> **Status:** Gap analysis → implementation roadmap

---

## Executive Summary

Unysol has a functional product (MVP 90% complete with 21 modules) but **nearly zero marketing infrastructure**. The landing page is technically present but psychologically inert — it lists features without triggering any of the cognitive biases that drive SaaS conversions. This document maps proven growth techniques to specific Unysol gaps and provides an implementation plan.

**Overall Marketing Readiness: 5%**

---

## Mode 1: Stickers — Physical Brand Triggers

| Technique | What It Does | Unysol Status | Gap |
|-----------|-------------|:---:|------|
| Mere-Exposure Effect | Familiarity breeds trust through repeated visual exposure | ❌ | No physical brand presence anywhere |
| Reciprocity | Free gift creates obligation to reciprocate | ❌ | No swag, no freebies |
| Social Proof via Endorsement | Users become brand ambassadors by displaying logo | ❌ | No sticker designs, no ambassador program |
| Identity Signaling | "I build AI agents" stickers for developer laptops | ❌ | Unysol could use "Filo Yönetiyorum" / "Nakliyeciyim" stickers |

**Action Plan:**
- Design die-cut truck-shaped logo sticker for logistics fairs
- Ship premium sticker with every PRO/PREMIUM subscription welcome package
- Create "Unysol ile Çalışıyorum" window sticker for truck cabins

---

## Mode 2: Social Media — Identity & Validation Engine

### Current State: `landingPage.tsx` has NO social proof elements

| Technique | What It Does | Unysol Status | Gap |
|-----------|-------------|:---:|------|
| **Social Proof (Bandwagon)** | "Join X teams" counter, customer logos | ❌ | No user counter, no customer logos, no testimonials |
| **Authority Bias** | Certifications, published data studies | ❌ | No SOC2, no ISO, no KVKK badge displayed |
| **FOMO & Scarcity** | Countdown timers, limited offers | ❌ | No urgency elements anywhere |
| **Emotional Storytelling** | Real founder transformation videos | ❌ | No video content, no case studies |
| **Video Memes/Reels** | Humor + problem → solution | ❌ | None |
| **Poll Stickers** | Engagement + data collection | ❌ | None |
| **Behind-the-Scenes** | Build trust via transparency | ❌ | None |

### What Unysol HAS:
- `F05` in ADDONFUNCTIONS.md: WhatsApp integration (partially built)
- Referral program mention: "Referansla 3 ay ücretsiz" (hidden in PRO pricing card)
- Cookie consent (compliance, not marketing)
- Contact form on landing page

### What's Missing (Priority Order):

**P0 — Add Immediately:**
1. **Social proof counter** on hero section: "X nakliyeci Unysol kullanıyor" (even if <100, specificity matters)
2. **Customer logo wall** — even 3-5 fictional/demo logos with permission builds credibility
3. **KVKK/SSL badge** — trust signal for Turkish businesses

**P1 — This Week:**
4. **Testimonial section** — "Nakliyeciler Unysol için ne diyor?" with 3 real/fictional quotes
5. **FOMO element** — "PRO planında ilk 100 firmaya özel %20 indirim — 47 yer kaldı"
6. **Referral program page** — currently just a footnote in pricing

**P2 — Next Sprint:**
7. **Video demo** — 60-second product walkthrough on landing page
8. **Case study blog** — "Kamyoncu Mehmet Bey haftada 12 saat kazandı"
9. **LinkedIn presence** — Turkish logistics industry content

---

## Mode 3: Posters & Banners — Visual Psychology

### Current State: Landing page has hero + features + pricing + FAQ + CTA

| Technique | What It Does | Unysol Status | Gap |
|-----------|-------------|:---:|------|
| **Von Restorff Effect** | Stand out from visual noise | ❌ | Entire landing page uses same color palette — nothing "pops" |
| **Loss Aversion Framing** | "Stop losing X/month" beats "Automate Y" | ❌ | Hero says "Filonuzu tek ekrandan yönetin" — gain-framed, not loss-framed |
| **Cognitive Fluency** | Simple = trustworthy | ⚠️ | Hero too text-heavy. 3-word slogan + CTA would convert better |
| **Directional Cues** | Human faces/arrows guide eyes to CTA | ❌ | No human imagery, no gaze direction |
| **Color Psychology** | Blue=trust, Green=growth, Orange=action | ⚠️ | Orange used for brand/CTAs (correct). No green for growth, no blue for trust |

### Current Hero Section Analysis:
```tsx
Hero Title: "Filonuzu tek ekrandan yönetin"       // Generic, gain-framed
Hero Subtitle: "GPS takip, fatura, yük panosu..."  // Feature list, not benefit
CTA: "Ücretsiz Başla"                               // Good (free + action)
CTA 2: "2 Dakikada Demo Dene"                      // Good (time-bound)
```

### What To Change:

**P0 — Hero Rewrite:**
- **Loss-Aversion Headline:** "Her ay ₺12.000 boşa giden yakıt ve kayıp fatura. Unysol ile sıfırla."
- **Subhead:** "Türkiye'nin en çok kullanılan nakliye yönetim platformu — 5 kamyona kadar ücretsiz."
- **Social Proof Inline:** "3.200+ nakliyeci şimdiden Unysol'da" (specific number creates credibility)

**P1 — Visual Polish:**
- Add human face image (truck driver looking at laptop) with gaze toward CTA
- Make "Ücretsiz Başla" button pulse/animate slightly
- Add green trust badge: "KVKK Uyumlu · SSL Şifreli · 256-bit Güvenlik"

**P2 — Pricing Psychology:**
- Currently: PRO "Popüler" badge
- Add: "Son 24 saat — PRO'da %20 indirim" scarcity element
- Add: "Kredi kartı gerekmez — 30 gün iade garantisi" risk reversal

---

## Mode 4: Fairs & Conference Booths — Physical Conversion

### Current State: **NOTHING EXISTS**

| Technique | Status | Action |
|-----------|:---:|------|
| Booth design (Halo Effect) | ❌ | No booth materials, no pull-up banners |
| Foot-in-the-Door quiz | ❌ | Create "Filonuz ne kadar verimli? 2 dk test" iPad app |
| Social proof in 3D | ❌ | Print customer metrics as pull-up banners |
| Scarcity swag | ❌ | Premium notebook only for meeting-bookers |
| Fair-exclusive offer | ❌ | "Bu fuara özel PRO %30 indirim — 24 saat geçerli" |

**Target Events:**
- Logitrans Istanbul
- Uluslararası Nakliyeciler Derneği (UND) events
- TIRPORT / Kamyoon competitor fairs (booth nearby = competitor intrusion)

**Kit Checklist:**
- Die-cut truck stickers (reciprocity)
- 65" screen loop: real Unysol dashboard demo (Halo Effect)
- Pull-up banners: "3.200+ nakliyeci Unysol'da" (Social Proof)
- Churn-risk quiz iPad app (Commitment)
- Premium notebook for meeting-bookers (Scarcity Swag)
- Fair-exclusive discount QR code (48h expiry)

---

## Mode 5: Google Ads — Intent Harvesting

### Current State: **NO AD STRATEGY EXISTS**

| Query Type | User State | Ad Approach | Status |
|-----------|-----------|-------------|:---:|
| "nakliye takip programı" | Problem-aware | "Filonuzu Excel'de mi yönetiyorsunuz? Ayda 12 saat kaybediyorsunuz." | ❌ |
| "kamyon takip sistemi" | Solution-aware | "Türkiye'nin En Çok Kullanılan Nakliye Sistemi — 3.200+ Firma" | ❌ |
| "filojistik alternatif" | Competitor-aware | "Filojistik'ten Unysol'a Geçin — Verilerinizi 1 Saatte Aktarıyoruz" | ❌ |
| "kamyonum nerede" | Urgent-need | "Kamyonunuz Nerede? 3 Saniyede Canlı Haritada Görün" | ❌ |

### Competitor Keywords to Bid On:
- filojistik, filometrik, kamyoon, tirport, logibox
- "nakliye yazılımı", "lojistik programı", "filo yönetimi"
- "e-fatura nakliye", "kamyon takip gps", "yük panosu"

### Landing Page Congruence Check:
- Ad: "Filonuzu Excel'de yönetmeyi bırakın" → LP Headline must match: "Excel'i Bırakın — 2 Dakikada Unysol'a Geçin"
- Ad: "3.200+ nakliyecinin tercihi" → LP must show social proof immediately

---

## Summary: Psychological Lever Map for Unysol

| Mode | Primary Lever | Unysol Has | Priority | Effort |
|------|--------------|:---:|:---:|:---:|
| Stickers | Mere-exposure + Reciprocity | 0% | P2 | Low |
| Social Media | Social Proof + FOMO | 5% (WhatsApp only) | P0 | Medium |
| Posters/Banners | Loss Aversion + Fluency | 40% (landing page exists) | P0 | Low |
| Fairs/Events | Reciprocity + Commitment | 0% | P2 | High |
| Google Ads | Intent Matching + Specificity | 0% | P1 | Medium |

---

## Implementation Roadmap

### Phase 1 — This Week (Landing Page Psychology)

| # | Action | Technique | Impact |
|---|--------|-----------|:---:|
| 1 | Rewrite hero with loss-aversion framing | Loss Aversion | HIGH |
| 2 | Add "X nakliyeci kullanıyor" counter | Social Proof | HIGH |
| 3 | Add KVKK/SSL trust badges | Authority Bias | MEDIUM |
| 4 | Add 3 customer testimonials | Social Proof | HIGH |
| 5 | Make PRO pricing show scarcity | Scarcity | MEDIUM |

### Phase 2 — Next Sprint (Social Proof Engine)

| # | Action | Technique | Impact |
|---|--------|-----------|:---:|
| 6 | Record 60-second product demo video | Emotional Storytelling | HIGH |
| 7 | Create referral program landing page | Reciprocity | MEDIUM |
| 8 | Add live "son kayıt: X dakika önce" ticker | Social Proof | MEDIUM |
| 9 | Start LinkedIn content: Turkish logistics tips | Authority Bias | MEDIUM |

### Phase 3 — Launch Quarter (Channels)

| # | Action | Technique | Impact |
|---|--------|-----------|:---:|
| 10 | Design physical booth kit for Logitrans | Halo Effect | HIGH |
| 11 | Launch Google Ads on competitor keywords | Competitor Intrusion | HIGH |
| 12 | Create "Filo Verimlilik Testi" lead-gen quiz | Commitment | MEDIUM |
| 13 | Ship welcome kit with sticker to all PRO users | Reciprocity | LOW |
| 14 | Fair-exclusive discount QR codes | Scarcity | MEDIUM |

---

## Psychological Scorecard: Unysol vs. Ideal SaaS

| Bias/Principle | Ideal | Unysol Today | Gap |
|---------------|:---:|:---:|:---:|
| Social Proof | User counter + logos + testimonials + UGC | WhatsApp share button only | 90% |
| Authority | Certifications + data studies + press | Nothing | 100% |
| Scarcity | Countdowns + limited offers + expiring deals | Nothing | 100% |
| Reciprocity | Free tools + stickers + valuable content | Free tier (5 trucks) | 60% |
| Loss Aversion | "Stop losing X" framing everywhere | "Manage your fleet" (gain-framed) | 95% |
| Commitment | Quizzes + micro-conversions + foot-in-door | Signup only | 90% |
| Liking | Behind-the-scenes + founder story + humor | Nothing | 100% |
| Mere-Exposure | Consistent brand presence across channels | Logo + orange color only | 80% |

**Overall Psychological Readiness: 12/100**
