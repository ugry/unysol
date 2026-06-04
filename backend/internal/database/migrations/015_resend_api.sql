ALTER TABLE email_config ADD COLUMN IF NOT EXISTS resend_api_key TEXT DEFAULT '';
