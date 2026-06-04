-- Clean up old email-based super admin (if exists)
DELETE FROM users WHERE email = 'ugur.yardimci@unygms.com';

-- Seed super admin: username uguradm
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'uguradm') THEN
        INSERT INTO users (tenant_id, username, email, password_hash, ad_soyad, rol, aktif)
        VALUES (0, 'uguradm', 'uguradm@admin.local', 'REDACTED', 'Sistem Yoneticisi', 'SUPER_ADMIN', true);
    ELSE
        UPDATE users SET password_hash = 'REDACTED', aktif = true WHERE username = 'uguradm';
    END IF;
END $$;
