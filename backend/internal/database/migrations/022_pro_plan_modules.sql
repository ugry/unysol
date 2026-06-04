-- Ensure PRO plan modules exist with all modules enabled
INSERT INTO plan_modules (plan, module_id, enabled)
SELECT 'PRO'::plan_enum, m.id, TRUE FROM modules m
WHERE NOT EXISTS (
    SELECT 1 FROM plan_modules pm WHERE pm.plan::text = 'PRO' AND pm.module_id = m.id
)
ON CONFLICT (plan, module_id) DO UPDATE SET enabled = TRUE;
