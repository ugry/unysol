# Unysol — Module Comparison Grid

> **Date:** 27 May 2026
> **Admin modules:** 21 registered in DB
> **End-user functional:** 12 (tested via API + frontend)

---

## Full Grid

| # | Module Key | Module Name | Category | Admin Listed | End-User Functional | Notes |
|---|-----------|-------------|----------|:---:|:---:|---|
| 1 | `auth` | Kimlik Doğrulama | CORE | ✅ | ✅ | Login, signup, Google OAuth, email verification |
| 2 | `tenant_mgmt` | Firma Yönetimi | CORE | ✅ | ✅ | Company registration, plan subscription |
| 3 | `dashboard` | Ana Panel | CORE | ✅ | ✅ | KPI cards, revenue chart, recent activities |
| 4 | `settings` | Ayarlar | CORE | ✅ | ✅ | Company info, language switch |
| 5 | `actions` | İşlem Kayıtları | CORE | ✅ | ✅ | Audit log page renders |
| 6 | `truck_tracking` | Kamyon Takip | FLEET | ✅ | ✅ | CRUD + list, 5 per FREE plan |
| 7 | `maintenance` | Bakım Takvimi | FLEET | ✅ | ❌ | Schema exists, no frontend page/UI |
| 8 | `fuel_logging` | Yakıt Takibi | FLEET | ✅ | ❌ | Schema exists, no frontend page/UI |
| 9 | `trailer_mgmt` | Dorse Yönetimi | FLEET | ✅ | ❌ | Schema exists, no frontend page/UI |
| 10 | `toll_tracking` | HGS Geçiş Takibi | FLEET | ✅ | ❌ | Schema exists, no frontend page/UI |
| 11 | `load_board` | Yük Panosu | FLEET | ✅ | ✅ | Cross-tenant marketplace, city/district, interest, WhatsApp |
| 12 | `invoice_mgmt` | Fatura Yönetimi | FINANCE | ✅ | ✅ | CRUD, PDF, KDV calculation, status tracking |
| 13 | `expense_tracking` | Gider Takibi | FINANCE | ✅ | ✅ | CRUD, 21 categories, category summary |
| 14 | `billing` | Abonelik Faturalandırma | FINANCE | ✅ | ❌ | Endpoint exists, Stripe checkout half-built |
| 15 | `cek_senet` | Çek / Senet Takibi | FINANCE | ✅ | ✅ | CRUD, status tracking, portfolio summary |
| 16 | `customer_mgmt` | Müşteri Yönetimi | CRM | ✅ | ✅ | CRUD, search, export |
| 17 | `trip_mgmt` | Sefer Yönetimi | CRM | ✅ | ✅ | CRUD, quick-create truck/driver/customer, auto-invoice |
| 18 | `employee_mgmt` | Personel Yönetimi | HR | ✅ | ✅ | CRUD, driver license/SRC tracking |
| 19 | `driver_leave` | İzin Takvimi | HR | ✅ | ❌ | Schema exists, no frontend page/UI |
| 20 | `predictions` | Tahmin Motoru | ANALYTICS | ✅ | ✅ | 12-month forecast, seasonal variation |
| 21 | `reports` | Raporlama | ANALYTICS | ✅ | ❌ | No implementation beyond module registration |

---

## Summary

| Status | Count | Modules |
|--------|:---:|---------|
| **Fully functional** (admin + end-user) | **14** | auth, tenant_mgmt, dashboard, settings, actions, truck_tracking, load_board, invoice_mgmt, expense_tracking, cek_senet, customer_mgmt, trip_mgmt, employee_mgmt, predictions |
| **Admin only** (registered, no end-user UI) | **7** | maintenance, fuel_logging, trailer_mgmt, toll_tracking, billing, driver_leave, reports |
| **Total registered** | **21** | |

---

## By Category

| Category | Registered | Functional | Gap |
|----------|:---:|:---:|:---:|
| CORE | 5 | 5 | — |
| FLEET | 6 | 2 | 4 missing UI |
| FINANCE | 4 | 3 | billing incomplete |
| CRM | 2 | 2 | — |
| HR | 2 | 1 | driver_leave missing UI |
| ANALYTICS | 2 | 1 | reports missing |

---

## Gap Analysis

| Module | What's Missing |
|--------|---------------|
| `maintenance` | Frontend page for maintenance records |
| `fuel_logging` | Frontend page for fuel logs |
| `trailer_mgmt` | Frontend page for trailer management |
| `toll_tracking` | Frontend page for HGS toll records |
| `billing` | Stripe checkout button, subscription management UI |
| `driver_leave` | Frontend page for leave calendar |
| `reports` | Report generation, charts, export |
