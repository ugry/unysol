# Unysol — Static Workflow & Test Methodology

***Purpose:*** Standardized process for building, testing, and documenting every module.
***Audience:*** AI coding agents and human developers.
***Rule:*** All E2E tests MUST be headless browser only (Playwright). Backend unit tests use `go test`. Screenshot + DB proof required for every E2E test.

---

**0. PROJECT CONTEXT — Read This First**

Before starting any module, an AI agent MUST understand the project layout.

**0.1 Two Directories**

| | |
|-|-|
| **Purpose** | **Path** |
| **Documentation repo** (this file lives here) | /home/ugur/unysol/ |
| **Working prototype** (actual source code) | /home/ugur/unysol/ |

Both documentation and source code live under the same root `/home/ugur/unysol/`.

**0.2 Code Directory Map**

```
/home/ugur/unysol/
├── docker-compose.yml                 ← services: postgres, redis, backend, frontend
├── database/
│   └── 01-schema.sql                  ← ALL CREATE TABLE / ALTER TABLE go here (append only)
├── backend/
│   ├── Dockerfile
│   ├── go.mod                         ← module unysol, Go 1.22
│   ├── go.sum
│   └── cmd/server/main.go             ← entry point: chi router setup, handler registration
│   └── internal/
│       ├── config/config.go           ← env vars (PORT, DATABASE_URL, JWT_SECRET, REDIS_URL)
│       ├── database/
│       │   ├── postgres.go            ← pgx pool creation + RunMigrations()
│       │   └── migrations/            ← SQL migration files
│       ├── handlers/
│       │   ├── auth.go                ← /api/auth/{signup, login}
│       │   ├── trucks.go              ← /api/tenant/trucks/*
│       │   ├── trips.go               ← /api/tenant/trips/*
│       │   ├── customers.go           ← /api/tenant/customers/*
│       │   ├── invoices.go            ← /api/tenant/invoices/*
│       │   ├── expenses.go            ← /api/tenant/expenses/*
│       │   ├── employees.go           ← /api/tenant/employees/*
│       │   ├── cek_senet.go           ← /api/tenant/cek-senet/*
│       │   ├── dashboard.go           ← /api/tenant/dashboard/*
│       │   ├── predictions.go         ← /api/tenant/predictions/*
│       │   ├── billing.go             ← /api/tenant/billing/*
│       │   ├── settings.go            ← /api/tenant/settings/*
│       │   ├── notifications.go       ← /api/tenant/notifications/*
│       │   ├── actions.go             ← /api/tenant/actions/*
│       │   ├── admin.go               ← /api/admin/tenants, analytics, users
│       │   ├── modules.go             ← /api/admin/modules/*
│       │   ├── countries.go           ← /api/admin/countries/*
│       │   ├── system.go              ← /api/system/health, metrics
│       │   └── tenant.go              ← Tenant helper functions
│       ├── middleware/
│       │   ├── auth.go                ← JWT validation + RequireTenant + RequireSuperAdmin
│       │   ├── logging.go             ← slog structured logging middleware
│       │   └── actionlog.go           ← File-based audit log writer
│       └── models/
│           └── models.go              ← All Go structs (request/response/DB models)
└── frontend/
    ├── Dockerfile
    ├── package.json                   ← React 18, Vite 5, Tailwind 3
    ├── vite.config.ts
    ├── tsconfig.json
    └── src/
        ├── App.tsx                    ← add new <Route> here
        ├── main.tsx                   ← entry: BrowserRouter > AuthProvider > App
        ├── contexts/
        │   └── AuthContext.tsx        ← Auth state (user, loading, login, logout)
        ├── lib/
        │   ├── api.ts                 ← Tenant axios instance (reads unysol_token from localStorage)
        │   ├── adminApi.ts            ← Admin axios instance (reads unysol_admin_token)
        │   ├── auth.ts                ← login(), signup(), logout()
        │   ├── adminAuth.ts           ← Admin login/logout
        │   ├── export.ts              ← CSV/Excel/PDF export utilities
        │   └── share.ts               ← WhatsApp/Email/clipboard share
        ├── components/
        │   ├── Sidebar.tsx            ← add nav item here
        │   ├── MainLayout.tsx         ← add page title here
        │   ├── DataGrid.tsx           ← MANDATORY for all list pages
        │   └── KpiCard.tsx            ← Reusable KPI card component
        ├── pages/
        │   ├── LandingPage.tsx        ← Public landing, no layout
        │   ├── LoginPage.tsx          ← Login/signup form, no layout
        │   ├── AdminLoginPage.tsx     ← Admin login, no layout
        │   ├── AdminDashboard.tsx     ← Super admin panel
        │   ├── DashboardHome.tsx      ← Tenant dashboard with KPI cards + chart
        │   ├── TrucksPage.tsx
        │   ├── TripsPage.tsx
        │   ├── CustomersPage.tsx
        │   ├── InvoicesPage.tsx
        │   ├── ExpensesPage.tsx
        │   ├── EmployeesPage.tsx
        │   ├── PredictionsPage.tsx
        │   ├── SettingsPage.tsx
        │   ├── CekSenetPage.tsx
        │   └── ActionsPage.tsx
        └── types/
            └── index.ts              ← TypeScript type definitions
```

