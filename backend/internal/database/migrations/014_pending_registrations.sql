CREATE TABLE IF NOT EXISTS pending_registrations (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(200) NOT NULL UNIQUE,
    password_hash   VARCHAR(300) NOT NULL,
    tenant_name     VARCHAR(300) NOT NULL,
    telefon         VARCHAR(30) DEFAULT '',
    code            VARCHAR(6) NOT NULL,
    token           VARCHAR(100),
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pending_email ON pending_registrations(email);
