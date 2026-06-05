import { pool } from './src/config/database';

async function check() {
  try {
    const res = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'hms_exam_pending'
    `);
    console.log("SCHEMA OF hms_exam_pending:");
    res.rows.forEach(r => {
      console.log(`- ${r.table_schema}.${r.table_name}`);
    });
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

check();
