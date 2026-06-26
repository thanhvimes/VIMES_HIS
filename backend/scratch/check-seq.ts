import { pool } from '../src/config/database';

async function check() {
  try {
    const maxIdRes = await pool.query(`SELECT MAX(qms_idx) as max_id FROM qms_patient;`);
    const maxId = maxIdRes.rows[0].max_id;
    console.log(`Max ID in qms_patient: ${maxId}`);
    
    console.log(`Syncing qms_idx_asq to ${maxId + 1}...`);
    await pool.query(`SELECT setval('qms_idx_asq', $1, false);`, [maxId + 1]);
    
    const seqRes = await pool.query(`SELECT last_value, is_called FROM qms_idx_asq;`);
    console.log(`Sequence qms_idx_asq last_value: ${seqRes.rows[0].last_value}, is_called: ${seqRes.rows[0].is_called}`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

check();
