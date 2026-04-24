
import { Request, Response } from 'express';
import { pool } from '../config/database';
import QueueService from '../services/queue.service';

export class QueueController {
  
  static async getDepartments(req: Request, res: Response) {
    try {
        const query = `
            SELECT 
                d.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', r.id, 
                            'name', r.name,
                            'is_active', r.is_active
                        ) ORDER BY r.id
                    ) FILTER (WHERE r.id IS NOT NULL), 
                    '[]'
                ) as rooms
            FROM clinic_queue_departments d
            LEFT JOIN clinic_queue_rooms r ON d.id = r.department_id
            GROUP BY d.id
            ORDER BY d.id ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (e: any) { res.status(500).json({error: e.message}); }
  }

  static async getRoomQueue(req: Request, res: Response) { 
    try {
        const { id } = req.params;
        const roomRes = await pool.query("SELECT department_id FROM clinic_queue_rooms WHERE id = $1", [id]);
        let deptId = null;
        if(roomRes.rows.length > 0) deptId = roomRes.rows[0].department_id;

        const result = await pool.query(
            `SELECT * FROM clinic_queue_patients 
             WHERE (room_id = $1 OR (department_id = $2 AND room_id IS NULL)) 
             AND created_at::date = CURRENT_DATE 
             ORDER BY 
                CASE WHEN status = 'SERVING' THEN 0 
                     WHEN status = 'WAITING' THEN 1 
                     ELSE 2 END,
                is_priority DESC, 
                id ASC`,
            [id, deptId]
        );
        res.json(result.rows.map(mapPatientFromDB));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  }

  static async createTicket(req: Request, res: Response) {
    try {
        const { roomId, departmentId, name, age, reason, isPriority } = req.body;
        let targetDeptId = departmentId;
        
        if (!targetDeptId && roomId) {
             const r = await pool.query("SELECT department_id FROM clinic_queue_rooms WHERE id = $1", [roomId]);
             if (r.rows.length > 0) targetDeptId = r.rows[0].department_id;
        }

        if (!targetDeptId) return res.status(400).json({error: "Thiếu thông tin Khoa/Phòng"});

        const newPatientRaw = await QueueService.generateTicket(targetDeptId, { name, age, reason, isPriority });
        
        if (roomId) {
            await pool.query("UPDATE clinic_queue_patients SET room_id = $1 WHERE id = $2", [roomId, newPatientRaw.id]);
            newPatientRaw.room_id = roomId;
        }

        // Notify socket (assuming global socket is accessible or emit through service)
        // For simplicity, we just respond with the patient object.
        res.json(mapPatientFromDB(newPatientRaw));
    } catch (err: any) { res.status(500).json({error: err.message}); }
  }

  static async updatePatientStatus(req: Request, res: Response) { 
    try {
        const { id } = req.params;
        const { status, roomId } = req.body;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            if (status === 'SERVING') {
                await client.query("UPDATE clinic_queue_patients SET status = 'COMPLETED' WHERE room_id = $1 AND status = 'SERVING' AND id != $2", [roomId, id]);
                await client.query("UPDATE clinic_queue_patients SET status = $1, room_id = $3 WHERE id = $2", [status, id, roomId]);
            } else {
                await client.query("UPDATE clinic_queue_patients SET status = $1 WHERE id = $2", [status, id]);
            }
            await client.query('COMMIT');
        } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
        
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({error: err.message}); }
  }

  static async getRoom(req: Request, res: Response) { 
    try {
        const { id } = req.params;
        let room = await QueueService.getRoom(id as string);
        if (!room) {
             room = await QueueService.createRoomLazy(id as string, `Phòng ${id}`);
        }
        res.json(mapRoomFromDB(room));
    } catch (err: any) { res.status(500).json({error: err.message}); }
  }

  static async patchRoom(req: Request, res: Response) { 
    try {
        const { id } = req.params;
        const data = req.body;
        const mapping: Record<string, string> = { 
            name: 'name', 
            doctorName: 'doctor_name', 
            isActive: 'is_active', 
            themeId: 'theme_id', 
            customDisplayName: 'custom_display_name', 
            listTitle: 'list_title', 
            marqueeMessage: 'marquee_message', 
            adDuration: 'ad_duration', 
            styleConfig: 'style_config', 
            voiceConfig: 'voice_config', 
            enabledDefaultAds: 'enabled_default_ads', 
            startTime: 'start_time', 
            endTime: 'end_time', 
            avgDuration: 'avg_duration', 
            maxCapacity: 'max_capacity' 
        };
        
        const updates: string[] = []; 
        const values: any[] = []; 
        let i = 1;
        for (const [key, val] of Object.entries(data)) {
            const dbKey = mapping[key];
            if (dbKey) { updates.push(`${dbKey} = $${i++}`); values.push(val); }
        }
        if (updates.length > 0) {
            values.push(id as string);
            const result = await pool.query(`UPDATE clinic_queue_rooms SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values);
            return res.json(mapRoomFromDB(result.rows[0]));
        }
        res.json({ success: true }); 
    } catch (err: any) { res.status(500).json({error: err.message}); }
  }

  static async callPatient(req: Request, res: Response) { 
    try {
        const { id } = req.params;
        const { patientId, voiceConfig } = req.body;
        // In vClinic, socket.io is integrated into the central server.
        // For now we just return success.
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({error: err.message}); }
  }
}

const mapRoomFromDB = (row: any) => ({ 
    id: row.id, name: row.name, description: '', doctorName: row.doctor_name, 
    departmentId: row.department_id, startTime: row.start_time, endTime: row.end_time, 
    avgDuration: row.avg_duration, maxCapacity: row.max_capacity, isActive: row.is_active, 
    themeId: row.theme_id, customDisplayName: row.custom_display_name, listTitle: row.list_title, 
    marqueeMessage: row.marquee_message, enabledDefaultAds: row.enabled_default_ads || [], 
    adDuration: row.ad_duration, voiceConfig: row.voice_config || {}, styleConfig: row.style_config || {} 
});

const mapPatientFromDB = (row: any) => ({ 
    id: row.id.toString(), code: row.code, name: row.name, age: row.age, 
    reason: row.reason, isPriority: row.is_priority, status: row.status, 
    timestamp: new Date(row.created_at).getTime(), roomId: row.room_id, departmentId: row.department_id 
});
