
import { query } from './src/config/database';

async function check() {
    try {
        const res = await query(`SELECT hd_object, count(*) FROM hms_doc GROUP BY hd_object`);
        console.log("Existing hd_object values:", res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
