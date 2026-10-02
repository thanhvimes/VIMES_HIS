-- Migration: 153_add_source_xml_to_xmldsig_transaction.sql
-- Description: Add source_xml column to hms_health_check_xmldsig_transaction to preserve exact prepared XML for signing completion

ALTER TABLE hms_health_check_xmldsig_transaction 
ADD COLUMN IF NOT EXISTS source_xml TEXT;
