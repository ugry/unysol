-- Check if full schema already applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='locale') THEN
        RAISE NOTICE 'Full schema already applied, skipping';
        RETURN;
    END IF;
END$$;

-- Drop minimal tables created by earlier migrations
DROP TABLE IF EXISTS driver_leave CASCADE;
DROP TABLE IF EXISTS toll_logs CASCADE;
DROP TABLE IF EXISTS fuel_logs CASCADE;
DROP TABLE IF EXISTS maintenance_records CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS actions CASCADE;
DROP TABLE IF EXISTS country_configs CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS tenant_modules CASCADE;
DROP TABLE IF EXISTS plan_modules CASCADE;
DROP TABLE IF EXISTS country_modules CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS cek_senet CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS invoice_recurrences CASCADE;
DROP TABLE IF EXISTS e_fatura_logs CASCADE;
DROP TABLE IF EXISTS invoice_payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS trailers CASCADE;
DROP TABLE IF EXISTS trucks CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
-- ============================================================
-- Unysol SaaS Platform — Database Schema v1
-- Multi-tenant · Multi-language · Modular
-- PostgreSQL 16+
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$
BEGIN
    CREATE TYPE plan_enum AS ENUM ('FREE', 'PRO', 'PREMIUM');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE tenant_durum_enum AS ENUM ('AKTIF', 'PASIF', 'IPTAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE user_rol_enum AS ENUM ('SUPER_ADMIN', 'TENANT_OWNER', 'DRIVER', 'OFFICE', 'ACCOUNTANT');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE tracking_source_enum AS ENUM ('PHONE', 'ESP32_LTE', 'COMM_DEV', 'OBD_ONLY', 'MANUEL');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE trip_durum_enum AS ENUM ('AKTIF', 'TAMAMLANDI', 'IPTAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE odeme_durum_enum AS ENUM ('bekleyen', 'odendi', 'gecikti', 'vadesi_gecti');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE expense_kategori_enum AS ENUM (
    'YAKIT', 'BAKIM', 'LASTIK', 'TAMIR', 'SIGORTA', 'MTV',
    'TRAFIK_CEZASI', 'KOPRU_OTOYOL', 'MUAYENE', 'EGZOZ_EMISYON',
    'TAKOGRAF', 'YETKI_BELGESI', 'MAAS', 'SGK', 'MUHASEBE',
    'KIRA', 'ELEKTRIK_SU', 'INTERNET_TEL', 'YAZILIM_LISANS',
    'OTOBAN_ABONMAN', 'DIGER'
);
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE cek_senet_type_enum AS ENUM ('CEK', 'SENET');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE cek_senet_status_enum AS ENUM ('BEKLIYOR', 'TAHSIL_EDILDI', 'KARSILIKSIZ', 'IADE');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE module_category_enum AS ENUM (
    'CORE', 'FLEET', 'FINANCE', 'CRM', 'HR', 'ANALYTICS', 'COMPLIANCE', 'INTEGRATION'
);
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE bakim_turu_enum AS ENUM (
    'PERIYODIK_BAKIM', 'FREN_BALATA', 'FREN_DISK', 'DEBRIYAJ',
    'TRIGER_ZINCIR', 'YAG_DEGISIM', 'LASTIK_DEGISIM', 'ROT_BALANS',
    'KLIMATIK', 'ELEKTRIK', 'AKU', 'DIGER'
);
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE sigorta_turu_enum AS ENUM ('ZMM', 'KASKO', 'IHTIYARI_MALI_MESULIYET', 'FERDI_KAZA');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE izin_turu_enum AS ENUM ('YILLIK_IZIN', 'HASTA', 'UCRETSIZ', 'DIGER');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE izin_onay_enum AS ENUM ('BEKLIYOR', 'ONAYLANDI', 'RED');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE yakit_tipi_enum AS ENUM ('DIZEL', 'EURO_DIZEL');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE trailer_tip_enum AS ENUM ('TENTELI_PERDELI', 'FRIGO', 'SAL', 'LOWBED', 'TANKER');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

-- ============================================================
-- 1. TENANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
    id              SERIAL PRIMARY KEY,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    firma_unvani    VARCHAR(250) NOT NULL,
    plan            plan_enum NOT NULL DEFAULT 'FREE',
    locale          VARCHAR(5) DEFAULT 'tr',
    country_code    VARCHAR(3) DEFAULT 'TR',
    durum           tenant_durum_enum NOT NULL DEFAULT 'AKTIF',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email           VARCHAR(200) UNIQUE NOT NULL,
    password_hash   VARCHAR(500) NOT NULL,
    ad_soyad        VARCHAR(200) NOT NULL,
    rol             user_rol_enum NOT NULL DEFAULT 'TENANT_OWNER',
    telefon         VARCHAR(20),
    aktif           BOOLEAN NOT NULL DEFAULT TRUE,
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TRUCKS
-- ============================================================
CREATE TABLE IF NOT EXISTS trucks (
    id                  SERIAL PRIMARY KEY,
    tenant_id           INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plaka               VARCHAR(20) NOT NULL,
    marka               VARCHAR(50),
    model               VARCHAR(50),
    yil                 INTEGER,
    yakit_tipi          yakit_tipi_enum DEFAULT 'DIZEL',
    tracking_source     tracking_source_enum DEFAULT 'MANUEL',
    km_sayac_baslangic  INTEGER DEFAULT 0,
    km_sayac_guncel     INTEGER DEFAULT 0,
    muayene_bitis       DATE,
    aktif               BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, plaka)
);