**0.3 Files You MUST Modify for Every New Module**

When building a new module, these files are ALWAYS touched. If an AI misses one, the module will silently break.

| | | | |
|-|-|-|-|
| **#** | **File** | **Action** | **Example (Unysol)** |
| 1 | database/01-schema.sql | Append CREATE TABLE + INSERT INTO modules/country_modules/plan_modules | CREATE TABLE cek_senet (...) + seed module rows |
| 2 | backend/internal/models/models.go | Add Go structs (DB model + request + response) | CekSenet struct, CekSenetCreate struct |
| 3 | backend/internal/handlers/{name}.go | Create handler file with chi subrouter | handlers/cek_senet.go |
| 4 | backend/cmd/server/main.go | Register handler + mount routes on chi router | r.Mount("/cek-senet", cekSenetHandler.Routes()) |
| 5 | frontend/src/types/index.ts | Add TypeScript interfaces | CekSenet, CekSenetSummary |
| 6 | frontend/src/pages/{Name}Page.tsx | Create page component — MUST use DataGrid | pages/CekSenetPage.tsx |
| 7 | frontend/src/App.tsx | Add <Route> inside <ProtectedRoute> | <Route path="cek-senet" element={<CekSenetPage />} /> |
| 8 | frontend/src/components/Sidebar.tsx | Add nav item with icon | { name: "Çek/Senet", path: "cek-senet", icon: CreditCard } |
| 9 | frontend/src/components/MainLayout.tsx | Add page title mapping | "cek-senet": "Çek/Senet Takibi" |

**0.4 Naming Convention Table**

| | | | |
|-|-|-|-|
| **Document Folder** | **Backend Files (all lowercase)** | **Frontend Files (PascalCase)** | **Route Path** |
| modules/cek_senet/ | cek_senet.go | CekSenetPage.tsx | /dashboard/cek-senet |
| modules/toplu_sevkiyat/ | batch_shipping.go | BatchShippingPage.tsx | /dashboard/batch-shipping |
| modules/whatsapp_bildirim/ | whatsapp_notify.go | WhatsappNotifyPage.tsx | /dashboard/whatsapp-notify |
| modules/demo_hesap/ | demo_account.go | DemoAccountPage.tsx | /dashboard/demo-account |

Rule: folder = Turkish with underscores, filenames = English with underscores, components = PascalCase English.

**0.5 Code Patterns — Do Exactly This**

***Backend Handler Pattern (Go/chi)***

