
import { pool } from './src/config/database';

async function check() {
    const table = 'hms_fee_invoice_view_v2';
    const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
    const cols = r.rows.map(x => x.column_name).filter(c => c.startsWith('hfe')).sort();
    console.log("HFE Columns:", JSON.stringify(cols, null, 2));
    process.exit(0);
}
check();
