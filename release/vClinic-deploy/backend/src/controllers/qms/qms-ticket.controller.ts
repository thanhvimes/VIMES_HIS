import { Request, Response } from 'express';
import { pool } from '../../config/database';
import { broadcast } from '../../services/qms/sse.service';

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

function removeVietnameseTones(str: string): string {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");
  str = str.replace(/ + /g, " ");
  return str.trim();
}

export class QmsTicketController {
  // 16. CREATE TICKET
  static async createTicket(req: Request, res: Response) {
    try {
      const { docNo, orderId, deptId, roomId, receptIdx, hepType, isPriority } = req.body;
      const insertRes = await pool.query('SELECT hms_exam_pending_insert($1, $2, $3, $4, $5, $6, $7) as ticket', [
        docNo || 0,
        orderId || 0,
        deptId || 'KB',
        roomId || 0,
        receptIdx || 0,
        hepType || 'E',
        hepType || 'E'
      ]);
      const ticketNumber = insertRes.rows[0].ticket;
      if (isPriority) {
        await pool.query("UPDATE hms_exam_pending SET hep_callstatus = 'PRIORITY' WHERE hep_docno = $1 AND hep_receptno = $2 AND hep_date = CURRENT_DATE", [docNo || 0, ticketNumber]);
      }
      broadcast({ type: 'NEW_TICKET' });
      res.status(201).json({
        success: true,
        data: { ticketNumber: ticketNumber.toString(), time: new Date().toLocaleString('vi-VN') }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: "Lỗi cấp số: " + err.message });
    }
  }

  // 17. SUBMIT FEEDBACK
  static async submitFeedback(req: Request, res: Response) {
    try {
      const { rating, comment, categories, patientId, patientName, kioskId } = req.body;
      await pool.query(
        'INSERT INTO kiosk_feedback (patient_id, patient_name, rating, categories, comment, kiosk_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [patientId || null, patientName || null, rating, categories || [], comment || '', kioskId || null]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 18. QUICK NUMBER
  static async quickNumber(req: Request, res: Response) {
    try {
      const { kioskId, kioskDeptCode, kioskType, isPriority, patientName, patientId, identityNumber, areaCode } = req.body;
      const deptId = kioskDeptCode || 'KB';
      const hepType = (kioskType === 'EXECUTION' || kioskType === 'SAMPLING') ? 'I' : 'E';

      let docNo = 0;
      let hp_patientno = patientId || '';
      let patient_name = patientName || 'Khách lẻ';

      if (identityNumber) {
        try {
          const patResult = await safeQuery(`
              SELECT hp_patientno, trim(hp_surname ||' '|| hp_midname ||' '|| hp_firstname) as p_name
              FROM hms_patient
              WHERE hp_sin::text = $1 OR hp_patientno::text = $1
              LIMIT 1`, [identityNumber]);
          if (patResult.length > 0) {
            hp_patientno = patResult[0].hp_patientno;
            patient_name = patResult[0].p_name;
          }
          const docResult = await safeQuery(`SELECT hd_docno FROM hms_doc WHERE hd_patientno = $1 ORDER BY hd_admitdate DESC LIMIT 1`, [hp_patientno]);
          if (docResult.length > 0) docNo = docResult[0].hd_docno;
        } catch (e: any) {
          console.warn(`[QuickNumber] HIS Lookup fail: ${e.message}`);
        }
      }

      let ticketNumber = 0;
      let effectiveRoomId = 0;

      if (kioskType === 'EXECUTION' && hp_patientno && docNo) {
        let p_type = (deptId.toUpperCase().includes('XN') || (areaCode && areaCode.toUpperCase().includes('XN'))) ? 'T' : 'P';
        await safeQuery('SELECT qms_generate_number_v4($1, $2, $3, $4)', [hp_patientno, docNo, 'O', p_type]);
        const hisQuery = p_type === 'T' ? `
            SELECT hpcl_receptno as ticket, hpcl_proomid as room_id, hrl_name as room, sd_name as dept
            FROM hms_testorderline
            JOIN hms_testorder ON (hpcl_orderid = hpc_orderid)
            LEFT JOIN hms_roomlist ON (hrl_id = hpcl_proomid)
            LEFT JOIN sys_dept ON (sd_id = hpcl_perform_deptid)
            WHERE hpc_docno = $1 AND hpcl_receptno > 0 AND DATE(hpc_orderdate) = CURRENT_DATE
            ORDER BY hpcl_receptno DESC LIMIT 1` : `
            SELECT hpcl_receptno as ticket, hpcl_proomid as room_id, hrl_name as room, sd_name as dept
            FROM hms_pacsorderline
            JOIN hms_pacsorder ON (hpcl_orderid = hpc_orderid)
            LEFT JOIN hms_roomlist ON (hrl_id = hpcl_proomid)
            LEFT JOIN sys_dept ON (sd_id = hpcl_perform_deptid)
            WHERE hpc_docno = $1 AND hpcl_receptno > 0 AND DATE(hpc_orderdate) = CURRENT_DATE
            ORDER BY hpcl_receptno DESC LIMIT 1`;

        const hisRes = await safeQuery(hisQuery, [docNo]);
        if (hisRes.length > 0) {
          const ticketNumStr = hisRes[0].ticket.toString();
          ticketNumber = parseInt(ticketNumStr);
          effectiveRoomId = parseInt(hisRes[0].room_id) || 0;

          await pool.query('SELECT hms_exam_pending_insert($1, $2, $3, $4, $5, $6, $7) as ticket', [
            docNo,
            0,
            deptId,
            effectiveRoomId,
            ticketNumber,
            hepType,
            hepType
          ]);

          if (isPriority) {
            await pool.query("UPDATE hms_exam_pending SET hep_callstatus = 'PRIORITY' WHERE hep_docno = $1 AND hep_receptno = $2 AND hep_date = CURRENT_DATE", [docNo, ticketNumber]);
          }

          broadcast({ type: 'QUEUE_UPDATED' });
          return res.json({ success: true, data: { ticketNumber: ticketNumStr, patientName: patient_name, department: hisRes[0].dept, roomname: hisRes[0].room } });
        }
      }

      const insertRes = await pool.query('SELECT hms_exam_pending_insert($1, $2, $3, $4, $5, $6, $7) as ticket', [
        docNo || 0,
        0,
        deptId,
        effectiveRoomId,
        0,
        hepType,
        hepType
      ]);
      ticketNumber = insertRes.rows[0].ticket;

      if (isPriority) {
        await pool.query("UPDATE hms_exam_pending SET hep_callstatus = 'PRIORITY' WHERE hep_docno = $1 AND hep_receptno = $2 AND hep_date = CURRENT_DATE", [docNo || 0, ticketNumber]);
      }

      broadcast({ type: 'NEW_TICKET' });
      res.status(201).json({
        success: true,
        data: { ticketNumber: ticketNumber.toString(), patientName: patient_name, time: new Date().toLocaleString('vi-VN') }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: "Lỗi cấp số: " + err.message });
    }
  }
}
