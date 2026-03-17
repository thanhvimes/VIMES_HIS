
import { pool } from './src/config/database';

async function check() {
    const table = 'hms_operation';
    const r = await pool.query(`SELECT data_type FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'ho_idx'`);
    console.log("ho_idx type:", r.rows[0]?.data_type);
    process.exit(0);
}
check();
