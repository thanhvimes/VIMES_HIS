
import { pool } from './src/config/database';

async function check() {
    const r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'hms_%' OR table_name LIKE 'pcms_%') ORDER BY table_name");
    r.rows.forEach(x => console.log(x.table_name));
    process.exit(0);
}
check();
