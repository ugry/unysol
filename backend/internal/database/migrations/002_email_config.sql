CREATE TABLE IF NOT EXISTS email_config (
    id SERIAL PRIMARY KEY,
    email_address VARCHAR(300),
    password VARCHAR(300),
    smtp_address VARCHAR(300),
    imap_address VARCHAR(300),
    port VARCHAR(10) DEFAULT '465',
    imap_port VARCHAR(10) DEFAULT '993',
    host VARCHAR(300),
    username VARCHAR(300),
    from_email VARCHAR(300),
    google_client_id TEXT DEFAULT '',
    stripe_pub_key TEXT DEFAULT '',
    stripe_price_monthly TEXT DEFAULT '',
    stripe_price_yearly TEXT DEFAULT ''
);

INSERT INTO email_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
