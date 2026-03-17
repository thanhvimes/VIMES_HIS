const { query } = require('../config/database');

class ScheduleService {
    /**
     * Tạo records trong HMS_SCHEDULE (Ca làm việc)
     * @param {string} deptId - Mã khoa
     * @param {number} daysAhead - Số ngày tới
     * @returns {Promise<number>} - Số ca làm việc đã tạo
     */
    async createScheduleRecords(deptId, daysAhead) {
        console.log(`[createScheduleRecords] Khởi tạo cho khoa ${deptId}, ${daysAhead} ngày...`);

        // Xóa schedule cũ trước
        await query(`
            DELETE FROM hms_schedule 
            WHERE hs_deptid = $1 AND hs_date >= CURRENT_DATE
        `, [deptId]);

        // ✅ ĐỌC CẤU HÌNH TỪ hms_schedule_exam_setup (HIS source of truth)
        const setupResult = await query(`
            SELECT 
                hses_deptid,
                hses_roomid,
                hses_type,
                hses_starttime,
                hses_endtime,
                hses_time as slot_duration,
                hses_slot as max_patients
            FROM hms_schedule_exam_setup
            WHERE hses_deptid = $1 AND is_active = true
            ORDER BY hses_roomid, hses_type
        `, [deptId]);

        if (setupResult.rows.length === 0) {
            console.log(`⚠️ Không tìm thấy cấu hình trong hms_schedule_exam_setup cho khoa ${deptId}`);
            return 0;
        }

        console.log(`✓ Tìm thấy ${setupResult.rows.length} cấu hình ca làm việc`);

        // Tạo schedule cho từng ngày dựa trên cấu hình
        let totalSchedules = 0;
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        for (const setup of setupResult.rows) {
            // ✅ VALIDATE TIME FORMAT (HH:MM)
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            if (!timeRegex.test(setup.hses_starttime) || !timeRegex.test(setup.hses_endtime)) {
                console.log(`⚠️ Bỏ qua Phòng ${setup.hses_roomid} vì sai định dạng giờ: ${setup.hses_starttime} - ${setup.hses_endtime}`);
                continue;
            }

            for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
                const scheduleDate = new Date(startDate);
                scheduleDate.setDate(scheduleDate.getDate() + dayOffset);
                const dateStr = scheduleDate.toISOString().split('T')[0];

                await query(`
                    INSERT INTO hms_schedule (
                        hs_deptid, hs_roomid, hs_date, hs_shift,
                        hs_start_time, hs_end_time, hs_slot_duration,
                        hs_max_patients, hs_active
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Y')
                    ON CONFLICT (hs_deptid, hs_roomid, hs_date, hs_shift) 
                    DO UPDATE SET 
                        hs_start_time = EXCLUDED.hs_start_time,
                        hs_end_time = EXCLUDED.hs_end_time,
                        hs_slot_duration = EXCLUDED.hs_slot_duration,
                        hs_max_patients = EXCLUDED.hs_max_patients,
                        hs_active = 'Y'
                `, [
                    setup.hses_deptid,
                    setup.hses_roomid,
                    dateStr,
                    setup.hses_type,
                    setup.hses_starttime,
                    setup.hses_endtime,
                    setup.slot_duration,
                    setup.max_patients
                ]);

                totalSchedules++;
            }

            console.log(`  ✓ Phòng ${setup.hses_roomid} - Ca ${setup.hses_type}: ${daysAhead} ngày`);
        }

        console.log(`✅ Đã tạo ${totalSchedules} ca làm việc từ cấu hình HIS`);

        // Đếm số records đã tạo
        const result = await query(`
            SELECT COUNT(*) as count 
            FROM hms_schedule 
            WHERE hs_deptid = $1 AND hs_date >= CURRENT_DATE
        `, [deptId]);

