-- ==================== SEED SCHEDULE DATA ====================
-- File: backend/sql/seed-schedule-data.sql
-- Tạo lịch làm việc mẫu cho các phòng khám

-- Xóa dữ liệu cũ (nếu có)
TRUNCATE TABLE hms_schedule RESTART IDENTITY CASCADE;

-- ===== KHOA KB (Khám bệnh) =====

-- Phòng 65 - Lịch tuần này (7 ngày)
-- Ca sáng: 08:00 - 12:00 (15 phút/slot, max 3 BN/slot)
INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_dayofweek, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
VALUES 
    ('KB', 65, CURRENT_DATE, EXTRACT(DOW FROM CURRENT_DATE), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('KB', 65, CURRENT_DATE + 1, EXTRACT(DOW FROM CURRENT_DATE + 1), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('KB', 65, CURRENT_DATE + 2, EXTRACT(DOW FROM CURRENT_DATE + 2), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('KB', 65, CURRENT_DATE + 3, EXTRACT(DOW FROM CURRENT_DATE + 3), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('KB', 65, CURRENT_DATE + 4, EXTRACT(DOW FROM CURRENT_DATE + 4), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('KB', 65, CURRENT_DATE + 5, EXTRACT(DOW FROM CURRENT_DATE + 5), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('KB', 65, CURRENT_DATE + 6, EXTRACT(DOW FROM CURRENT_DATE + 6), 'MORNING', '08:00', '12:00', 15, 3, 'Y');

-- Ca chiều: 13:00 - 17:00 (15 phút/slot, max 3 BN/slot)
INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_dayofweek, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
VALUES 
    ('KB', 65, CURRENT_DATE, EXTRACT(DOW FROM CURRENT_DATE), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('KB', 65, CURRENT_DATE + 1, EXTRACT(DOW FROM CURRENT_DATE + 1), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('KB', 65, CURRENT_DATE + 2, EXTRACT(DOW FROM CURRENT_DATE + 2), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('KB', 65, CURRENT_DATE + 3, EXTRACT(DOW FROM CURRENT_DATE + 3), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('KB', 65, CURRENT_DATE + 4, EXTRACT(DOW FROM CURRENT_DATE + 4), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('KB', 65, CURRENT_DATE + 5, EXTRACT(DOW FROM CURRENT_DATE + 5), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('KB', 65, CURRENT_DATE + 6, EXTRACT(DOW FROM CURRENT_DATE + 6), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y');

-- Phòng 66 - Lịch tuần này
INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_dayofweek, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
VALUES 
    ('KB', 66, CURRENT_DATE, EXTRACT(DOW FROM CURRENT_DATE), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('KB', 66, CURRENT_DATE + 1, EXTRACT(DOW FROM CURRENT_DATE + 1), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('KB', 66, CURRENT_DATE + 2, EXTRACT(DOW FROM CURRENT_DATE + 2), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('KB', 66, CURRENT_DATE + 3, EXTRACT(DOW FROM CURRENT_DATE + 3), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('KB', 66, CURRENT_DATE + 4, EXTRACT(DOW FROM CURRENT_DATE + 4), 'MORNING', '08:00', '12:00', 15, 3, 'Y');

INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_dayofweek, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
VALUES 
    ('KB', 66, CURRENT_DATE, EXTRACT(DOW FROM CURRENT_DATE), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('KB', 66, CURRENT_DATE + 1, EXTRACT(DOW FROM CURRENT_DATE + 1), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('KB', 66, CURRENT_DATE + 2, EXTRACT(DOW FROM CURRENT_DATE + 2), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('KB', 66, CURRENT_DATE + 3, EXTRACT(DOW FROM CURRENT_DATE + 3), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('KB', 66, CURRENT_DATE + 4, EXTRACT(DOW FROM CURRENT_DATE + 4), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y');

-- ===== KHOA 00001 =====

-- Phòng 65 (nếu thuộc khoa 00001)
INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_dayofweek, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
VALUES 
    ('00001', 65, CURRENT_DATE, EXTRACT(DOW FROM CURRENT_DATE), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('00001', 65, CURRENT_DATE + 1, EXTRACT(DOW FROM CURRENT_DATE + 1), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('00001', 65, CURRENT_DATE + 2, EXTRACT(DOW FROM CURRENT_DATE + 2), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('00001', 65, CURRENT_DATE + 3, EXTRACT(DOW FROM CURRENT_DATE + 3), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('00001', 65, CURRENT_DATE + 4, EXTRACT(DOW FROM CURRENT_DATE + 4), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('00001', 65, CURRENT_DATE + 5, EXTRACT(DOW FROM CURRENT_DATE + 5), 'MORNING', '08:00', '12:00', 15, 3, 'Y'),
    ('00001', 65, CURRENT_DATE + 6, EXTRACT(DOW FROM CURRENT_DATE + 6), 'MORNING', '08:00', '12:00', 15, 3, 'Y');

INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_dayofweek, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients, hs_active)
VALUES 
    ('00001', 65, CURRENT_DATE, EXTRACT(DOW FROM CURRENT_DATE), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('00001', 65, CURRENT_DATE + 1, EXTRACT(DOW FROM CURRENT_DATE + 1), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('00001', 65, CURRENT_DATE + 2, EXTRACT(DOW FROM CURRENT_DATE + 2), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('00001', 65, CURRENT_DATE + 3, EXTRACT(DOW FROM CURRENT_DATE + 3), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('00001', 65, CURRENT_DATE + 4, EXTRACT(DOW FROM CURRENT_DATE + 4), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('00001', 65, CURRENT_DATE + 5, EXTRACT(DOW FROM CURRENT_DATE + 5), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y'),
    ('00001', 65, CURRENT_DATE + 6, EXTRACT(DOW FROM CURRENT_DATE + 6), 'AFTERNOON', '13:00', '17:00', 15, 3, 'Y');

-- Verify
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
ORDER BY hs_deptid, hs_roomid, hs_date, hs_start_time;

-- Summary
SELECT 
    hs_deptid,
    hs_roomid,
    COUNT(*) as total_schedules,
    MIN(hs_date) as first_date,
    MAX(hs_date) as last_date
FROM hms_schedule
GROUP BY hs_deptid, hs_roomid
ORDER BY hs_deptid, hs_roomid;
