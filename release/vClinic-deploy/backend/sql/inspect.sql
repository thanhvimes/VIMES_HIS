SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('hms_testorder', 'hms_pacsorder') ORDER BY table_name, ordinal_position;
