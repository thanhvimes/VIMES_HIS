-- Migration: 026_add_barcode_settings_to_health_check_settings.sql
-- Description: Add barcode print configuration columns to health_check_settings table

ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS barcode_label_size_xn VARCHAR(20) DEFAULT '50x30' NOT NULL;
ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS barcode_label_size_ksk VARCHAR(20) DEFAULT '50x30' NOT NULL;
ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS barcode_show_hospital BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS barcode_show_date BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS barcode_show_sample_type BOOLEAN DEFAULT TRUE NOT NULL;
