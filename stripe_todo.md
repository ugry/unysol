# Unysol — Stripe Payment Integration

> **Status:** ✅ Configured and working (test mode)
> **Environment:** Test mode (`sk_test_...`, `pk_test_...`)
> **PRO Monthly:** `price_1TeBY6KWLIMlTHZnLitJ9nqz` (200 TL/ay)
> **PRO Yearly:** `price_1TeBYGKWLIMlTHZnOP2sgrEL` (2000 TL/yıl)

---

## Test Cards (No Real Money)

| Card Number | Expiry | CVC | Result |
|-------------|--------|-----|--------|
| `4242 4242 4242 4242` | Any future | Any | ✅ Payment succeeds |
| `4000 0000 0000 0002` | Any future | Any | ❌ Declined |
| `4000 0025 0000 3155` | Any future | Any | 🔐 3D Secure required |
| `4000 0000 0000 3220` | Any future | Any | 🔐 3D Secure (all auth attempts) |

> All fields accept any values: name, address, postal code. Only card number matters.

---

## Where to Test

1. Go to `https://unysolar.com/dashboard/billing`
2. Click **"PRO'ya Yükselt"** → Stripe Checkout opens
3. Enter test card `4242 4242 4242 4242` + any future date + any CVC
4. After payment, verify in [Stripe Dashboard → Payments](https://dashboard.stripe.com/test/payments)

---

## Price IDs

| Product | Price | Price ID |
|---------|-------|----------|
| PRO Aylık | 200 TL/month | `price_1TeBY6KWLIMlTHZnLitJ9nqz` |
| PRO Yıllık | 2,000 TL/year | `price_1TeBYGKWLIMlTHZnOP2sgrEL` |

---

## Webhook

| Detail | Value |
|--------|-------|
| URL | `https://unysolar.com/api/stripe/webhook` |
| Events | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` |

---

## Canlıya Geçiş (Production)

| Change | Where |
|--------|-------|
| `sk_test_...` → `sk_live_...` | `email_config.stripe_secret_key` via admin API |
| `pk_test_...` → `pk_live_...` | `email_config.stripe_pub_key` via admin API |
| Live Products | Stripe Dashboard'da yeni Products oluşturun (live mode) |
| Live Price IDs | Admin panelden güncelleyin |
