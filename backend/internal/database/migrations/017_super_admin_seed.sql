-- Idempotent super admin migration — safe to run multiple times
DO $$
BEGIN
    -- Ensure super admin user exists with correct credentials
    IF EXISTS (SELECT 1 FROM users WHERE username = 'uguradm') THEN
        -- Update password and ensure active
        UPDATE users SET password_hash = 'REDACTED',
            email = 'uguradm@admin.local', aktif = true
        WHERE username = 'uguradm';
    ELSE
        -- Create new super admin
        INSERT INTO users (tenant_id, username, email, password_hash, ad_soyad, rol, aktif)
        VALUES (0, 'uguradm', 'uguradm@admin.local', 'REDACTED', 'Sistem Yoneticisi', 'SUPER_ADMIN', true);
    END IF;
END $$;
