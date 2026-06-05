import { pool } from '../config/database';

async function main() {
  try {
    console.log('--- Checking active and pending tickets for Room 14 (Room 171) ---');

    const res = await pool.query(`
      SELECT 
        ep.hep_docno, 
        ep.hep_receptno, 
        ep.hep_pending, 
        ep.hep_roomid, 
        ep.hep_deptid,
        trim(p.hp_surname ||' '|| p.hp_midname ||' '|| p.hp_firstname) AS patient_name
      FROM hms_exam_pending ep
      LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
      LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
      WHERE ep.hep_roomid = 14 AND ep.hep_date = CURRENT_DATE
      ORDER BY ep.hep_receptno DESC
    `);
    
    console.log('All records for room 14 today:');
    console.table(res.rows);

  } catch (err: any) {
    console.error('Error running script:', err);
  } finally {
    await pool.end();
  }
}

main();
