-- ============================================================
-- Unysol — 3 Realistic Tenant Seed Data (May-June 2026)
-- ============================================================
> **Date:** 26 May 2026
> **Purpose:** Create 3 real-world Turkish logistics companies with full data
> **Scope:** 5 entries per module per tenant, May-June 2026 timeframe
> **Total:** 3 tenants · 15 trucks · 15 customers · 15 trips · 15 invoices · 15 expenses · 15 employees · 15 fuel logs · 15 maintenance · 15 insurance · 15 tolls · 15 cek/senet · 15 notifications

## TENANT 1: Çelik Nakliyat Ltd. Şti.

| Field | Value |
|-------|-------|
| **Company** | Çelik Nakliyat Ltd. Şti. |
| **Slug** | celik-nakliyat |
| **Plan** | PRO |
| **Login Email** | celik@lojistik.com |
| **Password** | REDACTED |
| **User** | Mustafa Çelik (TENANT_OWNER) |

### Trucks (Filo)
| Plaka | Marka | Model | Yıl | Yakıt | Takip | Muayene |
|-------|-------|-------|-----|-------|-------|---------|
| 34 CEL 001 | BMC | Pro 1144 | 2022 | DIZEL | GPS | 2026-11-15 |
| 34 CEL 002 | Mercedes | Axor 3340 | 2021 | DIZEL | MANUEL | 2026-08-20 |
| 34 CEL 003 | Ford | Cargo 1842 | 2023 | DIZEL | GPS | 2026-12-01 |
| 34 CEL 004 | Scania | G450 | 2022 | DIZEL | GPS | 2026-09-10 |
| 34 CEL 005 | Volvo | FM 430 | 2024 | DIZEL | MANUEL | 2027-03-25 |

### Customers (Müşteri)
| Firma | Yetkili | Şehir | Sektör |
|-------|---------|-------|--------|
| Kalyon İnşaat A.Ş. | Ahmet Yılmaz | İstanbul | İnşaat |
| Limak İnşaat | Mehmet Kaya | Ankara | İnşaat |
| Demir Çelik A.Ş. | Ayşe Demir | İskenderun | Demir-Çelik |
| Cengiz İnşaat | Ali Özdemir | İstanbul | İnşaat |
| Ege Seramik A.Ş. | Zeynep Çalık | İzmir | Seramik |

### Trips (Seferler) — May-June 2026
| Tarih | Kamyon | Müşteri | Güzergah | Ücret | Durum |
|-------|--------|---------|----------|-------|-------|
| 2026-05-05 | 34 CEL 001 | Kalyon İnşaat | İstanbul → Ankara (İnşaat Malzemesi) | 22000 | TAMAMLANDI |
| 2026-05-12 | 34 CEL 002 | Limak İnşaat | Ankara → İzmir (Çelik Konstrüksiyon) | 28000 | TAMAMLANDI |
| 2026-05-20 | 34 CEL 003 | Demir Çelik | İskenderun → İstanbul (İnşaat Demiri) | 32000 | TAMAMLANDI |
| 2026-06-02 | 34 CEL 004 | Cengiz İnşaat | İstanbul → Bursa (Hazır Beton) | 18000 | TAMAMLANDI |
| 2026-06-10 | 34 CEL 005 | Ege Seramik | İzmir → İstanbul (Seramik) | 25000 | AKTIF |

### Invoices (Faturalar)
| Fatura No | Müşteri | Tarih | Tutar | KDV | Genel Toplam | Durum |
|-----------|---------|-------|-------|-----|-------------|-------|
| CLK-2026-001 | Kalyon İnşaat | 2026-05-06 | 22000 | 4400 | 26400 | odendi |
| CLK-2026-002 | Limak İnşaat | 2026-05-13 | 28000 | 5600 | 33600 | odendi |
| CLK-2026-003 | Demir Çelik | 2026-05-21 | 32000 | 6400 | 38400 | odendi |
| CLK-2026-004 | Cengiz İnşaat | 2026-06-03 | 18000 | 3600 | 21600 | gonderildi |
| CLK-2026-005 | Ege Seramik | 2026-06-11 | 25000 | 5000 | 30000 | taslak |

### Expenses (Giderler)
| Tarih | Kategori | Tutar | Açıklama |
|-------|----------|-------|----------|
| 2026-05-03 | YAKIT | 4800 | Shell Mahmutbey — 34 CEL 001 mazot |
| 2026-05-10 | BAKIM | 12000 | Periyodik bakım — 34 CEL 002 (yağ, filtre, fren) |
| 2026-05-18 | LASTIK | 28000 | 6 adet lastik — 34 CEL 003 |
| 2026-06-01 | YAKIT | 5200 | Petrol Ofisi İstanbul — 34 CEL 004 mazot |
| 2026-06-08 | KOPRU_OTOYOL | 1850 | Osmangazi Köprüsü + O-4 geçiş |

