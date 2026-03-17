-- ==================== HMS SCHEDULE TABLE ====================
-- File: backend/sql/create-schedule-table.sql
-- Bảng lịch làm việc của phòng khám

CREATE TABLE IF NOT EXISTS public.hms_schedule (
    hs_id SERIAL PRIMARY KEY,
    hs_createdby VARCHAR(15),
    hs_createddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hs_updatedby VARCHAR(15),
    hs_updateddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Thông tin phòng khám
    hs_deptid VARCHAR(7) NOT NULL,           -- Mã khoa
    hs_roomid INTEGER NOT NULL,               -- ID phòng khám
    
    -- Thông tin lịch
    hs_date DATE NOT NULL,                    -- Ngày làm việc
    hs_dayofweek INTEGER,                     -- Thứ trong tuần (0=CN, 1=T2, ..., 6=T7)
    hs_shift VARCHAR(10),                     -- Ca làm việc (MORNING, AFTERNOON, EVENING)
    
    -- Khung giờ
    hs_start_time TIME NOT NULL,              -- Giờ bắt đầu
    hs_end_time TIME NOT NULL,                -- Giờ kết thúc
    hs_slot_duration INTEGER DEFAULT 15,      -- Thời lượng 1 slot (phút)
    
    -- Cấu hình slots
    hs_max_patients INTEGER DEFAULT 3,        -- Số BN tối đa mỗi slot
    hs_total_slots INTEGER,                   -- Tổng số slots (tính tự động)
    
    -- Trạng thái
    hs_active VARCHAR(1) DEFAULT 'Y',         -- Y/N
    hs_note TEXT,                             -- Ghi chú
    
    CONSTRAINT hms_schedule_unique UNIQUE (hs_deptid, hs_roomid, hs_date, hs_shift)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedule_dept_room 
    ON hms_schedule(hs_deptid, hs_roomid);

CREATE INDEX IF NOT EXISTS idx_schedule_date 
    ON hms_schedule(hs_date);

CREATE INDEX IF NOT EXISTS idx_schedule_active 
    ON hms_schedule(hs_active);

-- Comments
COMMENT ON TABLE hms_schedule IS 'Lịch làm việc của phòng khám';
COMMENT ON COLUMN hms_schedule.hs_slot_duration IS 'Thời lượng 1 slot (phút), mặc định 15 phút';
COMMENT ON COLUMN hms_schedule.hs_max_patients IS 'Số bệnh nhân tối đa mỗi slot, mặc định 3';
