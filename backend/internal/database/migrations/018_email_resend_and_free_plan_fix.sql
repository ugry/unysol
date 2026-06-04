-- Switch email to Resend API (more reliable than SMTP)
UPDATE email_config SET email_method = 'resend', resend_api_key = 'REDACTED', email_address = 'info@unysolar.com' WHERE id = 1;

-- Re-apply FREE plan module restrictions
-- First ensure all modules are seeded for FREE (if missing)
INSERT INTO plan_modules (plan, module_id, enabled)
SELECT 'FREE'::plan_enum, m.id, TRUE FROM modules m
WHERE NOT EXISTS (
    SELECT 1 FROM plan_modules pm WHERE pm.plan::text = 'FREE' AND pm.module_id = m.id
)
ON CONFLICT (plan, module_id) DO NOTHING;

-- Then restrict FREE to only allowed modules
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
