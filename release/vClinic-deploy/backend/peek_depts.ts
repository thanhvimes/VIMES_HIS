
import { query } from './src/config/database';
async function run() {
    const res = await query("SELECT sd_id, sd_name FROM sys_dept LIMIT 10");
    console.log(res.rows);
    process.exit(0);
}
run();
