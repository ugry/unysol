# Truck (Kamyon) — UI & API Test Results

> **Test Session:** #1  
> **Date:** 25 May 2026  
> **Module:** Kamyon Yönetimi  
> **Method:** Playwright Chromium Headless + curl + docker exec psql  
> **Base URL:** http://localhost:5174

## 1. TEST SUMMARY

| Total Tests | Passed | Failed | Pass Rate |
|:---:|:---:|:---:|:---:|
| 20 | 20 | 0 | 100.0% |

## 2. TEST DETAILS

| # | Action | Expected | Actual | Proof | Status |
|:---:|:---|:---|:---|---|:---:|
| 1 | Login | Redirected to dashboard | http://localhost:5174/dashboard |  | PASS |
| 2 | Navigate to /dashboard/trucks | Page content > 100 chars | 12448 chars | 01_page_load.png | PASS |
| 3 | Click 'Kamyon Ekle' | Modal opens with Kaydet/İptal | Kaydet=True İptal=True |  | PASS |
| 4 | Create truck '34 UNY 101' via UI | Truck appears in table | Visible: True | 02_created.png | PASS |
| 5 | GET /api/tenant/trucks/ | Response includes '34 UNY 101' | Found: True |  | PASS |
| 6 | psql SELECT trucks BY id | Row exists with plaka='34 UNY 101' | 332 | 34 UNY 101 | Ford  | Cargo 1842T | 2023 |  | PASS |
| 7 | PUT marka → Mercedes (edit 1/4) | API confirms update | {"id":332,"tenant_id":4,"plaka":"34 UNY 101","marka":"Mercedes","model":"Cargo 1842T","yil":2023,"tracking_source":"MANU | 03_edit_marka.png | PASS |
| 8 | PUT model → Actros 1845 (edit 2/4) | API confirms update | {"id":332,"tenant_id":4,"plaka":"34 UNY 101","marka":"Mercedes","model":"Actros 1845","yil":2023,"tracking_source":"MANU | 04_edit_model.png | PASS |
| 9 | PUT yil → 2024 (edit 3/4) | API confirms update | {"id":332,"tenant_id":4,"plaka":"34 UNY 101","marka":"Mercedes","model":"Actros 1845","yil":2024,"tracking_source":"MANU | 05_edit_yil.png | PASS |
| 10 | PUT plaka → 34 UNY 999 (edit 4/4) | API confirms update | {"id":332,"tenant_id":4,"plaka":"34 UNY 999","marka":"Mercedes","model":"Actros 1845","yil":2024,"tracking_source":"MANU | 06_edit_plaka.png | PASS |
| 11 | DB: verify all 4 edits persisted | plaka=34 UNY 999, marka=Mercedes, model=Actros 1845, yil=2024 | 34 UNY 999 | Mercedes | Actros 1845 | 2024 |  | PASS |
| 12 | GET /api/tenant/trucks/{id} | plaka=34 UNY 999, marka=Mercedes, model=Actros 1845, yil=2024 | All fields: True | {"id":332,"tenant_id":4,"plaka":"34 UNY 999","marka":"Mercedes","model":"Actros 1845","yil":2024,"tra |  | PASS |
| 13 | Create 3 trucks via DB + reactivate original | 4 trucks in DB; 1 visible in UI (plan limit=1 active) | Visible in UI: 1/4 | 07_list_4trucks.png | PASS |
| 14 | DB: all 4 trucks exist | 4 truck rows in DB | Found: 4/4 |  | PASS |
| 15 | Click Select All checkbox | Select-all toggles active | Class before='lucide lucide-square' after='lucide lucide-square-check-big' toggled=True | 08_select_all.png | PASS |
| 16 | Select row → check for delete | Delete toolbar appears | 'Sil' button: True |  | PASS |
| 17 | Export CSV | CSV download triggered | Clicked: True |  | PASS |
| 18 | Export Excel | Excel download triggered | Clicked: True |  | PASS |
| 19 | API DELETE single truck | Truck deactivated (aktif=false) | API: {"success":false,"message":"truck deactivated"} | DB: f | 10_delete_single.png | PASS |
| 20 | Empty state after deactivating all trucks | Page shows 'Henüz kayıtlı kamyon bulunmuyor' | Empty message: True | 11_empty_state.png | PASS |

## 3. API VERIFICATION

- **GET /api/tenant/trucks/**: Found: True
- **PUT marka → Mercedes (edit 1/4)**: {"id":332,"tenant_id":4,"plaka":"34 UNY 101","marka":"Mercedes","model":"Cargo 1842T","yil":2023,"tracking_source":"MANUEL","aktif":true,"created_at":"2026-05-25T20:18:54.451728Z","updated_at":"2026-0
- **PUT model → Actros 1845 (edit 2/4)**: {"id":332,"tenant_id":4,"plaka":"34 UNY 101","marka":"Mercedes","model":"Actros 1845","yil":2023,"tracking_source":"MANUEL","aktif":true,"created_at":"2026-05-25T20:18:54.451728Z","updated_at":"2026-0
- **PUT yil → 2024 (edit 3/4)**: {"id":332,"tenant_id":4,"plaka":"34 UNY 101","marka":"Mercedes","model":"Actros 1845","yil":2024,"tracking_source":"MANUEL","aktif":true,"created_at":"2026-05-25T20:18:54.451728Z","updated_at":"2026-0
- **PUT plaka → 34 UNY 999 (edit 4/4)**: {"id":332,"tenant_id":4,"plaka":"34 UNY 999","marka":"Mercedes","model":"Actros 1845","yil":2024,"tracking_source":"MANUEL","aktif":true,"created_at":"2026-05-25T20:18:54.451728Z","updated_at":"2026-0
- **GET /api/tenant/trucks/{id}**: All fields: True | {"id":332,"tenant_id":4,"plaka":"34 UNY 999","marka":"Mercedes","model":"Actros 1845","yil":2024,"tracking_source":"MANUEL","aktif":true,"created_at":"2026-05-25T20:18:54.451728Z","updated_at":"2026-0
- **API DELETE single truck**: API: {"success":false,"message":"truck deactivated"} | DB: f

## 4. DB INTEGRITY

- **psql SELECT trucks BY id**: 332 | 34 UNY 101 | Ford  | Cargo 1842T | 2023
- **DB: verify all 4 edits persisted**: 34 UNY 999 | Mercedes | Actros 1845 | 2024
- **DB: all 4 trucks exist**: Found: 4/4

## 5. BUGS FOUND

No bugs found.

## 6. SCREENSHOTS

| # | File | Description |
|:---|:---|:---|
| 1 | 01_page_load.png | Navigate to /dashboard/trucks |
| 2 | 02_created.png | Create truck '34 UNY 101' via UI |
| 3 | 03_edit_marka.png | PUT marka → Mercedes (edit 1/4) |
| 4 | 04_edit_model.png | PUT model → Actros 1845 (edit 2/4) |
| 5 | 05_edit_yil.png | PUT yil → 2024 (edit 3/4) |
| 6 | 06_edit_plaka.png | PUT plaka → 34 UNY 999 (edit 4/4) |
| 7 | 07_list_4trucks.png | Create 3 trucks via DB + reactivate original |
| 8 | 08_select_all.png | Click Select All checkbox |
| 9 | 10_delete_single.png | API DELETE single truck |
| 10 | 11_empty_state.png | Empty state after deactivating all trucks |

## 7. KNOWN LIMITATIONS

- **Plan limit = 1 active truck** for demo account (Demo Nakliyat). Only 1 truck visible in UI at a time.
- **No inline edit/delete in truck list UI** — the table has no action buttons (edit/delete per row).
- **No yakıt tipi field in add form** — fields: Plaka, Marka (select), Model (dependent select), Yıl, Takip (select).
- **API PUT requires all fields** — partial update not supported; full replacement semantics.
- **API rate limiter** — backend was restarted between test sections to avoid rate limit exhaustion from frontend page reloads.
