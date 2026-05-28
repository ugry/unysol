-- Create super admin
INSERT INTO tenants (id, slug, firma_unvani, plan, locale, country_code, durum) 
VALUES (0, 'super-admin', 'Platform Yonetim', 'PREMIUM', 'tr', 'TR', 'AKTIF')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (tenant_id, email, password_hash, ad_soyad, rol, aktif) 
VALUES (0, 'ugur.yardimci@unygms.com', '$2b$12$iaLYmaT09pDGhM6jWaMSfe5iQwJngd7w56MUALGkfXofz0NsJs3F6', 'Ugur Admin', 'SUPER_ADMIN', true)
ON CONFLICT (email) DO UPDATE SET password_hash = '$2b$12$iaLYmaT09pDGhM6jWaMSfe5iQwJngd7w56MUALGkfXofz0NsJs3F6', rol = 'SUPER_ADMIN', aktif = true, tenant_id = 0;
