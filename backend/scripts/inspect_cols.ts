import { pool } from '../src/config/database';

async function main() {
    const res = await pool.query(`
        SELECT column_name, data_type, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_name = 'hms_patient' 
        ORDER BY ordinal_position;
    `);
    console.log('Columns in hms_patient:');
    console.table(res.rows);
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
