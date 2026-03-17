
import { query } from './src/config/database';
async function run() {
    const res = await query(`
        SELECT table_name, column_name, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_name IN ('hms_patient', 'hms_doc', 'hms_exam', 'hms_card')
        AND (character_maximum_length < 10 OR column_name LIKE '%id')
    `);
    res.rows.forEach(r => console.log(`${r.table_name}.${r.column_name}: ${r.character_maximum_length}`));
    process.exit(0);
}
run();
