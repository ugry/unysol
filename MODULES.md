# Unysol — Module Registry (Canonical)

> **Canonical module list.** All other files reference this one.
> **Last Updated:** 03 June 2026
> **Blueprint total:** 49 modules | **Built:** 31 (63%)

---

## A. Fully Functional Modules (Backend + Frontend + Route)

### CORE (4/5 functional)

| # | Module Key | Name | Category | DB Table | Handler | Page |
|---|-----------|------|----------|----------|---------|------|
| 1 | `auth` | Kimlik Doğrulama | CORE | users, password_resets | auth.go, google.go | LoginPage, VerifyEmailPage |
| 2 | `tenant_mgmt` | Firma Yönetimi | CORE | tenants, subscriptions | tenant.go | LandingPage (signup) |
| 3 | `dashboard` | Ana Panel | CORE | (queries) | dashboard.go | DashboardHome |
| 4 | `settings` | Ayarlar | CORE | settings, user_permissions | settings.go, usermanagement.go | SettingsPage, AddUserModal, PermissionsModal |

**1 CORE dead code:** `actions` — fully coded but no `<Route>` in App.tsx.

### FLEET (7/9 functional)

| # | Module Key | Name | Handler | Page |
|---|-----------|------|---------|------|
| 5 | `truck_tracking` | Kamyon Takip | trucks.go | TrucksPage |
| 6 | `trailer_mgmt` | Dorse Yönetimi | trailers.go | TrailersPage |
| 7 | `maintenance` | Bakım Takvimi | maintenance.go | MaintenancePage |
| 8 | `fuel_logging` | Yakıt Takibi | fuel_log.go | FuelLogPage |
| 9 | `toll_tracking` | HGS Geçiş Takibi | toll_logs.go | TollLogsPage |
| 10 | `load_board` | Yük Panosu | loadboard.go | LoadBoardPage |
| 11 | `tire_tracking` | Lastik Takibi | tires.go | TiresPage |

**2 FLEET missing:** `route_optimization`, `geofencing`

### FINANCE (4/9 functional)

| # | Module Key | Name | Handler | Page |
|---|-----------|------|---------|------|
| 12 | `invoice_mgmt` | Fatura Yönetimi | invoices.go | InvoicesPage |
| 13 | `expense_tracking` | Gider Takibi | expenses.go | ExpensesPage |
| 14 | `cek_senet` | Çek/Senet Takibi | cek_senet.go | CekSenetPage |
| 15 | `billing` | Abonelik Faturalandırma | billing.go, stripe.go | — (backend only) |

**5 FINANCE missing:** `e_invoice`, `payroll`, `currency_exchange`, `bank_integration`, `payment_tracking`

### CRM (5/5 functional)

| # | Module Key | Name | Handler | Page |
|---|-----------|------|---------|------|
| 16 | `customer_mgmt` | Müşteri Yönetimi | customers.go | CustomersPage |
| 17 | `trip_mgmt` | Sefer Yönetimi | trips.go | TripsPage |
| 18 | `proposal_system` | Teklif Sistemi | proposals.go | ProposalsPage |
| 19 | `contract_mgmt` | Sözleşme Yönetimi | contracts.go | ContractsPage |
| 20 | `customer_portal` | Müşteri Portalı | (uses customers API) | CustomerPortalPage |

### HR (5/5 functional)

| # | Module Key | Name | Handler | Page |
|---|-----------|------|---------|------|
| 21 | `employee_mgmt` | Personel Yönetimi | employees.go | EmployeesPage |
| 22 | `driver_leave` | İzin Takvimi | driver_leave.go | DriverLeavePage |
| 23 | `driver_allowance` | Harcırah/Avans | allowances.go | AllowancesPage |
| 24 | `driver_performance` | Şoför Performans | (uses reports API) | DriverPerfPage |
| 25 | `payslip` | Bordro | payslips.go | PayslipsPage |

### ANALYTICS (4/5 functional)

| # | Module Key | Name | Handler | Page |
|---|-----------|------|---------|------|
| 26 | `predictions` | Tahmin Motoru | predictions.go | PredictionsPage |
| 27 | `reports` | Raporlama | reports.go | ReportsPage |
| 28 | `carbon_tracking` | Karbon Takibi | — | CarbonTrackingPage |
| 29 | `export` | Veri Dışa Aktarım | (uses module APIs) | ExportPage |

**1 ANALYTICS missing:** `sustainability_dashboard`

### COMPLIANCE (0/4)

`tr_efatura`, `tr_vergi`, `kvkk`, `eu_gdpr` — not implemented.
(e-Fatura UBL-TR XML generation exists in `invoice_mgmt` but GIB API not connected.)

### INTEGRATION (0/4)

