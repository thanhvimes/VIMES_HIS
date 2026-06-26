import { query } from './config/database';
import fs from 'fs';
import path from 'path';

async function run() {
    try {
        const columns = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hms_quoctich'`);
        const samples = await query(`SELECT * FROM hms_quoctich LIMIT 2`);
        const vn = await query(`SELECT * FROM hms_quoctich WHERE hq_name ILIKE '%Việt Nam%' OR hq_name ILIKE '%Vietnam%'`);
        const out = {
            columns: columns.rows,
            samples: samples.rows,
            vn: vn.rows
        };
        fs.writeFileSync(path.join(__dirname, 'quoctich_meta.json'), JSON.stringify(out, null, 2));
        console.log("SUCCESS_META");
    } catch (e: any) {
        console.error("Error:", e);
    }
}
run();
