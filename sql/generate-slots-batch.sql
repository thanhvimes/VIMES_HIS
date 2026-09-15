-- ========================================================
-- SCRIPT KHỞI TẠO KHUNG GIỜ KHÁM (FIX LỖI -2)
-- ========================================================

DO $$ 
DECLARE 
    r RECORD;
    d DATE;
    start_date DATE := CURRENT_DATE; -- Ngày bắt đầu (hôm nay)
    end_date DATE := CURRENT_DATE + 30; -- Tạo cho 30 ngày tới
BEGIN
    -- Vòng lặp quan từng phòng khám có hoạt động (hrk_active = 'Y')
    FOR r IN (
        SELECT DISTINCT hrk_deptid, hrk_id 
        FROM hms_roomlist_kios 
        WHERE hrk_active = 'Y' 
        AND hrk_deptid = 'KB' -- Thay 'KB' bằng mã khoa của bạn nếu cần
    ) LOOP
        
        -- Vòng lặp qua từng ngày trong khoảng đã chọn
        d := start_date;
        WHILE d <= end_date LOOP
            -- Gọi hàm khởi tạo slot của hệ thống
            -- Tham số: (user, mã khoa, ID phòng, ngày)
            PERFORM public.hms_schedule_create('ADMIN', r.hrk_deptid, r.hrk_id, d);
            
            d := d + 1;
        END LOOP;
        
        RAISE NOTICE 'Đã khởi tạo xong cho Phòng ID: %', r.hrk_id;
    END LOOP;
END $$;

-- ========================================================
-- CÂU LỆNH KIỂM TRA LẠI DỮ LIỆU
-- ========================================================
SELECT hse_date, hse_roomid, COUNT(*) as total_slots
FROM hms_schedule_exam
WHERE hse_date >= CURRENT_DATE
GROUP BY hse_date, hse_roomid
ORDER BY hse_date, hse_roomid;
