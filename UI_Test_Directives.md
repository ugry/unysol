# Unysol — UI Test Directives (Kesin Kurallar)

> **Amaç:** Her modül için standart, tekrarlanabilir UI + API test süreci.  
> **Kural:** BİR modül = BİR test oturumu. Asla birden fazla modülü aynı anda test etme.  
> **Her test başlı başına bir seanstır. Sonuçlar modül adıyla kaydedilir.**

---

## 0. GENEL KURALLAR (TÜM MODÜLLER İÇİN)

### 0.1 Her Modül İçin Zorunlu Test Adımları

```
1. YENİ KAYIT OLUŞTUR
   → Tüm alanları doldur (boş alan bırakma)
   → Zorunlu alanların hepsini gir
   → Opsiyonel alanları da doldur
   → Kaydet butonuna bas

2. LİSTELE
   → Oluşturulan kayıt listede görünmeli
   → Tüm kolonlar doğru veriyi göstermeli

3. DÜZENLE (TÜM DEĞİŞKENLERİ)
   → Kaydı aç
   → Her bir alanı TEK TEK değiştir
   → Her değişiklikte kaydet
   → Değişikliğin listeye yansıdığını kontrol et

4. SİL
   → Kaydı sil
   → Onay dialog'unu kontrol et ("Bu işlem geri alınamaz...")
   → Silme sonrası kaydın listede olmadığını doğrula

5. TOPLU İŞLEMLER (varsa)
   → Birden çok kayıt seç (checkbox)
   → Tümünü seç
   → Toplu sil
   → Toplu dışa aktar (CSV, Excel, PDF)

6. PAYLAŞ (varsa)
   → Email paylaşımı
   → WhatsApp paylaşımı
   → Panoya kopyalama

7. FİLTRELEME / ARAMA
   → Arama kutusuna metin gir
   → Sonuçların filtrelendiğini kontrol et

8. BOŞ DURUM
   → Tüm kayıtları sil
   → "Henüz kayıt bulunmuyor" mesajını kontrol et

9. SIRALAMA
   → Her sıralanabilir kolona tıkla
   → Artan/azalan sıralamayı kontrol et

10. DIŞA AKTAR
    → CSV export
    → Excel export
    → PDF export
```

### 0.2 Test Ortamı

```
Browser:   Playwright Chromium headless
Viewport:  1440×900
Base URL:  http://localhost:5174
API URL:   http://localhost:8080

Test Kullanıcısı:
  Email:    demo@unysol.com
  Password: Demo1234!
  Tenant:   Demo Nakliyat (id=4)

Admin Kullanıcısı (admin testleri için):
  Email:    admin@unysol.com
  Password: Admin1234!
  (varsa)
```

### 0.3 Kanıt Kuralları

```
Her GEÇEN test için EN AZ BİR kanıt:
  ☐ Screenshot (.png — /tmp/unysol_shots/{module}/)
  ☐ API response log (JSON çıktısı)
  ☐ DB query (docker exec psql -c "SELECT ...")

Her KALAN test için HEPSİ:
  ☐ Screenshot (hata durumu)
  ☐ Hata mesajı
  ☐ Root cause analysis (NEDEN kaldı?)
```

### 0.4 Test İsimlendirme

```
Test sonuç dosyası: {module_name}_UI_and_API_Test_results.md

Örnekler:
  truck_UI_and_API_Test_results.md
  trip_UI_and_API_Test_results.md
  customer_UI_and_API_Test_results.md
  invoice_UI_and_API_Test_results.md
  expense_UI_and_API_Test_results.md
  employee_UI_and_API_Test_results.md
  cek_senet_UI_and_API_Test_results.md
  predictions_UI_and_API_Test_results.md

Screenshot klasörü: /tmp/unysol_shots/{module_name}/
  Örnek: /tmp/unysol_shots/truck/01_page_load.png
```

### 0.5 Modül Sayfası URL'leri