```go
// internal/handlers/{name}.go
package handlers

import (
    "net/http"
    "github.com/go-chi/chi/v5"
    "unysol/internal/middleware"
)

type NameHandler struct {
    DB *pgxpool.Pool
}

func (h *NameHandler) Routes() chi.Router {
    r := chi.NewRouter()
    r.Get("/", h.List)
    r.Post("/", h.Create)
    r.Put("/{id}", h.Update)
    r.Delete("/{id}", h.Delete)
    return r
}

func (h *NameHandler) List(w http.ResponseWriter, r *http.Request) {
    // Get tenant_id from context
    tenantID := middleware.GetTenantID(r.Context())

    // Query scoped to tenant_id
    rows, err := h.DB.Query(r.Context(),
        "SELECT id, tenant_id, ... FROM table WHERE tenant_id = $1", tenantID)

    // Return JSON response
    writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: items})
}

func (h *NameHandler) Create(w http.ResponseWriter, r *http.Request) {
    // Decode request body
    var req models.CreateNameRequest
    json.NewDecoder(r.Body).Decode(&req)

    // Set tenant_id from context
    tenantID := middleware.GetTenantID(r.Context())
    req.TenantID = tenantID

    // INSERT INTO table ...
    // Return 201
    writeJSON(w, http.StatusCreated, models.APIResponse{Success: true, Data: item})
}
```

***Frontend Page Pattern (DataGrid — MANDATORY for all list pages)***

```tsx
// pages/{Name}Page.tsx
import api from "@/lib/api";       // tenant axios instance
import type { Item } from "@/types";
import DataGrid, { type Column } from "@/components/DataGrid";

export default function NamePage() {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/tenant/{name}/")
      .then(r => setData(r.data.data))
      .catch(() => setData(MOCK_DATA));   // fallback to mock
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<Item>[] = [
    { key: "field1", header: "Alan 1", sortable: true,
      render: (row) => <span className="text-sm">{row.field1}</span>,
      exportRender: (row) => String(row.field1) },
    { key: "field2", header: "Alan 2", align: "right",
      render: (row) => <Badge status={row.status} />,
      exportRender: (row) => row.status },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <DataGrid
        columns={columns}
        data={filteredData}
        loading={loading}
        title="Page Title"
        onEdit={(row) => handleEdit(row)}
        onDelete={(row) => handleDelete(row.id)}
        onBulkDelete={(ids) => handleBulkDelete(ids)}
        emptyText={search ? "Aramanızla eşleşen kayıt bulunamadı" : "Henüz kayıt bulunmuyor"}
      />
    </div>
  );
}

const MOCK_DATA: Item[] = [{ id: 1, ... }, ...]; // 5 hardcoded rows
```

***Auth Guards (in App.tsx)***

```tsx
// Tenant pages: must be wrapped in MainLayout + ProtectedRoute
<Route element={<ProtectedRoute />}>
  <Route element={<MainLayout />}>
    <Route path="name" element={<NamePage />} />
  </Route>
</Route>

// Admin pages: use isAdminAuthenticated() check
<Route element={<SuperAdminRoute />}>
  <Route path="admin/*" element={<AdminDashboard />} />
</Route>
```

***DB Column Naming***
- Primary key: `id` (SERIAL)
- Tenant FK: `tenant_id` (NOT NULL, FK → tenants.id)
- Turkish names: `plaka`, `firma_unvani`, `vade_tarihi`, `borclu`, `tutar`
- Timestamps: `created_at`, `updated_at` (TIMESTAMPTZ)
- Status enums: created per module, always snake_case

**0.6 User Roles (for authorization decisions)**

```go
// From database schema:
// CREATE TYPE user_rol_enum AS ENUM ('SUPER_ADMIN', 'TENANT_OWNER', 'DRIVER', 'OFFICE', 'ACCOUNTANT');

// Middleware checks:
middleware.Auth(cfg.JWTSecret)        // Any valid JWT
middleware.RequireTenant              // Must have tenant_id in context
middleware.RequireSuperAdmin          // Must have rol == "SUPER_ADMIN"
```

Most tenant modules use `Auth` + `RequireTenant` → allows TENANT_OWNER, OFFICE, ACCOUNTANT, DRIVER.

