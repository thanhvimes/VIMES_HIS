
import { query } from '../src/config/database';
async function run() {
    const res = await query(`
        SELECT table_name, column_name, character_maximum_length, data_type 
        FROM information_schema.columns 
        WHERE column_name IN ('hp_createdby', 'hd_createdby', 'he_createdby', 'hc_createdby')
          AND table_name LIKE 'hms_%'
    `);
    console.log(res.rows);
    process.exit(0);
}
run();
