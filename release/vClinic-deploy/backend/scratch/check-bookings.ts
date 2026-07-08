import { pool } from '../src/config/database';

async function check() {
  try {
    const res = await pool.query(`
      SELECT 
        q.qms_idx,
        q.qms_patientname,
        q.qms_appointment_date,
        q.qms_appointment_time,
        q.qms_status,
        q.qms_roomid,
        q.qms_deptid,
        hse.hse_status
      FROM qms_patient q
      LEFT JOIN hms_schedule_exam hse ON (
        hse.hse_deptid = q.qms_deptid 
        AND hse.hse_roomid = q.qms_roomid 
        AND hse.hse_date = q.qms_appointment_date 
        AND hse.hse_time = q.qms_appointment_time
      )
      WHERE q.qms_type = 'ONL'
      ORDER BY q.qms_idx DESC
      LIMIT 20;
    `);
    console.log("RECENT ONLINE BOOKINGS AND THEIR SLOT STATUS:");
    console.table(res.rows);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

check();
