# Unysol — May 28, 2026 Milestone

> **Previous Session:** May 26-27 (v2.28 → v2.34, 102 commits)
> **Today:** AWS Full Migration + CI/CD + SES API Integration

---

## 🏗️ Today's Achievements

### AWS Infrastructure (Terraform → ECS Fargate)

| Resource | Detail |
|----------|--------|
| **VPC** | 10.0.0.0/16, 2 public + 2 private subnets, IGW |
| **ECS Cluster** | `unysol-cluster`, Fargate 256 CPU / 512MB |
| **RDS PostgreSQL** | 16.6, db.t4g.micro, 20GB gp3, single-AZ |
| **ElastiCache Redis** | 7.1, cache.t3.micro, single node |
| **ALB** | HTTPS with ACM SSL, HTTP→HTTPS redirect |
| **Route 53** | `unysolar.com` hosted zone, A records |
| **ACM** | wildcard `*.unysolar.com` SSL certificate |
| **ECR** | `unysol/backend` + `unysol/frontend`, lifecycle policy (keep 5) |

### Production URLs

| Service | URL |
|---------|-----|
| App | https://unysolar.com |
| ALB | `unysol-alb-49936525.eu-central-1.elb.amazonaws.com` |
| RDS | `unysol-db.chqw4y2kqk8b.eu-central-1.rds.amazonaws.com:5432` |
| Redis | `unysol-redis.lovyqw.0001.euc1.cache.amazonaws.com` |
| ECR Backend | `326804802908.dkr.ecr.eu-central-1.amazonaws.com/unysol/backend` |
| ECR Frontend | `326804802908.dkr.ecr.eu-central-1.amazonaws.com/unysol/frontend` |

### Domain

| Detail | Value |
|--------|-------|
| Domain | `unysolar.com` |
| Previous Registrar | Ultahost |
| Nameservers | ns-468.awsdns-58.com, ns-842.awsdns-41.net, ns-1307.awsdns-35.org, ns-1554.awsdns-02.co.uk |
| AWS Account ID | `326804802908` |
| Region | `eu-central-1` |

---

## 🔐 SES Email Service

### Configuration

| Setting | Value |
|---------|-------|
| **Method** | `ses` (AWS SDK API) |
| **Sender** | `registration@unysolar.com` |
| **Region** | `eu-central-1` |
| **Domain verified** | `unysolar.com` (DKIM + SPF configured) |
| **Production access** | 🟡 Requested — awaiting AWS approval (24h) |
| **Production request URL** | https://console.aws.amazon.com/ses/home?region=eu-central-1#/account-review |
| **AWS account** | Root account `326804802908` — request submitted via console |
| **Verified recipients** | `ugur.yardimci@unygms.com`, `uguryardimci82@gmail.com` |

### SMTP Credentials (alternative method, not in use)

| Field | Value |
|-------|-------|
| Host | `email-smtp.eu-central-1.amazonaws.com` |
| Port | `465` |
| Username | `AKIAUYFYVRVOICWVJTE7` |
| Password | `AmGi8BKMQ+VGxKdk5SanFptmZ/IW9gj3qKhcSHSMMIDr` |

SMTP credentials are not currently used — SES API via IAM role is active and working.

### Production Access Request

Submitted via AWS Console on May 28, 2026. Request text:

> We use SES to send transactional emails (account verification, password resets, notifications) to our users who register on our platform (unysolar.com). Domain verified with DKIM + SPF. Sender: registration@unysolar.com. No marketing/bulk email. ~50-200 emails/day. Bounce/complaint handling via SES notifications.

---

### Implementation

- **New file**: `internal/email/ses.go` — AWS SDK v2 SES sender
- **Updated**: `internal/email/smtp.go` — supports `Method` field (`smtp` or `ses`)
- **Updated**: `internal/handlers/email.go` — added `email_method` and `aws_region` fields
- **Updated**: `cmd/server/main.go` — loadEmailConfig reads method/region
- **Migration**: `008_email_method.sql` — adds `email_method` and `aws_region` columns
- **IAM**: ECS task role has `ses:SendEmail` + `ses:SendRawEmail`
- **Go version**: Upgraded to 1.24 (for AWS SDK)
- **Deps**: Added `github.com/aws/aws-sdk-go-v2/*`

