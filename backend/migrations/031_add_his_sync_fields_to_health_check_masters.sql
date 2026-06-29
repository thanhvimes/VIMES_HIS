-- Migration: 031_add_his_sync_fields_to_health_check_masters.sql
-- Description: Add HIS employee tracking columns to support smart UPSERT sync logic
--              Prevents data loss when re-syncing already processed records

-- Add his_employee_id: maps to hee_employee_id in hms_exm_employee (HIS side key)
ALTER TABLE health_check_masters 
    ADD COLUMN IF NOT EXISTS his_employee_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS his_contract_id INTEGER,
    ADD COLUMN IF NOT EXISTS his_doc_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS sync_mode VARCHAR(20) DEFAULT 'MANUAL';

-- Unique index: one record per employee per contract
-- Allows UPSERT ON CONFLICT to work correctly
CREATE UNIQUE INDEX IF NOT EXISTS idx_hc_masters_his_emp_contract 
    ON health_check_masters(his_employee_id, his_contract_id) 
    WHERE his_employee_id IS NOT NULL AND his_contract_id IS NOT NULL;

-- Index for contract filtering
CREATE INDEX IF NOT EXISTS idx_hc_masters_his_contract
    ON health_check_masters(his_contract_id)
    WHERE his_contract_id IS NOT NULL;

-- Index for his_doc_no search/lookup
CREATE INDEX IF NOT EXISTS idx_hc_masters_his_doc_no
    ON health_check_masters(his_doc_no)
    WHERE his_doc_no IS NOT NULL;

-- Add synced_count to hms_exm_contract to track sync progress per contract
ALTER TABLE hms_exm_contract
    ADD COLUMN IF NOT EXISTS hec_synced_count INTEGER DEFAULT 0;

-- Comment on new columns
COMMENT ON COLUMN health_check_masters.his_employee_id IS 'Maps to hee_employee_id in hms_exm_employee (HIS). Used as UPSERT key for re-sync.';
COMMENT ON COLUMN health_check_masters.his_contract_id IS 'Maps to hec_contract_id in hms_exm_contract (HIS). Groups records by health check contract.';
COMMENT ON COLUMN health_check_masters.his_doc_no IS 'Maps to hee_docno / hd_docno in HIS (treating doc number). Used for HIS transactions.';
COMMENT ON COLUMN health_check_masters.sync_mode IS 'HIS = synced from HIS, MANUAL = created manually in vClinic.';
COMMENT ON COLUMN hms_exm_contract.hec_synced_count IS 'Number of employee records successfully synced in the last sync operation.';


