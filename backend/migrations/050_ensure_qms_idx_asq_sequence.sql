-- Migration 050: Ensure sequence qms_idx_asq exists for qms_patient_create_booking procedure

CREATE SEQUENCE IF NOT EXISTS public.qms_idx_asq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1000
    CACHE 1;

DO $$
DECLARE
    max_idx INTEGER;
BEGIN
    SELECT COALESCE(MAX(qms_idx), 1000) INTO max_idx FROM public.qms_patient;
    PERFORM setval('public.qms_idx_asq', max_idx + 1, false);
END $$;
