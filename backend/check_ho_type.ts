
import { pool } from './src/config/database';

async function check() {
    const r = await pool.query("SELECT ho_type, count(*) FROM hms_operation GROUP BY ho_type");
    console.log(r.rows);
    process.exit(0);
}
check();
