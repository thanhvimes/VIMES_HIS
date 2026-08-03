import { Request, Response } from 'express';
import { query } from '../../config/database';

class ReceptionCatalogController {
    async getProvinces(req: Request, res: Response) {
        try {
            const result = await query(`SELECT sp_id::text as id, sp_id::text as code, sp_name as name FROM sys_prov WHERE sp_isactive = 'Y' ORDER BY sp_name`);
            return res.json(result.rows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getDistricts(req: Request, res: Response) {
        try {
            const { provinceId } = (req as any).params;
            const result = await query(
                `SELECT sd_id::text as id, sd_id::text as code, sd_name as name FROM sys_dist WHERE sd_active = 'Y' AND sd_provid::text = $1 ORDER BY sd_name`,
                [provinceId]
            );
            return res.json(result.rows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getWards(req: Request, res: Response) {
        try {
            const provinceId = (req as any).params.provinceId || (req as any).query.provinceId;
            const districtId = (req as any).query.districtId;
            let sql = `SELECT sv_id::text as id, sv_id::text as code, sv_name as name FROM sys_vill WHERE sv_isactive = 'Y'`;
            const params: any[] = [];
            
            if (districtId) {
                sql += ` AND sv_distid::text = $1`;
                params.push(districtId);
            } else if (provinceId) {
                sql += ` AND (sv_provid::text = $1 OR sv_distid::text = $1)`;
                params.push(provinceId);
            }
            
            sql += ` ORDER BY sv_name`;
            const result = await query(sql, params);
            return res.json(result.rows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getDepartments(req: Request, res: Response) {
        try {
            const result = await query(`
                SELECT sd_id::text as id, sd_id::text as code, sd_name as name 
                FROM sys_dept 
                WHERE sd_isactive = 'Y' AND sd_type = 'KB'
                ORDER BY sd_name
            `);
            return res.json(result.rows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getRooms(req: Request, res: Response) {
        try {
            const { deptId } = (req as any).query;
            let sql = `
                SELECT 
                    hrl_id::text as id, 
                    hrl_id::text as code,
                    COALESCE(NULLIF(TRIM(hrl_roomname), ''), hrl_name, hrl_id::text) as name, 
                    hrl_deptid::text as "deptId"
                FROM hms_roomlist 
                JOIN sys_dept ON sd_id = hrl_deptid
                WHERE hrl_active = 'Y' 
                AND sd_type = 'KB'
                AND hrl_name NOT ILIKE 'Buồng%'
            `;
            const params: any[] = [];
            if (deptId) {
                sql += " AND hrl_deptid = $1 ";
                params.push(deptId);
            }
            sql += " ORDER BY name ";

            const result = await query(sql, params);
            return res.json(result.rows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getOccupations(req: Request, res: Response) {
        try {
            // Lấy TẤT CẢ nghề nghiệp để BN cũ không bị trắng (Bỏ ss_active filter)
            const result = await query(
                `SELECT trim(ss_code) as id, trim(ss_code) as code, ss_desc as name FROM sys_sel WHERE trim(ss_id)='sys_occupation' ORDER BY ss_index, id`
            );
            return res.json(result.rows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getEthnicities(req: Request, res: Response) {
        try {
            // Lấy TẤT CẢ dân tộc để BN cũ không bị trắng (Bỏ ss_active filter)
            const result = await query(
                `SELECT trim(ss_code) as id, trim(ss_code) as code, ss_desc as name FROM sys_sel WHERE trim(ss_id)='sys_ethnic' ORDER BY ss_index, id`
            );
            return res.json(result.rows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getNations(req: Request, res: Response) {
        try {
            const result = await query(`SELECT hq_idx as id, hq_idx as code, hq_name as name from hms_quoctich ORDER BY hq_idx, id`);
            return res.json(result.rows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getRelationships(req: Request, res: Response) {
        try {
            const result = await query(
                `SELECT ss_code as id, ss_code as code, ss_desc as name FROM sys_sel WHERE ss_id='hrm_relation' ORDER BY ss_index, ss_code`
            );
            return res.json(result.rows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getWorkplaces(req: Request, res: Response) {
        try {
            const result = await query(`SELECT hwp_idx as id, hwp_idx as code, hwp_name as name FROM hms_workplace ORDER BY id`);
            return res.json(result.rows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getExamTypes(req: Request, res: Response) {
        try {
            const result = await query(`
                SELECT 
                    hfl_feeid as id, 
                    hfl_feeid as code, 
                    hfl_name as name,
                    hfl_servprice as servprice,
                    hfl_insprice as insprice
                FROM hms_feelist 
                WHERE hfl_groupid = 'D0000' AND hfl_active = 'Y' AND hfl_typeid = 'E' 
                ORDER BY hfl_feeid
            `);
            return res.json(result.rows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Lấy danh mục chung từ bảng sys_sel
    async getCatalogItems(req: Request, res: Response) {
        try {
            const { id } = (req as any).query;
            const routeType = (req as any).query.routeType as string;

            if (!id) return res.status(400).json({ error: 'Thiếu id danh mục' });

            let sql = `
                SELECT 
                    ss_code as code, 
                    CASE 
                        WHEN length(trim(COALESCE(ss_vndesc, ''))) > 1
                        THEN trim(ss_desc) || ' (' || trim(ss_vndesc) || ')' 
                        ELSE trim(ss_desc) 
                    END as name, 
                    ss_code as id,
                    ss_vndesc as vndesc
                FROM sys_sel 
                WHERE trim(ss_id) = $1
            `;

            const params: any[] = [id];

            // Thêm logic lọc theo Tuyến nếu là Danh mục Đối tượng KCB
            if (id === 'sys_ma_doituong_kcb' && routeType) {
                if (routeType === 'Đúng tuyến') {
                    sql += " AND substr(ss_code, 1, 1) = '1' ";
                } else if (routeType === 'Trái tuyến') {
                    sql += " AND substr(ss_code, 1, 1) = '3' ";
                } else if (routeType === 'Cấp cứu') {
                    sql += " AND substr(ss_code, 1, 1) = '2' ";
                } else if (routeType === 'Lĩnh thuốc') {
                    sql += " AND substr(ss_code, 1, 1) = '7' ";
                }
            }

            sql += " ORDER BY ss_default, ss_code ";

            const result = await query(sql, params);
            // Trim codes in the result
            const trimmedRows = result.rows.map((row: any) => ({
                ...row,
                id: String(row.id || '').trim(),
                code: String(row.code || '').trim()
            }));
            return res.json(trimmedRows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getHospitals(req: Request, res: Response) {
        try {
            const q = (req as any).query.q as string;
            const result = await query(`
                SELECT hh_code as code, hh_name as name, hh_code as id
                FROM hms_hospital
                WHERE hh_active = 'Y'
                  ${q ? "AND (hh_name ILIKE $1 OR hh_code ILIKE $1)" : ''}
                ORDER BY hh_name
                LIMIT 100
                `, q ? [`%${q}%`] : []);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('[getHospitals] Error:', error.message);
            try {
                const fallback = await query(`
                    SELECT hh_id::text as code, hh_name as name, hh_id::text as id
                    FROM hms_hospital
                    WHERE hh_active = 'Y'
                    ORDER BY hh_name
                    LIMIT 100
                `);
                return res.json(fallback.rows);
            } catch (fallbackError: any) {
                return res.status(500).json({ error: fallbackError.message });
            }
        }
    }

    async getObjects(req: Request, res: Response) {
        try {
            const result = await query(
                `SELECT ho_id::text as code, ho_desc as name, ho_id as id, ho_type as type FROM hms_object WHERE ho_active = 'Y' ORDER BY ho_id`
            );
            return res.json(result.rows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getReceptionists(req: Request, res: Response) {
        try {
            const { deptId } = (req as any).query;
            let sql = `SELECT su_userid as id, su_name as name FROM sys_user WHERE su_isactive = 'Y'`;
            const params: any[] = [];
            
            if (deptId) {
                sql += " AND su_deptid = $1 ";
                params.push(deptId);
            }
            
            sql += " ORDER BY su_name";

            const result = await query(sql, params);
            return res.json(result.rows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getDoctors(req: Request, res: Response) {
        try {
            const result = await query(`SELECT su_userid as id, su_name as name FROM sys_user WHERE su_isactive = 'Y' AND su_groupid IN ('D', 'P') ORDER BY su_name`);
            return res.json(result.rows);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}

export default new ReceptionCatalogController();
