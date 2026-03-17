
import { query } from './src/config/database';
async function run() {
    const res = await query("SELECT relname FROM pg_class WHERE relkind = 'S' AND relname ILIKE '%card%'");
    console.log("Card related sequences:");
    console.log(res.rows);
    process.exit(0);
}
run();
