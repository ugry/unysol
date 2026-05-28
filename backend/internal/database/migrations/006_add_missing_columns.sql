-- Add all missing columns that exist in application code

-- customers - fix column type (only if still boolean)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='customers' AND column_name='durum' 
               AND data_type='boolean') THEN
        ALTER TABLE customers ALTER COLUMN durum TYPE VARCHAR(20) USING 
          CASE WHEN durum = true THEN 'AKTIF' ELSE 'PASIF' END;
        ALTER TABLE customers ALTER COLUMN durum SET DEFAULT 'AKTIF';
    END IF;
END$$;

-- customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS fatura_adresi TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS kategori VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS bakiye DECIMAL(12,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS acik_hesap_limiti DECIMAL(12,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS risk_skoru VARCHAR(20) DEFAULT 'DUSUK';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS vade_gun INTEGER DEFAULT 30;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS depo_adresleri TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS fiyat_katalogu TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sozlesme_url TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS musteri_temsilcisi VARCHAR(200);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notlar TEXT;

-- trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS sofor_telefon VARCHAR(20);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS invoice_id INTEGER;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS baslangic TIMESTAMPTZ;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS bitis TIMESTAMPTZ;

-- load_board
ALTER TABLE load_board ADD COLUMN IF NOT EXISTS from_district VARCHAR(100);
ALTER TABLE load_board ADD COLUMN IF NOT EXISTS to_district VARCHAR(100);
ALTER TABLE load_board ADD COLUMN IF NOT EXISTS from_country VARCHAR(100) DEFAULT 'TR';
ALTER TABLE load_board ADD COLUMN IF NOT EXISTS to_country VARCHAR(100) DEFAULT 'TR';
ALTER TABLE load_board ADD COLUMN IF NOT EXISTS title VARCHAR(300);
ALTER TABLE load_board ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'TRY';
ALTER TABLE load_board ADD COLUMN IF NOT EXISTS company_name VARCHAR(250);
ALTER TABLE load_board ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
