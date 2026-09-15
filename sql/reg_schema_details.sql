SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'qms_patient';
SELECT tablename FROM pg_catalog.pg_tables WHERE tablename ILIKE '%booking%' OR tablename ILIKE '%appoint%';
