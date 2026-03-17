
import { Request, Response } from 'express';
import { query } from '../config/database';

export class AuditController {
    /**
     * Lấy lịch sử log của một bản ghi cụ thể
     */
    static async getLogs(req: Request, res: Response) {
        try {
            const { tableName, recordId } = (req as any).query;

            if (!tableName || !recordId) {
                return res.status(400).json({ message: 'Thiếu tableName hoặc recordId' });
            }

            const result = await query(`
                SELECT 
                    l.id, 
                    l.action, 
                    l.changed_fields, 
                    l.old_data, 
                    l.new_data, 
                    l.user_id, 
                    u.su_name as user_name,
                    l.client_ip, 
                    l.context_module, 
                    l.created_at
                FROM sys_audit_log l
                LEFT JOIN sys_user u ON u.su_userid = l.user_id
                WHERE l.table_name = $1 AND l.record_id = $2
                ORDER BY l.created_at DESC
            `, [tableName, recordId]);

            res.json(result.rows);
        } catch (error: any) {
            console.error('Lỗi lấy audit logs:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Lấy lịch sử log gộp từ nhiều bảng/bản ghi (Dùng cho màn hình gộp)
     */
    static async getCommonLogs(req: Request, res: Response) {
        try {
            const { targets } = (req as any).body; // Array of { tableName, recordId }

            if (!Array.isArray(targets) || targets.length === 0) {
                return res.status(400).json({ message: 'Thiếu danh sách đối tượng cần lấy log' });
            }

            // Xây dựng điều kiện OR dựa trên targets
            const conditions = targets.map((_, i) => `(l.table_name = $${i * 2 + 1} AND l.record_id = $${i * 2 + 2})`).join(' OR ');
            const params = targets.flatMap(t => [t.tableName, String(t.recordId)]);

            const result = await query(`
                SELECT 
                    l.id, 
                    l.table_name,
                    l.record_id,
                    l.action, 
                    l.changed_fields, 
                    l.old_data, 
                    l.new_data, 
                    l.user_id, 
                    u.su_name as user_name,
                    l.client_ip, 
                    l.context_module, 
                    l.created_at
                FROM sys_audit_log l
                LEFT JOIN sys_user u ON u.su_userid = l.user_id
                WHERE ${conditions}
                ORDER BY l.created_at DESC
                LIMIT 200
            `, params);

            res.json(result.rows);
        } catch (error: any) {
            console.error('Lỗi lấy common audit logs:', error);
            res.status(500).json({ message: error.message });
        }
    }
}
