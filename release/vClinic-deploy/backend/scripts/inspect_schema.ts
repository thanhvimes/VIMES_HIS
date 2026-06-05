
import { query } from '../src/config/database';

async function inspect() {
    try {
        const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hms_object'");
        console.log('--- Columns in hms_object ---');
        res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
