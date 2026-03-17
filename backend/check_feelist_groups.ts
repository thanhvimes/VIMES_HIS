
import { pool } from './src/config/database';

async function check() {
    const r = await pool.query("SELECT hfl_groupid, count(*) FROM hms_feelist GROUP BY hfl_groupid ORDER BY 2 DESC");
    console.log(r.rows);
    process.exit(0);
}
check();
