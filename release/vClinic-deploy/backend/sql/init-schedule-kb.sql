-- ==================== SCRIPT KHỞI TẠO SCHEDULE CHO KHOA KB ====================
-- File: backend/sql/init-schedule-kb.sql
-- Mục đích: Tạo dữ liệu schedule cho 30 ngày tới, chỉ cho khoa KB
-- Cách dùng: Chạy trực tiếp trong SQL client hoặc qua API endpoint

-- ============================================================================
-- BƯỚC 1: XÓA DỮ LIỆU CŨ (Tùy chọn - uncomment nếu muốn làm mới hoàn toàn)
-- ============================================================================
/*
DELETE FROM hms_schedule_exam WHERE hse_deptid = 'KB' AND hse_date >= CURRENT_DATE;
DELETE FROM hms_schedule WHERE hs_deptid = 'KB' AND hs_date >= CURRENT_DATE;
*/

-- ============================================================================
-- BƯỚC 2: TẠO HMS_SCHEDULE (Lịch ca làm việc của phòng)
-- ============================================================================
DO $$ 
DECLARE 
    room_record RECORD;
    current_date DATE := CURRENT_DATE;
    end_date DATE := CURRENT_DATE + 30;
    process_date DATE;
    total_rooms INT := 0;
    total_schedules INT := 0;
BEGIN
    RAISE NOTICE '🚀 Bắt đầu tạo HMS_SCHEDULE cho khoa KB...';
    RAISE NOTICE '   Từ ngày: % đến %', current_date, end_date;
    
    -- Đếm số phòng
    SELECT COUNT(DISTINCT hrk_id) INTO total_rooms
    FROM hms_roomlist_kios 
    WHERE hrk_deptid = 'KB' AND hrk_active = 'Y';
    
    RAISE NOTICE '   Số phòng KB: %', total_rooms;
    
    -- Lặp qua từng phòng KB
    FOR room_record IN 
        SELECT DISTINCT hrk_id, hrk_name 
        FROM hms_roomlist_kios 
        WHERE hrk_deptid = 'KB' AND hrk_active = 'Y'
        ORDER BY hrk_id
    LOOP
        process_date := current_date;
        
        WHILE process_date <= end_date LOOP
            -- Ca sáng (08:00 - 11:30)
            INSERT INTO hms_schedule (
                hs_deptid, hs_roomid, hs_date, hs_shift,
                hs_start_time, hs_end_time, hs_slot_duration,
                hs_max_patients, hs_active, hs_created_by, hs_created_at
            ) VALUES (
                'KB', room_record.hrk_id, process_date, 'S',
                '08:00:00', '11:30:00', 15, 3,
                'Y', 'SYSTEM', NOW()
            )
            ON CONFLICT (hs_deptid, hs_roomid, hs_date, hs_shift) 
            DO UPDATE SET 
                hs_start_time = EXCLUDED.hs_start_time,
                hs_end_time = EXCLUDED.hs_end_time,
                hs_slot_duration = EXCLUDED.hs_slot_duration,
                hs_max_patients = EXCLUDED.hs_max_patients,
                hs_active = 'Y';
            
            -- Ca chiều (13:30 - 17:00)
            INSERT INTO hms_schedule (
                hs_deptid, hs_roomid, hs_date, hs_shift,
                hs_start_time, hs_end_time, hs_slot_duration,
                hs_max_patients, hs_active, hs_created_by, hs_created_at
            ) VALUES (
                'KB', room_record.hrk_id, process_date, 'C',
                '13:30:00', '17:00:00', 15, 3,
                'Y', 'SYSTEM', NOW()
            )
            ON CONFLICT (hs_deptid, hs_roomid, hs_date, hs_shift) 
            DO UPDATE SET 
                hs_start_time = EXCLUDED.hs_start_time,
                hs_end_time = EXCLUDED.hs_end_time,
                hs_slot_duration = EXCLUDED.hs_slot_duration,
                hs_max_patients = EXCLUDED.hs_max_patients,
                hs_active = 'Y';
            
            total_schedules := total_schedules + 2;
            process_date := process_date + 1;
        END LOOP;
        
        RAISE NOTICE '   ✓ Phòng % (%): % ca làm việc', room_record.hrk_id, room_record.hrk_name, (end_date - current_date + 1) * 2;
    END LOOP;
    
    RAISE NOTICE '✅ Hoàn tất HMS_SCHEDULE: % ca làm việc cho % phòng', total_schedules, total_rooms;
END $$;

