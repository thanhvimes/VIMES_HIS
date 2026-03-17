
import { pool } from './src/config/database';

async function check() {
    const r = await pool.query("SELECT ho_itemid, ho_performdate, ho_practitioner, ho_note FROM hms_operation ORDER BY ho_performdate DESC LIMIT 5");
    console.log("Recent operations:", r.rows);
    process.exit(0);
}
check();
