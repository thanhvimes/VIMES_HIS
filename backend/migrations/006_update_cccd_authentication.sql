-- Migration: Update portal authentication to use CCCD instead of Patient ID
-- Purpose: 
--   1. Update schema to support CCCD authentication
--   2. Add validation for 12-digit CCCD only
--   3. CCCD will be collected during account activation (HIS doesn't have CCCD data)
-- Author: VIMES HIS Development Team
-- Date: 2026-02-03

-- Step 1: Report current status
DO $$
DECLARE
    total_count INTEGER;
    with_cccd_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM portal_patient_profiles;
    SELECT COUNT(*) INTO with_cccd_count FROM portal_patient_profiles WHERE id_card IS NOT NULL;
    
    RAISE NOTICE 'Current status:';
    RAISE NOTICE '  Total profiles: %', total_count;
    RAISE NOTICE '  Profiles with CCCD: %', with_cccd_count;
    RAISE NOTICE '  Profiles without CCCD: %', (total_count - with_cccd_count);
    RAISE NOTICE '';
    RAISE NOTICE 'Note: CCCD will be collected during account activation.';
END $$;

-- Step 2: Drop old constraint if exists
ALTER TABLE portal_patient_profiles 
DROP CONSTRAINT IF EXISTS check_id_card_length;

-- Step 3: Add new constraint for 12-digit CCCD only
ALTER TABLE portal_patient_profiles 
ADD CONSTRAINT check_id_card_length 
CHECK (id_card IS NULL OR (id_card ~ '^\d{12}$'));

-- Step 4: Drop old unique constraint if exists
ALTER TABLE portal_patient_profiles 
DROP CONSTRAINT IF EXISTS unique_id_card;

-- Step 5: Add UNIQUE constraint for id_card (allows NULL)
-- This ensures each CCCD can only be used once
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_id_card 
ON portal_patient_profiles(id_card) 
WHERE id_card IS NOT NULL;

-- Step 6: Create index for fast CCCD lookup
CREATE INDEX IF NOT EXISTS idx_portal_profiles_idcard 
ON portal_patient_profiles(id_card)
WHERE id_card IS NOT NULL;

-- Step 7: Add comments
COMMENT ON COLUMN portal_patient_profiles.id_card IS 'Số CCCD 12 chữ số - dùng để định danh và kích hoạt tài khoản. Được thu thập khi người dùng kích hoạt tài khoản.';
COMMENT ON INDEX idx_unique_id_card IS 'Ensures each CCCD can only be linked to one profile';
COMMENT ON INDEX idx_portal_profiles_idcard IS 'Index for fast CCCD lookup during authentication';

-- Note: We do NOT set id_card to NOT NULL because:
-- 1. HIS doesn't have CCCD data to migrate
-- 2. Existing profiles don't have CCCD yet
-- 3. CCCD will be collected when users activate their accounts
-- 4. New activations will require CCCD (enforced by backend API)
