-- Migration 143: Align reception exam schema
-- Description: Bổ sung các cột hd_nonexam, he_roomkey, hrl_key để hàm hms_exm_registration_exam chạy thông suốt

ALTER TABLE hms_doc ADD COLUMN IF NOT EXISTS hd_nonexam VARCHAR(1) DEFAULT 'Y';
ALTER TABLE hms_exam ADD COLUMN IF NOT EXISTS he_roomkey INTEGER;
ALTER TABLE hms_roomlist ADD COLUMN IF NOT EXISTS hrl_key INTEGER;

COMMENT ON COLUMN hms_doc.hd_nonexam IS 'Đánh dấu hồ sơ không qua khám thường';
COMMENT ON COLUMN hms_exam.he_roomkey IS 'Khóa phòng khám liên kết';
COMMENT ON COLUMN hms_roomlist.hrl_key IS 'Khóa định danh phòng khám';
