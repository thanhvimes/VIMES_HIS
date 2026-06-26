import { query } from '../src/config/database';

async function check() {
    try {
        const res = await query(`
            SELECT hd_doctor, hms_getusername(hd_doctor) as full_name
            FROM hms_doc 
            WHERE hd_doctor IS NOT NULL AND hd_doctor <> ''
            LIMIT 5
        `);
        console.table(res.rows);
    } catch (e: any) {
        console.error(e.message);
    }
    process.exit(0);
}

check();
