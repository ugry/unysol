# Unysol Blueprint — Master Plan v1

> **Status:** SOLID. This is the immutable reference document.
> **Last Updated:** 25 May 2026
> **Start:** Turkey | **Target:** 100,000 companies | **Model:** SaaS + On-Premise

---

## 1. ARCHITECTURE

```
                    CDN / WAF (Cloudflare)
                           │
                    LOAD BALANCER (Traefik/HAProxy)
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              WEB APP×N   GO/chi×N   (future: MQTT)
              (React PWA) (Stateless) (ESP32/Phone ingress)
                    │          │          │
                    └──────────┼──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       PostgreSQL+RLS    Redis Cluster    (future: Kafka)
       (startup: pg16)   (cache/session)  (telemetry buffer)
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       S3/MinIO (files)  Prometheus+Grafana  DR (multi-region)
```

### Design Principles
- **STATELESS** — Every Go/chi API instance handles any request
- **MODULAR** — 49 pluggable modules, toggle per country/plan/tenant
- **MULTI-LANGUAGE** — i18n at every layer, TR > EN > AR > RU
- **OBSERVABLE** — Prometheus metrics, slog JSON logs, Grafana dashboards
- **RECOVERABLE** — WAL-G backups, multi-region active-passive, RPO<5min

---

## 2. DATABASE — 29 Tables (from 01-schema.sql)

| # | Table | Layer | Purpose |
|---|-------|-------|---------|
| 1 | tenants | SaaS | Registered companies (slug, plan, locale, country_code) |
| 2 | users | SaaS | All users (roles: SUPER_ADMIN/TENANT_OWNER/DRIVER/OFFICE/ACCOUNTANT) |
| 3 | subscriptions | SaaS | Subscription history per tenant |
| 4 | trucks | Fleet | Vehicles (plaka, tracking_source, fuel type, km counters) |
| 5 | trailers | Fleet | Trailers (separate plates, inspection) |
| 6 | trips | Operations | Trip management (durum, route, fuel, payment, irsaliye) |
| 7 | customers | CRM | Customer directory (vergi, depo_adresleri, risk score, price catalog) |
| 8 | invoices | Finance | Customer invoices (e-Fatura fields, KDV, tevkifat, payment tracking) |
| 9 | invoice_items | Finance | Invoice line items |
| 10 | invoice_payments | Finance | Invoice payment records |
| 11 | e_fatura_logs | Finance | e-Fatura transaction log |
| 12 | invoice_recurrences | Finance | Recurring invoice templates |
| 13 | expenses | Finance | Expense tracking (21 categories) |
| 14 | employees | HR | Employee records (license, SRC, phone) |
| 15 | cek_senet | Finance | Çek/Senet tracking (type, bank, status, customer) |
| 16 | modules | Platform | Module registry (22 seed modules) |
| 17 | country_modules | Platform | Modules per country |
| 18 | plan_modules | Platform | Modules per plan |
| 19 | tenant_modules | Platform | Tenant module overrides |
| 20 | countries | Platform | Country definitions |
| 21 | country_configs | Platform | Regulatory config per country (tax, invoice, driver) |
| 22 | actions | Core | All CRUD audit log (KVKK required) |
| 23 | settings | Core | Tenant settings (JSONB key/value) |
| 24 | notifications | Core | Tenant notifications |
| 25 | predictions | Analytics | Monthly forecast (revenue, expenses, profit) |
| 26 | password_resets | Auth | Password reset tokens |
| 27 | maintenance_records | Fleet | Maintenance history (type, next due) |
| 28 | fuel_logs | Fleet | Fuel receipts (manual entry) |
| 29 | toll_logs | Fleet | HGS toll records |
| - | driver_leave | HR | Driver leave calendar (in schema, no seed) |
| - | insurance_policies | Fleet | Insurance policies (in schema, no seed) |
| - | billing | Finance | SaaS billing invoices (in schema, no seed) |
| - | load_board | Fleet | Load board (YUK_VAR/YUK_ARA) (in schema, no seed) |

