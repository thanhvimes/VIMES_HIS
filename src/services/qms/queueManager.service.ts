import { pool } from '../../config/database';
import { broadcast } from './sse.service';

export class QueueManagerService {
  /**
   * Calls the next patient in the queue for a given counter/room.
   * Implements database routine call to hms_exam_pending_call.
   * @param counterId 
   * @param isPriority 
   * @param type - KioskType
   * @param deptId - Department ID
   * @returns The called ticket
   */
  static async callNext(
    counterId: string | number,
    isPriority: boolean = false,
    type: string | null = null,
    deptId: string | null = null
  ): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let areaId: number | null = null;
      let counterName = '';
      let deptCode = deptId || null;

      // STEP 1: Find area and counter name
      if (type === 'EXECUTION') {
        let roomRes;
        if (deptCode) {
          roomRes = await client.query(
            'SELECT hrl_name, hrl_deptid::text as dept_code FROM hms_roomlist WHERE hrl_id::text = $1::text AND hrl_deptid::text = $2::text',
            [String(counterId), deptCode]
          );
        } else {
          roomRes = await client.query(
            'SELECT hrl_name, hrl_deptid::text as dept_code FROM hms_roomlist WHERE hrl_id::text = $1::text LIMIT 1',
            [String(counterId)]
          );
        }

        if (roomRes.rows.length > 0) {
          counterName = roomRes.rows[0].hrl_name;
          if (!deptCode) {
            deptCode = roomRes.rows[0].dept_code;
          }
        } else {
          const counterRes = await client.query('SELECT area_id, counter_name FROM kiosk_counters WHERE counter_id = $1', [Number(counterId)]);
          if (counterRes.rows.length > 0) {
            areaId = counterRes.rows[0].area_id;
            counterName = counterRes.rows[0].counter_name;
          } else {
            counterName = 'Phòng khám ' + counterId;
          }
        }
      } else {
        const counterRes = await client.query('SELECT area_id, counter_name FROM kiosk_counters WHERE counter_id = $1', [Number(counterId)]);
        if (counterRes.rows.length > 0) {
          areaId = counterRes.rows[0].area_id;
          counterName = counterRes.rows[0].counter_name;
        } else {
          let roomRes;
          if (deptCode) {
            roomRes = await client.query(
              'SELECT hrl_name, hrl_deptid::text as dept_code FROM hms_roomlist WHERE hrl_id::text = $1::text AND hrl_deptid::text = $2::text',
              [String(counterId), deptCode]
            );
          } else {
            roomRes = await client.query(
              'SELECT hrl_name, hrl_deptid::text as dept_code FROM hms_roomlist WHERE hrl_id::text = $1::text LIMIT 1',
              [String(counterId)]
            );
          }
          if (roomRes.rows.length > 0) {
            counterName = roomRes.rows[0].hrl_name;
            if (!deptCode) {
              deptCode = roomRes.rows[0].dept_code;
            }
          } else {
            counterName = 'Quầy ' + counterId;
          }
        }
      }

      // STEP 2: Complete previous calling patient (if any)
      if (type === 'EXECUTION' && deptCode) {
        await client.query(`
          UPDATE hms_exam_pending 
          SET hep_pending = 'A' 
          WHERE hep_roomid::text = $1::text AND hep_deptid = $2 AND hep_pending = 'C' AND hep_date = CURRENT_DATE
        `, [String(counterId), deptCode]);
      } else {
        await client.query(`
          UPDATE hms_exam_pending 
          SET hep_pending = 'A' 
          WHERE hep_roomid::text = $1::text AND hep_pending = 'C' AND hep_date = CURRENT_DATE
        `, [String(counterId)]);
      }

