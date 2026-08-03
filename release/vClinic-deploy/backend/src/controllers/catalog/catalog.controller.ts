// ==================== SHARED CATALOG CONTROLLER ====================
// File: backend/src/controllers/catalog.controller.ts

import { Request, Response } from 'express';
import { query } from '../../config/database';

class CatalogController {
    // Lấy danh sách tỉnh/thành phố
    async getProvinces(req: Request, res: Response) {
        try {
            const result = await query(
                `SELECT sp_id::text as id, sp_name as name FROM sys_prov WHERE COALESCE(sp_isactive, sp_active) = 'Y' ORDER BY sp_name`
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
                `SELECT sd_id::text as id, sd_name as name FROM sys_dist WHERE COALESCE(sd_active, 'Y') = 'Y' AND sd_provid = $1 ORDER BY sd_name`,
                [provinceId]
            );
            return res.json(result.rows);
        } catch (error: any) {
            console.error('Error getting districts:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách quận/huyện: ' + error.message });
        }
    }

    // Lấy danh sách phường/xã theo tỉnh hoặc huyện
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
                "SELECT sv_id::text as id, sv_name as name FROM sys_vill WHERE COALESCE(sv_isactive, 'Y') = 'Y' AND (sv_provid = $1 OR sv_distid = $1) ORDER BY sv_name",
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

    // Tìm kiếm danh mục ICD-10 từ bảng hms_icd
    async searchIcd10(req: Request, res: Response) {
        const q = String(req.query.q || '').trim();
        try {
            const columnsRes = await query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'hms_icd'
            `);
            
            const columns = columnsRes.rows.map(r => r.column_name.toLowerCase());
            if (columns.length === 0) {
                return res.status(404).json({ error: 'Bảng hms_icd không tồn tại hoặc không có cột nào' });
            }

            let codeCol = '';
            if (columns.includes('hi_icd')) codeCol = 'hi_icd';
            else if (columns.includes('hi_code')) codeCol = 'hi_code';
            else if (columns.includes('icd_code')) codeCol = 'icd_code';
            else codeCol = columns.find(c => c.includes('icd') || c.includes('code')) || columns[0];

            let nameCol = '';
            if (columns.includes('hi_name')) nameCol = 'hi_name';
            else if (columns.includes('hi_desc')) nameCol = 'hi_desc';
            else if (columns.includes('hi_vietname')) nameCol = 'hi_vietname';
            else nameCol = columns.find(c => c.includes('name') || c.includes('desc') || c.includes('viet')) || columns[1];

            if (!codeCol || !nameCol) {
                return res.status(500).json({ error: 'Không tìm thấy cấu trúc cột thích hợp trong bảng hms_icd' });
            }

            const sql = `
                SELECT ${codeCol}::text as code, ${nameCol}::text as name 
                FROM hms_icd 
                WHERE ${codeCol} ILIKE $1 OR ${nameCol} ILIKE $1 
                ORDER BY ${codeCol} 
                LIMIT 50
            `;
            const result = await query(sql, [`%${q}%`]);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('Error searching ICD-10:', error);
            return res.status(500).json({ error: 'Lỗi tìm kiếm danh mục ICD: ' + error.message });
        }
    }
}

export default new CatalogController();
