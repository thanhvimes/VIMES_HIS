-- Migration: 032_add_qd1551_fields_to_hms_exm_employee.sql
-- Description: Add fields required by Decision 1551/QD-BYT to hms_exm_employee table if not exist

ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_cardid_date VARCHAR(50);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_cardid_place VARCHAR(255);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_guardian_name VARCHAR(255);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_guardian_cccd VARCHAR(50);

COMMENT ON COLUMN hms_exm_employee.hee_cardid_date IS 'Ngày cấp CCCD (QĐ 1551)';
COMMENT ON COLUMN hms_exm_employee.hee_cardid_place IS 'Nơi cấp CCCD (QĐ 1551)';
COMMENT ON COLUMN hms_exm_employee.hee_guardian_name IS 'Họ tên bố/mẹ/người giám hộ (QĐ 1551)';
COMMENT ON COLUMN hms_exm_employee.hee_guardian_cccd IS 'Số CCCD người giám hộ (QĐ 1551)';
