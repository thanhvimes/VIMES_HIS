
import { query } from './src/config/database';
async function run() {
    const res = await query("SELECT sd_id, sd_name FROM sys_dept ORDER BY sd_id");
    console.log(`Total: ${res.rows.length}`);
    res.rows.forEach(r => console.log(`${r.sd_id}: ${r.sd_name}`));
    process.exit(0);
}
run();
