const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('hms_doc', 'hms_patient', 'hms_reception') 
      AND column_name ILIKE '%code%' OR column_name ILIKE '%verify%' OR column_name ILIKE '%pass%' OR column_name ILIKE '%qr%' OR column_name ILIKE '%pin%'
    `);
    console.log(res.rows.map(r => r.column_name).join(', '));
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
