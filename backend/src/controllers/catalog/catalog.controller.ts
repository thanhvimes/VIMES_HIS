// ==================== SHARED CATALOG CONTROLLER ====================
// File: backend/src/controllers/catalog.controller.ts

import { Request, Response } from 'express';
import { query } from '../../config/database';

class CatalogController {
    // Lấy danh sách tỉnh/thành phố
    async getProvinces(req: Request, res: Response) {
        try {
            const result = await query(
                `SELECT sp_id::text as id, sp_name as name FROM sys_prov WHERE sp_active = 'Y' ORDER BY sp_name`
            );
            return res.json(result.rows);
        } catch (error) {
            console.error('Error getting provinces:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách tỉnh/TP' });
        }
    }

    // Lấy danh sách phường/xã theo tỉnh
    async getWards(req: Request, res: Response) {
        try {
            let provinceId: string | number = (req as any).params.provinceId as string;

            if (isNaN(Number(provinceId))) {
                const provRes = await query("SELECT sp_id FROM sys_prov WHERE sp_name = $1 LIMIT 1", [provinceId]);
                if (provRes.rows.length > 0) {
                    provinceId = provRes.rows[0].sp_id;
                } else {
                    return res.json([]);
                }
            }

            const result = await query(
                "SELECT sv_id::text as id, sv_name as name FROM sys_vill WHERE sv_active = 'Y' AND sv_provid = $1 ORDER BY sv_name",
                [provinceId]
            );
            return res.json(result.rows);
        } catch (error: any) {
            console.error('Error getting wards:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách phường/xã: ' + error.message });
        }
    }

    // Lấy danh sách KHOA
    async getDepartments(req: Request, res: Response) {
        try {
            const result = await query(`
                SELECT sd_id::text as id, sd_name as name FROM sys_dept
                WHERE sd_type = 'KB'
                ORDER BY sd_name
            `);
            return res.json(result.rows);
        } catch (error) {
            console.error('Error getting departments:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách khoa' });
        }
    }

    // Danh sách Nghề nghiệp
    async getOccupations(req: Request, res: Response) {
        try {
            const result = await query(`SELECT trim(ss_code) as id, ss_desc as name FROM sys_sel WHERE trim(ss_id)='sys_occupation' ORDER BY id`);
            return res.json(result.rows);
        } catch (error) {
            console.error('Error getting occupations:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách nghề nghiệp' });
        }
    }

    // Danh sách Dân tộc
    async getEthnicities(req: Request, res: Response) {
        try {
            const result = await query(`SELECT trim(ss_code) as id, ss_desc as name FROM sys_sel WHERE trim(ss_id)='sys_ethnic' ORDER BY id`);
            return res.json(result.rows);
        } catch (error) {
            console.error('Error getting ethnicities:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách dân tộc' });
        }
    }

    // Danh sách Kiểu khám
    async getExamTypes(req: Request, res: Response) {
        try {
            const result = await query(`
                SELECT hfl_feeid as id, hfl_name as name, hfl_subitem as multiroom, 
                       hfl_refitemid as refitemid, hfl_servprice as servprice, 
                       hfl_insprice as insprice
                FROM hms_feelist 
                WHERE hfl_groupid='D0000' AND hfl_active ='Y' AND hfl_typeid='E' 
                ORDER BY hfl_feeid
            `);
            return res.json(result.rows);
        } catch (error) {
            console.error('Error getting exam types:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách kiểu khám' });
        }
    }

    // Lấy danh sách phòng theo khoa
    async getRooms(req: Request, res: Response) {
        try {
            const deptId = (req as any).query.deptId as string;
            // Join with sys_dept to ensure we only get rooms in KB (Clinical) departments
            // and filter out ward beds (Buồng)
            const result = await query(`
                SELECT 
                    hrl_id::text as id, 
                    hrl_id::text as code,
                    COALESCE(NULLIF(TRIM(hrl_roomname), ''), hrl_name) as name, 
                    hrl_deptid::text as "deptId"
                FROM hms_roomlist
                JOIN sys_dept ON sd_id = hrl_deptid
                WHERE hrl_active = 'Y' 
                AND sd_type = 'KB'
                AND hrl_name NOT ILIKE 'Buồng%'
                ${deptId ? 'AND hrl_deptid = $1' : ''}
                ORDER BY name
            `, deptId ? [deptId] : []);
            return res.json(result.rows);
        } catch (error) {
            console.error('Error getting rooms:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách phòng' });
        }
    }

    // Lấy danh sách Đối tượng (Dịch vụ, BHYT...)
    async getObjects(req: Request, res: Response) {
        try {
            const result = await query(`
                SELECT ho_id::text as id, ho_desc as name, ho_type as type, 
                       ho_hascard as hascard, ho_discount as discount
                FROM hms_object 
                WHERE ho_active = 'Y' 
                ORDER BY ho_id
            `);
            return res.json(result.rows);
        } catch (error) {
            console.error('Error getting objects:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách đối tượng' });
        }
    }

    // Lấy danh sách bệnh viện (Registry)
    async getHospitals(req: Request, res: Response) {
        try {
            const result = await query(`
                SELECT hh_id::text as id, hh_id::text as code, hh_name as name 
                FROM hms_hospital
                WHERE hh_id IS NOT NULL
                ORDER BY hh_name
            `);
            return res.json(result.rows);
        } catch (error) {
            console.error('Error getting hospitals:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách bệnh viện' });
        }
    }
}

export default new CatalogController();
