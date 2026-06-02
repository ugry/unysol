# Unysol — UI Design & Wording Inconsistencies

> **Audit Date:** 02 June 2026  
> **Scope:** 14 frontend page files + DataGrid component  
> **Total Issues Found:** 20  

---

## A. COLOR INCONSISTENCIES (HIGH)

### B-DSGN-01: Add Button Color Split — 2 Different Brand Colors

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Status** | ⬜ OPEN |
| **Found** | Code audit of all 14 page files |
| **Bug** | Add/create buttons use two different brand colors with no consistent rule: 8 pages use orange `bg-[#FF5F03]` (Trucks, Customers, Invoices, Expenses, Employees, CekSenet, LoadBoard, Settings) while 6 pages use dark teal `bg-[#072C2C]` (Trips, Trailers, FuelLog, TollLogs, Maintenance, DriverLeave). |
| **Impact** | Users perceive two different brand identities for the same action (adding a record). Creates cognitive dissonance when navigating between pages. |
| **Required Fix** | Standardize all Add/Ekle buttons to `bg-[#FF5F03]` (the brand orange). |
| **Files** | `TripsPage.tsx`, `TrailersPage.tsx`, `FuelLogPage.tsx`, `TollLogsPage.tsx`, `MaintenancePage.tsx`, `DriverLeavePage.tsx` |

### B-DSGN-02: "Aktif" Status — 3 Different Colors for Same Concept

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Status** | ⬜ OPEN |
| **Found** | Cross-page color audit |
| **Bug** | Same status "Aktif" (Active) renders in 3 different colors: orange `#FF5F03` on TripsPage, green `#16A34A` on CustomersPage + LoadBoardPage, emerald `bg-emerald-400` on TrucksPage. No semantic reason for the difference. |
| **Impact** | Users cannot build a mental model of what each color means. "Is active green or orange?" |
| **Required Fix** | Standardize: "Aktif/Active" = green (`#16A34A`). "In Progress" = orange/yellow. "Error/Inactive" = red. |
| **Files** | `TripsPage.tsx`, `TrucksPage.tsx`, `CustomersPage.tsx`, `LoadBoardPage.tsx` |

### B-DSGN-03: Hex Background + Mismatched Tailwind Text Colors

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Status** | ⬜ OPEN |
| **Found** | Color audit — 5 pages have this pattern |
| **Bug** | Badges use hex background (e.g., `bg-[#3b82f6]/15`) but Tailwind named text (e.g., `text-blue-600` = `#2563eb`). These are different hex values. Affects ExpensesPage (bakim, lastik), CekSenetPage (BEKLIYOR, IADE), LoadBoardPage (YUK_VAR). |
| **Impact** | Background and text are visibly different shades of the same color — looks sloppy. |
| **Required Fix** | Either use all-Tailwind `bg-blue-500/15 text-blue-500` or all-hex `bg-[#3b82f6]/15 text-[#3b82f6]`. |
| **Files** | `ExpensesPage.tsx`, `CekSenetPage.tsx`, `LoadBoardPage.tsx` |

### B-DSGN-04: Badge Opacity — 4 Different Systems

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Status** | ⬜ OPEN |
| **Found** | Opacity audit across all pages |
| **Bug** | Badge background opacity uses 4 different patterns: `/15` (15%), `/10` (10%), Tailwind `-100` solid colors, Tailwind `-500/15`. No standard. |
| **Impact** | Inconsistent visual weight of badges across pages. |
| **Required Fix** | Standardize on `/15` or `/10` for all hex-based badges. |
| **Files** | All 14 page files |

---

## B. WORDING INCONSISTENCIES (HIGH)

### B-DSGN-05: Add Button Text — "Yeni X" vs "X Ekle" Split

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Status** | ⬜ OPEN |
| **Found** | Text audit — 6 pages use "Yeni X", 9 use "X Ekle" |
| **Bug** | No consistent naming rule. "Müşteriler" uses "Yeni Müşteri" but "Personel" uses "Personel Ekle" for the same action. |
| **Impact** | Inconsistent button scanning for users who rely on button text patterns. |
| **Required Fix** | Standardize to "Yeni X" for all CRUD pages OR "X Ekle" — pick one. |
| **Files** | 15 pages (all CRUD pages) |

### B-DSGN-06: Delete Confirmation — 3 Different UX Approaches

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Status** | ⬜ OPEN |
| **Found** | UX audit — 3 completely different deletion mechanisms |
| **Bug** | Most pages use DataGrid's styled modal ("Silme Onayı"), LoadBoard uses a custom inline modal, and SettingsPage + InvoicesPage use browser-native `window.confirm()`. The native alert dialog looks completely different and lacks context. |
| **Impact** | `window.confirm()` looks unprofessional and jarring compared to the custom modal. InvoicesPage's "Silinsin mi?" provides zero context about what's being deleted. |
| **Required Fix** | Replace all `window.confirm()` calls with DataGrid's styled confirmation modal. Add entity context to all delete messages. |
| **Files** | `SettingsPage.tsx` (line 118), `InvoicesPage.tsx` (line 810) |

