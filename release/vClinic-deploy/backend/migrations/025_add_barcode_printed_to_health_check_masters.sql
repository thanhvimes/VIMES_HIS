-- Migration: 025_add_barcode_printed_to_health_check_masters.sql
-- Description: Add barcode_printed column to health_check_masters table

ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS barcode_printed VARCHAR(1) DEFAULT 'N' NOT NULL;
