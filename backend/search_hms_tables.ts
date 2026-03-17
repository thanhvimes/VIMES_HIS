
import { pool } from './src/config/database';

async function check() {
    const r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'hms_%' OR table_name LIKE 'pcms_%') ORDER BY table_name");
    console.log("Tables found:", r.rows.map(x => x.table_name).join(', '));
    process.exit(0);
}
check();
