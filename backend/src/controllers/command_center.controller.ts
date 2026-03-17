// ==================== COMMAND CENTER CONTROLLER ====================
// File: backend/src/controllers/command_center.controller.ts

import { Request, Response } from 'express';
import { query } from '../config/database';

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
                    COALESCE(SUM(revenue_est), 0) as "revenueEst"
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
            const data = result.rows[0] || { totalReception: 0, waitingCount: 0, completedCount: 0, revenueEst: 0 };

            return res.json({
                totalReception: Number(data.totalReception),
                waitingCount: Number(data.waitingCount),
                completedCount: Number(data.completedCount),
                revenueEst: Number(data.revenueEst)
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
                SELECT 
                    time_slot as "time",
                    SUM(normal_count)::int as "normal",
                    SUM(service_count)::int as "service"
                FROM view_cc_outpatient_flow
                WHERE 1=1
            `;

            const params: any[] = [];
            let paramIdx = 1;

            if (!date) {
                sql += ` AND report_date = CURRENT_DATE`;
            } else {
                params.push(date);
                sql += ` AND report_date = $${paramIdx++}`;
            }

            if (deptCode) {
                params.push(deptCode);
                sql += ` AND department_code = $${paramIdx++}`;
            }

            sql += ` GROUP BY time_slot ORDER BY time_slot`;

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
                    doctor_name as "doctor"
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
}

export default new CommandCenterController();
