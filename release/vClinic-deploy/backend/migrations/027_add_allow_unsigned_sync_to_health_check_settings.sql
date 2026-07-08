-- Migration: 027_add_allow_unsigned_sync_to_health_check_settings.sql
-- Description: Add allow_unsigned_sync configuration column to health_check_settings table

ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS allow_unsigned_sync BOOLEAN DEFAULT FALSE NOT NULL;
