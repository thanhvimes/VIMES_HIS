
import { pool } from './src/config/database';

async function check() {
    const table = 'hms_fee_invoiceline';
    const r = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
    `);
    const cols = r.rows.map(x => x.column_name).sort();
    console.log(`${table} columns count:`, cols.length);
    console.log(`${table} columns prefix:`, Array.from(new Set(cols.map(c => c.split('_')[0]))));
    console.log(`${table} key columns:`, cols.filter(c => c.includes('doc') || c.includes('item') || c.includes('idx') || c.includes('amt') || c.includes('price') || c.includes('qty') || c.includes('name') || c.includes('ins')));
    process.exit(0);
}
check();
