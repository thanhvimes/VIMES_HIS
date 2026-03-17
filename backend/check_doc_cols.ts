
import { query } from './src/config/database';
async function run() {
    const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hms_doc' AND column_name IN ('hd_cardno', 'hd_cardidx', 'hd_object')");
    res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
    process.exit(0);
}
run();
