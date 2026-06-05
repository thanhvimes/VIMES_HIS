-- Migration: Add ethnicity, occupation, email to portal_patient_profiles
-- Date: 2026-02-10

ALTER TABLE portal_patient_profiles ADD COLUMN IF NOT EXISTS ethnicity VARCHAR(50);
ALTER TABLE portal_patient_profiles ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);
ALTER TABLE portal_patient_profiles ADD COLUMN IF NOT EXISTS email VARCHAR(100);

COMMENT ON COLUMN portal_patient_profiles.ethnicity IS 'Dân tộc';
COMMENT ON COLUMN portal_patient_profiles.occupation IS 'Nghề nghiệp';
COMMENT ON COLUMN portal_patient_profiles.email IS 'Địa chỉ email';
