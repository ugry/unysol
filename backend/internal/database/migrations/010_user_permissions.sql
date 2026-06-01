-- 010_user_permissions.sql
-- Create user_permissions table if it doesn't exist (was missing from schema)

CREATE TABLE IF NOT EXISTS user_permissions (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_key      VARCHAR(50) NOT NULL,
    can_view        BOOLEAN NOT NULL DEFAULT true,
    can_create      BOOLEAN NOT NULL DEFAULT false,
    can_edit        BOOLEAN NOT NULL DEFAULT false,
    can_delete      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant ON user_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);

-- Enable RLS
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    pol_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE policyname = 'user_permissions_tenant_isolation'
          AND tablename = 'user_permissions'
    ) INTO pol_exists;

    IF NOT pol_exists THEN
        EXECUTE format('
            CREATE POLICY user_permissions_tenant_isolation ON user_permissions
                FOR ALL
                USING (tenant_id = COALESCE(NULLIF(current_setting(''app.current_tenant_id'', TRUE), ''''), ''0'')::INTEGER)
                WITH CHECK (tenant_id = COALESCE(NULLIF(current_setting(''app.current_tenant_id'', TRUE), ''''), ''0'')::INTEGER)
        ');
    END IF;
END;
$$ LANGUAGE plpgsql;
