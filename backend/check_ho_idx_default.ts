
import { pool } from './src/config/database';

async function check() {
    const table = 'hms_operation';
    const r = await pool.query(`SELECT column_default FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'ho_idx'`);
    console.log("ho_idx default:", r.rows[0]?.column_default);
    process.exit(0);
}
check();
