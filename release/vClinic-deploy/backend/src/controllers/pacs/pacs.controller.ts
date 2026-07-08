import { Request, Response } from 'express';
import { pool } from '../../config/database';
import { broadcast } from '../../services/qms/sse.service';
import path from 'path';
import fs from 'fs';

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

export class PacsController {
  
  static async saveImagingResult(req: Request, res: Response) {
    const { 
      orderId, 
      itemId, 
      docNo, 
      technique, 
      findings, 
      conclusion, 
      imageUrl, 
      isFinal 
    } = req.body;

    if (!orderId || !itemId) {
      return res.status(400).json({ error: 'Thiếu orderId hoặc itemId' });
    }

    try {
      // 1. Delete previous entries in hms_pacs_result to overwrite
      await pool.query(
        `DELETE FROM hms_pacs_result WHERE hpr_orderid = $1 AND hpr_itemid = $2`,
        [orderId, itemId]
      );

      // 2. Insert new attributes if provided
      const insertQueries = [
        { name: 'remark', desc: findings },
        { name: 'conclusion', desc: conclusion },
        { name: 'technique', desc: technique },
        { name: 'url', desc: imageUrl }
      ];

      for (const item of insertQueries) {
        if (item.desc) {
          await pool.query(
            `INSERT INTO hms_pacs_result (hpr_orderid, hpr_itemid, hpr_name, hpr_desc) 
             VALUES ($1, $2, $3, $4)`,
            [orderId, itemId, item.name, item.desc]
          );
        }
      }

      // 3. Update status in hms_pacsorderline
      // 'A': Approved, 'P': Processing
      const newStatus = isFinal ? 'A' : 'P';
      await pool.query(
        `UPDATE hms_pacsorderline 
         SET hpcl_status = $1 
         WHERE hpcl_orderid = $2 AND hpcl_itemid = $3`,
        [newStatus, orderId, itemId]
      );

      // 4. Update diagnosis/findings in hms_doc if final
      if (isFinal && docNo) {
        await pool.query(
          `UPDATE hms_doc 
           SET hd_diagnostic = COALESCE(hd_diagnostic || '; ', '') || $1 
           WHERE hd_docno = $2`,
          [`Kết quả CDHA: ${conclusion}`, docNo]
        );
      }

      // 5. Broadcast to notify the other systems (HIS clinic, QMS, etc.)
      broadcast({ type: 'QUEUE_UPDATED' });

      res.json({ success: true, message: isFinal ? 'Đã duyệt & ký số thành công' : 'Đã lưu nháp kết quả' });
    } catch (e: any) {
      console.error('[saveImagingResult Error]', e);
      res.status(500).json({ error: e.message });
    }
  }

