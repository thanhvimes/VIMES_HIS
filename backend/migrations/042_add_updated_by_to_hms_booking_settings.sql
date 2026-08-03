-- Add missing updated_by column to hms_booking_settings
ALTER TABLE hms_booking_settings ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
