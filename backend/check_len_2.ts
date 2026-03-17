
import { query } from './src/config/database';
async function run() {
    const res = await query(`
        SELECT table_name, column_name, character_maximum_length 
        FROM information_schema.columns 
        WHERE (table_name = 'hms_card' AND column_name = 'hc_cardno')
        OR (table_name = 'hms_patient' AND column_name = 'hp_surname')
    `);
    res.rows.forEach(r => console.log(`${r.table_name}.${r.column_name}: ${r.character_maximum_length}`));
    process.exit(0);
}
run();