**RLS:** Enabled on all tenant-scoped tables (26 tables). Policy function `tenant_rls_policy()` applies
`tenant_id = current_setting('app.current_tenant_id')` automatically.

**Seed data:** TR country + 22 modules + country_modules + plan_modules (FREE/PRO/PREMIUM).

---

## 3. API — ~70 Endpoints

```
/api/auth/
  POST   /signup              POST   /login

/api/system/
  GET    /health              GET    /health/ready
  GET    /health/live         GET    /metrics

/api/tenant/  (JWT required, tenant-scoped via middleware)
  GET    /dashboard/summary           KPI cards + revenue chart + activities
  GET    /trucks                      List | POST create | PUT update | DELETE
  GET    /trailers                    List | POST
  GET    /trips                       List (filter: durum, truck, date)
  POST   /trips                       Create trip
  PUT    /trips/{id}                  Update trip status
  GET    /customers                   List | POST create | PUT update
  GET    /customers/{id}              Detail
  GET    /invoices                    List | POST create
  GET    /invoices/{id}               Detail
  PUT    /invoices/{id}/pay           Record payment
  POST   /invoices/{id}/pdf           Generate PDF
  POST   /invoices/{id}/e-fatura     Send e-Fatura
  GET    /invoices/aging              Aging report (vade analizi)
  GET    /invoices/recurrences        Recurring invoices | POST
  GET    /expenses                    List | POST create
  PUT    /expenses/{id}               Update
  GET    /expenses/categories         Category summary
  GET    /employees                   List | POST create
  GET    /employees/{id}              Detail + metrics
  GET    /employees/{id}/leave        Leave records | POST
  GET    /cek-senet                   List | POST create
  PUT    /cek-senet/{id}/status       Update status
  GET    /cek-senet/summary           Portfolio summary
  GET    /predictions/12-months       12-month forecast
  POST   /predictions/recalculate     Recompute predictions
  GET    /billing/plans               Available plans
  POST   /billing/subscribe           Create subscription
  GET    /settings                    Get | PUT update
  GET    /notifications               List | PUT mark read
  GET    /actions                     Audit log list
  GET    /maintenance                 Maintenance records | POST
  GET    /fuel-logs                   Fuel logs | POST
  GET    /toll-logs                   Toll records | POST
  GET    /insurance                   Insurance policies | POST

/api/admin/  (SUPER_ADMIN JWT only)
  GET    /tenants                     List all tenants
  GET    /tenants/{id}                Tenant detail
  PUT    /tenants/{id}/plan           Change plan
  POST   /tenants/{id}/suspend        Suspend tenant
  GET    /analytics/mrr               MRR data
  GET    /analytics/churn             Churn rate
  GET    /analytics/growth            Growth data
  GET    /users                       List users | POST create
  GET    /modules                     List all modules | POST | PUT/{id}
  PUT    /modules/country/{code}      Toggle per country
  PUT    /modules/plan/{plan}         Toggle per plan
  PUT    /modules/tenant/{id}         Toggle per tenant
  GET    /countries                   List | POST create | PUT update
  GET    /countries/{code}/configs    Get | PUT configs
```

---

## 4. MODULES — 49 Pluggable Features

| Category | Count | Modules |
|----------|:-----:|---------|
| **CORE** | 5 | auth, tenant_mgmt, dashboard, settings, actions |
| **FLEET** | 9 | truck_tracking, trailer_mgmt, maintenance, fuel_logging, toll_tracking, tire_tracking, load_board, route_optimization, geofencing |
| **FINANCE** | 9 | invoice_mgmt, e_invoice, expense_tracking, billing, cek_senet, payroll, currency_exchange, bank_integration, payment_tracking |
| **CRM** | 5 | customer_mgmt, trip_mgmt, proposal_system, customer_portal, contract_mgmt |
| **HR** | 5 | employee_mgmt, driver_leave, driver_allowance, driver_performance, payslip |
| **ANALYTICS** | 5 | predictions, reports, export, carbon_tracking, sustainability_dashboard |
| **COMPLIANCE** | 4 | tr_efatura, tr_vergi, kvkk, eu_gdpr |
| **INTEGRATION** | 4 | dkv_integration, whatsapp_integration, sms_integration, gps_multi_provider |
| **PLATFORM** | 3 | modules_mgmt, countries, on_premise_deploy |

