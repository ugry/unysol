# Unysol CI/CD Improvements

> **Audit date:** 01 Jun 2026  
> **Files analyzed:** `.github/workflows/test.yml` (373 lines), `.github/workflows/deploy.yml` (101 lines), `docker-compose.yml`, `Dockerfile`s, `scripts/check-module-consistency.sh`

---

## Current State

- **test.yml** — 8 parallel jobs: backend-test, frontend-test, module-consistency, security-checks, api-smoke (Postgres+Redis), build-artifacts, landing-checks, production-integrity
- **deploy.yml** — 1 job: builds Docker images → pushes to ECR → deploys to ECS → health check
- **deploy.yml.vps-backup** — Saved VPS deploy alternative (not active)

### What's Good
- 8 parallel test jobs with broad coverage
- Real Postgres + Redis services in API smoke test
- Docker Buildx with GitHub Actions cache
- SHA-tagged Docker images for traceability
- ECS deployment with stabilization wait + health check
- Security middleware verification automated
- Bundle size enforcement (<3MB)
- Mock data detection in production pages
- Module ↔ handler ↔ page consistency automation script

---

## Issues (by severity)

### P0 — Critical (Fix Immediately)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| P0-1 | **Go tests silently ignored** | `test.yml:29` | `go test ... 2>&1 \|\| true` — all test failures swallowed. Broken code passes CI. |
| P0-2 | **Deploy has no test dependency** | `deploy.yml` | No `needs:` — deploys even if all tests fail. |
| P0-3 | **No linting at all** | Missing | No `golangci-lint`, no ESLint. Bugs and style issues ship undetected. |

### P1 — High Priority

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| P1-1 | No Go module caching | `test.yml` | `setup-go` missing `cache: true` — slower builds |
| P1-2 | No frontend tests in CI | `test.yml` | Playwright tests exist on disk but never run in pipeline |
| P1-3 | No vulnerability scanning | Missing | No `govulncheck`, no `npm audit`, no container scan |
| P1-4 | No secret scanning | Missing | No Gitleaks — credentials could leak in commits |
| P1-5 | Hardcoded Google Client ID | `deploy.yml:58` | Fallback value hardcoded in workflow |

### P2 — Medium Priority

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| P2-1 | No test coverage tracking | `test.yml` | No `-coverprofile`, no coverage gate |
| P2-2 | No test result reporting | `test.yml` | No JUnit XML, no PR annotations on failures |
| P2-3 | Frontend Docker uses `serve` | `frontend/Dockerfile` | Not production-grade; should be nginx/Caddy |
| P2-4 | No staging environment | `deploy.yml` | Push to main → straight to production |
| P2-5 | No rollback mechanism | `deploy.yml` | Health check fails → no automated rollback |
| P2-6 | No database migration testing | Missing | No apply/rollback test for migrations |
| P2-7 | No infrastructure-as-code | Missing | ECS resources defined outside repo |
| P2-8 | No concurrency control | `deploy.yml` | Multiple pushes to main could deploy simultaneously |

### P3 — Low Priority / Nice-to-Have

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| P3-1 | No blue/green deployment | `deploy.yml` | `force-new-deployment` causes brief downtime |
| P3-2 | No semantic versioning | Missing | No release tags, no changelog |
| P3-3 | No PR preview environments | Missing | No way to preview changes before merge |
| P3-4 | No deploy notifications | Missing | No Slack/Discord on deploy success/failure |
| P3-5 | No Grafana dashboard validation | Missing | Dashboards in repo not tested in CI |
| P3-6 | No performance/load testing | Missing | No k6, artillery, or wrk |
| P3-7 | No Go version matrix | `test.yml` | Only 1.22 tested |
| P3-8 | Tests trigger on all branches | `test.yml` | Could skip feature branches with `[ci skip]` support |

---

## Implementation Plan (Fix Order)