### B-DSGN-07: Empty State Messages — 5 Grammatical Patterns

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Status** | ⬜ OPEN |
| **Bug** | Empty state messages use 5 different patterns: "Henüz X yok" (LoadBoard, Trips), "Henüz X kaydı yok" (10 pages), "Henüz kayıtlı X bulunmuyor" (Trucks, Admin), "Henüz işlem kaydı bulunmuyor" (Actions), "Henüz X tanımlanmadı" (Invoices recurrences). |
| **Impact** | Inconsistent tone and verbosity. "Henüz X kaydı yok" is the most common — others should align. |
| **Required Fix** | Standardize to "Henüz X kaydı yok" for all entity pages. |
| **Files** | `LoadBoardPage.tsx`, `TripsPage.tsx`, `TrucksPage.tsx`, `InvoicesPage.tsx`, `ActionsPage.tsx` |

### B-DSGN-08: No Success Notification System

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Status** | ⬜ OPEN |
| **Bug** | The word "Başarıyla" (successfully) appears only on VerifyEmailPage. No other page has a success toast/notification. InvoicesPage uses `alert()` for success messages. Other pages have no success feedback at all after CRUD operations. |
| **Impact** | Users don't know if their action succeeded unless they manually check. Creates uncertainty. |
| **Required Fix** | Implement a global Toast/notification component. Show success message after Create/Update/Delete. Show error message on failure. |
| **Files** | New component + integration into all CRUD pages |

---

## C. TYPOGRAPHY & LAYOUT

### B-DSGN-09: Modal Heading Tag — h2 vs h3 Inconsistency

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Status** | ⬜ OPEN |
| **Bug** | Modal titles use `<h3>` on 12 pages but `<h2>` on InvoicesPage. |
| **Required Fix** | Standardize to `<h3>`. |
| **Files** | `InvoicesPage.tsx` |

### B-DSGN-10: Focus Ring Color — 3 Different Approaches

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Status** | ⬜ OPEN |
| **Bug** | Input focus rings use `focus:border-[#FF5F03]` on most pages, `focus:border-[#072C2C]` on TrucksPage/TripsPage/CustomersPage forms, and NO focus class at all on TrailersPage, FuelLogPage, TollLogsPage, MaintenancePage, DriverLeavePage. |
| **Required Fix** | Standardize to `focus:border-[#FF5F03]` (brand orange). |
| **Files** | 9 pages with non-standard or missing focus rings |

### B-DSGN-11: "Sonraki Bakım Tarih" — Missing Possessive Suffix

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Status** | ⬜ OPEN |
| **Bug** | `MaintenancePage.tsx` header says "Sonraki Bakım Tarih" — correct Turkish grammar requires "Sonraki Bakım Tarihi" (possessive "-i"). |
| **Required Fix** | Change to "Sonraki Bakım Tarihi". |
| **Files** | `MaintenancePage.tsx:46` |

### B-DSGN-12: Status Default Case Mismatch

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Status** | ⬜ OPEN |
| **Bug** | `TripsPage.tsx` sets default form `durum: 'aktif'` (lowercase) but all comparisons and database values use uppercase `'AKTIF'`. |
| **Required Fix** | Change default to `'AKTIF'`. |
| **Files** | `TripsPage.tsx:267` |

### B-DSGN-13: SettingsPage Dark Theme Isolated

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Status** | ⬜ OPEN |
| **Bug** | SettingsPage is the ONLY page using a dark theme (`bg-[#08090a]`, dark inputs, dark text) while ALL other CRUD pages use a white/light theme (`bg-white`, light inputs). The entire page looks like a different application. |
| **Impact** | Jarring visual transition when navigating to Settings. |
| **Required Fix** | Align SettingsPage design tokens with other pages OR move all pages to dark theme. |
| **Files** | `SettingsPage.tsx` |

### B-DSGN-14: Search Bar Pattern — Present on 8 Pages, Absent on 6

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Status** | ⬜ OPEN |
| **Bug** | 8 pages have search bar + KPI stats header pattern, 6 pages have simple header with no search. TrailersPage, FuelLogPage, TollLogsPage, MaintenancePage, DriverLeavePage have no search capability even though they display tabular data. |
| **Required Fix** | Add search bar to all DataGrid pages OR document which pages intentionally omit it. |
| **Files** | `TrailersPage.tsx`, `FuelLogPage.tsx`, `TollLogsPage.tsx`, `MaintenancePage.tsx`, `DriverLeavePage.tsx` |

### B-DSGN-15: Submit Button — Inconsistent Create/Edit Distinction

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Status** | ⬜ OPEN |
| **Bug** | 3 pages distinguish create vs edit mode ("Kaydet"/"Güncelle"), 10 pages use "Kaydet" for both modes, 2 pages use bespoke labels ("Fatura Oluştur", "Ekle"). |
| **Required Fix** | Standardize: Create mode = "Kaydet", Edit mode = "Güncelle" across all pages. |
| **Files** | 12 pages with non-standard behavior |

### B-DSGN-16: Navigation Icons — Missing Items

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Status** | ⬜ OPEN |
| **Bug** | Sidebar has 16 nav items but lacks: Yardım (Help), KVKK, Gizlilik, Kullanım Koşulları links. These pages exist in `App.tsx` routes but have no sidebar or footer navigation. |
| **Required Fix** | Add footer links or "More" section in sidebar for legal/info pages. |
| **Files** | `Sidebar.tsx` |

---

## D. SUMMARY

| Severity | Count | Issues |
|:---:|:---:|--------|
| P1 High | 4 | Button color split, Aktif color, Hex/text mismatch, Delete confirmation UX |
| P2 Medium | 4 | Add button text, Empty state, No toast system, Badge opacity |
| P3 Low | 8 | Modal h-tag, Focus ring, Grammar, Case mismatch, Dark theme isolation, Search bar parity, Submit button, Navigation |

**Total: 16 design/UX/wording bugs found across 14 page files.**
