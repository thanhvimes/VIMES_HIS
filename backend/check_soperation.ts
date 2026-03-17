
import { pool } from './src/config/database';

async function check() {
    const table = 'hms_soperation';
    const r = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_name = '${table}'`);
    if (r.rows.length > 0) {
        console.log(`Table ${table} exists.`);
        const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
        console.log("Columns:", cols.rows.map(x => x.column_name).join(', '));
    } else {
        console.log(`Table ${table} does NOT exist.`);
    }
    process.exit(0);
}
check();
