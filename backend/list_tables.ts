
import { pool } from './src/config/database';

async function list() {
    const r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log(r.rows.map(x => x.table_name).join(', '));
    process.exit(0);
}
list();
