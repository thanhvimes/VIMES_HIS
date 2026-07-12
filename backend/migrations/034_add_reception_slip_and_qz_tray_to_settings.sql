-- Migration: Add reception_slip_template and use_qz_tray to health_check_settings
-- Created At: 2026-07-10

ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS reception_slip_template text;
ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS use_qz_tray boolean DEFAULT false;