      // STEP 3: FIND NEXT PATIENT
      let nextPatient;
      if (type === 'EXECUTION') {
        if (deptCode) {
          let queryText = `
            SELECT ep.hep_docno, ep.hep_deptid, ep.hep_roomid, ep.hep_receptidx, ep.hep_receptno
            FROM hms_exam_pending ep
            LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
            LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
            WHERE ep.hep_pending = 'O' 
              AND ep.hep_date = CURRENT_DATE
              AND ep.hep_type IN ('E', 'I')
              AND ep.hep_deptid = $2
              AND ep.hep_roomid::text = $1::text
          `;
          if (isPriority) {
            queryText += ` AND (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.hp_birthdate) >= 75)`;
            queryText += ` ORDER BY ep.hep_receptno ASC`;
          } else {
            queryText += ` ORDER BY (CASE WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.hp_birthdate)) >= 75 THEN 1 ELSE 0 END) DESC, ep.hep_receptno ASC`;
          }
          queryText += ` LIMIT 1 FOR UPDATE OF ep SKIP LOCKED`;
          nextPatient = await client.query(queryText, [String(counterId), deptCode]);
        } else {
          let queryText = `
            SELECT ep.hep_docno, ep.hep_deptid, ep.hep_roomid, ep.hep_receptidx, ep.hep_receptno
            FROM hms_exam_pending ep
            LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
            LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
            WHERE ep.hep_pending = 'O' 
              AND ep.hep_date = CURRENT_DATE
              AND ep.hep_type IN ('E', 'I')
              AND ep.hep_roomid::text = $1::text
          `;
          if (isPriority) {
            queryText += ` AND (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.hp_birthdate) >= 75)`;
            queryText += ` ORDER BY ep.hep_receptno ASC`;
          } else {
            queryText += ` ORDER BY (CASE WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.hp_birthdate)) >= 75 THEN 1 ELSE 0 END) DESC, ep.hep_receptno ASC`;
          }
          queryText += ` LIMIT 1 FOR UPDATE OF ep SKIP LOCKED`;
          nextPatient = await client.query(queryText, [String(counterId)]);
        }
      } else {
        const hepType = (type === 'SAMPLING') ? 'I' : 'E';
        if (deptCode) {
          let queryText = `
            SELECT ep.hep_docno, ep.hep_deptid, ep.hep_roomid, ep.hep_receptidx, ep.hep_receptno
            FROM hms_exam_pending ep
            LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
            LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
            WHERE ep.hep_pending = 'O' 
              AND ep.hep_date = CURRENT_DATE
              AND ep.hep_type = $2
              AND ep.hep_deptid = $1
          `;
          if (isPriority) {
            queryText += ` AND (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.hp_birthdate) >= 75)`;
            queryText += ` ORDER BY ep.hep_receptno ASC`;
          } else {
            queryText += ` ORDER BY (CASE WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.hp_birthdate)) >= 75 THEN 1 ELSE 0 END) DESC, ep.hep_receptno ASC`;
          }
          queryText += ` LIMIT 1 FOR UPDATE OF ep SKIP LOCKED`;
          nextPatient = await client.query(queryText, [deptCode, hepType]);
        } else {
          let queryText = `
            SELECT ep.hep_docno, ep.hep_deptid, ep.hep_roomid, ep.hep_receptidx, ep.hep_receptno
            FROM hms_exam_pending ep
            LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
            LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
            WHERE ep.hep_pending = 'O' 
              AND ep.hep_date = CURRENT_DATE
              AND ep.hep_type = $1
          `;
          if (isPriority) {
            queryText += ` AND (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.hp_birthdate) >= 75)`;
            queryText += ` ORDER BY ep.hep_receptno ASC`;
          } else {
            queryText += ` ORDER BY (CASE WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.hp_birthdate)) >= 75 THEN 1 ELSE 0 END) DESC, ep.hep_receptno ASC`;
          }
          queryText += ` LIMIT 1 FOR UPDATE OF ep SKIP LOCKED`;
          nextPatient = await client.query(queryText, [hepType]);
        }
      }

      if (nextPatient.rows.length === 0) {
        await client.query('COMMIT');
        return null;
      }

      const p = nextPatient.rows[0];

      // Update room ID for patient to current counter before calling routine
      if (Number(p.hep_roomid) !== Number(counterId)) {
        await client.query(`
          UPDATE hms_exam_pending
          SET hep_roomid = $1
          WHERE hep_docno = $2 AND hep_receptno = $3 AND hep_date = CURRENT_DATE
        `, [Number(counterId), p.hep_docno, p.hep_receptno]);
      }

      // STEP 4: Call pending function
      await client.query('SELECT hms_exam_pending_call($1, $2, $3, $4, $5)', [
        p.hep_docno,
        p.hep_deptid,
        Number(counterId),
        p.hep_receptidx,
        'O'
      ]);