| Modül | Frontend URL | API Prefix |
|-------|-------------|------------|
| Dashboard | /dashboard | /api/tenant/dashboard/ |
| Trucks | /dashboard/trucks | /api/tenant/trucks/ |
| Trips | /dashboard/trips | /api/tenant/trips/ |
| Customers | /dashboard/customers | /api/tenant/customers/ |
| Invoices | /dashboard/invoices | /api/tenant/invoices/ |
| Expenses | /dashboard/expenses | /api/tenant/expenses/ |
| Employees | /dashboard/employees | /api/tenant/employees/ |
| CekSenet | /dashboard/cek-senet | /api/tenant/cek-senet/ |
| Predictions | /dashboard/predictions | /api/tenant/predictions/ |
| Settings | /dashboard/settings | /api/tenant/settings/ |
| Actions | /dashboard/actions | /api/tenant/actions/ |

---

## 1. MODÜL BAZINDA TEST ŞABLONU

### 1.1 Test Script Template (Python + Playwright)

```python
from playwright.sync_api import sync_playwright
import json, os, subprocess

MODULE = "truck"  # her modül için değiştir
BASE_URL = "http://localhost:5174"
API_URL = "http://localhost:8080"
SHOT_DIR = f"/tmp/unysol_shots/{MODULE}"
os.makedirs(SHOT_DIR, exist_ok=True)

TESTS = []
TOKEN = None

def api(method, path, data=None):
    headers = {"Content-Type": "application/json"}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    import requests
    url = f"{API_URL}{path}"
    if method == "GET":
        r = requests.get(url, headers=headers)
    elif method == "POST":
        r = requests.post(url, headers=headers, json=data)
    elif method == "PUT":
        r = requests.put(url, headers=headers, json=data)
    elif method == "DELETE":
        r = requests.delete(url, headers=headers)
    return r.status_code, r.json()

def db_query(sql):
    result = subprocess.run(
        ["docker", "exec", "unysol-db", "psql", "-U", "unysol", "-d", "unysol", "-c", sql],
        capture_output=True, text=True
    )
    return result.stdout

def screenshot(page, name):
    page.screenshot(path=f"{SHOT_DIR}/{name}.png", full_page=True)

def test(name, result, proof=""):
    status = "✅" if result else "❌"
    TESTS.append({"name": name, "status": status, "proof": proof})
    print(f"  {status} {name}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # ---------------------------------------------------------------
    # AUTH
    # ---------------------------------------------------------------
    print("\n=== AUTH ===")
    
    # Login via API
    code, data = api("POST", "/api/auth/login", {
        "email": "demo@unysol.com",
        "password": "Demo1234!"
    })
    TOKEN = data.get("access_token", "")
    auth_ok = code == 200 and TOKEN != ""
    test("Login via API", auth_ok, f"HTTP {code}, token={'OK' if TOKEN else 'FAIL'}")

    # Login via UI
    page.goto(f"{BASE_URL}/login")
    page.fill('input[type="email"]', "demo@unysol.com")
    page.fill('input[type="password"]', "Demo1234!")
    page.click('button[type="submit"]')
    page.wait_for_timeout(2000)
    ui_login = "dashboard" in page.url
    test("Login via UI", ui_login, f"URL: {page.url}")
    screenshot(page, "00_login")

    # ---------------------------------------------------------------
    # NAVIGATE TO MODULE
    # ---------------------------------------------------------------
    print(f"\n=== MODULE: {MODULE.upper()} ===")
    
    page.goto(f"{BASE_URL}/dashboard/{MODULE.replace('_', '-')}")
    page.wait_for_timeout(2000)
    content = page.locator("body").inner_text()
    test(f"Page renders ({MODULE})", len(content) > 100, f"{len(content)} chars")
    screenshot(page, "01_page_load")

    # ---------------------------------------------------------------
    # ADD MODULE-SPECIFIC TESTS HERE
    # ---------------------------------------------------------------
    
    # === CREATE RECORD ===
    # Click "Yeni Ekle" button
    page.click('button:has-text("Yeni Ekle"), button:has-text("Ekle"), button:has-text("Add")')
    page.wait_for_timeout(1000)
    # Fill form fields here (module-specific)
    # Click save
    page.click('button:has-text("Kaydet"), button:has-text("Save")')
    page.wait_for_timeout(2000)
    
    # === SELECT ROW VIA CHECKBOX (ACTIVATES EDIT/DELETE) ===
    # Check the first row's checkbox to activate edit/delete buttons
    # The "select all" checkbox is typically index 0, first row is index 1
    checkboxes = page.locator('input[type="checkbox"]')
    if checkboxes.count() > 1:
        checkboxes.nth(1).click()  # select first data row
    page.wait_for_timeout(500)
    
    # Now edit/delete buttons should be visible
    # === EDIT ===
    # Click edit button (pencil icon or "Düzenle" button)
    page.click('button:has-text("Düzenle"), [data-testid="edit-btn"], button svg.lucide-pencil')
    page.wait_for_timeout(1000)
    # Change fields and save...
    
    # === DELETE ===
    # Select checkbox again (if needed), click delete
    page.click('button:has-text("Sil"), [data-testid="delete-btn"], button svg.lucide-trash')
    page.wait_for_timeout(500)
    # Confirm deletion dialog
    page.click('button:has-text("Evet"), button:has-text("Sil"), button:has-text("Confirm")')
    page.wait_for_timeout(1000)
    
    # === BULK OPERATIONS ===
    # Select all rows
    checkboxes.nth(0).click()  # select all
    # Test bulk delete, bulk export, etc.
    
    # CREATE, EDIT, DELETE, LIST, FILTER, SORT, EXPORT, SHARE, BULK, EMPTY STATE

    # ---------------------------------------------------------------
    # SUMMARY
    # ---------------------------------------------------------------
    print(f"\n=== RESULTS: {MODULE.upper()} ===")
    passed = sum(1 for t in TESTS if t["status"] == "✅")
    failed = sum(1 for t in TESTS if t["status"] == "❌")
    print(f"  Passed: {passed}/{len(TESTS)}")
    print(f"  Failed: {failed}/{len(TESTS)}")

    browser.close()
```

