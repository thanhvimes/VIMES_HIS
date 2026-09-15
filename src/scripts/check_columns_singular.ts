
import { pool } from '../config/database';

async function checkSchemaSingular() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'qms_patient'
        `);
        console.log('Columns in qms_patient (singular):');
        res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkSchemaSingular();