---

## 📊 Database Migrations Added

| Migration | Purpose |
|-----------|---------|
| 002_email_config.sql | Email configuration table |
| 003_fix_schema.sql | Fix tenants/users schema (UUID→SERIAL, English→Turkish columns) |
| 004_activate_test_user.sql | Activate test users |
| 005_full_schema.sql | Full 33-table production schema from 01-schema.sql |
| 006_add_missing_columns.sql | Add columns code expects: payment_method, kategori, risk_skoru, etc. |
| 007_activate_qa_user.sql | Create email_verification_tokens table |
| 008_email_method.sql | Add email_method + aws_region to email_config |

---

## 🔧 CI/CD Pipeline

### GitHub Actions

| Workflow | File | Status |
|----------|------|--------|
| Test (8 jobs) | `test.yml` (373 lines) | Unchanged |
| Deploy | `deploy.yml` | **Rewritten for AWS** |
| Old deploy backup | `deploy.yml.vps-backup` | Archived |

### New Deploy Pipeline

```yaml
# On push to main:
1. Checkout code
2. Configure AWS credentials (from GitHub Secrets)
3. Login to ECR
4. Build + push backend Docker image (sha- tagged)
5. Build + push frontend Docker image (VITE_API_URL=https://unysolar.com)
6. Deploy backend to ECS (force new deployment)
7. Deploy frontend to ECS (force new deployment)
8. Wait for services stable
9. Verify health checks
```

### GitHub Secrets

| Secret | Set |
|--------|-----|
| `AWS_ACCESS_KEY_ID` | ✅ |
| `AWS_SECRET_ACCESS_KEY` | ✅ |
| `SSH_PRIVATE_KEY` (old VPS) | ❌ Removed |
| `SSH_HOST` (old VPS) | ❌ Removed |
| `SSH_USER` (old VPS) | ❌ Removed |

---

## 🐛 Bugs Fixed Today

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Registration "Network Error" | Frontend used `http://` API URL from HTTPS page (Mixed Content) | Rebuilt with `VITE_API_URL=https://unysolar.com` |
| email_verification_tokens missing | Table not in any migration | Created in migration 007 |
| customers 500 | Missing columns (fatura_adresi, kategori, risk_skoru, etc.) | Added in migration 006 |
| trips 500 | Missing columns (customer_id, payment_method, invoice_id) | Added in migration 006 |
| load-board 500 | Missing columns (from_district, to_district) | Added in migration 006 |
| demo/create 500 | tenants table lacked locale, country_code, durum columns | Fixed by full schema migration 005 |
| customers durum BOOLEAN vs VARCHAR | Schema mismatch — code expects "AKTIF"/"PASIF" strings | ALTER COLUMN TYPE to VARCHAR(20) |
| Frontend Dockerfile vite preview | Vite 8.x blocks non-localhost hosts | Switched to `serve@14` |
| Backend Dockerfile missing migrations | Migrations dir not copied to runtime image | Added COPY for migrations |
| Footer dead links | KVKK/Terms/Privacy linked to homepage | Created pages + added routes |

---

## 📄 New Frontend Pages

| Route | Page | File |
|-------|------|------|
| `/kvkk` | KVKK Aydınlatma Metni | `KvkkPage.tsx` |
| `/kullanim-kosullari` | Kullanım Koşulları | `TermsPage.tsx` |
| `/gizlilik-politikasi` | Gizlilik Politikası | `PrivacyPage.tsx` |
| `/cerez-politikasi` | Çerez Politikası (→ PrivacyPage) | `PrivacyPage.tsx` |

---

## 🧪 API Endpoint Status

| Category | Total | Working | Status |
|----------|-------|---------|--------|
| Public | 11 | 11 | ✅ |
| Tenant (authenticated) | 20 | 17 (3 route groups) | ✅ |
| Admin | 11 | 11 | ✅ |
| **Total** | **42** | **39** | ✅ |

