# Unysol — Modules in Blueprint vs Built

> **Date:** 02 June 2026  
> **Blueprint total:** 49 modules (from BLUEPRINT.md §4)  
> **Built (registered in DB):** 21 modules  
> **Built (fully functional with frontend):** 18 modules  
> **Gap:** 28 modules not implemented  

---

## A. Category-by-Category Comparison

### CORE (5 planned, 5 registered, 4 functional)

| Module | Blueprint? | Registered? | Functional? | Gap |
|--------|:---:|:---:|:---:|---|
| `auth` | ✅ | ✅ | ✅ | — |
| `tenant_mgmt` | ✅ | ✅ | ✅ | — |
| `dashboard` | ✅ | ✅ | ✅ | — |
| `settings` | ✅ | ✅ | ✅ | — |
| `actions` | ✅ | ✅ | ❌ (dead code) | Route missing in App.tsx |

**Status:** 4/5 done. actions has fully coded component but no route.

---

### FLEET (9 planned, 6 registered, 6 functional)

| Module | Blueprint? | Registered? | Functional? | Gap |
|--------|:---:|:---:|:---:|---|
| `truck_tracking` | ✅ | ✅ | ✅ | — |
| `trailer_mgmt` | ✅ | ✅ | ✅ | — |
| `maintenance` | ✅ | ✅ | ✅ | — |
| `fuel_logging` | ✅ | ✅ | ✅ | — |
| `toll_tracking` | ✅ | ✅ | ✅ | — |
| `load_board` | ✅ | ✅ | ✅ | — |
| `tire_tracking` | ✅ | ❌ | ❌ | Not implemented |
| `route_optimization` | ✅ | ❌ | ❌ | Not implemented |
| `geofencing` | ✅ | ❌ | ❌ | Not implemented |

**Status:** 6/9 done. Missing: tire_tracking, route_optimization, geofencing.

---

### FINANCE (9 planned, 4 registered, 3 functional)

| Module | Blueprint? | Registered? | Functional? | Gap |
|--------|:---:|:---:|:---:|---|
| `invoice_mgmt` | ✅ | ✅ | ✅ | — |
| `expense_tracking` | ✅ | ✅ | ✅ | — |
| `cek_senet` | ✅ | ✅ | ✅ | — |
| `billing` | ✅ | ✅ | ❌ (backend only) | No frontend page |
| `e_invoice` | ✅ | ❌ | ❌ | GİB API integration not done |
| `payroll` | ✅ | ❌ | ❌ | Not implemented |
| `currency_exchange` | ✅ | ❌ | ❌ | Not implemented |
| `bank_integration` | ✅ | ❌ | ❌ | Not implemented |
| `payment_tracking` | ✅ | ❌ | ❌ | Not implemented |

**Status:** 3/9 done. billing backend exists, e-invoice partially in invoice_mgmt.

---

### CRM (5 planned, 2 registered, 2 functional)

| Module | Blueprint? | Registered? | Functional? | Gap |
|--------|:---:|:---:|:---:|---|
| `customer_mgmt` | ✅ | ✅ | ✅ | — |
| `trip_mgmt` | ✅ | ✅ | ✅ | — |
| `proposal_system` | ✅ | ❌ | ❌ | Not implemented |
| `customer_portal` | ✅ | ❌ | ❌ | Not implemented |
| `contract_mgmt` | ✅ | ❌ | ❌ | Not implemented |

**Status:** 2/5 done.

---

### HR (5 planned, 2 registered, 2 functional)

| Module | Blueprint? | Registered? | Functional? | Gap |
|--------|:---:|:---:|:---:|---|
| `employee_mgmt` | ✅ | ✅ | ✅ | — |
| `driver_leave` | ✅ | ✅ | ✅ | — |
| `driver_allowance` | ✅ | ❌ | ❌ | Not implemented |
| `driver_performance` | ✅ | ❌ | ❌ | Not implemented |
| `payslip` | ✅ | ❌ | ❌ | Not implemented |

**Status:** 2/5 done.

---

### ANALYTICS (5 planned, 2 registered, 1 functional)

| Module | Blueprint? | Registered? | Functional? | Gap |
|--------|:---:|:---:|:---:|---|
| `predictions` | ✅ | ✅ | ✅ | — |
| `reports` | ✅ | ✅ (DB only) | ❌ | No implementation |
| `export` | ✅ | ❌ | ❌ | Partially in DataGrid export |
| `carbon_tracking` | ✅ | ❌ | ❌ | Not implemented |
| `sustainability_dashboard` | ✅ | ❌ | ❌ | Not implemented |

