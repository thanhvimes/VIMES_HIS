-- ==================== HMS BOOKING TABLE ====================
-- File: backend/sql/create-booking-table.sql
-- Bảng lưu trữ lịch đặt khám

CREATE TABLE IF NOT EXISTS public.hms_booking (
    hb_id SERIAL PRIMARY KEY,
    hb_createdby VARCHAR(15),
    hb_createddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hb_updatedby VARCHAR(15),
    hb_updateddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Thông tin phòng khám
    hb_deptid VARCHAR(7) NOT NULL,
    hb_roomid INTEGER NOT NULL,
    
    -- Thông tin lịch hẹn
    hb_date DATE NOT NULL,
    hb_time TIME NOT NULL,
    hb_slot_no INTEGER,
    
    -- Thông tin bệnh nhân
    hb_patient_id VARCHAR(15),
    hb_patient_name VARCHAR(100) NOT NULL,
    hb_patient_phone VARCHAR(20),
    hb_patient_idcard VARCHAR(20),
    hb_patient_birthdate DATE,
    hb_patient_sex VARCHAR(1),
    hb_patient_address TEXT,
    
    -- Địa chỉ
    hb_province_id INTEGER,
    hb_ward_id INTEGER,
    
    -- Thông tin khám
    hb_speciality_code INTEGER,
    hb_reason TEXT,
    hb_is_priority VARCHAR(1) DEFAULT 'N',
    
    -- Trạng thái
    hb_status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, CONFIRMED, CANCELLED, COMPLETED
    hb_note TEXT,
    
    -- Mã đặt lịch
    hb_booking_code VARCHAR(20) UNIQUE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_dept_room 
    ON hms_booking(hb_deptid, hb_roomid);

CREATE INDEX IF NOT EXISTS idx_booking_date 
    ON hms_booking(hb_date);

CREATE INDEX IF NOT EXISTS idx_booking_status 
    ON hms_booking(hb_status);

CREATE INDEX IF NOT EXISTS idx_booking_patient 
    ON hms_booking(hb_patient_id);

-- Comments
COMMENT ON TABLE hms_booking IS 'Lịch đặt khám online';
COMMENT ON COLUMN hms_booking.hb_status IS 'PENDING, CONFIRMED, CANCELLED, COMPLETED';
