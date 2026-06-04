-- Fix tenant unygms plan to PRO (actual tenant id=21)
UPDATE tenants SET plan='PRO' WHERE id=21 AND plan::text='FREE';
