-- ==================== VERIFY & FIX SCHEDULE DATA ====================
-- File: backend/sql/verify-and-fix-schedule.sql

-- 1. Check if hms_schedule table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'hms_schedule'
);

-- 2. Check current data
SELECT 
    hs_deptid,
    hs_roomid,
    hs_date,
    hs_shift,
    hs_start_time,
    hs_end_time,
    hs_slot_duration,
    hs_max_patients
FROM hms_schedule
ORDER BY hs_deptid, hs_roomid, hs_date, hs_start_time
LIMIT 20;

-- 3. Count schedules
SELECT 
    hs_deptid,
    hs_roomid,
    COUNT(*) as total_schedules,
    MIN(hs_date) as first_date,
    MAX(hs_date) as last_date
FROM hms_schedule
GROUP BY hs_deptid, hs_roomid
ORDER BY hs_deptid, hs_roomid;

-- 4. Check if dates are in the future
SELECT 
    hs_date,
    CASE 
        WHEN hs_date < CURRENT_DATE THEN 'PAST'
        WHEN hs_date = CURRENT_DATE THEN 'TODAY'
        ELSE 'FUTURE'
    END as date_status,
    COUNT(*) as count
FROM hms_schedule
GROUP BY hs_date
ORDER BY hs_date;

-- 5. If no data or dates are old, insert fresh data for next 7 days
DELETE FROM hms_schedule WHERE hs_date < CURRENT_DATE;

-- Insert for KB, Room 65
INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_dayofweek, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    'KB',
    65,
    CURRENT_DATE + i,
    EXTRACT(DOW FROM CURRENT_DATE + i),
    'MORNING',
    '08:00',
    '12:00',
    15,
    3,
    'Y'
FROM generate_series(0, 6) as i
ON CONFLICT DO NOTHING;

INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_dayofweek, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    'KB',
    65,
    CURRENT_DATE + i,
    EXTRACT(DOW FROM CURRENT_DATE + i),
    'AFTERNOON',
    '13:00',
    '17:00',
    15,
    3,
    'Y'
FROM generate_series(0, 6) as i
ON CONFLICT DO NOTHING;

-- Insert for KB, Room 66
INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_dayofweek, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    'KB',
    66,
    CURRENT_DATE + i,
    EXTRACT(DOW FROM CURRENT_DATE + i),
    'MORNING',
    '08:00',
    '12:00',
    15,
    3,
    'Y'
FROM generate_series(0, 6) as i
ON CONFLICT DO NOTHING;

INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_dayofweek, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    'KB',
    66,
    CURRENT_DATE + i,
    EXTRACT(DOW FROM CURRENT_DATE + i),
    'AFTERNOON',
    '13:00',
    '17:00',
    15,
    3,
    'Y'
FROM generate_series(0, 6) as i
ON CONFLICT DO NOTHING;

-- Insert for KB, Room 67
INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_dayofweek, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    'KB',
    67,
    CURRENT_DATE + i,
    EXTRACT(DOW FROM CURRENT_DATE + i),
    'MORNING',
    '08:00',
    '12:00',
    15,
    3,
    'Y'
FROM generate_series(0, 6) as i
ON CONFLICT DO NOTHING;

INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_dayofweek, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
SELECT 
    'KB',
    67,
    CURRENT_DATE + i,
    EXTRACT(DOW FROM CURRENT_DATE + i),
    'AFTERNOON',
    '13:00',
    '17:00',
    15,
    3,
    'Y'
FROM generate_series(0, 6) as i
ON CONFLICT DO NOTHING;

-- 6. Verify after insert
SELECT 
    hs_deptid,
    hs_roomid,
    COUNT(*) as total,
    MIN(hs_date) as from_date,
    MAX(hs_date) as to_date
FROM hms_schedule
WHERE hs_date >= CURRENT_DATE
GROUP BY hs_deptid, hs_roomid;

-- 7. Check hms_roomlist_kios mapping
SELECT 
    hrk_deptid,
    hrk_id,
    hrk_code,
    hrk_active
FROM hms_roomlist_kios
WHERE hrk_deptid = 'KB'
  AND hrk_active = 'Y'
ORDER BY hrk_code, hrk_id;
