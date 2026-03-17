
import { pool } from './src/config/database';

async function check() {
    const tables = ['hms_testorder', 'hms_testorderline', 'hms_pacsorder', 'hms_pacsorderline'];
    for (const table of tables) {
        const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
        console.log(`${table}:`, r.rows.map(x => x.column_name).join(', '));
    }
    process.exit(0);
}
check();
