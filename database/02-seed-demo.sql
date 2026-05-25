-- ============================================================
-- Unysol Demo Seed Data
-- Run: docker exec -i unysol-db psql -U unysol -d unysol < 02-seed-demo.sql
-- Creates: 1 demo tenant with full realistic data across all modules
-- ============================================================

BEGIN;

-- Clean existing demo tenant if re-running
DELETE FROM users WHERE email = 'demo@unysol.com';
DELETE FROM tenants WHERE slug = 'demo-nakliyat';

-- ============================================================
-- 1. TENANT + USER
-- ============================================================
INSERT INTO tenants (slug, firma_unvani, plan, locale, country_code, durum)
VALUES ('demo-nakliyat', 'Demo Nakliyat Ltd. Şti.', 'PRO', 'tr', 'TR', 'AKTIF');

-- Get tenant_id
DO $$
DECLARE
  tid INTEGER;
BEGIN
  SELECT id INTO tid FROM tenants WHERE slug = 'demo-nakliyat';

  -- Demo user
  INSERT INTO users (tenant_id, email, password_hash, ad_soyad, rol, telefon, aktif)
  VALUES (tid, 'demo@unysol.com',
    'REDACTED', -- REDACTED
    'Ahmet Demir', 'TENANT_OWNER', '05321112233', true);

  -- Subscription
  INSERT INTO subscriptions (tenant_id, plan, baslangic, bitis, ucret, status)
  VALUES (tid, 'PRO', CURRENT_DATE::text, (CURRENT_DATE + INTERVAL '1 year')::text, 200, 'AKTIF');

  -- Settings
  INSERT INTO settings (tenant_id, key, value) VALUES
    (tid, 'company_name', 'Demo Nakliyat Ltd. Şti.'),
    (tid, 'kdv_rate', '20'),
    (tid, 'currency', 'TRY'),
    (tid, 'notification_email', 'demo@unysol.com');

  -- ============================================================
  -- 2. TRUCKS (Filo)
  -- ============================================================
  INSERT INTO trucks (tenant_id, plaka, marka, model, yil, yakit_tipi, tracking_source, km_sayac_baslangic, km_sayac_guncel, aktif, muayene_bitis)
  VALUES
    (tid, '34 ABC 123', 'Ford', 'Cargo 1842', 2023, 'DIZEL', 'MANUEL', 150000, 185000, true, (CURRENT_DATE + INTERVAL '8 months')::text),
    (tid, '06 XYZ 456', 'Mercedes', 'Actros 1845', 2024, 'DIZEL', 'GPS', 80000, 120000, true, (CURRENT_DATE + INTERVAL '10 months')::text),
    (tid, '35 DEF 789', 'Volvo', 'FH 500', 2022, 'DIZEL', 'MANUEL', 250000, 290000, true, (CURRENT_DATE + INTERVAL '3 months')::text),
    (tid, '07 GHI 012', 'Scania', 'R450', 2023, 'DIZEL', 'GPS', 120000, 155000, true, (CURRENT_DATE + INTERVAL '6 months')::text),
    (tid, '01 JKL 345', 'BMC', 'Tugra', 2024, 'DIZEL', 'MANUEL', 40000, 65000, true, (CURRENT_DATE + INTERVAL '12 months')::text);

  -- ============================================================
  -- 3. TRAILERS (Dorse)
  -- ============================================================
  INSERT INTO trailers (tenant_id, plaka, marka, model, yil, tip, aktif, muayene_bitis)
  VALUES
    (tid, '34 DRS 001', 'Tırsan', 'MAX 500', 2022, 'TENTELI', true, (CURRENT_DATE + INTERVAL '7 months')::text),
    (tid, '06 DRS 002', 'Schmitz', 'SCB*S3T', 2023, 'FRIGO', true, (CURRENT_DATE + INTERVAL '5 months')::text),
    (tid, '35 DRS 003', 'Tırsan', 'MAX 500', 2021, 'TENTELI', true, (CURRENT_DATE + INTERVAL '2 months')::text);

  -- ============================================================
  -- 4. CUSTOMERS (Müşteri)
  -- ============================================================
  INSERT INTO customers (tenant_id, firma_unvani, yetkili, telefon, email, adres, vergi_dairesi, vergi_no, kategori, bakiye, acik_hesap_limiti, risk_skoru, vade_gun, durum)
  VALUES
    (tid, 'Aras Kargo A.Ş.', 'Mehmet Kaya', '02124445566', 'muhasebe@araskargo.com.tr', 'İstanbul, Ümraniye, Nakkaştepe', 'Ümraniye', '1234567890', 'KURUMSAL', 25000, 100000, 'DUSUK', 30, 'AKTIF'),
    (tid, 'Borusan Lojistik', 'Ayşe Yıldız', '02125556677', 'lojistik@borusan.com', 'İstanbul, Beşiktaş, Barbaros Bulvarı', 'Beşiktaş', '2345678901', 'KURUMSAL', 45000, 200000, 'DUSUK', 45, 'AKTIF'),
    (tid, 'Ekol Transport', 'Ali Öztürk', '02321112233', 'ekol@ekol.com', 'İzmir, Alsancak, Kordon', 'Alsancak', '3456789012', 'KURUMSAL', 15000, 80000, 'ORTA', 30, 'AKTIF'),
    (tid, 'Mars Logistics', 'Zeynep Demir', '02241112233', 'info@marslogistics.com', 'Bursa, Nilüfer, Sanayi Cad.', 'Nilüfer', '4567890123', 'KURUMSAL', 32000, 150000, 'DUSUK', 60, 'AKTIF'),
    (tid, 'Horoz Lojistik', 'Fatma Şahin', '02421113344', 'horoz@horozlojistik.com', 'Antalya, Muratpaşa, Lara Cad.', 'Muratpaşa', '5678901234', 'KURUMSAL', 8000, 50000, 'ORTA', 30, 'AKTIF'),
    (tid, 'Netlog Lojistik', 'Mustafa Çelik', '02124448899', 'netlog@netlog.com.tr', 'İstanbul, Başakşehir, İOSB', 'Başakşehir', '6789012345', 'KURUMSAL', 55000, 300000, 'DUSUK', 45, 'AKTIF'),
    (tid, 'Omsan Lojistik', 'Hakan Aydın', '02125559988', 'omsan@omsan.com.tr', 'Ankara, Yenimahalle, İstanbul Yolu', 'Yenimahalle', '7890123456', 'KURUMSAL', 22000, 120000, 'DUSUK', 30, 'AKTIF');

  -- ============================================================
  -- 5. EMPLOYEES (Personel)
  -- ============================================================
  INSERT INTO employees (tenant_id, ad_soyad, rol, telefon, ehliyet_bitis, src_bitis)
  VALUES
    (tid, 'İsmail Çetin', 'SOFOR', '05331112233', '2027-08-15', '2026-12-31'),
    (tid, 'Hasan Yılmaz', 'SOFOR', '05332223344', '2028-03-20', '2027-06-30'),
    (tid, 'Osman Koç', 'SOFOR', '05333334455', '2026-11-10', '2026-09-30'),
    (tid, 'Kemal Aydın', 'SOFOR', '05334445566', '2028-07-05', '2027-12-31'),
    (tid, 'Ali Rıza Güneş', 'SEF', '05335556677', NULL, NULL),
    (tid, 'Emine Yıldırım', 'MUHASEBE', '05336667788', NULL, NULL),
    (tid, 'Fatih Korkmaz', 'OPERASYON', '05337778899', NULL, NULL);

  -- ============================================================
  -- 6. TRIPS (Sefer) — last 60 days, varied statuses
  -- ============================================================
  INSERT INTO trips (tenant_id, truck_id, customer_id, sofor, yukleme, teslimat, ucret, payment_method, durum, baslangic, bitis)
  VALUES
    (tid, (SELECT id FROM trucks WHERE plaka='34 ABC 123' AND tenant_id=tid), (SELECT id FROM customers WHERE firma_unvani='Aras Kargo A.Ş.' AND tenant_id=tid), 'İsmail Çetin', 'İstanbul, Esenler', 'Ankara, Sincan', 18000, 'HAVALE', 'AKTIF', CURRENT_DATE::text, NULL),
    (tid, (SELECT id FROM trucks WHERE plaka='06 XYZ 456' AND tenant_id=tid), (SELECT id FROM customers WHERE firma_unvani='Borusan Lojistik' AND tenant_id=tid), 'Hasan Yılmaz', 'İstanbul, Tuzla', 'İzmir, Kemalpaşa', 22000, 'KREDI_KARTI', 'AKTIF', CURRENT_DATE::text, NULL),
    (tid, (SELECT id FROM trucks WHERE plaka='35 DEF 789' AND tenant_id=tid), (SELECT id FROM customers WHERE firma_unvani='Ekol Transport' AND tenant_id=tid), 'Osman Koç', 'Ankara, Kazan', 'Bursa, Gemlik', 15500, 'HAVALE', 'TAMAMLANDI', (CURRENT_DATE - INTERVAL '3 days')::text, (CURRENT_DATE - INTERVAL '2 days')::text),
    (tid, (SELECT id FROM trucks WHERE plaka='07 GHI 012' AND tenant_id=tid), (SELECT id FROM customers WHERE firma_unvani='Mars Logistics' AND tenant_id=tid), 'Kemal Aydın', 'İzmir, Aliağa', 'Antalya, Serbest Bölge', 25000, 'ACIK_HESAP', 'TAMAMLANDI', (CURRENT_DATE - INTERVAL '5 days')::text, (CURRENT_DATE - INTERVAL '4 days')::text),
    (tid, (SELECT id FROM trucks WHERE plaka='01 JKL 345' AND tenant_id=tid), (SELECT id FROM customers WHERE firma_unvani='Horoz Lojistik' AND tenant_id=tid), 'İsmail Çetin', 'Mersin, Serbest Bölge', 'İstanbul, Ambarlı', 24000, 'HAVALE', 'TAMAMLANDI', (CURRENT_DATE - INTERVAL '7 days')::text, (CURRENT_DATE - INTERVAL '6 days')::text),
    (tid, (SELECT id FROM trucks WHERE plaka='34 ABC 123' AND tenant_id=tid), (SELECT id FROM customers WHERE firma_unvani='Netlog Lojistik' AND tenant_id=tid), 'İsmail Çetin', 'İstanbul, Hadımköy', 'Kocaeli, Gebze', 9500, 'HAVALE', 'TAMAMLANDI', (CURRENT_DATE - INTERVAL '10 days')::text, (CURRENT_DATE - INTERVAL '9 days')::text),
    (tid, (SELECT id FROM trucks WHERE plaka='06 XYZ 456' AND tenant_id=tid), (SELECT id FROM customers WHERE firma_unvani='Omsan Lojistik' AND tenant_id=tid), 'Hasan Yılmaz', 'Ankara, Sincan', 'İstanbul, Tuzla', 19500, 'KREDI_KARTI', 'TAMAMLANDI', (CURRENT_DATE - INTERVAL '14 days')::text, (CURRENT_DATE - INTERVAL '13 days')::text),
    (tid, (SELECT id FROM trucks WHERE plaka='35 DEF 789' AND tenant_id=tid), (SELECT id FROM customers WHERE firma_unvani='Aras Kargo A.Ş.' AND tenant_id=tid), 'Osman Koç', 'İstanbul, Kartal', 'Eskişehir, OSB', 11000, 'ACIK_HESAP', 'TAMAMLANDI', (CURRENT_DATE - INTERVAL '20 days')::text, (CURRENT_DATE - INTERVAL '19 days')::text);

  -- ============================================================
  -- 7. INVOICES (Fatura) — with line items
  -- ============================================================
  INSERT INTO invoices (tenant_id, customer_id, trip_id, tip, musteri, fatura_no, tarih, vade, ara_toplam, kdv, genel_toplam, durum, odeme_durumu)
  VALUES
    (tid, (SELECT id FROM customers WHERE firma_unvani='Aras Kargo A.Ş.' AND tenant_id=tid), NULL, 'SATIS', 'Aras Kargo A.Ş.', 'FTR-2026-0001', CURRENT_DATE::text, (CURRENT_DATE + INTERVAL '30 days')::text, 18000, 3600, 21600, 'gonderildi', 'bekleyen'),
    (tid, (SELECT id FROM customers WHERE firma_unvani='Borusan Lojistik' AND tenant_id=tid), NULL, 'SATIS', 'Borusan Lojistik', 'FTR-2026-0002', CURRENT_DATE::text, (CURRENT_DATE + INTERVAL '45 days')::text, 22000, 4400, 26400, 'gonderildi', 'bekleyen'),
    (tid, (SELECT id FROM customers WHERE firma_unvani='Ekol Transport' AND tenant_id=tid), NULL, 'SATIS', 'Ekol Transport', 'FTR-2026-0003', (CURRENT_DATE - INTERVAL '3 days')::text, (CURRENT_DATE + INTERVAL '27 days')::text, 15500, 3100, 18600, 'odendi', 'odendi');

  -- Invoice line items
  INSERT INTO invoice_items (invoice_id, sira, urun_adi, aciklama, miktar, birim, birim_fiyat, kdv_oran, kdv_tutar, tutar)
  VALUES
    ((SELECT id FROM invoices WHERE fatura_no='FTR-2026-0001' AND tenant_id=tid), 1, 'Nakliye Hizmeti', 'İstanbul → Ankara', 1, 'adet', 18000, 20, 3600, 18000),
    ((SELECT id FROM invoices WHERE fatura_no='FTR-2026-0002' AND tenant_id=tid), 1, 'Nakliye Hizmeti', 'İstanbul → İzmir', 1, 'adet', 22000, 20, 4400, 22000),
    ((SELECT id FROM invoices WHERE fatura_no='FTR-2026-0003' AND tenant_id=tid), 1, 'Nakliye Hizmeti', 'Ankara → Bursa', 1, 'adet', 15500, 20, 3100, 15500);

  -- Invoice payments
  INSERT INTO invoice_payments (invoice_id, tutar, yontem, referans_no, tarih, aciklama)
  VALUES
    ((SELECT id FROM invoices WHERE fatura_no='FTR-2026-0003' AND tenant_id=tid), 18600, 'HAVALE', 'EFT-2026-05001', (CURRENT_DATE - INTERVAL '1 day')::text, 'Tam ödeme');

  -- ============================================================
  -- 8. EXPENSES (Gider) — recent expenses across categories
  -- ============================================================
  INSERT INTO expenses (tenant_id, truck_id, kategori, tarih, tutar, aciklama, plaka, fatura_no)
  VALUES
    (tid, (SELECT id FROM trucks WHERE plaka='34 ABC 123' AND tenant_id=tid), 'YAKIT', (CURRENT_DATE - INTERVAL '1 day')::text, 4500, 'Shell Kadıköy — mazot ikmali', '34 ABC 123', 'GRF-202605-001'),
    (tid, (SELECT id FROM trucks WHERE plaka='06 XYZ 456' AND tenant_id=tid), 'YAKIT', (CURRENT_DATE - INTERVAL '2 days')::text, 5200, 'BP İstanbul — mazot ikmali', '06 XYZ 456', 'GRF-202605-002'),
    (tid, (SELECT id FROM trucks WHERE plaka='35 DEF 789' AND tenant_id=tid), 'YAKIT', (CURRENT_DATE - INTERVAL '3 days')::text, 3800, 'Petrol Ofisi Ankara — mazot', '35 DEF 789', NULL),
    (tid, (SELECT id FROM trucks WHERE plaka='07 GHI 012' AND tenant_id=tid), 'BAKIM', (CURRENT_DATE - INTERVAL '5 days')::text, 8500, 'Periyodik bakım — yağ, filtre, fren balata', '07 GHI 012', 'FTR-BKM-001'),
    (tid, (SELECT id FROM trucks WHERE plaka='01 JKL 345' AND tenant_id=tid), 'LASTIK', (CURRENT_DATE - INTERVAL '10 days')::text, 32000, '8 adet lastik değişimi (Michelin 315/80R22.5)', '01 JKL 345', 'FTR-LST-001'),
    (tid, NULL, 'SIGORTA', (CURRENT_DATE - INTERVAL '15 days')::text, 24000, 'Kasko yıllık yenileme — 34 ABC 123', '34 ABC 123', 'PLS-SIG-001'),
    (tid, NULL, 'MTV', (CURRENT_DATE - INTERVAL '20 days')::text, 4200, 'MTV 2. taksit — 06 XYZ 456', '06 XYZ 456', NULL),
    (tid, (SELECT id FROM trucks WHERE plaka='35 DEF 789' AND tenant_id=tid), 'KOPRU_OTOYOL', CURRENT_DATE::text, 850, 'O-4 Otoyol geçiş ücreti', '35 DEF 789', NULL),
    (tid, (SELECT id FROM trucks WHERE plaka='07 GHI 012' AND tenant_id=tid), 'KOPRU_OTOYOL', (CURRENT_DATE - INTERVAL '1 day')::text, 625, 'Osmangazi Köprüsü geçiş', '07 GHI 012', NULL),
    (tid, (SELECT id FROM trucks WHERE plaka='34 ABC 123' AND tenant_id=tid), 'MUAYENE', (CURRENT_DATE - INTERVAL '30 days')::text, 1850, 'TÜVTÜRK araç muayenesi', '34 ABC 123', NULL),
    (tid, NULL, 'MUHASEBE', (CURRENT_DATE - INTERVAL '2 days')::text, 3500, 'Aylık muhasebe danışmanlık', NULL, 'FTR-MUH-001'),
    (tid, NULL, 'KIRA', (CURRENT_DATE - INTERVAL '1 day')::text, 15000, 'Ofis kirası — Mayıs 2026', NULL, NULL),
    (tid, NULL, 'MAAS', (CURRENT_DATE - INTERVAL '5 days')::text, 85000, 'Personel maaşları — Nisan 2026', NULL, NULL),
    (tid, NULL, 'YAZILIM_LISANS', (CURRENT_DATE - INTERVAL '3 days')::text, 2500, 'Unysol SaaS — Aylık', NULL, NULL),
    (tid, (SELECT id FROM trucks WHERE plaka='06 XYZ 456' AND tenant_id=tid), 'TAMIR', (CURRENT_DATE - INTERVAL '8 days')::text, 6200, 'Turbo arızası onarım', '06 XYZ 456', 'FTR-TMR-001');

  -- ============================================================
  -- 9. FUEL LOGS (Yakıt Takip)
  -- ============================================================
  INSERT INTO fuel_logs (tenant_id, truck_id, tarih, miktar_litre, birim_fiyat, toplam_tutar, alinan_yer, km_okuma)
  VALUES
    (tid, (SELECT id FROM trucks WHERE plaka='34 ABC 123' AND tenant_id=tid), (CURRENT_DATE - INTERVAL '1 day')::text, 120.5, 37.34, 4500, 'Shell Kadıköy', 185200),
    (tid, (SELECT id FROM trucks WHERE plaka='06 XYZ 456' AND tenant_id=tid), (CURRENT_DATE - INTERVAL '2 days')::text, 139.3, 37.34, 5200, 'BP İstanbul', 120300),
    (tid, (SELECT id FROM trucks WHERE plaka='35 DEF 789' AND tenant_id=tid), (CURRENT_DATE - INTERVAL '3 days')::text, 101.8, 37.34, 3800, 'Petrol Ofisi Ankara', 290400),
    (tid, (SELECT id FROM trucks WHERE plaka='34 ABC 123' AND tenant_id=tid), (CURRENT_DATE - INTERVAL '5 days')::text, 110.2, 37.45, 4127, 'Shell Esenler', 184800),
    (tid, (SELECT id FROM trucks WHERE plaka='07 GHI 012' AND tenant_id=tid), (CURRENT_DATE - INTERVAL '6 days')::text, 98.5, 37.34, 3678, 'BP İzmir', 155300);

  -- ============================================================
  -- 10. MAINTENANCE RECORDS (Bakım Kayıtları)
  -- ============================================================
  INSERT INTO maintenance_records (tenant_id, truck_id, tarih, km, turu, yapilan_islemler, toplam_tutar, fatura_no, servis_adi, sonraki_bakim_km, sonraki_bakim_tarih)
  VALUES
    (tid, (SELECT id FROM trucks WHERE plaka='07 GHI 012' AND tenant_id=tid), (CURRENT_DATE - INTERVAL '5 days')::text, 155000, 'PERIYODIK', 'Yağ değişimi, hava filtresi, yakıt filtresi, fren balata kontrolü', 8500, 'FTR-BKM-001', 'Oto Servis Yıldız', 170000, (CURRENT_DATE + INTERVAL '6 months')::text),
    (tid, (SELECT id FROM trucks WHERE plaka='34 ABC 123' AND tenant_id=tid), (CURRENT_DATE - INTERVAL '45 days')::text, 178000, 'PERIYODIK', 'Motor yağı, şanzıman yağı, diferansiyel yağı, tüm filtreler', 12500, 'FTR-BKM-045', 'Ford Yetkili Servis', 193000, (CURRENT_DATE + INTERVAL '4 months')::text),
    (tid, (SELECT id FROM trucks WHERE plaka='06 XYZ 456' AND tenant_id=tid), (CURRENT_DATE - INTERVAL '8 days')::text, 118000, 'TAMIR', 'Turbo şarj değişimi + intercooler temizliği', 6200, 'FTR-TMR-001', 'TurboDizel Servis', NULL, NULL);

  -- ============================================================
  -- 11. INSURANCE POLICIES (Sigorta Poliçeleri)
  -- ============================================================
  INSERT INTO insurance_policies (tenant_id, truck_id, police_no, turu, sigorta_sirketi, baslangic, bitis, prim_tutari)
  VALUES
    (tid, (SELECT id FROM trucks WHERE plaka='34 ABC 123' AND tenant_id=tid), 'KAS-2026-001', 'KASKO', 'Allianz Sigorta', '2026-01-01', '2027-01-01', 24000),
    (tid, (SELECT id FROM trucks WHERE plaka='06 XYZ 456' AND tenant_id=tid), 'ZMM-2026-001', 'ZORUNLU_TRAFIK', 'Anadolu Sigorta', '2026-03-15', '2027-03-15', 8500),
    (tid, (SELECT id FROM trucks WHERE plaka='35 DEF 789' AND tenant_id=tid), 'KAS-2026-002', 'KASKO', 'Allianz Sigorta', '2026-02-01', '2027-02-01', 22000),
    (tid, (SELECT id FROM trucks WHERE plaka='07 GHI 012' AND tenant_id=tid), 'ZMM-2026-002', 'ZORUNLU_TRAFIK', 'Anadolu Sigorta', '2026-04-01', '2027-04-01', 7500);

  -- ============================================================
  -- 12. TOLL LOGS (HGS Geçiş)
  -- ============================================================
  INSERT INTO toll_logs (tenant_id, truck_id, gecis_tarihi, hgs_etiket_no, giris_gise, cikis_gise, gecis_ucreti)
  VALUES
    (tid, (SELECT id FROM trucks WHERE plaka='35 DEF 789' AND tenant_id=tid), CURRENT_DATE::text, 'HGS-0900123456', 'İstanbul-Gebze', 'İzmit', 850),
    (tid, (SELECT id FROM trucks WHERE plaka='07 GHI 012' AND tenant_id=tid), (CURRENT_DATE - INTERVAL '1 day')::text, 'HGS-0900234567', 'Bursa', 'Balıkesir', 625),
    (tid, (SELECT id FROM trucks WHERE plaka='34 ABC 123' AND tenant_id=tid), (CURRENT_DATE - INTERVAL '2 days')::text, 'HGS-0900345678', 'İstanbul-Mahmutbey', 'Edirne', 1200),
    (tid, (SELECT id FROM trucks WHERE plaka='06 XYZ 456' AND tenant_id=tid), (CURRENT_DATE - INTERVAL '3 days')::text, 'HGS-0900456789', 'Ankara', 'İstanbul', 1800);

  -- ============================================================
  -- 13. NOTIFICATIONS (Bildirim)
  -- ============================================================
  INSERT INTO notifications (tenant_id, user_id, message, read)
  VALUES
    (tid, (SELECT id FROM users WHERE email='demo@unysol.com' AND tenant_id=tid), '34 ABC 123 kamyonunun muayenesi 3 ay içinde bitecek.', false),
    (tid, (SELECT id FROM users WHERE email='demo@unysol.com' AND tenant_id=tid), '07 GHI 012 periyodik bakımı tamamlandı. Sonraki bakım: 170.000 km.', true),
    (tid, (SELECT id FROM users WHERE email='demo@unysol.com' AND tenant_id=tid), 'FTR-2026-0001 nolu fatura vadesi yaklaşıyor. Kalan: 21.600 TL', false),
    (tid, (SELECT id FROM users WHERE email='demo@unysol.com' AND tenant_id=tid), 'İsmail Çetin ehliyeti 2027-08-15 tarihinde bitecek.', false),
    (tid, (SELECT id FROM users WHERE email='demo@unysol.com' AND tenant_id=tid), 'Hoş geldiniz! Unysol filo yönetim platformuna başarıyla kaydoldunuz.', true);

  -- ============================================================
  -- 14. CEK/SENET
  -- ============================================================
  INSERT INTO cek_senet (tenant_id, customer_id, type, no, tutar, vade_tarihi, status, banka, sube, borclu)
  VALUES
    (tid, (SELECT id FROM customers WHERE firma_unvani='Mars Logistics' AND tenant_id=tid), 'CEK', 'CEK-2026-001', 75000, (CURRENT_DATE + INTERVAL '45 days')::text, 'BEKLIYOR', 'Yapı Kredi', 'Maslak', 'Mars Logistics'),
    (tid, (SELECT id FROM customers WHERE firma_unvani='Netlog Lojistik' AND tenant_id=tid), 'SENET', 'SEN-2026-001', 45000, (CURRENT_DATE + INTERVAL '60 days')::text, 'BEKLIYOR', 'Garanti BBVA', 'Beşiktaş', 'Netlog Lojistik'),
    (tid, (SELECT id FROM customers WHERE firma_unvani='Horoz Lojistik' AND tenant_id=tid), 'CEK', 'CEK-2026-002', 32000, (CURRENT_DATE - INTERVAL '5 days')::text, 'TAHSIL_EDILDI', 'İş Bankası', 'Kadıköy', 'Horoz Lojistik');

  -- ============================================================
  -- 15. DRIVER LEAVE (Personel İzin)
  -- ============================================================
  INSERT INTO driver_leave (tenant_id, user_id, baslangic, bitis, turu, onay_durumu, aciklama)
  VALUES
    (tid, (SELECT u.id FROM users u JOIN employees e ON u.ad_soyad = e.ad_soyad WHERE u.email='demo@unysol.com' LIMIT 1), (CURRENT_DATE + INTERVAL '10 days')::text, (CURRENT_DATE + INTERVAL '15 days')::text, 'YILLIK', 'ONAYLANDI', 'Yıllık izin'),
    (tid, (SELECT u.id FROM users u JOIN employees e ON u.ad_soyad = e.ad_soyad WHERE u.email='demo@unysol.com' LIMIT 1), (CURRENT_DATE - INTERVAL '20 days')::text, (CURRENT_DATE - INTERVAL '18 days')::text, 'SAGLIK', 'ONAYLANDI', 'Sağlık raporu');

END $$;

COMMIT;