### Employees (Personel)
| Ad Soyad | Rol | Telefon | Ehliyet Bitiş | SRC Bitiş |
|----------|-----|---------|---------------|-----------|
| Mustafa Çelik | TENANT_OWNER | 05321110001 | — | — |
| İsmail Demir | SOFOR | 05321110002 | 2027-09-15 | 2026-12-31 |
| Hüseyin Yıldız | SOFOR | 05321110003 | 2028-03-20 | 2027-06-30 |
| Osman Şahin | SOFOR | 05321110004 | 2026-11-10 | 2026-08-15 |
| Kemal Aslan | SEF | 05321110005 | — | — |

---

## TENANT 2: Anadolu Lojistik A.Ş.

| Field | Value |
|-------|-------|
| **Company** | Anadolu Lojistik A.Ş. |
| **Slug** | anadolu-lojistik |
| **Plan** | PRO |
| **Login Email** | anadolu@lojistik.com |
| **Password** | REDACTED |
| **User** | Ali Rıza Aydın (TENANT_OWNER) |

### Trucks
| Plaka | Marka | Model | Yıl | Yakıt | Takip |
|-------|-------|-------|-----|-------|-------|
| 06 ANA 001 | Mercedes | Actros 1845 | 2024 | DIZEL | GPS |
| 06 ANA 002 | Volvo | FH 500 | 2023 | DIZEL | GPS |
| 06 ANA 003 | MAN | TGX 18.510 | 2022 | DIZEL | MANUEL |
| 06 ANA 004 | Scania | R500 | 2024 | DIZEL | GPS |
| 06 ANA 005 | Ford | F-Max | 2023 | DIZEL | MANUEL |

### Customers
| Firma | Yetkili | Şehir | Sektör |
|-------|---------|-------|--------|
| Arçelik A.Ş. | Fatma Yılmaz | İstanbul | Beyaz Eşya |
| Vestel A.Ş. | Caner Öztürk | Manisa | Elektronik |
| Tofaş A.Ş. | Murat Çelik | Bursa | Otomotiv |
| Pınar Süt | Deniz Kaya | İzmir | Gıda |
| Şişecam A.Ş. | Burcu Aydın | Kocaeli | Cam |

### Trips
| Tarih | Kamyon | Müşteri | Güzergah | Ücret | Durum |
|-------|--------|---------|----------|-------|-------|
| 2026-05-08 | 06 ANA 001 | Arçelik | İstanbul → Ankara (Beyaz Eşya) | 24000 | TAMAMLANDI |
| 2026-05-15 | 06 ANA 002 | Vestel | Manisa → İstanbul (TV Nakliye) | 26000 | TAMAMLANDI |
| 2026-05-25 | 06 ANA 003 | Tofaş | Bursa → Ankara (Otomotiv Parça) | 20000 | TAMAMLANDI |
| 2026-06-03 | 06 ANA 004 | Pınar Süt | İzmir → İstanbul (Soğuk Zincir) | 32000 | TAMAMLANDI |
| 2026-06-12 | 06 ANA 005 | Şişecam | Kocaeli → İzmir (Cam Ürünleri) | 28000 | AKTIF |

### Invoices
| Fatura No | Müşteri | Tarih | Tutar | Genel Toplam | Durum |
|-----------|---------|-------|-------|-------------|-------|
| AND-2026-001 | Arçelik | 2026-05-09 | 24000 | 28800 | odendi |
| AND-2026-002 | Vestel | 2026-05-16 | 26000 | 31200 | odendi |
| AND-2026-003 | Tofaş | 2026-05-26 | 20000 | 24000 | odendi |
| AND-2026-004 | Pınar Süt | 2026-06-04 | 32000 | 38400 | gonderildi |
| AND-2026-005 | Şişecam | 2026-06-13 | 28000 | 33600 | taslak |

### Expenses
| Tarih | Kategori | Tutar | Açıklama |
|-------|----------|-------|----------|
| 2026-05-06 | YAKIT | 5500 | BP Ankara — 06 ANA 001 mazot |
| 2026-05-14 | SIGORTA | 32000 | Filo kasko yenileme — 06 ANA 002-003 |
| 2026-05-22 | BAKIM | 9500 | Periyodik bakım — 06 ANA 004 |
| 2026-06-02 | MTV | 9800 | MTV 2026 2. taksit — tüm kamyonlar |
| 2026-06-10 | MAAS | 95000 | Mayıs 2026 personel maaşları |

### Employees
| Ad Soyad | Rol | Telefon |
|----------|-----|---------|
| Ali Rıza Aydın | TENANT_OWNER | 05322220001 |
| Mehmet Koç | SOFOR | 05322220002 |
| Hasan Polat | SOFOR | 05322220003 |
| Ayşe Yılmaz | MUHASEBE | 05322220004 |
| Fatih Kaya | OPERASYON | 05322220005 |

