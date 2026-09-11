-- Migration 080: Add clinical and conclusion fields to hms_exm_employee
-- Description: Bổ sung các trường lưu trữ thể lực, sinh hiệu và dữ liệu khám lâm sàng, kết luận dạng JSONB từ file Excel

ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_bloodpressure VARCHAR(20);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_pulse REAL;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_temperature REAL;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_respiration REAL;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_clinical_data JSONB;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_conclusion_data JSONB;

COMMENT ON COLUMN hms_exm_employee.hee_bloodpressure IS 'Huyết áp đo được (mmHg)';
COMMENT ON COLUMN hms_exm_employee.hee_pulse IS 'Mạch (lần/phút)';
COMMENT ON COLUMN hms_exm_employee.hee_temperature IS 'Nhiệt độ cơ thể (°C)';
COMMENT ON COLUMN hms_exm_employee.hee_respiration IS 'Nhịp thở (lần/phút)';
COMMENT ON COLUMN hms_exm_employee.hee_clinical_data IS 'Dữ liệu khám lâm sàng, sinh hiệu và chuyên khoa dạng JSONB';
COMMENT ON COLUMN hms_exm_employee.hee_conclusion_data IS 'Dữ liệu kết luận, phân loại sức khỏe dạng JSONB';
