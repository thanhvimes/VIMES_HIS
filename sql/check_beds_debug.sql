-- Kiểm tra số lượng bản ghi trong bảng giường bệnh
SELECT count(*) as total_records FROM hms_bed;

-- Kiểm tra các loại khoa (sd_type) hiện có trong hệ thống
SELECT sd_type, count(*) FROM sys_dept GROUP BY sd_type;

-- Kiểm tra 5 bản ghi mẫu của bảng giường bệnh để xem trạng thái hb_status
SELECT hb_deptid, hb_status, count(*) FROM hms_bed GROUP BY hb_deptid, hb_status LIMIT 10;
