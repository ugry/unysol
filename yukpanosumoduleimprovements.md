# Unysol — Yük Panosu İyileştirme Planı

> **Date:** 27 May 2026
> **Base:** yukpanosu_policy.md (full analysis)

---

## Tamamlananlar ✅

| # | İyileştirme | Durum |
|---|------------|:---:|
| 1 | Cross-tenant marketplace (tüm kullanıcılar tüm ilanları görür) | ✅ v2.16 |
| 2 | Şehir/ilçe dropdown (81 şehir, ilçeleriyle) | ✅ v2.16 |
| 3 | İletişim bilgileri görünür (firma, email, telefon) | ✅ v2.16 |
| 4 | Tip/şehir/metin filtresi | ✅ v2.16 |
| 5 | Auto-expiry (7 gün sonra otomatik kapanır) | ✅ v2.19 |
| 6 | Gün sayacı (her ilanda "5 gün kaldı") | ✅ v2.19 |
| 7 | Günlük temizlik cron'u (süresi dolan ilanları IPAL yapar) | ✅ v2.19 |
| 8 | Sadece kendi ilanını silebilme (ownership check) | ✅ v2.19.1 |

---

## Sıradaki İyileştirmeler

### Phase 2: Engagement (Bu Hafta)

| # | İyileştirme | Efor | Etki | Durum |
|---|------------|:---:|:---:|:---:|
| 9 | **"İlgileniyorum" butonu** — ilan sahibine bildirim gönderir | 3h | 🔴 Yüksek | ⬜ |
| 10 | **WhatsApp paylaşım** — her ilan için WhatsApp'ta paylaş butonu | 1h | 🔴 Yüksek | ⬜ |
| 11 | **Gelişmiş filtreler** — fiyat aralığı, tonaj, araç tipi | 2h | 🟡 Orta | ⬜ |
| 12 | **Dashboard widget** — "Bugün X yeni yük var", "Rotanızda X ilan" | 1h | 🟡 Orta | ⬜ |

### Phase 3: Network Effect (Gelecek Hafta)

| # | İyileştirme | Efor | Etki | Durum |
|---|------------|:---:|:---:|:---:|
| 13 | **Kayıtlı arama** — "Bursa→İstanbul rotasında yeni yük var" email bildirimi | 4h | 🟡 Orta | ⬜ |
| 14 | **Eşleştirme motoru** — YUK_VAR ↔ YUK_ARA otomatik tespit | 4h | 🟡 Orta | ⬜ |
| 15 | **Favoriler / izleme listesi** | 2h | 🟢 Düşük | ⬜ |
| 16 | **Aktif ilan limiti** — FREE:3, PRO:10, PREMIUM:sınırsız | 2h | 🟢 Düşük | ⬜ |

### Phase 4: Trust & Growth

| # | İyileştirme | Efor | Etki | Durum |
|---|------------|:---:|:---:|:---:|
| 17 | **Puanlama sistemi** — işlem sonrası 5 yıldız | 6h | 🟢 Düşük | ⬜ |
| 18 | **Doğrulanmış rozet** — PRO/PREMIUM kullanıcılara özel işaret | 1h | 🟢 Düşük | ⬜ |
| 19 | **Şikayet butonu** — spam/sahte ilanları bildirme | 2h | 🟡 Orta | ⬜ |
| 20 | **Anti-spam** — aynı şehir/şehir/tarih tekrarı engelleme | 1h | 🟡 Orta | ⬜ |

---

## Metrikler

| Metrik | Şu An | 30 Gün Hedef | 90 Gün Hedef |
|---|:---:|:---:|:---:|
| Aktif ilan | 9 | 50+ | 200+ |
| Günlük yeni ilan | ~2 | 10+ | 30+ |
| Eşleşme oranı | %0 | %20 | %50 |
| Tekrar eden kullanıcı | — | %30 | %60 |
| İletişime geçme oranı | — | %15 | %25 |