Admin-only features use `RequireSuperAdmin`.

**0.7 Plan Tiers (for feature gating)**

```go
// From database schema:
// CREATE TYPE plan_enum AS ENUM ('FREE', 'PRO', 'PREMIUM');

// Startup phase: all features open in all tiers.
// Plan middleware enforces only truck/user counts later.
```

**0.8 Test Credentials & URLs**

Run tests from the unysol directory with Docker running.

```
Base URL (frontend):  http://localhost:5174
Admin panel:          http://localhost:5174/admin
API URL (backend):    http://localhost:8080
```

***Test Users (to be created)***

| | | | | |
|-|-|-|-|-|
| **Role** | **Email** | **Password** | **Tenant** | **Use for** |
| TENANT_OWNER | test@unysol.com | test123 | Test Lojistik (id=1) | All tenant-page Playwright tests |
| SUPER_ADMIN | admin@unysol.app | admin123 | — (null) | Admin panel tests |
| DRIVER | driver1@unysol.com | test123 | Test Lojistik (id=1) | Driver-specific tests |

***DB Verification***

```
DB container:  docker exec unysol-db psql -U unysol -d unysol -c "..."
Tables:        SELECT * FROM {table} WHERE tenant_id=1 ORDER BY id DESC LIMIT 5;
Screenshots:   /tmp/unysol_{module_name}_shots/
```

***Go Test Commands***

```
# Run all unit tests
go test ./... -v

# Run with coverage
go test ./... -v -coverprofile=coverage.out
go tool cover -html=coverage.out

# Run specific package
go test ./internal/handlers/... -v
go test ./internal/middleware/... -v
go test ./internal/models/... -v
```

***Playwright Test Script Template (Python, headless Chromium)***

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Login (tenant)
    page.goto("http://localhost:5174/login")
    page.fill("input[type=email]", "test@unysol.com")
    page.fill("input[type=password]", "test123")
    page.click("button[type=submit]")
    page.wait_for_url("**/dashboard")

    # Navigate to module
    page.goto("http://localhost:5174/dashboard/{route}")
    page.wait_for_timeout(2000)

    # Check content
    text = page.locator("body").inner_text()
    assert len(text) > 100, f"Page empty: {len(text)} chars"

    # Screenshot
    page.screenshot(path="/tmp/unysol_{module}_shots/01_page.png", full_page=True)
    browser.close()