**Status:** 1/5 done. reports registered but empty.

---

### COMPLIANCE (4 planned, 0 registered)

| Module | Blueprint? | Registered? | Functional? | Gap |
|--------|:---:|:---:|:---:|---|
| `tr_efatura` | ✅ | ❌ | ❌ | e-Fatura UBL-TR in invoice_mgmt but GİB not connected |
| `tr_vergi` | ✅ | ❌ | ❌ | Not implemented |
| `kvkk` | ✅ | ❌ | ❌ | Not implemented |
| `eu_gdpr` | ✅ | ❌ | ❌ | Not implemented |

**Status:** 0/4 done.

---

### INTEGRATION (4 planned, 0 registered)

| Module | Blueprint? | Registered? | Functional? | Gap |
|--------|:---:|:---:|:---:|---|
| `dkv_integration` | ✅ | ❌ | ❌ | Not implemented |
| `whatsapp_integration` | ✅ | ❌ | ❌ | Not implemented |
| `sms_integration` | ✅ | ❌ | ❌ | Not implemented |
| `gps_multi_provider` | ✅ | ❌ | ❌ | Not implemented |

**Status:** 0/4 done.

---

### PLATFORM (3 planned, 0 registered but partly in admin panel)

| Module | Blueprint? | Registered? | Functional? | Gap |
|--------|:---:|:---:|:---:|---|
| `modules_mgmt` | ✅ | ❌ (not registered) | ✅ (in admin) | Implemented via modules handler |
| `countries` | ✅ | ❌ (not registered) | ✅ (in admin) | Implemented via countries handler |
| `on_premise_deploy` | ✅ | ❌ | ❌ | Not implemented |

**Status:** 2/3 done via admin handlers.

---

### ADDON Functions (from ADDONFUNCTIONS.md — 27 proposed)

| # | Function | Source | Priority | Status |
|---|----------|--------|:---:|:---:|
| F01 | Toplu Sevkiyat Yazdırma | Filojistik | HIGH | ❌ |
| F02 | Fabrika ve İşletme Takibi | Filojistik | MEDIUM | ❌ |
| F03 | Ürün / Hizmet Kayıtları | Filojistik | MEDIUM | ❌ |
| F04 | Ödeme / Tahsilat / Çek Modülü | Filojistik | HIGH | ✅ Built (cek_senet) |
| F05 | WhatsApp Otomatik Bildirim | Filojistik | HIGH | ❌ |
| F06 | Sizi Arayalım Formu | Filojistik | MEDIUM | ❌ |
| F07 | Demo Hesap Oluşturma | Filojistik | HIGH | ✅ Built (demo.go) |
| F08 | Karbon Ayak İzi Sayacı | Kamyoon | LOW | ❌ |
| F09 | Ödüller / Destekçiler Bölümü | Kamyoon | LOW | ❌ |
| F10 | Nakliye Fiyatı Hesaplama Aracı | Kamyoon | LOW | ❌ |
| F11 | Canlı Demo (Gerçek Çalışan) | FiloMetrik | HIGH | ✅ Built |
| F12 | Yıllık/Aylık Fiyat Toggle | FiloMetrik | MEDIUM | ❌ |
| F13 | Canlı Destek Chat Widget | FiloMetrik | MEDIUM | ❌ |
| F14 | Güvenli Ödeme Badge'leri | FiloMetrik | LOW | ❌ |

**Addon status:** 3/14 analyzed built.

---

## B. Overall Completion

```
Blueprint:        49 modules planned
Registered (DB):  21 modules  (43%)
Fully Functional: 18 modules  (37%)
Backend Only:      1 module   (billing)
Dead Code:         1 module   (actions — no route)
Missing:          28 modules  (57%)
```

```
Category           Planned   Registered   Functional   Complete %
────────────────────────────────────────────────────────────────
CORE                   5          5            4           80%
FLEET                  9          6            6           67%
FINANCE                9          4            3           33%
CRM                    5          2            2           40%
HR                     5          2            2           40%
ANALYTICS              5          2            1           20%
COMPLIANCE             4          0            0            0%
INTEGRATION            4          0            0            0%
PLATFORM               3          0            2*          67%
════════════════════════════════════════════════════════════════
TOTAL                 49         21           18           37%
```

\* Platform modules implemented via admin handlers without module registration.

---

## C. Required Actions

### 🔴 Immediate (fix without building new features)
1. **actions** — Add `<Route>` in App.tsx + sidebar entry (component already coded)
2. **billing** — Create BillingPage.tsx with plan selector + Stripe checkout + invoice history

