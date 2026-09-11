import dotenv from 'dotenv';
dotenv.config({ path: 'd:/AI/vClinic/backend/.env' });
import { query } from 'd:/AI/vClinic/backend/src/config/database';

async function run() {
    const col = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'hms_patient' AND column_name IN ('hp_patientno', 'hp_patientid')
    `);
    console.log('Columns in vClinic:', col.rows);

    const docCol = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'health_check_masters' AND column_name = 'dob'
    `);
    console.log('dob in health_check_masters:', docCol.rows);

    process.exit(0);
}
run();
