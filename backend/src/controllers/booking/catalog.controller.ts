// ==================== BOOKING CATALOG CONTROLLER ====================
// File: backend/src/controllers/booking/catalog.controller.ts

import { Request, Response } from 'express';
import { query } from '../../config/database';
import { AuthRequest } from '../../middleware/authMiddleware';

class BookingCatalogController {
    // Lấy danh sách tỉnh/thành phố
    async getProvinces(req: Request, res: Response) {
        try {
            const result = await query(
                `SELECT sp_id as id, sp_name as name FROM sys_prov WHERE sp_isactive = 'Y' ORDER BY sp_name`
            );
            return res.json(result.rows);
        } catch (error) {
            console.error('Error getting provinces:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách tỉnh/TP' });
        }
    }

    // Lấy danh sách quận/huyện theo tỉnh
    async getDistricts(req: Request, res: Response) {
        try {
            const { provinceId } = (req as any).params;
            const result = await query(
                `SELECT sd_id as id, sd_name as name FROM sys_dist WHERE sd_active = 'Y' AND sd_provid = $1 ORDER BY sd_name`,
                [provinceId]
            );
            return res.json(result.rows);
        } catch (error) {
            console.error('Error getting districts:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách quận/huyện' });
        }
    }

    // Lấy danh sách phường/xã theo tỉnh
    async getWards(req: Request, res: Response) {
        try {
            const { provinceId } = (req as any).params;
            const result = await query(
                "SELECT sv_id as id, sv_name as name FROM sys_vill WHERE sv_isactive = 'Y' AND (sv_provid = $1 OR sv_distid = $1) ORDER BY sv_name",
                [provinceId]
            );
            return res.json(result.rows);
        } catch (error) {
            console.error('Error getting wards:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách phường/xã' });
        }
    }

    // Lấy danh sách KHOA (từ sys_dept)
    async getDepartments(req: Request, res: Response) {
        try {
            const result = await query(`
                SELECT 
                    sd_id as id,
                    sd_name as name,
                    sd_type as type
                FROM sys_dept
                WHERE sd_type = 'KB' AND sd_isactive = 'Y'
                ORDER BY sd_name
            `);
            return res.json(result.rows);
        } catch (error) {
            console.error('Error getting departments:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách khoa' });
        }
    }

    private async ensureKiosTable() {
        try {
            await query(`
                CREATE TABLE IF NOT EXISTS hms_roomlist_kios (
                    hrk_idx SERIAL PRIMARY KEY,
                    hrk_deptid VARCHAR(50) NOT NULL,
                    hrk_id INTEGER NOT NULL,
                    hrk_code INTEGER NOT NULL,
                    hrk_active VARCHAR(1) DEFAULT 'Y',
                    hrk_createdby VARCHAR(50) DEFAULT 'system',
                    hrk_createddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    hrk_updatedby VARCHAR(50) DEFAULT 'system',
                    hrk_updateddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
        } catch (e) {
            // ignore if exists
        }
    }

    // Lấy danh sách LOẠI KHÁM CHUYÊN KHOA theo Mã Khoa (deptId) của user đăng nhập
    async getSpecialities(req: AuthRequest, res: Response) {
        try {
            await this.ensureKiosTable();
            const userDeptId = ((req as any).query.deptId as string) || (req as any).user?.deptId || 'KB';

            let sql = `
                SELECT DISTINCT 
                    hrk_code as id, 
                    ss_desc as name,
                    hrk_deptid as "deptId"
                FROM hms_roomlist_kios
                LEFT JOIN sys_sel ON (ss_id = 'hms_room_kios' AND CAST(ss_code AS INT) = hrk_code)
                WHERE hrk_active = 'Y'
            `;

            const params: any[] = [];

            if (userDeptId && userDeptId !== 'All') {
                sql += ` AND hrk_deptid = $1`;
                params.push(userDeptId);
            }

            sql += ` ORDER BY ss_desc`;

            const result = await query(sql, params);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('Error getting specialities:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách chuyên khoa: ' + error.message });
        }
    }

    // Lấy danh sách phòng theo KHOA + CHUYÊN KHOA
    async getRoomsBySpeciality(req: AuthRequest, res: Response) {
        try {
            await this.ensureKiosTable();
            const { specialityCode } = (req as any).params;
            const userDeptId = ((req as any).query.deptId as string) || (req as any).user?.deptId;

            let sql = `
                SELECT DISTINCT
                    hrk_id as id,
                    hrk_deptid as "deptId",
                    r.hrl_roomname as name,
                    hrk_code as code
                FROM hms_roomlist_kios k
                LEFT JOIN hms_roomlist r ON (k.hrk_deptid = r.hrl_deptid AND k.hrk_id = r.hrl_id)
                WHERE k.hrk_code::varchar = $1::varchar 
                  AND k.hrk_active = 'Y'
            `;

            const params: any[] = [specialityCode];

            if (userDeptId && userDeptId !== 'All') {
                sql += ` AND k.hrk_deptid = $2`;
                params.push(userDeptId);
            }

            sql += ` ORDER BY hrk_id`;

            const result = await query(sql, params);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('Error getting rooms by speciality:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách phòng: ' + error.message });
        }
    }

    // Lấy slots khả dụng theo KHOA + CHUYÊN KHOA
    async getAvailableSlots(req: Request, res: Response) {
        try {
            const { deptId, roomId, date, specialityCode } = (req as any).query;

            if (!date || (!roomId && !specialityCode)) {
                return res.status(400).json({ error: 'Thiếu date và (roomId hoặc specialityCode)' });
            }

            let sql = '';
            let params: any[] = [];

            if (roomId && deptId) {
                sql = `
                    SELECT 
                        hse_time as time,
                        hse_receptno as "receptNo",
                        hse_status as status,
                        hse_doctor as doctor,
                        hse_type as type,
                        hse_roomid as "roomId"
                    FROM hms_schedule_exam
                    WHERE hse_deptid = $1
                      AND hse_roomid = $2
                      AND hse_date = $3
                      AND hse_status = 'O'
                    ORDER BY hse_time
                `;
                params = [deptId, roomId, date];
            } else if (specialityCode && deptId) {
                sql = `
                    SELECT DISTINCT ON (hse_time)
                        hse_time as time,
                        MIN(hse_receptno) as "receptNo",
                        'O' as status,
                        'Auto' as type,
                        COUNT(hse_time) as "available",
                        MAX(hse_roomid) as "roomId"
                    FROM hms_schedule_exam hse
                    JOIN hms_roomlist_kios k ON (k.hrk_deptid = hse.hse_deptid AND k.hrk_id = hse.hse_roomid)
                    WHERE hse.hse_deptid = $1
                      AND k.hrk_code::varchar = $2::varchar
                      AND hse.hse_date = $3
                      AND hse.hse_status = 'O'
                      AND k.hrk_active = 'Y'
                    GROUP BY hse_time
                    ORDER BY hse_time
                `;
                params = [deptId, specialityCode, date];
            } else {
                return res.status(400).json({ error: 'Thiếu thông tin deptId' });
            }

            const result = await query(sql, params);
            return res.json(result.rows);
        } catch (error) {
            console.error('Error getting available slots:', error);
            return res.status(500).json({ error: 'Không thể lấy khung giờ' });
        }
    }
}

export default new BookingCatalogController();
