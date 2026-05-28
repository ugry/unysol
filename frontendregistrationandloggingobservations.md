# Frontend Registration & API Logging Observations

## QA Test Date: 2026-05-28  
## Environment: AWS eu-central-1 (ECS Fargate + RDS + ElastiCache)

---

## CRITICAL - Fixed

### 1. Mixed Content: Frontend uses HTTP API from HTTPS page [FIXED]
**Severity**: CRITICAL  
**Root Cause**: Frontend built with `VITE_API_URL=http://unysol-alb-....elb.amazonaws.com` (plain HTTP). Browsers block HTTP requests from HTTPS pages per Mixed Content policy.  
**Impact**: Registration completely broken in browser. API calls silently fail.  
**Fix**: Rebuilt frontend with `VITE_API_URL=https://unysolar.com`.  
**Status**: ✅ RESOLVED  

---

## HIGH - Needs Action

### 2. SES SMTP Email Not Working
**Severity**: HIGH  
**Issue**: SES SMTP credentials (`email-smtp.eu-central-1.amazonaws.com:465`) return "535 Authentication Credentials Invalid" after hours of propagation.  
**Impact**: Verification emails never sent. Users can't complete signup.  
**Status**: 🔴 OPEN  
**Possible Fix**: Regenerate SMTP credentials through AWS Console or use SES API directly instead of SMTP.

### 3. Missing Legal Pages
**Severity**: HIGH  
**Issue**: Footer links for KVKK, Terms of Service, Privacy Policy, Cookie Policy all redirect to homepage (`/`).  
**Impact**: Legal compliance issue for Turkish regulations (KVKK mandatory).  
**Status**: 🔴 OPEN  
**Affected URLs**: `/kvkk`, `/kullanim-kosullari`, `/gizlilik-politikasi`, `/cerez-politikasi`  

---

## MEDIUM - Should Fix

### 4. Google Analytics ID Placeholder
**Severity**: MEDIUM  
**Issue**: `<script src="googletagmanager.com/gtag/js?id=G-XXXXXXXXXX">` — placeholder ID.  
**Impact**: Analytics data not being collected.  
**Status**: 🔴 OPEN  

### 5. Dead Footer Links
**Severity**: MEDIUM  
**Issue**: Documentation and API Reference links go to `/` only. No actual documentation pages.  
**Status**: 🔴 OPEN  

### 6. Contact Form Silent Failure
**Severity**: MEDIUM  
**Issue**: Contact form submits via HTTP API (same Mixed Content issue). No success/error toast shown to user. Page appears to reset silently.  
**Status**: ✅ RESOLVED (same fix as #1)

### 7. Missing email_verification_tokens table [FIXED]
**Severity**: MEDIUM  
**Issue**: The `email_verification_tokens` table didn't exist in schema. Signup silently failed at the INSERT step (errors ignored with `_, _`).  
**Fix**: Created table in migration 007.  
**Status**: ✅ RESOLVED  

---

## LOW - Cosmetic

### 8. /admin/login shows wrong content
**Severity**: LOW  
**Issue**: Navigating to `/admin/login` shows the Yardım/Help page content instead of admin login.  
**Status**: 🔴 OPEN  

### 9. No dedicated signup route
**Severity**: LOW  
**Issue**: All signup CTAs go to `/login` page. `/signup`, `/register`, `/kayit` all redirect to `/`.  
**Status**: 🔴 OPEN  

---

## API Endpoint Status (Full Test)

All 37 core API endpoints tested — 33 return 200/201, 4 are route groups (expected 404 for base path). Details:

| Category | Working | Route Groups | Total |
|----------|---------|-------------|-------|
| Public | 11 | 0 | 11 |
| Tenant | 17 | 3 | 20 |
| Admin | 11 | 0 | 11 |

---

## CI/CD Pipeline Status

### Current State
- `deploy.yml`: Uses old VPS/SSH rsync method — needs AWS update
- `test.yml`: 8 CI jobs working, local-only

### Required Changes for AWS
1. Replace SSH rsync deploy with ECR build+push + ECS update
2. Add AWS credentials as GitHub Secrets
3. Make deploy depend on test workflow success
4. Move terraform.tfvars secrets to GitHub Secrets

---

## Database Migration Summary

| Migration | Status | Purpose |
|-----------|--------|---------|
| 001_init.sql | ✅ | Core tables (wrong schema, overwritten) |
| 002_email_config.sql | ✅ | Email configuration table |
| 003_fix_schema.sql | ✅ | Drop wrong tables, recreate tenants/users/subscriptions |
| 004_activate_test_user.sql | ✅ | Activate test user |
| 005_full_schema.sql | ✅ | Full production schema (33 tables) |
| 006_add_missing_columns.sql | ✅ | Adds columns code expects but schema lacks |
| 007_activate_qa_user.sql | ✅ | Creates email_verification_tokens + activates users |
