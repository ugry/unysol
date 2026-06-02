# Unysol — Finished Modules & Functions

> **Date:** 02 June 2026  
> **Total registered modules:** 21  
> **Fully functional (backend + frontend + route):** 19  
> **Backend-only (no frontend page):** 1  
> **Dead code (no route registered):** 1  

---

## A. Fully Functional Modules (Backend Handler + Frontend Page + Route)

### 1. Auth (`auth`) — Kimlik Doğrulama
**Category:** CORE | **is_core:** TRUE  
**Frontend:** LoginPage.tsx, VerifyEmailPage.tsx  
**Backend:** auth.go, google.go  
**Functions:**
- POST `/api/auth/signup` — Company registration + tenant creation
- POST `/api/auth/login` — Email + password → JWT token
- POST `/api/auth/google` — Google OAuth hybrid login
- GET `/api/verify` — Email verification page
- Password strength validation (8+ chars, uppercase, digit, special)
- Login lockout (5 failed attempts → 15 min block)
- Signup rate limiting
- JWT token with 1-year expiry, embedded claims (user_id, tenant_id, role, allowed_modules)

---

### 2. Tenant Management (`tenant_mgmt`) — Firma Yönetimi
**Category:** CORE | **is_core:** TRUE  
**Frontend:** LandingPage.tsx (signup flow)  
**Backend:** tenant.go  
**Functions:**
- Company creation during signup (tenants table)
- Plan subscription auto-assignment (FREE by default)
- Tenant settings initialization
- Module feature flag resolution (override chain)

---

