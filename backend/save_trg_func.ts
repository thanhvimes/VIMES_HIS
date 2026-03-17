
import { query } from './src/config/database';
import * as fs from 'fs';

async function run() {
    try {
        const res = await query("SELECT pg_get_functiondef('hms_card_trg_proc'::regproc)");
        fs.writeFileSync('trg_func_raw.sql', res.rows[0].pg_get_functiondef);
        console.log("Success: Function definition saved to trg_func_raw.sql");
        process.exit(0);
    } catch (e: any) {
        console.error("Fail:", e.message);
        process.exit(1);
    }
}
run();
