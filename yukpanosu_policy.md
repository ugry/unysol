# Unysol — Yük Panosu Policy & Governance

> **Date:** 27 May 2026
> **Current State:** Cross-tenant marketplace, 10 active listings
> **Goal:** Clean, useful, high-engagement load board

---

## 1. TRUCKER PERSPECTIVE

### Current Problems

| # | Problem | Impact |
|---|---------|--------|
| 1 | **Listings stay forever** — no auto-expiry. Yük 3 ay önce verilmiş, hala AKTIF görünüyor | Wastes time scrolling dead listings |
| 2 | **No match notification** — Yük Var veriyorum, Yük Ara veren var, ikimiz de birbirimizi görmüyoruz | Lost business opportunities |
| 3 | **No "found/closed" flow** — Kamyoncu yükü buldu ama ilanı kaldırmayı unutuyor | Dead listings accumulate |
| 4 | **Contact spam risk** — Herkesin telefonu/email'i açıkta. Aracılar, komisyoncular liste toplar | Privacy concern |
| 5 | **No reputation** — Kim güvenilir nakliyeci, kim değil? Bilinmez | Trust issue |
| 6 | **No WhatsApp integration** — Kamyoncular WhatsApp'ta yaşar. İlanı WhatsApp'ta paylaşamaz | Low engagement |
| 7 | **No "save search"** — Her gün aynı rotayı arıyorum, her seferinde filtre girmem gerek | Repetitive work |
| 8 | **Search limited** — Sadece tip/şehir/metin filtresi var. Tonaj, araç tipi, fiyat aralığı filtresi yok | Hard to find specific loads |

### What Happens to Old Listings
- Currently: forever visible (until manually deleted → status=IPAL)
- Should: auto-expire after N days, auto-close after load_date passes

---

## 2. SAAS PRODUCT OWNER PERSPECTIVE

### Growth Strategy: Network Effect

```
DAY 1:    1 trucker posts YUK_ARA → 0 matches → leaves
DAY 7:    10 truckers post → 2 matches → some stay
DAY 30:   100 truckers post → 20 matches → network effect kicks in
DAY 90:   500 truckers → critical mass → becomes daily tool
```

**Key Insight:** The load board is a marketplace. Value = (number of users)². 1 user = useless. 100 users = indispensable.

### Policy Rules (Immediate)

| Rule | Action |
|------|--------|
| **1. Auto-expiry** | All listings expire 7 days after `load_date`. Status → SURESI_DOLDU |
| **2. Daily cleanup** | Backend cron: every midnight, expire past-date listings |
| **3. Max active limit** | FREE: 3 active, PRO: 10, PREMIUM: unlimited |
| **4. Anti-spam** | Same user can't post identical city/city/date twice |
| **5. Contact gate** | Show phone/email only to logged-in users (already done). Add "İlgileniyorum" button that notifies poster |
| **6. Reporting** | "Bu ilanı şikayet et" button — spam/fake listings flagged |

### Matching Engine (Feature)

```
When a YUK_VAR is posted:
  → Search for YUK_ARA with matching route (± city)
  → Notify both parties: "Rotanızla eşleşen bir ilan var"

When a YUK_ARA is posted:
  → Search for YUK_VAR with matching route
  → Notify both parties
```

### Next Features (Ranked)

| # | Feature | Effort | Impact |
|---|---------|:---:|:---:|
| 1 | **Auto-expiry (7 days)** | 2h | High — keeps board clean |
| 2 | **"İlgileniyorum" button** — sends notification to poster | 3h | High — facilitates contact |
| 3 | **WhatsApp share button on each listing** | 1h | High — viral spread |
| 4 | **Price/tonnage/vehicle filters** | 2h | Medium — better search |
| 5 | **Save search / alert** — "Bursa→İstanbul rotasında yeni yük var" | 4h | Medium — daily engagement |
| 6 | **Favorites / watchlist** | 2h | Medium — retention |
| 7 | **Match notification** (auto-detect YUK_VAR ↔ YUK_ARA) | 4h | Medium — wow factor |
| 8 | **Rating system** — 5-star after completed transaction | 6h | Low — trust building |
| 9 | **Load counter** — "Bugün X yeni yük var" on dashboard | 1h | Low — FOMO |
| 10 | **Verified badge** — PRO/PREMIUM users get verified mark | 1h | Low — monetization |

---

## 3. IMPLEMENTATION PLAN

### Phase 1: Clean Up (Today)
- Auto-expiry: 7 days after load_date → SURESI_DOLDU
- Frontend: expiry countdown on each listing ("3 gün kaldı")
- Backend: daily cron job to expire stale listings

### Phase 2: Engagement (This Week)
- "İlgileniyorum" button → in-app notification to poster
- WhatsApp share button on each listing
- Advanced filters (price range, tonnage, vehicle type)

### Phase 3: Network (Next Week)
- Save search with email alert
- Match notification: auto-detect matching listings
- Dashboard widget: "Rotanıza uygun X yük var"

---

## 4. CURRENT STATE vs TARGET

| Metric | Current | Target (30 days) | Target (90 days) |
|---|:---:|:---:|:---:|
| Active listings | 10 | 50+ | 200+ |
| Daily new listings | ~2 | 10+ | 30+ |
| Match rate | 0% | 20% | 50% |
| Repeat users | — | 30% | 60% |
| Expired listings | 0 (forever) | Auto-7d | Auto-7d |
| Contact rate | — | 15% | 25% |

---

## 5. RISKS & MITIGATIONS

| Risk | Mitigation |
|------|------------|
| Spam/fake listings | Rate limit per user, duplicate detection, report button |
| Phone/email scraping | Contact hidden behind login, rate limit on viewing |
| Empty board (cold start) | Seed 10-20 realistic listings at launch, cross-post from other platforms |
| Low engagement | Push notifications, email digests, WhatsApp integration |
