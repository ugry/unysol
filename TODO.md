# Unysol — Improvement Registry (IMP)

> **All improvements tracked with IMP-XXX IDs.**
> **Last Updated:** 03 June 2026
> **Source:** Competitor analysis (exa.ai), bug hunts, user testing

---

## 🔴 P0 — Revenue / Critical

| ID | Task | Why | Effort | Status |
|----|------|-----|:---:|:---:|
| IMP-001 | Stripe checkout — wire frontend button to backend (Settings + Billing pages) | PRO revenue blocked without payment flow | ✅ Done |
| IMP-002 | SMTP/Email connectivity — verification emails actually send to users | Users cannot verify email, blocked from login | ⬜ |
| IMP-003 | WhatsApp notification integration — truckers live on WhatsApp | #1 competitor differentiator (FiloAsistan, Filojistik) | ⬜ |

## 🟠 P1 — High Impact

| ID | Task | Why | Effort | Source |
|----|------|-----|:---:|--------|
| IMP-004 | Admin audit log — track who changed plans/suspended tenants | Compliance, multi-admin teams | 2h | Testing |
| IMP-005 | Load board match notification — YUK_VAR ↔ YUK_ARA auto-detect | Network effect: auto-notify when matching loads exist | 4h | Testing |
| IMP-006 | Load board "İlgileniyorum" notify owner via email | Already logs interest, doesn't notify | 1h | Testing |
| IMP-007 | WhatsApp share button on load board listings | Drivers share loads in WhatsApp groups — viral growth | 1h | Filojistik |

## 🟡 P2 — Medium Impact

| ID | Task | Why | Effort | Source |
|----|------|-----|:---:|--------|
| IMP-008 | Admin real package distribution — query subscription counts | Overview shows hardcoded placeholder | ✅ Done |
| IMP-009 | Admin recent registrations — real last 5 tenants | Overview shows empty list | ✅ Done |
| IMP-051 | **FREE plan enforcement** — backend checks plan_modules for module access | DB correctly configured (13 modules for FREE), needs wiring to JWT/middleware | 2h | Security |

## IMP-051 Sub-Tasks (FREE Plan Enforcement)

| # | Task | Effort | Status |
|---|------|:---:|:---:|
| IMP-051a | Add `GetTenantModules(plan)` to read plan_modules into JWT on login | 30m | ⬜ |
| IMP-051b | Add `allowed_modules` claim to JWT token in auth handler | 15m | ⬜ |
| IMP-051c | Add middleware check: reject 403 if module not in JWT claims | 30m | ⬜ |
| IMP-051d | Sidebar filters by `allowed_modules` (already reads my-permissions, extend) | 15m | ⬜ |
| IMP-051e | After PRO upgrade, invalidate old JWT or re-login to refresh modules | 15m | ⬜ |
| IMP-051f | Test: FREE user blocked from cek_senet, predictions, employees, reports | 15m | ⬜ |
| IMP-010 | Admin country management UI — add/edit countries | Only TR exists, no UI to add more | 3h | Testing |
| IMP-011 | Admin module toggle per country/plan — feature flag UI | Modules visible, toggles not fully wired | 2h | Testing |
| IMP-012 | Password reset flow — forgot password + email recovery | Users locked out without Google login | 2h | Testing |
| IMP-013 | Fuel price tracking widget — compare to EPDK prices | #1 Turkish trucker pain point (exa.ai research) | 2h | Testing |
| IMP-014 | SMS notifications — trip status, invoice reminders | FiloMetrik & Filojistik have this | 4h | FiloMetrik |
| IMP-015 | Bulk CSV import — migrate data from Excel/competitors | FiloMetrik has this; critical for onboarding | 3h | FiloMetrik |
| IMP-016 | Driver mobile app native (iOS/Android) — not just PWA | FiloMetrik & Kamyoon have native apps | 16h | FiloMetrik |
| IMP-017 | Harcırah/avans yönetimi — driver per-diem allowances | FiloMetrik has this; schema partially exists | 4h | FiloMetrik |
| IMP-018 | TCMB döviz kurları — auto-fetch currency rates | FiloMetrik has this; needed for intl loads | 2h | FiloMetrik |
| IMP-019 | Canlı demo sayfası — one-click demo without registration | FiloMetrik & Filojistik both have this | ✅ Done |
| IMP-020 | "Sizi Arayalım" form — lead capture on landing | Nakliyeciler form doldurmaz, aranmak ister | 1h | Filojistik |
| IMP-021 | Toplu sevkiyat yazdırma — batch print shipment docs | Turkish truckers need physical documents | 3h | Filojistik |
| IMP-022 | Fabrika ve işletme takibi — customer factory/depot tracking | Link production schedules to logistics | 6h | Filojistik |
| IMP-023 | Ürün/hizmet kayıtları — product records for cargo types | Link products to trips | 3h | Filojistik |
| IMP-024 | Müşteri yorumları (gerçek fotoğraflı) — testimonials | Social proof for landing page conversion | 2h | Navlungo |

## 🟢 P3 — Low Priority / Nice-to-Have

