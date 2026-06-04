-- Set Stripe price IDs for checkout
UPDATE email_config SET 
    stripe_pub_key = 'REDACTED',
    stripe_price_monthly = 'price_1TeBY6KWLIMlTHZnLitJ9nqz',
    stripe_price_yearly = 'price_1TeBYGKWLIMlTHZnOP2sgrEL'
WHERE id = 1;
