-- ======================================================
-- 5. VIEW: CÔNG SUẤT GIƯỜNG BỆNH (TÍNH THEO THỰC TẾ VẬN HÀNH)
-- ======================================================
DROP VIEW IF EXISTS view_cc_bed_capacity;
CREATE VIEW view_cc_bed_capacity AS
WITH BedStats AS (
    SELECT 
        hb_deptid,
        -- Đếm số giường duy nhất dựa trên tổ hợp Khoa + Phòng + Số giường
        COUNT(DISTINCT (hb_deptid || '-' || hb_roomid || '-' || hb_bedid)) AS total_operating_beds,
        -- Đếm số giường đang có bệnh nhân (status = 'O')
        COUNT(DISTINCT (hb_deptid || '-' || hb_roomid || '-' || hb_bedid)) FILTER (WHERE hb_status = 'O') AS occupied_beds
    FROM hms_bed
    WHERE hb_createddate > CURRENT_DATE - INTERVAL '30 days' -- Chỉ tính các giường có hoạt động trong 30 ngày qua
    GROUP BY hb_deptid
)
SELECT 
    sd.sd_name AS dept_name,
    sd.sd_id AS dept_code,
    COALESCE(bs.total_operating_beds, 0) AS total_beds,
    COALESCE(bs.occupied_beds, 0) AS occupied_beds,
    CASE 
        WHEN COALESCE(bs.total_operating_beds, 0) > 0 
        THEN ROUND((bs.occupied_beds::numeric / bs.total_operating_beds) * 100, 1)
        ELSE 0 
    END AS occupancy_rate
FROM sys_dept sd
JOIN BedStats bs ON bs.hb_deptid = sd.sd_id
WHERE sd.sd_type = 'DT' AND sd.sd_isactive = 'Y'
ORDER BY occupancy_rate DESC;

-- Giữ nguyên các View khác
-- 6. VIEW: TRẠNG THÁI PHÒNG MỔ
DROP VIEW IF EXISTS view_cc_or_status;
CREATE VIEW view_cc_or_status AS
SELECT 
    hr.hrl_id AS or_id,
    hr.hrl_name AS or_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM hms_operation WHERE ho_roomid = hr.hrl_id AND ho_status = 'P') THEN 'IN_USE'
        WHEN EXISTS (SELECT 1 FROM hms_operation WHERE ho_roomid = hr.hrl_id AND ho_status = 'C') THEN 'CLEANING'
        ELSE 'AVAILABLE'
    END AS status,
    (SELECT ho_diagnostic FROM hms_operation WHERE ho_roomid = hr.hrl_id AND ho_status = 'P' ORDER BY ho_createddate DESC LIMIT 1) AS current_procedure,
    (SELECT su_name FROM sys_user WHERE su_userid = (SELECT ho_practitioner FROM hms_operation WHERE ho_roomid = hr.hrl_id AND ho_status = 'P' ORDER BY ho_createddate DESC LIMIT 1)) AS surgeon_name
FROM hms_roomlist hr
WHERE hr.hrl_deptid IN (SELECT sd_id FROM sys_dept WHERE sd_name ILIKE '%Phẫu thuật%' OR sd_name ILIKE '%Gây mê%');

-- 7. VIEW: THỜI GIAN CHỜ TRUNG BÌNH
DROP VIEW IF EXISTS view_cc_avg_wait_times;
CREATE VIEW view_cc_avg_wait_times AS
SELECT 'Tiếp đón' AS stage, COALESCE(AVG(EXTRACT(EPOCH FROM (he_examdate - he_createddate))/60), 0)::int AS avg_minutes FROM hms_exam WHERE he_examdate::date = CURRENT_DATE AND he_examdate IS NOT NULL
UNION ALL
SELECT 'Khám Nội' AS stage, COALESCE(AVG(EXTRACT(EPOCH FROM (hd_enddate - he_examdate))/60), 0)::int AS avg_minutes FROM hms_exam e JOIN hms_doc d ON d.hd_docno = e.he_docno WHERE e.he_examdate::date = CURRENT_DATE AND d.hd_enddate IS NOT NULL
UNION ALL
SELECT 'Xét nghiệm' AS stage, COALESCE(AVG(EXTRACT(EPOCH FROM (hpc_performdate - hpc_createddate))/60), 0)::int AS avg_minutes FROM hms_testorder WHERE hpc_performdate::date = CURRENT_DATE AND hpc_performdate IS NOT NULL
UNION ALL
SELECT 'Chẩn đoán hình ảnh' AS stage, COALESCE(AVG(EXTRACT(EPOCH FROM (hpc_performdate - hpc_createddate))/60), 0)::int AS avg_minutes FROM hms_pacsorder WHERE hpc_performdate::date = CURRENT_DATE AND hpc_performdate IS NOT NULL
UNION ALL
SELECT 'Dược BHYT' AS stage, COALESCE(AVG(EXTRACT(EPOCH FROM (hfe_date - d.hd_enddate))/60), 0)::int AS avg_minutes FROM hms_fee f JOIN hms_doc d ON d.hd_docno = f.hfe_docno WHERE f.hfe_date::date = CURRENT_DATE AND f.hfe_class = 'D' AND d.hd_enddate IS NOT NULL;
