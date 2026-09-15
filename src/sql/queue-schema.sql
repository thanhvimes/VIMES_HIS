
-- 1. Bảng danh mục Khoa (clinic_queue_departments)
CREATE TABLE IF NOT EXISTS clinic_queue_departments (
    id VARCHAR(20) PRIMARY KEY, 
    name VARCHAR(100) NOT NULL, 
    description TEXT,
    code_prefix VARCHAR(10)
);

-- 2. Bảng cấu hình Phòng (clinic_queue_rooms)
CREATE TABLE IF NOT EXISTS clinic_queue_rooms (
    id VARCHAR(50) PRIMARY KEY, 
    department_id VARCHAR(20) REFERENCES clinic_queue_departments(id), 
    name VARCHAR(100),
    doctor_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    start_time VARCHAR(20) DEFAULT '07:30',
    end_time VARCHAR(20) DEFAULT '17:00',
    avg_duration INT DEFAULT 15,
    max_capacity INT DEFAULT 100,
    theme_id VARCHAR(50) DEFAULT 'hospital-light',
    custom_display_name VARCHAR(200),
    list_title VARCHAR(200),
    marquee_message TEXT,
    ad_duration INT DEFAULT 10,
    enabled_default_ads JSONB DEFAULT '[]',
    voice_config JSONB DEFAULT '{}',
    style_config JSONB DEFAULT '{}'
);

-- 3. Bảng lưu bệnh nhân (clinic_queue_patients)
CREATE TABLE IF NOT EXISTS clinic_queue_patients (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(50) REFERENCES clinic_queue_rooms(id),
    department_id VARCHAR(20) REFERENCES clinic_queue_departments(id),
    code VARCHAR(20),
    name VARCHAR(100),
    age INT,
    reason TEXT,
    is_priority BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'WAITING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Người dùng QMS (Dành riêng cho Queue)
CREATE TABLE IF NOT EXISTS clinic_queue_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'DOCTOR',
    room_ids JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEX --
CREATE INDEX IF NOT EXISTS idx_clinic_queue_pts_dept_date ON clinic_queue_patients(department_id, created_at);

-- SEED DATA --
INSERT INTO clinic_queue_departments (id, name, code_prefix) VALUES 
('KKB', 'Khoa Khám Bệnh', 'K'),
('CDHA', 'Chẩn Đoán Hình Ảnh', 'HA'),
('XN', 'Khoa Xét Nghiệm', 'XN')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    code_prefix = EXCLUDED.code_prefix;

INSERT INTO clinic_queue_rooms (id, department_id, name) VALUES 
('KKB-P101', 'KKB', 'P.101 - Khám Nội'),
('KKB-P102', 'KKB', 'P.102 - Khám Ngoại'),
('CDHA-SA1', 'CDHA', 'P.Siêu âm 1')
ON CONFLICT (id) DO UPDATE SET
    department_id = EXCLUDED.department_id,
    name = EXCLUDED.name;
