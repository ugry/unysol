-- ============================================================
-- V1: Core tables
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- V2: Invoice module tables
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_tip_enum') THEN
        CREATE TYPE invoice_tip_enum AS ENUM ('SATIS', 'IADE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_durum_enum') THEN
        CREATE TYPE invoice_durum_enum AS ENUM ('taslak', 'onayda', 'onaylandi', 'gonderildi', 'odendi', 'iptal');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_odeme_durum_enum') THEN
        CREATE TYPE invoice_odeme_durum_enum AS ENUM ('bekleyen', 'kismi_odendi', 'odendi', 'gecikti', 'vadesi_gecti', 'iptal');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ebelge_tip_enum') THEN
        CREATE TYPE ebelge_tip_enum AS ENUM ('YOK', 'E_FATURA', 'E_ARSIV');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ebelge_durum_enum') THEN
        CREATE TYPE ebelge_durum_enum AS ENUM ('BEKLIYOR', 'GONDERILDI', 'ONAYLANDI', 'REDDEDILDI', 'HATA');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS invoices (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL,
    customer_id     INTEGER,
    trip_id         INTEGER,
    tip             invoice_tip_enum DEFAULT 'SATIS',
    iade_fatura_id  INTEGER,
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
    tenant_id       INTEGER NOT NULL,
    customer_id     INTEGER NOT NULL,
    frekans         VARCHAR(20) NOT NULL DEFAULT 'AYLIK',
    sonraki_tarih   DATE NOT NULL,
    bitis_tarihi    DATE,
    sablon           JSONB NOT NULL,
    aktif           BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

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
