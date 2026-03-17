
import { query } from './src/config/database';
async function run() {
    const res = await query(`
        SELECT tgname, pg_get_triggerdef(oid) as def
        FROM pg_trigger
        WHERE tgrelid = 'hms_card'::regclass
    `);
    res.rows.forEach(r => console.log(r.def));
    process.exit(0);
}
run();
