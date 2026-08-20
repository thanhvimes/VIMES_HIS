-- Migration 043: Add created_by and created_by_name columns to health_check_masters
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255);
