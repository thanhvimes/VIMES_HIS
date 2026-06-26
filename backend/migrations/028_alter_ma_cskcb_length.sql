-- Migration: 028_alter_ma_cskcb_length.sql
-- Description: Increase max length of ma_cskcb column to 20 characters in health_check_settings table

ALTER TABLE health_check_settings ALTER COLUMN ma_cskcb TYPE VARCHAR(20);
