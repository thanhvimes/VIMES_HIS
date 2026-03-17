
import { query } from './src/config/database';
async function run() {
    const res = await query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'hms_card'");
    console.log("hms_card columns:");
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
}
run();
