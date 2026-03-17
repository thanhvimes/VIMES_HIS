
import { pool } from './src/config/database';

async function check() {
    const r = await pool.query("SELECT ho_itemid, ho_performdate, ho_practitioner, ho_docno FROM hms_operation WHERE ho_docno IS NOT NULL ORDER BY ho_performdate DESC LIMIT 5");
    console.log(JSON.stringify(r.rows, null, 2));
    process.exit(0);
}
check();
