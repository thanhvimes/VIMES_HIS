
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'clinic_queue_%' OR table_name LIKE 'qms_%';
