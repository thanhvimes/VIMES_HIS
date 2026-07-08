import { Request, Response } from 'express';
import { query } from '../../config/database';

export class ServicesController {
    // Lấy tất cả nhóm dịch vụ từ hms_fee_group (chỉ lấy các nhóm cận lâm sàng B1->B5)
    async getServiceGroups(req: Request, res: Response) {
        try {
            const result = await query(`
                SELECT TRIM(hfg_id) as id, hfg_name as name 
                FROM hms_fee_group 
                WHERE hfg_active = 'Y' 
                  AND SUBSTR(TRIM(hfg_id), 1, 2) IN ('B1','B2','B3','B4','B5')
                ORDER BY hfg_index, hfg_id
            `);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getServiceGroups:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Lấy dịch vụ trong nhóm từ hms_fee_list (lọc bỏ subitem/subgroup theo C++ Dialog logic)
    async getServicesByGroup(req: Request, res: Response) {
        const { groupId } = req.params;
        try {
            const result = await query(`
                SELECT 
                    TRIM(f.hfl_feeid) as item_id,
                    f.hfl_name as name,
                    f.hfl_unit as unit,
                    COALESCE(f.hfl_servprice, 0) as price
                FROM hms_fee_list f
                WHERE f.hfl_active = 'Y' 
                  AND TRIM(f.hfl_groupid) = $1
                  AND COALESCE(f.hfl_subgroup, 'N') <> 'Y'
                  AND (LENGTH(f.hfl_subitem) <= 1 OR f.hfl_subitem IS NULL)
                ORDER BY f.hfl_name ASC
            `, [groupId]);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getServicesByGroup:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Tìm kiếm nhanh dịch vụ kỹ thuật (chỉ thuộc CLS B1->B5 và không phải subgroup/subitem)
    async searchAvailableServices(req: Request, res: Response) {
        try {
            const { queryStr } = req.query;
            let sql = `
                SELECT 
                    TRIM(f.hfl_feeid) as item_id,
                    f.hfl_name as name,
                    f.hfl_unit as unit,
                    COALESCE(f.hfl_servprice, 0) as price,
                    g.hfg_name as group_name
                FROM hms_fee_list f
                LEFT JOIN hms_fee_group g ON TRIM(g.hfg_id) = TRIM(f.hfl_groupid)
                WHERE f.hfl_active = 'Y'
                  AND COALESCE(f.hfl_subgroup, 'N') <> 'Y'
                  AND (LENGTH(f.hfl_subitem) <= 1 OR f.hfl_subitem IS NULL)
                  AND SUBSTR(TRIM(f.hfl_groupid), 1, 2) IN ('B1','B2','B3','B4','B5')
            `;
            const params: any[] = [];
            if (queryStr) {
                sql += ` AND (f.hfl_name ILIKE $1 OR f.hfl_feeid ILIKE $1)`;
                params.push(`%${queryStr}%`);
            }
            sql += ` ORDER BY g.hfg_name ASC, f.hfl_name ASC LIMIT 100`;
            const result = await query(sql, params);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi searchAvailableServices:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const servicesController = new ServicesController();
