# Unysol — Dual Browser Registration Test

> **Date:** 26 May 2026
> **URL:** https://unysolar.com
> **Test Type:** Headless browser registration (Puppeteer + Playwright)
> **Resolutions:** Desktop 1366×768 · Mobile 375×812

---

## 1. Playwright Results

| Resolution | Page Load | Toggle Signup | Fill Form | Submit | Result |
|:---|:---:|:---:|:---:|:---:|:---|
| Desktop 1366×768 | ✅ | ✅ | ✅ | ✅ | ✅ Dashboard loaded |
| Mobile 375×812 | ✅ | ✅ | ✅ | ✅ | ✅ Dashboard loaded |

**Verdict:** 8/8 PASS

### Details
- Login page loads with "Giriş Yap" and "Hesap Oluştur" toggle
- Toggle switches to signup form: "Firma Ünvanı", "E-posta", "Şifre", "Telefon"
- Form accepts text input on all fields
- Submit button visible and clickable
- After 4s wait, browser redirects to `/dashboard` with sidebar navigation

---

## 2. Puppeteer Results

| Resolution | Page Load | Toggle Signup | Fill Form | Submit | Result |
|:---|:---:|:---:|:---:|:---:|:---|
| Desktop 1366×768 | ✅ | ✅ | ✅ | ✅ | ✅ Dashboard loaded, sidebar visible |
| Mobile 375×812 | ✅ | ✅ | ✅ | ✅ | ✅ Dashboard loaded, sidebar visible |

**Verdict:** 10/10 PASS

### Details
- Standard CSS selectors used (no Playwright-specific `:has-text()`)
- `button[type="submit"]` correctly identified and clicked
- Mobile viewport (375px) shows full signup form without horizontal scroll
- Dashboard includes sidebar with "Kamyonlar" navigation item

---

## 3. Bug Found During Testing

| # | Bug | Severity | Detail |
|---|-----|:---:|--------|
| 1 | **Double `/api` prefix** | 🔴 CRITICAL | `baseURL: '/api'` caused `/api/api/auth/signup` → 404. Fixed by changing `baseURL` to empty string with `??` operator |
| 2 | **`localhost:8080` fallback** | 🔴 CRITICAL | `VITE_API_URL \|\| 'http://localhost:8080'` treated empty string as falsy. Fixed with `?? ''` instead of `\|\|` |

### Root Cause
```ts
// BEFORE (broken):
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080'
// Empty string is falsy → falls through to localhost → CORS error or wrong URL

// AFTER (fixed):
baseURL: import.meta.env.VITE_API_URL ?? ''
// null/undefined → '' (relative URLs), explicit value → uses that
```

---

## 4. Resolution Screenshot Summary

| Viewport | Rendering |
|:---|:---|
| 1366×768 desktop | Full sidebar, form centered, all labels visible |
| 375×812 mobile | Form fits viewport, no horizontal overflow, fields stack vertically |

---

## 5. Final Verdict

| Browser | Tests | Pass | Fail |
|:---|:---:|:---:|:---:|
| **Playwright** (Chromium) | 8 | 8 | 0 |
| **Puppeteer** (Chromium) | 10 | 10 | 0 |
| **TOTAL** | **18** | **18** | **0** |

**Registration flow works correctly on both desktop and mobile in headless Chromium browsers. Users can navigate to the login page, toggle to signup, fill the form, submit, and be redirected to the dashboard.**
