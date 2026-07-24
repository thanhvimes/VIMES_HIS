-- Migration: Create portal_patient_profiles table
-- Purpose: Store extended patient profile information linked to portal accounts
-- Author: VIMES HIS Development Team
-- Date: 2026-02-02

-- Create the portal_patient_profiles table
CREATE TABLE IF NOT EXISTS portal_patient_profiles (
    id SERIAL PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
    patient_no VARCHAR(20) NOT NULL,  -- Links to HIS (hms_patient.hp_patientno)
    
    -- Extended information (not available in HIS or needs updating)
    phone VARCHAR(20),                 -- Patient's own phone (may differ from account phone)
    id_card VARCHAR(12),               -- CCCD/CMND number
    id_card_issue_date DATE,           -- ID card issue date
    
    -- Address information
    province_code VARCHAR(5),          -- Province/City code
    district_code VARCHAR(5),          -- District code
    address_detail TEXT,               -- Street address details
    
    -- Metadata
    relationship VARCHAR(50) DEFAULT 'Bản thân',  -- 'Bản thân', 'Con', 'Vợ/Chồng', etc.
    is_primary BOOLEAN DEFAULT FALSE,   -- Primary profile for this account
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_account_patient UNIQUE(account_id, patient_no),
    CONSTRAINT check_id_card_length CHECK (id_card IS NULL OR LENGTH(id_card) IN (9, 12))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_portal_profiles_account ON portal_patient_profiles(account_id);
CREATE INDEX IF NOT EXISTS idx_portal_profiles_patient ON portal_patient_profiles(patient_no);
CREATE INDEX IF NOT EXISTS idx_portal_profiles_primary ON portal_patient_profiles(account_id, is_primary) WHERE is_primary = TRUE;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_portal_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_portal_profiles_timestamp
    BEFORE UPDATE ON portal_patient_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_portal_profiles_updated_at();

-- Add comment to table
COMMENT ON TABLE portal_patient_profiles IS 'Stores extended patient profile information for portal users, linked to HIS via patient_no';
COMMENT ON COLUMN portal_patient_profiles.patient_no IS 'References hms_patient.hp_patientno - primary link to HIS data';
COMMENT ON COLUMN portal_patient_profiles.is_primary IS 'Indicates the primary/default profile for this account';
COMMENT ON COLUMN portal_patient_profiles.relationship IS 'Relationship to account owner: Bản thân, Con, Vợ/Chồng, Cha/Mẹ, etc.';