| ID | Task | Why | Effort | Source |
|----|------|-----|:---:|--------|
| IMP-025 | Yük Panosu rating system — 5-star after transaction | Trust building for marketplace | 6h | Testing |
| IMP-026 | PRO/PREMIUM verified badge on load board listings | Monetization incentive — makes PRO visible | 1h | Testing |
| IMP-027 | Yük Panosu anti-spam — duplicate city/city/date detection | Board quality — prevent spam listings | 1h | Testing |
| IMP-028 | Dashboard "Bu Ay Özet" KPI — revenue/expense/profit card | Quick profit snapshot at a glance | 1h | Testing |
| IMP-029 | Database backup automation — cron pg_dump | Disaster recovery (RPO compliance) | 1h | Infra |
| IMP-030 | Production reverse proxy — Caddy → Traefik | Long-term scalability for multi-region | 8h | Infra |
| IMP-031 | Email digests — weekly summary to active users | Retention — users reminded of value | 4h | Testing |
| IMP-032 | Load board saved search alerts — "Bursa→İstanbul yeni yük" | Daily engagement — brings users back | 4h | Testing |
| IMP-033 | Karbon ayak izi sayacı — live CO2 on landing page | ESG signaling — Kamyoon has this | 2h | Kamyoon |
| IMP-034 | Nakliye fiyatı hesaplama aracı — public freight calculator | Lead generation tool on website | 3h | Kamyoon |
| IMP-035 | Canlı destek chat widget — tawk.to benzeri | FiloMetrik has this; builds trust | 2h | FiloMetrik |
| IMP-036 | Yıllık/aylık fiyat toggle on landing page | FiloMetrik has this; annual discount display | 1h | FiloMetrik |
| IMP-037 | Güvenli ödeme badge'leri — SSL/3D Secure footer | Trust signals for first-time buyers | 0.5h | FiloMetrik |
| IMP-038 | Klavye kısayolları — CTRL+N new trip etc | Power-user efficiency | 2h | Testing |
| IMP-039 | Toplu işlemler (multi-select) — bulk delete/export | DataGrid already supports; needs wiring | 2h | Testing |
| IMP-040 | Yazdırmaya uygun görünümler — print CSS for invoices | Physical document requirement for TR | 2h | Testing |
| IMP-041 | Çevrimdışı mod — queue GPS when no signal | Driver app must have for trucks in tunnels/remote | 8h | Testing |
| IMP-042 | 2FA — SMS/TOTP two-factor authentication | Enterprise adoption requirement | 6h | Security |
| IMP-043 | Yakıt kartı entegrasyonu — DKV/PetrolOfisi auto-import | Auto-import fuel data from card providers | 8h | Integration |
| IMP-044 | HGS otomatik veri çekme — PTT portal auto-import | Auto-import toll records | 4h | Integration |
| IMP-045 | Muhasebe export — LOGO/NetSis/Mikro format | Turkish accounting software interoperability | 4h | Integration |
| IMP-046 | U-ETDS entegrasyonu — Ulaştırma Bakanlığı reporting | Legal requirement for certain transport types | 6h | Integration |
| IMP-047 | Rota optimizasyonu — multi-stop route planner | FiloAsistan AI has this; Unysol blueprint feature | 16h | Fleet |
| IMP-048 | Geofencing uyarıları — depot arrival/departure alerts | Fleet management standard feature | 8h | Fleet |
| IMP-049 | Yakıt hırsızlığı tespiti — OBD vs manual receipt compare | Alert on >5% fuel discrepancy | 4h | Fleet |
| IMP-050 | Araç muayene/sigorta/MTV takvimi — countdown reminders | Schema has date fields but no reminder system | 3h | Fleet |
| IMP-051 | Plan modules enforcement — backend checks plan_modules for FREE users | DB configured correctly but not yet wired to JWT claims or middleware | 2h | Security |

---

## Payment Flow Status (June 3 Test)

| Step | Status | Detail |
|------|:---:|------|
| FREE → PRO checkout | ✅ | Stripe redirect works, test card 4242... |
| Webhook upgrades tenant | ✅ | `tenants.plan` set to PRO, `subscriptions` inserted |
| BillingPage shows PRO | ✅ | "PRO Plan — Aktif" banner with expiry date |
| Billing `is_pro: true` | ✅ | `GET /api/tenant/billing/status` returns plan=PRO |
| PRO button disappears | ✅ | BillingPage shows "Zaten PRO" instead of "PRO'ya Yükselt" |
| SettingsPage PRO button | ⚠️ | Still shows PRO'ya Yükselt (uses separate state, not billing API) |
| PRO modules accessible | ⚠️ | All modules return 200 — no plan enforcement yet (IMP-051) |
| FREE modules restricted | ❌ | No enforcement — FREE users can access all modules (IMP-051) |
| JWT refresh after upgrade | ❌ | Old JWT may still have FREE claims — needs re-login (IMP-051e) |

## Summary

| Priority | Count | Done |
|:---:|:---:|:---:|
| P0 | 3 | 1 |
| P1 | 5 | 0 |
| P2 | 19 | 2 |
| P3 | 25 | 0 |
| **Total** | **51** | **3** |

## By Source

| Source | Count |
|--------|:---:|
| Competitor analysis (exa.ai) | 22 |
| User testing / QA | 18 |
| Security / Infra | 7 |
| Fleet operations | 3 |
