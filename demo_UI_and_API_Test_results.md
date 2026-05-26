# DEMO ENDPOINT — API Test Results

> **Date:** 26 May 2026  
> **Endpoint:** `POST /api/demo/create`  
> **API Base:** http://localhost:8080  
> **DB:** PostgreSQL (Docker: unysol-db)

## 1. TEST SUMMARY

| Total Tests | Passed | Failed | Pass Rate |
|:---:|:---:|:---:|:---:|
| 3 | 3 | 0 | 100.0% |

## 2. TEST DETAILS

| # | Action | Expected | Actual | Status |
|:---:|:---|:---|:---|:---:|
| 1 | POST /api/demo/create | `demo_created: true`, returns email/password/tenant_id | `demo_created: True, tenant_id: 12, company: "Demo Nakliyat"` | PASS |
| 2 | Credential consistency | email=demo@unysol.com, password=Demo1234! | `email: demo@unysol.com, password: Demo1234!` | PASS |
| 3 | Login with created demo account | Returns valid JWT with tenant_id matching the created tenant | `login_ok: True, tenant_id: 12` | PASS |

## 3. RAW TEST OUTPUT

```
=== DEMO CREATE ===
{
  "company": "Demo Nakliyat",
  "demo_created": true,
  "email": "demo@unysol.com",
  "message": "Demo hesap oluşturuldu. Şimdi giriş yapabilirsiniz.",
  "password": "Demo1234!",
  "success": true,
  "tenant_id": 12
}

=== DEMO LOGIN ===
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user_id": 11,
  "tenant_id": 12,
  "email": "demo@unysol.com",
  "role": "TENANT_OWNER"
}
```

## 4. API ENDPOINT DETAILS

### `POST /api/demo/create`

- **Auth:** No authentication required
- **Request Body:** `{}` (empty JSON object)
- **Rate Limit:** Not rate-limited (allows bypass for demo creation)

### Response Fields

| Field | Type | Description |
|:---|:---|:---|
| `demo_created` | bool | Always `true` on success |
| `success` | bool | Always `true` on success |
| `email` | string | Always `demo@unysol.com` |
| `password` | string | Always `Demo1234!` |
| `tenant_id` | int | Auto-incremented unique tenant ID |
| `company` | string | Always `Demo Nakliyat` |
| `message` | string | Turkish success message |

### Behavior

- Creates a new tenant with plan=FREE, company="Demo Nakliyat"
- Creates a user with email=demo@unysol.com, password=Demo1234!, role=TENANT_OWNER
- Each call creates a NEW tenant (tenant_id increments by 1)
- Email and password are always the same — all demo accounts share credentials
- New tenant starts with no trips, no trucks, no customers, no data

## 5. DATABASE VERIFICATION

After demo creation, the following records exist:

```sql
-- tenants table
SELECT id, company, plan FROM tenants WHERE id = <tenant_id>;
-- id=<tenant_id>, company='Demo Nakliyat', plan='FREE'

-- users table
SELECT id, email, role, tenant_id FROM users WHERE tenant_id = <tenant_id>;
-- id=<user_id>, email='demo@unysol.com', role='TENANT_OWNER'

-- subscriptions table
SELECT plan, status FROM subscriptions WHERE tenant_id = <tenant_id>;
-- plan='FREE', status='active'
```

## 6. NOTES

- Demo endpoint is **not rate-limited** (unlike `/api/auth/login` which has 10 req/min)
- The `message` field content is in Turkish: "Demo hesap oluşturuldu. Şimdi giriş yapabilirsiniz."
- Demo accounts are on the **FREE plan** with plan limits (1 truck, 3 users)
- No cleanup/cron mechanism for stale demo accounts observed
