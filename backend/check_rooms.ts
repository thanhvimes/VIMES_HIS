
import { query } from './src/config/database';
async function run() {
    const res = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%setting%' OR table_name LIKE '%config%' OR table_name LIKE '%param%')");
    console.log(res.rows);
    process.exit(0);
}
run();
