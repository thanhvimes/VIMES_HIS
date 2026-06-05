
import { pool } from './src/config/database';

async function check() {
    const r = await pool.query("SELECT hfl_groupid, hfl_name FROM hms_feelist WHERE hfl_name ILIKE '%phẫu thuật%' OR hfl_name ILIKE '%thủ thuật%' LIMIT 20");
    console.log(r.rows);
    process.exit(0);
}
check();