        return parseInt(result.rows[0].count);
    }

    /**
     * Tạo chi tiết slots trong HMS_SCHEDULE_EXAM
     * CHÚ Ý: Hàm này KHÔNG XÓA dữ liệu cũ để bảo toàn lịch hẹn mà bác sĩ đã tạo
     * Chỉ INSERT các slot CHƯA TỒN TẠI (dùng ON CONFLICT DO NOTHING)
     * @param {string} deptId - Mã khoa
     * @returns {Promise<number>} - Số slots đã tạo
     */
    async createExamSlots(deptId) {
        console.log(`[createExamSlots] Tạo slots cho khoa ${deptId}...`);

        // KHÔNG XÓA dữ liệu cũ - để bảo toàn lịch hẹn của bác sĩ
        // await query(`DELETE FROM hms_schedule_exam WHERE hse_deptid = $1 AND hse_date >= CURRENT_DATE`, [deptId]);

        // ✅ TỐI ƯU HÓA: Sử dụng generate_series để tạo tất cả slots trong 1 câu lệnh duy nhất
        // Thay vì dùng vòng lặp WHILE (gây lag server khi số lượng bản ghi lớn)
        const sql = `
        INSERT INTO hms_schedule_exam (
            hse_deptid, hse_roomid, hse_date, hse_time, hse_receptno, hse_type, hse_status
        )
        SELECT 
            s.hs_deptid,
            s.hs_roomid,
            s.hs_date,
            TO_CHAR(t, 'HH24:MI'),
            row_number() OVER (PARTITION BY s.hs_deptid, s.hs_roomid, s.hs_date ORDER BY t),
            s.hs_shift,
            'O' -- O = Open/Available
        FROM hms_schedule s,
        LATERAL generate_series(
            (s.hs_date + s.hs_start_time)::timestamp, 
            (s.hs_date + s.hs_end_time - interval '1 second')::timestamp, 
            (NULLIF(s.hs_slot_duration, 0) || ' minutes')::interval
        ) AS t
        WHERE s.hs_deptid = $1 
          AND s.hs_date >= CURRENT_DATE
          AND s.hs_active = 'Y'
          AND s.hs_slot_duration > 0 -- Tránh chia cho 0
        ON CONFLICT (hse_deptid, hse_roomid, hse_receptno, hse_date) 
        DO NOTHING;
        `;

        await query(sql, [deptId]);

        // Đếm tổng số slots hiện có (bao gồm cả cũ và mới)
        const result = await query(`
            SELECT COUNT(*) as count 
            FROM hms_schedule_exam 
            WHERE hse_deptid = $1 AND hse_date >= CURRENT_DATE
        `, [deptId]);

        const totalCount = parseInt(result.rows[0].count);
        console.log(`[createExamSlots] Tổng số slots hiện có: ${totalCount}`);

        return totalCount;
    }

    /**
     * Khởi tạo đầy đủ schedule cho một khoa
     * @param {number} daysAhead - Số ngày tới cần khởi tạo
     * @param {string} deptId - Mã khoa (BẮT BUỘC - lấy từ su_deptid của user đăng nhập)
     */
    async initializeSlots(daysAhead = 30, deptId) {
        if (!deptId) {
            throw new Error('deptId là bắt buộc. Phải truyền mã khoa của user đăng nhập.');
        }

        try {
            console.log(`🚀 [ScheduleService] Khởi tạo schedule cho khoa ${deptId}, ${daysAhead} ngày...`);

            // Bước 1: Tạo HMS_SCHEDULE
            console.log('📋 Bước 1: Tạo HMS_SCHEDULE...');
            const scheduleCount = await this.createScheduleRecords(deptId, daysAhead);
            console.log(`   ✅ Đã tạo ${scheduleCount} ca làm việc`);

            // Bước 2: Tạo HMS_SCHEDULE_EXAM
            console.log('📋 Bước 2: Tạo HMS_SCHEDULE_EXAM...');
            const slotCount = await this.createExamSlots(deptId);
            console.log(`   ✅ Đã tạo ${slotCount} slots thời gian`);

            console.log(`✅ [ScheduleService] Hoàn tất khởi tạo cho khoa ${deptId}`);

            return {
                success: true,
                message: `Đã khởi tạo xong cho khoa ${deptId}`,
                data: {
                    deptId,
                    daysAhead,
                    scheduleCount,
                    slotCount
                }
            };
        } catch (error) {
            console.error('❌ [ScheduleService] Lỗi khi khởi tạo:', error);
            throw error;
        }
    }

    /**
     * Thiết lập các tác vụ tự động
     * LƯU Ý: Đã VÔ HIỆU HÓA vì không thể xác định deptId của user khi server khởi động
     * User phải chủ động gọi API /api/v1/schedule/init để khởi tạo schedule cho khoa của mình
     */
    setupAutomatedJobs() {
        console.log('⚠️ [ScheduleService] setupAutomatedJobs đã bị vô hiệu hóa');
        console.log('💡 [ScheduleService] User cần gọi POST /api/v1/schedule/init để khởi tạo schedule');

        // VÔ HIỆU HÓA: Không thể tự động chạy vì không biết deptId của user
        // Giữ lại code để tham khảo nếu cần implement lại sau
        /*
        this.initializeSlots(14).catch(() => { });

        try {
            const cron = require('node-cron');
            cron.schedule('1 0 * * *', () => {
                // TODO: Cần lặp qua tất cả các khoa hoặc có cơ chế khác
                this.initializeSlots(30);
            });
            console.log('⏰ [ScheduleService] Đã thiết lập Cron Job: Chạy hàng ngày lúc 00:01');
        } catch (e) {
            console.log('⚠️ [ScheduleService] node-cron chưa được cài đặt. Sử dụng setInterval (24h)...');
            setInterval(() => {
                this.initializeSlots(30);
            }, 24 * 60 * 60 * 1000);
        }
        */
    }
}

module.exports = new ScheduleService();
