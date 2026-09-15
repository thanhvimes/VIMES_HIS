
import { query } from '../src/config/database';
async function run() {
    const res = await query('SELECT hp_patientno FROM hms_patient LIMIT 1');
    console.log('Valid patientNo:', res.rows[0]?.hp_patientno);
    process.exit(0);
}
run();
