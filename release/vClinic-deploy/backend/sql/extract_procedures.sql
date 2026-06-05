SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name IN ('qms_patient_create_booking', 'qms_register_ticket_online');
