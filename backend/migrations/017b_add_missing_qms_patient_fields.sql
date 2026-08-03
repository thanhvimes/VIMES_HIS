-- Migration: 040_add_missing_qms_patient_fields
-- Purpose: Add missing fields for QMS patient to support online booking and statistics
-- Author: Antigravity

ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_idcard_issuedate DATE;
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_appointment_date DATE;
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_appointment_time VARCHAR(20);
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_reason TEXT;
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_status VARCHAR(10) DEFAULT 'O';
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_receptno INTEGER;
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_occupation INTEGER;
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_doctor VARCHAR(50);
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_type VARCHAR(10) DEFAULT 'ONL';
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_is_priority BOOLEAN DEFAULT FALSE;
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_is_insurance BOOLEAN DEFAULT FALSE;
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_specialty_code VARCHAR(50);
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_chkindte TIMESTAMP;