```
Phase 1: Critical Fixes (today)

  1. P0-1  FIX: Remove `|| true` from go test line
           └─ test.yml line 29: `go test ./... -v -count=1 -coverprofile=coverage.out`
           └─ Time: 1 min

  2. P0-2  ADD: Test dependency to deploy job
           └─ deploy.yml: add `needs: [backend-test, frontend-test, security-checks, api-smoke, module-consistency]`
           └─ Time: 2 min

  3. P0-3a ADD: golangci-lint to backend-test job
           └─ test.yml: add golangci-lint step after build check
           └─ Time: 5 min

  4. P0-3b ADD: ESLint to frontend-test job
           └─ test.yml: add `npx eslint src/ --max-warnings=0` after TypeScript check
           └─ Check if eslint config exists first; create .eslintrc.json if missing
           └─ Time: 10 min

Phase 2: Quick Wins (this week)

  5. P1-1  ADD: Go module caching
           └─ test.yml: add `cache: true` to setup-go step
           └─ Time: 1 min

  6. P2-8  ADD: Concurrency control
           └─ deploy.yml: add `concurrency: { group: deploy-${{ github.ref }}, cancel-in-progress: false }`
           └─ Time: 1 min

  7. P1-5  FIX: Remove hardcoded Google Client ID
           └─ deploy.yml: remove fallback value, add validation error if secret missing
           └─ Time: 2 min

  8. P1-3a ADD: govulncheck to backend-test
           └─ test.yml: add `go run golang.org/x/vuln/cmd/govulncheck ./...` step
           └─ Time: 3 min

  9. P1-3b ADD: npm audit to frontend-test
           └─ test.yml: add `npm audit --audit-level=high` step
           └─ Time: 2 min

Phase 3: Security Hardening (this week)

  10. P1-4  ADD: Gitleaks secret scanning
           └─ test.yml: add gitleaks step as new job or in security-checks
           └─ Time: 5 min

  11. P1-2  ADD: Playwright E2E tests
           └─ test.yml: add new `e2e-test` job with Playwright action
           └─ Needs: backend running, seeded DB
           └─ Time: 30 min

  12. P2-6  ADD: Database migration test
           └─ test.yml: add migration apply then rollback verification in api-smoke job
           └─ Time: 15 min

Phase 4: Production Readiness (next week)

  13. P2-3  FIX: Frontend Dockerfile → nginx
           └─ Replace `serve` with nginx:alpine
           └─ Add nginx.conf with gzip, caching headers, SPA fallback
           └─ Time: 20 min

  14. P2-1  ADD: Coverage tracking
           └─ test.yml: add `-coverprofile=coverage.out`, upload to Codecov/artifact
           └─ Time: 10 min

  15. P2-2  ADD: Test result reporting
           └─ test.yml: use `dorny/test-reporter` for Go + Playwright JUnit XML
           └─ Time: 15 min

  16. P2-5  ADD: Rollback on deploy failure
           └─ deploy.yml: if health check fails → redeploy previous task definition
           └─ Time: 30 min

  17. P3-7  ADD: Go version matrix
           └─ test.yml: test Go 1.22 + 1.23 in matrix
           └─ Time: 5 min

Phase 5: Polish (ongoing)

  18. P2-4  ADD: Staging environment
           └─ New workflow: `deploy-staging.yml` triggered on PR to main
           └─ Deploy to staging ECS service
           └─ Time: 2h

  19. P3-1  ADD: Blue/green deployment
           └─ Use ECS CodeDeploy for blue/green
           └─ Time: 3h

  20. P3-2  ADD: Semantic versioning
           └─ Add `release.yml` with `semantic-release` or manual tag workflow
           └─ Time: 1h

  21. P3-3  ADD: PR preview environments
           └─ Use ECS with dynamic subdomain or just comment screenshot
           └─ Time: 3h

  22. P3-4  ADD: Deploy notifications
           └─ Add Slack webhook step to deploy.yml
           └─ Time: 15 min

  23. P3-6  ADD: Load testing (optional)
           └─ Add k6 script + k6 GitHub Action
           └─ Time: 2h
```

---

## Target test.yml After Phase 1-3

