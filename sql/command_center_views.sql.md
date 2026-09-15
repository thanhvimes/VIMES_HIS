
# SQL Script: Tạo Views cho Command Center (Ngoại trú)

Chạy script này trên PostgreSQL để tạo các View cần thiết cho API.

```sql
-- 1. VIEW: Tổng quan KPI Ngoại trú (KPI Cards)
-- Logic: Tính toán số liệu tổng hợp theo ngày và khoa
CREATE OR REPLACE VIEW view_cc_outpatient_kpi AS
SELECT 
    v.visit_date AS report_date,
    d.code AS department_code,
    d.name AS department_name,
    COUNT(v.id) AS total_reception,
    SUM(CASE WHEN v.status = 'waiting' THEN 1 ELSE 0 END) AS waiting_count,
    SUM(CASE WHEN v.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
    SUM(CASE WHEN v.status = 'processing' THEN 1 ELSE 0 END) AS processing_count,
    COALESCE(SUM(b.total_amount), 0) AS revenue_est
FROM visits v
LEFT JOIN departments d ON v.department_id = d.id
LEFT JOIN bills b ON v.id = b.visit_id
GROUP BY v.visit_date, d.code, d.name;

-- 2. VIEW: Lưu lượng bệnh nhân theo giờ (Flow Chart)
-- Logic: Group by khung giờ (07:00, 08:00...)
CREATE OR REPLACE VIEW view_cc_outpatient_flow AS
SELECT 
    v.visit_date AS report_date,
    d.code AS department_code,
    TO_CHAR(v.check_in_time, 'HH24:00') AS time_slot,
    SUM(CASE WHEN v.type = 'Normal' THEN 1 ELSE 0 END) AS normal_count,
    SUM(CASE WHEN v.type = 'Service' THEN 1 ELSE 0 END) AS service_count,
    COUNT(*) AS total_count
FROM visits v
LEFT JOIN departments d ON v.department_id = d.id
GROUP BY v.visit_date, d.code, TO_CHAR(v.check_in_time, 'HH24:00');

-- 3. VIEW: Trạng thái phòng khám (Room Grid)
-- Logic: Lấy trạng thái hiện tại của từng phòng
CREATE OR REPLACE VIEW view_cc_room_status AS
SELECT 
    r.id AS room_id,
    r.name AS room_name,
    r.type AS room_type, -- 'Normal', 'Service', 'VIP'
    d.code AS department_code,
    -- Status logic: 0=Closed, 1=Available, 2=Occupied, 3=Full
    CASE 
        WHEN r.is_active = false THEN 0
        WHEN r.current_patient_id IS NULL THEN 1
        WHEN (SELECT COUNT(*) FROM queue q WHERE q.room_id = r.id AND q.status = 'waiting') > 10 THEN 3
        ELSE 2 
    END AS status,
    u.full_name AS doctor_name
FROM rooms r
LEFT JOIN departments d ON r.department_id = d.id
LEFT JOIN users u ON r.current_doctor_id = u.id;

-- 4. VIEW: Thống kê hàng đợi theo khoa (Queue List)
-- Logic: Tính toán số người chờ và thời gian chờ trung bình
CREATE OR REPLACE VIEW view_cc_department_queues AS
SELECT 
    d.name AS dept_name,
    d.code AS dept_code,
    COUNT(q.id) FILTER (WHERE q.status = 'waiting') AS waiting,
    COUNT(q.id) FILTER (WHERE q.status = 'processing') AS processing,
    (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id AND u.role = 'doctor' AND u.status = 'online') AS doctor_count,
    COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - q.check_in_time))/60) FILTER (WHERE q.status = 'waiting'), 0)::int AS avg_wait_time
FROM departments d
LEFT JOIN queue q ON d.id = q.department_id AND q.visit_date = CURRENT_DATE
GROUP BY d.id, d.name, d.code;
```
