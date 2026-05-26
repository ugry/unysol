-- ============================================================
-- Unysol — 3 Tenant Realistic Seed (May-June 2026)
-- Run: docker exec -i unysol-db psql -U unysol -d unysol < 03-seed-tenants.sql
-- ============================================================
BEGIN;

-- ============================================================
-- TENANT 1: Çelik Nakliyat Ltd. Şti. (PRO)
-- ============================================================
DO $$
DECLARE
  tid1 INTEGER;
BEGIN
  INSERT INTO tenants (slug, firma_unvani, plan, locale, country_code, durum)
  VALUES ('celik-nakliyat', 'Çelik Nakliyat Ltd. Şti.', 'PRO', 'tr', 'TR', 'AKTIF')
  RETURNING id INTO tid1;

  INSERT INTO users (tenant_id, email, password_hash, ad_soyad, rol, telefon, aktif)
  VALUES (tid1, 'celik@lojistik.com', 'REDACTED', 'Mustafa Çelik', 'TENANT_OWNER', '05321110001', true);

  INSERT INTO subscriptions (tenant_id, plan, baslangic, bitis, ucret, status)
  VALUES (tid1, 'PRO', '2026-05-01', '2027-05-01', 200, 'AKTIF');

  -- Settings removed — settings.value is JSONB, skip for seed


  -- 5 Trucks
  INSERT INTO trucks (tenant_id, plaka, marka, model, yil, yakit_tipi, tracking_source, km_sayac_baslangic, km_sayac_guncel, aktif, muayene_bitis)
  VALUES
    (tid1, '34 CEL 001', 'BMC', 'Pro 1144', 2022, 'DIZEL', 'PHONE', 180000, 215000, true, '2026-11-15'),
    (tid1, '34 CEL 002', 'Mercedes', 'Axor 3340', 2021, 'DIZEL', 'MANUEL', 250000, 285000, true, '2026-08-20'),
    (tid1, '34 CEL 003', 'Ford', 'Cargo 1842', 2023, 'DIZEL', 'PHONE', 120000, 155000, true, '2026-12-01'),
    (tid1, '34 CEL 004', 'Scania', 'G450', 2022, 'DIZEL', 'PHONE', 90000, 130000, true, '2026-09-10'),
    (tid1, '34 CEL 005', 'Volvo', 'FM 430', 2024, 'DIZEL', 'MANUEL', 30000, 65000, true, '2027-03-25');

  -- 5 Customers
  INSERT INTO customers (tenant_id, firma_unvani, yetkili, telefon, email, adres, vergi_dairesi, vergi_no, kategori, bakiye, acik_hesap_limiti, risk_skoru, vade_gun, durum)
  VALUES
    (tid1, 'Kalyon İnşaat A.Ş.', 'Ahmet Yılmaz', '02124445501', 'info@kalyon.com', 'İstanbul, Ataşehir', 'Ataşehir', '1000000001', 'KURUMSAL', 35000, 150000, 'DUSUK', 30, 'AKTIF'),
    (tid1, 'Limak İnşaat', 'Mehmet Kaya', '03124445502', 'lojistik@limak.com', 'Ankara, Çankaya', 'Çankaya', '1000000002', 'KURUMSAL', 42000, 200000, 'DUSUK', 45, 'AKTIF'),
    (tid1, 'Demir Çelik A.Ş.', 'Ayşe Demir', '03264445503', 'demircelik@demircelik.com', 'İskenderun, Sarıseki', 'İskenderun', '1000000003', 'KURUMSAL', 58000, 300000, 'ORTA', 60, 'AKTIF'),
    (tid1, 'Cengiz İnşaat', 'Ali Özdemir', '02164445504', 'cengiz@cengizinsaat.com', 'İstanbul, Ümraniye', 'Ümraniye', '1000000004', 'KURUMSAL', -12000, 100000, 'ORTA', 30, 'AKTIF'),
    (tid1, 'Ege Seramik A.Ş.', 'Zeynep Çalık', '02324445505', 'info@egeseramik.com', 'İzmir, Kemalpaşa', 'Kemalpaşa', '1000000005', 'KURUMSAL', 15000, 80000, 'DUSUK', 30, 'AKTIF');

  -- 5 Trips (May-June 2026)
  INSERT INTO trips (tenant_id, truck_id, customer_id, sofor, yukleme, teslimat, ucret, payment_method, durum, baslangic_tarih, bitis_tarih)
  VALUES
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 001' AND tenant_id=tid1), (SELECT id FROM customers WHERE firma_unvani='Kalyon İnşaat A.Ş.' AND tenant_id=tid1), 'İsmail Demir', 'İstanbul, Ataşehir', 'Ankara, Sincan — İnşaat Malzemesi', 22000, 'HAVALE', 'TAMAMLANDI', '2026-05-05', '2026-05-06'),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 002' AND tenant_id=tid1), (SELECT id FROM customers WHERE firma_unvani='Limak İnşaat' AND tenant_id=tid1), 'Hüseyin Yıldız', 'Ankara, Çankaya', 'İzmir, Aliağa — Çelik Konstrüksiyon', 28000, 'KREDI_KARTI', 'TAMAMLANDI', '2026-05-12', '2026-05-13'),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 003' AND tenant_id=tid1), (SELECT id FROM customers WHERE firma_unvani='Demir Çelik A.Ş.' AND tenant_id=tid1), 'Osman Şahin', 'İskenderun, Sarıseki', 'İstanbul, Ambarlı — İnşaat Demiri', 32000, 'HAVALE', 'TAMAMLANDI', '2026-05-20', '2026-05-22'),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 004' AND tenant_id=tid1), (SELECT id FROM customers WHERE firma_unvani='Cengiz İnşaat' AND tenant_id=tid1), 'İsmail Demir', 'İstanbul, Ümraniye', 'Bursa, Gemlik — Hazır Beton', 18000, 'ACIK_HESAP', 'TAMAMLANDI', '2026-06-02', '2026-06-03'),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 005' AND tenant_id=tid1), (SELECT id FROM customers WHERE firma_unvani='Ege Seramik A.Ş.' AND tenant_id=tid1), 'Hüseyin Yıldız', 'İzmir, Kemalpaşa', 'İstanbul, Esenyurt — 28 Palet Seramik', 25000, 'HAVALE', 'AKTIF', '2026-06-10', NULL);

  -- 5 Invoices
  INSERT INTO invoices (tenant_id, customer_id, musteri, fatura_no, tarih, vade, ara_toplam, kdv, genel_toplam, durum, odeme_durumu)
  VALUES
    (tid1, (SELECT id FROM customers WHERE firma_unvani='Kalyon İnşaat A.Ş.' AND tenant_id=tid1), 'Kalyon İnşaat A.Ş.', 'CLK-2026-001', '2026-05-06', '2026-06-05', 22000, 4400, 26400, 'odendi', 'odendi'),
    (tid1, (SELECT id FROM customers WHERE firma_unvani='Limak İnşaat' AND tenant_id=tid1), 'Limak İnşaat', 'CLK-2026-002', '2026-05-13', '2026-07-13', 28000, 5600, 33600, 'odendi', 'odendi'),
    (tid1, (SELECT id FROM customers WHERE firma_unvani='Demir Çelik A.Ş.' AND tenant_id=tid1), 'Demir Çelik A.Ş.', 'CLK-2026-003', '2026-05-21', '2026-07-21', 32000, 6400, 38400, 'odendi', 'odendi'),
    (tid1, (SELECT id FROM customers WHERE firma_unvani='Cengiz İnşaat' AND tenant_id=tid1), 'Cengiz İnşaat', 'CLK-2026-004', '2026-06-03', '2026-08-03', 18000, 3600, 21600, 'gonderildi', 'bekleyen'),
    (tid1, (SELECT id FROM customers WHERE firma_unvani='Ege Seramik A.Ş.' AND tenant_id=tid1), 'Ege Seramik A.Ş.', 'CLK-2026-005', '2026-06-11', '2026-08-11', 25000, 5000, 30000, 'taslak', 'bekleyen');

  -- 5 Expenses
  INSERT INTO expenses (tenant_id, kategori, tarih, tutar, aciklama, plaka, fatura_no)
  VALUES
    (tid1, 'YAKIT', '2026-05-03', 4800, 'Shell Mahmutbey mazot ikmali — 34 CEL 001', '34 CEL 001', 'FT-YKT-001'),
    (tid1, 'BAKIM', '2026-05-10', 12000, 'Periyodik bakım yağ/filtre/fren — 34 CEL 002', '34 CEL 002', 'FT-BKM-001'),
    (tid1, 'LASTIK', '2026-05-18', 28000, '6 adet lastik değişimi 315/80R22.5 — 34 CEL 003', '34 CEL 003', 'FT-LST-001'),
    (tid1, 'YAKIT', '2026-06-01', 5200, 'Petrol Ofisi İstanbul mazot — 34 CEL 004', '34 CEL 004', 'FT-YKT-002'),
    (tid1, 'KOPRU_OTOYOL', '2026-06-08', 1850, 'Osmangazi Köprüsü + O-4 Otoyol — 34 CEL 005', '34 CEL 005', NULL);

  -- 5 Employee
  INSERT INTO employees (tenant_id, ad_soyad, rol, telefon, ehliyet_bitis, src_bitis)
  VALUES
    (tid1, 'İsmail Demir', 'SOFOR', '05321110002', '2027-09-15', '2026-12-31'),
    (tid1, 'Hüseyin Yıldız', 'SOFOR', '05321110003', '2028-03-20', '2027-06-30'),
    (tid1, 'Osman Şahin', 'SOFOR', '05321110004', '2026-11-10', '2026-08-15'),
    (tid1, 'Kemal Aslan', 'SEF', '05321110005', NULL, NULL),
    (tid1, 'Fatma Demir', 'MUHASEBE', '05321110006', NULL, NULL);

  -- 5 Fuel Logs
  INSERT INTO fuel_logs (tenant_id, truck_id, tarih, miktar_litre, birim_fiyat, toplam_tutar, alinan_yer, km_okuma)
  VALUES
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 001' AND tenant_id=tid1), '2026-05-03', 128, 37.50, 4800, 'Shell Mahmutbey', 215300),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 002' AND tenant_id=tid1), '2026-05-10', 145, 37.50, 5437, 'BP Ankara', 285400),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 003' AND tenant_id=tid1), '2026-05-18', 135, 38.00, 5130, 'Petrol Ofisi İskenderun', 155400),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 004' AND tenant_id=tid1), '2026-06-01', 138, 37.68, 5200, 'Petrol Ofisi İstanbul', 130500),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 005' AND tenant_id=tid1), '2026-06-08', 110, 37.50, 4125, 'Opet Bursa', 65300);

  -- 5 Maintenance Records
  INSERT INTO maintenance_records (tenant_id, truck_id, tarih, km, turu, yapilan_islemler, toplam_tutar, fatura_no, servis_adi, sonraki_bakim_km, sonraki_bakim_tarih)
  VALUES
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 002' AND tenant_id=tid1), '2026-05-10', 285000, 'PERIYODIK_BAKIM', 'Yağ değişimi, hava/yakıt filtresi, fren balata kontrolü', 12000, 'FT-BKM-001', 'BMC Yetkili Servis', 300000, '2026-11-10'),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 001' AND tenant_id=tid1), '2026-04-15', 210000, 'PERIYODIK_BAKIM', 'Motor yağı, şanzıman yağı, tüm filtreler', 9500, 'FT-BKM-052', 'Mercedes Benz Servis', 225000, '2026-10-15'),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 003' AND tenant_id=tid1), '2026-03-20', 150000, 'DIGER', 'Enjektör değişimi + yazılım güncelleme', 18500, 'FT-TMR-003', 'Ford Yetkili Servis', 165000, '2026-09-20'),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 004' AND tenant_id=tid1), '2026-05-25', 128000, 'PERIYODIK_BAKIM', 'Yağ değişimi + filtre seti', 7800, 'FT-BKM-053', 'Scania Yetkili Servis', 143000, '2026-11-25'),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 005' AND tenant_id=tid1), '2026-06-05', 63000, 'PERIYODIK_BAKIM', 'İlk bakım — motor yağı, filtreler, genel kontrol', 4500, 'FT-BKM-054', 'Volvo Yetkili Servis', 78000, '2026-12-05');

  -- 5 Insurance Policies
  INSERT INTO insurance_policies (tenant_id, truck_id, police_no, turu, sigorta_sirketi, baslangic, bitis, prim_tutari)
  VALUES
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 001' AND tenant_id=tid1), 'KAS-CEL-001', 'KASKO', 'Allianz Sigorta', '2026-01-01', '2027-01-01', 32000),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 002' AND tenant_id=tid1), 'ZMM-CEL-001', 'ZMM', 'Anadolu Sigorta', '2026-02-15', '2027-02-15', 9500),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 003' AND tenant_id=tid1), 'KAS-CEL-002', 'KASKO', 'Allianz Sigorta', '2026-03-01', '2027-03-01', 28000),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 004' AND tenant_id=tid1), 'ZMM-CEL-002', 'ZMM', 'Anadolu Sigorta', '2026-04-01', '2027-04-01', 8500),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 005' AND tenant_id=tid1), 'KAS-CEL-003', 'KASKO', 'AxA Sigorta', '2026-05-01', '2027-05-01', 35000);

  -- 5 Toll Logs
  INSERT INTO toll_logs (tenant_id, truck_id, gecis_tarihi, hgs_etiket_no, giris_gise, cikis_gise, gecis_ucreti)
  VALUES
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 001' AND tenant_id=tid1), '2026-05-05', 'HGS-CEL-01', 'İstanbul-Mahmutbey', 'Ankara-Gölbaşı', 1850),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 002' AND tenant_id=tid1), '2026-05-12', 'HGS-CEL-02', 'Ankara-Gölbaşı', 'İzmir-Kemalpaşa', 2200),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 004' AND tenant_id=tid1), '2026-06-02', 'HGS-CEL-01', 'İstanbul-Çamlıca', 'Bursa-Gemlik', 650),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 005' AND tenant_id=tid1), '2026-06-08', 'HGS-CEL-03', 'Bursa-Batı', 'İstanbul-Mahmutbey', 1200),
    (tid1, (SELECT id FROM trucks WHERE plaka='34 CEL 003' AND tenant_id=tid1), '2026-05-20', 'HGS-CEL-02', 'İskenderun', 'İstanbul-Hadımköy', 2800);

  -- 5 Cek/Senet
  INSERT INTO cek_senet (tenant_id, customer_id, type, no, tutar, vade_tarihi, status, banka, sube, borclu)
  VALUES
    (tid1, (SELECT id FROM customers WHERE firma_unvani='Cengiz İnşaat' AND tenant_id=tid1), 'CEK', 'CEK-001-CEL', 45000, '2026-07-15', 'BEKLIYOR', 'Garanti BBVA', 'Levent', 'Cengiz İnşaat'),
    (tid1, (SELECT id FROM customers WHERE firma_unvani='Demir Çelik A.Ş.' AND tenant_id=tid1), 'SENET', 'SEN-001-CEL', 58000, '2026-08-30', 'BEKLIYOR', 'İş Bankası', 'İskenderun', 'Demir Çelik A.Ş.'),
    (tid1, (SELECT id FROM customers WHERE firma_unvani='Kalyon İnşaat A.Ş.' AND tenant_id=tid1), 'CEK', 'CEK-002-CEL', 35000, '2026-06-20', 'BEKLIYOR', 'Yapı Kredi', 'Maslak', 'Kalyon İnşaat A.Ş.'),
    (tid1, (SELECT id FROM customers WHERE firma_unvani='Limak İnşaat' AND tenant_id=tid1), 'CEK', 'CEK-003-CEL', 42000, '2026-05-25', 'TAHSIL_EDILDI', 'Akbank', 'Çankaya', 'Limak İnşaat'),
    (tid1, (SELECT id FROM customers WHERE firma_unvani='Ege Seramik A.Ş.' AND tenant_id=tid1), 'SENET', 'SEN-002-CEL', 15000, '2026-09-15', 'BEKLIYOR', 'Denizbank', 'Kemalpaşa', 'Ege Seramik A.Ş.');

  -- 5 Notifications
  INSERT INTO notifications (tenant_id, message, read)
  VALUES
    (tid1, '34 CEL 003 muayenesi 2026-12-01 tarihine kadar yenilenmeli.', false),
    (tid1, 'Osman Şahin SRC belgesi 2026-08-15 tarihinde sona eriyor.', false),
    (tid1, 'CLK-2026-005 fatura taslak durumda. Göndermeyi unutmayın.', false),
    (tid1, 'Hoş geldiniz! Çelik Nakliyat Unysol hesabı aktif.', true),
    (tid1, '34 CEL 002 periyodik bakımı tamamlandı. Sonraki bakım: 300.000 km.', true);

  -- 5 Driver Leave (user_id needs FK to users, skip for seed simplicity)
  -- Driver leave requires user records which need JWT integration
