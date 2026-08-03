-- Create hms_booking_settings table for storing system configuration
CREATE TABLE IF NOT EXISTS hms_booking_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string',
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hms_booking_settings_key ON hms_booking_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_hms_booking_settings_category ON hms_booking_settings(category);

-- Add updated_by column if table already existed without it
ALTER TABLE hms_booking_settings ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
