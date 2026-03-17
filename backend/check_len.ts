
import { query } from './src/config/database';
async function run() {
    const res = await query("SELECT column_name, character_maximum_length FROM information_schema.columns WHERE table_name = 'hms_patient' AND column_name IN ('hp_surname', 'hp_midname', 'hp_firstname')");
    console.log(res.rows);
    process.exit(0);
}
run();
