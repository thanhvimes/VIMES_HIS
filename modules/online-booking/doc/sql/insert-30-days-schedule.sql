-- Insert schedule for entire month (30 days)
-- This ensures you can test with any date

DELETE FROM hms_schedule WHERE hs_date < CURRENT_DATE;

-- Room 65, 66, 67 - Next 30 days
INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    'KB', room_id, CURRENT_DATE + day_offset,
    shift, start_time, end_time, 15, 3, 'Y'
FROM (
    VALUES 
        (65, 'MORNING', '08:00'::time, '12:00'::time),
        (65, 'AFTERNOON', '13:00'::time, '17:00'::time),
        (66, 'MORNING', '08:00'::time, '12:00'::time),
        (66, 'AFTERNOON', '13:00'::time, '17:00'::time),
        (67, 'MORNING', '08:00'::time, '12:00'::time),
        (67, 'AFTERNOON', '13:00'::time, '17:00'::time)
) AS rooms(room_id, shift, start_time, end_time)
CROSS JOIN generate_series(0, 29) AS day_offset
ON CONFLICT DO NOTHING;

-- Verify
SELECT 
    COUNT(*) as total_schedules,
    MIN(hs_date) as from_date,
    MAX(hs_date) as to_date
FROM hms_schedule
WHERE hs_date >= CURRENT_DATE;

-- Check specific date
SELECT 
    hs_roomid,
    hs_date,
    hs_shift,
    hs_start_time,
    hs_end_time
FROM hms_schedule
WHERE hs_date = '2026-01-28'
ORDER BY hs_roomid, hs_start_time;