### 1.2 Her Modül İçin Özel Test Adımları

#### TRUCKS MODULE

⚠ KRİTİK: Düzenle/Sil/Paylaş butonları ANCAK kayıt solundaki checkbox işaretlenince görünür!

```
TEST # | ACTION | EXPECTED | PROOF TYPE
-------|--------|----------|-----------
1 | Sayfaya git /dashboard/trucks | Sayfa yüklenir, >100 char | Screenshot
2 | "Yeni Ekle" butonuna bas | Modal açılır | Screenshot
3 | Plaka gir: "34 UNY 001" | 
4 | Marka gir: "Ford" | 
5 | Model gir: "Cargo 1842" | 
6 | Yıl gir: 2023 | 
7 | Yakıt Tipi seç: "DIZEL" | 
8 | Takip Yöntemi seç: "MANUEL" | 
9 | Kaydet butonuna bas | Modal kapanır, liste güncellenir | Screenshot + API
10 | API: GET /api/tenant/trucks/ | 200, yeni kayıt listede | API log
11 | DB: SELECT * FROM trucks WHERE plaka='34 UNY 001' | 1 row, tüm alanlar doğru | DB query
12 | ⚠ Kaydın SOLUNDAKİ CHECKBOX'I İŞARETLE | Düzenle/Sil/Paylaş butonları BELİRİR | Screenshot (butonlar görünür)
13 | Düzenle butonuna tıkla | Modal açılır, mevcut veri dolu | Screenshot
14 | Marka değiştir: "Mercedes" | 
15 | Kaydet | Liste güncellenir | Screenshot
16 | Tekrar checkbox'ı işaretle → Düzenle | 
17 | Model değiştir: "Actros 1845" | 
18 | Kaydet | Liste güncellenir | Screenshot
19 | Tekrar checkbox'ı işaretle → Düzenle | 
20 | Yıl değiştir: 2024 | 
21 | Kaydet | Liste güncellenir | Screenshot
22 | API: plaka='34 UNY 001' GET | marka='Mercedes', model='Actros 1845', yil=2024 | API log
23 | ⚠ Checkbox'ı işaretle → Sil butonuna tıkla | Onay dialog'u açılır | Screenshot
24 | Onayla | Kayıt listeden silinir | Screenshot + API
25 | API: GET /api/tenant/trucks/ | 200, kayıt yok | API log
26 | DB: SELECT * FROM trucks WHERE plaka='34 UNY 001' | 0 rows | DB query
27 | Yeni 5 kamyon ekle (via curl, toplu test için) | 5 kayıt listede | Screenshot
28 | ⚠ Tümünü seç (en üst checkbox) | Tüm satırlar seçilir, Toplu Sil görünür | Screenshot
29 | Toplu Sil butonuna tıkla → Onayla | Tüm kayıtlar silinir | Screenshot
30 | Boş durum mesajı | "Henüz kayıt bulunmuyor" | Screenshot
31 | CSV export (her zaman görünür) | Dosya indirilir | 
32 | Excel export (her zaman görünür) | Dosya indirilir | 
33 | PDF export (her zaman görünür) | Dosya indirilir | 
34 | Kolon sırala (plaka) | Artan/Azalan | Screenshot
35 | Kolon sırala (marka) | Artan/Azalan | Screenshot
```