```

---

**Phase 1: COLLECT DATA → {module}_collected_data.md**

**Goal:** Gather EVERYTHING before writing a single line of code.
**Rule:** Never skip this phase. An AI must research before it builds.

**Must Answer:**
1. WHAT IS IT?
   - Define the function in 1-3 sentences
   - Why does a Turkish trucking company need this?
   - Which user role primarily uses it? (owner, driver, accountant, admin)

2. VARIABLES / DATA POINTS
   - List every data field needed (aim: this should become SQL columns + TS types)
   - Type of each field (string, integer, decimal(12,2), date, boolean, enum)
   - Which are required vs optional
   - Enum values if applicable (list every allowed value)
   - Which field links to which existing table? (customer_id → customers.id)

3. BUSINESS RULES
   - What are the valid states/statuses? (list every one)
   - What triggers state transitions? (draw a flow: A→B on action X)
   - What calculations are needed? (formulas: total = SUM(field WHERE condition))
   - What validations are required? (e.g., "vade_tarihi cannot be in the past")

4. COMPETITOR IMPLEMENTATIONS
   - How does Filojistik (filojistik.org) do it?
   - How does FiloMetrik (filometrik.com) do it?
   - How does Kamyoon (kamyoon.com) do it?
   - Take Playwright screenshots of competitor UIs → save to /tmp/
   - Any global SaaS that does this (for UX reference)?

5. TURKISH REGULATORY REQUIREMENTS
   - Is there a legal/regulatory aspect? (TTK, VUK, KVKK, Çek Kanunu)
   - Any government-mandated format? (e-Fatura UBL, U-ETDS XML)
   - Tax implications? (KDV rate, stopaj, tevkifat)
   - Data retention requirement? (VUK: 5 years, KVKK: varies)

6. DIFFERENT APPROACHES
   - Approach A: Minimal (just record tracking, fits trucking use case, ~4 hours)
   - Approach B: Standard (track + automate workflows, ~16 hours)
   - Approach C: Advanced (track + automate + external API integration, ~40 hours)
   - State WHICH approach is chosen and WHY

7. SOURCES
   - URLs of reference material (competitor pages, legal texts)
   - Competitor screenshot file paths
   - Legal references (law number, article)

---

**Phase 2: BLUEPRINT → {module}_todo.md**

**Goal:** Exact specification of what to build before writing code.
**Rule:** Never build without this. The AI must know exactly what success looks like.

**Must Contain:**

1. DATABASE SCHEMA
   - Full CREATE TABLE statement (copy-paste ready for 01-schema.sql)
   - Every column with type, constraints, defaults
   - All foreign keys (reference existing table + column)
   - All indexes (CREATE INDEX statements)
   - Any ALTER TABLE on existing tables (e.g., adding a column)
   - Whether the table needs RLS policy (YES if it has tenant_id)

2. API ENDPOINTS
   - Full path: /api/tenant/{name}/... or /api/admin/{name}/...
   - Method: GET | POST | PUT | DELETE
   - Request body schema (Go struct, JSON example)
   - Response schema (Go struct, JSON example)
   - Auth dependency: RequireTenant | RequireSuperAdmin
   - Plan tier: ALL | PRO_AND_ABOVE | PREMIUM_ONLY

3. FRONTEND COMPONENTS
   - Route path: /dashboard/{name}
   - Column definitions: FULL Column<T> array for DataGrid — every field with key, header, sortable, render, and exportRender
   - UI layout: ASCII wireframe showing KPI cards, filters, DataGrid, modals
   - Data flow: useState → useEffect → api.get() → setState (mock fallback)
   - Mock data: 5 hardcoded rows matching the response schema
   - Sidebar icon: which lucide-react icon to use
   - Page title: Turkish display name in MainLayout

4. TEST PLAN
   - Numbered list: TEST # | ACTION | EXPECTED | PROOF TYPE | CATEGORY
   - Minimum 10 tests covering all 6 categories from Phase 4
   - Minimum pass threshold: 8/10 for MVP, 10/10 for production
   - Specify which DB query proves each data integrity test

---

**Phase 3: IMPLEMENT → {module}_main.md**

**Goal:** Record exactly what was built, with proof.
**Rule:** This is an AFTER-ACTION report, not a plan. Write it after the code compiles.

**Must Contain:**

1. DATABASE
   - The exact DDL executed (copy-pasted from 01-schema.sql)
   - Proof: `docker exec unysol-db psql -U unysol -d unysol -c "\d {table_name}"`

2. BACKEND
   - File inventory table: File | Type (NEW/MODIFIED) | Lines
   - Router registration: the exact Mount line added to main.go
   - Key code snippet: the handler Routes() function + one endpoint as example (NOT the full file)
   - Key code snippet: the Go struct definitions (columns only)

3. FRONTEND
   - File inventory table: File | Type (NEW/MODIFIED) | Lines
   - Route registration: the exact <Route> line added to App.tsx
   - Sidebar entry: the exact menu item object added to Sidebar.tsx
   - Screenshot of the rendered page (full page, headless Playwright)

4. DEVIATIONS FROM TODO
   - Table: Item | Planned | Actual | Reason
   - Every difference between the todo and what was built
   - If a test was skipped, explain why

**Critical Implementation Order (do NOT skip steps)**

1. database/01-schema.sql          → CREATE TABLE first
2. backend/internal/models/models.go → Add Go structs
3. backend/internal/handlers/{name}.go → Create handler (test with curl)
4. backend/cmd/server/main.go      → Register handler + mount routes
5. frontend/src/types/index.ts     → TypeScript interfaces
6. frontend/src/pages/{Name}Page.tsx → Page component
7. frontend/src/App.tsx            → Add Route
8. frontend/src/components/Sidebar.tsx → Add nav item
9. frontend/src/components/MainLayout.tsx → Add title

---

**Phase 4: TEST → {module}_testresults.md**

**Goal:** Prove the module works. Headless Playwright for E2E, `go test` for backend.
**Rule:** Every test MUST have proof. No proof = test didn't happen.

**Test Format:**

```
TEST # | ACTION                              | EXPECTED               | ACTUAL                 | PROOF           | STATUS
-------|-------------------------------------|------------------------|------------------------|-----------------|-------
 1     | Navigate to /dashboard/{name}        | Page content > 100 chars| 394 chars              | /tmp/.../01.png  | ✅
 2     | POST /api/tenant/{name}/             | HTTP 201                | HTTP 201               | API response log| ✅
 3     | SELECT * FROM {table} WHERE id=1     | 1 row with correct data | id=1, tutar=10000.00   | DB query output | ✅
