const { query } = require('../config/database');

class ScheduleService {
    /**
     * Khởi tạo khung giờ cho một khoảng ngày
     * @param {number} daysAhead - Số ngày tới cần khởi tạo
     */
    async initializeSlots(daysAhead = 30) {
        try {
            console.log(`🤖 [ScheduleService] Đang tự động khởi tạo khung giờ cho ${daysAhead} ngày tới...`);

            const sql = `
            DO $$ 
            DECLARE 
                r RECORD;
                d DATE;
                start_date DATE := CURRENT_DATE;
                end_date DATE := CURRENT_DATE + ${daysAhead};
            BEGIN
                -- Chỉ lấy các phòng khám đang hoạt động
                FOR r IN (
                    SELECT DISTINCT hrk_deptid, hrk_id 
                    FROM hms_roomlist_kios 
                    WHERE hrk_active = 'Y' 
                ) LOOP
                    d := start_date;
                    WHILE d <= end_date LOOP
                        -- Gọi hàm HIS chuẩn để tạo slot
                        PERFORM public.hms_schedule_create('SYSTEM', r.hrk_deptid, r.hrk_id, d);
                        d := d + 1;
                    END LOOP;
                END LOOP;
            END $$;`;

            await query(sql);
            console.log('✅ [ScheduleService] Khởi tạo khung giờ thành công.');
            return { success: true, message: 'Đã khởi tạo xong khung giờ khám.' };
        } catch (error) {
            console.error('❌ [ScheduleService] Lỗi khi khởi tạo khung giờ:', error);
            throw error;
        }
    }

    /**
     * Thiết lập các tác vụ tự động
     */
    setupAutomatedJobs() {
        // Chạy ngay khi server start để đảm bảo luôn có dữ liệu
        this.initializeSlots(14).catch(() => { });

        // Sử dụng node-cron nếu được cài đặt, hoặc setInterval như giải pháp dự phòng
        try {
            const cron = require('node-cron');
            // Chạy lúc 00:01 hàng ngày
            cron.schedule('1 0 * * *', () => {
                this.initializeSlots(30);
            });
            console.log('⏰ [ScheduleService] Đã thiết lập Cron Job: Chạy hàng ngày lúc 00:01');
        } catch (e) {
            console.log('⚠️ [ScheduleService] node-cron chưa được cài đặt. Sử dụng setInterval (24h)...');
            // Chạy mỗi 24 giờ
            setInterval(() => {
                this.initializeSlots(30);
            }, 24 * 60 * 60 * 1000);
        }
    }
}

module.exports = new ScheduleService();
