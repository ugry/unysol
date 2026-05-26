# Unysol — SaaS Landing Page Improvement Plan

> **Audit Date:** 26 May 2026
> **Audit Perspectives:** Trucker (owner-operator) + Business Owner (exponential growth)
> **Source:** Dual-perspective analysis of `frontend/src/pages/LandingPage.tsx`

---

## Perspective 1: Trucker (owner-operator, 1-5 trucks, non-technical)

**What works:**
- "Ücretsiz Başla" everywhere — low barrier, no credit card
- "Şoförü aramanıza gerek kalmaz" — hits daily pain point
- Phone GPS — no hardware purchase
- 4-step "Nasıl Çalışır" — simple, scannable

**Issues:**

| Severity | Issue | Status |
|:---:|---|---|
| 🔴 | Load Board invisible — zero mention on landing | ✅ |
| 🔴 | No screenshots — "Profesyonel Arayüz" shows icons, not images | ✅ Removed |
| 🔴 | No mobile screens — truckers live on phones | ✅ Features now mobile-first |
| 🔴 | Corporate language — "otomasyon", "KPI", "risk skoru" meaningless | ✅ |
| 🔴 | FREE is 1 truck — most small fleets have 2-3 | ✅ Changed to 3 |
| 🟠 | Fake testimonials — no photos, old pricing references | ✅ Removed |
| 🟠 | Feature descriptions too long — paragraphs instead of 1-liners | ✅ |
| 🟠 | Tech specs section irrelevant to truckers | ✅ Removed |

---

## Perspective 2: Business Owner (growth to 10K → 100K → 1M in 1 year)

**What works:**
- Free tier structure — essential for viral growth
- Demo account — friction reduction
- i18n infrastructure — expansion-ready

**Issues:**

| Severity | Issue | Status |
|:---:|---|---|
| 🔴 | No referral program — Turkish truckers share in WhatsApp groups | ✅ |
| 🔴 | No WhatsApp share button anywhere | ✅ |
| 🔴 | No analytics — zero tracking, flying blind | ⏳ Ertelendi |
| 🔴 | No pre-signup value — no lead magnet | ⬜ |
| 🔴 | No waitlist/email capture for non-converters | ⬜ |
| 🔴 | 1-truck FREE truncates virality | ✅ Changed to 3 |
| 🟠 | "Demo dönemi" wording creates uncertainty | ✅ |
| 🟠 | No social login — Google/Apple missing | ⬜ |
| 🟠 | PREMIUM opens mailto: — broken on mobile, no lead qual | ✅ Contact form |
| 🟠 | No "powered by" watermark on FREE documents | ⬜ |
| 🟠 | No SEO content — no blog, no keyword targeting | ⬜ |

---

## Implementation Plan (Priority Order)

| # | Fix | Effort | Status |
|---|------|:---:|:---:|
| 1 | Export findings to this file | 5 min | ✅ |
| 2 | Add Load Board to hero headline: "Yük Bul, Takip Et, Fatura Kes" | 5 min | ✅ |
| 3 | Change FREE trucks from 1 → 3 | 1 min | ✅ |
| 4 | Add WhatsApp share button in hero + footer | 30 min | ✅ |
| 5 | Replace "Profesyonel Arayüz" section → removed (demo shows real UI) | 1 min | ✅ |
| 6 | Rewrite feature descriptions to 1 line each in trucker language | 15 min | ✅ |
| 7 | Remove fake testimonials section | 1 min | ✅ |
| 8 | Add referral CTA: "Arkadaşına Öner → PRO 1 ay bedava" | 2 hr | ✅ |
| 9 | Replace mailto: on PREMIUM with lead capture form | 1 hr | ✅ |
| 10 | Remove "Sistem Gereksinimleri" section | 1 min | ✅ |
| 11 | Add Google Analytics + basic event tracking | 30 min | ⏳ Ertelendi |
| 12 | Change "Demo dönemi" → permanent offer wording | 5 min | ✅ |

---

## Test Results (26 May 2026)

| Test | Endpoint | Result |
|------|----------|:---:|
| Backend health | GET /api/system/health | ✅ `{"status":"healthy","db":"connected"}` |
| Landing page | GET http://localhost:5174/ | ✅ HTTP 200 |
| Signup API | POST /api/auth/signup | ✅ Token + tenant_id |
| Demo account | POST /api/demo/create | ✅ `{"demo_created":true}` |
| All 6 Docker services | docker compose ps | ✅ all Up/healthy |