### 3. Dashboard (`dashboard`) — Ana Panel
**Category:** CORE | **is_core:** TRUE  
**Frontend:** DashboardHome.tsx  
**Backend:** dashboard.go  
**Functions:**
- GET `/api/tenant/dashboard/summary` — KPI cards (active trucks, today's revenue, monthly profit, pending collections)
- Revenue/expense chart (recharts)
- Recent activities table
- Quick navigation cards

---

### 4. Settings (`settings`) — Ayarlar
**Category:** CORE | **is_core:** TRUE  
**Frontend:** SettingsPage.tsx, AddUserModal.tsx, PermissionsModal.tsx  
**Backend:** settings.go, usermanagement.go  
**Functions:**
- GET/PUT `/api/tenant/settings` — Company info (unvan, vergi_dairesi, vergi_no, adres, telefon)
- GET/PUT `/api/tenant/settings/notifications` — Notification preferences
- GET `/api/tenant/user-management/` — List users
- POST `/api/tenant/user-management/` — Create user (with optimistic UI)
- DELETE `/api/tenant/user-management/{id}` — Delete user (with confirm dialog)
- GET/PUT `/api/tenant/user-management/permissions/{userId}` — Per-user module permissions (can_view, can_create, can_edit, can_delete)
- GET `/api/tenant/my-permissions` — Current user's permissions
- PRO upgrade button with fallback message
- Plan information display (FREE/PRO/PREMIUM)

---

### 5. Truck Tracking (`truck_tracking`) — Kamyon Takip
**Category:** FLEET | **is_core:** FALSE  
**Frontend:** TrucksPage.tsx  
**Backend:** trucks.go  
**Functions:**
- GET `/api/tenant/trucks/` — List trucks (filterable)
- POST `/api/tenant/trucks/` — Add truck (plaka, marka, model, yil, tracking_source)
- PUT `/api/tenant/trucks/{id}` — Edit truck
- DELETE `/api/tenant/trucks/{id}` — Remove truck
- Plan limit enforcement (FREE: 5 trucks, PRO: 10)

---

### 6. Trailer Management (`trailer_mgmt`) — Dorse Yönetimi
**Category:** FLEET | **is_core:** FALSE  
**Frontend:** TrailersPage.tsx  
**Backend:** trailers.go  
**Functions:**
- GET `/api/tenant/trailers/` — List trailers
- POST `/api/tenant/trailers/` — Add trailer (plaka, marka, tip, yil)
- PUT `/api/tenant/trailers/{id}` — Edit trailer
- DELETE `/api/tenant/trailers/{id}` — Remove trailer
- Link trailer to truck (bagli_cekici_id)

---

### 7. Trip Management (`trip_mgmt`) — Sefer Yönetimi
**Category:** CRM | **is_core:** FALSE  
**Frontend:** TripsPage.tsx  
**Backend:** trips.go  
**Functions:**
- GET `/api/tenant/trips/` — List trips (filter by durum, truck, date)
- POST `/api/tenant/trips/` — Create trip (route, fee, payment status, irsaliye)
- PUT `/api/tenant/trips/{id}` — Update trip status (PLANLANDI → DEVAM_EDIYOR → TAMAMLANDI)
- DELETE `/api/tenant/trips/{id}` — Remove trip
- Quick-create truck/driver/customer from trip form
- Auto-invoice generation at trip completion

---

### 8. Customer Management (`customer_mgmt`) — Müşteri Yönetimi
**Category:** CRM | **is_core:** FALSE  
**Frontend:** CustomersPage.tsx  
**Backend:** customers.go  
**Functions:**
- GET `/api/tenant/customers/` — List customers (searchable)
- GET `/api/tenant/customers/{id}` — Customer detail
- POST `/api/tenant/customers/` — Add customer (unvan, vergi_dairesi, vergi_no, telefon, adres)
- PUT `/api/tenant/customers/{id}` — Edit customer
- DELETE `/api/tenant/customers/{id}` — Remove customer
- Export to CSV/Excel/PDF
- Cross-reference with trips, invoices, cek/senet

---

### 9. Invoice Management (`invoice_mgmt`) — Fatura Yönetimi
**Category:** FINANCE | **is_core:** FALSE  
**Frontend:** InvoicesPage.tsx  
**Backend:** invoices.go  
**Functions:**
- GET `/api/tenant/invoices/` — List invoices (filter by status, customer, date)
- GET `/api/tenant/invoices/{id}` — Invoice detail with line items
- POST `/api/tenant/invoices/` — Create invoice (auto-calculated KDV, tevkifat, genel_toplam)
- GET `/api/tenant/invoices/aging` — Aging report (vade analizi)
- PUT `/api/tenant/invoices/{id}/pay` — Record payment
- POST `/api/tenant/invoices/{id}/pdf` — Generate PDF invoice
- POST `/api/tenant/invoices/{id}/e-fatura` — Send e-Fatura (UBL-TR XML)
- GET `/api/tenant/invoices/recurrences` — Recurring invoice templates
- POST `/api/tenant/invoices/recurrences` — Create recurring template
- 6 statuses: Taslak, Onayda, Onaylandı, Gönderildi, Ödendi, İptal

---

### 10. Expense Tracking (`expense_tracking`) — Gider Takibi
**Category:** FINANCE | **is_core:** FALSE  
**Frontend:** ExpensesPage.tsx  
**Backend:** expenses.go  
**Functions:**
- GET `/api/tenant/expenses/` — List expenses (filter by category, date)
- POST `/api/tenant/expenses/` — Add expense (tutar, kategori, aciklama, tarih)
- PUT `/api/tenant/expenses/{id}` — Edit expense
- DELETE `/api/tenant/expenses/{id}` — Remove expense
- GET `/api/tenant/expenses/categories` — Category summary
- 21 categories: YAKIT, BAKIM, LASTIK, TAMIR, SIGORTA, MTV, TRAFIK_CEZASI, KOPRU_OTOYOL, MUAYENE, EGZOZ_EMISYON, TAKOGRAF, YETKI_BELGESI, MAAS, SGK, MUHASEBE, KIRA, ELEKTRIK_SU, INTERNET_TEL, YAZILIM_LISANS, OTOBAN_ABONMAN, DIGER

---

### 11. Çek/Senet (`cek_senet`) — Çek / Senet Takibi
**Category:** FINANCE | **is_core:** FALSE  
**Frontend:** CekSenetPage.tsx (947 lines — most complex module)  
**Backend:** cek_senet.go  
**Functions:**
- GET `/api/tenant/cek-senet/` — List checks/notes
- GET `/api/tenant/cek-senet/{id}` — Single record detail
- GET `/api/tenant/cek-senet/summary` — Portfolio summary (total, by status)
- POST `/api/tenant/cek-senet/` — Create (type: CEK/SENET, bank, debtor, amount, dates)
- PUT `/api/tenant/cek-senet/{id}` — Edit
- PUT `/api/tenant/cek-senet/{id}/status` — Update status (BEKLIYOR → TAHSIL_EDILDI → KARSILIKSIZ → IPTAL)
- DELETE `/api/tenant/cek-senet/{id}` — Remove
- KPI dashboard cards
- Bulk operations

---

### 12. Load Board (`load_board`) — Yük Panosu
**Category:** FLEET | **is_core:** FALSE  
**Frontend:** LoadBoardPage.tsx  
**Backend:** loadboard.go  
**Functions:**
- GET `/api/tenant/load-board/` — List loads (cross-tenant marketplace)
- POST `/api/tenant/load-board/` — Post load (YUK_VAR/YUK_ARA, city, district, cargo description)
- PUT `/api/tenant/load-board/{id}` — Edit load posting
- DELETE `/api/tenant/load-board/{id}` — Remove load
- POST `/api/tenant/load-board/{id}/interest` — Express interest (İlgileniyorum)
- GET `/api/tenant/load-board/stats` — Load board statistics
- GET `/api/cities` — Public city list for dropdowns
- WhatsApp sharing integration
- Filtering by city, type, cargo

---

### 13. Employee Management (`employee_mgmt`) — Personel Yönetimi
**Category:** HR | **is_core:** FALSE  
**Frontend:** EmployeesPage.tsx  
**Backend:** employees.go  
**Functions:**
- GET `/api/tenant/employees/` — List employees
- GET `/api/tenant/employees/{id}` — Detail + metrics
- POST `/api/tenant/employees/` — Add employee (name, phone, role, license info)
- PUT `/api/tenant/employees/{id}` — Edit
- DELETE `/api/tenant/employees/{id}` — Remove
- Driver license tracking (ehliyet_bitis, SRC bitis)
- Cross-reference with trips, driver leave

---

### 14. Driver Leave (`driver_leave`) — İzin Takvimi
**Category:** HR | **is_core:** FALSE  
**Frontend:** DriverLeavePage.tsx  
**Backend:** driver_leave.go  
**Functions:**
- GET `/api/tenant/driver-leave/` — List leave records
- POST `/api/tenant/driver-leave/` — Create leave request (izin_turu, baslangic, bitis, aciklama)
- PUT `/api/tenant/driver-leave/{id}` — Edit
- PUT `/api/tenant/driver-leave/{id}/status` — Approve/Reject (onay_durumu)
- DELETE `/api/tenant/driver-leave/{id}` — Remove
- Leave types: YILLIK_IZIN, HAFTALIK_IZIN, UCRETSIZ_IZIN, SAGLIK_IZNI, MAZERET_IZNI
- Approval workflow: BEKLIYOR → ONAYLANDI → REDDEDILDI

---

### 15. Predictions (`predictions`) — Tahmin Motoru
**Category:** ANALYTICS | **is_core:** FALSE  
**Frontend:** PredictionsPage.tsx  
**Backend:** predictions.go  
**Functions:**
- GET `/api/tenant/predictions/12-months` — 12-month revenue/expense/profit forecast
- POST `/api/tenant/predictions/recalculate` — Recompute predictions from live data
- Seasonal variation modeling
- Chart visualization (recharts)
- Based on historical expense + trip data

---

### 16. Maintenance (`maintenance`) — Bakım Takvimi
**Category:** FLEET | **is_core:** FALSE  
**Frontend:** MaintenancePage.tsx  
**Backend:** maintenance.go  
**Functions:**
- GET `/api/tenant/maintenance/` — List maintenance records
- POST `/api/tenant/maintenance/` — Create (bakim_turu, arac_id, tarih, km, tutar, sonraki_bakim)
- PUT `/api/tenant/maintenance/{id}` — Edit
- DELETE `/api/tenant/maintenance/{id}` — Remove
- 12 maintenance types (bakim_turu_enum)
- Linked to trucks table (arac_id)

---

### 17. Fuel Logging (`fuel_logging`) — Yakıt Takibi
**Category:** FLEET | **is_core:** FALSE  
**Frontend:** FuelLogPage.tsx  
**Backend:** fuel_log.go  
**Functions:**
- GET `/api/tenant/fuel-logs/` — List fuel logs
- POST `/api/tenant/fuel-logs/` — Add (miktar_litre, birim_fiyat, toplam_tutar auto-calculated, arac_id)
- PUT `/api/tenant/fuel-logs/{id}` — Edit
- DELETE `/api/tenant/fuel-logs/{id}` — Remove
- Auto-sync → expenses (fuel category)
- L/100km calculation
- Linked to trucks table

---

### 18. Toll Logs (`toll_tracking`) — HGS Geçiş Takibi
**Category:** FLEET | **is_core:** FALSE  
**Frontend:** TollLogsPage.tsx  
**Backend:** toll_logs.go  
**Functions:**
- GET `/api/tenant/toll-logs/` — List toll records
- POST `/api/tenant/toll-logs/` — Add (gecis_ucreti, giris_gise, cikis_gise, hgs_etiket_no, arac_id, gecis_tarihi)
- PUT `/api/tenant/toll-logs/{id}` — Edit
- DELETE `/api/tenant/toll-logs/{id}` — Remove
- Linked to trucks table

---

### 19. Notifications (`notifications`) — Bildirimler
**Category:** CORE | **is_core:** FALSE  
**Frontend:** Integrated in SettingsPage + bell icon in top bar  
**Backend:** notifications.go  
**Functions:**
- GET `/api/tenant/notifications/` — List notifications
- PUT `/api/tenant/notifications/{id}/read` — Mark as read
- Notification preferences toggles (5 channels)

---

## B. Completed But Unrouted (Dead Code)

### 20. Actions (`actions`) — İşlem Kayıtları
**Category:** CORE | **is_core:** FALSE  
**Frontend:** ActionsPage.tsx (fully coded with DataGrid, API calls, revert)  
**Backend:** actions.go  
**Status:** ❌ DEAD CODE — component imported in App.tsx but NO `<Route>` assigned
**Functions:**
- GET `/api/tenant/actions/` — Audit log (limit 200)
- POST `/api/tenant/actions/{id}/revert` — Revert CREATE/UPDATE/DELETE/BULK_DELETE
- Action types: CREATE, UPDATE, DELETE, BULK_DELETE
- Filter by module, action type, date

---

## C. Backend-Only (No Frontend Page)

### 21. Billing (`billing`) — Abonelik Faturalandırma
**Category:** FINANCE | **is_core:** FALSE  
**Frontend:** None (plan info shown in SettingsPage)  
**Backend:** billing.go, stripe.go  
**Functions:**
- GET `/api/tenant/billing/plans` — Available plans (FREE/PRO/PREMIUM)
- GET `/api/tenant/billing/invoices` — SaaS billing history
- POST `/api/tenant/billing/upgrade` — Plan upgrade
- POST `/api/tenant/billing/cancel` — Cancel subscription
- POST `/api/tenant/stripe/checkout` — Stripe checkout session
- POST `/api/stripe/webhook` — Stripe webhook handler
- GET `/api/admin/stripe/config` — Stripe configuration

---

## D. Admin-Only Modules (Super Admin Panel)

### Admin Dashboard — AdminDashboard.tsx
- Tenant list, MRR analytics, churn rate, growth data
- User management across all tenants
- Module toggle per country/plan/tenant
- Country management (add/edit, regulatory configs)
- Email service configuration (SMTP/SES)
- Stripe configuration

---

## E. Support Modules (No DB Module Registration)

| Module | Backend | Frontend | Function |
|--------|:---:|:---:|---------|
| Demo Account | demo.go | LandingPage.tsx | POST `/api/demo/create` — One-click demo with 3 pre-seeded companies |
| Contact Form | contact.go | HelpPage.tsx | POST `/api/contact/submit` — Public contact form |
| Email Service | email.go | AdminDashboard | GET/POST `/api/admin/email/config`, POST `/api/admin/email/test` |
| Health/System | system.go | — | GET `/api/system/health`, `/health/ready`, `/health/live`, `/metrics` (Prometheus) |
| Permission Enforcement | permissions.go (middleware) | — | 21 URL→module_key mappings, method→permission column, 403 on denied |

---

## F. Module by Category Summary

| Category | Fully Functional | Backend Only | Dead Code | Total |
|----------|:---:|:---:|:---:|:---:|
| CORE | 4 (auth, tenant_mgmt, dashboard, settings) | 0 | 1 (actions) | 5 |
| FLEET | 6 (trucks, trailers, maintenance, fuel, tolls, load_board) | 0 | 0 | 6 |
| FINANCE | 3 (invoices, expenses, cek_senet) | 1 (billing) | 0 | 4 |
| CRM | 2 (trips, customers) | 0 | 0 | 2 |
| HR | 2 (employees, driver_leave) | 0 | 0 | 2 |
| ANALYTICS | 1 (predictions) | 0 | 0 | 1 |
| **Total** | **18** | **1** | **1** | **20** |

_Note: notifications module is counted within CORE (settings integration), reports module has NO implementation beyond DB registration._

---

## G. Test Coverage (Last Run: June 1, 2026)

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

**Modules NOT tested recently:** cek_senet, actions, maintenance, fuel_logging, trailer_mgmt, toll_tracking, driver_leave, billing, reports

---

## H. Backend Handler Files (32 total)

```
actions.go          — Audit log CRUD + revert
admin.go            — Super admin dashboard (tenants, analytics, users)
auth.go             — Signup, login, password validation
billing.go          — Plans, invoices, upgrade, cancel
cek_senet.go        — Çek/Senet CRUD + summary + status
contact.go          — Public contact form submission
countries.go        — Country CRUD + configs
customers.go        — Customer CRUD
dashboard.go        — KPI summary
demo.go             — Demo account creation
driver_leave.go     — Leave CRUD + approval
email.go            — Email config (SMTP/SES)
employees.go        — Employee CRUD + metrics
expenses.go         — Expense CRUD + categories
fuel_log.go         — Fuel log CRUD
google.go           — Google OAuth hybrid login
invoices.go         — Invoice CRUD + PDF + e-Fatura + aging + recurrences
loadboard.go        — Load board CRUD + interest + stats
maintenance.go      — Maintenance CRUD
modules.go          — Module toggle (country/plan/tenant)
notifications.go    — Notification list + mark read
predictions.go      — 12-month forecast + recalculate
settings.go         — Company info + notification prefs
stripe.go           — Checkout session + webhook
system.go           — Health check + Prometheus metrics
tenant.go           — Tenant helpers
toll_logs.go        — HGS toll CRUD
trailers.go         — Trailer CRUD
trips.go            — Trip CRUD + status
trucks.go           — Truck CRUD
trucks_test.go      — Go unit tests
usermanagement.go   — User CRUD + permissions
```
