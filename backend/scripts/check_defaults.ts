
import { query } from '../src/config/database';

async function main() {
    try {
        const res = await query(`
            SELECT column_name, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'hms_patient' 
            AND column_default IS NOT NULL
        `);
        console.log('--- Columns with Defaults in hms_patient ---');
        res.rows.forEach(r => console.log(`${r.column_name}: ${r.column_default}`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
