const { query } = require('../src/config/database');

/**
 * Script khởi tạo khung giờ khám cho 30 ngày tới
 */
async function generateSlots() {
    try {
        console.log('🚀 Đang khởi tạo khung giờ khám cho 30 ngày tới...');

        const sql = `
        DO $$ 
        DECLARE 
            r RECORD;
            d DATE;
            start_date DATE := CURRENT_DATE;
            end_date DATE := CURRENT_DATE + 30;
        BEGIN
            FOR r IN (
                SELECT DISTINCT hrk_deptid, hrk_id 
                FROM hms_roomlist_kios 
                WHERE hrk_active = 'Y' 
                AND hrk_deptid = 'KB'
            ) LOOP
                d := start_date;
                WHILE d <= end_date LOOP
                    PERFORM public.hms_schedule_create('SYSTEM', r.hrk_deptid, r.hrk_id, d);
                    d := d + 1;
                END LOOP;
                RAISE NOTICE 'Hoàn tất cho Phòng %', r.hrk_id;
            END LOOP;
        END $$;`;

        await query(sql);

        console.log('✅ Đã khởi tạo xong toàn bộ khung giờ khám.');

        const stats = await query(`
            SELECT hse_date, COUNT(*) as slots 
            FROM hms_schedule_exam 
            WHERE hse_date >= CURRENT_DATE 
            GROUP BY hse_date 
            ORDER BY hse_date LIMIT 5
        `);

        console.log('📊 Thống kê sơ bộ (5 ngày tới):');
        console.table(stats.rows);

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi khởi tạo khung giờ:', error);
        process.exit(1);
    }
}

generateSlots();
