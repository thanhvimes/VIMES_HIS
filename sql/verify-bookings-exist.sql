-- Quick check: Verify bookings exist in database

-- Check 1: Count all bookings with type 'ONL'
SELECT COUNT(*) as total_online_bookings
FROM qms_patient
WHERE qms_type = 'ONL';

-- Check 2: Show latest 5 online bookings
SELECT 
    qms_idx,
    qms_patientname,
    qms_contact,
    qms_appointment_date,
    qms_appointment_time,
    qms_deptid,
    qms_status,
    qms_type,
    qms_createddate
FROM qms_patient
WHERE qms_type = 'ONL'
ORDER BY qms_idx DESC
LIMIT 5;

-- Check 3: Check if there are ANY bookings (regardless of type)
SELECT COUNT(*) as total_all_bookings,
       COUNT(CASE WHEN qms_type = 'ONL' THEN 1 END) as online_bookings,
       COUNT(CASE WHEN qms_type IS NULL THEN 1 END) as null_type_bookings
FROM qms_patient;

-- Check 4: Show all distinct types
SELECT DISTINCT qms_type, COUNT(*) as count
FROM qms_patient
GROUP BY qms_type;
