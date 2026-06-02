# Unysol — Test User Names & Passwords

> **Created:** 02 June 2026  
> **Purpose:** Cross-tenant testing credentials for 10 test companies  
> **Total:** 10 tenants (TENANT_OWNER) + 30 sub-users (OFFICE/DRIVER/ACCOUNTANT)

---

## Test Tenants

All tenant owner passwords: `REDACTED`

| # | Tenant ID | Company Name | Email | Load Ad |
|---|:---:|---|------|------|
| 1 | 4 | Anadolu Lojistik | test1@unysol.test | ✅ |
| 2 | 5 | Ege Nakliyat | test2@unysol.test | ✅ |
| 3 | 6 | Marmara Transport | test3@unysol.test | ✅ |
| 4 | 7 | Karadeniz Tasimacilik | test4@unysol.test | ✅ |
| 5 | 8 | Ic Anadolu Kargo | test5@unysol.test | ✅ |
| 6 | 11 | Akdeniz Lojistik | test6@unysol.test | ✅ |
| 7 | 12 | Guneydogu Nakliyat | test7@unysol.test | ✅ |
| 8 | 13 | Dogu Ekspres | test8@unysol.test | ✅ |
| 9 | 14 | Trakya Tasimacilik | test9@unysol.test | ✅ |
| 10 | 15 | Cukurova Lojistik | test10@unysol.test | ✅ |

---

## Sub-Users (3 per tenant)

All sub-user passwords: `REDACTED`

### Permission Legend
- **V** = can_view, **C** = can_create, **E** = can_edit, **D** = can_delete

### Anadolu Lojistik (tenant_id=4)

| # | Role | Name | Email | Modules w/ Permissions |
|---|------|------|-------|------|
| 1 | OFFICE | Ofis Anadolu | ofis4@unysol.test | `billing`(VCED), `customer_mgmt`(VED), `driver_leave`(VCE), `employee_mgmt`(VED), `load_board`(VE), `maintenance`(VCED), `settings`(VCED), `toll_tracking`(VCED), `trailer_mgmt`(VCED), `truck_tracking`(VED) |
| 2 | DRIVER | Sofor Anadolu | sofor4@unysol.test | `driver_leave`(V), `expense_tracking`(V), `load_board`(VC), `settings`(VD) |
| 3 | ACCOUNTANT | Muhasebe Anadolu | muhasebe4@unysol.test | `actions`(VD), `fuel_logging`(VCD), `predictions`(VD), `trailer_mgmt`(VE), `truck_tracking`(VCED) |

### Ege Nakliyat (tenant_id=5)

| # | Role | Name | Email | Modules w/ Permissions |
|---|------|------|-------|------|
| 1 | OFFICE | Ofis Ege | ofis5@unysol.test | `actions`(VD), `cek_senet`(VCE), `invoice_mgmt`(VE), `settings`(VCD), `trailer_mgmt`(VD) |
| 2 | DRIVER | Sofor Ege | sofor5@unysol.test | `actions`(VCE), `billing`(VD), `driver_leave`(V), `employee_mgmt`(VCD), `expense_tracking`(VD), `toll_tracking`(V), `trip_mgmt`(VD), `truck_tracking`(VD) |
| 3 | ACCOUNTANT | Muhasebe Ege | muhasebe5@unysol.test | `cek_senet`(VCE), `customer_mgmt`(VD), `employee_mgmt`(VCE), `expense_tracking`(VCED), `maintenance`(VD) |

### Marmara Transport (tenant_id=6)

| # | Role | Name | Email | Modules w/ Permissions |
|---|------|------|-------|------|
| 1 | OFFICE | Ofis Marmara | ofis6@unysol.test | `actions`(VCD), `cek_senet`(VCED), `invoice_mgmt`(VC), `maintenance`(VCE), `trip_mgmt`(VCE) |
| 2 | DRIVER | Sofor Marmara | sofor6@unysol.test | `billing`(VCED), `cek_senet`(VCE), `customer_mgmt`(VED), `driver_leave`(VED), `employee_mgmt`(VCED), `fuel_logging`(VE), `invoice_mgmt`(VCE), `predictions`(VCED), `settings`(VD), `toll_tracking`(V) |
| 3 | ACCOUNTANT | Muhasebe Marmara | muhasebe6@unysol.test | `billing`(VD), `cek_senet`(VC), `driver_leave`(VE), `load_board`(VC), `maintenance`(VE), `settings`(VC), `toll_tracking`(VD), `trailer_mgmt`(V), `truck_tracking`(VCE) |

