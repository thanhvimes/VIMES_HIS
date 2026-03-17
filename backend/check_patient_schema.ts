
import { query } from './src/config/database';
async function run() {
    const res = await query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'hms_patient'");
    res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}(${r.character_maximum_length})`));
    process.exit(0);
}
run();
