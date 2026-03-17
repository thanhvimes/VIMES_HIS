
import { query } from './src/config/database';

async function run() {
    console.log('\n--- hms_doc (hd_ columns) ---');
    const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hms_doc' AND column_name IN ('hd_docno', 'hd_patientno', 'hd_cardno', 'hd_object', 'hd_telephone', 'hd_contactaddr', 'hd_dtladdr')");
    res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
    process.exit(0);
}

run();
