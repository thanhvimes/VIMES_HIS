
import { pool } from './src/config/database';

async function check() {
    const table = 'hms_operation';
    const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position`);
    const cols = r.rows.map(x => x.column_name);
    console.log(`Total columns: ${cols.length}`);
    for (let i = 0; i < cols.length; i += 5) {
        console.log(cols.slice(i, i + 5).join(', '));
    }
    process.exit(0);
}
check();
