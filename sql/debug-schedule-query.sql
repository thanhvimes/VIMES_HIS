-- Debug: Check what getRoomSlots would return
-- Test with one specific room

SELECT 
    hs_shift as shift,
    hs_start_time as start_time,
    hs_end_time as end_time,
    hs_slot_duration as slot_duration,
    hs_max_patients as max_patients
FROM hms_schedule
WHERE hs_deptid = 'KB' 
  AND hs_roomid = 65 
  AND hs_date = '2026-01-28'
  AND hs_active = 'Y'
ORDER BY hs_start_time;

-- This should return 2 rows (MORNING + AFTERNOON)
-- If it returns 0, that's the problem!
