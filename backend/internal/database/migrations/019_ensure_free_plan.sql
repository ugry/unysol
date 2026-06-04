-- Migration 019: Ensure ALL tenants have correct plan + FREE restrictions
-- Fix any tenant that has NULL or wrong plan
UPDATE tenants SET plan = 'FREE' WHERE plan::text NOT IN ('FREE','PRO','PREMIUM') OR plan IS NULL;

-- Re-apply FREE modules restriction (13 modules only)
UPDATE plan_modules SET enabled = FALSE WHERE plan::text = 'FREE';
UPDATE plan_modules SET enabled = TRUE WHERE plan::text = 'FREE'
AND module_id IN (
    SELECT id FROM modules WHERE module_key IN (
        'auth','tenant_mgmt','dashboard','settings','actions',
        'truck_tracking','trailer_mgmt','load_board','maintenance','fuel_logging',
        'invoice_mgmt','expense_tracking',
        'trip_mgmt'
    )
);
