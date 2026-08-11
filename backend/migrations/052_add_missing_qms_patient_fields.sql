-- Migration 052: Add missing columns to qms_patient table to ensure stored procedure execution
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_idcard VARCHAR(50);
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_idcard_issuedate DATE;
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_ethnic INTEGER;
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_prov_id INTEGER;
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_dist_id INTEGER;
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_vill_id INTEGER;
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_email VARCHAR(100);