      // Get full info
      const updated = await client.query(`
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
      `, [p.hep_docno, p.hep_deptid, Number(counterId)]);

      await client.query('COMMIT');

      if (updated.rows.length === 0) return null;
      const calledTicket = updated.rows[0];

      // Publish Real-time events
      broadcast({
        type: 'NEW_CALL',
        areaId: areaId,
        ticket: calledTicket,
        counterId: counterId,
        counterName: counterName
      }, areaId || 'global');

      broadcast({
        type: 'QUEUE_UPDATED',
        areaId: areaId
      }, 'global');

      return calledTicket;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async complete(counterId: string | number, ticketId?: string, docNo?: any, receptNo?: any, deptId?: any): Promise<void> {
    let targetDocNo = docNo ? parseInt(String(docNo)) : undefined;
    let targetReceptNo = receptNo ? parseInt(String(receptNo)) : undefined;

    if (ticketId && (!targetDocNo || !targetReceptNo)) {
      const parts = String(ticketId).split('-');
      targetDocNo = parseInt(parts[0]);
      targetReceptNo = parseInt(parts[1]);
    }

    if (targetDocNo && targetReceptNo && !isNaN(targetDocNo) && !isNaN(targetReceptNo)) {
      if (deptId) {
        await pool.query(`
          UPDATE hms_exam_pending 
          SET hep_pending = 'A' 
          WHERE hep_docno = $1 AND hep_receptno = $2 AND hep_deptid = $3 AND hep_date = CURRENT_DATE
        `, [targetDocNo, targetReceptNo, deptId]);
      } else {
        await pool.query(`
          UPDATE hms_exam_pending 
          SET hep_pending = 'A' 
          WHERE hep_docno = $1 AND hep_receptno = $2 AND hep_date = CURRENT_DATE
        `, [targetDocNo, targetReceptNo]);
      }
      broadcast({ type: 'QUEUE_UPDATED', counterId }, 'global');
      return;
    }

    await pool.query(`
      UPDATE hms_exam_pending 
      SET hep_pending = 'A' 
      WHERE hep_roomid = $1 AND hep_pending = 'C' AND hep_date = CURRENT_DATE
    `, [Number(counterId)]);
    broadcast({ type: 'QUEUE_UPDATED', counterId }, 'global');
  }

  static async skip(ticketId: string, docNo?: any, receptNo?: any, deptId?: any): Promise<void> {
    let targetDocNo = docNo ? parseInt(String(docNo)) : undefined;
    let targetReceptNo = receptNo ? parseInt(String(receptNo)) : undefined;

    if (ticketId && (!targetDocNo || !targetReceptNo)) {
      const parts = String(ticketId).split('-');
      targetDocNo = parseInt(parts[0]);
      targetReceptNo = parseInt(parts[1]);
    }

    if (targetDocNo && targetReceptNo && !isNaN(targetDocNo) && !isNaN(targetReceptNo)) {
      if (deptId) {
        await pool.query(`
          UPDATE hms_exam_pending 
          SET hep_pending = 'A' 
          WHERE hep_docno = $1 AND hep_receptno = $2 AND hep_deptid = $3 AND hep_date = CURRENT_DATE
        `, [targetDocNo, targetReceptNo, deptId]);
      } else {
        await pool.query(`
          UPDATE hms_exam_pending 
          SET hep_pending = 'A' 
          WHERE hep_docno = $1 AND hep_receptno = $2 AND hep_date = CURRENT_DATE
        `, [targetDocNo, targetReceptNo]);
      }
    }
    broadcast({ type: 'QUEUE_UPDATED' }, 'global');
  }

