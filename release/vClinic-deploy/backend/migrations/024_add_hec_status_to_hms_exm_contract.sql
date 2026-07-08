-- Migration: 024_add_hec_status_to_hms_exm_contract.sql
-- Add hec_status column to hms_exm_contract if not exists, default 'O' (Chưa đồng bộ)

ALTER TABLE hms_exm_contract ADD COLUMN IF NOT EXISTS hec_status VARCHAR(1) DEFAULT 'O';
COMMENT ON COLUMN hms_exm_contract.hec_status IS 'Trạng thái đồng bộ HIS. O: Chưa đồng bộ, P: Đang/Đã đồng bộ';
