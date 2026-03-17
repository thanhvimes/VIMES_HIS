
import { pool } from './src/config/database';

async function check() {
    const tables = ['pcms_order', 'pcms_order_line'];
    for (const table of tables) {
        const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
        console.log(`${table}:`, r.rows.map(x => x.column_name).join(', '));
    }
    process.exit(0);
}
check();
