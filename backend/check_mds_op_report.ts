
import { pool } from './src/config/database';

async function check() {
    const table = 'mds_operation_report';
    const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
    console.log(`${table} columns:`, r.rows.map(x => x.column_name).join(', '));
    process.exit(0);
}
check();
