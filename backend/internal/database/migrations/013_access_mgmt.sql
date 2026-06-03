-- Add access_mgmt module (PRO/PREMIUM only — FREE blocked)
INSERT INTO modules (module_key, module_name, category, is_core, default_enabled)
VALUES ('access_mgmt', 'Erisim Yonetimi', 'CORE', FALSE, FALSE)
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO plan_modules (plan, module_id, enabled)
SELECT 'FREE'::plan_enum, id, FALSE FROM modules WHERE module_key = 'access_mgmt'
ON CONFLICT (plan, module_id) DO UPDATE SET enabled = FALSE;

INSERT INTO plan_modules (plan, module_id, enabled)
SELECT 'PRO'::plan_enum, id, TRUE FROM modules WHERE module_key = 'access_mgmt'
ON CONFLICT (plan, module_id) DO UPDATE SET enabled = TRUE;

INSERT INTO plan_modules (plan, module_id, enabled)
SELECT 'PREMIUM'::plan_enum, id, TRUE FROM modules WHERE module_key = 'access_mgmt'
ON CONFLICT (plan, module_id) DO UPDATE SET enabled = TRUE;
