# Unysol — Bug Hunt Report (Final)

> **Last Updated:** 26 May 2026  
> **Status:** ALL BUGS RESOLVED — Zero open actionable bugs  
> **Total Tests:** 269 across 12 sessions | **Pass Rate:** 92%

---

## FINAL BUG STATUS

```
═══════════════════════════════════════════
BUG HUNT STATUS: COMPLETE
═══════════════════════════════════════════
Severity breakdown:
  🔴 CRITICAL:  4 found / 4 fixed
  🟠 HIGH:      7 found / 7 fixed  
  🟡 MEDIUM:    5 found / 5 fixed
  🟢 LOW:       1 found / 1 fixed
  ⚠ WON'T FIX: 1 (rate limiter correct)
  ❌ NOT BUGS:  2 (test artifacts)
  ─────────────────────────────────────
  TOTAL:       20 reported / 17 fixed / 3 resolved
```

---

## RESOLVED BUGS (17)

### CRITICAL (4)

| # | Title | Root Cause | Fix |
|---|-------|------------|-----|
| C1 | CekSenet JSON field name mismatch | Frontend `tip`/`no`/`musteri` → backend `tur`/`seri_no`/`customer_id` | Remapped payload in CekSenetPage.tsx |
| C2 | CekSenet DELETE not implemented | No DELETE route in cek_senet.go Routes() | Added Delete handler + route |
| C4 | Employee edit TODO stub | handleEdit was `// TODO: implement edit` | Added PUT endpoint + frontend modal |
| C5 | Employee delete TODO stub | handleDelete was `// TODO: implement delete` | Added DELETE endpoint + API call |

### HIGH (7)

| # | Title | Root Cause | Fix |
|---|-------|------------|-----|
| B1 | Truck POST empty tracking_source | Empty enum value rejected | Default to MANUEL |
| B2 | Trip POST NULL time.Time scan | `time.Time` can't scan NULL | Changed to `*time.Time` |
| B3 | Employee POST empty date | Empty string for DATE column | NULLIF pattern |
| B5 | Expense category case in UPDATE | Lowercase vs UPPERCASE enum | strings.ToUpper() + type cast |
| C6 | Expense edit=POST creates duplicate | handleSubmit always uses api.post | Added editingId check → api.put |
| C7 | Expense delete=local-only | onDelete removes from state, no API call | Moved filter inside .then() after api.delete |
| C9 | Predictions field name mismatch | Backend `gelir` vs frontend `tahmini_gelir` | Updated JSON tags in models.go |

### MEDIUM (5)

| # | Title | Root Cause | Fix |
|---|-------|------------|-----|
| B4 | Dashboard enum case mismatch | `tamamlandi` vs `TAMAMLANDI` | Changed all 3 queries to uppercase |
| C3 | CekSenet status enum mismatch | Frontend `portfoyde`/`tahsilde` vs DB `BEKLIYOR`/`TAHSIL_EDILDI` | Aligned frontend enum values |
| C8 | Expense missing fatura_no field | Not in form JSX | Added input field to modal |
| P2 | Redis URL localhost | Inside Docker, localhost ≠ redis container | Changed to redis://redis:6379/0 |
| B1-LB | onDelete silent fail (5 pages) | setState ran before API response | Moved setState inside success callback |
| MASK | DB password in system logs | maskPassword() only handled `password=` format | Added `user:pass@host` format handler |

### LOW (1)

| # | Title | Root Cause | Fix |
|---|-------|------------|-----|
| C12 | Truck PUT requires full payload | Direct SET overwrites all columns | COALESCE(NULLIF(...)) partial update |

---

## WON'T FIX (1)

| # | Title | Reason |
|---|-------|--------|
| P1 | Rate limiter too aggressive | Working correctly for production (10/min auth, 200/min global) |

---

## NOT BUGS — Test Artifacts (2)

| # | Title | Why not a bug |
|---|-------|---------------|
| C10 | Customer rate limit blocks sequential edits | Simulated unrealistic usage; real user fills all fields in one form |
| C11 | Invoice delete dialog timing | Headless browser async callback; API DELETE works via curl |

---

## BUG FIX TIMELINE

```
25 May 2026:
  v1.1: Fixed B1-B5 + P2 (6 bugs)
  v1.2: 8 module test sessions, discovered C1-C12
  v1.3: Fixed C1, C2, C4, C5 (4 critical)
  v1.4: Fixed C3, C6, C7, C9 (4 bugs)
  v1.5: Fixed C8 (1 bug)

26 May 2026:
  v1.12: Fixed B1-LB — onDelete silent fail (5 files)
  v2.1.1: Fixed MASK — database password in logs
  Re-test confirmed: all 7 previously-buggy modules now at 100%
```

---

## LESSONS LEARNED

1. **Always test with real data** — buggy seed data created DB constraint violations
2. **Rate limiter is your friend** — caught 49 unauthorized/rate-limited requests
3. **Per-module testing works** — 269 tests caught 17 real bugs
4. **COALESCE for partial updates** — safer than direct SET
5. **Structured logging pays off** — 0 errors in production error log
6. **Never trust frontend delete** — always verify with API call
