-- Add stripe_secret_key to email_config
ALTER TABLE email_config ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT DEFAULT '';
