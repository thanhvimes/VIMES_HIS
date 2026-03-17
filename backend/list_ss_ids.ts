
import { query } from './src/config/database';

async function check() {
    try {
        const res = await query(`SELECT DISTINCT ss_id FROM sys_sel LIMIT 50`);
        console.log("Available ss_ids:", res.rows.map(r => r.ss_id));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
