-- ============================================================
-- Migration 012: Seed modules, country_modules, plan_modules
-- Required for production RDS where 01-schema.sql seed never ran
-- ============================================================

-- Turkey
INSERT INTO countries (code, name, default_locale, currency)
VALUES ('TR', 'Türkiye', 'tr', 'TRY')
ON CONFLICT (code) DO NOTHING;

-- Core modules
INSERT INTO modules (module_key, module_name, category, is_core, default_enabled) VALUES
('auth', 'Kimlik Doğrulama', 'CORE', TRUE, TRUE),
('tenant_mgmt', 'Firma Yönetimi', 'CORE', TRUE, TRUE),
('dashboard', 'Ana Panel', 'CORE', TRUE, TRUE),
('settings', 'Ayarlar', 'CORE', TRUE, TRUE)
ON CONFLICT (module_key) DO NOTHING;

-- Fleet modules
INSERT INTO modules (module_key, module_name, category, is_core, default_enabled) VALUES
('truck_tracking', 'Kamyon Takip', 'FLEET', FALSE, TRUE),
('maintenance', 'Bakım Takvimi', 'FLEET', FALSE, TRUE),
('fuel_logging', 'Yakıt Takibi', 'FLEET', FALSE, TRUE),
('trailer_mgmt', 'Dorse Yönetimi', 'FLEET', FALSE, TRUE),
('toll_tracking', 'HGS Geçiş Takibi', 'FLEET', FALSE, TRUE),
('load_board', 'Yük Panosu', 'FLEET', FALSE, TRUE)
ON CONFLICT (module_key) DO NOTHING;

-- Finance modules
INSERT INTO modules (module_key, module_name, category, is_core, default_enabled) VALUES
('invoice_mgmt', 'Fatura Yönetimi', 'FINANCE', FALSE, TRUE),
('expense_tracking', 'Gider Takibi', 'FINANCE', FALSE, TRUE),
('billing', 'Abonelik Faturalandırma', 'FINANCE', FALSE, TRUE),
('cek_senet', 'Çek / Senet Takibi', 'FINANCE', FALSE, TRUE)
ON CONFLICT (module_key) DO NOTHING;

-- CRM modules
INSERT INTO modules (module_key, module_name, category, is_core, default_enabled) VALUES
('customer_mgmt', 'Müşteri Yönetimi', 'CRM', FALSE, TRUE),
('trip_mgmt', 'Sefer Yönetimi', 'CRM', FALSE, TRUE)
ON CONFLICT (module_key) DO NOTHING;

-- HR modules
INSERT INTO modules (module_key, module_name, category, is_core, default_enabled) VALUES
('employee_mgmt', 'Personel Yönetimi', 'HR', FALSE, TRUE),
('driver_leave', 'İzin Takvimi', 'HR', FALSE, TRUE)
ON CONFLICT (module_key) DO NOTHING;

-- Analytics modules
INSERT INTO modules (module_key, module_name, category, is_core, default_enabled) VALUES
('predictions', 'Tahmin Motoru', 'ANALYTICS', FALSE, TRUE),
('reports', 'Raporlama', 'ANALYTICS', FALSE, TRUE)
ON CONFLICT (module_key) DO NOTHING;

-- Actions
INSERT INTO modules (module_key, module_name, category, is_core, default_enabled) VALUES
('actions', 'İşlem Kayıtları', 'CORE', FALSE, TRUE)
ON CONFLICT (module_key) DO NOTHING;

-- Country modules for TR (all default-enabled modules)
INSERT INTO country_modules (country_code, module_id, enabled)
SELECT 'TR', id, default_enabled FROM modules
WHERE default_enabled = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM country_modules cm
    WHERE cm.country_code = 'TR' AND cm.module_id = modules.id
  );

-- Plan modules for FREE/PRO/PREMIUM
INSERT INTO plan_modules (plan, module_id, enabled)
SELECT 'FREE'::plan_enum, m.id, TRUE FROM modules m
WHERE NOT EXISTS (
    SELECT 1 FROM plan_modules pm
    WHERE pm.plan::text = 'FREE' AND pm.module_id = m.id
)
ON CONFLICT (plan, module_id) DO NOTHING;

INSERT INTO plan_modules (plan, module_id, enabled)
SELECT 'PRO'::plan_enum, m.id, TRUE FROM modules m
WHERE NOT EXISTS (
    SELECT 1 FROM plan_modules pm
    WHERE pm.plan::text = 'PRO' AND pm.module_id = m.id
)
ON CONFLICT (plan, module_id) DO NOTHING;

INSERT INTO plan_modules (plan, module_id, enabled)
SELECT 'PREMIUM'::plan_enum, m.id, TRUE FROM modules m
WHERE NOT EXISTS (
    SELECT 1 FROM plan_modules pm
    WHERE pm.plan::text = 'PREMIUM' AND pm.module_id = m.id
)
ON CONFLICT (plan, module_id) DO NOTHING;

-- ============================================================
-- FREE plan module restrictions
-- Only: Kamyonlar, Dorseler, Seferler, Yük Panosu, Faturalar,
--       Yakıt Takip, Bakım, Giderler + Core modules
-- ============================================================
UPDATE plan_modules SET enabled = FALSE WHERE plan::text = 'FREE'
AND module_id NOT IN (
    SELECT id FROM modules WHERE module_key IN (
        'auth','tenant_mgmt','dashboard','settings','actions',
        'truck_tracking','trailer_mgmt','load_board','maintenance','fuel_logging',
        'invoice_mgmt','expense_tracking',
        'trip_mgmt'
    )
);

UPDATE plan_modules SET enabled = TRUE WHERE plan::text = 'FREE'
AND module_id IN (
    SELECT id FROM modules WHERE module_key IN (
        'auth','tenant_mgmt','dashboard','settings','actions',
        'truck_tracking','trailer_mgmt','load_board','maintenance','fuel_logging',
        'invoice_mgmt','expense_tracking',
        'trip_mgmt'
    )
);
