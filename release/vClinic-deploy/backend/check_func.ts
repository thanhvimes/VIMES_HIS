import { pool } from './src/config/database';

async function check() {
  try {
    const res = await pool.query(`
      SELECT routine_definition
      FROM information_schema.routines 
      WHERE routine_name = 'hms_exam_pending_insert'
    `);
    if (res.rows.length > 0) {
      console.log("DEFINITION:", res.rows[0].routine_definition);
    } else {
      console.log("Function hms_exam_pending_insert not found");
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

check();
