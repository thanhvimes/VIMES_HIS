
import { query } from './src/config/database';
async function run() {
    const res = await query("SELECT pg_get_functiondef('hms_card_trg_proc'::regproc)");
    const lines = res.rows[0].pg_get_functiondef.split('\n');
    lines.forEach(l => console.log(l));
    process.exit(0);
}
run();
