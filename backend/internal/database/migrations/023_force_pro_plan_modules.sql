-- Force PRO plan modules — direct insert, no conditions
-- First clear existing PRO modules
DELETE FROM plan_modules WHERE plan::text = 'PRO';

-- Insert ALL modules for PRO with enabled=true
INSERT INTO plan_modules (plan, module_id, enabled)
SELECT 'PRO'::plan_enum, id, TRUE FROM modules;
