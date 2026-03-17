
import { pool } from './src/config/database';

async function check() {
    try {
        const r = await pool.query("SELECT hfl_feeid, hfl_name, hfl_groupid FROM hms_feelist WHERE hfl_name ILIKE '%Máu%' OR hfl_name ILIKE '%X-Quang%' LIMIT 20");
        console.log(r.rows);
    } catch (e) {
        console.error(e.message);
    }
    process.exit(0);
}
check();
