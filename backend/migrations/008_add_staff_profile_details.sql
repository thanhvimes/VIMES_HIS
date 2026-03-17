-- Migration: Add personal details to sys_user for staff profiles
-- Date: 2026-03-09

ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS su_dob DATE;
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS su_gender VARCHAR(10);
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS su_identity_card VARCHAR(20);
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS su_email VARCHAR(100);
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS su_address TEXT;

COMMENT ON COLUMN sys_user.su_dob IS 'Ngày sinh nhân viên';
COMMENT ON COLUMN sys_user.su_gender IS 'Giới tính';
COMMENT ON COLUMN sys_user.su_identity_card IS 'Số CCCD/CMND';
COMMENT ON COLUMN sys_user.su_email IS 'Email liên hệ';
COMMENT ON COLUMN sys_user.su_address IS 'Địa chỉ thường trú';
