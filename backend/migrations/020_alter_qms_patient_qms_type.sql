-- Migration: 020_alter_qms_patient_qms_type.sql
-- Purpose: Alter qms_type column length from character varying(1) to character varying(10) to support 'ONL' (Online) value.

ALTER TABLE public.qms_patient ALTER COLUMN qms_type TYPE character varying(10);