**Override chain:** tenant_modules → plan_modules → country_modules → modules.default_enabled → is_core (always on)

---

## 5. PRICING TIERS

| | FREE | PRO | PREMIUM |
|---|:---:|:---:|:---:|
| **Price** | 0 TL/ay | 200 TL/ay | 500 TL/ay |
| **Trucks** | 1 | 5 | Unlimited |
| **Data retention** | 3 months | 1 year | Unlimited |
| **GPS tracking** | ✅ | ✅ | ✅ |
| **Dashboard + KPIs** | Basic | Full | Full + Custom |
| **Trip management** | Manual | Auto | Auto + Optimization |
| **Invoice (manual)** | ✅ | ✅ | ✅ |
| **e-Invoice** | — | ✅ | ✅ |
| **CRM** | — | ✅ | ✅ |
| **Employee mgmt** | — | ✅ | ✅ |
| **Expense tracking** | — | ✅ | ✅ |
| **Predictions** | — | ✅ | ✅ |
| **Maintenance calendar** | — | ✅ | ✅ |
| **Çek/Senet** | — | ✅ | ✅ |
| **HGS integration** | — | ✅ | ✅ |
| **API access** | — | — | ✅ |
| **White label** | — | — | ✅ |
| **Priority support** | — | — | ✅ |
| **Data export** | — | Basic | Full |

**Startup phase:** ALL features open in all tiers. Limits enforced later.

---

## 6. DEPLOYMENT MODELS

| | SaaS (Cloud) | On-Premise (Self-Host) |
|---|---|---|
| **Pricing** | Monthly subscription | Annual license |
| **Hosting** | We manage | Customer's server |
| **Updates** | Auto (Docker pull) | Manual |
| **Backup** | Auto (WAL-G) | Customer responsibility |
| **Data migration** | SaaS ↔ Local, one click | |

### License Pricing (On-Premise)
- Self-Host Free: 0 TL/yıl (1 truck)
- Self-Host Pro: 4,800 TL/yıl (5 trucks)
- Self-Host Prem: 12,000 TL/yıl (unlimited)

---

## 7. MONITORING & DR

### Monitoring Stack
- **Prometheus** — metric collection (business + system + custom)
- **Grafana** — 4 dashboards (business overview, API perf, DB health, security)
- **Loki** — slog JSON log aggregation
- **AlertManager** — email, Slack, SMS alerts

### Disaster Recovery
- **RPO:** < 5 minutes (WAL continuous archiving)
- **RTO:** < 30 minutes (automated failover)
- **Backup:** WAL-G → S3, daily full dump, hourly Redis RDB
- **Architecture:** Istanbul (primary) ↔ Ankara (standby), async replication
- **Drill:** Quarterly planned failover tests

---

## 8. SCALE PROJECTIONS

| Metric | 100 Companies | 1,000 | 10,000 | 100,000 |
|--------|:---:|:---:|:---:|:---:|
| Trucks | 400 | 4,000 | 40,000 | 400,000 |
| Revenue/month | 11K TL | 195K TL | 2M TL | 20M TL |
| Server cost | 400 TL | 4K TL | 40K TL | 400K TL |
| Team size | 1 | 3-5 | 15-20 | 80-120 |
| DB architecture | Single PG | PG + replica | Sharded PG | Multi-region |
| Storage/month | 5 GB | 50 GB | 500 GB | 5 TB |