#### TRIPS MODULE
```
TEST # | ACTION | EXPECTED | PROOF TYPE
-------|--------|----------|-----------
1 | Sayfaya git /dashboard/trips | Sayfa yüklenir | Screenshot
2 | "Yeni Ekle" butonu | Modal açılır | Screenshot
3 | Kamyon seç (dropdown), Şoför gir: "Mehmet Demir" | 
4 | Müşteri seç, Yükleme: "İstanbul", Teslimat: "Ankara" | 
5 | Ücret: 15000, Ödeme: "HAVALE", Durum: "AKTIF" | 
6 | Kaydet | Liste güncellenir | Screenshot + API
7 | API: GET /api/tenant/trips/ | 200, yeni sefer listede | API log
8 | DB: SELECT * FROM trips WHERE sofor='Mehmet Demir' | 1 row | DB query
9 | ⚠ Kaydın SOLUNDAKİ CHECKBOX'INI İŞARETLE | Düzenle/Sil butonları BELİRİR | Screenshot
10 | Düzenle → şoför değiştir: "Ali Yılmaz" | Kaydet | Screenshot
11 | Checkbox seç → Düzenle → ücret: 18000 | Kaydet | Screenshot
12 | Checkbox seç → Düzenle → teslimat: "İzmir" | Kaydet | Screenshot
13 | API: verify ALL changes | Tüm değişiklikler DB'de | API + DB
14 | Checkbox seç → Sil → Onayla | Kayıt gider | Screenshot + API
15 | DB: verify deletion | 0 rows | DB query
16 | Boş durum | "Henüz kayıt bulunmuyor" | Screenshot
17 | Yeni 3 sefer ekle (curl) → Tümünü Seç → Toplu Sil | Hepsi silinir | Screenshot
18 | Export CSV/Excel/PDF | Dosya indirilir |
```

#### CUSTOMERS MODULE
```
TEST # | ACTION | EXPECTED | PROOF TYPE
-------|--------|----------|-----------
1 | Sayfaya git /dashboard/customers | Sayfa yüklenir (mevcut 302 kayıt) | Screenshot
2 | Arama yap: "Aras" | Sadece Aras Kargo kayıtları | Screenshot
3 | Arama temizle | Tüm kayıtlar geri gelir | Screenshot
4 | "Yeni Ekle" | Modal açılır | Screenshot
5 | Firma Unvanı: "Test Lojistik Ltd" | 
6 | Yetkili: "Test Kullanıcı" | 
7 | Telefon: "5551234567" | 
8 | Email: "test@testlojistik.com" | 
9 | Adres: "İstanbul, Kadıköy" | 
10 | Vergi Dairesi: "Kadıköy" | 
11 | Vergi No: "1234567890" | 
12 | Kaydet | Liste güncellenir | Screenshot + API
13 | API: GET /api/tenant/customers/ | 200, yeni kayıt listede | API log
14 | DB: SELECT * FROM customers WHERE firma_unvani='Test Lojistik Ltd' | 1 row | DB query
15 | Düzenle — firma_unvani: "Test Lojistik A.Ş." | 
16 | Düzenle — telefon: "5559876543" | 
17 | Düzenle — email: "info@testlojistik.com" | 
18 | Düzenle — yetkili: "Ayşe Yılmaz" | 
19 | Düzenle — adres: "Ankara, Çankaya" | 
20 | Kaydet | Liste güncellenir | Screenshot + API
21 | API: verify ALL changed fields | Tüm değişiklikler DB'de | API log + DB query
22 | Sil — onay — kayıt gider | Kayıt listeden silinir | Screenshot + API
23 | DB: verify deletion | 0 rows for firma_unvani='Test Lojistik A.Ş.' | DB query
24 | CSV / Excel / PDF export | Dosya indirilir | 
25 | Kolon sırala (firma_unvani) | Artan/Azalan | Screenshot
26 | Kolon sırala (bakiye) | Artan/Azalan | Screenshot
```

