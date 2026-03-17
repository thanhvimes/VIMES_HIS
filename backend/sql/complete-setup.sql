-- ==================== COMPLETE DATABASE SETUP ====================
-- Run this entire script to setup everything

-- 1. Check and show current schedule data
SELECT 
    'Current schedule count' as info,
    COUNT(*) as count,
    MIN(hs_date) as earliest_date,
    MAX(hs_date) as latest_date
FROM hms_schedule;

-- 2. Delete old data
DELETE FROM hms_schedule WHERE hs_date < CURRENT_DATE;

-- 3. Insert fresh data for next 7 days
-- Room 65
INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    'KB', 65, CURRENT_DATE + i,
    'MORNING', '08:00'::time, '12:00'::time, 15, 3, 'Y'
FROM generate_series(0, 6) as i
ON CONFLICT DO NOTHING;

INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    'KB', 65, CURRENT_DATE + i,
    'AFTERNOON', '13:00'::time, '17:00'::time, 15, 3, 'Y'
FROM generate_series(0, 6) as i
ON CONFLICT DO NOTHING;

-- Room 66
INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    'KB', 66, CURRENT_DATE + i,
    'MORNING', '08:00'::time, '12:00'::time, 15, 3, 'Y'
FROM generate_series(0, 6) as i
ON CONFLICT DO NOTHING;

INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    'KB', 66, CURRENT_DATE + i,
    'AFTERNOON', '13:00'::time, '17:00'::time, 15, 3, 'Y'
FROM generate_series(0, 6) as i
ON CONFLICT DO NOTHING;

-- Room 67
INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    'KB', 67, CURRENT_DATE + i,
    'MORNING', '08:00'::time, '12:00'::time, 15, 3, 'Y'
FROM generate_series(0, 6) as i
ON CONFLICT DO NOTHING;

INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    'KB', 67, CURRENT_DATE + i,
    'AFTERNOON', '13:00'::time, '17:00'::time, 15, 3, 'Y'
FROM generate_series(0, 6) as i
ON CONFLICT DO NOTHING;

-- 4. Verify inserted data
SELECT 
    hs_deptid,
    hs_roomid,
    hs_date,
    hs_shift,
    hs_start_time,
    hs_end_time,
    hs_active
FROM hms_schedule
WHERE hs_date >= CURRENT_DATE
ORDER BY hs_deptid, hs_roomid, hs_date, hs_start_time
LIMIT 20;

-- 5. Summary
SELECT 
    hs_deptid,
    hs_roomid,
    COUNT(*) as schedules,
    MIN(hs_date) as from_date,
    MAX(hs_date) as to_date
FROM hms_schedule
WHERE hs_date >= CURRENT_DATE
GROUP BY hs_deptid, hs_roomid
ORDER BY hs_deptid, hs_roomid;

-- 6. Check room-specialty mapping
SELECT 
    hrk_deptid,
    hrk_id,
    hrk_code,
    COUNT(*) as count
FROM hms_roomlist_kios
WHERE hrk_deptid = 'KB' AND hrk_active = 'Y'
GROUP BY hrk_deptid, hrk_id, hrk_code
ORDER BY hrk_code, hrk_id;
