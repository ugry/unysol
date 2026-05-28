-- Check if schema already fixed, skip if so
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='firma_unvani') THEN
        RAISE NOTICE 'Schema already fixed, skipping 003_fix_schema';
        RETURN;
    END IF;
END$$;

-- Drop wrong-schema tables created by old 001_init.sql
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Recreate with correct schema
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(200) UNIQUE NOT NULL,
    firma_unvani VARCHAR(300) NOT NULL,
    plan VARCHAR(50) DEFAULT 'FREE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(300) NOT NULL,
    ad_soyad VARCHAR(200) NOT NULL DEFAULT '',
    rol VARCHAR(50) DEFAULT 'user',
    telefon VARCHAR(30),
    aktif BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    plan VARCHAR(50) DEFAULT 'FREE',
    baslangic DATE DEFAULT CURRENT_DATE,
    bitis DATE,
    ucret DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
