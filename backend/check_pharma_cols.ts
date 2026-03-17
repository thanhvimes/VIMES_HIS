
import { pool } from './src/config/database';

async function check() {
    const tables = ['hms_pharmaorder', 'hms_pharmaorderline'];
    for (const table of tables) {
        try {
            const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
            console.log(`${table}:`, r.rows.map(x => x.column_name).join(', '));
        } catch (e) {
            console.error(`Error checking ${table}:`, e.message);
        }
    }
    process.exit(0);
}
check();
