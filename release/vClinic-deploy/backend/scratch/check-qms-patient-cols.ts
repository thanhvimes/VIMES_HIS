import { pool } from '../src/config/database';

async function check() {
  try {
    const columnsRes = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'qms_patient'
      ORDER BY column_name;
    `);
    console.log("COLUMNS OF qms_patient:");
    columnsRes.rows.forEach(r => {
      console.log(`- ${r.column_name}: ${r.data_type}(${r.character_maximum_length || ''}) (nullable: ${r.is_nullable})`);
    });
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

check();
