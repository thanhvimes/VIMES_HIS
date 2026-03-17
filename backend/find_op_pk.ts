
import { pool } from './src/config/database';

async function check() {
    const table = 'hms_operation';
    const r = await pool.query(`
        SELECT a.attname 
        FROM pg_index i 
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) 
        WHERE i.indrelid = '${table}'::regclass AND i.indisprimary
    `);
    console.log("Primary Key:", r.rows.map(x => x.attname));
    process.exit(0);
}
check();
