-- Migration 139: Align KSK contract columns
-- Description: Bổ sung các cột phòng khám mặc định, loại khám và thông tin phụ trợ cho hms_exm_contract

ALTER TABLE hms_exm_contract ADD COLUMN IF NOT EXISTS hec_def_roomid INTEGER;
ALTER TABLE hms_exm_contract ADD COLUMN IF NOT EXISTS hec_def_examtype VARCHAR(20);
ALTER TABLE hms_exm_contract ADD COLUMN IF NOT EXISTS hec_desc TEXT;
ALTER TABLE hms_exm_contract ADD COLUMN IF NOT EXISTS hec_countryid VARCHAR(20);
ALTER TABLE hms_exm_contract ADD COLUMN IF NOT EXISTS hec_type_package VARCHAR(20);
ALTER TABLE hms_exm_contract ADD COLUMN IF NOT EXISTS hec_userid_package INTEGER;
ALTER TABLE hms_exm_contract ADD COLUMN IF NOT EXISTS hec_amount NUMERIC;

COMMENT ON COLUMN hms_exm_contract.hec_def_roomid IS 'Phòng khám mặc định của hợp đồng KSK';
COMMENT ON COLUMN hms_exm_contract.hec_def_examtype IS 'Loại khám mặc định của hợp đồng KSK';
