
-- Migration: Add reception and printer settings
-- Purpose: Support configuration for reception and thermal printers
-- Author: Antigravity

-- 1. Create a generic settings table for the system if not already handled
CREATE TABLE IF NOT EXISTS sys_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    category VARCHAR(50),
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add columns to hms_roomlist for capacity and reception state
-- hrl_max_per_day: Số lượng tiếp đón tối đa trong ngày
-- hrl_reception_enabled: Cho phép/Không cho phép tiếp đón tại phòng này
-- First check if columns exist before adding
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hms_roomlist' AND column_name='hrl_max_per_day') THEN
        ALTER TABLE hms_roomlist ADD COLUMN hrl_max_per_day INTEGER DEFAULT 100;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hms_roomlist' AND column_name='hrl_reception_enabled') THEN
        ALTER TABLE hms_roomlist ADD COLUMN hrl_reception_enabled BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 3. Initial Printer Config (Inspired by Kiosk)
INSERT INTO sys_settings (setting_key, setting_value, setting_type, category, description, is_system)
VALUES (
    'reception_printer_config',
    '{
        "enabled": true,
        "type": "DRIVER",
        "printerName": "Xprinter XP-420B",
        "printMode": "IMAGE",
        "encodingMode": "UTF8",
        "language": "ESC",
        "width": "80mm",
        "printerId": ""
    }',
    'json',
    'RECEPTION',
    'Cấu hình máy in cho module tiếp đón',
    true
) ON CONFLICT (setting_key) DO NOTHING;