#### INVOICES MODULE
```
TEST # | ACTION | EXPECTED | PROOF TYPE
-------|--------|----------|-----------
1 | Sayfaya git /dashboard/invoices | Sayfa yüklenir (mevcut 301 kayıt) | Screenshot
2 | "Yeni Ekle" | Modal açılır | Screenshot
3 | Müşteri seç | 
4 | Fatura Tipi: "SATIS" | 
5 | Tarih: "2026-05-25" | 
6 | Vade: "2026-06-25" | 
7 | Para Birimi: "TRY" | 
8 | Kalem ekle — ürün: "Nakliye Hizmeti" | 
9 | Kalem — miktar: 1, birim: "adet" | 
10 | Kalem — birim fiyat: 15000 | 
11 | Kalem — KDV: 20 | 
12 | Kaydet | Hesaplamalar doğru: ara_toplam=15000, kdv=3000, genel_toplam=18000 | API log
13 | API: GET /api/tenant/invoices/ | 200, yeni fatura listede | API log
14 | DB: verify fatura_no, genel_toplam, kdv | Hesaplamalar doğru | DB query
15 | Düzenle — vade değiştir: "2026-07-25" | 
16 | Düzenle — kalem birim fiyat değiştir: 20000 | 
17 | Kaydet | genel_toplam yeniden hesaplanır: 24000 | API log
18 | Sil — onay — kayıt gider | Kayıt silinir | Screenshot
19 | CSV / Excel / PDF export | Dosya indirilir | 
20 | Filtrele: durum="odendi" | Sadece ödenmiş faturalar | Screenshot
```

#### EXPENSES MODULE
```
TEST # | ACTION | EXPECTED | PROOF TYPE
-------|--------|----------|-----------
1 | Sayfaya git /dashboard/expenses | Sayfa yüklenir (mevcut 346 kayıt) | Screenshot
2 | "Yeni Ekle" | Modal açılır | Screenshot
3 | Kategori seç: "YAKIT" | 
4 | Tarih gir: "2026-05-25" | 
5 | Tutar gir: 3500.50 | 
6 | Açıklama gir: "Shell Kadıköy mazot" | 
7 | Plaka gir: "34 TEST 123" | 
8 | Fatura No (opsiyonel): "FT-2026-001" | 
9 | Kaydet | Liste güncellenir | Screenshot + API
10 | API: GET /api/tenant/expenses/ | 200, yeni gider listede | API log
11 | DB: SELECT * FROM expenses WHERE aciklama='Shell Kadıköy mazot' | 1 row | DB query
12 | Düzenle — kategori: "BAKIM" | 
13 | Düzenle — tutar: 5000 | 
14 | Düzenle — açıklama: "Periyodik bakım" | 
15 | Kaydet | Liste güncellenir | Screenshot + API
16 | API: verify ALL changes | Tüm değişiklikler DB'de | API log + DB query
17 | Sil — onay — kayıt gider | Kayıt silinir | Screenshot + API
18 | DB: verify deletion | 0 rows | DB query
19 | CSV / Excel / PDF export | Dosya indirilir | 
20 | Filtrele: kategori="YAKIT" | Sadece yakıt giderleri | Screenshot
```

