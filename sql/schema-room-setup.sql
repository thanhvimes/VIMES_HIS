-- ==================== ROOM SETUP SCHEMA ====================
-- File: backend/sql/schema-room-setup.sql
-- Purpose: Tạo bảng quản lý phòng khám và cấu hình lịch đăng ký online

-- 1. Bảng danh mục phòng khám
CREATE TABLE IF NOT EXISTS dm_phongkham (
    room_id SERIAL PRIMARY KEY,
    room_code VARCHAR(20) UNIQUE NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    dept_id VARCHAR(15),
    location VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index cho tìm kiếm theo khoa
CREATE INDEX idx_dm_phongkham_dept ON dm_phongkham(dept_id) WHERE is_active = true;

-- 2. Bảng cấu hình lịch khám (dựa trên hms_schedule_exam_setup)
CREATE TABLE IF NOT EXISTS hms_schedule_exam_setup (
    hses_deptid VARCHAR(15) NOT NULL,
    hses_roomid INTEGER NOT NULL,
    hses_type VARCHAR(1) NOT NULL CHECK (hses_type IN ('S', 'C')),
    hses_time INTEGER NOT NULL CHECK (hses_time > 0),
    hses_slot INTEGER NOT NULL CHECK (hses_slot > 0),
    hses_starttime VARCHAR(5) NOT NULL,
    hses_endtime VARCHAR(5) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (hses_deptid, hses_roomid, hses_type)
);

-- Index cho tìm kiếm
CREATE INDEX idx_schedule_dept_room ON hms_schedule_exam_setup(hses_deptid, hses_roomid);
CREATE INDEX idx_schedule_type ON hms_schedule_exam_setup(hses_type);

-- Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dm_phongkham_updated_at
    BEFORE UPDATE ON dm_phongkham
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hms_schedule_exam_setup_updated_at
    BEFORE UPDATE ON hms_schedule_exam_setup
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE dm_phongkham IS 'Danh mục phòng khám';
COMMENT ON COLUMN dm_phongkham.room_code IS 'Mã phòng khám (unique)';
COMMENT ON COLUMN dm_phongkham.room_name IS 'Tên phòng khám';
COMMENT ON COLUMN dm_phongkham.dept_id IS 'Mã khoa/chuyên khoa';

COMMENT ON TABLE hms_schedule_exam_setup IS 'Cấu hình lịch khám đăng ký online';
COMMENT ON COLUMN hms_schedule_exam_setup.hses_deptid IS 'Mã khoa/phòng';
COMMENT ON COLUMN hms_schedule_exam_setup.hses_roomid IS 'Mã phòng khám';
COMMENT ON COLUMN hms_schedule_exam_setup.hses_type IS 'Loại ca: S=Sáng, C=Chiều';
COMMENT ON COLUMN hms_schedule_exam_setup.hses_time IS 'Thời gian khám trung bình của một slot (phút)';
COMMENT ON COLUMN hms_schedule_exam_setup.hses_slot IS 'Số lượng bệnh nhân tối đa mỗi slot';
COMMENT ON COLUMN hms_schedule_exam_setup.hses_starttime IS 'Giờ bắt đầu ca (HH:MM)';
COMMENT ON COLUMN hms_schedule_exam_setup.hses_endtime IS 'Giờ kết thúc ca (HH:MM)';
