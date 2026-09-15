-- Quick check: Verify if schedule data exists in hms_schedule_exam

-- Check 1: Count total records
SELECT COUNT(*) as total_records
FROM hms_schedule_exam
WHERE hse_deptid = 'KB';

-- Check 2: Check for today's date
SELECT COUNT(*) as today_records
FROM hms_schedule_exam
WHERE hse_deptid = 'KB'
  AND hse_date = CURRENT_DATE;

-- Check 3: Check specific slot (09:00 on 2026-01-28)
SELECT *
FROM hms_schedule_exam
WHERE hse_deptid = 'KB'
  AND hse_date = '2026-01-28'
  AND hse_time = '09:00';

-- Check 4: List all rooms with schedules
SELECT DISTINCT hse_roomid, COUNT(*) as slot_count
FROM hms_schedule_exam
WHERE hse_deptid = 'KB'
GROUP BY hse_roomid
ORDER BY hse_roomid;
