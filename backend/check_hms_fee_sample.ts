
import { pool } from './src/config/database';

async function check() {
    const table = 'hms_fee';
    const sample = await pool.query(`SELECT * FROM ${table} WHERE hfe_docno IS NOT NULL LIMIT 5`);
    console.log("Sample Data:", JSON.stringify(sample.rows, null, 2));
    process.exit(0);
}
check();
