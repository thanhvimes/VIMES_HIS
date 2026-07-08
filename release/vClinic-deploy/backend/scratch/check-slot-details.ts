import { pool } from '../src/config/database';

async function check() {
  try {
    const res = await pool.query(`
      SELECT 
        hse_deptid, hse_roomid, hse_date, hse_time, hse_status,
        (
            SELECT COUNT(*) 
            FROM qms_patient q 
            WHERE q.qms_deptid = hse.hse_deptid 
              AND q.qms_roomid = hse.hse_roomid 
              AND q.qms_appointment_date = hse.hse_date 
              AND q.qms_appointment_time = hse.hse_time
              AND q.qms_status IN ('O', 'S')
        ) as booked_count
      FROM hms_schedule_exam hse
      WHERE hse_deptid = 'KB' AND hse_roomid = 14 AND hse_date = '2026-06-29' AND hse_time = '07:00';
    `);
    console.table(res.rows);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

check();
