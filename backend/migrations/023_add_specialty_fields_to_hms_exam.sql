-- Migration: 023_add_specialty_fields_to_hms_exam.sql
-- Purpose: Add he_type and he_specialty_data columns to hms_exam to support dynamic specialty forms.

ALTER TABLE public.hms_exam ADD COLUMN IF NOT EXISTS he_type INTEGER;
ALTER TABLE public.hms_exam ADD COLUMN IF NOT EXISTS he_specialty_data JSONB DEFAULT '{}'::jsonb;
