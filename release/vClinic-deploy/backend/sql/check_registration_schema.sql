-- Kiểm tra cấu trúc bảng qms_patient
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'qms_patient'
ORDER BY ordinal_position;

-- Kiểm tra xem có các bảng booking/appointment nào khác không
SELECT tablename FROM pg_catalog.pg_tables WHERE tablename ILIKE '%booking%' OR tablename ILIKE '%appoint%';
