-- Migration: 054_cleanup_legacy_prototype_clinic_queue_tables.sql
-- Loại bỏ an toàn các bảng prototype clinic_queue_* cũ không sử dụng

DO $$
BEGIN
    DROP TABLE IF EXISTS clinic_queue_patients CASCADE;
    DROP TABLE IF EXISTS clinic_queue_rooms CASCADE;
    DROP TABLE IF EXISTS clinic_queue_departments CASCADE;
    DROP TABLE IF EXISTS clinic_queue_users CASCADE;
    DROP INDEX IF EXISTS idx_clinic_queue_pts_dept_date;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping error during cleanup of legacy clinic_queue tables: %', SQLERRM;
END $$;