#### EMPLOYEES MODULE
```
TEST # | ACTION | EXPECTED | PROOF TYPE
-------|--------|----------|-----------
1 | Sayfaya git /dashboard/employees | Sayfa yüklenir | Screenshot
2 | "Yeni Ekle" | Modal açılır | Screenshot
3 | Ad Soyad: "Mehmet Yılmaz" | 
4 | Rol: "SOFOR" | 
5 | Telefon: "5551112233" | 
6 | Ehliyet Bitiş: "2028-06-15" | 
7 | SRC Bitiş: "2027-12-31" | 
8 | Kaydet | Liste güncellenir | Screenshot + API
9 | API: GET /api/tenant/employees/ | 200, yeni kayıt listede | API log
10 | DB: SELECT * FROM employees WHERE ad_soyad='Mehmet Yılmaz' | 1 row | DB query
11 | Düzenle — ad_soyad: "Mehmet Ali Yılmaz" | 
12 | Düzenle — telefon: "5559876543" | 
13 | Düzenle — rol: "SEF" | 
14 | Düzenle — ehliyet_bitis: "2029-06-15" | 
15 | Düzenle — src_bitis: "2028-12-31" | 
16 | Kaydet | Liste güncellenir | Screenshot + API
17 | API: verify ALL changes | Tüm değişiklikler DB'de | API log + DB query
18 | Sil — onay — kayıt gider | Kayıt silinir | Screenshot + API
19 | DB: verify deletion | 0 rows | DB query
20 | Boş durum | "Henüz kayıt bulunmuyor" | Screenshot
```

#### CEK_SENET MODULE
```
TEST # | ACTION | EXPECTED | PROOF TYPE
-------|--------|----------|-----------
1 | Sayfaya git /dashboard/cek-senet | Sayfa yüklenir | Screenshot
2 | "Yeni Ekle" | Modal açılır | Screenshot
3 | Tür: "CEK" | 
4 | Seri No: "C-2026-001" | 
5 | Tutar: 50000 | 
6 | Vade Tarihi: "2026-08-15" | 
7 | Banka: "Garanti BBVA" | 
8 | Şube: "Levent" | 
9 | Hesap No: "TR1234567890" | 
10 | Keşideci: "XYZ İnşaat Ltd" | 
11 | Açıklama: "Şantiye sevkiyatı çeki" | 
12 | Kaydet | Liste güncellenir, status="BEKLIYOR" | Screenshot + API
13 | API: GET /api/tenant/cek-senet/ | 200, yeni kayıt listede | API log
14 | DB: SELECT * FROM cek_senet WHERE seri_no='C-2026-001' | 1 row | DB query
15 | Düzenle — tutar: 75000 | 
16 | Düzenle — vade_tarihi: "2026-09-15" | 
17 | Düzenle — banka: "İş Bankası" | 
18 | Düzenle — keşideci: "ABC Ltd" | 
19 | Kaydet | Liste güncellenir | Screenshot + API
20 | API: verify ALL changes | Tüm değişiklikler DB'de | API log + DB query
21 | Durum güncelle: "TAHSILDE" | Status badge değişir | Screenshot + API
22 | Sil — onay — kayıt gider | Kayıt silinir | Screenshot + API
23 | DB: verify deletion | 0 rows | DB query
```

#### PREDICTIONS MODULE
```
TEST # | ACTION | EXPECTED | PROOF TYPE
-------|--------|----------|-----------
1 | Sayfaya git /dashboard/predictions | Sayfa yüklenir | Screenshot
2 | 12 aylık tahmin chart'ı görünür | Chart render eder | Screenshot
3 | Gelir sütunu | Sayısal değerler | Screenshot
4 | Gider sütunu | Sayısal değerler | Screenshot
5 | Kar sütunu | Sayısal değerler (gelir - gider) | Screenshot
6 | Özet kartları | Toplam gelir, toplam gider, toplam kar | Screenshot
7 | "Yeniden Hesapla" butonu | Tahminler güncellenir | Screenshot
8 | API: GET /api/tenant/predictions/12-months | 200, 12 elemanlı dizi | API log
```

