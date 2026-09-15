-- ==================== SIMPLE VERSION: INSERT SCHEDULE INTO hms_schedule_exam ====================
-- This version explicitly lists all time slots to avoid generate_series issues

-- Step 1: Clean existing data
DELETE FROM hms_schedule_exam WHERE hse_deptid = 'KB';

-- Step 2: Insert schedules for next 30 days
-- For each room, each day, create 32 time slots (16 morning + 16 afternoon)
-- receptno must be UNIQUE per (deptid, roomid, date) - so it runs from 1-32 for the entire day

DO $$
DECLARE
    room_record RECORD;
    day_offset INT;
BEGIN
    -- Loop through each room
    FOR room_record IN 
        SELECT hrk_id, hrk_deptid 
        FROM hms_roomlist_kios 
        WHERE hrk_code = 1 AND hrk_deptid = 'KB' AND hrk_active = 'Y'
    LOOP
        -- Loop through next 30 days
        FOR day_offset IN 0..29 LOOP
            
            -- MORNING SLOTS (08:00 - 11:45) - receptno 1-16
            INSERT INTO hms_schedule_exam (hse_deptid, hse_roomid, hse_date, hse_time, hse_receptno, hse_status)
            VALUES 
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '08:00', 1, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '08:15', 2, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '08:30', 3, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '08:45', 4, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '09:00', 5, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '09:15', 6, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '09:30', 7, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '09:45', 8, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '10:00', 9, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '10:15', 10, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '10:30', 11, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '10:45', 12, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '11:00', 13, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '11:15', 14, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '11:30', 15, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '11:45', 16, 'A');
            
            -- AFTERNOON SLOTS (13:00 - 16:45) - receptno 17-32 (CONTINUE from morning!)
            INSERT INTO hms_schedule_exam (hse_deptid, hse_roomid, hse_date, hse_time, hse_receptno, hse_status)
            VALUES 
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '13:00', 17, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '13:15', 18, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '13:30', 19, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '13:45', 20, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '14:00', 21, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '14:15', 22, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '14:30', 23, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '14:45', 24, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '15:00', 25, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '15:15', 26, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '15:30', 27, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '15:45', 28, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '16:00', 29, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '16:15', 30, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '16:30', 31, 'A'),
                (room_record.hrk_deptid, room_record.hrk_id, CURRENT_DATE + day_offset, '16:45', 32, 'A');
        END LOOP;
    END LOOP;
END $$;

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
