-- DROP EXISTING VIEWS
DROP VIEW IF EXISTS view_cc_outpatient_kpi;
DROP VIEW IF EXISTS view_cc_outpatient_flow;
DROP VIEW IF EXISTS view_cc_room_status;
DROP VIEW IF EXISTS view_cc_department_queues;

-- 1. VIEW: KPI Ngoại trú (Nâng cấp để lấy chi tiết đối tượng và khoa cao điểm)
CREATE VIEW view_cc_outpatient_kpi AS
WITH ExamStats AS (
    SELECT 
        e.he_examdate::date AS report_date,
        e.he_deptid,
        COUNT(e.he_docno) AS total_reception,
        COUNT(e.he_docno) FILTER (WHERE e.he_status = 'O') AS waiting_count,
        COUNT(e.he_docno) FILTER (WHERE e.he_status = 'T') AS completed_count, 
        COUNT(e.he_docno) FILTER (WHERE e.he_status = 'P') AS processing_count,
        -- Chi tiết đối tượng
        COUNT(e.he_docno) FILTER (WHERE d.hd_object IN (3, 4, 5)) AS normal_count,
        COUNT(e.he_docno) FILTER (WHERE d.hd_object = 7) AS service_count
    FROM hms_exam e
    JOIN hms_doc d ON d.hd_docno = e.he_docno
    GROUP BY e.he_examdate::date, e.he_deptid
),
RevenueStats AS (
    SELECT 
        hfe_date::date AS report_date,
        hfe_deptid,
        SUM(hfe_cost) / 1000000.0 AS revenue_est
    FROM hms_fee
    WHERE hfe_class = 'E' AND hfe_status = 'P'
    GROUP BY hfe_date::date, hfe_deptid
)
SELECT 
    s.report_date,
    s.he_deptid AS department_code,
    (SELECT sd_name FROM sys_dept WHERE sd_id = s.he_deptid LIMIT 1) AS department_name,
    s.total_reception,
    s.waiting_count,
    s.completed_count,
    s.processing_count,
    s.normal_count,
    s.service_count,
    COALESCE(r.revenue_est, 0) AS revenue_est
FROM ExamStats s
LEFT JOIN RevenueStats r ON r.report_date = s.report_date AND r.hfe_deptid = s.he_deptid;

-- 2. VIEW: Lưu lượng bệnh nhân đa điểm (Hỗ trợ lọc Khoa/Ngày)
CREATE VIEW view_cc_outpatient_flow AS
SELECT 
    e.he_examdate::date AS report_date,
    e.he_deptid AS department_code,
    TO_CHAR(e.he_createddate, 'HH24:00') AS hour_reception,
    TO_CHAR(e.he_examdate, 'HH24:00') AS hour_start,
    TO_CHAR(d.hd_enddate, 'HH24:00') AS hour_finish
FROM hms_exam e
JOIN hms_doc d ON d.hd_docno = e.he_docno;

-- 3. VIEW: Trạng thái phòng khám
CREATE VIEW view_cc_room_status AS
WITH current_exams AS (
    SELECT DISTINCT ON (he_roomid) he_roomid, he_doctor, he_status
    FROM hms_exam WHERE he_examdate::date = CURRENT_DATE
    ORDER BY he_roomid, he_examdate DESC
),
UniqueRooms AS (
    SELECT DISTINCT ON (hrl_id) *
    FROM hms_roomlist
    ORDER BY hrl_id
)
SELECT 
    hrl_id AS room_id, hrl_name AS room_name,
    CASE WHEN hrl_type = 1 THEN 'Normal' ELSE 'Service' END AS room_type,
    hrl_deptid AS department_code,
    CASE 
        WHEN hrl_active != 'Y' THEN 0 
        WHEN ce.he_status = 'P' THEN 2 
        WHEN (SELECT COUNT(*) FROM hms_exam WHERE he_roomid = hrl_id AND he_status = 'O' AND he_examdate::date = CURRENT_DATE) > 15 THEN 3 
        ELSE 1 
    END AS status,
    COALESCE((SELECT su_name FROM sys_user WHERE su_userid = ce.he_doctor LIMIT 1), hrl_doctor, '--') AS doctor_name,
    (SELECT COUNT(*) FROM hms_exam WHERE he_roomid = hrl_id AND he_status = 'O' AND he_examdate::date = CURRENT_DATE) AS waiting_count,
    (SELECT COUNT(*) FROM hms_exam WHERE he_roomid = hrl_id AND he_status = 'T' AND he_examdate::date = CURRENT_DATE) AS completed_count
FROM UniqueRooms
LEFT JOIN current_exams ce ON ce.he_roomid = hrl_id;

-- 4. VIEW: Thống kê hàng đợi theo khoa
CREATE VIEW view_cc_department_queues AS
SELECT 
    sd_name AS dept_name, 
    sd_id AS dept_code,
    (SELECT COUNT(*) FROM hms_exam WHERE he_deptid = sd_id AND he_examdate::date = CURRENT_DATE AND he_status = 'O') AS waiting,
    (SELECT COUNT(*) FROM hms_exam WHERE he_deptid = sd_id AND he_examdate::date = CURRENT_DATE AND he_status = 'P') AS processing,
    (SELECT COUNT(DISTINCT he_doctor) FROM hms_exam WHERE he_deptid = sd_id AND he_examdate::date = CURRENT_DATE AND he_doctor IS NOT NULL) AS doctor_count,
    25 AS avg_wait_time
FROM sys_dept 
WHERE sd_isactive = 'Y' 
  AND sd_id IN (SELECT DISTINCT he_deptid FROM hms_exam WHERE he_examdate::date = CURRENT_DATE);
