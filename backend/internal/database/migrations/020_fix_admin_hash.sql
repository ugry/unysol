-- Fix super admin password hash
UPDATE users SET password_hash = 'REDACTED' WHERE username = 'uguradm';