  static async transfer(
    ticketId: string,
    targetRoomId: number | null,
    targetAreaId?: number | null,
    notes?: string,
    docNo?: any,
    receptNo?: any,
    deptId?: any
  ): Promise<void> {
    let targetDocNo = docNo ? parseInt(String(docNo)) : undefined;
    let targetReceptNo = receptNo ? parseInt(String(receptNo)) : undefined;

    if (ticketId && (!targetDocNo || !targetReceptNo)) {
      const parts = String(ticketId).split('-');
      targetDocNo = parseInt(parts[0]);
      targetReceptNo = parseInt(parts[1]);
    }

    if (targetDocNo && targetReceptNo && !isNaN(targetDocNo) && !isNaN(targetReceptNo)) {
      if (deptId) {
        await pool.query(`
          UPDATE hms_exam_pending 
          SET hep_roomid = $1, hep_pending = 'O', hep_callstatus = NULL
          WHERE hep_docno = $2 AND hep_receptno = $3 AND hep_deptid = $4 AND hep_date = CURRENT_DATE
        `, [targetRoomId || 0, targetDocNo, targetReceptNo, deptId]);
      } else {
        await pool.query(`
          UPDATE hms_exam_pending 
          SET hep_roomid = $1, hep_pending = 'O', hep_callstatus = NULL
          WHERE hep_docno = $2 AND hep_receptno = $3 AND hep_date = CURRENT_DATE
        `, [targetRoomId || 0, targetDocNo, targetReceptNo]);
      }
    }
    broadcast({ type: 'QUEUE_UPDATED' }, 'global');
  }

  static async callAgain(ticketId: string, docNo?: any, receptNo?: any, deptId?: any): Promise<any> {
    let targetDocNo = docNo ? parseInt(String(docNo)) : undefined;
    let targetReceptNo = receptNo ? parseInt(String(receptNo)) : undefined;

    if (ticketId && (!targetDocNo || !targetReceptNo)) {
      const parts = String(ticketId).split('-');
      targetDocNo = parseInt(parts[0]);
      targetReceptNo = parseInt(parts[1]);
    }

    if (!targetDocNo || !targetReceptNo || isNaN(targetDocNo) || isNaN(targetReceptNo)) return null;

    let info;
    if (deptId) {
      info = await pool.query(`
        SELECT hep_docno, hep_deptid, hep_roomid, hep_receptidx 
        FROM hms_exam_pending 
        WHERE hep_docno = $1 AND hep_receptno = $2 AND hep_deptid = $3 AND hep_date = CURRENT_DATE
      `, [targetDocNo, targetReceptNo, deptId]);
    } else {
      info = await pool.query(`
        SELECT hep_docno, hep_deptid, hep_roomid, hep_receptidx 
        FROM hms_exam_pending 
        WHERE hep_docno = $1 AND hep_receptno = $2 AND hep_date = CURRENT_DATE
      `, [targetDocNo, targetReceptNo]);
    }

    if (info.rows.length === 0) return null;
    const row = info.rows[0];

    await pool.query('SELECT hms_exam_pending_call($1, $2, $3, $4, $5)', [
      row.hep_docno,
      row.hep_deptid,
      row.hep_roomid,
      row.hep_receptidx,
      'O'
    ]);

    const updated = await pool.query(`
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
    `, [row.hep_docno, row.hep_deptid, row.hep_roomid]);

    if (updated.rows.length === 0) return null;
    const ticket = updated.rows[0];

    let areaId: number | null = null;
    let counterName = '';
    const deptCode = ticket.dept_code || null;

    let roomRes;
    if (deptCode) {
      roomRes = await pool.query(
        'SELECT hrl_name, hrl_deptid::text as dept_code FROM hms_roomlist WHERE hrl_id::text = $1::text AND hrl_deptid::text = $2::text',
        [ticket.room_id, deptCode]
      );
    } else {
      roomRes = await pool.query(
        'SELECT hrl_name, hrl_deptid::text as dept_code FROM hms_roomlist WHERE hrl_id::text = $1::text LIMIT 1',
        [ticket.room_id]
      );
    }

    if (roomRes.rows.length > 0) {
      counterName = roomRes.rows[0].hrl_name;
    } else {
      const counterRes = await pool.query('SELECT area_id, counter_name FROM kiosk_counters WHERE counter_id = $1', [ticket.room_id]);
      if (counterRes.rows.length > 0) {
        areaId = counterRes.rows[0].area_id;
        counterName = counterRes.rows[0].counter_name;
      } else {
        counterName = 'Phòng khám ' + ticket.room_id;
      }
    }

    broadcast({
      type: 'NEW_CALL',
      ticket: ticket,
      areaId: areaId,
      counterId: ticket.room_id,
      counterName: counterName
    }, areaId || 'global');

    return ticket;
  }
}
