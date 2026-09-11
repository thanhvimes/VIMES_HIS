-- Migration 138: Align KSK employee name column and safety constraints
-- Description: Đảm bảo bảng hms_exm_employee có cột hee_name và có thể chèn an toàn

ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_name VARCHAR(200);
ALTER TABLE hms_exm_employee ALTER COLUMN hee_name DROP NOT NULL;

COMMENT ON COLUMN hms_exm_employee.hee_name IS 'Họ và tên nhân viên';
