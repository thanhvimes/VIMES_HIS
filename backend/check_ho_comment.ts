
import { pool } from './src/config/database';

async function check() {
    const r = await pool.query("SELECT ho_comment FROM hms_operation WHERE ho_comment IS NOT NULL LIMIT 5");
    console.log(r.rows);
    process.exit(0);
}
check();
