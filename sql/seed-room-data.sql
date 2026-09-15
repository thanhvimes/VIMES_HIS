-- ==================== ROOM SETUP SEED DATA ====================
-- File: backend/sql/seed-room-data.sql
-- Purpose: Dữ liệu mẫu cho phòng khám và cấu hình lịch

-- Xóa dữ liệu cũ (nếu có)
TRUNCATE TABLE hms_schedule_exam_setup CASCADE;
TRUNCATE TABLE dm_phongkham RESTART IDENTITY CASCADE;

-- 1. Thêm danh mục phòng khám
INSERT INTO dm_phongkham (room_code, room_name, dept_id, location, description, is_active) VALUES
('KB', 'Phòng khám bệnh', 'S01', 'Tầng 1', 'Phòng khám nội tổng quát', true),
('P01', 'Phòng khám 01', 'S01', 'Tầng 1', 'Phòng khám nội tổng quát 01', true),
('P02', 'Phòng khám 02', 'S02', 'Tầng 1', 'Phòng khám ngoại tổng quát', true),
('P03', 'Phòng khám 03', 'S03', 'Tầng 2', 'Phòng khám sản phụ khoa', true),
('P04', 'Phòng khám 04', 'S04', 'Tầng 2', 'Phòng khám nhi khoa', true);

-- 2. Thêm cấu hình lịch khám
-- Phòng KB - Khoa S01 (Nội tổng quát)
INSERT INTO hms_schedule_exam_setup (hses_deptid, hses_roomid, hses_type, hses_time, hses_slot, hses_starttime, hses_endtime) VALUES
('S01', (SELECT room_id FROM dm_phongkham WHERE room_code = 'KB'), 'S', 6, 10, '07:30', '11:18'),
('S01', (SELECT room_id FROM dm_phongkham WHERE room_code = 'KB'), 'C', 6, 10, '13:00', '15:30');

-- Phòng P01 - Khoa S01 (Nội tổng quát)
INSERT INTO hms_schedule_exam_setup (hses_deptid, hses_roomid, hses_type, hses_time, hses_slot, hses_starttime, hses_endtime) VALUES
('S01', (SELECT room_id FROM dm_phongkham WHERE room_code = 'P01'), 'S', 10, 8, '08:00', '12:00'),
('S01', (SELECT room_id FROM dm_phongkham WHERE room_code = 'P01'), 'C', 10, 8, '13:30', '17:00');

-- Phòng P02 - Khoa S02 (Ngoại tổng quát)
INSERT INTO hms_schedule_exam_setup (hses_deptid, hses_roomid, hses_type, hses_time, hses_slot, hses_starttime, hses_endtime) VALUES
('S02', (SELECT room_id FROM dm_phongkham WHERE room_code = 'P02'), 'S', 15, 6, '07:30', '11:30'),
('S02', (SELECT room_id FROM dm_phongkham WHERE room_code = 'P02'), 'C', 15, 6, '14:00', '17:30');

-- Phòng P03 - Khoa S03 (Sản phụ khoa)
INSERT INTO hms_schedule_exam_setup (hses_deptid, hses_roomid, hses_type, hses_time, hses_slot, hses_starttime, hses_endtime) VALUES
('S03', (SELECT room_id FROM dm_phongkham WHERE room_code = 'P03'), 'S', 20, 5, '08:00', '12:00'),
('S03', (SELECT room_id FROM dm_phongkham WHERE room_code = 'P03'), 'C', 20, 5, '13:00', '17:00');

-- Phòng P04 - Khoa S04 (Nhi khoa)
INSERT INTO hms_schedule_exam_setup (hses_deptid, hses_roomid, hses_type, hses_time, hses_slot, hses_starttime, hses_endtime) VALUES
('S04', (SELECT room_id FROM dm_phongkham WHERE room_code = 'P04'), 'S', 12, 7, '07:30', '11:30'),
('S04', (SELECT room_id FROM dm_phongkham WHERE room_code = 'P04'), 'C', 12, 7, '13:30', '17:00');

-- Hiển thị kết quả
SELECT 
    p.room_code,
    p.room_name,
    s.hses_type as session_type,
    s.hses_time as avg_time_minutes,
    s.hses_slot as max_patients_per_slot,
    s.hses_starttime as start_time,
    s.hses_endtime as end_time,
    -- Tính số slot trong ca
    ROUND(EXTRACT(EPOCH FROM (s.hses_endtime::time - s.hses_starttime::time)) / 60 / s.hses_time) as total_slots,
    -- Tính tổng số BN tối đa
    ROUND(EXTRACT(EPOCH FROM (s.hses_endtime::time - s.hses_starttime::time)) / 60 / s.hses_time) * s.hses_slot as max_patients
FROM dm_phongkham p
JOIN hms_schedule_exam_setup s ON p.room_id = s.hses_roomid
ORDER BY p.room_code, s.hses_type;