END $$;

-- ============================================================
-- TENANT 2: Anadolu Lojistik A.Ş. (PRO)
-- ============================================================
DO $$
DECLARE
  tid2 INTEGER;
BEGIN
  INSERT INTO tenants (slug, firma_unvani, plan, locale, country_code, durum)
  VALUES ('anadolu-lojistik', 'Anadolu Lojistik A.Ş.', 'PRO', 'tr', 'TR', 'AKTIF')
  RETURNING id INTO tid2;

  INSERT INTO users (tenant_id, email, password_hash, ad_soyad, rol, telefon, aktif)
  VALUES (tid2, 'anadolu@lojistik.com', 'REDACTED', 'Ali Rıza Aydın', 'TENANT_OWNER', '05322220001', true);

  INSERT INTO subscriptions (tenant_id, plan, baslangic, bitis, ucret, status)
  VALUES (tid2, 'PRO', '2026-05-01', '2027-05-01', 200, 'AKTIF');

  -- 5 Trucks
  INSERT INTO trucks (tenant_id, plaka, marka, model, yil, yakit_tipi, tracking_source, km_sayac_baslangic, km_sayac_guncel, aktif, muayene_bitis)
  VALUES
    (tid2, '06 ANA 001', 'Mercedes', 'Actros 1845', 2024, 'DIZEL', 'PHONE', 80000, 110000, true, '2027-01-15'),
    (tid2, '06 ANA 002', 'Volvo', 'FH 500', 2023, 'DIZEL', 'PHONE', 120000, 155000, true, '2026-12-01'),
    (tid2, '06 ANA 003', 'MAN', 'TGX 18.510', 2022, 'DIZEL', 'MANUEL', 200000, 240000, true, '2026-10-20'),
    (tid2, '06 ANA 004', 'Scania', 'R500', 2024, 'DIZEL', 'PHONE', 50000, 85000, true, '2027-04-10'),
    (tid2, '06 ANA 005', 'Ford', 'F-Max', 2023, 'DIZEL', 'MANUEL', 150000, 185000, true, '2026-11-05');

  -- 5 Customers
  INSERT INTO customers (tenant_id, firma_unvani, yetkili, telefon, email, adres, vergi_dairesi, vergi_no, kategori, bakiye, acik_hesap_limiti, risk_skoru, vade_gun, durum)
  VALUES
    (tid2, 'Arçelik A.Ş.', 'Fatma Yılmaz', '02124446601', 'lojistik@arcelik.com', 'İstanbul, Beylikdüzü', 'Beylikdüzü', '2000000001', 'KURUMSAL', 45000, 250000, 'DUSUK', 30, 'AKTIF'),
    (tid2, 'Vestel A.Ş.', 'Caner Öztürk', '02364446602', 'nakliye@vestel.com', 'Manisa, OSB', 'Manisa', '2000000002', 'KURUMSAL', 32000, 150000, 'DUSUK', 45, 'AKTIF'),
    (tid2, 'Tofaş A.Ş.', 'Murat Çelik', '02244446603', 'tedarik@tofas.com', 'Bursa, Osmangazi', 'Osmangazi', '2000000003', 'KURUMSAL', 28000, 200000, 'DUSUK', 30, 'AKTIF'),
    (tid2, 'Pınar Süt', 'Deniz Kaya', '02324446604', 'sevkiyat@pinarsut.com', 'İzmir, Pınarbaşı', 'Pınarbaşı', '2000000004', 'KURUMSAL', 18000, 100000, 'ORTA', 15, 'AKTIF'),
    (tid2, 'Şişecam A.Ş.', 'Burcu Aydın', '02624446605', 'tedarik@sisecam.com', 'Kocaeli, Gebze', 'Gebze', '2000000005', 'KURUMSAL', 52000, 300000, 'DUSUK', 60, 'AKTIF');

  -- 5 Trips
  INSERT INTO trips (tenant_id, truck_id, customer_id, sofor, yukleme, teslimat, ucret, payment_method, durum, baslangic_tarih, bitis_tarih)
  VALUES
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 001' AND tenant_id=tid2), (SELECT id FROM customers WHERE firma_unvani='Arçelik A.Ş.' AND tenant_id=tid2), 'Mehmet Koç', 'İstanbul, Beylikdüzü', 'Ankara, İvedik — Beyaz Eşya', 24000, 'HAVALE', 'TAMAMLANDI', '2026-05-08', '2026-05-09'),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 002' AND tenant_id=tid2), (SELECT id FROM customers WHERE firma_unvani='Vestel A.Ş.' AND tenant_id=tid2), 'Hasan Polat', 'Manisa, OSB', 'İstanbul, Esenyurt — TV Nakliye', 26000, 'KREDI_KARTI', 'TAMAMLANDI', '2026-05-15', '2026-05-16'),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 003' AND tenant_id=tid2), (SELECT id FROM customers WHERE firma_unvani='Tofaş A.Ş.' AND tenant_id=tid2), 'Mehmet Koç', 'Bursa, Osmangazi', 'Ankara, Sincan — Otomotiv Parça', 20000, 'HAVALE', 'TAMAMLANDI', '2026-05-25', '2026-05-26'),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 004' AND tenant_id=tid2), (SELECT id FROM customers WHERE firma_unvani='Pınar Süt' AND tenant_id=tid2), 'Hasan Polat', 'İzmir, Pınarbaşı', 'İstanbul, Hadımköy — Soğuk Zincir', 32000, 'ACIK_HESAP', 'TAMAMLANDI', '2026-06-03', '2026-06-04'),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 005' AND tenant_id=tid2), (SELECT id FROM customers WHERE firma_unvani='Şişecam A.Ş.' AND tenant_id=tid2), 'Mehmet Koç', 'Kocaeli, Gebze', 'İzmir, Kemalpaşa — Cam Ürünleri', 28000, 'HAVALE', 'AKTIF', '2026-06-12', NULL);

  -- 5 Invoices
  INSERT INTO invoices (tenant_id, customer_id, musteri, fatura_no, tarih, vade, ara_toplam, kdv, genel_toplam, durum, odeme_durumu)
  VALUES
    (tid2, (SELECT id FROM customers WHERE firma_unvani='Arçelik A.Ş.' AND tenant_id=tid2), 'Arçelik A.Ş.', 'AND-2026-001', '2026-05-09', '2026-06-08', 24000, 4800, 28800, 'odendi', 'odendi'),
    (tid2, (SELECT id FROM customers WHERE firma_unvani='Vestel A.Ş.' AND tenant_id=tid2), 'Vestel A.Ş.', 'AND-2026-002', '2026-05-16', '2026-07-15', 26000, 5200, 31200, 'odendi', 'odendi'),
    (tid2, (SELECT id FROM customers WHERE firma_unvani='Tofaş A.Ş.' AND tenant_id=tid2), 'Tofaş A.Ş.', 'AND-2026-003', '2026-05-26', '2026-07-25', 20000, 4000, 24000, 'odendi', 'odendi'),
    (tid2, (SELECT id FROM customers WHERE firma_unvani='Pınar Süt' AND tenant_id=tid2), 'Pınar Süt', 'AND-2026-004', '2026-06-04', '2026-07-04', 32000, 6400, 38400, 'gonderildi', 'bekleyen'),
    (tid2, (SELECT id FROM customers WHERE firma_unvani='Şişecam A.Ş.' AND tenant_id=tid2), 'Şişecam A.Ş.', 'AND-2026-005', '2026-06-13', '2026-08-12', 28000, 5600, 33600, 'taslak', 'bekleyen');

  -- 5 Expenses
  INSERT INTO expenses (tenant_id, kategori, tarih, tutar, aciklama, plaka, fatura_no)
  VALUES
    (tid2, 'YAKIT', '2026-05-06', 5500, 'BP Ankara mazot ikmali — 06 ANA 001', '06 ANA 001', 'FT-YKT-ANA-01'),
    (tid2, 'SIGORTA', '2026-05-14', 32000, 'Filo kasko yenileme paketi — 06 ANA 002 ve 003', NULL, 'PLS-KAS-ANA-01'),
    (tid2, 'BAKIM', '2026-05-22', 9500, 'Periyodik bakım yağ seti — 06 ANA 004', '06 ANA 004', 'FT-BKM-ANA-01'),
    (tid2, 'MTV', '2026-06-02', 9800, 'MTV 2026 2. taksit — tüm kamyonlar', NULL, NULL),
    (tid2, 'MAAS', '2026-06-10', 95000, 'Mayıs 2026 personel maaşları', NULL, NULL);

  -- 5 Employees
  INSERT INTO employees (tenant_id, ad_soyad, rol, telefon, ehliyet_bitis, src_bitis)
  VALUES
    (tid2, 'Mehmet Koç', 'SOFOR', '05322220002', '2028-01-10', '2027-06-30'),
    (tid2, 'Hasan Polat', 'SOFOR', '05322220003', '2027-07-20', '2026-12-31'),
    (tid2, 'Ayşe Yılmaz', 'MUHASEBE', '05322220004', NULL, NULL),
    (tid2, 'Fatih Kaya', 'OPERASYON', '05322220005', NULL, NULL),
    (tid2, 'Zeynep Özdemir', 'SOFOR', '05322220006', '2028-05-15', '2027-09-30');

  -- 5 Fuel Logs
  INSERT INTO fuel_logs (tenant_id, truck_id, tarih, miktar_litre, birim_fiyat, toplam_tutar, alinan_yer, km_okuma)
  VALUES
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 001' AND tenant_id=tid2), '2026-05-06', 146, 37.67, 5500, 'BP Ankara', 110300),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 002' AND tenant_id=tid2), '2026-05-15', 140, 37.50, 5250, 'Shell Manisa', 155400),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 003' AND tenant_id=tid2), '2026-05-25', 155, 37.50, 5812, 'Petrol Ofisi Bursa', 240500),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 004' AND tenant_id=tid2), '2026-06-03', 130, 38.00, 4940, 'Opet İzmir', 85300),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 005' AND tenant_id=tid2), '2026-06-12', 142, 37.68, 5350, 'BP Kocaeli', 185500);

  -- 5 Maintenance
  INSERT INTO maintenance_records (tenant_id, truck_id, tarih, km, turu, yapilan_islemler, toplam_tutar, fatura_no, servis_adi, sonraki_bakim_km, sonraki_bakim_tarih)
  VALUES
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 004' AND tenant_id=tid2), '2026-05-22', 84000, 'PERIYODIK_BAKIM', 'Yağ değişimi, filtre seti, fren kontrolü', 9500, 'FT-BKM-ANA-01', 'Scania Yetkili Servis', 99000, '2026-11-22'),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 001' AND tenant_id=tid2), '2026-04-10', 105000, 'PERIYODIK_BAKIM', 'Motor yağı, difransiyel yağı, tüm filtreler', 11000, 'FT-BKM-ANA-045', 'Mercedes Benz Servis', 120000, '2026-10-10'),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 003' AND tenant_id=tid2), '2026-03-15', 235000, 'DIGER', 'Turbo şarj değişimi', 22000, 'FT-TMR-ANA-003', 'MAN Yetkili Servis', NULL, NULL),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 002' AND tenant_id=tid2), '2026-05-01', 152000, 'PERIYODIK_BAKIM', 'Yağ + filtre + balata kontrolü', 8500, 'FT-BKM-ANA-046', 'Volvo Yetkili Servis', 167000, '2026-11-01'),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 005' AND tenant_id=tid2), '2026-06-08', 183000, 'LASTIK_DEGISIM', 'Ön aks lastik değişimi 2 adet', 8500, 'FT-LST-ANA-001', 'Lastik Dünyası', NULL, NULL);

  -- 5 Insurance
  INSERT INTO insurance_policies (tenant_id, truck_id, police_no, turu, sigorta_sirketi, baslangic, bitis, prim_tutari)
  VALUES
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 001' AND tenant_id=tid2), 'KAS-ANA-001', 'KASKO', 'Allianz Sigorta', '2026-01-01', '2027-01-01', 38000),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 002' AND tenant_id=tid2), 'ZMM-ANA-001', 'ZMM', 'Anadolu Sigorta', '2026-03-01', '2027-03-01', 9000),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 003' AND tenant_id=tid2), 'KAS-ANA-002', 'KASKO', 'AxA Sigorta', '2026-02-01', '2027-02-01', 25000),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 004' AND tenant_id=tid2), 'ZMM-ANA-002', 'ZMM', 'Anadolu Sigorta', '2026-04-01', '2027-04-01', 8500),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 005' AND tenant_id=tid2), 'KAS-ANA-003', 'KASKO', 'Allianz Sigorta', '2026-05-01', '2027-05-01', 36000);

  -- 5 Toll Logs
  INSERT INTO toll_logs (tenant_id, truck_id, gecis_tarihi, hgs_etiket_no, giris_gise, cikis_gise, gecis_ucreti)
  VALUES
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 001' AND tenant_id=tid2), '2026-05-08', 'HGS-ANA-01', 'İstanbul-Beylikdüzü', 'Ankara-İvedik', 1950),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 002' AND tenant_id=tid2), '2026-05-15', 'HGS-ANA-02', 'Manisa', 'İstanbul-Esenyurt', 1750),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 004' AND tenant_id=tid2), '2026-06-03', 'HGS-ANA-03', 'İzmir-Pınarbaşı', 'İstanbul-Hadımköy', 2100),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 005' AND tenant_id=tid2), '2026-06-12', 'HGS-ANA-04', 'Kocaeli-Gebze', 'İzmir-Kemalpaşa', 2300),
    (tid2, (SELECT id FROM trucks WHERE plaka='06 ANA 003' AND tenant_id=tid2), '2026-05-25', 'HGS-ANA-05', 'Bursa-Osmangazi', 'Ankara-Sincan', 1600);

  -- 5 Cek/Senet
  INSERT INTO cek_senet (tenant_id, customer_id, type, no, tutar, vade_tarihi, status, banka, sube, borclu)
  VALUES
    (tid2, (SELECT id FROM customers WHERE firma_unvani='Arçelik A.Ş.' AND tenant_id=tid2), 'CEK', 'CEK-001-ANA', 45000, '2026-07-20', 'BEKLIYOR', 'İş Bankası', 'Levent', 'Arçelik A.Ş.'),
    (tid2, (SELECT id FROM customers WHERE firma_unvani='Vestel A.Ş.' AND tenant_id=tid2), 'SENET', 'SEN-001-ANA', 32000, '2026-08-15', 'BEKLIYOR', 'Yapı Kredi', 'Manisa', 'Vestel A.Ş.'),
    (tid2, (SELECT id FROM customers WHERE firma_unvani='Tofaş A.Ş.' AND tenant_id=tid2), 'CEK', 'CEK-002-ANA', 28000, '2026-06-30', 'TAHSIL_EDILDI', 'Garanti BBVA', 'Bursa', 'Tofaş A.Ş.'),
    (tid2, (SELECT id FROM customers WHERE firma_unvani='Şişecam A.Ş.' AND tenant_id=tid2), 'CEK', 'CEK-003-ANA', 52000, '2026-09-10', 'BEKLIYOR', 'Akbank', 'Gebze', 'Şişecam A.Ş.'),
    (tid2, (SELECT id FROM customers WHERE firma_unvani='Pınar Süt' AND tenant_id=tid2), 'SENET', 'SEN-002-ANA', 18000, '2026-08-01', 'BEKLIYOR', 'Denizbank', 'Pınarbaşı', 'Pınar Süt');

  -- 5 Notifications
  INSERT INTO notifications (tenant_id, message, read)
  VALUES
    (tid2, '06 ANA 003 muayenesi 2026-10-20 tarihinde sona eriyor.', false),
    (tid2, 'AND-2026-004 fatura 38400 TL bekleyen durumda.', false),
    (tid2, 'Mehmet Koç ehliyeti 2028-01-10 tarihine kadar geçerli.', true),
    (tid2, 'Anadolu Lojistik Unysol platformuna hoş geldiniz!', true),
    (tid2, 'Şişecam A.Ş. 52000 TL çek vadesi yaklaşıyor — 10 Eylül 2026.', false);
