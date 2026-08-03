import { Request, Response } from 'express';
import { pool } from '../../config/database';

const safeQuery = async (queryText: string, params: any[] = [], mockReturn: any[] = []): Promise<any[]> => {
  try {
    const result = await pool.query(queryText, params);
    return result.rows;
  } catch (err: any) {
    console.warn(`[DB Error] ${err.message}. Query: "${queryText}". Params: ${JSON.stringify(params)}`);
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    return mockReturn;
  }
};

export class QmsCatalogController {
  // 2. GET AREAS
  static async getAreas(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT DISTINCT hrl_area as code, hrl_area as name 
        FROM hms_roomlist 
        WHERE hrl_area IS NOT NULL AND hrl_area <> ''
        ORDER BY hrl_area ASC
      `);
      if (result.rows.length === 0) {
        return res.json([
          { code: 'KHU_A', name: 'Khu vực A (Sảnh chính)' },
          { code: 'KHU_B', name: 'Khu vực B' }
        ]);
      }
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 3. GET ROOMS BY AREA
  static async getRoomsByArea(req: Request, res: Response) {
    try {
      const { areaCode } = req.params;
      const result = await pool.query(`
        SELECT counter_id as id, counter_id::text as code, counter_name as name 
        FROM kiosk_counters kc
        JOIN kiosk_areas ka ON ka.area_id = kc.area_id
        WHERE ka.area_name = $1 OR ka.area_id::text = $1
        ORDER BY counter_name ASC
      `, [areaCode]);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 4. GET PUBLIC COUNTERS
  static async getPublicCounters(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT kc.counter_id, kc.counter_name, kc.area_id, ka.area_name, kc.is_priority, kc.is_active 
        FROM kiosk_counters kc 
        LEFT JOIN kiosk_areas ka ON ka.area_id = kc.area_id 
        WHERE kc.is_active = TRUE 
        ORDER BY kc.counter_id
      `);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 5. GET PUBLIC AREAS
  static async getPublicAreas(req: Request, res: Response) {
    try {
      const result = await pool.query('SELECT area_id, area_name FROM kiosk_areas ORDER BY area_id');
      res.json(result.rows.map(r => ({ id: r.area_id, name: r.area_name })));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 6. GET DEPARTMENTS
  static async getDepartments(req: Request, res: Response) {
    console.log('[API/Departments] Querying sys_dept...');
    try {
      const data = await safeQuery(
        `SELECT sd_id as id, sd_name as name FROM sys_dept WHERE sd_isactive ='Y' ORDER BY sd_name`,
        [],
        [
          { id: 'PHONG_MO', name: 'Khoa Phẫu thuật - Gây mê hồi sức' },
          { id: 'NOI', name: 'Khoa Nội tổng hợp' },
          { id: 'NGOAI', name: 'Khoa Ngoại tổng hợp' },
          { id: 'SAN', name: 'Khoa Phụ Sản' },
          { id: 'NHI', name: 'Khoa Nhi' }
        ]
      );
      console.log(`[API/Departments] Found ${data?.length || 0} departments.`);
      res.json(data);
    } catch (e: any) {
      console.error('[API/Departments] Error querying departments:', e);
      res.status(500).json({ error: e.message });
    }
  }

  // 7. GET SPECIALTIES
  static async getSpecialties(req: Request, res: Response) {
    const { deptid } = req.params;
    try {
      const data = await safeQuery(
        `SELECT DISTINCT hrk_code as id, ss_desc as name FROM hms_roomlist_kios
        LEFT JOIN sys_sel ON (ss_id ='hms_room_kios' AND CAST(ss_code AS INT) = hrk_code)
        WHERE hrk_deptid = $1 AND hrk_active = 'Y' ORDER BY hrk_code`, [deptid], []
      );
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 8. GET ROOMS BY DEPT
  static async getRoomsByDept(req: Request, res: Response) {
    const { deptId } = req.params;
    try {
      const result = await safeQuery(
        `SELECT hrl_id::text as id, hrl_name as name FROM hms_roomlist WHERE hrl_deptid::text = $1 ORDER BY hrl_name`,
        [deptId],
        []
      );
      if (result && result.length > 0) {
        return res.json(result);
      }
      if (process.env.NODE_ENV === 'production') {
        return res.json([]);
      }
      const deptResult = await safeQuery(
        `SELECT sd_name FROM sys_dept WHERE sd_id::text = $1`,
        [deptId],
        []
      );
      const deptName = deptResult && deptResult[0] ? deptResult[0].sd_name : 'Khám bệnh';
      const mockRooms = [
        { id: `${deptId}01`, name: `Phòng ${deptName} 01` },
        { id: `${deptId}02`, name: `Phòng ${deptName} 02` },
        { id: `${deptId}03`, name: `Phòng ${deptName} 03` }
      ];
      res.json(mockRooms);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 11. GET PROVINCES
  static async getProvinces(req: Request, res: Response) {
    try {
      const data = await safeQuery("SELECT sp_id as code, sp_name as name FROM sys_prov WHERE COALESCE(sp_isactive, sp_active) = 'Y' ORDER BY sp_name", [], [
        { code: '01', name: 'TP. Hà Nội' },
        { code: '79', name: 'TP. Hồ Chí Minh' }
      ]);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 12. GET WARDS
  static async getWards(req: Request, res: Response) {
    const { code } = req.params;
    try {
      const data = await safeQuery("SELECT sv_id as code, sv_name as name FROM sys_vill WHERE COALESCE(sv_isactive, 'Y') = 'Y' AND (sv_provid = $1 OR sv_distid = $1) ORDER BY sv_name", [code], [
        { code: '001', name: 'Phường Bến Nghé' }
      ]);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 13. GET SERVICES Catalog
  static async getServices(req: Request, res: Response) {
    const { type } = req.query;
    try {
      let whereClause = '';
      if (type === 'technical') {
        whereClause = "WHERE type = 'Dịch vụ Kỹ thuật'";
      } else if (type === 'medicine') {
        whereClause = "WHERE type = 'Thuốc & Dược phẩm'";
      }
      const data = await safeQuery(`
        SELECT *
        FROM (
            (SELECT 
                'Dịch vụ Kỹ thuật' AS type,
                hfl_feeid AS id,
                hfl_name AS name,
                hfl_unit AS unit,
                CAST(hfl_servprice AS INT) AS price
            FROM hms_fee_list
            WHERE hfl_active = 'Y'
            AND COALESCE(hfl_subgroup, 'N') <> 'Y'
            AND (LENGTH(hfl_subitem) <= 1 OR hfl_subitem IS NULL)
            AND (COALESCE(hfl_servprice, 0) + COALESCE(hfl_insprice, 0) + COALESCE(hfl_polprice, 0)) > 0
            )
            UNION ALL
            (SELECT 
                'Thuốc & Dược phẩm' AS type,
                product_item_id::text AS id,
                product_name AS name,
                product_purchase_uomname AS unit,
                product_unitprice::int AS price
            FROM m_productitem_view 
            WHERE product_isactive = 'Y'
            LIMIT 100)
        ) AS tbl
        ${whereClause}
        ORDER BY type, name`, []);

      res.json(data);
    } catch (err: any) {
      res.status(500).json({ success: false, message: "Lỗi hệ thống lấy danh sách dịch vụ: " + err.message });
    }
  }

  // 39. GET ZONING COUNTERS
  static async getZoningCounters(req: Request, res: Response) {
    try {
      const rows = await safeQuery('SELECT kc.*, ka.area_name FROM kiosk_counters kc LEFT JOIN kiosk_areas ka ON ka.area_id = kc.area_id ORDER BY kc.counter_id', [], []);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 40. CREATE ZONING COUNTER
  static async createZoningCounter(req: Request, res: Response) {
    try {
      const { name, areaId, description, isPriority, isActive } = req.body;
      const result = await pool.query(
        'INSERT INTO kiosk_counters (counter_name, area_id, description, is_priority, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, areaId, description || '', isPriority === true, isActive !== false]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 41. UPDATE ZONING COUNTER
  static async updateZoningCounter(req: Request, res: Response) {
    try {
      const { id, name, areaId, description, isPriority, isActive } = req.body;
      await pool.query(
        'UPDATE kiosk_counters SET counter_name=$1, area_id=$2, description=$3, is_priority=$4, is_active=$5 WHERE counter_id=$6',
        [name, areaId, description || '', isPriority === true, isActive !== false, id]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 42. DELETE ZONING COUNTER
  static async deleteZoningCounter(req: Request, res: Response) {
    try {
      await pool.query('DELETE FROM kiosk_counters WHERE counter_id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 43. GET ZONING AREAS
  static async getZoningAreas(req: Request, res: Response) {
    try {
      const rows = await safeQuery('SELECT * FROM kiosk_areas ORDER BY area_id', [], []);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 44. CREATE ZONING AREA
  static async createZoningArea(req: Request, res: Response) {
    try {
      const { name, description, deptId } = req.body;
      const result = await pool.query('INSERT INTO kiosk_areas (area_name, description, dept_id) VALUES ($1, $2, $3) RETURNING *', [name, description || '', deptId || '']);
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 45. UPDATE ZONING AREA
  static async updateZoningArea(req: Request, res: Response) {
    try {
      const { id, name, description, deptId } = req.body;
      await pool.query('UPDATE kiosk_areas SET area_name=$1, description=$2, dept_id=$3 WHERE area_id=$4', [name, description || '', deptId || '', id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 46. DELETE ZONING AREA
  static async deleteZoningArea(req: Request, res: Response) {
    try {
      await pool.query('DELETE FROM kiosk_areas WHERE area_id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 47. GET ALL COUNTERS (Grouped for Transfer)
  static async getAllCounters(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT c.counter_id, c.counter_name, a.area_name 
        FROM kiosk_counters c
        LEFT JOIN kiosk_areas a ON c.area_id = a.area_id
        WHERE c.is_active = TRUE
        ORDER BY a.area_name, c.counter_name
      `);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 48. GET KIOSK ASSIGNMENTS
  static async getKioskAssignments(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT ka.*, area.area_name 
        FROM kiosk_assignments ka 
        LEFT JOIN kiosk_areas area ON area.area_id = ka.area_id
      `);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 49. ASSIGN KIOSK
  static async assignKiosk(req: Request, res: Response) {
    try {
      const { kioskId, areaId } = req.body;
      await pool.query(
        'INSERT INTO kiosk_assignments (kiosk_id, area_id) VALUES ($1, $2) ON CONFLICT (kiosk_id) DO UPDATE SET area_id = $2',
        [kioskId, areaId]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(550).json({ error: e.message });
    }
  }

  // 50. ASSIGN COUNTER
  static async assignCounter(req: Request, res: Response) {
    try {
      const { areaId, counterId, isPriority } = req.body;
      const result = await pool.query(`
        UPDATE kiosk_counters 
        SET area_id = $1, is_priority = COALESCE($3, is_priority) 
        WHERE counter_id = $2 RETURNING *
      `, [areaId, counterId, isPriority]);
      res.json({ success: true, data: result.rows[0] });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
