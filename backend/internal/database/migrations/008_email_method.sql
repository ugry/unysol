ALTER TABLE email_config ADD COLUMN IF NOT EXISTS email_method VARCHAR(10) DEFAULT 'smtp';
ALTER TABLE email_config ADD COLUMN IF NOT EXISTS aws_region VARCHAR(30) DEFAULT 'eu-central-1';
