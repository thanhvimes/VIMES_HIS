-- Migration 039: Create hms_roomlist_kios table for Kiosk and Online Booking room-specialty mapping
CREATE TABLE IF NOT EXISTS hms_roomlist_kios (
    hrk_idx SERIAL PRIMARY KEY,
    hrk_deptid VARCHAR(50) NOT NULL,
    hrk_id INTEGER NOT NULL,
    hrk_code INTEGER NOT NULL,
    hrk_active VARCHAR(1) DEFAULT 'Y',
    hrk_createdby VARCHAR(50) DEFAULT 'system',
    hrk_createddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hrk_updatedby VARCHAR(50) DEFAULT 'system',
    hrk_updateddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Safe Index Creation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_hrk_dept_id_code') THEN
        CREATE INDEX idx_hrk_dept_id_code ON hms_roomlist_kios(hrk_deptid, hrk_id, hrk_code);
    END IF;
END $$;

-- Seed default sys_sel for hms_room_kios if not exists
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '1', 'Khám đầu mặt cổ,tuyến giáp', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '1');
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '2', 'Khám vú', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '2');
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '3', 'Khám phụ khoa', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '3');
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '4', 'Khám tiêu hóa', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '4');
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '5', 'Khám phổi', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '5');
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '6', 'Khám y học hạt nhân(t1 nhà c)', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '6');
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '7', 'Khám lồng ngực', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '7');
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '8', 'Khám nội', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '8');
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '9', 'Khám Chuyên khoa', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '9');
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '10', 'Khám gan mật', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '10');
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '11', 'Khám tiết niệu', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '11');
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '12', 'Khám tiêu hóa - cơ xương khớp', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '12');
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '13', 'Khám giáo sư', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '13');
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '14', 'Khám tổng hợp', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '14');
INSERT INTO sys_sel (ss_id, ss_code, ss_desc, ss_active, ss_isactive)
SELECT 'hms_room_kios', '15', 'Khám thần kinh', 'Y', 'Y' WHERE NOT EXISTS (SELECT 1 FROM sys_sel WHERE ss_id = 'hms_room_kios' AND ss_code = '15');
