
import { pool } from '../config/database';

async function listAllTables() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name LIKE 'qms_%'
        `);
        console.log('Tables with qms_ prefix:');
        res.rows.forEach(r => console.log(`- ${r.table_name}`));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
listAllTables();
