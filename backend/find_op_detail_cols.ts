
import { pool } from './src/config/database';

async function check() {
    const table = 'hms_operation';
    const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
    const cols = r.rows.map(x => x.column_name);
    const filters = ['desc', 'step', 'method', 'note', 'tool', 'instrument', 'drug', 'mat', 'result'];
    const found = cols.filter(c => filters.some(f => c.toLowerCase().includes(f)));
    console.log("Details columns:", found);
    process.exit(0);
}
check();
