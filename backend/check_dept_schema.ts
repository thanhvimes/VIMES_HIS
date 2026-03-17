
import { query } from './src/config/database';
async function run() {
    try {
        const res = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'sys_dept'");
        console.log("COLUMNS:", res.rows.map(r => r.column_name).join(', '));
        
        const res2 = await query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%dept%'");
        console.log("TABLES:", res2.rows.map(r => r.table_name).join(', '));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
