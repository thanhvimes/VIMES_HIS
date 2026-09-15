
import { Request, Response } from 'express';
import { query } from '../../config/database';

class ReceptionDashboardController {
    async getStatistics(req: Request, res: Response) {
        try {
            // 1. Đã tiếp nhận (Tổng số hồ sơ tạo hôm nay)
            const receivedToday = await query(`
                SELECT COUNT(*) as count 
                FROM hms_doc 
                WHERE DATE(hd_admitdate) = CURRENT_DATE
            `);

            // 2. Đang chờ khám (Trạng thái O - Open)
            const waitingCount = await query(`
                SELECT COUNT(*) as count 
                FROM hms_doc 
                WHERE hd_status = 'O' AND DATE(hd_admitdate) = CURRENT_DATE
            `);

            // 3. Đã hoàn tất (Trạng thái T - Treated/Completed)
            const completedToday = await query(`
                SELECT COUNT(*) as count 
                FROM hms_doc 
                WHERE hd_status = 'T' AND DATE(hd_admitdate) = CURRENT_DATE
            `);

            // 4. Đặt lịch trước (Từ App/Web via qms_patient)
            const bookedToday = await query(`
                SELECT COUNT(*) as count 
                FROM qms_patient 
                WHERE qms_appointment_date = CURRENT_DATE AND qms_status != 'C'
            `);

            // 5. Doanh thu ước tính (Fake for now as no pricing column found in hms_exam, or use a default fee)
            // assuming 30,000 VND per completed exam if no price is found
            const completedCount = parseInt(completedToday.rows[0].count);
            const revenue = completedCount * 30000; 

            // 6. Thời gian chờ trung bình (phút)
            // Tính từ hd_admitdate đến hd_updateddate cho các hồ sơ đã xử lý
            const avgWaitTimeResult = await query(`
                SELECT AVG(EXTRACT(EPOCH FROM (hd_updateddate - hd_admitdate))/60) as avg_wait
                FROM hms_doc
                WHERE hd_status = 'T' AND DATE(hd_admitdate) = CURRENT_DATE
            `);

            // 7. Hourly data (Tiếp nhận theo giờ)
            const hourlyResult = await query(`
                SELECT 
                    EXTRACT(HOUR FROM hd_admitdate) as hour, 
                    COUNT(*) as count 
                FROM hms_doc 
                WHERE DATE(hd_admitdate) = CURRENT_DATE 
                GROUP BY hour 
                ORDER BY hour
            `);

            // 8. So sánh với hôm qua (%)
            const receivedYesterday = await query(`
                SELECT COUNT(*) as count 
                FROM hms_doc 
                WHERE DATE(hd_admitdate) = CURRENT_DATE - INTERVAL '1 day'
            `);
            
            const todayCount = parseInt(receivedToday.rows[0].count);
            const yesterdayCount = parseInt(receivedYesterday.rows[0].count);
            let growth = 0;
            if (yesterdayCount > 0) {
                growth = ((todayCount - yesterdayCount) / yesterdayCount) * 100;
            }

            // Fill all hours 7-17
            const defaultHours = [7, 8, 9, 10, 11, 13, 14, 15, 16, 17];
            const hourlyMap = new Map();
            hourlyResult.rows.forEach(r => hourlyMap.set(parseInt(r.hour), parseInt(r.count)));
            
            const hourlyData = defaultHours.map(h => ({
                hour: `${h}h`,
                patients: hourlyMap.get(h) || 0
            }));

            return res.json({
                stats: {
                    received: todayCount,
                    receivedYesterday: yesterdayCount,
                    growth: Math.round(growth),
                    waiting: parseInt(waitingCount.rows[0].count),
                    completed: completedCount,
                    booked: parseInt(bookedToday.rows[0].count),
                    revenue: revenue,
                    avgWaitTime: Math.round(avgWaitTimeResult.rows[0].avg_wait || 15)
                },
                hourlyData: hourlyData
            });
        } catch (error: any) {
            console.error('getReceptionStatistics error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const dashboardController = new ReceptionDashboardController();
