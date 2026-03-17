
import { pool } from './src/config/database';

async function check() {
    try {
        const r = await pool.query("SELECT * FROM hms_fee_group LIMIT 1");
        console.log("hms_fee_group exists. Columns:", Object.keys(r.rows[0]));
        console.log("Sample:", r.rows[0]);
    } catch {
        console.log("hms_fee_group does not exist.");
    }
    process.exit(0);
}
check();
