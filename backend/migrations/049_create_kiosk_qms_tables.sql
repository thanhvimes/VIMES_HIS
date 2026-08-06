-- ============================================================================
-- Migration 049: Create kiosk_areas, kiosk_counters, and kiosk_assignments
-- Idempotent schema definition for QMS Kiosk & Area Management
-- ============================================================================

CREATE TABLE IF NOT EXISTS kiosk_areas (
    area_id SERIAL PRIMARY KEY,
    area_name VARCHAR(255) NOT NULL,
    description TEXT,
    dept_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kiosk_counters (
    counter_id SERIAL PRIMARY KEY,
    counter_name VARCHAR(255) NOT NULL,
    area_id INTEGER REFERENCES kiosk_areas(area_id) ON DELETE SET NULL,
    description TEXT,
    is_priority BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kiosk_assignments (
    assignment_id SERIAL PRIMARY KEY,
    kiosk_id VARCHAR(100),
    counter_id INTEGER REFERENCES kiosk_counters(counter_id) ON DELETE CASCADE,
    area_id INTEGER REFERENCES kiosk_areas(area_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default QMS Area & Counter if empty
INSERT INTO kiosk_areas (area_id, area_name, description, dept_id)
VALUES (1, 'Khu vực Tiếp đón Chung', 'Khu vực lấy số thứ tự tự động tại Kiosk', 'KB')
ON CONFLICT (area_id) DO NOTHING;

INSERT INTO kiosk_counters (counter_id, counter_name, area_id, description, is_priority, is_active)
VALUES 
    (1, 'Quầy số 1', 1, 'Quầy tiếp đón bệnh nhân 1', false, true),
    (2, 'Quầy số 2', 1, 'Quầy tiếp đón bệnh nhân 2', false, true)
ON CONFLICT (counter_id) DO NOTHING;

SELECT setval('kiosk_areas_area_id_seq', COALESCE((SELECT MAX(area_id) FROM kiosk_areas), 1));
SELECT setval('kiosk_counters_counter_id_seq', COALESCE((SELECT MAX(counter_id) FROM kiosk_counters), 1));
