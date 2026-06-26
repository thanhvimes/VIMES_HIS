import { pool } from '../src/config/database';

async function check() {
  try {
    // 1. Check for cancelled bookings that still have slot status = 'S'
    const cancelledRes = await pool.query(`
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
      JOIN hms_schedule_exam hse ON (
        hse.hse_deptid = q.qms_deptid 
        AND hse.hse_roomid = q.qms_roomid 
        AND hse.hse_date = q.qms_appointment_date 
        AND hse.hse_time = q.qms_appointment_time
      )
      WHERE q.qms_type = 'ONL' AND q.qms_status = 'C' AND hse.hse_status = 'S'
      LIMIT 20;
    `);
    console.log("CANCELLED BOOKINGS WITH SLOT STATUS = 'S' (SHOULD BE 'O'):");
    console.table(cancelledRes.rows);

    // 2. Check for duplicate bookings (same slot, multiple active bookings)
    const dupRes = await pool.query(`
      SELECT 
        qms_appointment_date,
        qms_appointment_time,
        qms_deptid,
        qms_roomid,
        COUNT(*) as booking_count
      FROM qms_patient
      WHERE qms_type = 'ONL' AND qms_status != 'C'
      GROUP BY qms_appointment_date, qms_appointment_time, qms_deptid, qms_roomid
      HAVING COUNT(*) > 1
      LIMIT 20;
    `);
    console.log("\nDUPLICATE BOOKINGS FOR THE SAME SLOT:");
    console.table(dupRes.rows);

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

check();