-- ============================================================
-- 4. TRAILERS
-- ============================================================
CREATE TABLE IF NOT EXISTS trailers (
    id                  SERIAL PRIMARY KEY,
    tenant_id           INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plaka               VARCHAR(20) NOT NULL,
    marka               VARCHAR(50),
    model               VARCHAR(50),
    yil                 INTEGER,
    tip                 trailer_tip_enum DEFAULT 'TENTELI_PERDELI',
    bagli_cekici_id     INTEGER REFERENCES trucks(id),
    muayene_bitis       DATE,
    aktif               BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, plaka)
);

-- ============================================================
-- 5. TRIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS trips (
    id                  SERIAL PRIMARY KEY,
    tenant_id           INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    truck_id            INTEGER REFERENCES trucks(id),
    plaka               VARCHAR(20),
    sofor               VARCHAR(200),
    musteri             VARCHAR(250),
    yukleme             TEXT,
    teslimat            TEXT,
    ucret               DECIMAL(12,2),
    durum               trip_durum_enum DEFAULT 'AKTIF',
    rota                JSONB,
    km                  DECIMAL(10,2),
    yakit               DECIMAL(10,2),
    irsaliye            VARCHAR(50),
    baslangic_tarih     TIMESTAMPTZ,
    bitis_tarih         TIMESTAMPTZ,
    odeme_durumu        odeme_durum_enum DEFAULT 'bekleyen',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    firma_unvani    VARCHAR(250) NOT NULL,
    yetkili         VARCHAR(200),
    telefon         VARCHAR(20),
    email           VARCHAR(200),
    adres           TEXT,
    vergi_dairesi   VARCHAR(100),
    vergi_no        VARCHAR(11),
    durum           BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. INVOICES
-- ============================================================
DO $$
BEGIN
    CREATE TYPE invoice_tip_enum AS ENUM ('SATIS', 'IADE');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE invoice_durum_enum AS ENUM ('taslak', 'onayda', 'onaylandi', 'gonderildi', 'odendi', 'iptal');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE invoice_odeme_durum_enum AS ENUM ('bekleyen', 'kismi_odendi', 'odendi', 'gecikti', 'vadesi_gecti', 'iptal');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE ebelge_tip_enum AS ENUM ('YOK', 'E_FATURA', 'E_ARSIV');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
DO $$
BEGIN
    CREATE TYPE ebelge_durum_enum AS ENUM ('BEKLIYOR', 'GONDERILDI', 'ONAYLANDI', 'REDDEDILDI', 'HATA');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

CREATE TABLE IF NOT EXISTS invoices (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id     INTEGER REFERENCES customers(id),
    trip_id         INTEGER REFERENCES trips(id),
    tip             invoice_tip_enum DEFAULT 'SATIS',
    iade_fatura_id  INTEGER REFERENCES invoices(id),
    musteri         VARCHAR(250),
    fatura_no       VARCHAR(50) NOT NULL,
    tarih           DATE DEFAULT CURRENT_DATE,
    vade            DATE,
    para_birimi     VARCHAR(3) DEFAULT 'TRY',
    kur             DECIMAL(12,4) DEFAULT 1.0000,
    ara_toplam      DECIMAL(12,2) DEFAULT 0,
    iskonto_tutar   DECIMAL(12,2) DEFAULT 0,
    iskonto_oran    DECIMAL(5,2) DEFAULT 0,
    kdv             DECIMAL(12,2) DEFAULT 0,
    kdv_oran        DECIMAL(5,2) DEFAULT 20.00,
    tevkifat        DECIMAL(12,2) DEFAULT 0,
    genel_toplam    DECIMAL(12,2),
    toplam_odenen   DECIMAL(12,2) DEFAULT 0,
    kalan           DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(genel_toplam,0) - COALESCE(toplam_odenen,0)) STORED,
    durum           invoice_durum_enum DEFAULT 'taslak',
    odeme_durumu    invoice_odeme_durum_enum DEFAULT 'bekleyen',
    odeme_yontemi   VARCHAR(20),
    ebelge_tip      ebelge_tip_enum DEFAULT 'YOK',
    ebelge_durum    ebelge_durum_enum DEFAULT 'BEKLIYOR',
    ebelge_uuid     UUID,
    ebelge_ettn     VARCHAR(100),
    ebelge_yanit    JSONB,
    odeme_tarihi    TIMESTAMPTZ,
    notlar          TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, fatura_no)
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id              SERIAL PRIMARY KEY,
    invoice_id      INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    sira            INTEGER DEFAULT 1,
    urun_adi        VARCHAR(250) NOT NULL,
    aciklama        TEXT,
    miktar          DECIMAL(12,3) DEFAULT 1,
    birim           VARCHAR(20) DEFAULT 'ADET',
    birim_fiyat     DECIMAL(12,4) DEFAULT 0,
    kdv_oran        DECIMAL(5,2) DEFAULT 20.00,
    kdv_tutar       DECIMAL(12,2) DEFAULT 0,
    iskonto_oran    DECIMAL(5,2) DEFAULT 0,
    iskonto_tutar   DECIMAL(12,2) DEFAULT 0,
    tutar           DECIMAL(12,2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_payments (
    id              SERIAL PRIMARY KEY,
    invoice_id      INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    tutar           DECIMAL(12,2) NOT NULL,
    yontem          VARCHAR(20) NOT NULL DEFAULT 'havale',
    referans_no     VARCHAR(100),
    tarih           TIMESTAMPTZ DEFAULT NOW(),
    aciklama        TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS e_fatura_logs (
    id              SERIAL PRIMARY KEY,
    invoice_id      INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    islem           VARCHAR(50) NOT NULL,
    durum           VARCHAR(20) NOT NULL DEFAULT 'BEKLIYOR',
    istek           JSONB,
    yanit           JSONB,
    hata_mesaji     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_recurrences (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id     INTEGER NOT NULL REFERENCES customers(id),
    frekans         VARCHAR(20) NOT NULL DEFAULT 'AYLIK',
    sonraki_tarih   DATE NOT NULL,
    bitis_tarihi    DATE,
    sablon           JSONB NOT NULL,
    aktif           BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    truck_id        INTEGER REFERENCES trucks(id),
    kategori        expense_kategori_enum NOT NULL,
    tarih           DATE NOT NULL DEFAULT CURRENT_DATE,
    tutar           DECIMAL(12,2) NOT NULL,
    aciklama        TEXT,
    plaka           VARCHAR(20),
    fatura_no       VARCHAR(50),
    odeme_durumu    odeme_durum_enum DEFAULT 'odendi',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. EMPLOYEES
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         INTEGER REFERENCES users(id),
    ad_soyad        VARCHAR(200) NOT NULL,
    rol             VARCHAR(100),
    telefon         VARCHAR(20),
    ehliyet_bitis   DATE,
    src_bitis       DATE,
    aktif           BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. CEK_SENET
-- ============================================================
CREATE TABLE IF NOT EXISTS cek_senet (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type            cek_senet_type_enum NOT NULL,
    no              VARCHAR(50),
    banka           VARCHAR(100),
    sube            VARCHAR(100),
    borclu          VARCHAR(250),
    tutar           DECIMAL(12,2),
    vade_tarihi     DATE,
    tanzim_tarihi   DATE,
    status          cek_senet_status_enum DEFAULT 'BEKLIYOR',
    customer_id     INTEGER REFERENCES customers(id),
    notlar          TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. MODULES
-- ============================================================
CREATE TABLE IF NOT EXISTS modules (
    id              SERIAL PRIMARY KEY,
    module_key      VARCHAR(50) UNIQUE NOT NULL,
    module_name     VARCHAR(200) NOT NULL,
    category        module_category_enum NOT NULL DEFAULT 'CORE',
    is_core         BOOLEAN DEFAULT FALSE,
    default_enabled BOOLEAN DEFAULT TRUE,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. COUNTRY_MODULES
-- ============================================================
CREATE TABLE IF NOT EXISTS country_modules (
    id              SERIAL PRIMARY KEY,
    country_code    VARCHAR(3) NOT NULL,
    module_id       INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    enabled         BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_code, module_id)
);

-- ============================================================
-- 13. PLAN_MODULES
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_modules (
    id              SERIAL PRIMARY KEY,
    plan            plan_enum NOT NULL,
    module_id       INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    enabled         BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plan, module_id)
);

-- ============================================================
-- 14. TENANT_MODULES
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_modules (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module_id       INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    enabled         BOOLEAN NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, module_id)
);

-- ============================================================
-- 15. COUNTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS countries (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(3) UNIQUE NOT NULL,
    name            VARCHAR(100) NOT NULL,
    default_locale  VARCHAR(5) DEFAULT 'tr',
    currency        VARCHAR(3) DEFAULT 'TRY',
    aktif           BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. COUNTRY_CONFIGS
-- ============================================================
CREATE TABLE IF NOT EXISTS country_configs (
    id              SERIAL PRIMARY KEY,
    country_code    VARCHAR(3) NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
    config_key      VARCHAR(100) NOT NULL,
    config_value    JSONB NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_code, config_key)
);

-- ============================================================
-- 17. ACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS actions (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         INTEGER REFERENCES users(id),
    action_type     VARCHAR(20) NOT NULL,
    table_name      VARCHAR(100) NOT NULL,
    record_id       VARCHAR(50),
    record_data     JSONB,
    summary         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 18. SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key             VARCHAR(100) NOT NULL,
    value           JSONB NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, key)
);

-- ============================================================
-- 19. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         INTEGER REFERENCES users(id),
    message         TEXT NOT NULL,
    read            BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 20. PREDICTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    month           DATE NOT NULL,
    gelir           DECIMAL(12,2),
    gider           DECIMAL(12,2),
    kar             DECIMAL(12,2),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, month)
);

