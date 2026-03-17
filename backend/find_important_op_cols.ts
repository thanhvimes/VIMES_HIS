
import { pool } from './src/config/database';

async function check() {
    const table = 'hms_operation';
    const important = ['docno', 'itemid', 'date', 'surgeon', 'anesthe', 'assistant', 'method', 'step', 'note', 'feeid'];
    const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
    const cols = r.rows.map(x => x.column_name);
    const found = cols.filter(c => important.some(i => c.toLowerCase().includes(i)));
    console.log("Found columns:", found);
    process.exit(0);
}
check();