`dkv_integration`, `whatsapp_integration`, `sms_integration`, `gps_multi_provider` — not implemented.

### PLATFORM (2/3 functional)

- `modules_mgmt` — Admin panel module toggles ✅
- `countries` — Admin panel country management ✅
- `on_premise_deploy` — Not implemented

---

## B. Category Summary

| Category | Planned | Built | Functional | Complete |
|----------|:---:|:---:|:---:|:---:|
| CORE | 5 | 5 | 4 | 80% |
| FLEET | 9 | 7 | 7 | 78% |
| FINANCE | 9 | 4 | 3 | 44% |
| CRM | 5 | 5 | 5 | 100% |
| HR | 5 | 5 | 5 | 100% |
| ANALYTICS | 5 | 4 | 4 | 80% |
| COMPLIANCE | 4 | 0 | 0 | 0% |
| INTEGRATION | 4 | 0 | 0 | 0% |
| PLATFORM | 3 | 2 | 2 | 67% |
| **TOTAL** | **49** | **31** | **29** | **63%** |

---

## C. Backend Handlers (32 total)

```
actions.go          auth.go             billing.go
cek_senet.go        contact.go          countries.go
customers.go        dashboard.go        demo.go
driver_leave.go     email.go            employees.go
expenses.go         fuel_log.go         google.go
invoices.go         loadboard.go        maintenance.go
modules.go          notifications.go    predictions.go
settings.go         stripe.go           system.go
tenant.go           toll_logs.go        trailers.go
trips.go            trucks.go           trucks_test.go
usermanagement.go   allowances.go       contracts.go
payslips.go         proposals.go        reports.go
tires.go
```

---

## D. Frontend Pages (20)

| Page | Route | Module |
|------|-------|--------|
| DashboardHome | `/dashboard` | dashboard |
| TrucksPage | `/dashboard/trucks` | truck_tracking |
| TrailersPage | `/dashboard/trailers` | trailer_mgmt |
| TripsPage | `/dashboard/trips` | trip_mgmt |
| CustomersPage | `/dashboard/customers` | customer_mgmt |
| InvoicesPage | `/dashboard/invoices` | invoice_mgmt |
| CekSenetPage | `/dashboard/cek-senet` | cek_senet |
| LoadBoardPage | `/dashboard/load-board` | load_board |
| ExpensesPage | `/dashboard/expenses` | expense_tracking |
| EmployeesPage | `/dashboard/employees` | employee_mgmt |
| FuelLogPage | `/dashboard/fuel-logs` | fuel_logging |
| TollLogsPage | `/dashboard/toll-logs` | toll_tracking |
| MaintenancePage | `/dashboard/maintenance` | maintenance |
| DriverLeavePage | `/dashboard/driver-leave` | driver_leave |
| PredictionsPage | `/dashboard/predictions` | predictions |
| SettingsPage | `/dashboard/settings` | settings |
| ReportsPage | `/dashboard/reports` | reports |
| ProposalsPage | `/dashboard/proposals` | proposal_system |
| ContractsPage | `/dashboard/contracts` | contract_mgmt |
| TiresPage | `/dashboard/tires` | tire_tracking |

**No route (dead code):** ActionsPage — fully coded component, needs Route in App.tsx.
**No page:** billing — backend only.

---

## E. Missing Modules (18 remaining to build)

| Category | Module | Effort |
|----------|--------|:---:|
| CORE | actions (fix route) | 15m |
| FLEET | route_optimization, geofencing | 16h |
| FINANCE | e_invoice (GIB), payroll, currency_exchange, bank_integration, payment_tracking | 40h |
| COMPLIANCE | tr_efatura, tr_vergi, kvkk, eu_gdpr | 24h |
| INTEGRATION | dkv, whatsapp, sms, gps_multi_provider | 32h |
| ANALYTICS | sustainability_dashboard | 4h |
| PLATFORM | on_premise_deploy | 16h |

---

## F. Test Coverage (Last Run: June 1, 2026)

| Module | Tests | Passed | Rate |
|--------|:-----:|:-----:|:---:|
| auth | 4 | 3 | 75% |
| dashboard | 4 | 4 | 100% |
| trucks | 6 | 6 | 100% |
| trips | 2 | 2 | 100% |
| customers | 3 | 3 | 100% |
| expenses | 3 | 3 | 100% |
| employees | 3 | 3 | 100% |
| invoices | 2 | 2 | 100% |
| settings | 11 | 10 | 91% |
| predictions | 2 | 2 | 100% |
| load_board | 2 | 2 | 100% |
| **Total tested** | **42** | **40** | **95%** |

**Untested:** cek_senet, actions, maintenance, fuel_logging, trailer_mgmt, toll_tracking, driver_leave, billing, reports, proposals, contracts, tires, allowances, performance, payslip, carbon, export