---

## TENANT 3: Ege Transport

| Field | Value |
|-------|-------|
| **Company** | Ege Transport |
| **Slug** | ege-transport |
| **Plan** | FREE |
| **Login Email** | ege@lojistik.com |
| **Password** | REDACTED |
| **User** | Mehmet Ege (TENANT_OWNER) |

### Trucks
| Plaka | Marka | Model | Yıl | Yakıt | Takip |
|-------|-------|-------|-----|-------|-------|
| 35 EGE 001 | Ford | Cargo 1842 | 2023 | DIZEL | MANUEL |
| 35 EGE 002 | BMC | Tugra | 2024 | DIZEL | GPS |
| 35 EGE 003 | Mercedes | Axor 1840 | 2020 | DIZEL | MANUEL |
| 35 EGE 004 | Volvo | FM 430 | 2024 | DIZEL | GPS |
| 35 EGE 005 | Scania | G410 | 2022 | DIZEL | MANUEL |

### Customers
| Firma | Yetkili | Şehir | Sektör |
|-------|---------|-------|--------|
| Tariş Zeytinyağı | Hasan Efe | Aydın | Gıda |
| Pınar Et | Caner Yıldız | İzmir | Gıda |
| Keskinoğlu | Ali Keskin | Manisa | Gıda |
| Ege Seracılık | Mustafa Çiçek | Antalya | Tarım |
| Uludağ İçecek | Ahmet Dağ | Bursa | İçecek |

### Trips
| Tarih | Kamyon | Müşteri | Güzergah | Ücret | Durum |
|-------|--------|---------|----------|-------|-------|
| 2026-05-10 | 35 EGE 001 | Tariş | Aydın → İzmir (Zeytinyağı) | 12000 | TAMAMLANDI |
| 2026-05-18 | 35 EGE 002 | Pınar Et | İzmir → İstanbul (Et Ürünleri) | 18000 | TAMAMLANDI |
| 2026-05-28 | 35 EGE 003 | Keskinoğlu | Manisa → Ankara (Yumurta) | 14000 | TAMAMLANDI |
| 2026-06-05 | 35 EGE 004 | Ege Seracılık | Antalya → İstanbul (Serada Sebze) | 16000 | TAMAMLANDI |
| 2026-06-15 | 35 EGE 005 | Uludağ İçecek | Bursa → İzmir (İçecek) | 13000 | AKTIF |

### Invoices
| Fatura No | Müşteri | Tarih | Tutar | Genel Toplam | Durum |
|-----------|---------|-------|-------|-------------|-------|
| EGE-2026-001 | Tariş | 2026-05-11 | 12000 | 14400 | odendi |
| EGE-2026-002 | Pınar Et | 2026-05-19 | 18000 | 21600 | odendi |
| EGE-2026-003 | Keskinoğlu | 2026-05-29 | 14000 | 16800 | odendi |
| EGE-2026-004 | Ege Seracılık | 2026-06-06 | 16000 | 19200 | gonderildi |
| EGE-2026-005 | Uludağ İçecek | 2026-06-16 | 13000 | 15600 | taslak |

### Expenses
| Tarih | Kategori | Tutar | Açıklama |
|-------|----------|-------|----------|
| 2026-05-08 | YAKIT | 4200 | Shell İzmir — 35 EGE 001 mazot |
| 2026-05-16 | LASTIK | 18000 | 4 adet lastik — 35 EGE 002 |
| 2026-05-25 | TAMIR | 7500 | Şanzıman tamiri — 35 EGE 003 |
| 2026-06-03 | YAKIT | 3800 | BP Aydın — 35 EGE 004 |
| 2026-06-12 | KIRA | 12000 | Ofis kirası — Haziran 2026 |

### Employees
| Ad Soyad | Rol | Telefon |
|----------|-----|---------|
| Mehmet Ege | TENANT_OWNER | 05323330001 |
| İbrahim Güneş | SOFOR | 05323330002 |
| Süleyman Aydın | SOFOR | 05323330003 |
| Emine Karaca | MUHASEBE | 05323330004 |
| Yusuf Erdoğan | OPERASYON | 05323330005 |

---

## TEST CREDENTIALS

| # | Email | Password | Company | Plan | Trucks |
|---|-------|----------|---------|------|--------|
| 1 | celik@lojistik.com | REDACTED | Çelik Nakliyat Ltd. Şti. | PRO | 5 |
| 2 | anadolu@lojistik.com | REDACTED | Anadolu Lojistik A.Ş. | PRO | 5 |
| 3 | ege@lojistik.com | REDACTED | Ege Transport | FREE | 5 |
