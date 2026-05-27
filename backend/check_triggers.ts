import { pool } from './src/config/database';

async function check() {
  try {
    const res = await pool.query(`
      SELECT tgname 
      FROM pg_trigger 
      WHERE tgrelid = 'public.hms_exam_pending'::regclass
    `);
    console.log("TRIGGERS ON public.hms_exam_pending:");
    res.rows.forEach(r => {
      console.log(`- ${r.tgname}`);
    });
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

check();
