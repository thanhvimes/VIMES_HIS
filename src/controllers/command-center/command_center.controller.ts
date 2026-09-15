// ==================== COMMAND CENTER CONTROLLER ====================
// File: backend/src/controllers/command_center.controller.ts

import { Request, Response } from 'express';
import { query } from '../../config/database';

export interface OutpatientKPI {
    totalReception: number;
    waitingCount: number;
    completedCount: number;
    revenueEst: number;
}

class CommandCenterController {

    /**
     * 1. Lấy chỉ số KPI Tổng quan (KPI Cards)
     * GET /api/v1/command-center/outpatient/kpi
     */
    async getOutpatientKPI(req: Request, res: Response) {
        try {
            const { fromDate, toDate, deptCode } = (req as any).query;

            let sql = `
                SELECT 
                    COALESCE(SUM(total_reception), 0) as "totalReception",
                    COALESCE(SUM(waiting_count), 0) as "waitingCount",
                    COALESCE(SUM(completed_count), 0) as "completedCount",
                    COALESCE(SUM(revenue_est), 0) as "revenueEst",
                    COALESCE(SUM(total_reception) FILTER (WHERE department_code NOT IN ('KBYC', 'KBTN')), 0) as "normalReception",
                    COALESCE(SUM(total_reception) FILTER (WHERE department_code IN ('KBYC', 'KBTN')), 0) as "serviceReception"
                FROM view_cc_outpatient_kpi
                WHERE 1=1
            `;

            const params: any[] = [];
            let paramIdx = 1;

            if (!fromDate && !toDate) {
                sql += ` AND report_date = CURRENT_DATE`;
            } else {
                if (fromDate) {
                    params.push(fromDate);
                    sql += ` AND report_date >= $${paramIdx++}`;
                }
                if (toDate) {
                    params.push(toDate);
                    sql += ` AND report_date <= $${paramIdx++}`;
                }
            }

            if (deptCode) {
                params.push(deptCode);
                sql += ` AND department_code = $${paramIdx++}`;
            }

            const result = await query(sql, params);
            const data = result.rows[0] || { totalReception: 0, waitingCount: 0, completedCount: 0, revenueEst: 0, normalReception: 0, serviceReception: 0 };

            // Tìm khoa có số lượng chờ cao nhất
            const peakDeptResult = await query(`
                SELECT department_name as "name", waiting_count as "count"
                FROM view_cc_outpatient_kpi
                WHERE report_date = CURRENT_DATE
                ORDER BY waiting_count DESC
                LIMIT 1
            `);
            const peakDept = peakDeptResult.rows[0];

            return res.json({
                totalReception: Number(data.totalReception),
                waitingCount: Number(data.waitingCount),
                completedCount: Number(data.completedCount),
                revenueEst: Number(data.revenueEst),
                normalReception: Number(data.normalReception),
                serviceReception: Number(data.serviceReception),
                highestWaitingDept: peakDept ? `${peakDept.name} (${peakDept.count})` : '--',
                completionRate: Number(data.totalReception) > 0 
                    ? Math.round((Number(data.completedCount) / Number(data.totalReception)) * 100) 
                    : 0
            });
        } catch (error: any) {
            console.error('Error fetching KPI:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * 2. Lấy biểu đồ lưu lượng (Flow Chart)
     * GET /api/v1/command-center/outpatient/flow
     */
    async getOutpatientFlow(req: Request, res: Response) {
        try {
            const { date, deptCode } = (req as any).query;

            let sql = `
                WITH HourSeries AS (
                    SELECT LPAD(h::text, 2, '0') || ':00' as time_slot, h as hour_val
                    FROM generate_series(6, 18) h
                )
                SELECT 
                    hs.time_slot as "time",
                    COUNT(*) FILTER (WHERE f.hour_reception = hs.time_slot)::int as "reception",
                    COUNT(*) FILTER (WHERE f.hour_start = hs.time_slot)::int as "start",
                    COUNT(*) FILTER (WHERE f.hour_finish = hs.time_slot)::int as "finish"
                FROM HourSeries hs
                LEFT JOIN view_cc_outpatient_flow f ON (
                    (f.hour_reception = hs.time_slot OR f.hour_start = hs.time_slot OR f.hour_finish = hs.time_slot)
                )
            `;

            const params: any[] = [];
            let paramIdx = 1;

            if (!date) {
                sql += ` AND (f.report_date = CURRENT_DATE OR f.report_date IS NULL)`;
            } else {
                params.push(date);
                sql += ` AND (f.report_date = $${paramIdx++} OR f.report_date IS NULL)`;
            }

            if (deptCode) {
                params.push(deptCode);
                sql += ` AND f.department_code = $${paramIdx++}`;
            }

            sql += ` GROUP BY hs.time_slot, hs.hour_val ORDER BY hs.hour_val`;

            const result = await query(sql, params);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('Error fetching Flow:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * 3. Lấy trạng thái phòng khám (Room Grid)
     */
    async getRoomStatus(req: Request, res: Response) {
        try {
            const { deptCode } = (req as any).query;

            let sql = `
                SELECT 
                    room_id as "id",
                    room_name as "name",
                    room_type as "type",
                    status,
                    doctor_name as "doctor",
                    waiting_count as "waiting",
                    completed_count as "completed"
                FROM view_cc_room_status
                WHERE 1=1
            `;

            const params: any[] = [];
            if (deptCode) {
                params.push(deptCode);
                sql += ` AND department_code = $1`;
            }

            sql += ` ORDER BY room_name`;

            const result = await query(sql, params);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('Error fetching Rooms:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * 4. Lấy thống kê hàng đợi theo khoa (Queue List)
     */
    async getQueueStatus(req: Request, res: Response) {
        try {
            const sql = `
                SELECT 
                    dept_name as "name",
                    waiting::int as "waiting",
                    processing::int as "processing",
                    doctor_count::int as "doctorCount",
                    avg_wait_time::int as "avgWait"
                FROM view_cc_department_queues
                ORDER BY waiting DESC
            `;

            const result = await query(sql);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('Error fetching Queues:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * 4. Lấy công suất giường bệnh (Inpatient Bed Capacity)
     */
    async getBedCapacity(req: Request, res: Response) {
        try {
            const result = await query(`SELECT * FROM view_cc_bed_capacity ORDER BY occupancy_rate DESC`);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('Error fetching Bed Capacity:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * 5. Lấy trạng thái phòng mổ (OR Status)
     */
    async getORStatus(req: Request, res: Response) {
        try {
            const result = await query(`SELECT * FROM view_cc_or_status ORDER BY or_name`);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('Error fetching OR Status:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * 6. Lấy thời gian chờ trung bình (Wait Times)
     */
    async getAvgWaitTimes(req: Request, res: Response) {
        try {
            const result = await query(`SELECT * FROM view_cc_avg_wait_times`);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('Error fetching Wait Times:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export default new CommandCenterController();