```yaml
name: Test

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  # ============================================================
  # JOB 1: BACKEND (Go) + lint + vulncheck + coverage
  # ============================================================
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true

      - name: Build check
        working-directory: backend
        run: CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /dev/null ./cmd/server

      - name: golangci-lint
        uses: golangci/golangci-lint-action@v6
        with:
          working-directory: backend
          version: latest

      - name: Go vet
        working-directory: backend
        run: go vet ./...

      - name: Go tests (no silent failure)
        working-directory: backend
        run: go test ./... -v -count=1 -coverprofile=coverage.out -covermode=atomic

      - name: govulncheck
        working-directory: backend
        run: go run golang.org/x/vuln/cmd/govulncheck ./...

      - name: Handler file count
        run: |
          COUNT=$(ls backend/internal/handlers/*.go 2>/dev/null | grep -v _test | wc -l)
          echo "Handler files: $COUNT"
          [ "$COUNT" -ge 18 ] || { echo "Expected >=18 handler files"; exit 1; }

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: go-coverage
          path: backend/coverage.out

  # ============================================================
  # JOB 2: FRONTEND (React/Vite) + ESLint + audit
  # ============================================================
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install
        working-directory: frontend
        run: npm ci

      - name: TypeScript check
        working-directory: frontend
        run: npx tsc --noEmit

      - name: ESLint
        working-directory: frontend
        run: npx eslint src/ --max-warnings=0

      - name: Build check
        working-directory: frontend
        run: npm run build

      - name: npm audit
        working-directory: frontend
        run: npm audit --audit-level=high

      - name: Frontend page count
        run: |
          COUNT=$(ls frontend/src/pages/*.tsx 2>/dev/null | wc -l)
          echo "Pages: $COUNT"
          [ "$COUNT" -ge 14 ] || { echo "Expected >=14 pages"; exit 1; }

      - name: No .map files in dist
        run: |
          MAPS=$(find frontend/dist -name "*.map" 2>/dev/null | wc -l)
          [ "$MAPS" -eq 0 ] || { echo "Source maps found in dist ($MAPS files)"; exit 1; }

  # ... (remaining jobs: module-consistency, security-checks, api-smoke,
  #      build-artifacts, landing-checks, production-integrity — unchanged)
```

## Target deploy.yml After Phase 1-3

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false

env:
  AWS_REGION: eu-central-1
  ECR_BACKEND: unysol/backend
  ECR_FRONTEND: unysol/frontend
  ECS_CLUSTER: unysol-cluster
  ECS_SERVICE_BACKEND: unysol-backend
  ECS_SERVICE_FRONTEND: unysol-frontend
  FRONTEND_API_URL: https://unysolar.com

