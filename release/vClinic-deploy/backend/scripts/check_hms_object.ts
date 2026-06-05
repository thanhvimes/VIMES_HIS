
import { query } from '../src/config/database';

async function check() {
    try {
        const res = await query("SELECT ho_id, ho_desc, ho_type FROM hms_object ORDER BY ho_id");
        console.log('--- Data in hms_object ---');
        res.rows.forEach(r => console.log(`${r.ho_id} | ${r.ho_desc} | ${r.ho_type}`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
