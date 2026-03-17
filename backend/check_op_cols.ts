
import { pool } from './src/config/database';

async function check() {
    const table = 'hms_operation';
    const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
    console.log(`${table}:`, r.rows.map(x => x.column_name).join(', '));
    process.exit(0);
}
check();
