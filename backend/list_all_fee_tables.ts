
import { pool } from './src/config/database';

async function check() {
    const r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'hms_fee%'");
    const tables = r.rows.map(x => x.table_name).sort();
    console.log("Tables:", JSON.stringify(tables, null, 2));
    process.exit(0);
}
check();
