-- Migration 051: Add qms_idcard column to qms_patient if not exists
ALTER TABLE public.qms_patient ADD COLUMN IF NOT EXISTS qms_idcard VARCHAR(50);
