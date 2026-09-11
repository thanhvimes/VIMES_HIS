-- Migration 137: Align remaining KSK employee columns
-- Description: Bổ sung các cột thị lực, tiền sử, và thông tin hành chính bổ trợ cho hms_exm_employee

ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_height NUMERIC;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_weight NUMERIC;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_righteye VARCHAR(50);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_lefteye VARCHAR(50);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_abo VARCHAR(10);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_conclusion VARCHAR(20);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_comment TEXT;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_doctor VARCHAR(100);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_examdate TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_enddate TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_totalamout NUMERIC;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_packageamout NUMERIC;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_payment VARCHAR(20);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_refinvoiceno INTEGER;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_refstatus VARCHAR(10);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_bookserial INTEGER;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_packageid INTEGER;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_workplace_id VARCHAR(50);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_guide_id INTEGER;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_ishide VARCHAR(5);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_type VARCHAR(20);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_countryid VARCHAR(20);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_company_id INTEGER;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_cardidx INTEGER;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_rank INTEGER;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_maxidx INTEGER;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_discount NUMERIC;
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_terminate_year INTEGER;

ALTER TABLE hms_exam ADD COLUMN IF NOT EXISTS he_parts TEXT;

ALTER TABLE hms_disease_hist ADD COLUMN IF NOT EXISTS hdh_docno INTEGER;

COMMENT ON COLUMN hms_exm_employee.hee_righteye IS 'Thị lực mắt phải';
COMMENT ON COLUMN hms_exm_employee.hee_lefteye IS 'Thị lực mắt trái';
