
import { query } from './src/config/database';
async function run() {
    const res = await query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'hms_doc' AND column_name = 'hd_object'");
    console.log(res.rows[0]);
    process.exit(0);
}
run();
