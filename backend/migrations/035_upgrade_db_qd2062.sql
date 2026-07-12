-- Migration: Upgrade DB for QĐ 2062/QĐ-BYT (Amended QĐ 1551)
-- Created At: 2026-07-10

-- 1. Add guardian columns to health_check_masters (for children under 6)
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255);
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS guardian_cccd VARCHAR(12);
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS guardian_relation VARCHAR(50);
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(15);

-- 2. Add GLN facility code to settings table
ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS ma_gtin_cskcb VARCHAR(13);

-- 3. Create specialist signatures table for doctors' individual clinical sign-offs
CREATE TABLE IF NOT EXISTS health_check_specialist_signatures (
    id SERIAL PRIMARY KEY,
    master_id INTEGER NOT NULL REFERENCES health_check_masters(id) ON DELETE CASCADE,
    specialty_code VARCHAR(50) NOT NULL, -- e.g., 'internal', 'eye', 'ent'
    doctor_id VARCHAR(50) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    signature_data TEXT NOT NULL,
    signed_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_master_specialty UNIQUE (master_id, specialty_code)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hc_masters_guardian ON health_check_masters(guardian_cccd);
CREATE INDEX IF NOT EXISTS idx_hc_masters_form ON health_check_masters(form_type);
