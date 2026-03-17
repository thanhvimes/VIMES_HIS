-- Quick test: Check if we have schedule data for today/tomorrow
SELECT 
    hs_deptid,
    hs_roomid,
    hs_date,
    hs_shift,
    hs_start_time,
    hs_end_time,
    CASE 
        WHEN hs_date < CURRENT_DATE THEN 'PAST'
        WHEN hs_date = CURRENT_DATE THEN 'TODAY'
        ELSE 'FUTURE'
    END as status
FROM hms_schedule
WHERE hs_date >= CURRENT_DATE
  AND hs_date <= CURRENT_DATE + 7
ORDER BY hs_date, hs_start_time
LIMIT 20;

-- If empty, insert data for next 7 days
INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    'KB',
    room_id,
    CURRENT_DATE + day_offset,
    shift,
    start_time,
    end_time,
    15,
    3,
    'Y'
FROM (
    VALUES 
        (65, 'MORNING', '08:00'::time, '12:00'::time),
        (65, 'AFTERNOON', '13:00'::time, '17:00'::time),
        (66, 'MORNING', '08:00'::time, '12:00'::time),
        (66, 'AFTERNOON', '13:00'::time, '17:00'::time),
        (67, 'MORNING', '08:00'::time, '12:00'::time),
        (67, 'AFTERNOON', '13:00'::time, '17:00'::time)
) AS rooms(room_id, shift, start_time, end_time)
CROSS JOIN generate_series(0, 6) AS day_offset
ON CONFLICT DO NOTHING;

-- Verify
SELECT COUNT(*) as total_schedules FROM hms_schedule WHERE hs_date >= CURRENT_DATE;
