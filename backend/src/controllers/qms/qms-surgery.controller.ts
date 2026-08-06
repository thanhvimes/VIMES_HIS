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

function normalizeSurgeryStatus(status: string): string {
  if (!status) return 'P';
  const s = String(status).trim().toLowerCase();
  if (s === 'p' || s === 'pre-op' || s === 'chuẩn bị' || s === 'chuan bi') return 'P';
  if (s === 's' || s === 'surgery' || s === 'đang phẫu thuật' || s === 'dang phau thuat') return 'S';
  if (s === 'r' || s === 'recovery' || s === 'hồi tỉnh' || s === 'hoi tinh') return 'R';
  if (s === 'f' || s === 'finished' || s === 'đã về khoa' || s === 'da ve khoa') return 'F';
  return 'P';
}

export class QmsSurgeryController {
  // 27. GET SURGERY WAITING LIST
  static async getSurgeryWaitingList(req: Request, res: Response) {
    try {
      const { deptId } = req.query;
      let sql = `
          SELECT 
              o.ho_idx as id,
              o.ho_docno as doc_no,
              trim(p.hp_surname || ' ' || COALESCE(p.hp_midname,'') || ' ' || p.hp_firstname) as patient_name,
              to_char(p.hp_birthdate, 'YYYY') as birth_year,
              COALESCE(pd.sd_name, o.ho_pdeptid, r.hrl_name, 'Phòng mổ ' || COALESCE(ob.hob_roomid, o.ho_roomid, 1)) as room_name,
              COALESCE(ob.hob_roomid, o.ho_roomid) as room_id,
              to_char(o.ho_startdate, 'HH24:MI') as expected_time,
              to_char(o.ho_performdate, 'HH24:MI') as entrance_time,
              COALESCE(ob.hob_status, o.ho_status, 'P') as status,
              ss.ss_desc as status_desc,
              ob.hob_operation_table as operation_table,
              t.hst_name as table_name,
              ob.hob_rettime as return_time_minutes,
              ob.hob_retdept as return_dept_id,
              rd.sd_name as return_dept_name,
              to_char(ob.hob_conscious_date, 'HH24:MI') as conscious_time,
              o.ho_deptid as dept_id,
              sd.sd_name as dept_name,
              o.ho_doctor as doctor_id,
              o.ho_beforeopera as before_diagnosis,
              o.ho_afteropera as after_diagnosis
          FROM hms_operation o
          LEFT JOIN hms_doc d ON d.hd_docno = o.ho_docno
          LEFT JOIN hms_patient p ON p.hp_patientno = COALESCE(o.ho_patientno, d.hd_patientno)
          INNER JOIN hms_operation_board ob ON ob.hob_docno = o.ho_docno 
              AND (ob.hob_ho_idx = o.ho_idx OR ob.hob_ho_idx IS NULL)
              AND (ob.hob_date >= CURRENT_DATE - INTERVAL '1 day' OR DATE(ob.hob_date) = CURRENT_DATE)
          LEFT JOIN hms_roomlist r ON r.hrl_deptid = o.ho_deptid 
              AND r.hrl_id::text = COALESCE(NULLIF(ob.hob_roomid::text, ''), NULLIF(o.ho_roomid::text, ''), '0')
              AND COALESCE(NULLIF(ob.hob_roomid::text, ''), NULLIF(o.ho_roomid::text, ''), '') NOT IN ('', '0')
          LEFT JOIN hms_surgery_table t ON t.hst_idx = ob.hob_operation_table
          LEFT JOIN sys_dept sd ON sd.sd_id = o.ho_deptid
          LEFT JOIN sys_dept pd ON pd.sd_id = o.ho_pdeptid
          LEFT JOIN sys_dept rd ON rd.sd_id = ob.hob_retdept
          LEFT JOIN sys_sel ss ON ss.ss_id = 'hms_operation_status' AND ss.ss_code = COALESCE(ob.hob_status, o.ho_status, 'P')
          WHERE o.ho_startdate IS NOT NULL 
            AND o.ho_startdate >= (NOW() - INTERVAL '8 hours')
      `;
      const params: any[] = [];
      if (deptId && String(deptId).trim() !== '') {
        sql += ` AND (o.ho_deptid = $1 OR ob.hob_deptid = $1)`;
        params.push(deptId);
      }
      sql += ` ORDER BY o.ho_startdate DESC`;

      const result = await pool.query(sql, params);
      const seen = new Map();
      for (const row of result.rows) {
        const key = row.doc_no;
        if (!seen.has(key)) {
          seen.set(key, row);
        } else {
          const existing = seen.get(key);
          if (!existing.status || existing.status === 'P') {
            if (row.status && row.status !== 'P') {
              seen.set(key, row);
            }
          }
        }
      }

      const formatted = Array.from(seen.values()).map(row => ({
        id: String(row.id),
        docNo: row.doc_no,
        name: row.patient_name || 'Không rõ tên',
        birthYear: row.birth_year || '----',
        room: row.room_name || ('Phòng mổ ' + (row.room_id || 1)),
        roomId: row.room_id,
        expectedTime: row.expected_time || '--:--',
        time: row.entrance_time || '--:--',
        status: row.status || 'P',
        statusDesc: row.status_desc || null,
        operationTable: row.operation_table || null,
        returnTimeMinutes: row.return_time_minutes || null,
        returnDept: row.return_dept_name || null,
        consciousTime: row.conscious_time || null,
        deptName: row.dept_name || null,
        beforeDiagnosis: row.before_diagnosis || null,
        afterDiagnosis: row.after_diagnosis || null
      }));

      res.json(formatted);
    } catch (e: any) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: e.message });
      }
      // 15 High-quality clinical surgery mock patients fallback
      const mockPatients = [
        { id: "101", docNo: "10001", name: "Nguyễn Hoàng Đức", birthYear: "1992", room: "Phòng mổ 1", roomId: 1, expectedTime: "15:30", time: "10:52", status: "R", statusDesc: "Hồi tỉnh" },
        { id: "102", docNo: "10002", name: "Phan Văn Đức", birthYear: "1988", room: "Phòng mổ 2", roomId: 2, expectedTime: "16:00", time: "--:--", status: "P", statusDesc: "Chuẩn bị" },
        { id: "103", docNo: "10003", name: "Đoàn Văn Hậu", birthYear: "1999", room: "Phòng mổ 3", roomId: 3, expectedTime: "16:15", time: "10:52", status: "F", statusDesc: "Đã về khoa" },
        { id: "104", docNo: "10004", name: "Nguyễn Tuấn Anh", birthYear: "1995", room: "Phòng mổ 4", roomId: 4, expectedTime: "16:30", time: "--:--", status: "P", statusDesc: "Chuẩn bị" },
        { id: "105", docNo: "10005", name: "Đặng Văn Lâm", birthYear: "1993", room: "Phòng mổ 1", roomId: 1, expectedTime: "17:00", time: "10:52", status: "S", statusDesc: "Đang phẫu thuật" },
        { id: "106", docNo: "10006", name: "Quế Ngọc Hải", birthYear: "1993", room: "Phòng mổ 2", roomId: 2, expectedTime: "08:30", time: "08:45", status: "F", statusDesc: "Đã về khoa" },
        { id: "107", docNo: "10007", name: "Đỗ Hùng Dũng", birthYear: "1993", room: "Phòng mổ 3", roomId: 3, expectedTime: "09:00", time: "09:15", status: "F", statusDesc: "Đã về khoa" },
        { id: "108", docNo: "10008", name: "Nguyễn Tiến Linh", birthYear: "1997", room: "Phòng mổ 2", roomId: 2, expectedTime: "10:15", time: "10:30", status: "S", statusDesc: "Đang phẫu thuật" },
        { id: "109", docNo: "10009", name: "Vũ Văn Thanh", birthYear: "1996", room: "Phòng mổ 3", roomId: 3, expectedTime: "11:00", time: "11:15", status: "R", statusDesc: "Hồi tỉnh" },
        { id: "110", docNo: "10010", name: "Phạm Đức Huy", birthYear: "1995", room: "Phòng mổ 1", roomId: 1, expectedTime: "13:00", time: "13:10", status: "S", statusDesc: "Đang phẫu thuật" },
        { id: "111", docNo: "10011", name: "Lương Xuân Trường", birthYear: "1995", room: "Phòng mổ 2", roomId: 2, expectedTime: "14:00", time: "--:--", status: "P", statusDesc: "Chuẩn bị" },
        { id: "112", docNo: "10012", name: "Nguyễn Phong Hồng Duy", birthYear: "1996", room: "Phòng mổ 2", roomId: 2, expectedTime: "14:30", time: "--:--", status: "P", statusDesc: "Chuẩn bị" },
        { id: "113", docNo: "10013", name: "Trần Đình Trọng", birthYear: "1997", room: "Phòng mổ 4", roomId: 4, expectedTime: "15:00", time: "15:10", status: "R", statusDesc: "Hồi tỉnh" },
        { id: "114", docNo: "10014", name: "Đoàn Duy Mạnh", birthYear: "1996", room: "Phòng mổ 3", roomId: 3, expectedTime: "15:45", time: "--:--", status: "P", statusDesc: "Chuẩn bị" },
        { id: "115", docNo: "10015", name: "Nguyễn Công Phượng", birthYear: "1995", room: "Phòng mổ 1", roomId: 1, expectedTime: "17:30", time: "--:--", status: "P", statusDesc: "Chuẩn bị" }
      ];
      res.json(mockPatients);
    }
  }

  // 28. UPDATE SURGERY STATUS
  static async updateSurgeryStatus(req: Request, res: Response) {
    try {
      const { ticketId, status, operationTable, retTime, retDept, consciousTime } = req.body;
      if (!ticketId || !status) {
        return res.status(400).json({ success: false, error: 'Thiếu ticketId hoặc status' });
      }

      const hoIdx = parseInt(ticketId);
      if (isNaN(hoIdx)) {
        return res.status(400).json({ success: false, error: 'ticketId (ho_idx) không hợp lệ' });
      }

      const statusCode = normalizeSurgeryStatus(status);
      const opRes = await pool.query(`
          SELECT ho_docno, ho_roomid, ho_deptid, ho_startdate
          FROM hms_operation WHERE ho_idx = $1
      `, [hoIdx]);

      if (opRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy ca mổ' });
      }

      const op = opRes.rows[0];
      const now = new Date();
      const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

      const boardRes = await pool.query(`
          SELECT hms_operation_board_create(
            $1::integer, 
            $2::text, 
            $3::text, 
            $4::integer, 
            $5::integer, 
            $6::text, 
            $7::integer, 
            $8::text, 
            $9::text,
            $10::integer
          ) as result
      `, [
        op.ho_docno,
        dateStr,
        op.ho_deptid || retDept || '',
        op.ho_roomid || 0,
        operationTable || 0,
        statusCode,
        retTime || 0,
        retDept || '',
        consciousTime || dateStr,
        hoIdx
      ]);

      const funcResult = boardRes.rows[0]?.result;
      if (funcResult < 0) {
        const errorMsgs: any = {
          '-1': 'Ngày phẫu thuật đã qua (quá khứ)',
          '-2': 'Ngày hồi tỉnh không hợp lệ',
          '-3': 'Ngày phẫu thuật sau ngày hồi tỉnh'
        };
        return res.status(400).json({
          success: false,
          error: errorMsgs[String(funcResult)] || 'Lỗi validate dữ liệu'
        });
      }

      if (statusCode === 'S') {
        await pool.query(`
            UPDATE hms_operation 
            SET ho_performdate = COALESCE(ho_performdate, CURRENT_TIMESTAMP)
            WHERE ho_idx = $1
        `, [hoIdx]);
      } else if (statusCode === 'P') {
        await pool.query(`
            UPDATE hms_operation SET ho_performdate = NULL WHERE ho_idx = $1
        `, [hoIdx]);
      }

      broadcast({ type: 'SURGERY_UPDATED' });
      broadcast({ type: 'QUEUE_UPDATED' });

      res.json({ success: true, message: 'Cập nhật trạng thái thành công', boardResult: funcResult });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  // 29. GET HIS SURGERIES LIST
  static async getHisSurgeries(req: Request, res: Response) {
    try {
      const { fromDate, toDate, deptId, searchTerm, boardStatus } = req.query;
      let sql = `
          SELECT 
              o.ho_idx as id,
              o.ho_docno as doc_no,
              trim(p.hp_surname || ' ' || COALESCE(p.hp_midname,'') || ' ' || p.hp_firstname) as patient_name,
              to_char(p.hp_birthdate, 'YYYY') as birth_year,
              COALESCE(r.hrl_name, 'Phòng mổ ' || COALESCE(ob.hob_roomid, o.ho_roomid, 1)) as room_name,
              COALESCE(ob.hob_roomid, o.ho_roomid) as room_id,
              to_char(COALESCE(o.ho_startdate, o.ho_performdate, o.ho_orderdate), 'YYYY-MM-DD HH24:MI') as expected_time,
              to_char(o.ho_orderdate, 'YYYY-MM-DD HH24:MI') as order_date,
              fl.hfl_name as service_name,
              o.ho_deptid as dept_id,
              sd.sd_name as dept_name,
              (ob.hob_operation_board_id IS NOT NULL) as is_on_board,
              ob.hob_status as board_status
          FROM hms_operation o
          LEFT JOIN hms_doc d ON d.hd_docno = o.ho_docno
          LEFT JOIN hms_patient p ON p.hp_patientno = o.ho_patientno
          LEFT JOIN sys_dept sd ON sd.sd_id = o.ho_deptid
          LEFT JOIN hms_fee_list fl ON fl.hfl_feeid = o.ho_itemid
          LEFT JOIN hms_operation_board ob ON ob.hob_docno = o.ho_docno 
              AND (ob.hob_ho_idx = o.ho_idx OR ob.hob_ho_idx IS NULL)
              AND (DATE(ob.hob_date) = CURRENT_DATE OR (ob.hob_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = CURRENT_DATE)
          LEFT JOIN hms_roomlist r ON r.hrl_deptid = o.ho_deptid 
          AND r.hrl_id::text = o.ho_roomid::text          
          WHERE (substr(fl.hfl_opt_group,1,2) = 'B4' OR substr(fl.hfl_groupid,1,2) = 'B4')
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (fromDate) {
        sql += ` AND COALESCE(o.ho_startdate, o.ho_performdate, o.ho_orderdate) >= $${paramIndex}::timestamp`;
        params.push(`${fromDate} 00:00:00`);
        paramIndex++;
      }
      if (toDate) {
        sql += ` AND COALESCE(o.ho_startdate, o.ho_performdate, o.ho_orderdate) <= $${paramIndex}::timestamp`;
        params.push(`${toDate} 23:59:59`);
        paramIndex++;
      }
      if (deptId && String(deptId).trim() !== '') {
        sql += ` AND o.ho_deptid = $${paramIndex}`;
        params.push(deptId);
        paramIndex++;
      }
      if (searchTerm && String(searchTerm).trim() !== '') {
        const term = String(searchTerm).trim();
        sql += ` AND (
            p.hp_surname || ' ' || COALESCE(p.hp_midname,'') || ' ' || p.hp_firstname ILIKE $${paramIndex}
            OR o.ho_docno::text ILIKE $${paramIndex}
        )`;
        params.push(`%${term}%`);
        paramIndex++;
      }
      if (boardStatus === 'yes' || boardStatus === 'true') {
        sql += ` AND ob.hob_operation_board_id IS NOT NULL`;
      } else if (boardStatus === 'no' || boardStatus === 'false') {
        sql += ` AND ob.hob_operation_board_id IS NULL`;
      }

      sql += ` ORDER BY COALESCE(o.ho_startdate, o.ho_performdate, o.ho_orderdate) DESC NULLS LAST LIMIT 50`;
      const result = await pool.query(sql, params);
      const seen = new Map();
      for (const row of result.rows) {
        const key = row.doc_no;
        if (!seen.has(key)) {
          seen.set(key, row);
        } else {
          const existing = seen.get(key);
          if (!existing.is_on_board && row.is_on_board) {
            seen.set(key, row);
          }
        }
      }
      res.json(Array.from(seen.values()));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 29b. GET ALL SURGERY ROOMS
  static async getSurgeryRooms(req: Request, res: Response) {
    try {
      const sql = `
          SELECT DISTINCT hrl_id::text as id, hrl_name as name 
          FROM hms_roomlist 
          WHERE hrl_name ILIKE '%mổ%' 
             OR hrl_name ILIKE '%phẫu thuật%' 
             OR hrl_deptid IN (
                  SELECT sd_id FROM sys_dept 
                  WHERE sd_name ILIKE '%mổ%' OR sd_name ILIKE '%phẫu thuật%' OR sd_name ILIKE '%gây mê%'
             )
          ORDER BY hrl_name
      `;
      const result = await safeQuery(sql, [], []);
      return res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 29c. GET ALL SURGERY TABLES
  static async getSurgeryTables(req: Request, res: Response) {
    try {
      const { userId } = req.query;
      let xorgId: string | null = null;

      if (userId) {
        const userRes = await pool.query(
          'SELECT su_xorg_id FROM sys_user WHERE su_userid = $1',
          [String(userId)]
        );
        if (userRes.rows.length > 0) {
          xorgId = userRes.rows[0].su_xorg_id;
        }
      }

      let sql = '';
      let params: any[] = [];

      if (xorgId) {
        sql = `
          SELECT hst_idx as id, hst_name as name 
          FROM hms_surgery_table 
          WHERE hst_xorg_id = $1 OR hst_xorg_id IS NULL OR hst_xorg_id = ''
          ORDER BY hst_name
        `;
        params = [xorgId];
      } else {
        sql = `
          SELECT hst_idx as id, hst_name as name 
          FROM hms_surgery_table 
          ORDER BY hst_name
        `;
      }

      try {
        const queryRes = await pool.query(sql, params);
        const result = queryRes.rows.map(r => ({ id: r.id, name: r.name }));
        return res.json(result);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // 30. ADD SURGERY TO BOARD FROM HIS
  static async addSurgeryFromHis(req: Request, res: Response) {
    try {
      const { hoIdx, status, room, operationTable, retTime, retDept, consciousTime, expectedTime } = req.body;
      if (!hoIdx || !status) {
        return res.status(400).json({ success: false, error: 'Thiếu hoIdx hoặc status' });
      }

      const hoIdxInt = parseInt(hoIdx);
      if (isNaN(hoIdxInt)) {
        return res.status(400).json({ success: false, error: 'hoIdx không hợp lệ' });
      }

      const statusCode = normalizeSurgeryStatus(status);
      const opRes = await pool.query(`
          SELECT ho_docno, ho_roomid, ho_deptid, ho_startdate
          FROM hms_operation WHERE ho_idx = $1
      `, [hoIdxInt]);

      if (opRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy ca mổ trên HIS' });
      }

      const op = opRes.rows[0];

      if (expectedTime) {
        await pool.query(`
            UPDATE hms_operation 
            SET ho_startdate = $1::timestamp
            WHERE ho_idx = $2
        `, [expectedTime.replace('T', ' '), hoIdxInt]);
      }

      const now = new Date();
      const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

      let formattedConsciousTime = dateStr;
      if (consciousTime) {
        const todayStr = dateStr.substring(0, 10);
        formattedConsciousTime = `${todayStr} ${consciousTime}:00`;
      }

      const boardRes = await pool.query(`
          SELECT hms_operation_board_create($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) as result
      `, [
        op.ho_docno,
        dateStr,
        op.ho_deptid || '',
        room || op.ho_roomid || 1,
        operationTable || 1,
        statusCode,
        retTime || 0,
        retDept || '',
        formattedConsciousTime,
        hoIdxInt
      ]);

      const funcResult = boardRes.rows[0]?.result;
      if (funcResult < 0) {
        const errorMsgs: any = {
          '-1': 'Ngày phẫu thuật đã qua (quá khứ)',
          '-2': 'Ngày hồi tỉnh không hợp lệ',
          '-3': 'Ngày phẫu thuật sau ngày hồi tỉnh'
        };
        return res.status(400).json({
          success: false,
          error: errorMsgs[String(funcResult)] || 'Lỗi validate dữ liệu trong DB'
        });
      }

      if (statusCode === 'S') {
        await pool.query(`
            UPDATE hms_operation 
            SET ho_performdate = COALESCE(ho_performdate, CURRENT_TIMESTAMP)
            WHERE ho_idx = $1
        `, [hoIdxInt]);
      }

      broadcast({ type: 'SURGERY_UPDATED' });
      broadcast({ type: 'QUEUE_UPDATED' });

      res.json({ success: true, message: 'Đưa ca phẫu thuật từ HIS vào bảng theo dõi thành công', boardResult: funcResult });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }
}
