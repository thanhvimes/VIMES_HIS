-- Migration: Create health_check_settings table
-- Description: Table to store VNeID portal synchronization settings (QĐ 1551/QĐ-BYT)

CREATE TABLE IF NOT EXISTS health_check_settings (
    id SERIAL PRIMARY KEY,
    vneid_url VARCHAR(255) DEFAULT 'https://api-vneid.moh.gov.vn/api/v1',
    vneid_username VARCHAR(100) DEFAULT '',
    vneid_password VARCHAR(255) DEFAULT '',
    ma_cskcb VARCHAR(10) DEFAULT '15124',
    ma_gtin_cskcb VARCHAR(20) DEFAULT '1234567890123',
    auto_sync_enabled BOOLEAN DEFAULT FALSE,
    auto_sync_interval INTEGER DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Insert default settings row if not exists
INSERT INTO health_check_settings (vneid_url, vneid_username, vneid_password, ma_cskcb, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval)
SELECT 'https://api-vneid.moh.gov.vn/api/v1', 'vimes_cskcb', 'vClinic-secure-pass-2026', '15124', '1234567890123', FALSE, 15
WHERE NOT EXISTS (SELECT 1 FROM health_check_settings);
