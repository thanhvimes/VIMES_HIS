
import { query } from './src/config/database';
async function run() {
    const res = await query("SELECT proname, pg_get_functiondef(oid) as def FROM pg_proc WHERE proname = 'hms_delete_reception_v2'");
    if (res.rows.length > 0) {
        console.log("hms_delete_reception_v2 exists.");
        // console.log(res.rows[0].def);
    } else {
        console.log("hms_delete_reception_v2 MISSING.");
    }
    process.exit(0);
}
run();