---

## 2. TEST SONUÇ DOSYASI FORMATI

Her modülün test sonuç dosyası şu formatta olmalıdır:

```markdown
# {Module Name} — UI & API Test Results

> **Test Session:** #{n}  
> **Date:** DD Month 2026  
> **Module:** {Module Turkish Name}  
> **Method:** Playwright Chromium Headless + curl + docker exec psql  
> **Base URL:** http://localhost:5174  

---

## 1. TEST SUMMARY

| Total Tests | Passed | Failed | Pass Rate |
|:---:|:---:|:---:|:---:|
| {N} | {pass} | {fail} | {rate}% |

---

## 2. TEST DETAILS

### 2.1 Page Load & Navigation

| # | Action | Expected | Actual | Proof | Status |
|---|--------|----------|--------|-------|:---:|
| 1 | Navigate to /dashboard/{module} | Page content > 100 chars | {N} chars | Screenshot | ✅/❌ |

### 2.2 Create Record

| # | Action | Expected | Actual | Proof | Status |
|---|--------|----------|--------|-------|:---:|

### 2.3 Edit All Variables

| # | Variable | Old Value | New Value | Saved? | Proof | Status |
|---|----------|-----------|-----------|:---:|-------|:---:|

### 2.4 Delete Record

| # | Action | Expected | Actual | Proof | Status |
|---|--------|----------|--------|-------|:---:|

### 2.5 Bulk Operations

| # | Action | Expected | Actual | Proof | Status |
|---|--------|----------|--------|-------|:---:|

### 2.6 Export

| # | Format | Expected | Actual | Proof | Status |
|---|--------|----------|--------|-------|:---:|

### 2.7 Filter & Sort

| # | Action | Expected | Actual | Proof | Status |
|---|--------|----------|--------|-------|:---:|

---

## 3. API VERIFICATION

| # | Endpoint | Method | Expected | Actual | Status |
|---|----------|:---:|----------|--------|:---:|

---

## 4. DB INTEGRITY

| # | Query | Expected | Actual | Status |
|---|-------|----------|--------|:---:|

---

## 5. BUGS FOUND

| # | Bug | Severity | Root Cause | Status |
|---|-----|:---:|------------|:---:|

---

## 6. SCREENSHOTS

| File | What |
|------|------|
| /tmp/unysol_shots/{module}/01_page_load.png | Page initial load |
| ...
```

---

## 3. ÇALIŞTIRMA SIRASI

```
1. Fix 4 backend bugs (B1-B4) → rebuild Docker → restart
2. Module 1: Truck       → truck_UI_and_API_Test_results.md
3. Module 2: Trip        → trip_UI_and_API_Test_results.md
4. Module 3: Customer    → customer_UI_and_API_Test_results.md
5. Module 4: Invoice     → invoice_UI_and_API_Test_results.md
6. Module 5: Expense     → expense_UI_and_API_Test_results.md
7. Module 6: Employee    → employee_UI_and_API_Test_results.md
8. Module 7: CekSenet    → cek_senet_UI_and_API_Test_results.md
9. Module 8: Predictions → predictions_UI_and_API_Test_results.md
10. Commit all → push to GitHub
```

---

## 4. KRİTİK UI DAVRANIŞI — CHECKBOX SEÇİM MEKANİZMASI

> **⚠ HAYATİ BİLGİ:** Tüm butonlar (Düzenle, Sil, Toplu Sil, Dışa Aktar, Paylaş)  
> **ANCAK** kullanıcı kayıt satırının solundaki checkbox'ı işaretlediğinde aktif olur/görünür hale gelir.  
> Bu DataGrid bileşeninin standart davranışıdır. Hiçbir satır seçili değilken sadece "Yeni Ekle" 
> ve "Dışa Aktar" butonları görünür. Bir satır seçildiğinde Düzenle, Sil, Paylaş butonları belirir.

### 4.1 DataGrid Buton Görünürlük Mantığı

