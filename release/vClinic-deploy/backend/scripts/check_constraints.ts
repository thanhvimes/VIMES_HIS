
import { query } from '../src/config/database';

async function main() {
    try {
        const res = await query(`
            SELECT prosrc FROM pg_proc WHERE proname = 'hms_patient_trg_proc'
        `);
        const output = res.rows[0]?.prosrc || 'No function found';
        require('fs').writeFileSync('function_def.txt', output);
        console.log('Written to function_def.txt');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
