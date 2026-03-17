// ==================== ROOM CONTROLLER ====================
// File: backend/src/controllers/room.controller.js

const db = require('../config/database');

class RoomController {

    // ==================== CẤU HÌNH LỊCH KHÁM ====================

    // Lấy danh sách cấu hình lịch
    // Lấy danh sách cấu hình lịch
    async getSchedules(req, res) {
        try {
            const { deptId, roomId, type } = req.query;

            let query = `
                SELECT 
                    s.hses_deptid as "deptId",
                    s.hses_roomid as "roomId",
                    s.hses_type as type,
                    s.hses_time as "avgTime",
                    s.hses_slot as "maxSlot",
                    s.hses_starttime as "startTime",
                    s.hses_endtime as "endTime",
                    s.is_active as "isActive",
                    (SELECT ss_desc FROM sys_sel WHERE ss_id = 'hms_roomlist_kios_hrk_code' AND ss_code = s.hses_deptid::varchar) as "deptName",
                    s.created_at as "createdAt",
                    s.updated_at as "updatedAt"
                FROM hms_schedule_exam_setup s
                WHERE 1=1
            `;

            const params = [];
            let paramIndex = 1;

            if (deptId) {
                query += ` AND s.hses_deptid = $${paramIndex}`;
                params.push(deptId);
                paramIndex++;
            }

            if (roomId) {
                query += ` AND s.hses_roomid = $${paramIndex}`;
                params.push(roomId);
                paramIndex++;
            }

            if (type) {
                query += ` AND s.hses_type = $${paramIndex}`;
                params.push(type);
                paramIndex++;
            }

            query += ' ORDER BY s.hses_deptid, s.hses_roomid, s.hses_type';

            const result = await db.query(query, params);
            res.json(result.rows);

        } catch (error) {
            console.error('Error getting schedules:', error);
            res.status(500).json({ error: 'Không thể lấy danh sách cấu hình' });
        }
    }

    // Lấy cấu hình theo phòng
    async getScheduleByRoom(req, res) {
        try {
            const { deptId, roomId } = req.params;

            const result = await db.query(`
                SELECT 
                    s.hses_deptid as "deptId",
                    s.hses_roomid as "roomId",
                    s.hses_type as type,
                    s.hses_time as "avgTime",
                    s.hses_slot as "maxSlot",
                    s.hses_starttime as "startTime",
                    s.hses_endtime as "endTime",
                    s.is_active as "isActive",
                    (SELECT ss_desc FROM sys_sel WHERE ss_id = 'hms_roomlist_kios_hrk_code' AND ss_code = s.hses_deptid::varchar) as "deptName"
                FROM hms_schedule_exam_setup s
                WHERE s.hses_deptid = $1 AND s.hses_roomid = $2
                ORDER BY s.hses_type
            `, [deptId, roomId]);

            res.json(result.rows);

        } catch (error) {
            console.error('Error getting schedule:', error);
            res.status(500).json({ error: 'Không thể lấy cấu hình lịch' });
        }
    }

    // Tạo/Cập nhật cấu hình lịch
    async upsertSchedule(req, res) {
        try {
            const { deptId, roomId, type, avgTime, maxSlot, startTime, endTime, isActive } = req.body;

            // Validate
            if (!deptId || !roomId || !type || !avgTime || !maxSlot || !startTime || !endTime) {
                return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
            }

            if (!['S', 'C'].includes(type)) {
                return res.status(400).json({ error: 'Loại ca không hợp lệ (S hoặc C)' });
            }

            if (avgTime <= 0 || maxSlot <= 0) {
                return res.status(400).json({ error: 'Thời gian và số slot phải lớn hơn 0' });
            }

            // Validate time format (HH:MM)
            const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
                return res.status(400).json({ error: 'Định dạng giờ không hợp lệ (HH:MM)' });
            }

            // Validate start < end
            if (startTime >= endTime) {
                return res.status(400).json({ error: 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc' });
            }

            const result = await db.query(`
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

            res.json({
                success: true,
                schedule: result.rows[0],
                message: 'Lưu cấu hình thành công'
            });

        } catch (error) {
            console.error('Error upserting schedule:', error);
            res.status(500).json({ error: 'Không thể lưu cấu hình' });
        }
    }

    // Xóa cấu hình lịch
    async deleteSchedule(req, res) {
        try {
            const { deptId, roomId, type } = req.params;

            const result = await db.query(`
                DELETE FROM hms_schedule_exam_setup
                WHERE hses_deptid = $1 AND hses_roomid = $2 AND hses_type = $3
            RETURNING *
                `, [deptId, roomId, type]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Không tìm thấy cấu hình' });
            }

            res.json({
                success: true,
                message: 'Xóa cấu hình thành công'
            });

        } catch (error) {
            console.error('Error deleting schedule:', error);
            res.status(500).json({ error: 'Không thể xóa cấu hình' });
        }
    }
}

module.exports = new RoomController();