-- ============================================================
-- 21. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan            plan_enum NOT NULL,
    baslangic       DATE NOT NULL,
    bitis           DATE NOT NULL,
    ucret           DECIMAL(12,2) NOT NULL,
    status          VARCHAR(20) DEFAULT 'AKTIF',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 22. PASSWORD_RESETS
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(200) NOT NULL,
    token           VARCHAR(200) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    used            BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 23. MAINTENANCE_RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance_records (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    truck_id        INTEGER NOT NULL REFERENCES trucks(id),
    tarih           DATE NOT NULL DEFAULT CURRENT_DATE,
    km              INTEGER NOT NULL,
    turu            bakim_turu_enum NOT NULL,
    yapilan_islemler TEXT,
    toplam_tutar    DECIMAL(12,2),
    fatura_no       VARCHAR(50),
    servis_adi      VARCHAR(200),
    sonraki_bakim_km INTEGER,
    sonraki_bakim_tarih DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 24. FUEL_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS fuel_logs (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    truck_id        INTEGER NOT NULL REFERENCES trucks(id),
    tarih           TIMESTAMPTZ DEFAULT NOW(),
    miktar_litre    DECIMAL(10,2) NOT NULL,
    birim_fiyat     DECIMAL(8,2) NOT NULL,
    toplam_tutar    DECIMAL(12,2) NOT NULL,
    alinan_yer      VARCHAR(200),
    km_okuma        INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 25. TOLL_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS toll_logs (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    truck_id        INTEGER NOT NULL REFERENCES trucks(id),
    gecis_tarihi    TIMESTAMPTZ NOT NULL,
    hgs_etiket_no   VARCHAR(20),
    giris_gise      VARCHAR(100),
    cikis_gise      VARCHAR(100),
    gecis_ucreti    DECIMAL(10,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 26. DRIVER_LEAVE
-- ============================================================
CREATE TABLE IF NOT EXISTS driver_leave (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    baslangic       DATE NOT NULL,
    bitis           DATE NOT NULL,
    turu            izin_turu_enum DEFAULT 'YILLIK_IZIN',
    onay_durumu     izin_onay_enum DEFAULT 'BEKLIYOR',
    aciklama        VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_leave_dates CHECK (bitis >= baslangic)
);

-- ============================================================
-- 27. INSURANCE_POLICIES
-- ============================================================
CREATE TABLE IF NOT EXISTS insurance_policies (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    truck_id        INTEGER NOT NULL REFERENCES trucks(id),
    police_no       VARCHAR(50) NOT NULL,
    turu            sigorta_turu_enum NOT NULL,
    sigorta_sirketi VARCHAR(200),
    baslangic       DATE NOT NULL,
    bitis           DATE NOT NULL,
    prim_tutari     DECIMAL(12,2),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 28. BILLING (SaaS invoices – tenant subscriptions)
-- ============================================================
CREATE TABLE IF NOT EXISTS billing (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id),
    fatura_no       VARCHAR(50) UNIQUE NOT NULL,
    tarih           DATE NOT NULL DEFAULT CURRENT_DATE,
    vade            DATE NOT NULL,
    tutar           DECIMAL(12,2) NOT NULL,
    kdv             DECIMAL(12,2) DEFAULT 0,
    genel_toplam    DECIMAL(12,2) NOT NULL,
    durum           odeme_durum_enum DEFAULT 'bekleyen',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 29. LOAD_BOARD
-- ============================================================
CREATE TABLE IF NOT EXISTS load_board (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    type            VARCHAR(20) NOT NULL,
    from_city       VARCHAR(100) NOT NULL,
    to_city         VARCHAR(100) NOT NULL,
    load_date       DATE NOT NULL,
    weight_kg       DECIMAL(10,2),
    vehicle_type    VARCHAR(50),
    price           DECIMAL(12,2),
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'AKTIF',
    contact_phone   VARCHAR(20),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_rol ON users(tenant_id, rol);
CREATE INDEX IF NOT EXISTS idx_trucks_tenant ON trucks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trucks_plaka ON trucks(tenant_id, plaka);
CREATE INDEX IF NOT EXISTS idx_trucks_aktif ON trucks(tenant_id, aktif);
CREATE INDEX IF NOT EXISTS idx_trailers_tenant ON trailers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trips_tenant ON trips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trips_durum ON trips(tenant_id, durum);
CREATE INDEX IF NOT EXISTS idx_trips_truck ON trips(truck_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_firma ON customers(tenant_id, firma_unvani);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_durum ON invoices(tenant_id, durum);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(tenant_id, tarih);
CREATE INDEX IF NOT EXISTS idx_invoices_odeme_durum ON invoices(tenant_id, odeme_durumu);
CREATE INDEX IF NOT EXISTS idx_invoices_fatura_no ON invoices(tenant_id, fatura_no);
CREATE INDEX IF NOT EXISTS idx_invoices_tip ON invoices(tenant_id, tip);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_e_fatura_logs_invoice ON e_fatura_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_recurrences_tenant ON invoice_recurrences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_recurrences_next ON invoice_recurrences(tenant_id, sonraki_tarih, aktif);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_kategori ON expenses(tenant_id, kategori);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(tenant_id, tarih);
CREATE INDEX IF NOT EXISTS idx_expenses_truck ON expenses(truck_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cek_senet_tenant ON cek_senet(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cek_senet_customer ON cek_senet(customer_id);
CREATE INDEX IF NOT EXISTS idx_cek_senet_status ON cek_senet(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_country_modules_country ON country_modules(country_code, enabled);
CREATE INDEX IF NOT EXISTS idx_plan_modules_plan ON plan_modules(plan, enabled);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON tenant_modules(tenant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_country_configs_country ON country_configs(country_code);
CREATE INDEX IF NOT EXISTS idx_actions_tenant ON actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_actions_created ON actions(created_at);
CREATE INDEX IF NOT EXISTS idx_actions_table ON actions(tenant_id, table_name);
CREATE INDEX IF NOT EXISTS idx_settings_tenant ON settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(tenant_id, user_id, read);
CREATE INDEX IF NOT EXISTS idx_predictions_tenant ON predictions(tenant_id, month);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON maintenance_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_truck ON maintenance_records(truck_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_tenant ON fuel_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_truck ON fuel_logs(truck_id);
CREATE INDEX IF NOT EXISTS idx_toll_logs_tenant ON toll_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_toll_logs_truck ON toll_logs(truck_id);
CREATE INDEX IF NOT EXISTS idx_driver_leave_tenant ON driver_leave(tenant_id);
CREATE INDEX IF NOT EXISTS idx_driver_leave_user ON driver_leave(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_tenant ON insurance_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_insurance_truck ON insurance_policies(truck_id);
CREATE INDEX IF NOT EXISTS idx_billing_tenant ON billing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_load_board_tenant ON load_board(tenant_id);


-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

-- Enable RLS on multi-tenant tables
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE cek_senet ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE toll_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_leave ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE e_fatura_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
