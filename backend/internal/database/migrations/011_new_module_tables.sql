-- ============================================================
-- Unysol SaaS Platform — Migration 011: New Module Tables
-- Adds: proposals, contracts, tire_records, driver_allowances, payslips
-- Tables referenced by handlers but missing from schema
-- ============================================================

-- ============================================================
-- 1. PROPOSALS
-- ============================================================
CREATE TABLE IF NOT EXISTS proposals (
    id               SERIAL PRIMARY KEY,
    tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    musteri_id       INTEGER REFERENCES customers(id),
    teklif_no        VARCHAR(50) NOT NULL,
    baslik           VARCHAR(250) NOT NULL,
    aciklama         TEXT,
    tutar            NUMERIC(12,2),
    durum            VARCHAR(20) NOT NULL DEFAULT 'BEKLIYOR',
    teklif_tarihi    DATE NOT NULL DEFAULT CURRENT_DATE,
    gecerlilik_tarihi DATE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, teklif_no)
);

CREATE INDEX IF NOT EXISTS idx_proposals_tenant ON proposals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proposals_musteri ON proposals(musteri_id);
CREATE INDEX IF NOT EXISTS idx_proposals_durum ON proposals(tenant_id, durum);

-- ============================================================
-- 2. CONTRACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
    id               SERIAL PRIMARY KEY,
    tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    musteri_id       INTEGER REFERENCES customers(id),
    sozlesme_no      VARCHAR(50) NOT NULL,
    baslik           VARCHAR(250) NOT NULL,
    tur              VARCHAR(50) NOT NULL DEFAULT 'NAKLIYE',
    tutar            NUMERIC(12,2),
    baslangic_tarihi DATE NOT NULL DEFAULT CURRENT_DATE,
    bitis_tarihi     DATE,
    aciklama         TEXT,
    durum            VARCHAR(50) DEFAULT 'AKTIF',
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, sozlesme_no)
);

CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_musteri ON contracts(musteri_id);

-- ============================================================
-- 3. TIRE RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS tire_records (
    id               SERIAL PRIMARY KEY,
    tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    truck_id         INTEGER REFERENCES trucks(id),
    lastik_no        VARCHAR(50) NOT NULL,
    pozisyon         VARCHAR(20),
    marka            VARCHAR(50),
    model            VARCHAR(50),
    takilma_tarihi   DATE NOT NULL DEFAULT CURRENT_DATE,
    takilma_km       INTEGER NOT NULL DEFAULT 0,
    son_durum        VARCHAR(20) DEFAULT 'TAKILI',
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, lastik_no)
);

CREATE INDEX IF NOT EXISTS idx_tire_records_tenant ON tire_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tire_records_truck ON tire_records(truck_id);

-- ============================================================
-- 4. DRIVER ALLOWANCES
-- ============================================================
CREATE TABLE IF NOT EXISTS driver_allowances (
    id               SERIAL PRIMARY KEY,
    tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id      INTEGER REFERENCES employees(id),
    tutar            NUMERIC(12,2) NOT NULL,
    tarih            DATE NOT NULL DEFAULT CURRENT_DATE,
    aciklama         TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_allowances_tenant ON driver_allowances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_driver_allowances_employee ON driver_allowances(employee_id);

-- ============================================================
-- 5. PAYSLIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS payslips (
    id               SERIAL PRIMARY KEY,
    tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id      INTEGER REFERENCES employees(id),
    donem            VARCHAR(7) NOT NULL,
    brut_maas        NUMERIC(12,2) NOT NULL DEFAULT 0,
    sgk_kesinti      NUMERIC(12,2) NOT NULL DEFAULT 0,
    vergi_kesinti    NUMERIC(12,2) NOT NULL DEFAULT 0,
    diger_kesinti    NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_maas         NUMERIC(12,2) NOT NULL DEFAULT 0,
    aciklama         TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payslips_tenant ON payslips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_donem ON payslips(tenant_id, donem);

-- ============================================================
-- RLS: Enable row-level security on all new tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    -- Create the RLS function if missing (production RDS may not have it)
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'tenant_rls_policy') THEN
        CREATE FUNCTION tenant_rls_policy(table_name TEXT) RETURNS VOID AS $func$
        DECLARE
            pol_name TEXT;
        BEGIN
            pol_name := table_name || '_tenant_isolation';
            EXECUTE format('
                CREATE POLICY %I ON %I
                    FOR ALL
                    USING (tenant_id = COALESCE(NULLIF(current_setting(''app.current_tenant_id'', TRUE), ''''), ''0'')::INTEGER)
                    WITH CHECK (tenant_id = COALESCE(NULLIF(current_setting(''app.current_tenant_id'', TRUE), ''''), ''0'')::INTEGER)
            ', pol_name, table_name);
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        END;
        $func$ LANGUAGE plpgsql;
    END IF;

    FOR tbl IN SELECT unnest(ARRAY['proposals','contracts','tire_records','driver_allowances','payslips'])
    LOOP
        PERFORM tenant_rls_policy(tbl);
    END LOOP;
END $$;
