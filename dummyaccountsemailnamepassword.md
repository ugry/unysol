# Unysol — Dummy Test Accounts (Email, Name, Password)

> **Date:** 02 June 2026  
> **Purpose:** Pre-defined dummy company accounts for QA testing  
> **Status:** Documentation only — not yet created in database  
> **Usage:** Use these credentials to create tenants via signup API or seed script

---

## Dummy Companies & Login Credentials

All passwords: `REDACTED`

| # | Company Name | Email | Password |
|---|-------------|-------|----------|
| 1 | Asya Lojistik Ltd. Şti. | asya.lojistik@dummy.test | REDACTED |
| 2 | Birlik Nakliyat A.Ş. | birlik.nakliyat@dummy.test | REDACTED |
| 3 | Ceylan Taşımacılık | ceylan.tasimacilik@dummy.test | REDACTED |
| 4 | Deniz Yolu Transport | deniz.transport@dummy.test | REDACTED |
| 5 | Erciyes Kargo Ltd. Şti. | erciyes.kargo@dummy.test | REDACTED |
| 6 | Fırat Lojistik A.Ş. | firat.lojistik@dummy.test | REDACTED |
| 7 | Güneş Nakliyat | gunes.nakliyat@dummy.test | REDACTED |
| 8 | Hilal Taşımacılık Ltd. | hilal.tasimacilik@dummy.test | REDACTED |
| 9 | İpek Yolu Lojistik | ipek.lojistik@dummy.test | REDACTED |
| 10 | Karayel Transport A.Ş. | karayel.transport@dummy.test | REDACTED |

---

## Quick Lookup

| Company | Login |
|---------|-------|
| Asya Lojistik | `asya.lojistik@dummy.test` / `REDACTED` |
| Birlik Nakliyat | `birlik.nakliyat@dummy.test` / `REDACTED` |
| Ceylan Taşımacılık | `ceylan.tasimacilik@dummy.test` / `REDACTED` |
| Deniz Yolu Transport | `deniz.transport@dummy.test` / `REDACTED` |
| Erciyes Kargo | `erciyes.kargo@dummy.test` / `REDACTED` |
| Fırat Lojistik | `firat.lojistik@dummy.test` / `REDACTED` |
| Güneş Nakliyat | `gunes.nakliyat@dummy.test` / `REDACTED` |
| Hilal Taşımacılık | `hilal.tasimacilik@dummy.test` / `REDACTED` |
| İpek Yolu Lojistik | `ipek.lojistik@dummy.test` / `REDACTED` |
| Karayel Transport | `karayel.transport@dummy.test` / `REDACTED` |

---

## Bulk Create Script

```bash
# Create all 10 companies via signup API (caution: rate limits)
for i in asya.lojistik birlik.nakliyat ceylan.tasimacilik deniz.transport erciyes.kargo firat.lojistik gunes.nakliyat hilal.tasimacilik ipek.lojistik karayel.transport; do
  curl -s -X POST http://localhost/api/auth/signup \
    -H "Content-Type: application/json" \
    -d "{\"tenant_name\":\"${i//./ } $RANDOM\",\"email\":\"${i}@dummy.test\",\"password\":\"REDACTED\"}"
  sleep 3
done
```

```sql
-- Or create directly via QA database
DO $$
DECLARE
  rec RECORD;
  names TEXT[] := ARRAY['Asya Lojistik Ltd. Sti.','Birlik Nakliyat A.S.','Ceylan Tasimacilik','Deniz Yolu Transport','Erciyes Kargo Ltd. Sti.','Firat Lojistik A.S.','Gunes Nakliyat','Hilal Tasimacilik Ltd.','Ipek Yolu Lojistik','Karayel Transport A.S.'];
  emails TEXT[] := ARRAY['asya.lojistik@dummy.test','birlik.nakliyat@dummy.test','ceylan.tasimacilik@dummy.test','deniz.transport@dummy.test','erciyes.kargo@dummy.test','firat.lojistik@dummy.test','gunes.nakliyat@dummy.test','hilal.tasimacilik@dummy.test','ipek.lojistik@dummy.test','karayel.transport@dummy.test'];
  slugs TEXT[] := ARRAY['asya-lojistik','birlik-nakliyat','ceylan-tasimacilik','deniz-transport','erciyes-kargo','firat-lojistik','gunes-nakliyat','hilal-tasimacilik','ipek-lojistik','karayel-transport'];
  tid INTEGER;
BEGIN
  FOR i IN 1..10 LOOP
    INSERT INTO tenants (slug, firma_unvani, plan, locale, country_code, durum)
    VALUES (slugs[i], names[i], 'FREE', 'tr', 'TR', 'AKTIF') RETURNING id INTO tid;
    INSERT INTO users (tenant_id, email, password_hash, ad_soyad, rol, aktif)
    VALUES (tid, emails[i], crypt('REDACTED', gen_salt('bf', 12)), names[i] || ' Admin', 'TENANT_OWNER', TRUE);
    INSERT INTO subscriptions (tenant_id, plan, baslangic, bitis, ucret, status)
    VALUES (tid, 'FREE', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 0, 'AKTIF');
  END LOOP;
END $$;
```
