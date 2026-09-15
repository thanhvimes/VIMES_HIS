-- ==================== INSERT SCHEDULE DATA INTO hms_schedule_exam ====================
-- This script inserts schedule data into the CORRECT table that the stored procedure uses
-- Table: hms_schedule_exam (NOT hms_schedule!)

-- Step 1: Clean existing data (optional - comment out if you want to keep existing schedules)
DELETE FROM hms_schedule_exam WHERE hse_deptid = 'KB';

-- Step 2: Insert schedules for next 30 days
-- MORNING shift: 08:00 - 11:45 (16 slots, 15-minute intervals)
-- AFTERNOON shift: 13:00 - 16:45 (16 slots, 15-minute intervals)

INSERT INTO hms_schedule_exam (
    hse_deptid,
    hse_roomid,
    hse_date,
    hse_time,
    hse_receptno,
    hse_status
)
SELECT 
    hrk.hrk_deptid,
    hrk.hrk_id,
    CURRENT_DATE + day_offset,
    slot_time::time,
    ROW_NUMBER() OVER (PARTITION BY hrk.hrk_id, CURRENT_DATE + day_offset, 
        CASE WHEN slot_time::time < '12:00' THEN 'MORNING' ELSE 'AFTERNOON' END 
        ORDER BY slot_time),
    'A'  -- Available
FROM hms_roomlist_kios hrk
CROSS JOIN generate_series(0, 29) AS day_offset
CROSS JOIN (
    -- MORNING slots: 08:00 - 11:45
    SELECT generate_series(
        CURRENT_DATE + '08:00'::time,
        CURRENT_DATE + '11:45'::time,
        '15 minutes'::interval
    ) as slot_time
    UNION ALL
    -- AFTERNOON slots: 13:00 - 16:45
    SELECT generate_series(
        CURRENT_DATE + '13:00'::time,
        CURRENT_DATE + '16:45'::time,
        '15 minutes'::interval
    ) as slot_time
) AS time_slots
WHERE hrk.hrk_code = 1  -- Specialty code 1
  AND hrk.hrk_deptid = 'KB'
  AND hrk.hrk_active = 'Y'
ORDER BY hrk.hrk_id, day_offset, slot_time;

-- Step 3: Verify inserted data
SELECT 
    hse_deptid,
    hse_roomid,
    hse_date,
    COUNT(*) as slot_count
FROM hms_schedule_exam
WHERE hse_deptid = 'KB'
GROUP BY hse_deptid, hse_roomid, hse_date
ORDER BY hse_date, hse_roomid
LIMIT 10;

-- Step 4: Check specific date and time
SELECT *
FROM hms_schedule_exam
WHERE hse_deptid = 'KB'
  AND hse_date = CURRENT_DATE
  AND hse_time = '09:00'
ORDER BY hse_roomid;
