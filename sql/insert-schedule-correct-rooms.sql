-- Fix: Insert schedule for ACTUAL room IDs from hms_roomlist_kios
-- First, get the room IDs
-- Then insert schedule for those rooms

DELETE FROM hms_schedule WHERE hs_date >= CURRENT_DATE;

-- Insert for ALL rooms in hms_roomlist_kios
INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    hrk.hrk_deptid,
    hrk.hrk_id,
    CURRENT_DATE + day_offset,
    shift,
    start_time,
    end_time,
    15,
    3,
    'Y'
FROM hms_roomlist_kios hrk
CROSS JOIN (
    VALUES 
        ('MORNING', '08:00'::time, '12:00'::time),
        ('AFTERNOON', '13:00'::time, '17:00'::time)
) AS shifts(shift, start_time, end_time)
CROSS JOIN generate_series(0, 29) AS day_offset
WHERE hrk.hrk_deptid = 'KB' 
  AND hrk.hrk_active = 'Y'
ON CONFLICT DO NOTHING;

-- Verify
SELECT 
    hs_roomid,
    COUNT(*) as schedules,
    MIN(hs_date) as from_date,
    MAX(hs_date) as to_date
FROM hms_schedule
WHERE hs_date >= CURRENT_DATE
GROUP BY hs_roomid
ORDER BY hs_roomid;