```

**Required Proof Per Test:**
- ✅ Every PASSING test needs ONE of:
  - Screenshot (.png in /tmp/unysol_{module}_shots/)
  - Database query output (`docker exec unysol-db psql -U unysol -d unysol -c "..."`)
  - API response log (curl output)
  - Go test output (`go test ./... -v -run TestName`)
- ❌ Every FAILING test needs ALL of:
  - Screenshot showing the error state
  - Error message or browser console log
  - Root cause analysis (WHY it failed, not just THAT it failed)

**Test Categories (every module must test all 6):**

1. **DATA INTEGRITY** — Did the data save correctly to PostgreSQL?
   Example: CREATE via API → SELECT from DB → fields match

2. **UI RENDER** — Does the page/component render with content?
   Example: Navigate to page → body.inner_text() > 100 chars

3. **UI INTERACTION** — Do buttons, forms, modals, filters work?
   Example: Click "Add" → modal opens → fill form → submit → table updates

4. **API** — Does every endpoint return correct HTTP status + JSON shape?
   Example: GET /api/tenant/{name}/ → 200, JSON has expected fields

5. **BUSINESS LOGIC** — Do calculations produce correct results?
   Example: Create records → GET /summary → SUM matches expected total

6. **EDGE CASES** — Empty state, validation errors, max values
   Example: Submit empty form → validation error. Delete last record → "no data" state.

7. **LIST PAGE REQUIREMENTS** — If there is a list there must be edit, share, delete, select all, select few, export to CSV/XLS/PDF options — ALL implemented via DataGrid component. Every list page MUST use DataGrid.

**Data Integrity Proof Section**

```
Always include this block at the bottom of test results:

DB BEFORE:
   SELECT COUNT(*) FROM {table} → 0 rows

API CREATE:
   POST /api/tenant/{name}/ {field1: ..., field2: ...}
   → HTTP 201

DB AFTER:
   SELECT * FROM {table} WHERE id = <returned_id> → 1 row
   field1 = ..., field2 = ..., status = <default> ✅
```

---

**Definition of Done — Module Completion Checklist**

Before marking a module complete, verify ALL items:

```
DOCUMENTATION:
   ☐ Phase 1: {module}_collected_data.md written (all 7 sections)
   ☐ Phase 2: {module}_todo.md written (DB + API + Frontend + Test plan)
   ☐ Phase 3: {module}_main.md written (after implementation, with deviations)
   ☐ Phase 4: {module}_testresults.md written (all tests with proof)

