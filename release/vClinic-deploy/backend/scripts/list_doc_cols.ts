
import { query } from './src/config/database';

async function check() {
    try {
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'hms_doc' 
            ORDER BY column_name
        `);
        console.log('ALL columns in hms_doc:');
        res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

check();
