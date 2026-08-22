# Unysol — Improvement Registry (IMP)

> **All improvements tracked with IMP-XXX IDs.**
> **Last Updated:** 03 June 2026
> **Source:** Competitor analysis (exa.ai), bug hunts, user testing

---

## 🔧 Yapısal Dönüşüm (Yeni Ürün Yönü)

| ID | Task | Why | Effort | Status |
|----|------|-----|:---:|:---:|
| TRF-001 | Ülke profili seam'i — locale, para birimi, vergi (KDV), tarih/sayı formatı, kimlik formatları ve uyumluluk modülleri tek seam altında (bkz. COUNTRY_PORTABILITY.md) | Yeni ülke = yeni profil + locale + uyumluluk modülü; çekirdek kod/şema değişmez | 16h | ⬜ |
| TRF-002 | TR-only runtime sadeleştirmesi — tek ülke (Türkiye) varsayımı | Çok ülkeli yönlendirme/konfigürasyon kaldırıldı | — | ✅ Done |
| TRF-003 | Sistem yöneticisi için ops scriptleri — tenant/plan/modül/email/Stripe yönetimi backend üzerinden (SQL/ops) | Süper admin katmanı kaldırıldı; platform yönetimi backend'de | 8h | ⬜ |
| TRF-004 | Süper admin kod/UI kalıntılarının temizlenmesi (varsa) | Uygulama rolleri yalnızca tenant kapsamında | 4h | ⬜ |

---

## 🔴 P0 — Revenue / Critical

| ID | Task | Why | Effort | Status |
|----|------|-----|:---:|:---:|
| IMP-001 | Stripe checkout — wire frontend button to backend (Settings + Billing pages) | PRO revenue blocked without payment flow | ✅ Done |
| IMP-002 | SMTP/Email connectivity — verification emails actually send to users | Switched from SES to Hostinger SMTP (smtp.hostinger.com:587). Working in QA. Needs deploy. | ✅ Done |
| IMP-003 | WhatsApp notification integration — truckers live on WhatsApp | #1 competitor differentiator (FiloAsistan, Filojistik) | ⬜ |
| IMP-054 | Resend API integration — all system emails via Resend API | Replaces broken SMTP; registration, password reset, notifications | ✅ Done |
| IMP-055 | Delete tenant with data export — backend ops script'i ile silme + isteğe bağlı ZIP dışa aktarma | GDPR compliance, data portability, tenant lifecycle management | ✅ Done |
| IMP-056 | KVKK/Terms consent checkbox on signup | Turkish legal requirement (KVKK Law No. 6698) — explicit opt-in mandatory | ✅ Done |
| IMP-057 | reCAPTCHA v3 on signup/login/forgot-password | Bot protection — prevent automated account creation | ✅ Done |
| IMP-058 | Password strength meter + confirmation + inline policy | Reduce typos, improve password quality, match industry UX | ✅ Done |
| IMP-059 | Account enumeration prevention — identical responses | OWASP: never reveal whether account exists via error messages | ✅ Done |
| IMP-060 | Input trimming + validation (phone, company name) | Prevent garbage data, normalize inputs | ✅ Done |
| IMP-061 | Forgot password resend code + password confirmation | Users locked out if email delayed; typo prevention | ✅ Done |
| IMP-063 | Tam maliyet hesaplama — kullanıcıya tüm maliyetler gösterilecek | Kamyon servis ücreti, lastik aşınması, kamyon amortismanı, HGS/otoyol, vergiler, tüm değişkenlerle tahmini toplam maliyet | ⬜ |

## 🟠 P1 — High Impact

| ID | Task | Why | Effort | Source |
|----|------|-----|:---:|--------|
| IMP-004 | Ops işlem logu — plan değişiklikleri / tenant dondurma işlemleri backend üzerinden loglanır | Compliance, çok kişilik ops ekibi | 2h | Testing |
| IMP-005 | Load board match notification — YUK_VAR ↔ YUK_ARA auto-detect | Network effect: auto-notify when matching loads exist | 4h | Testing |
| IMP-006 | Load board "İlgileniyorum" notify owner via email | Already logs interest, doesn't notify | 1h | Testing |
| IMP-007 | WhatsApp share button on load board listings | Drivers share loads in WhatsApp groups — viral growth | 1h | Filojistik |

## 🟡 P2 — Medium Impact

| ID | Task | Why | Effort | Source |
|----|------|-----|:---:|--------|
| IMP-008 | Gerçek paket dağılımı — abonelik sayıları backend sorgusu ile (Grafana/ops script) | Overview hardcoded placeholder idi | ✅ Done |
| IMP-009 | Son kayıtlar — son 5 tenant backend sorgusu ile (Grafana/ops script) | Overview boş listeydi | ✅ Done |
| IMP-012 | Password reset flow — forgot password + email recovery | Backend endpoints + frontend modal + email template. Tested 6/6 QA. | ✅ Done |
| IMP-051 | **FREE plan enforcement** — backend checks plan_modules for module access | 33/33 test passed: FREE blocked from 10 modules, PRO has 31 | ✅ Done |
| IMP-052 | **Access Management module** — user CRUD + permissions moved from Settings to PRO-only module | FREE blocked, PRO allowed via plan_modules | ✅ Done |
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

---

## Payment Flow Status (June 3 Test)

| Step | Status | Detail |
|------|:---:|------|
| FREE → PRO checkout | ✅ | Stripe redirect works, test card 4242... |
| Webhook upgrades tenant | ✅ | `tenants.plan` set to PRO, `subscriptions` inserted |
| BillingPage shows PRO | ✅ | "PRO Plan — Aktif" banner with expiry date |
| Billing `is_pro: true` | ✅ | `GET /api/tenant/billing/status` returns plan=PRO |
| PRO button disappears | ✅ | BillingPage shows "Zaten PRO" instead of "PRO'ya Yükselt" |
| SettingsPage PRO button | ✅ | Shows "PRO Aktif" badge when is_pro=true |
| PRO modules accessible | ✅ | All 31 modules accessible (JWT has allowed_modules) |
| FREE modules restricted | ✅ | 10 modules blocked with 403 (JWT has 13 allowed) |
| JWT refresh after upgrade | ✅ | Re-login after upgrade picks up new plan modules |

## Summary

| Priority | Count | Done |
|:---:|:---:|:---:|
| P0 | 12 | 10 |
| P1 | 4 | 0 |
| P2 | 17 | 6 |
| P3 | 26 | 0 |
| Yapısal Dönüşüm | 4 | 1 |
| **Total** | **63** | **17** |

## By Source

| Source | Count |
|--------|:---:|
| Competitor analysis (exa.ai) | 22 |
| User testing / QA | 18 |
| Security / Infra | 7 |
| Fleet operations | 3 |
