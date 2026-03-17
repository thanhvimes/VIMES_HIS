-- Check if booking was created successfully

-- Check 1: Count total bookings
SELECT COUNT(*) as total_bookings
FROM qms_patient
WHERE qms_type = 'ONL';

-- Check 2: Check latest booking
SELECT 
    qms_idx,
    qms_patientname,
    qms_contact,
    qms_appointment_date,
    qms_appointment_time,
    qms_deptid,
    qms_roomid,
    qms_receptno,
    qms_status,
    qms_created_at
FROM qms_patient
WHERE qms_type = 'ONL'
ORDER BY qms_idx DESC
LIMIT 5;

-- Check 3: Check if schedule slot was marked as booked
SELECT *
FROM hms_schedule_exam
WHERE hse_deptid = 'KB'
  AND hse_date = CURRENT_DATE
  AND hse_status = 'S'  -- 'S' means booked
ORDER BY hse_time
LIMIT 10;
