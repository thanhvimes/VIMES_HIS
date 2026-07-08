import { Request, Response } from 'express';
import { pool } from '../../config/database';
import { broadcast, addClient, removeClient } from '../../services/qms/sse.service';
import { QueueManagerService } from '../../services/qms/queueManager.service';

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

export class QmsQueueController {
  // 19. QUEUE COMMAND WORKFLOWS
  static async callNext(req: Request, res: Response) {
    try {
      const { isPriority, type, deptId } = req.body;
      const counterId = req.body.counterId || req.body.roomId || req.body.hep_roomid;
      if (!counterId) return res.status(400).json({ error: 'Thiếu counterId/roomId/hep_roomid' });
      const calledTicket = await QueueManagerService.callNext(counterId, isPriority, type, deptId);
      if (!calledTicket) {
        return res.json({ success: true, message: `Hết bệnh nhân đang chờ`, data: null });
      }
      res.json({ success: true, data: calledTicket });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async callAgain(req: Request, res: Response) {
    try {
      const { ticketId } = req.body;
      const docNo = req.body.docNo || req.body.hep_docno;
      const receptNo = req.body.receptNo || req.body.hep_receptno;
      const deptId = req.body.deptId || req.body.hep_deptid;
      const ticket = await QueueManagerService.callAgain(ticketId, docNo, receptNo, deptId);
      if (!ticket) return res.status(404).json({ error: 'Không tìm thấy lượt gọi' });
      res.json({ success: true, data: ticket });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async complete(req: Request, res: Response) {
    try {
      const { ticketId } = req.body;
      const counterId = req.body.counterId || req.body.roomId || req.body.hep_roomid;
      const docNo = req.body.docNo || req.body.hep_docno;
      const receptNo = req.body.receptNo || req.body.hep_receptno;
      const deptId = req.body.deptId || req.body.hep_deptid;
      await QueueManagerService.complete(counterId, ticketId, docNo, receptNo, deptId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async skip(req: Request, res: Response) {
    try {
      const { ticketId } = req.body;
      const docNo = req.body.docNo || req.body.hep_docno;
      const receptNo = req.body.receptNo || req.body.hep_receptno;
      const deptId = req.body.deptId || req.body.hep_deptid;
      await QueueManagerService.skip(ticketId, docNo, receptNo, deptId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async transfer(req: Request, res: Response) {
    try {
      const { ticketId, targetRoomId, targetAreaId, notes } = req.body;
      const docNo = req.body.docNo || req.body.hep_docno;
      const receptNo = req.body.receptNo || req.body.hep_receptno;
      const deptId = req.body.deptId || req.body.hep_deptid;
      await QueueManagerService.transfer(ticketId, targetRoomId, targetAreaId, notes, docNo, receptNo, deptId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async callSpecific(req: Request, res: Response) {
    try {
      const { ticketId } = req.body;
      let docNo = req.body.docNo || req.body.hep_docno;
      let receptNo = req.body.receptNo || req.body.hep_receptno;
      const deptId = req.body.deptId || req.body.hep_deptid;
      const counterId = req.body.counterId || req.body.roomId || req.body.hep_roomid;

      if (!counterId) return res.status(400).json({ error: 'Thiếu counterId/roomId/hep_roomid' });

      if (!docNo && ticketId) {
        const parts = String(ticketId).split('-');
        docNo = parseInt(parts[0]);
        receptNo = parseInt(parts[1]);
      }

      const dNo = docNo ? parseInt(String(docNo)) : NaN;
      const rNo = receptNo ? parseInt(String(receptNo)) : NaN;

      if (isNaN(dNo) || isNaN(rNo)) return res.status(400).json({ error: 'Mã số không hợp lệ (docNo & receptNo)' });

      await pool.query(`
          UPDATE hms_exam_pending 
          SET hep_pending = 'O', hep_callstatus = NULL 
          WHERE hep_roomid = $1 AND hep_pending = 'C' AND hep_date = CURRENT_DATE
      `, [counterId]);

      let info;
      if (deptId) {
        info = await pool.query(`
            SELECT hep_deptid, hep_receptidx, hep_roomid 
            FROM hms_exam_pending 
            WHERE hep_docno = $1 AND hep_receptno = $2 AND hep_deptid = $3 AND hep_date = CURRENT_DATE
        `, [dNo, rNo, deptId]);
      } else {
        info = await pool.query(`
            SELECT hep_deptid, hep_receptidx, hep_roomid 
            FROM hms_exam_pending 
            WHERE hep_docno = $1 AND hep_receptno = $2 AND hep_date = CURRENT_DATE
        `, [dNo, rNo]);
      }

      if (info.rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu' });

      const row = info.rows[0];
      if (row.hep_roomid !== parseInt(counterId)) {
        await pool.query(`
            UPDATE hms_exam_pending
            SET hep_roomid = $1
            WHERE hep_docno = $2 AND hep_receptno = $3 AND hep_date = CURRENT_DATE
        `, [counterId, dNo, rNo]);
      }

      await pool.query("SELECT hms_exam_pending_call($1, $2, $3, $4, $5)", [
        dNo,
        row.hep_deptid,
        counterId,
        row.hep_receptidx,
        'O'
      ]);

      const result = await pool.query(`
          SELECT 
              ep.hep_docno || '-' || ep.hep_receptno AS id,
              ep.hep_receptno AS ticket_number,
              trim(p.hp_surname ||' '|| p.hp_midname ||' '|| p.hp_firstname) AS patient_name,
              false AS is_priority,
              ep.hep_date AS created_at,
              ep.hep_docno AS doc_no,
              ep.hep_deptid AS dept_code,
              ep.hep_roomid AS room_id,
              'CALLING' AS status
          FROM hms_exam_pending ep
          LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
          LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
          WHERE ep.hep_docno = $1 AND ep.hep_deptid = $2 AND ep.hep_roomid = $3 AND ep.hep_date = CURRENT_DATE
      `, [dNo, row.hep_deptid, counterId]);

      if (result.rows.length > 0) {
        const ticket = result.rows[0];
        let areaId = null;
        let counterName = '';
        const deptCode = ticket.dept_code || null;

        let roomRes;
        if (deptCode) {
          roomRes = await pool.query(
            'SELECT hrl_name, hrl_deptid::text as dept_code FROM hms_roomlist WHERE hrl_id::text = $1::text AND hrl_deptid::text = $2::text',
            [counterId, deptCode]
          );
        } else {
          roomRes = await pool.query(
            'SELECT hrl_name, hrl_deptid::text as dept_code FROM hms_roomlist WHERE hrl_id::text = $1::text LIMIT 1',
            [counterId]
          );
        }

        if (roomRes.rows.length > 0) {
          counterName = roomRes.rows[0].hrl_name;
        } else {
          const counterRes = await pool.query('SELECT area_id, counter_name FROM kiosk_counters WHERE counter_id = $1', [counterId]);
          if (counterRes.rows.length > 0) {
            areaId = counterRes.rows[0].area_id;
            counterName = counterRes.rows[0].counter_name;
          } else {
            counterName = 'Phòng khám ' + counterId;
          }
        }

        broadcast({
          type: 'NEW_CALL',
          ticket: ticket,
          areaId: areaId,
          counterId: counterId,
          counterName: counterName
        }, areaId || 'global');

        res.json({ success: true, data: ticket });
      } else {
        res.status(404).json({ success: false, message: 'Không tìm thấy phiếu' });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 20. GET WAITING LIST
  static async getWaitingList(req: Request, res: Response) {
    try {
      const { counterId } = req.params;
      if (!counterId || counterId === 'undefined' || counterId === 'NaN') {
        return res.json([]);
      }
      const { type, deptId } = req.query;
      let deptCode = deptId ? String(deptId) : null;

      if (!deptCode && type === 'EXECUTION') {
        const roomRes = await pool.query('SELECT hrl_deptid::text as dept_code FROM hms_roomlist WHERE hrl_id::text = $1::text', [counterId]);
        if (roomRes.rows.length > 0) {
          deptCode = roomRes.rows[0].dept_code;
        }
      }

      let query = `
          SELECT 
              ep.hep_docno || '-' || ep.hep_receptno AS id,
              ep.hep_receptno AS ticket_number,
              trim(p.hp_surname ||' '|| p.hp_midname ||' '|| p.hp_firstname) AS patient_name,
              false AS is_priority,
              ep.hep_date AS created_at,
              CASE WHEN ep.hep_type = 'E' THEN 'REGISTRATION' ELSE 'EXECUTION' END AS kiosk_type,
              ep.hep_docno AS doc_no,
              ep.hep_deptid AS dept_code,
              ep.hep_roomid AS room_id
          FROM hms_exam_pending ep
          LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
          LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
          WHERE ep.hep_pending = 'O'
            AND ep.hep_date = CURRENT_DATE
      `;
      const params: any[] = [];

      if (type === 'EXECUTION') {
        query += ` AND ep.hep_type IN ('E', 'I')`;
        if (deptCode) {
          query += ` AND ep.hep_deptid = $1 AND ep.hep_roomid::text = $2::text`;
          params.push(deptCode, counterId);
        } else {
          query += ` AND ep.hep_roomid::text = $1::text`;
          params.push(counterId);
        }
      } else {
        const hepType = (type === 'SAMPLING') ? 'I' : 'E';
        query += ` AND ep.hep_type = $1`;
        params.push(hepType);

        if (deptCode) {
          query += ` AND ep.hep_deptid = $2`;
          params.push(deptCode);
        }
      }

      query += ` ORDER BY ep.hep_receptno ASC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // 21. GET WAITING LIST BY AREA
  static async getWaitingListByArea(req: Request, res: Response) {
    const { areaId } = req.params;
    try {
      const data = await safeQuery(`
          SELECT 
              ep.hep_docno || '-' || ep.hep_receptno AS id,
              ep.hep_receptno AS ticket_number,
              trim(p.hp_surname ||' '|| p.hp_midname ||' '|| p.hp_firstname) AS patient_name,
              false AS is_priority,
              ep.hep_date AS created_at
          FROM hms_exam_pending ep
          LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
          LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
          WHERE ep.hep_pending = 'O' AND ep.hep_date = CURRENT_DATE
            AND ep.hep_roomid IN (SELECT counter_id FROM kiosk_counters WHERE area_id = $1)
          ORDER BY ep.hep_receptno ASC`,
        [areaId]
      );
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 22. GET STATS
  static async getStats(req: Request, res: Response) {
    try {
      const { counterId } = req.params;
      const { type } = req.query;
      let deptCode = null;
      let areaId = null;

      if (type === 'EXECUTION') {
        const roomRes = await pool.query('SELECT hrl_deptid::text as dept_code FROM hms_roomlist WHERE hrl_id::text = $1::text', [counterId]);
        if (roomRes.rows.length > 0) {
          deptCode = roomRes.rows[0].dept_code;
        }
      } else {
        const counterRes = await pool.query('SELECT area_id FROM kiosk_counters WHERE counter_id = $1', [counterId]);
        if (counterRes.rows.length > 0) {
          areaId = counterRes.rows[0].area_id;
        }
      }

      const params: any[] = [counterId];
      let filterCondition = '(hep_roomid = $1 OR hep_roomid = 0)';

      if (type === 'EXECUTION' && deptCode) {
        params.push(deptCode);
        filterCondition = `hep_deptid = $2 AND (hep_roomid = $1 OR hep_roomid = 0)`;
      } else if (areaId) {
        params.push(areaId);
        filterCondition = `hep_roomid IN (SELECT counter_id FROM kiosk_counters WHERE area_id = $2) AND (hep_roomid = $1 OR hep_roomid = 0)`;
      }

      let query = `
          SELECT 
              COUNT(*) FILTER (WHERE hep_pending = 'O' AND ${filterCondition}) as normal_waiting,
              0 as priority_waiting,
              COUNT(*) FILTER (WHERE hep_pending IN ('A', 'C') AND hep_roomid = $1) as total_served_today
          FROM hms_exam_pending
          WHERE hep_date = CURRENT_DATE
      `;

      if (type) {
        if (type === 'EXECUTION') {
          query += ` AND hep_type IN ('E', 'I')`;
        } else {
          const nextParamIdx = params.length + 1;
          const hepType = (type === 'SAMPLING') ? 'I' : 'E';
          query += ` AND hep_type = $${nextParamIdx}`;
          params.push(hepType);
        }
      }

      const stats = await pool.query(query, params);
      res.json({ success: true, data: stats.rows[0] });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 23. GET HISTORY
  static async getHistory(req: Request, res: Response) {
    try {
      const { counterId } = req.params;
      if (!counterId || counterId === 'undefined' || counterId === 'NaN') {
        return res.json([]);
      }
      const { type, deptId } = req.query;
      let deptCode = deptId ? String(deptId) : null;

      if (!deptCode && type === 'EXECUTION') {
        const roomRes = await pool.query('SELECT hrl_deptid::text as dept_code FROM hms_roomlist WHERE hrl_id::text = $1::text', [counterId]);
        if (roomRes.rows.length > 0) {
          deptCode = roomRes.rows[0].dept_code;
        }
      }

      let query = `
          SELECT 
              ep.hep_docno || '-' || ep.hep_receptno AS id,
              ep.hep_receptno AS ticket_number,
              trim(p.hp_surname ||' '|| p.hp_midname ||' '|| p.hp_firstname) AS patient_name,
              false AS is_priority,
              ep.hep_date AS created_at,
              ep.hep_date AS served_at,
              'SERVED' AS status,
              CASE WHEN ep.hep_type = 'E' THEN 'REGISTRATION' ELSE 'EXECUTION' END AS kiosk_type
          FROM hms_exam_pending ep
          LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
          LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
          WHERE ep.hep_pending IN ('A', 'C') 
            AND ep.hep_date = CURRENT_DATE
      `;
      const params: any[] = [];

      if (type === 'EXECUTION') {
        query += ` AND ep.hep_type IN ('E', 'I')`;
        if (deptCode) {
          query += ` AND ep.hep_deptid = $1 AND ep.hep_roomid::text = $2::text`;
          params.push(deptCode, counterId);
        } else {
          query += ` AND ep.hep_roomid::text = $1::text`;
          params.push(counterId);
        }
      } else {
        const hepType = (type === 'SAMPLING') ? 'I' : 'E';
        query += ` AND ep.hep_type = $1`;
        params.push(hepType);

        if (deptCode) {
          query += ` AND ep.hep_deptid = $2 AND ep.hep_roomid::text = $3::text`;
          params.push(deptCode, counterId);
        } else {
          query += ` AND ep.hep_roomid::text = $2::text`;
          params.push(counterId);
        }
      }

      query += ` ORDER BY ep.hep_receptno DESC LIMIT 50`;
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 23b. GET PATIENTS BY STATUS FOR COUNTER
  static async getPatientsByStatus(req: Request, res: Response) {
    try {
      const { counterId } = req.params;
      if (!counterId || counterId === 'undefined' || counterId === 'NaN') {
        return res.json({ success: true, data: { waiting: [], concluding: [], examined: [] } });
      }
      const { type, deptId } = req.query;
      let deptCode = deptId ? String(deptId) : null;

      if (!deptCode && type === 'EXECUTION') {
        const roomRes = await pool.query('SELECT hrl_deptid::text as dept_code FROM hms_roomlist WHERE hrl_id::text = $1::text', [counterId]);
        if (roomRes.rows.length > 0) {
          deptCode = roomRes.rows[0].dept_code;
        }
      }

      // Query all patients for this counter today
      let query = `
          SELECT 
              ep.hep_docno || '-' || ep.hep_receptno AS id,
              ep.hep_receptno AS ticket_number,
              trim(p.hp_surname ||' '|| p.hp_midname ||' '|| p.hp_firstname) AS patient_name,
              false AS is_priority,
              ep.hep_date AS created_at,
              ep.hep_date AS served_at,
              ep.hep_pending,
              d.hd_status,
              CASE WHEN ep.hep_type = 'E' THEN 'REGISTRATION' ELSE 'EXECUTION' END AS kiosk_type,
              ep.hep_docno AS doc_no,
              ep.hep_deptid AS dept_code,
              ep.hep_roomid AS room_id
          FROM hms_exam_pending ep
          LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
          LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
          WHERE ep.hep_date = CURRENT_DATE
      `;
      const params: any[] = [];

      if (type === 'EXECUTION') {
        query += ` AND ep.hep_type IN ('E', 'I')`;
        if (deptCode) {
          query += ` AND ep.hep_deptid = $1 AND ep.hep_roomid::text = $2::text`;
          params.push(deptCode, counterId);
        } else {
          query += ` AND ep.hep_roomid::text = $1::text`;
          params.push(counterId);
        }
      } else {
        const hepType = (type === 'SAMPLING') ? 'I' : 'E';
        query += ` AND ep.hep_type = $1`;
        params.push(hepType);

        if (deptCode) {
          query += ` AND ep.hep_deptid = $2 AND ep.hep_roomid::text = $3::text`;
          params.push(deptCode, counterId);
        } else {
          query += ` AND ep.hep_roomid::text = $2::text`;
          params.push(counterId);
        }
      }

      const result = await pool.query(query, params);
      const rows = result.rows;

      const waiting: any[] = [];
      const concluding: any[] = [];
      const examined: any[] = [];

      for (const row of rows) {
        if (row.hep_pending === 'O') {
          waiting.push(row);
        } else if (row.hep_pending === 'A') {
          if (type === 'EXECUTION') {
            if (row.hd_status === 'O') {
              concluding.push(row);
            } else {
              examined.push(row);
            }
          } else {
            examined.push(row);
          }
        }
      }

      // Sort
      waiting.sort((a, b) => a.ticket_number - b.ticket_number);
      concluding.sort((a, b) => b.ticket_number - a.ticket_number);
      examined.sort((a, b) => b.ticket_number - a.ticket_number);

      res.json({
        success: true,
        data: {
          waiting,
          concluding,
          examined
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  // 24. GET DISPLAY FOR LCD
  static async getDisplay(req: Request, res: Response) {
    try {
      const { areaId } = req.params;
      const counters = await pool.query(`
          SELECT 
              kc.counter_id, kc.counter_name, kc.is_priority,
              (SELECT json_build_object(
                  'id', ep.hep_docno || '-' || ep.hep_receptno,
                  'ticketNumber', ep.hep_receptno,
                  'patientName', trim(p.hp_surname ||' '|| p.hp_midname ||' '|| p.hp_firstname),
                  'calledAt', ep.hep_date,
                  'isPriority', false
               ) FROM hms_exam_pending ep 
               LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
               LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
               WHERE ep.hep_roomid = kc.counter_id AND ep.hep_pending = 'C' AND ep.hep_date = CURRENT_DATE
               ORDER BY ep.hep_receptno DESC LIMIT 1) as current_ticket
          FROM kiosk_counters kc
          WHERE kc.area_id = $1 AND kc.is_active = TRUE
          ORDER BY kc.counter_id
      `, [areaId]);

      const waitingList = await pool.query(`
          SELECT 
              ep.hep_receptno AS ticket_number, 
              false AS is_priority, 
              trim(p.hp_surname ||' '|| p.hp_midname ||' '|| p.hp_firstname) AS patient_name
          FROM hms_exam_pending ep
          LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
          LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
          WHERE ep.hep_pending = 'O' AND ep.hep_date = CURRENT_DATE
          AND (ep.hep_roomid IN (SELECT counter_id FROM kiosk_counters WHERE area_id = $1))
          ORDER BY ep.hep_receptno ASC
          LIMIT 10
      `, [areaId]);

      const history = await pool.query(`
          SELECT 
              ep.hep_receptno AS ticket_number, 
              trim(p.hp_surname ||' '|| p.hp_midname ||' '|| p.hp_firstname) AS patient_name,
              ep.hep_date AS served_at
          FROM hms_exam_pending ep
          LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
          LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
          WHERE ep.hep_pending = 'A' AND ep.hep_date = CURRENT_DATE
          AND (ep.hep_roomid IN (SELECT counter_id FROM kiosk_counters WHERE area_id = $1))
          ORDER BY ep.hep_receptno DESC
          LIMIT 5
      `, [areaId]);

      res.json({
        success: true,
        data: {
          counters: counters.rows,
          waiting: waitingList.rows,
          history: history.rows,
          serverTime: new Date()
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 25. GET CENTRAL DISPLAY INFO
  static async getCentral(req: Request, res: Response) {
    try {
      const { areaId, serviceType, deptId } = req.query;
      if (serviceType === 'EXECUTION' || serviceType === 'REGISTRATION') {
        let query = `
            SELECT 
                r.hrl_id AS counter_id,
                r.hrl_name AS counter_name,
                false AS is_priority,
                null::integer AS area_id,
                null::text AS area_name,
                (SELECT ep.hep_receptno::text FROM hms_exam_pending ep WHERE ep.hep_roomid = r.hrl_id AND ep.hep_deptid = r.hrl_deptid AND ep.hep_pending = 'C' AND ep.hep_date = CURRENT_DATE ORDER BY ep.hep_receptno DESC LIMIT 1) as current_ticket,
                (SELECT trim(p.hp_surname ||' '|| p.hp_midname ||' '|| p.hp_firstname) FROM hms_exam_pending ep 
                 LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
                 LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
                 WHERE ep.hep_roomid = r.hrl_id AND ep.hep_deptid = r.hrl_deptid AND ep.hep_pending = 'C' AND ep.hep_date = CURRENT_DATE ORDER BY ep.hep_receptno DESC LIMIT 1) as current_name
            FROM hms_roomlist r
        `;
        const params: any[] = [];
        if (deptId) {
          query += ` WHERE r.hrl_deptid::text = $1::text`;
          params.push(deptId);
        }
        query += ` ORDER BY r.hrl_name ASC`;
        const result = await pool.query(query, params);
        res.json({ counters: result.rows });
      } else {
        let query = `
            SELECT 
                c.counter_id, 
                c.counter_name, 
                c.is_priority,
                c.area_id,
                a.area_name,
                (SELECT ep.hep_receptno::text FROM hms_exam_pending ep WHERE ep.hep_roomid = c.counter_id AND ep.hep_pending = 'C' AND ep.hep_date = CURRENT_DATE ORDER BY ep.hep_receptno DESC LIMIT 1) as current_ticket,
                (SELECT trim(p.hp_surname ||' '|| p.hp_midname ||' '|| p.hp_firstname) FROM hms_exam_pending ep 
                 LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
                 LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
                 WHERE ep.hep_roomid = c.counter_id AND ep.hep_pending = 'C' AND ep.hep_date = CURRENT_DATE ORDER BY ep.hep_receptno DESC LIMIT 1) as current_name
            FROM kiosk_counters c
            LEFT JOIN kiosk_areas a ON c.area_id = a.area_id
            WHERE c.is_active = TRUE
        `;
        const params: any[] = [];
        if (areaId) {
          query += ` AND c.area_id = $1`;
          params.push(parseInt(String(areaId)));
        }
        query += ` ORDER BY c.counter_id ASC`;
        const result = await pool.query(query, params);
        res.json({ counters: result.rows });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 26. GET COUNTER INFO
  static async getCounterInfo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { deptId } = req.query;

      let currentQuery = `
          SELECT 
              ep.hep_docno || '-' || ep.hep_receptno AS id,
              ep.hep_receptno AS ticket_number,
              trim(p.hp_surname ||' '|| p.hp_midname ||' '|| p.hp_firstname) AS patient_name,
              false AS is_priority,
              p.hp_sex AS gender,
              p.hp_birthdate AS dob,
              COALESCE(d.hd_contactaddr, hms_getaddress(p.hp_provid, p.hp_distid, p.hp_villid), p.hp_dtladdr) AS address,
              ep.hep_docno AS doc_no,
              d.hd_cardno AS insurance_number,
              d.hd_telephone AS phone,
              e.he_diagnostic AS reason,
              CASE 
                  WHEN d.hd_object IN ('2', '4', '6') THEN 'BHYT'
                  ELSE 'Dịch vụ'
              END AS object_type,
              COALESCE(e.he_pulse, 0) AS pulse,
              COALESCE(e.he_temperature, 0) AS temperature,
              COALESCE(e.he_bloodpressure, 0) AS bp_sys,
              COALESCE(e.he_bloodpressurex, 0) AS bp_dia,
              COALESCE(e.he_weight, 0) AS weight,
              COALESCE(e.he_height, 0) AS height,
              COALESCE(e.he_bmi, 0) AS bmi
          FROM hms_exam_pending ep
          LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
          LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
          LEFT JOIN hms_exam e ON e.he_docno = ep.hep_docno AND e.he_receptidx = COALESCE(ep.hep_receptidx, 1)
          WHERE ep.hep_roomid = $1::integer AND ep.hep_pending = 'C' AND ep.hep_date = CURRENT_DATE
      `;
      const currentParams: any[] = [id];
      if (deptId) {
        currentQuery += ` AND ep.hep_deptid = $2`;
        currentParams.push(deptId);
      }
      currentQuery += ` ORDER BY ep.hep_receptno DESC LIMIT 1`;
      console.log('[DEBUG getCounterInfo] currentQuery:', currentQuery);
      console.log('[DEBUG getCounterInfo] currentParams:', currentParams);
      const currentRes = await pool.query(currentQuery, currentParams);
      console.log('[DEBUG getCounterInfo] currentRes rows:', currentRes.rows);

      let counterObj: any = null;
      let areaId: any = null;

      if (deptId) {
        const roomRes = await pool.query('SELECT hrl_id as counter_id, hrl_name as counter_name, hrl_deptid::text as dept_code FROM hms_roomlist WHERE hrl_id::text = $1::text AND hrl_deptid::text = $2::text', [id, deptId]);
        if (roomRes.rows.length > 0) {
          counterObj = {
            counter_id: roomRes.rows[0].counter_id,
            counter_name: roomRes.rows[0].counter_name,
            area_id: null,
            is_room: true,
            dept_code: roomRes.rows[0].dept_code
          };
        }
      }

      if (!counterObj) {
        const counterRes = await pool.query('SELECT counter_id, counter_name, area_id FROM kiosk_counters WHERE counter_id = $1::integer', [id]);
        if (counterRes.rows.length > 0) {
          counterObj = counterRes.rows[0];
          areaId = counterObj.area_id;
        } else {
          const roomRes = await pool.query('SELECT hrl_id as counter_id, hrl_name as counter_name, hrl_deptid::text as dept_code FROM hms_roomlist WHERE hrl_id::text = $1::text', [id]);
          if (roomRes.rows.length > 0) {
            counterObj = {
              counter_id: roomRes.rows[0].counter_id,
              counter_name: roomRes.rows[0].counter_name,
              area_id: null,
              is_room: true,
              dept_code: roomRes.rows[0].dept_code
            };
          } else {
            counterObj = {
              counter_id: id,
              counter_name: 'Phòng khám ' + id,
              area_id: null
            };
          }
        }
      }

      const requestedAreaId = req.query.areaId;
      if (requestedAreaId) {
        areaId = requestedAreaId;
      }

      let waitingRes;
      if (counterObj.is_room && counterObj.dept_code) {
        waitingRes = await pool.query(`
            SELECT 
                ep.hep_docno || '-' || ep.hep_receptno AS id,
                ep.hep_receptno AS ticket_number,
                trim(p.hp_surname ||' '|| p.hp_midname ||' '|| p.hp_firstname) AS patient_name,
                false AS is_priority,
                p.hp_birthdate AS dob,
                ep.hep_date AS created_at,
                ep.hep_roomid AS room_id,
                null AS area_id
            FROM hms_exam_pending ep
            LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
            LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
            WHERE ep.hep_pending = 'O' 
              AND ep.hep_date = CURRENT_DATE
              AND ep.hep_type IN ('E', 'I')
              AND ep.hep_roomid = $1::integer
              AND ep.hep_deptid = $2
            ORDER BY ep.hep_receptno ASC
        `, [id, counterObj.dept_code]);
      } else {
        waitingRes = await pool.query(`
            SELECT 
                ep.hep_docno || '-' || ep.hep_receptno AS id,
                ep.hep_receptno AS ticket_number,
                trim(p.hp_surname ||' '|| p.hp_midname ||' '|| p.hp_firstname) AS patient_name,
                false AS is_priority,
                p.hp_birthdate AS dob,
                ep.hep_date AS created_at,
                ep.hep_roomid AS room_id,
                null AS area_id
            FROM hms_exam_pending ep
            LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
            LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
            WHERE ep.hep_pending = 'O' 
              AND ep.hep_date = CURRENT_DATE
              AND (
                  (ep.hep_roomid IN (SELECT counter_id FROM kiosk_counters WHERE area_id = $2::integer) AND $2::integer > 0) OR
                  (ep.hep_roomid = $1::integer AND ($2 IS NULL OR $2::integer = 0)) OR
                  (ep.hep_roomid IS NULL OR ep.hep_roomid = 0)
              )
            ORDER BY ep.hep_receptno ASC
        `, [id, areaId ? parseInt(String(areaId)) : null]);
      }

      let servedQuery = `
          SELECT COUNT(*) as served_count
          FROM hms_exam_pending
          WHERE hep_roomid = $1::integer AND hep_pending = 'A' AND hep_date = CURRENT_DATE
      `;
      const servedParams: any[] = [id];
      const effectiveDeptId = deptId || (counterObj.is_room ? counterObj.dept_code : null);
      if (effectiveDeptId) {
        servedQuery += ` AND hep_deptid = $2`;
        servedParams.push(effectiveDeptId);
      }
      const servedCountRes = await pool.query(servedQuery, servedParams);

      res.json({
        counter: counterObj,
        currentTicketId: currentRes.rows[0]?.id || null,
        currentTicket: currentRes.rows[0]?.ticket_number || null,
        currentName: currentRes.rows[0]?.patient_name || null,
        isPriority: currentRes.rows[0]?.is_priority || false,
        activeTicket: currentRes.rows[0] ? {
          id: currentRes.rows[0].id,
          ticket_number: currentRes.rows[0].ticket_number,
          patient_name: currentRes.rows[0].patient_name,
          is_priority: currentRes.rows[0].is_priority || false,
          gender: currentRes.rows[0].gender,
          dob: currentRes.rows[0].dob,
          address: currentRes.rows[0].address,
          doc_no: currentRes.rows[0].doc_no,
          insurance_number: currentRes.rows[0].insurance_number,
          phone: currentRes.rows[0].phone,
          reason: currentRes.rows[0].reason,
          object_type: currentRes.rows[0].object_type,
          pulse: currentRes.rows[0].pulse,
          temperature: currentRes.rows[0].temperature,
          bp_sys: currentRes.rows[0].bp_sys,
          bp_dia: currentRes.rows[0].bp_dia,
          weight: currentRes.rows[0].weight,
          height: currentRes.rows[0].height,
          bmi: currentRes.rows[0].bmi
        } : null,
        waitingList: waitingRes.rows,
        servedCount: parseInt(servedCountRes.rows[0]?.served_count) || 0,
        avgWaitTime: 5
      });
    } catch (e: any) {
      res.status(550).json({ error: e.message });
    }
  }

  // 32. SSE EVENT STREAM
  static sseEvents(req: Request, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const channelId = (req.query.channel as string) || 'global';
    const clientData = addClient(res, channelId);

    req.on('close', () => {
      removeClient(clientData.clientId, clientData.channelId);
    });
  }

  // 37. GET DETAILED STATS (for Admin Dashboard)
  static async getDetailedStats(req: Request, res: Response) {
    try {
      const stats = await pool.query(`
        SELECT 
            ka.area_id, 
            ka.area_name,
            COUNT(qt.id) FILTER (WHERE qt.status = 'WAITING') as waiting_count,
            COUNT(qt.id) FILTER (WHERE qt.status = 'CALLING') as calling_count,
            COUNT(qt.id) FILTER (WHERE qt.status = 'SERVED') as served_count,
            AVG(EXTRACT(EPOCH FROM (qt.called_at - qt.created_at))/60) FILTER (WHERE qt.status IN ('CALLING', 'SERVED')) as avg_wait_time
        FROM kiosk_areas ka
        LEFT JOIN kiosk_quick_tickets qt ON ka.area_id = qt.area_id AND qt.created_at::date = CURRENT_DATE
        GROUP BY ka.area_id, ka.area_name
        ORDER BY ka.area_id
      `);

      const globalStats = await pool.query(`
        SELECT 
            COUNT(id) as total_today,
            COUNT(id) FILTER (WHERE status = 'WAITING') as total_waiting,
            COUNT(id) FILTER (WHERE status = 'CALLING') as total_calling,
            COUNT(id) FILTER (WHERE status = 'SERVED') as total_served,
            AVG(EXTRACT(EPOCH FROM (called_at - created_at))/60) as global_avg_wait
        FROM kiosk_quick_tickets 
        WHERE created_at::date = CURRENT_DATE
      `);

      res.json({
        areas: stats.rows,
        summary: globalStats.rows[0]
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 38. GET HOURLY STATS (for Chart)
  static async getHourlyStats(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT 
            EXTRACT(HOUR FROM created_at) as hour,
            COUNT(*) as count
        FROM kiosk_quick_tickets
        WHERE created_at::date = CURRENT_DATE
        GROUP BY hour
        ORDER BY hour
      `);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
