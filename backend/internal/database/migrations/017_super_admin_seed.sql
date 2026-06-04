-- Clean up old email-based super admin
DELETE FROM users WHERE email = 'ugur.yardimci@unygms.com';

-- Seed super admin: username uguradm, no email needed
INSERT INTO users (tenant_id, username, email, password_hash, ad_soyad, rol, aktif)
VALUES (0, 'uguradm', 'uguradm@admin.local', 'REDACTED', 'Sistem Yöneticisi', 'SUPER_ADMIN', true)
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, aktif = true;
