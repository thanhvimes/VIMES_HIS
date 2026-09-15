
import { query } from './src/config/database';

async function check() {
    try {
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'hms_doc' 
            AND column_name LIKE '%object%'
        `);
        console.log('Columns matching "object" in hms_doc:');
        console.log(JSON.stringify(res.rows, null, 2));

        const objRes = await query('SELECT ho_id, ho_desc, ho_type FROM hms_object');
        console.log('\nContent of hms_object:');
        console.log(JSON.stringify(objRes.rows, null, 2));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

check();
