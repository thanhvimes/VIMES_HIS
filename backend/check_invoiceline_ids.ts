
import { pool } from './src/config/database';

async function check() {
    const table = 'hms_fee_invoiceline';
    const r = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table}' 
        AND (column_name LIKE '%doc%' OR column_name LIKE '%idx%' OR column_name LIKE '%price%' OR column_name LIKE '%qty%' OR column_name LIKE '%amt%')
    `);
    console.log(`${table} columns:`, r.rows.map(x => x.column_name));
    process.exit(0);
}
check();