### 🟠 High Priority (next modules to build)
3. **reports** — Basic reporting (revenue, expenses, trips by date range)
4. **whatsapp_integration** — WhatsApp Business API for notifications
5. **proposal_system** — Teklif/fiyat teklifi management
6. **contract_mgmt** — Contract/sözleşme tracking

### 🟡 Medium Priority
7. **driver_allowance** — Driver harcırah/allowance tracking
8. **driver_performance** — Driver performance metrics (trips, fuel efficiency, revenue)
9. **payroll** — Basic maaş bordro for employees
10. **tire_tracking** — Lastik takip (purchase, rotation, wear, replacement)

### 🟢 Low Priority / Nice-to-Have
11. **route_optimization** — Rota optimizasyonu
12. **geofencing** — Coğrafi sınır alarmları
13. **currency_exchange** — Döviz kuru takibi
14. **bank_integration** — Banka API entegrasyonu
15. **carbon_tracking** — Karbon ayak izi
16. **kvkk** — KVKK uyumluluk modülü
17. **eu_gdpr** — GDPR uyumluluk (EU expansion)
18. **sms_integration** — SMS bildirim
19. **gps_multi_provider** — Multi-provider GPS (TomTom, Here, Google)
20. **on_premise_deploy** — Self-host deployment package

---

## D. Frontend Pages Checklist

| Page | Route | Module | DataGrid | API Calls |
|------|-------|--------|:---:|:---:|
| DashboardHome | `/dashboard` | dashboard | — | ✅ |
| TrucksPage | `/dashboard/trucks` | truck_tracking | ✅ | ✅ |
| TrailersPage | `/dashboard/trailers` | trailer_mgmt | ✅ | ✅ |
| TripsPage | `/dashboard/trips` | trip_mgmt | ✅ | ✅ |
| CustomersPage | `/dashboard/customers` | customer_mgmt | ✅ | ✅ |
| InvoicesPage | `/dashboard/invoices` | invoice_mgmt | ✅ | ✅ |
| CekSenetPage | `/dashboard/cek-senet` | cek_senet | ✅ | ✅ |
| LoadBoardPage | `/dashboard/load-board` | load_board | ✅ | ✅ |
| ExpensesPage | `/dashboard/expenses` | expense_tracking | ✅ | ✅ |
| EmployeesPage | `/dashboard/employees` | employee_mgmt | ✅ | ✅ |
| FuelLogPage | `/dashboard/fuel-logs` | fuel_logging | ✅ | ✅ |
| TollLogsPage | `/dashboard/toll-logs` | toll_tracking | ✅ | ✅ |
| MaintenancePage | `/dashboard/maintenance` | maintenance | ✅ | ✅ |
| DriverLeavePage | `/dashboard/driver-leave` | driver_leave | ✅ | ✅ |
| PredictionsPage | `/dashboard/predictions` | predictions | — | ✅ |
| SettingsPage | `/dashboard/settings` | settings | — | ✅ |
| ActionsPage | **NO ROUTE** | actions | ✅ | ✅ |
| BillingPage | **DOES NOT EXIST** | billing | — | — |
| ReportsPage | **DOES NOT EXIST** | reports | — | — |

---

## E. DB Tables vs Modules Mapping

| Table | Module | Status |
|-------|--------|:---:|
| tenants, users, subscriptions | auth + tenant_mgmt | ✅ |
| trucks | truck_tracking | ✅ |
| trailers | trailer_mgmt | ✅ |
| trips | trip_mgmt | ✅ |
| customers | customer_mgmt | ✅ |
| invoices, invoice_items, invoice_payments, e_fatura_logs, invoice_recurrences | invoice_mgmt | ✅ |
| expenses | expense_tracking | ✅ |
| employees | employee_mgmt | ✅ |
| cek_senet | cek_senet | ✅ |
| driver_leave | driver_leave | ✅ |
| maintenance_records | maintenance | ✅ |
| fuel_logs | fuel_logging | ✅ |
| toll_logs | toll_tracking | ✅ |
| load_board | load_board | ✅ |
| billing | billing | ⚠️ Backend only |
| predictions | predictions | ✅ |
| modules, country_modules, plan_modules, tenant_modules | modules_mgmt | ✅ (admin) |
| countries, country_configs | countries | ✅ (admin) |
| actions | actions | ❌ (dead code) |
| settings | settings | ✅ |
| notifications | notifications | ✅ (in settings) |
| insurance_policies | — | ⚠️ Schema exists, no module |
| password_resets | auth | ✅ |
