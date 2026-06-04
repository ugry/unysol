-- Fix tenant 15 plan to PRO
UPDATE tenants SET plan='PRO' WHERE id=15 AND plan::text='FREE';
