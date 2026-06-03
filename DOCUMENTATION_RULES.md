# Unysol — Documentation Rules (Enforceable)

> **Purpose:** Prevent documentation rot, duplication, ambiguity, and credential leaks.
> **Audience:** AI coding agents and human developers.
> **Enforcement:** CI gates + manual code review.

---

## Rule 1: One Source of Truth Per Category

Each information category has exactly **one canonical file**:

| Category | Canonical File | Do NOT Create |
|----------|---------------|---------------|
| Module registry | `MODULES.md` | new file tracking module status |
| Bug database | `BUGS.md` | new bug report files |
| Milestones/history | `MILESTONES.md` | `milestone_*.md`, session summaries |
| Test credentials | `TEST_ACCOUNTS.md` | new credential files |
| Task priorities | `TODO.md` | new task lists in other files |
| Architecture | `BLUEPRINT.md` + `README.md` | architecture snapshots |
| Module rules | This file (`DOCUMENTATION_RULES.md`) | `newmodules.md`-style files |

### How to update:
- Edit the canonical file. Do not create a new one.
- If information becomes obsolete, add a `## Deprecated` section with the deprecation date.

---

## Rule 2: No Date-Stamped Snapshots

**NEVER create files like:**
- `milestone_june_3.md`
- `STATUS_june_3.md`
- `test_results_june_3.md`

Instead, **update the existing canonical file** and bump the `Last Updated` date.

### Exception:
- Per-session `*_UI_and_API_Test_results.md` files are acceptable because they capture specific test evidence (screenshots, raw API responses). But they must reference the test directive in `UI_Test_Directives.md`.

---

## Rule 3: Secrets Never in Documentation

**The following must never appear in any `.md` file:**

| Secret Type | Examples |
|-------------|----------|
| JWT secrets | `JWT_SECRET`, signing keys |
| API keys | Stripe `sk_*`, exa.ai, Google OAuth client secrets |
| Passwords | SSH, database, admin panel |
| AWS credentials | Access keys, secret keys, account IDs with corresponding credentials |
| Private keys | SSH private keys, certificate private keys |

### What to write instead:
```
# Wrong:
JWT Secret: abc123def456...
SSH Password: mypassword

# Correct:
See `.env` file / GitHub Secrets / AWS Secrets Manager
```

**Enforcement:** Gitleaks scans already active in CI. Files found with secrets get blocked from deployment.

---

## Rule 4: Binary Status Markers Only

Use exactly two statuses across all tables:

| Marker | Meaning |
|:---:|---------|
| `✅` | Done, verified, working |
| `⬜` | Not done, pending, open |

**Never use:**
- `⚠` (ambiguous — fix it or mark it ⬜)
- `⏳` (ambiguous — it's either done or not)

If something is "in progress" or "partially done", write it as `⬜` with a note in the Details column explaining what's remaining.

---

## Rule 5: Deprecated Files Get `_ARCHIVED` Suffix

If a file contains historical value but is no longer current:

1. Rename to `filename_ARCHIVED.md`
2. Add this header:
   ```
   > **DEPRECATED** — This file was archived on YYYY-MM-DD.
   > See CANONICAL_FILE.md for current information.
   ```
3. Never delete a historical file without archiving it first.

---

## Rule 6: Task Ownership Required

Every task in `TODO.md` must have:

```
| # | Task | @Owner | Target Date | Priority | Status |
```

If no human owner is assigned yet, use `@unassigned`. No task survives more than 1 sprint (2 weeks) without a date update.

---

## Rule 7: Module Audit Consistency

- `MODULES.md` is the canonical module list
- All other files referencing module counts must cite `MODULES.md`
- When a new module is built, update `MODULES.md` within the same commit
- Run `scripts/check-module-consistency.sh` before pushing (already in CI)

### Self-Check:
After editing any file, verify:
1. Does this information already exist in a canonical file?
2. Am I creating a snapshot instead of updating the source?
3. Have I updated the `Last Updated` date?
4. Are all status markers `✅` or `⬜` only?
5. Did I accidentally include any credentials?

---

## Rule 8: Test Scripts Live in `/home/unysoltestkit`

All test scripts, smoke tests, API testers, and checkout verifiers live in `/home/unysoltestkit/`:

| Script | Purpose |
|--------|---------|
| `qa.sh` | QA environment manager (up/down/health/db-seed) |
| `smoke-test-qa.sh` | Full QA smoke test (health, auth, docker, response time) |
| `smoke-test-prod.sh` | Production smoke test (health, SSL, auth, endpoints) |
| `stripe-checkout-test.sh` | Stripe checkout end-to-end test |
| `api-crud-test.sh` | CRUD cycle test across modules |
| `pre-deploy-check.sh` | Safety gates before deployment |
| `login-test.sh` | Login + JWT extraction + health verify |

### Do NOT:
- Create test scripts inside `/home/ugur/unysol/` project directory
- Create ad-hoc curl tests without saving them

### Do:
- Add new test scripts to `/home/unysoltestkit/`
- Run `chmod +x` on new scripts
- Update `README.md` in testkit when adding scripts

---

## Rule 9: File Naming Convention

| Pattern | Usage |
|---------|-------|
| `UPPERCASE.md` | Canonical reference files (BLUEPRINT, MODULES, BUGS, STATUS, TODO, MILESTONES, README) |
| `lowercase.md` | Feature specs, observations, test results |
| `*_ARCHIVED.md` | Deprecated historical files |
| `*_UI_and_API_Test_results.md` | Per-session test evidence |

---

## Violation Consequences

| Violation | Gate |
|-----------|------|
| Secrets in docs | Blocked by Gitleaks (CI) |
| Module/DB inconsistency | Blocked by `module-consistency` job (CI) |
| File count explosion | Code review rejection |
| Stale statuses | Flagged in sprint review |

These rules are checked by the CI pipeline at `.github/workflows/test.yml` — 35 automated gates must pass before any deploy.
