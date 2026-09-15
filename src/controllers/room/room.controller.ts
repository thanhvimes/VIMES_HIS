// ==================== ROOM CONTROLLER ====================
// File: backend/src/controllers/room.controller.ts

import { Request, Response } from 'express';
import { query } from '../../config/database';

export interface RoomScheduleSetup {
    deptId: string;
    roomId: string;
    type: 'S' | 'C';
    avgTime: number;
    maxSlot: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
    deptName?: string;
    roomName?: string;
    createdAt?: string;
    updatedAt?: string;
}

class RoomController {

    /**
     * Lấy danh sách cấu hình lịch
     * GET /api/v1/room-schedules
     */
    async getSchedules(req: Request, res: Response) {
        try {
            const { deptId, roomId, type } = (req as any).query;

            let sql = `
                SELECT 
                    s.hses_deptid as "deptId",
                    s.hses_roomid as "roomId",
                    s.hses_type as type,
                    s.hses_time as "avgTime",
                    s.hses_slot as "maxSlot",
                    s.hses_starttime as "startTime",
                    s.hses_endtime as "endTime",
                    s.is_active as "isActive",
                    d.sd_name as "deptName",
                    r.hrl_roomname as "roomName",
                    s.created_at as "createdAt",
                    s.updated_at as "updatedAt"
                FROM hms_schedule_exam_setup s
                LEFT JOIN sys_dept d ON (d.sd_id = s.hses_deptid AND d.sd_isactive = 'Y')
                LEFT JOIN hms_roomlist r ON (r.hrl_deptid = s.hses_deptid AND r.hrl_id = s.hses_roomid)
                WHERE 1=1
            `;

            const params: any[] = [];
            let paramIndex = 1;

            if (deptId) {
                sql += ` AND s.hses_deptid = $${paramIndex++}`;
                params.push(deptId);
            }

            if (roomId) {
                sql += ` AND s.hses_roomid = $${paramIndex++}`;
                params.push(roomId);
            }

            if (type) {
                sql += ` AND s.hses_type = $${paramIndex++}`;
                params.push(type);
            }

            sql += ' ORDER BY s.hses_deptid, s.hses_roomid, s.hses_type';

            const result = await query(sql, params);
            return res.json(result.rows);

        } catch (error) {
            console.error('Error getting schedules:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách cấu hình' });
        }
    }

    /**
     * Lấy cấu hình theo phòng
     * GET /api/v1/room-schedules/:deptId/:roomId
     */
    async getScheduleByRoom(req: Request, res: Response) {
        try {
            const { deptId, roomId } = (req as any).params;

            const result = await query(`
                SELECT 
                    s.hses_deptid as "deptId",
                    s.hses_roomid as "roomId",
                    s.hses_type as type,
                    s.hses_time as "avgTime",
                    s.hses_slot as "maxSlot",
                    s.hses_starttime as "startTime",
                    s.hses_endtime as "endTime",
                    s.is_active as "isActive",
                    d.sd_name as "deptName",
                    r.hrl_roomname as "roomName"
                FROM hms_schedule_exam_setup s
                LEFT JOIN sys_dept d ON (d.sd_id = s.hses_deptid AND d.sd_isactive = 'Y')
                LEFT JOIN hms_roomlist r ON (r.hrl_deptid = s.hses_deptid AND r.hrl_id = s.hses_roomid)
                WHERE s.hses_deptid = $1 AND s.hses_roomid = $2
                ORDER BY s.hses_type
            `, [deptId, roomId]);

            return res.json(result.rows);
        } catch (error) {
            console.error('Error getting schedule:', error);
            return res.status(500).json({ error: 'Không thể lấy cấu hình lịch' });
        }
    }

    /**
     * Tạo/Cập nhật cấu hình lịch
     * POST /api/v1/room-schedules
     */
    async upsertSchedule(req: Request, res: Response) {
        try {
            const { deptId, roomId, type, avgTime, maxSlot, startTime, endTime, isActive } = (req as any).body;

            if (!deptId || !roomId || !type || !avgTime || !maxSlot || !startTime || !endTime) {
                return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
            }

            if (!['S', 'C'].includes(type)) {
                return res.status(400).json({ error: 'Loại ca không hợp lệ (S hoặc C)' });
            }

            if (avgTime <= 0 || maxSlot <= 0) {
                return res.status(400).json({ error: 'Thời gian và số slot phải lớn hơn 0' });
            }

            const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
                return res.status(400).json({ error: 'Định dạng giờ không hợp lệ (HH:MM)' });
            }

            if (startTime >= endTime) {
                return res.status(400).json({ error: 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc' });
            }

            const result = await query(`
                INSERT INTO hms_schedule_exam_setup
                    (hses_deptid, hses_roomid, hses_type, hses_time, hses_slot, hses_starttime, hses_endtime, is_active)
                VALUES($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT(hses_deptid, hses_roomid, hses_type)
                DO UPDATE SET
                    hses_time = EXCLUDED.hses_time,
                    hses_slot = EXCLUDED.hses_slot,
                    hses_starttime = EXCLUDED.hses_starttime,
                    hses_endtime = EXCLUDED.hses_endtime,
                    is_active = EXCLUDED.is_active,
                    updated_at = NOW()
                RETURNING *
            `, [deptId, roomId, type, avgTime, maxSlot, startTime, endTime, isActive !== false]);

            return res.json({
                success: true,
                schedule: result.rows[0],
                message: 'Lưu cấu hình thành công'
            });

        } catch (error) {
            console.error('Error upserting schedule:', error);
            return res.status(500).json({ error: 'Không thể lưu cấu hình' });
        }
    }

    /**
     * Xóa cấu hình lịch
     * DELETE /api/v1/room-schedules/:deptId/:roomId/:type
     */
    async deleteSchedule(req: Request, res: Response) {
        try {
            const { deptId, roomId, type } = (req as any).params;

            const result = await query(`
                DELETE FROM hms_schedule_exam_setup
                WHERE hses_deptid = $1 AND hses_roomid = $2 AND hses_type = $3
                RETURNING *
            `, [deptId, roomId, type]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Không tìm thấy cấu hình' });
            }

            return res.json({
                success: true,
                message: 'Xóa cấu hình thành công'
            });

        } catch (error) {
            console.error('Error deleting schedule:', error);
            return res.status(500).json({ error: 'Không thể xóa cấu hình' });
        }
    }
}

export default new RoomController();