```
HİÇBİR SATIR SEÇİLİ DEĞİL:
  ✓ Yeni Ekle
  ✓ Dışa Aktar (CSV, Excel, PDF) — her zaman görünür
  ✗ Düzenle            — GİZLİ (satır seçilince görünür)
  ✗ Sil                — GİZLİ (satır seçilince görünür)
  ✗ Toplu Sil          — GİZLİ (en az 1 satır seçilince görünür)
  ✗ Paylaş             — GİZLİ (satır seçilince görünür)

BİR SATIR SEÇİLİ (tek checkbox işaretli):
  ✓ Yeni Ekle
  ✓ Dışa Aktar
  ✓ Düzenle            — GÖRÜNÜR (seçili satır için)
  ✓ Sil                — GÖRÜNÜR (seçili satır için)
  ✓ Toplu Sil          — GÖRÜNÜR
  ✓ Paylaş             — GÖRÜNÜR (Email, WhatsApp, Panoya Kopyala)

BİRDEN ÇOK SATIR SEÇİLİ:
  ✓ Yeni Ekle
  ✓ Dışa Aktar
  ✗ Düzenle            — GİZLİ (birden çok satırda düzenleme yapılamaz)
  ✓ Toplu Sil          — GÖRÜNÜR
  ✓ Toplu Paylaş       — GÖRÜNÜR
  ✓ Toplu Dışa Aktar   — GÖRÜNÜR (seçili satırlar için)

TÜMÜ SEÇİLİ (select all checkbox):
  Yukarıdaki "birden çok satır" durumu ile aynı.
```

### 4.2 Doğru Test Akışı (Checkbox Tabanlı)

```
1. Sayfa yüklenir → sadece "Yeni Ekle" ve "Export" butonları görünür
2. Kayıt oluştur → "Yeni Ekle" butonuna tıkla → modal → doldur → kaydet
3. Kayıt listede görünür → solundaki checkbox'a TIKLA (işaretle)
4. Düzenle/Sil/Paylaş butonları BELİRİR
5. Düzenle butonuna tıkla → modal açılır → alanları değiştir → kaydet
6. Kaydı tekrar seç (checkbox) → Sil butonuna tıkla → onay dialog'u → sil
7. Kayıt listeden kaybolur
```

### 4.3 Playwright Test Kodunda Checkbox Seçimi

```python
# Sayfadaki ilk kaydın checkbox'ını bul ve işaretle
# DataGrid checkbox'ları genelde şu selector ile bulunur:
page.click('input[type="checkbox"]')           # ilk checkbox (genelde "select all")
page.click('tr input[type="checkbox"]')        # satır checkbox'ları
page.click('tbody tr:first-child input[type="checkbox"]')  # ilk satırın checkbox'ı

# VEYA daha güvenilir: label/div tıklaması ile
page.click('[data-testid="row-checkbox"]:first-child')
page.locator('input[type="checkbox"]').nth(1).click()  # ilk satır (0 = select all)
```

---

## 5. KESİN KURALLAR (NON-NEGOTIABLE)

```
1.  BİR modül = BİR test oturumu. Aynı anda iki modül test ETME.
2.  HER kayıt için TÜM alanları doldur (boş alan bırakma).
3.  Düzenleme yaparken HER DEĞİŞKENİ tek tek değiştir.
4.  Her test için KANIT zorunlu (screenshot, API log, DB query).
5.  KALAN testler için ROOT CAUSE ANALYSIS yap.
6.  Test sonuçlarını modül adıyla kaydet: {module}_UI_and_API_Test_results.md
7.  Screenshot'ları /tmp/unysol_shots/{module}/ altında tut.
8.  API testlerini curl ile, DB testlerini docker exec psql ile yap.
9.  Her modül için minimum 20 test çalıştır.
10. Tüm buton fonksiyonlarını test et (ekle, düzenle, sil, toplu seç, dışa aktar, paylaş, filtrele, sırala).
11. ⚠ KRİTİK: Kaydın solundaki checkbox'ı işaretleyene kadar Düzenle/Sil butonları GÖRÜNMEZ.
12. ⚠ Test akışı: Sayfa yükle → Kayıt oluştur → Checkbox seç → Butonlar belirir → Düzenle/Sil test et.
```
