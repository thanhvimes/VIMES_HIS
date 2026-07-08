-- Migration: 029_add_response_log_to_health_check_masters.sql
-- Description: Add response_log column to health_check_masters table to store VNeID portal integration logs

ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS response_log TEXT;