-- ============================================================================
-- BƯỚC 3: TẠO HMS_SCHEDULE_EXAM (Chi tiết slots thời gian)
-- ============================================================================
DO $$ 
DECLARE 
    schedule_record RECORD;
    slot_time TIME;
    slot_number INT;
    total_slots INT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Bắt đầu tạo HMS_SCHEDULE_EXAM cho khoa KB...';
    
    -- Lặp qua tất cả schedule đã tạo
    FOR schedule_record IN 
        SELECT 
            hs_deptid, hs_roomid, hs_date, hs_shift,
            hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients
        FROM hms_schedule
        WHERE hs_deptid = 'KB' 
          AND hs_date >= CURRENT_DATE
          AND hs_active = 'Y'
        ORDER BY hs_date, hs_roomid, hs_shift
    LOOP
        slot_time := schedule_record.hs_start_time;
        slot_number := 1;
        
        -- Tạo slots cho ca làm việc này
        WHILE slot_time < schedule_record.hs_end_time LOOP
            INSERT INTO hms_schedule_exam (
                hse_deptid, hse_roomid, hse_date, hse_shift,
                hse_time, hse_receptno, hse_type, hse_slot,
                hse_active, hse_created_by, hse_created_at
            ) VALUES (
                schedule_record.hs_deptid,
                schedule_record.hs_roomid,
                schedule_record.hs_date,
                schedule_record.hs_shift,
                slot_time,
                slot_number,
                'S', -- S = Scheduled
                schedule_record.hs_max_patients,
                'Y',
                'SYSTEM',
                NOW()
            )
            ON CONFLICT (hse_deptid, hse_roomid, hse_date, hse_time) 
            DO UPDATE SET 
                hse_slot = EXCLUDED.hse_slot,
                hse_active = 'Y';
            
            total_slots := total_slots + 1;
            slot_time := slot_time + (schedule_record.hs_slot_duration || ' minutes')::INTERVAL;
            slot_number := slot_number + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ Hoàn tất HMS_SCHEDULE_EXAM: % slots thời gian', total_slots;
END $$;

-- ============================================================================
-- BƯỚC 4: KIỂM TRA KẾT QUẢ
-- ============================================================================
DO $$
DECLARE
    schedule_count INT;
    exam_count INT;
    date_range_start DATE;
    date_range_end DATE;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 KIỂM TRA KẾT QUẢ:';
    RAISE NOTICE '=====================================';
    
    -- Đếm HMS_SCHEDULE
    SELECT COUNT(*), MIN(hs_date), MAX(hs_date)
    INTO schedule_count, date_range_start, date_range_end
    FROM hms_schedule
    WHERE hs_deptid = 'KB' AND hs_date >= CURRENT_DATE;
    
    RAISE NOTICE 'HMS_SCHEDULE:';
    RAISE NOTICE '  - Tổng số ca: %', schedule_count;
    RAISE NOTICE '  - Từ ngày: % đến %', date_range_start, date_range_end;
    
    -- Đếm HMS_SCHEDULE_EXAM
    SELECT COUNT(*)
    INTO exam_count
    FROM hms_schedule_exam
    WHERE hse_deptid = 'KB' AND hse_date >= CURRENT_DATE;
    
    RAISE NOTICE 'HMS_SCHEDULE_EXAM:';
    RAISE NOTICE '  - Tổng số slots: %', exam_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 HOÀN TẤT! Dữ liệu đã sẵn sàng cho khoa KB.';
END $$;

-- ============================================================================
-- BƯỚC 5: XEM MẪU DỮ LIỆU (5 ngày đầu tiên)
-- ============================================================================
SELECT 
    hs_date as "Ngày",
    COUNT(*) as "Số ca",
    COUNT(DISTINCT hs_roomid) as "Số phòng",
    STRING_AGG(DISTINCT hs_shift, ', ' ORDER BY hs_shift) as "Ca làm việc"
FROM hms_schedule
WHERE hs_deptid = 'KB' 
  AND hs_date >= CURRENT_DATE
GROUP BY hs_date
ORDER BY hs_date
LIMIT 5;

-- Xem chi tiết slots của ngày đầu tiên
SELECT 
    hse_roomid as "Phòng",
    hse_shift as "Ca",
    hse_time as "Giờ",
    hse_receptno as "STT",
    hse_slot as "Số BN/slot"
FROM hms_schedule_exam
WHERE hse_deptid = 'KB' 
  AND hse_date = CURRENT_DATE
ORDER BY hse_roomid, hse_shift, hse_time
LIMIT 20;

-- ============================================================================
-- GHI CHÚ:
-- - Script này sử dụng ON CONFLICT để tránh lỗi nếu chạy lại
-- - Mỗi slot có thể nhận tối đa 3 bệnh nhân (hs_max_patients = 3)
-- - Mỗi slot kéo dài 15 phút (hs_slot_duration = 15)
-- - Ca sáng: 08:00 - 11:30 (14 slots)
-- - Ca chiều: 13:30 - 17:00 (14 slots)
-- - Tổng: 28 slots/ngày/phòng
-- ============================================================================