jobs:
  test:
    uses: ./.github/workflows/test.yml

  deploy:
    name: Build & Deploy to ECS
    runs-on: ubuntu-latest
    needs: [test]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: |
            ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_BACKEND }}:latest
            ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_BACKEND }}:sha-${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          build-args: |
            VITE_API_URL=${{ env.FRONTEND_API_URL }}
            VITE_GOOGLE_CLIENT_ID=${{ secrets.GOOGLE_CLIENT_ID }}
          tags: |
            ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_FRONTEND }}:latest
            ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_FRONTEND }}:sha-${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Save previous task definition for rollback
        run: |
          aws ecs describe-task-definition \
            --task-definition unysol-backend \
            --region ${{ env.AWS_REGION }} \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text > /tmp/previous-backend-td.txt || true
          aws ecs describe-task-definition \
            --task-definition unysol-frontend \
            --region ${{ env.AWS_REGION }} \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text > /tmp/previous-frontend-td.txt || true

      - name: Deploy backend to ECS
        run: |
          aws ecs update-service \
            --cluster ${{ env.ECS_CLUSTER }} \
            --service ${{ env.ECS_SERVICE_BACKEND }} \
            --force-new-deployment \
            --region ${{ env.AWS_REGION }}

      - name: Deploy frontend to ECS
        run: |
          aws ecs update-service \
            --cluster ${{ env.ECS_CLUSTER }} \
            --service ${{ env.ECS_SERVICE_FRONTEND }} \
            --force-new-deployment \
            --region ${{ env.AWS_REGION }}

      - name: Wait for backend stabilization
        run: |
          aws ecs wait services-stable \
            --cluster ${{ env.ECS_CLUSTER }} \
            --services ${{ env.ECS_SERVICE_BACKEND }} \
            --region ${{ env.AWS_REGION }}

      - name: Wait for frontend stabilization
        run: |
          aws ecs wait services-stable \
            --cluster ${{ env.ECS_CLUSTER }} \
            --services ${{ env.ECS_SERVICE_FRONTEND }} \
            --region ${{ env.AWS_REGION }}

      - name: Verify deployment
        run: |
          echo "Backend health:"
          curl -sf https://unysolar.com/api/system/health || echo "Health check failed"
          echo ""
          echo "Frontend:"
          curl -sf -o /dev/null -w "HTTP %{http_code}" https://unysolar.com/ || echo "Frontend check failed"

      - name: Notify on failure
        if: failure()
        run: |
          echo "Deployment failed!"
          # Add Slack/Discord webhook here
```

---

## Progress Tracker

| # | Task | Status |
|---|------|:---:|
| P0-1 | Remove `\|\| true` from go test | ✅ |
| P0-2 | Add test dependency to deploy | ✅ |
| P0-3a | Add golangci-lint | ✅ |
| P0-3b | Add ESLint | ✅ |
| P1-1 | Go module caching | ✅ |
| P1-2 | Playwright E2E in CI | ⬜ |
| P1-3a | govulncheck | ✅ |
| P1-3b | npm audit | ✅ |
| P1-4 | Gitleaks secret scan | ✅ |
| P1-5 | Remove hardcoded Google Client ID | ✅ |
| P2-1 | Coverage tracking | ⬜ |
| P2-2 | Test result reporting | ⬜ |
| P2-3 | Frontend Docker → nginx | ⬜ |
| P2-4 | Staging environment | ⬜ |
| P2-5 | Rollback mechanism | ⬜ |
| P2-6 | DB migration test | ⬜ |
| P2-7 | Infrastructure-as-code | ⬜ |
| P2-8 | Concurrency control | ✅ |
| P3-1 | Blue/green deployment | ⬜ |
| P3-2 | Semantic versioning | ⬜ |
| P3-3 | PR preview environments | ⬜ |
| P3-4 | Deploy notifications | ⬜ |
| P3-5 | Grafana dashboard validation | ⬜ |
| P3-6 | Load testing | ⬜ |
| P3-7 | Go version matrix | ⬜ |
| P3-8 | Branch trigger optimization | ⬜ |

---

## Appendix A: Settings Module Test Results (01 Jun 2026)

### API Test Results (10 tests, 4 passed, 6 failed)

| # | Test | Result | Detail |
|---|------|:---:|------|
| A1 | GET /api/tenant/settings | ✅ | Returns 200 with empty settings for super admin |
| A2 | PUT /api/tenant/settings | ❌ | Returns 500 for super admin (tenant_id=0 → FK violation). **Should return 403** |
| A3 | GET verify vergi_dairesi after PUT | ❌ | Not persisted (cascaded from A2 failure) |
| A4 | GET verify vergi_no after PUT | ❌ | Not persisted |
| A5 | GET verify adres after PUT | ❌ | Not persisted |
| A6 | GET verify telefon after PUT | ❌ | Not persisted |
| A7 | PUT settings empty body → 400 | ✅ | Correct validation |
| A8 | PUT settings with Turkish chars | ❌ | Returns 500 (same FK issue as A2) |
| A9 | PUT /api/tenant/settings/notifications | ✅ | Returns 200, data persisted |
| A10 | GET verify notification_prefs | ✅ | Data correctly persisted and returned |

### UI Test Results (30 tests, 24 passed, 6 failed)

| # | Test | Result | Detail |
|---|------|:---:|------|
| U1-U4 | All 4 sections render | ✅ | Firma Bilgileri, Kullanıcı Yönetimi, Bildirim Tercihleri, Paket Bilgisi |
| U5-U9 | All 5 company fields exist | ✅ | Firma Ünvanı, Vergi Dairesi, Vergi No, Telefon, Adres |
| U10 | Save button visible | ✅ | |
| U11 | Company info save confirmation | ❌ | No "Kaydedildi" confirmation after save |
| U12 | Add user button visible | ✅ | |
| U13 | AddUserModal opens | ✅ | |
| U14-U18 | All 5 modal fields exist | ✅ | Ad Soyad, E-posta, Şifre, Rol, Telefon |
| U19 | User creation submitted | ✅ | Modal closed after submission |
| U20 | Delete button has onclick | ❌ | **Trash2 icon has no onClick handler** |
| U21 | All 5 Yakında badges | ❌ | **Notifications not wired to backend API** |
| U22 | No interactive toggles | ✅ | (confirms U21 — toggles are static text) |
| U23 | Plan shows FREE | ✅ | |
| U24 | PRO features listed | ✅ | |
| U25 | Upgrade button visible | ✅ | |
| U26 | Upgrade shows fallback | ❌ | **No alert/redirect on PRO click** |
| U27 | No JS console errors | ✅ | |

### Bugs Found — To Register in CI/CD

| ID | Severity | Bug | Source | CI Gate to Add |
|----|:---:|------|--------|----------------|
| **B-SET-01** | P1 | **Super admin can access tenant-scoped settings API** — GET returns 200, PUT returns 500 (FK violation). Should return 403 for unauthorized scope access. | API A1/A2 | `api-smoke`: verify tenant-scoped endpoints reject super admin with 403 |
| **B-SET-02** | P1 | **Notification PUT response inconsistent** — returns `{"success": false, "message": "notification preferences updated"}`. Data persists despite `success: false`. | API A9/A10 | `api-smoke`: verify notification PUT returns `success: true` when data persists |
| **B-SET-03** | P1 | **Delete user button is decorative** — Trash2 icon in `SettingsPage.tsx` line 187 has no `onClick` handler. Only has className styling, no function call. | UI U20 | `production-integrity`: grep for `Trash2` in SettingsPage, verify `onClick` exists |
| **B-SET-04** | P2 | **Notifications UI not wired to backend** — All 5 toggles hardcoded "Yakında" text despite `PUT /api/tenant/settings/notifications` being fully functional. | UI U21 | `production-integrity`: verify SettingsPage calls `/api/tenant/settings/notifications` endpoint |
| **B-SET-05** | P2 | **PRO upgrade button has no visible response** — Clicking "PRO'ya Yükselt" shows no alert dialog (Stripe fallback should show alert). | UI U26 | `production-integrity`: verify upgrade button has `onClick` handler with alert fallback |
| **B-SET-06** | P2 | **Settings PUT failing for super admin silhouette** — If a real tenant also gets 500 on PUT, settings are entirely broken for all users. Needs tenant-level verification. | API A2/A8 | `api-smoke`: add settings CRUD test with real tenant JWT |

### CI Gate Additions for test.yml

These checks should be added to the `production-integrity` job:

```yaml
# B-SET-03: Delete button must have onClick handler
- name: Delete user button has handler
  run: |
    grep -A1 "Trash2" frontend/src/pages/SettingsPage.tsx | grep -q "onClick" || \
    { echo "BUG B-SET-03: Delete button has no onClick handler"; exit 1; }

# B-SET-04: Notifications must be wired to backend
- name: Notifications wired to API
  run: |
    grep -q "notification_prefs\|notifications" frontend/src/pages/SettingsPage.tsx || \
    { echo "BUG B-SET-04: Notifications toggles not wired to backend"; exit 1; }

# B-SET-05: Upgrade button must have fallback alert
- name: PRO upgrade has fallback handler
  run: |
    grep -A5 "PRO.*Yükselt\|handleUpgrade" frontend/src/pages/SettingsPage.tsx | grep -q "alert\|catch" || \
    { echo "BUG B-SET-05: PRO upgrade has no visible fallback"; exit 1; }
```

These checks should be added to the `api-smoke` job:

```yaml
# B-SET-01: Tenant endpoints must reject super admin
- name: Tenant endpoints reject super admin
  run: |
    TOKEN=$(python3 -c "import jwt,time; print(jwt.encode({'user_id':2,'tenant_id':0,'role':'SUPER_ADMIN','exp':int(time.time())+60}, '${{ secrets.JWT_SECRET || 'test' }}', algorithm='HS256'))")
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/tenant/settings)
    [ "$STATUS" -eq 403 ] || { echo "BUG B-SET-01: Tenant endpoint allowed super admin (got $STATUS, expected 403)"; exit 1; }

# B-SET-02: Notification PUT response consistency
- name: Notification PUT returns success:true
  run: |
    RESPONSE=$(curl -s -X PUT http://localhost:8080/api/tenant/settings/notifications \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"test":true}')
    echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('success') != False, 'BUG B-SET-02: success=false on notification PUT'"
```

### Progress Tracker (Settings Bugs)

| # | Bug | Status |
|---|------|:---:|
| B-SET-01 | Super admin scope access to tenant endpoints | ⬜ |
| B-SET-02 | Notification PUT response inconsistency | ⬜ |
| B-SET-03 | Delete user button decorative (no handler) | ⬜ |
| B-SET-04 | Notifications UI not wired to backend | ⬜ |
| B-SET-05 | PRO upgrade button no visible response | ⬜ |
| B-SET-06 | Verify settings PUT works for real tenants | ⬜ |