### Karadeniz Tasimacilik (tenant_id=7)

| # | Role | Name | Email | Modules w/ Permissions |
|---|------|------|-------|------|
| 1 | OFFICE | Ofis Karadeniz | ofis7@unysol.test | `actions`(VCD), `employee_mgmt`(VE), `expense_tracking`(VCE), `trailer_mgmt`(VD) |
| 2 | DRIVER | Sofor Karadeniz | sofor7@unysol.test | `billing`(VCD), `driver_leave`(VCD), `expense_tracking`(VCD), `settings`(VCD), `trailer_mgmt`(VED), `truck_tracking`(V) |
| 3 | ACCOUNTANT | Muhasebe Karadeniz | muhasebe7@unysol.test | `cek_senet`(VCE), `customer_mgmt`(VD), `employee_mgmt`(VD), `trailer_mgmt`(VCD) |

### Ic Anadolu Kargo (tenant_id=8)

| # | Role | Name | Email | Modules w/ Permissions |
|---|------|------|-------|------|
| 1 | OFFICE | Ofis Ic | ofis8@unysol.test | `billing`(VD), `customer_mgmt`(VCD), `driver_leave`(V), `employee_mgmt`(VC), `fuel_logging`(VCE), `invoice_mgmt`(VED), `predictions`(VED), `settings`(VE), `trailer_mgmt`(VD), `trip_mgmt`(VC) |
| 2 | DRIVER | Sofor Ic | sofor8@unysol.test | `actions`(VED), `billing`(V), `employee_mgmt`(V), `expense_tracking`(VCD), `fuel_logging`(VD), `load_board`(V), `maintenance`(VD), `toll_tracking`(VE), `trip_mgmt`(VD), `truck_tracking`(VCE) |
| 3 | ACCOUNTANT | Muhasebe Ic | muhasebe8@unysol.test | `billing`(V), `customer_mgmt`(VE), `expense_tracking`(V), `fuel_logging`(V), `invoice_mgmt`(VC), `maintenance`(VC), `predictions`(VC), `settings`(VCE), `trailer_mgmt`(VE), `trip_mgmt`(VE) |

### Akdeniz Lojistik (tenant_id=11)

| # | Role | Name | Email | Modules w/ Permissions |
|---|------|------|-------|------|
| 1 | OFFICE | Ofis Akdeniz | ofis11@unysol.test | `actions`(VD), `cek_senet`(VED), `maintenance`(VE), `settings`(VCE), `trailer_mgmt`(VC) |
| 2 | DRIVER | Sofor Akdeniz | sofor11@unysol.test | `load_board`(VED), `predictions`(VC), `settings`(VED), `toll_tracking`(VD), `trailer_mgmt`(VD) |
| 3 | ACCOUNTANT | Muhasebe Akdeniz | muhasebe11@unysol.test | `billing`(VCD), `driver_leave`(VE), `expense_tracking`(VCE), `fuel_logging`(VED), `invoice_mgmt`(V), `toll_tracking`(VED) |

### Guneydogu Nakliyat (tenant_id=12)

| # | Role | Name | Email | Modules w/ Permissions |
|---|------|------|-------|------|
| 1 | OFFICE | Ofis Guneydogu | ofis12@unysol.test | `billing`(V), `customer_mgmt`(VC), `fuel_logging`(VD), `settings`(VED), `toll_tracking`(VD), `trailer_mgmt`(VD), `trip_mgmt`(VCED), `truck_tracking`(VCED) |
| 2 | DRIVER | Sofor Guneydogu | sofor12@unysol.test | `billing`(VE), `driver_leave`(VED), `employee_mgmt`(VCE), `expense_tracking`(VED), `fuel_logging`(VCD), `predictions`(VE), `toll_tracking`(VCED), `trailer_mgmt`(V), `truck_tracking`(VED) |
| 3 | ACCOUNTANT | Muhasebe Guneydogu | muhasebe12@unysol.test | `actions`(VCED), `driver_leave`(V), `expense_tracking`(VCD), `load_board`(VD), `maintenance`(VC), `settings`(VD), `toll_tracking`(VCED), `trailer_mgmt`(VE) |