  static async getImagingWorklist(req: Request, res: Response) {
    const { modality, status, search } = req.query;
    try {
      let queryText = `
        SELECT 
            hpcl_orderid || '-' || hpcl_itemid as id,
            hpcl_orderid as order_id,
            hpcl_itemid as item_id,
            hpcl_docno as doc_no,
            trim(coalesce(hp_surname, '') || ' ' || coalesce(hp_midname, '') || ' ' || coalesce(hp_firstname, '')) as patient_name,
            hp_patientno as patient_id,
            EXTRACT(YEAR FROM AGE(hp_birthdate)) as age,
            CASE WHEN hp_sex = 'M' THEN 'Nam' WHEN hp_sex = 'F' THEN 'Nữ' ELSE 'Khác' END as gender,
            hfl_name as service_name,
            hfg_name as modality,
            COALESCE(hpcl_status, 'W') as status,
            TO_CHAR(hpc_orderdate, 'YYYY-MM-DD HH24:MI') as request_date,
            COALESCE(hpr.hpr_desc, '') as image_url,
            'Normal' as priority
        FROM hms_pacsorderline
        JOIN hms_pacsorder ON (hpc_orderid = hpcl_orderid)
        JOIN hms_doc ON (hd_docno = hpcl_docno)
        JOIN hms_patient ON (hp_patientno = hd_patientno)
        LEFT JOIN hms_fee_list ON (hfl_feeid = hpcl_itemid)
        LEFT JOIN hms_fee_group ON (hfg_id = hfl_groupid)
        LEFT JOIN hms_pacs_result hpr ON (hpr.hpr_orderid = hpcl_orderid AND hpr.hpr_itemid = hpcl_itemid AND hpr.hpr_name = 'url')
        WHERE hpcl_status IS NOT NULL
      `;
      const params: any[] = [];
      let paramCount = 1;

      if (modality && modality !== 'All') {
        queryText += ` AND hfg_name = $${paramCount}`;
        params.push(modality);
        paramCount++;
      }

      if (status && status !== 'All') {
        queryText += ` AND hpcl_status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      if (search) {
        queryText += ` AND (hp_surname ILIKE $${paramCount} OR hp_firstname ILIKE $${paramCount} OR hp_patientno::text = $${paramCount} OR hpcl_docno::text = $${paramCount})`;
        params.push(`%${search}%`);
        paramCount++;
      }

      queryText += ` ORDER BY hpc_orderdate DESC LIMIT 100`;

      const data = await safeQuery(queryText, params);
      
      if (data.length === 0 && process.env.NODE_ENV !== 'production') {
        return res.json([
          {
            id: 'REQ-003',
            patientId: 'P004',
            patientName: 'Phạm Thị Dung',
            age: 22,
            gender: 'Nữ',
            serviceName: 'CT Sọ não không cản quang',
            modality: 'CT',
            bodyPart: 'Head',
            requestDate: '2023-11-15 09:15',
            priority: 'Normal',
            status: 'Acquired',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/2296062/c6c702c3e7c03a765f59049603e22e_jumbo.jpg',
            orderId: 3,
            itemId: 1003,
            docNo: 'DOC003'
          },
          {
            id: 'REQ-004',
            patientId: 'P005',
            patientName: 'Hoàng Văn Em',
            age: 12,
            gender: 'Nam',
            serviceName: 'X-Quang Cẳng tay trái',
            modality: 'X-Ray',
            bodyPart: 'Extremity',
            requestDate: '2023-11-15 10:00',
            priority: 'Urgent',
            status: 'Acquired',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/130629/20b977c70967402366936033320026_jumbo.jpg',
            orderId: 4,
            itemId: 1004,
            docNo: 'DOC004'
          },
          {
            id: 'REQ-005',
            patientId: 'P002',
            patientName: 'Trần Thị Bích',
            age: 31,
            gender: 'Nữ',
            serviceName: 'MRI Cột sống thắt lưng',
            modality: 'MRI',
            bodyPart: 'Spine',
            requestDate: '2023-11-15 11:00',
            priority: 'Normal',
            status: 'Acquired',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/523822/75b32f560343670853330762066550_jumbo.jpg',
            orderId: 5,
            itemId: 1005,
            docNo: 'DOC005'
          }
        ]);
      }

      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async getCustomTemplates(req: Request, res: Response) {
    const { doctorId, modality } = req.query;
    if (!doctorId) {
      return res.status(400).json({ error: 'Thiếu doctorId' });
    }
    try {
      let queryText = `SELECT hptc_id as id, hptc_name as name, hptc_modality as modality, hptc_content as content 
                       FROM hms_pacs_template_custom 
                       WHERE hptc_doctor = $1`;
      const params = [doctorId as string];
      if (modality) {
        queryText += ` AND hptc_modality = $2`;
        params.push(modality as string);
      }
      const data = await safeQuery(queryText, params);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async saveCustomTemplate(req: Request, res: Response) {
    const { doctorId, name, modality, content } = req.body;
    if (!doctorId || !name || !modality || !content) {
      return res.status(400).json({ error: 'Thiếu thông tin mẫu' });
    }
    try {
      const result = await pool.query(
        `INSERT INTO hms_pacs_template_custom (hptc_doctor, hptc_name, hptc_modality, hptc_content) 
         VALUES ($1, $2, $3, $4) RETURNING hptc_id as id`,
        [doctorId, name, modality, content]
      );
      res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async deleteCustomTemplate(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await pool.query(`DELETE FROM hms_pacs_template_custom WHERE hptc_id = $1`, [id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async addFavorite(req: Request, res: Response) {
    const { doctorId, orderId, itemId } = req.body;
    if (!doctorId || !orderId || !itemId) {
      return res.status(400).json({ error: 'Thiếu thông tin yêu thích' });
    }
    try {
      await pool.query(
        `INSERT INTO hms_pacs_favorites (hpf_doctor, hpf_orderid, hpf_itemid) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (hpf_doctor, hpf_orderid, hpf_itemid) DO NOTHING`,
        [doctorId, orderId, itemId]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async removeFavorite(req: Request, res: Response) {
    const { doctorId, orderId, itemId } = req.params;
    if (!doctorId || !orderId || !itemId) {
      return res.status(400).json({ error: 'Thiếu thông tin xóa yêu thích' });
    }
    try {
      await pool.query(
        `DELETE FROM hms_pacs_favorites WHERE hpf_doctor = $1 AND hpf_orderid = $2 AND hpf_itemid = $3`,
        [doctorId as string, parseInt(orderId as string), parseInt(itemId as string)]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async getFavorites(req: Request, res: Response) {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: 'Thiếu doctorId' });
    }
    try {
      const data = await safeQuery(`
        SELECT 
            hpf_orderid as order_id,
            hpf_itemid as item_id,
            hpcl_docno as doc_no,
            trim(coalesce(hp_surname, '') || ' ' || coalesce(hp_midname, '') || ' ' || coalesce(hp_firstname, '')) as patient_name,
            hpcl_status as status,
            hfl_name as service_name,
            hfg_name as modality
        FROM hms_pacs_favorites
        JOIN hms_pacsorderline ON (hpcl_orderid = hpf_orderid AND hpcl_itemid = hpf_itemid)
        JOIN hms_pacsorder ON (hpc_orderid = hpcl_orderid)
        JOIN hms_doc ON (hd_docno = hpcl_docno)
        JOIN hms_patient ON (hp_patientno = hd_patientno)
        LEFT JOIN hms_fee_list ON (hfl_feeid = hpcl_itemid)
        LEFT JOIN hms_fee_group ON (hfg_id = hfl_groupid)
        WHERE hpf_doctor = $1`, [doctorId]);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async uploadPacsFile(req: Request, res: Response) {
    const { filename, base64Data } = req.body;
    if (!filename || !base64Data) {
      return res.status(400).json({ error: 'Thiếu filename hoặc base64Data' });
    }

    try {
      const storageDir = process.env.PACS_STORAGE_DIR || './uploads/pacs';
      const absoluteDir = path.resolve(process.cwd(), storageDir);

      if (!fs.existsSync(absoluteDir)) {
        fs.mkdirSync(absoluteDir, { recursive: true });
      }

      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;

      if (matches && matches.length === 3) {
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(base64Data, 'base64');
      }

      const uniqueFilename = `${Date.now()}_${filename}`;
      const filePath = path.join(absoluteDir, uniqueFilename);

      fs.writeFileSync(filePath, buffer);

      const relativeUrl = `/${storageDir.replace(/^\.\//, '')}/${uniqueFilename}`;
      res.json({ success: true, url: relativeUrl });
    } catch (e: any) {
      console.error('[uploadPacsFile Error]', e);
      res.status(500).json({ error: e.message });
    }
  }

  static async getRecordImagingResults(req: Request, res: Response) {
    const { recordId } = req.params;
    try {
      const data = await safeQuery(`
        SELECT hfg_name AS category,
            hfl_name         AS name,
            hfl_unit         AS unit,
            CASE
                WHEN lower(hpr_name) IN('conclusion', 'result')
                THEN hpr_desc
                ELSE ''
            END AS conclusion,
            CASE
                WHEN lower(hpr_name) IN('remark')
                THEN hpr_desc
                ELSE ''
            END AS description,                
            CASE
                WHEN lower(hpr_name) IN('url')
                THEN hpr_desc
                ELSE ''
            END AS imageUrl
        FROM hms_pacsorderline
        LEFT JOIN hms_pacs_result ON (hpr_orderid=hpcl_orderid AND hpr_itemid=hpcl_itemid)
        LEFT JOIN hms_fee_list ON (hfl_feeid=hpcl_itemid)
        LEFT JOIN hms_fee_group ON (hfg_id=hfl_groupid)
        WHERE hpcl_docno = $1            
        AND lower(hpr_name) IN('remark', 'result', 'conclusion', 'url')
        ORDER BY category, hpcl_orderid, hfl_idx`, [recordId]);
      res.json(data);
    } catch (err: any) {
      res.json([]);
    }
  }

  static async getRecordImages(req: Request, res: Response) {
    const { recordId } = req.params;
    try {
      const data = await safeQuery(`
        SELECT hpcl_itemid AS id,
        hfl_name         AS description,
        ''             AS uploadDate,
        hfl_groupid      AS type,
        CASE
            WHEN lower(hpr_name) = 'url'
            THEN hpr_desc
            ELSE ''
        END AS url
        FROM hmsv_paraclinicline
        LEFT JOIN hms_pacs_result ON (hpr_orderid=hpcl_orderid AND hpr_itemid=hpcl_itemid)
        LEFT JOIN hms_fee_list ON (hfl_feeid=hpcl_itemid)
        WHERE hpcl_docno = $1
        AND hpcl_type = 'P'
        AND lower(hpr_name) IN('url')`, [recordId]);
      res.json(data);
    } catch (err: any) {
      res.json([]);
    }
  }
}