CODE:
   ☐ database/01-schema.sql updated (CREATE TABLE appended)
   ☐ modules table seeded (INSERT INTO modules ...)
   ☐ country_modules seeded for TR (INSERT INTO country_modules ...)
   ☐ plan_modules seeded for FREE/PRO/PREMIUM (INSERT INTO plan_modules ...)
   ☐ backend/internal/models/models.go updated (structs added)
   ☐ backend/internal/handlers/{name}.go created and returning HTTP 200
   ☐ backend/cmd/server/main.go updated (handler instantiated + routes mounted)
   ☐ Audit logging: delete handlers POST to /api/tenant/actions/ with record_data snapshot
   ☐ frontend/src/types/index.ts updated (TypeScript types added)
   ☐ frontend/src/pages/{Name}Page.tsx created and rendering
   ☐ frontend/src/pages/{Name}Page.tsx uses DataGrid with Column<T>[] — NO custom <table>
   ☐ DataGrid columns have exportRender for EVERY column with a render function
   ☐ frontend/src/App.tsx updated (route added)
   ☐ frontend/src/components/Sidebar.tsx updated (nav item added)
   ☐ frontend/src/components/MainLayout.tsx updated (page title added)

TESTING:
   ☐ Minimum 10 tests run
   ☐ 8/10 passed (minimum)
   ☐ Every pass has proof (screenshot, DB query, API log, or go test output)
   ☐ Every fail has root cause analysis
   ☐ Data integrity section filled (DB before/after)
   ☐ Go tests: `go test ./internal/handlers/... -v` passes

GLOBAL DOCS:
   ☐ STATUS.md updated (milestone added, percentages updated)
   ☐ BUILT.md updated (new table/endpoint/page listed)
   ☐ BLUEPRINT.md updated (if module adds blueprint-level feature)
   ☐ ADDONFUNCTIONS.md updated (if module was from addon list, mark as DONE)
   ☐ Git commit: "Add {Module Name} module — Phases 1-4 complete"
```

---

**Rules (Non-Negotiable)**

1. NEVER skip Phase 1 (data collection) — research before building
2. NEVER build without Phase 2 (blueprint) — spec before code
3. ALWAYS test with headless browser (Playwright) for E2E — no manual clicking
4. ALWAYS test Go handlers with `go test` — no manual curl-only testing
5. ALWAYS provide proof (screenshot, log, DB query, go test output) — no "trust me"
6. EVERY test must have expected vs actual comparison
7. FAILED tests must have root cause analysis
8. ALL documentation goes under /home/ugur/unysol/modules/{module_name}/
9. ALL source code goes under /home/ugur/unysol/backend/ or /home/ugur/unysol/frontend/
10. Turkish naming for doc folders (çek_senet, toplu_sevkiyat)
11. English naming for code files (cek_senet.go, CekSenetPage.tsx)
12. Append to existing files, never overwrite (01-schema.sql, main.go, App.tsx, Sidebar.tsx)
13. Follow existing Go code patterns EXACTLY — look at cek_senet handler as reference
14. EVERY module MUST insert a row into the modules table (database/01-schema.sql seed section)
15. EVERY module MUST register its feature flag via modules handler so Super Admin can toggle it per country/plan/tenant
16. EVERY module MUST follow the override chain: tenant_modules → plan_modules → country_modules → modules.default_enabled → is_core
17. EVERY list page MUST use the DataGrid component — NO custom HTML tables allowed. DataGrid provides: bulk select (checkbox per row + select all), per-page item count selector (50/100/200), export to CSV/Excel/PDF, edit button per row, share per row (email/WhatsApp/clipboard), bulk share, bulk delete, pagination, sortable columns. See frontend/src/components/DataGrid.tsx for the canonical implementation.
18. EVERY DataGrid MUST define columns using the Column<T> type: { key, header, sortable?, render?, exportRender?, align?, width? }. Every render function that produces formatted output (badges, currency, dates) MUST also provide an exportRender function for clean CSV/Excel/PDF text.
19. NO module page shall render its own <table>, <thead>, <tbody>. All list UI must go through DataGrid.
20. EVERY delete action (single or bulk) MUST show a confirmation dialog before executing. DataGrid handles this automatically.
21. EVERY data mutation (CREATE, UPDATE, DELETE, BULK_DELETE) MUST log an audit record to the `actions` table.
