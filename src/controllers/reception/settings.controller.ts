
import { Request, Response } from 'express';
import { query, hmsQuery } from '../../config/database';

class ReceptionSettingsController {
    /** Lấy cấu hình máy in */
    async getPrinterConfig(req: Request, res: Response) {
        try {
            const result = await query(
                `SELECT setting_value FROM sys_settings WHERE setting_key = 'reception_printer_config'`
            );
            
            if (result.rows.length === 0) {
                return res.json({
                    enabled: true,
                    type: 'DRIVER',
                    printerName: '',
                    printMode: 'IMAGE',
                    encodingMode: 'UTF8'
                });
            }
            
            return res.json(JSON.parse(result.rows[0].setting_value));
        } catch (error: any) {
            console.error('[getPrinterConfig] Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /** Cập nhật cấu hình máy in */
    async updatePrinterConfig(req: Request, res: Response) {
        try {
            const config = (req as any).body;
            await hmsQuery(req,
                `INSERT INTO sys_settings (setting_key, setting_value, setting_type, category, is_system)
                 VALUES ('reception_printer_config', $1, 'json', 'RECEPTION', true)
                 ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1, updated_at = NOW()`,
                [JSON.stringify(config)]
            );
            return res.json({ success: true, message: 'Đã lưu cấu hình máy in' });
        } catch (error: any) {
            console.error('[updatePrinterConfig] Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /** Lấy danh sách cấu hình phòng khám */
    async getRoomsSettings(req: Request, res: Response) {
        try {
            const { deptId } = (req as any).query;
            let sql = `
                SELECT 
                    hrl_id::text as id, 
                    hrl_name as name, 
                    hrl_roomname as "roomName",
                    hrl_deptid as "deptId",
                    hrl_max_per_day as "maxPerDay",
                    hrl_reception_enabled as "receptionEnabled",
                    hrl_active as "active"
                FROM hms_roomlist
                JOIN sys_dept ON sd_id = hrl_deptid
                WHERE sd_type = 'KB'
                AND hrl_name NOT ILIKE 'Buồng%'
            `;
            const params: any[] = [];
            if (deptId) {
                sql += " AND hrl_deptid = $1 ";
                params.push(deptId);
            }
            sql += " ORDER BY hrl_deptid, hrl_name ";

            const result = await query(sql, params);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('[getRoomsSettings] Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /** Cập nhật cấu hình một phòng khám */
    async updateRoomSettings(req: Request, res: Response) {
        try {
            const { id } = (req as any).params;
            const { maxPerDay, receptionEnabled } = (req as any).body;
            
            await hmsQuery(req,
                `UPDATE hms_roomlist 
                 SET hrl_max_per_day = $1, hrl_reception_enabled = $2
                 WHERE hrl_id::text = $3`,
                [maxPerDay, receptionEnabled, id]
            );
            
            return res.json({ success: true, message: 'Cập nhật cấu hình phòng khám thành công' });
        } catch (error: any) {
            console.error('[updateRoomSettings] Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export default new ReceptionSettingsController();
