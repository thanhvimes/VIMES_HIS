import { query } from '../src/config/database';

async function verify() {
    const res = await query(`
        SELECT id, doc_no, patient_name, xml_data 
        FROM health_check_masters 
        WHERE patient_name = 'ĐẶNG TIẾN DŨNG' 
        ORDER BY id DESC 
        LIMIT 1
    `);
    if (res.rows.length > 0) {
        console.log('--- XML CỦA BỆNH NHÂN: ' + res.rows[0].patient_name + ' ---');
        console.log(res.rows[0].xml_data.substring(0, 800) + '\n...\n' + res.rows[0].xml_data.substring(res.rows[0].xml_data.length - 400));
    }
    process.exit(0);
}

verify();
