# Unysol — Stripe Payment Integration TODO

> **Status:** Backend deployed, waiting for Stripe Dashboard configuration
> **Environment:** Test mode (`sk_test_...`, `pk_test_...`)

---

## 1. Stripe Dashboard — Products Oluşturma

### 1.1 Git: [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)

İki ürün oluşturun:

| Product | Price | Interval | Price ID (sonra buraya yaz) |
|---------|-------|----------|------------------------------|
| **PRO Aylık** | 200 TL | monthly | `price_xxxxxxxxxxxxx` |
| **PRO Yıllık** | 2.000 TL | yearly | `price_xxxxxxxxxxxxx` |

Her ürün oluşturulduktan sonra Price ID'yi kopyalayın (`price_...` formatında).

---

## 2. Admin Panel — Price ID'leri Girme

1. `https://unysolar.com/admin` adresine gidin
2. Giriş: `ugur.yardimci@unygms.com` / `1Tq|zl>L`
3. **Sistem Ayarları** sekmesine tıklayın
4. Aşağı kaydırın → **Stripe Ödeme Ayarları** bölümü
5. **Price ID (Aylık)** → PRO Aylık Price ID'sini yapıştırın
6. **Price ID (Yıllık)** → PRO Yıllık Price ID'sini yapıştırın
7. **Kaydet** butonuna tıklayın

---

## 3. Stripe Dashboard — Webhook

### 3.1 Git: [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)

1. **Add endpoint** butonuna tıklayın
2. **Endpoint URL:** `https://unysolar.com/api/stripe/webhook`
3. **Events to send:** Aşağıdakileri seçin:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. **Add endpoint** butonuna tıklayın
5. **Signing secret** (`whsec_...`) — şimdilik gerek yok, sonra ekleriz

---

## 4. Test Etme

Her şey yapılandırıldıktan sonra:

1. `https://unysolar.com/dashboard/settings` adresine gidin
2. "PRO'ya Yükselt" butonu görünecek (şu an eklenmedi, Price ID'ler girildikten sonra eklenecek)
3. Test kartı kullanın: `4242 4242 4242 4242` / herhangi bir gelecek tarih / herhangi bir CVC
4. Başarılı ödeme sonrası abonelik otomatik aktifleşir

---

## 5. Canlıya Geçiş (Production)

Canlı ortama geçmek için:

| Değişiklik | Nerede |
|------------|--------|
| `sk_test_...` → `sk_live_...` | Sunucu `.env` ve Stripe Dashboard |
| `pk_test_...` → `pk_live_...` | Admin panel Sistem Ayarları |
| Webhook URL | Aynı kalır (`https://unysolar.com/api/stripe/webhook`) |
| Live Products | Stripe Dashboard'da yeni Products oluşturun (live mode) |
| Live Price IDs | Admin panelde güncelleyin |

---

## Mevcut Anahtarlar (Test)

| Key | Value |
|-----|-------|
| Publishable | `REDACTED` |
| Secret | `REDACTED` |
| Webhook URL | `https://unysolar.com/api/stripe/webhook` |
