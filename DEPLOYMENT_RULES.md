# Unysol — Deployment Rules

> **Last Updated:** 01 Jun 2026  
> **Enforcement:** GitHub Actions + Environment Protection Rules  

---

## Rule 1: No Deployment Without Passing Automated Tests

All tests listed in the project's test methodology documents MUST pass before any AWS production deployment.

### Required Tests (from `UI_Test_Directives.md` + `STATICWORKFLOWANDTEST.md`)

| Test Suite | Source | Enforced By |
|------------|--------|-------------|
| Go build check | STATICWORKFLOWANDTEST.md | `backend-test` job |
| Go unit tests (`go test ./...`) | STATICWORKFLOWANDTEST.md §4 | `backend-test` job |
| Go vet | STATICWORKFLOWANDTEST.md | `backend-test` job |
| golangci-lint | Code quality | `backend-test` job |
| govulncheck | Security | `backend-test` job |
| TypeScript check (`tsc --noEmit`) | STATICWORKFLOWANDTEST.md | `frontend-test` job |
| ESLint | Code quality | `frontend-test` job |
| Frontend build (`npm run build`) | STATICWORKFLOWANDTEST.md | `frontend-test` job |
| npm audit | Security | `frontend-test` job |
| Module consistency | UI_Test_Directives.md §0.5 | `module-consistency` job |
| Database table count ≥ 29 | BUILT.md | `module-consistency` job |
| Gitleaks secret scan | Security | `security-checks` job |
| Security middleware exists | saaslandingpagesecurity.md | `security-checks` job |
| Rate limit middleware | saaslandingpagesecurity.md | `security-checks` job |
| Email validation | saaslandingpagesecurity.md | `security-checks` job |
| Password validation | saaslandingpagesecurity.md | `security-checks` job |
| Signup lockout | saaslandingpagesecurity.md | `security-checks` job |
| Demo rate limit | saaslandingpagesecurity.md | `security-checks` job |
| RequireTenant rejects super admin | B-SET-01 | `security-checks` job |
| Notification PUT success response | B-SET-02 | `security-checks` job |
| user_permissions table in schema | B-SET-07 | `security-checks` job |
| Permissions error handling | B-SET-08 | `security-checks` job |
| API smoke test (signup + login) | UI_Test_Directives.md | `api-smoke` job |
| Endpoint count ≥ 30 | BUILT.md | `api-smoke` job |
| Dockerfiles exist | STATICWORKFLOWANDTEST.md | `build-artifacts` job |
| Bundle size < 3MB | Performance | `build-artifacts` job |
| Landing page content | saaslandingpageimprovement.md | `landing-checks` job |
| No mock users in production | truckownersettingsanalysis.md | `production-integrity` job |
| Settings uses real API | truckownersettingsanalysis.md | `production-integrity` job |
| Delete button has handler | B-SET-03 | `production-integrity` job |
| Notifications wired to API | B-SET-04 | `production-integrity` job |
| PRO upgrade has fallback | B-SET-05 | `production-integrity` job |
| Optimistic user add | B-SET-06 | `production-integrity` job |
| QA environment files present | QA env | `build-artifacts` job |
| Caddyfile routes match ALB | QA env | `build-artifacts` job |

**Total: 35 automated checks across 8 jobs.** All must pass.

---

## Rule 2: Admin Approval Required

No code reaches AWS production without explicit admin approval from the repository owner.

### How It Works

```
Developer push → Tests run automatically (on every push)
                      ↓
              All 35 tests pass? ─── NO → Blocked, fix errors
                      ↓ YES
              Manual deployment requested (workflow_dispatch)
                      ↓
              GitHub sends approval request to admin
                      ↓
              Admin approves? ─── NO → Deployment cancelled
                      ↓ YES
              Build Docker images → Push to ECR
                      ↓
              Deploy to ECS → Health check → Live
```

### Setup Required (one-time)

Go to the GitHub repository:

```
https://github.com/ugry/unysol/settings/environments
```

1. Click **"New environment"**
2. Name: `production`
3. Under **"Deployment protection rules"**:
   - Enable **"Required reviewers"**
   - Add yourself as reviewer: `ugry`
   - Set "Allow administrators to bypass" to **OFF** (so even you must approve)
4. Under **"Deployment branches"**:
   - Add rule: `main` (only main branch can deploy)
5. Click **"Save"**

### How to Deploy

```bash
# Option 1: Via GitHub Web UI
# Go to: https://github.com/ugry/unysol/actions/workflows/deploy.yml
# Click "Run workflow" → Enter reason → Click "Run workflow"
# → Wait for tests → Approve when prompted

# Option 2: Via CLI
gh workflow run deploy.yml \
  --repo ugry/unysol \
  --ref main \
  -f reason="Bug fix: B-SET-06 user listing fix"
```

After triggering, GitHub sends a notification. You approve or reject the deployment from:
- GitHub notification email
- GitHub Actions page: `https://github.com/ugry/unysol/actions`
- GitHub Mobile app

---

## Rule 3: No Direct AWS Changes

All AWS changes MUST go through the GitHub Actions pipeline. Direct AWS Console changes, manual `aws ecs update-service`, or direct ECR pushes are prohibited.

### Enforcement

| Vector | Status |
|--------|:---:|
| Auto-deploy on push to main | ❌ DISABLED — deploy.yml only triggers on `workflow_dispatch` |
| Direct AWS CLI deploys | ⚠️ Policy: prohibited. AWS credentials should be restricted to CI only |
| Terraform apply outside CI | ⚠️ Policy: prohibited. Infrastructure changes must go through PR review |
| Docker push outside CI | ⚠️ Policy: prohibited. ECR push credentials should be CI-only |

To fully enforce Rule 3:
1. Rotate AWS credentials so only GitHub Secrets have the active keys
2. Disable AWS Console access for deploy actions (keep read-only access)
3. Add `infra/terraform` changes to CI pipeline (separate workflow with its own approval gate)

---

## Rule 4: Deployment Audit Trail

Every deployment is logged with:
- **Who** triggered it (GitHub actor)
- **Why** (reason input)
- **Which commit** was deployed (SHA)
- **What branch** (main)
- **When** (timestamp)
- **Test results** (all 35 checks pass/fail)
- **Approval** (who approved, when)

All of this is automatically recorded in GitHub Actions run history:
```
https://github.com/ugry/unysol/actions/workflows/deploy.yml
```

---

## Emergency Override

In case of critical production incident (P0 bug, security vulnerability):

1. Go to GitHub Actions → Deploy workflow → Run workflow
2. Enter reason: `EMERGENCY: <description>`
3. Approve immediately
4. The audit trail will record the emergency deployment

The environment protection rules remain active — the admin must still approve. If the admin is unavailable and the situation is critical, a repository admin can temporarily bypass the environment protection from the GitHub UI (this action itself is audited).

---

## Summary

```
DEPLOYMENT REQUIREMENTS:
  ✅ 1. All 35 automated tests pass (test.yml, 8 jobs)
  ✅ 2. Admin approval via GitHub Environment protection
  ✅ 3. No direct AWS changes — all through CI/CD
  ✅ 4. Full audit trail (who, why, what, when)
  ✅ 5. Emergency override available (still requires approval)
```