---

## 🧪 QA Testing Results

| Test | Result |
|------|--------|
| Browser homepage render | ✅ Passed |
| Browser login page | ✅ Passed |
| Browser registration form | ✅ Passed |
| Browser registration submit | ✅ Passed (shows "E-postanızı Kontrol Edin") |
| Browser console errors | ✅ None |
| API health check | ✅ `{"db":"connected","status":"healthy"}` |
| Frontend JS bundle | ✅ 1.7MB, loads via HTTPS |
| Frontend CSS | ✅ 40KB |
| Mixed Content (HTTP from HTTPS) | ✅ Fixed |

---

## 🖥️ Test Accounts Created

| Email | Password | Tenant | Role |
|-------|----------|--------|------|
| `test@test.com` | `REDACTED` | Test Firma | TENANT_OWNER |
| `qa@test.com` | `Qatest2026!` | QA Test Firmasi | TENANT_OWNER |
| `finalqa@test.com` | `QAtest2026!` | Final QA Test | TENANT_OWNER |
| `test@unygms.com` | `QAtest2026!` | Hostinger Test | TENANT_OWNER |
| `ugur.yardimci@unygms.com` | `Ugur2026!A` | Ugur Test | TENANT_OWNER |

---

## 🚀 Deploy Commands (AWS)

```bash
# Full deploy via script
./infra/scripts/deploy.sh

# Manual deploy
docker build -t 326804802908.dkr.ecr.eu-central-1.amazonaws.com/unysol/backend:latest ./backend
docker push 326804802908.dkr.ecr.eu-central-1.amazonaws.com/unysol/backend:latest
aws ecs update-service --cluster unysol-cluster --service unysol-backend --force-new-deployment

docker build --build-arg VITE_API_URL=https://unysolar.com -t 326804802908.dkr.ecr.eu-central-1.amazonaws.com/unysol/frontend:latest ./frontend
docker push 326804802908.dkr.ecr.eu-central-1.amazonaws.com/unysol/frontend:latest
aws ecs update-service --cluster unysol-cluster --service unysol-frontend --force-new-deployment
```

---

## 📁 Files Created/Modified

```
Modified:
  .github/workflows/deploy.yml        → AWS ECS deploy pipeline
  backend/Dockerfile                  → Go 1.24, includes migrations
  frontend/Dockerfile                 → serve@14, build arg
  frontend/index.html                 → GA placeholder commented out
  frontend/src/App.tsx                → Legal page routes
  frontend/src/pages/LandingPage.tsx  → Fixed footer links
  backend/go.mod                      → AWS SDK v2 deps, Go 1.24
  backend/internal/email/smtp.go      → Method selection (smtp/ses)
  backend/internal/handlers/email.go  → email_method + aws_region
  backend/cmd/server/main.go          → loadEmailConfig updated
  infra/terraform/iam.tf              → ses:SendEmail permission

Created:
  backend/internal/email/ses.go       → AWS SDK SES sender
  backend/internal/database/migrations/002-008.sql
  frontend/src/pages/{Kvkk,Terms,Privacy}Page.tsx
  infra/terraform/*.tf                → Full AWS infrastructure
  infra/scripts/*.sh                  → Deploy + setup scripts
  .github/workflows/deploy.yml.vps-backup
  frontendregistrationandloggingobservations.md
```

---

## ⚠️ Remaining Tasks

| Priority | Task |
|----------|------|
| ✅ | SES production access — requested via AWS Console, pending approval |
| 🟡 | Verify `test@unygms.com` in SES (optional once production access approved) |
| 🟠 | Stripe Price IDs — create in Dashboard |
| 🟠 | Admin audit log |
| 🟠 | Load board match notification |
| 🟡 | Password reset flow |
| 🟡 | Reports module |
| 🟢 | Database backup automation |
| 🟢 | Terraform.tfvars secrets → AWS Secrets Manager |