### Dogu Ekspres (tenant_id=13)

| # | Role | Name | Email | Modules w/ Permissions |
|---|------|------|-------|------|
| 1 | OFFICE | Ofis Dogu | ofis13@unysol.test | `actions`(VCE), `employee_mgmt`(VCD), `expense_tracking`(VCED), `fuel_logging`(VD), `invoice_mgmt`(VC), `load_board`(VC), `predictions`(VD), `settings`(VD), `toll_tracking`(VCED) |
| 2 | DRIVER | Sofor Dogu | sofor13@unysol.test | `actions`(VCED), `billing`(VE), `cek_senet`(V), `driver_leave`(VCE), `expense_tracking`(VD), `load_board`(V), `settings`(VCD), `truck_tracking`(VC) |
| 3 | ACCOUNTANT | Muhasebe Dogu | muhasebe13@unysol.test | `actions`(VCED), `billing`(VCE), `driver_leave`(VED), `expense_tracking`(VD), `fuel_logging`(VED), `load_board`(VE), `maintenance`(VE), `settings`(VCD), `truck_tracking`(VCED) |

### Trakya Tasimacilik (tenant_id=14)

| # | Role | Name | Email | Modules w/ Permissions |
|---|------|------|-------|------|

### Cukurova Lojistik (tenant_id=15)

| # | Role | Name | Email | Modules w/ Permissions |
|---|------|------|-------|------|

---

## Quick Login Reference

| Company | Owner Login | Sub-Users |
|---------|-------------|-----------|
| Anadolu | `test1@unysol.test` | OFFICE(ofis4@unysol.test), DRIVER(sofor4@unysol.test), ACCOUNTANT(muhasebe4@unysol.test) |
| Ege | `test2@unysol.test` | OFFICE(ofis5@unysol.test), DRIVER(sofor5@unysol.test), ACCOUNTANT(muhasebe5@unysol.test) |
| Marmara | `test3@unysol.test` | OFFICE(ofis6@unysol.test), DRIVER(sofor6@unysol.test), ACCOUNTANT(muhasebe6@unysol.test) |
| Karadeniz | `test4@unysol.test` | OFFICE(ofis7@unysol.test), DRIVER(sofor7@unysol.test), ACCOUNTANT(muhasebe7@unysol.test) |
| Ic Anadolu | `test5@unysol.test` | OFFICE(ofis8@unysol.test), DRIVER(sofor8@unysol.test), ACCOUNTANT(muhasebe8@unysol.test) |
| Akdeniz | `test6@unysol.test` | OFFICE(ofis11@unysol.test), DRIVER(sofor11@unysol.test), ACCOUNTANT(muhasebe11@unysol.test) |
| Guneydogu | `test7@unysol.test` | OFFICE(ofis12@unysol.test), DRIVER(sofor12@unysol.test), ACCOUNTANT(muhasebe12@unysol.test) |
| Dogu | `test8@unysol.test` | OFFICE(ofis13@unysol.test), DRIVER(sofor13@unysol.test), ACCOUNTANT(muhasebe13@unysol.test) |
| Trakya | `test9@unysol.test` |  |
| Cukurova | `test10@unysol.test` |  |

---

## Test Setup Summary

- **Load Board:** 10 cross-tenant load advertisements (YUK_VAR/YUK_ARA)
- **Permissions:** Each sub-user has 4-10 randomly assigned module permissions
- **Roles:** OFFICE (view+create+edit), DRIVER (view+create), ACCOUNTANT (view+edit+delete)
- **All users:** Can be tested for permission enforcement, CRUD operations, and cross-tenant access

## Usage

This file provides credentials for multi-tenant cross-testing scenarios:
1. Test load board visibility across tenants
2. Test permission enforcement (different roles see different modules)
3. Test CRUD operations with different permission levels
4. Test cross-tenant data isolation