END $$;

-- ============================================================
-- TENANT 3: Ege Transport (FREE)
-- ============================================================
DO $$
DECLARE
  tid3 INTEGER;
BEGIN
  INSERT INTO tenants (slug, firma_unvani, plan, locale, country_code, durum)
  VALUES ('ege-transport', 'Ege Transport', 'PRO', 'tr', 'TR', 'AKTIF')
  RETURNING id INTO tid3;

  INSERT INTO users (tenant_id, email, password_hash, ad_soyad, rol, telefon, aktif)
  VALUES (tid3, 'ege@lojistik.com', 'REDACTED', 'Mehmet Ege', 'TENANT_OWNER', '05323330001', true);

  INSERT INTO subscriptions (tenant_id, plan, baslangic, bitis, ucret, status)
  VALUES (tid3, 'PRO', '2026-05-01', '2027-05-01', 200, 'AKTIF');

  -- 5 Trucks
  INSERT INTO trucks (tenant_id, plaka, marka, model, yil, yakit_tipi, tracking_source, km_sayac_baslangic, km_sayac_guncel, aktif, muayene_bitis)
  VALUES
    (tid3, '35 EGE 001', 'Ford', 'Cargo 1842', 2023, 'DIZEL', 'MANUEL', 100000, 135000, true, '2027-02-10'),
    (tid3, '35 EGE 002', 'BMC', 'Tugra', 2024, 'DIZEL', 'PHONE', 45000, 78000, true, '2027-05-20'),
    (tid3, '35 EGE 003', 'Mercedes', 'Axor 1840', 2020, 'DIZEL', 'MANUEL', 350000, 390000, true, '2026-09-15'),
    (tid3, '35 EGE 004', 'Volvo', 'FM 430', 2024, 'DIZEL', 'PHONE', 38000, 72000, true, '2027-06-01'),
    (tid3, '35 EGE 005', 'Scania', 'G410', 2022, 'DIZEL', 'MANUEL', 160000, 195000, true, '2026-11-30');

  -- 5 Customers
  INSERT INTO customers (tenant_id, firma_unvani, yetkili, telefon, email, adres, vergi_dairesi, vergi_no, kategori, bakiye, acik_hesap_limiti, risk_skoru, vade_gun, durum)
  VALUES
    (tid3, 'Tariş Zeytinyağı', 'Hasan Efe', '02564447701', 'lojistik@taris.com', 'Aydın, Efeler', 'Efeler', '3000000001', 'KURUMSAL', 22000, 80000, 'DUSUK', 30, 'AKTIF'),
    (tid3, 'Pınar Et', 'Caner Yıldız', '02324447702', 'sevk@pinar.com', 'İzmir, Pınarbaşı', 'Pınarbaşı', '3000000002', 'KURUMSAL', 35000, 120000, 'DUSUK', 15, 'AKTIF'),
    (tid3, 'Keskinoğlu', 'Ali Keskin', '02364447703', 'info@keskinoglu.com', 'Manisa, Akhisar', 'Akhisar', '3000000003', 'KURUMSAL', 18000, 60000, 'ORTA', 30, 'AKTIF'),
    (tid3, 'Ege Seracılık', 'Mustafa Çiçek', '02424447704', 'info@egeseracilik.com', 'Antalya, Serik', 'Serik', '3000000004', 'KURUMSAL', 15000, 50000, 'ORTA', 30, 'AKTIF'),
    (tid3, 'Uludağ İçecek', 'Ahmet Dağ', '02244447705', 'sevkiyat@uludag.com', 'Bursa, Nilüfer', 'Nilüfer', '3000000005', 'KURUMSAL', 28000, 100000, 'DUSUK', 45, 'AKTIF');

  -- 5 Trips
  INSERT INTO trips (tenant_id, truck_id, customer_id, sofor, yukleme, teslimat, ucret, payment_method, durum, baslangic_tarih, bitis_tarih)
  VALUES
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 001' AND tenant_id=tid3), (SELECT id FROM customers WHERE firma_unvani='Tariş Zeytinyağı' AND tenant_id=tid3), 'İbrahim Güneş', 'Aydın, Efeler', 'İzmir, Alsancak — Zeytinyağı Tankeri', 12000, 'HAVALE', 'TAMAMLANDI', '2026-05-10', '2026-05-10'),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 002' AND tenant_id=tid3), (SELECT id FROM customers WHERE firma_unvani='Pınar Et' AND tenant_id=tid3), 'Süleyman Aydın', 'İzmir, Pınarbaşı', 'İstanbul, Bayrampaşa — Et Ürünleri', 18000, 'KREDI_KARTI', 'TAMAMLANDI', '2026-05-18', '2026-05-19'),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 003' AND tenant_id=tid3), (SELECT id FROM customers WHERE firma_unvani='Keskinoğlu' AND tenant_id=tid3), 'İbrahim Güneş', 'Manisa, Akhisar', 'Ankara, Akyurt — Yumurta Kolileri', 14000, 'HAVALE', 'TAMAMLANDI', '2026-05-28', '2026-05-29'),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 004' AND tenant_id=tid3), (SELECT id FROM customers WHERE firma_unvani='Ege Seracılık' AND tenant_id=tid3), 'Süleyman Aydın', 'Antalya, Serik', 'İstanbul, Bayrampaşa — Serada Sebze', 16000, 'ACIK_HESAP', 'TAMAMLANDI', '2026-06-05', '2026-06-06'),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 005' AND tenant_id=tid3), (SELECT id FROM customers WHERE firma_unvani='Uludağ İçecek' AND tenant_id=tid3), 'İbrahim Güneş', 'Bursa, Nilüfer', 'İzmir, Bornova — İçecek Kasaları', 13000, 'HAVALE', 'AKTIF', '2026-06-15', NULL);

  -- 5 Invoices
  INSERT INTO invoices (tenant_id, customer_id, musteri, fatura_no, tarih, vade, ara_toplam, kdv, genel_toplam, durum, odeme_durumu)
  VALUES
    (tid3, (SELECT id FROM customers WHERE firma_unvani='Tariş Zeytinyağı' AND tenant_id=tid3), 'Tariş Zeytinyağı', 'EGE-2026-001', '2026-05-11', '2026-06-10', 12000, 2400, 14400, 'odendi', 'odendi'),
    (tid3, (SELECT id FROM customers WHERE firma_unvani='Pınar Et' AND tenant_id=tid3), 'Pınar Et', 'EGE-2026-002', '2026-05-19', '2026-06-18', 18000, 3600, 21600, 'odendi', 'odendi'),
    (tid3, (SELECT id FROM customers WHERE firma_unvani='Keskinoğlu' AND tenant_id=tid3), 'Keskinoğlu', 'EGE-2026-003', '2026-05-29', '2026-07-28', 14000, 2800, 16800, 'odendi', 'odendi'),
    (tid3, (SELECT id FROM customers WHERE firma_unvani='Ege Seracılık' AND tenant_id=tid3), 'Ege Seracılık', 'EGE-2026-004', '2026-06-06', '2026-07-06', 16000, 3200, 19200, 'gonderildi', 'bekleyen'),
    (tid3, (SELECT id FROM customers WHERE firma_unvani='Uludağ İçecek' AND tenant_id=tid3), 'Uludağ İçecek', 'EGE-2026-005', '2026-06-16', '2026-08-15', 13000, 2600, 15600, 'taslak', 'bekleyen');

  -- 5 Expenses
  INSERT INTO expenses (tenant_id, kategori, tarih, tutar, aciklama, plaka, fatura_no)
  VALUES
    (tid3, 'YAKIT', '2026-05-08', 4200, 'Shell İzmir mazot ikmali — 35 EGE 001', '35 EGE 001', 'FT-YKT-EGE-01'),
    (tid3, 'LASTIK', '2026-05-16', 18000, '4 adet lastik değişimi — 35 EGE 002', '35 EGE 002', 'FT-LST-EGE-01'),
    (tid3, 'DIGER', '2026-05-25', 7500, 'Şanzıman tamiri — 35 EGE 003', '35 EGE 003', 'FT-TMR-EGE-01'),
    (tid3, 'YAKIT', '2026-06-03', 3800, 'BP Aydın mazot — 35 EGE 004', '35 EGE 004', 'FT-YKT-EGE-02'),
    (tid3, 'KIRA', '2026-06-12', 12000, 'Ofis kirası Haziran 2026 — İzmir', NULL, NULL);

  -- 5 Employees
  INSERT INTO employees (tenant_id, ad_soyad, rol, telefon, ehliyet_bitis, src_bitis)
  VALUES
    (tid3, 'İbrahim Güneş', 'SOFOR', '05323330002', '2027-11-05', '2027-03-31'),
    (tid3, 'Süleyman Aydın', 'SOFOR', '05323330003', '2028-02-14', '2027-08-31'),
    (tid3, 'Emine Karaca', 'MUHASEBE', '05323330004', NULL, NULL),
    (tid3, 'Yusuf Erdoğan', 'OPERASYON', '05323330005', NULL, NULL),
    (tid3, 'Ahmet Yavuz', 'SOFOR', '05323330006', '2027-06-30', '2026-09-15');

  -- 5 Fuel Logs
  INSERT INTO fuel_logs (tenant_id, truck_id, tarih, miktar_litre, birim_fiyat, toplam_tutar, alinan_yer, km_okuma)
  VALUES
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 001' AND tenant_id=tid3), '2026-05-08', 112, 37.50, 4200, 'Shell İzmir', 135300),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 002' AND tenant_id=tid3), '2026-05-16', 130, 37.50, 4875, 'BP İzmir', 78300),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 003' AND tenant_id=tid3), '2026-05-25', 160, 37.20, 5952, 'Opet Manisa', 390500),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 004' AND tenant_id=tid3), '2026-06-03', 101, 37.62, 3800, 'BP Aydın', 72300),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 005' AND tenant_id=tid3), '2026-06-15', 125, 37.50, 4687, 'Shell Bursa', 195400);

  -- 5 Maintenance
  INSERT INTO maintenance_records (tenant_id, truck_id, tarih, km, turu, yapilan_islemler, toplam_tutar, fatura_no, servis_adi, sonraki_bakim_km, sonraki_bakim_tarih)
  VALUES
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 002' AND tenant_id=tid3), '2026-04-20', 75000, 'PERIYODIK_BAKIM', 'Yağ değişimi, hava filtresi, yakıt filtresi', 7800, 'FT-BKM-EGE-01', 'BMC Yetkili Servis', 90000, '2026-10-20'),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 003' AND tenant_id=tid3), '2026-05-25', 390000, 'DIGER', 'Şanzıman revizyonu — vites geçiş sorunu', 7500, 'FT-TMR-EGE-01', 'Mercedes Özel Servis', NULL, NULL),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 001' AND tenant_id=tid3), '2026-03-10', 130000, 'PERIYODIK_BAKIM', 'Motor yağı, şanzıman yağı, tüm filtreler', 9200, 'FT-BKM-EGE-042', 'Ford Yetkili Servis', 145000, '2026-09-10'),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 004' AND tenant_id=tid3), '2026-05-01', 69000, 'PERIYODIK_BAKIM', 'İlk bakım — motor yağı + filtreler', 5500, 'FT-BKM-EGE-043', 'Volvo Yetkili Servis', 84000, '2026-11-01'),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 005' AND tenant_id=tid3), '2026-06-10', 193000, 'LASTIK_DEGISIM', 'Arka aks 4 adet lastik değişimi', 22000, 'FT-LST-EGE-002', 'Oto Lastik İzmir', NULL, NULL);

  -- 5 Insurance
  INSERT INTO insurance_policies (tenant_id, truck_id, police_no, turu, sigorta_sirketi, baslangic, bitis, prim_tutari)
  VALUES
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 001' AND tenant_id=tid3), 'KAS-EGE-001', 'KASKO', 'Mapfre Sigorta', '2026-01-01', '2027-01-01', 26000),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 002' AND tenant_id=tid3), 'ZMM-EGE-001', 'ZMM', 'Anadolu Sigorta', '2026-03-15', '2027-03-15', 8000),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 003' AND tenant_id=tid3), 'KAS-EGE-002', 'KASKO', 'Allianz Sigorta', '2026-02-01', '2027-02-01', 20000),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 004' AND tenant_id=tid3), 'ZMM-EGE-002', 'ZMM', 'Anadolu Sigorta', '2026-04-01', '2027-04-01', 7500),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 005' AND tenant_id=tid3), 'KAS-EGE-003', 'KASKO', 'Mapfre Sigorta', '2026-05-01', '2027-05-01', 30000);

  -- 5 Toll Logs
  INSERT INTO toll_logs (tenant_id, truck_id, gecis_tarihi, hgs_etiket_no, giris_gise, cikis_gise, gecis_ucreti)
  VALUES
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 002' AND tenant_id=tid3), '2026-05-18', 'HGS-EGE-01', 'İzmir', 'İstanbul-Bayrampaşa', 1750),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 004' AND tenant_id=tid3), '2026-06-05', 'HGS-EGE-02', 'Antalya-Serik', 'İstanbul-Bayrampaşa', 2500),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 005' AND tenant_id=tid3), '2026-06-15', 'HGS-EGE-03', 'Bursa-Nilüfer', 'İzmir-Bornova', 1200),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 003' AND tenant_id=tid3), '2026-05-28', 'HGS-EGE-04', 'Manisa', 'Ankara-Akyurt', 1850),
    (tid3, (SELECT id FROM trucks WHERE plaka='35 EGE 001' AND tenant_id=tid3), '2026-05-10', 'HGS-EGE-05', 'Aydın', 'İzmir-Alsancak', 450);

  -- 5 Cek/Senet
  INSERT INTO cek_senet (tenant_id, customer_id, type, no, tutar, vade_tarihi, status, banka, sube, borclu)
  VALUES
    (tid3, (SELECT id FROM customers WHERE firma_unvani='Tariş Zeytinyağı' AND tenant_id=tid3), 'CEK', 'CEK-001-EGE', 22000, '2026-07-10', 'BEKLIYOR', 'Ziraat Bankası', 'Aydın', 'Tariş Zeytinyağı'),
    (tid3, (SELECT id FROM customers WHERE firma_unvani='Ege Seracılık' AND tenant_id=tid3), 'SENET', 'SEN-001-EGE', 15000, '2026-08-20', 'BEKLIYOR', 'Vakıfbank', 'Antalya', 'Ege Seracılık'),
    (tid3, (SELECT id FROM customers WHERE firma_unvani='Pınar Et' AND tenant_id=tid3), 'CEK', 'CEK-002-EGE', 35000, '2026-06-25', 'BEKLIYOR', 'İş Bankası', 'İzmir', 'Pınar Et'),
    (tid3, (SELECT id FROM customers WHERE firma_unvani='Keskinoğlu' AND tenant_id=tid3), 'CEK', 'CEK-003-EGE', 18000, '2026-05-20', 'TAHSIL_EDILDI', 'Garanti BBVA', 'Manisa', 'Keskinoğlu'),
    (tid3, (SELECT id FROM customers WHERE firma_unvani='Uludağ İçecek' AND tenant_id=tid3), 'SENET', 'SEN-002-EGE', 28000, '2026-09-05', 'BEKLIYOR', 'Yapı Kredi', 'Bursa', 'Uludağ İçecek');

  -- 5 Notifications
  INSERT INTO notifications (tenant_id, message, read)
  VALUES
    (tid3, '35 EGE 003 muayenesi 15 Eylül 2026 da sona eriyor — hemen randevu alın.', false),
    (tid3, 'EGE-2026-005 fatura taslak durumda. Göndermeyi unutmayın.', false),
    (tid3, 'Hoş geldiniz! Ege Transport Unysol''e başarıyla kaydoldu.', true),
    (tid3, 'Ahmet Yavuz SRC belgesi 2026-09-15 de sona eriyor.', false),
    (tid3, 'Pınar Et 35.000 TL çek vadesi 25 Haziran — 1 ay kaldı.', false);
END $$;

COMMIT;
