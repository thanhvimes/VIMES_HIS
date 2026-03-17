
import { pool } from './src/config/database';

async function check() {
    try {
        const r = await pool.query("SELECT * FROM pcms_group LIMIT 10");
        console.log(r.rows);
    } catch (e) {
        console.error("Table pcms_group error:", e.message);
    }
    process.exit(0);
}
check();
