
import { pool } from './src/config/database';
import * as fs from 'fs';

async function dump() {
    const table = 'hms_operation';
    const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position`);
    fs.writeFileSync('hms_operation_cols.txt', r.rows.map(x => x.column_name).join('\n'));
    console.log("Dumped to hms_operation_cols.txt");
    process.exit(0);
}
dump();
