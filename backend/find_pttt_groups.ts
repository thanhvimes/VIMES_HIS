
import { pool } from './src/config/database';

async function check() {
    const r = await pool.query(`
        SELECT DISTINCT hfl_groupid 
        FROM hms_feelist 
        WHERE hfl_name ILIKE '%phẫu thuật%' OR hfl_name ILIKE '%thủ thuật%'
    `);
    console.log("Groups found:", r.rows.map(x => x.hfl_groupid));
    process.exit(0);
}
check();
