
import { pool } from './src/config/database';

async function check() {
    const table = 'hms_feelist_line';
    const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
    console.log("Columns:", JSON.stringify(cols.rows.map(x => x.column_name).sort(), null, 2));
    
    const sample = await pool.query(`SELECT * FROM ${table} LIMIT 1`);
    console.log("Sample row:", JSON.stringify(sample.rows[0], null, 2));
    process.exit(0);
}
check();
