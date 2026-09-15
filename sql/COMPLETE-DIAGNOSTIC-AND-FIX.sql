-- ==================== COMPLETE DIAGNOSTIC & FIX ====================
-- Run this ENTIRE script step by step and check results

-- STEP 1: Check if hms_schedule table exists
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'hms_schedule'
ORDER BY ordinal_position;
-- Expected: Should show all columns

-- STEP 2: Check room mapping
SELECT 
    hrk_deptid,
    hrk_id,
    hrk_code,
    COUNT(*) OVER (PARTITION BY hrk_code) as rooms_per_specialty
FROM hms_roomlist_kios
WHERE hrk_deptid = 'KB' 
  AND hrk_active = 'Y'
ORDER BY hrk_code, hrk_id;
-- Expected: List of room IDs (e.g., 7, 8, 9, 16, etc.)
-- IMPORTANT: Note these room IDs!

-- STEP 3: Check current schedule data
SELECT 
    hs_roomid,
    COUNT(*) as schedule_count,
    MIN(hs_date) as earliest,
    MAX(hs_date) as latest
FROM hms_schedule
GROUP BY hs_roomid
ORDER BY hs_roomid;
-- Expected: Should match room IDs from STEP 2

-- STEP 4: If STEP 3 is empty or wrong room IDs, DELETE and INSERT
DELETE FROM hms_schedule;

-- STEP 5: Insert schedule for CORRECT room IDs
-- This uses room IDs from hms_roomlist_kios
INSERT INTO hms_schedule (
    hs_deptid, 
    hs_roomid, 
    hs_date, 
    hs_shift, 
    hs_start_time, 
    hs_end_time, 
    hs_slot_duration, 
    hs_max_patients, 
    hs_active
)
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
  AND hrk.hrk_active = 'Y';

-- STEP 6: Verify insert
SELECT 
    hs_roomid,
    COUNT(*) as total_schedules,
    MIN(hs_date) as from_date,
    MAX(hs_date) as to_date
FROM hms_schedule
GROUP BY hs_roomid
ORDER BY hs_roomid;
-- Expected: Each room should have 60 schedules (2 shifts × 30 days)

-- STEP 7: Test specific date
SELECT 
    hs_roomid,
    hs_shift,
    hs_start_time,
    hs_end_time
FROM hms_schedule
WHERE hs_date = CURRENT_DATE + 9  -- Test with date 9 days from now
  AND hs_deptid = 'KB'
ORDER BY hs_roomid, hs_start_time;
-- Expected: Should show 2 rows per room (MORNING + AFTERNOON)

-- STEP 8: Test the exact query that backend uses
SELECT 
    hs_shift as shift,
    hs_start_time as start_time,
    hs_end_time as end_time,
    hs_slot_duration as slot_duration,
    hs_max_patients as max_patients
FROM hms_schedule
WHERE hs_deptid = 'KB' 
  AND hs_roomid = (SELECT MIN(hrk_id) FROM hms_roomlist_kios WHERE hrk_deptid = 'KB' AND hrk_active = 'Y')
  AND hs_date = CURRENT_DATE + 9
  AND hs_active = 'Y'
ORDER BY hs_start_time;
-- Expected: 2 rows (MORNING + AFTERNOON)

-- STEP 9: Summary
SELECT 
    'Total rooms' as metric,
    COUNT(DISTINCT hrk_id) as value
FROM hms_roomlist_kios
WHERE hrk_deptid = 'KB' AND hrk_active = 'Y'
UNION ALL
SELECT 
    'Total schedules',
    COUNT(*)
FROM hms_schedule
WHERE hs_deptid = 'KB'
UNION ALL
SELECT 
    'Date range (days)',
    (MAX(hs_date) - MIN(hs_date))::int
FROM hms_schedule;
