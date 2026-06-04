-- Super admin seeded by migration 017_super_admin_seed.sql (username-based)
INSERT INTO tenants (id, slug, firma_unvani, plan, locale, country_code, durum) 
VALUES (0, 'super-admin', 'Platform Yonetim', 'PREMIUM', 'tr', 'TR', 'AKTIF')
ON CONFLICT (id) DO NOTHING;
