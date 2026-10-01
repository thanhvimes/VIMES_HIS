import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
    const { query } = await import('../src/config/database');
    const res = await query(`
        SELECT m.id, m.doc_no, m.patient_name, m.xml_data, m.signature, m.signature_status, m.signature_type, d.conclusion_data, d.clinical_data
        FROM health_check_masters m
        LEFT JOIN health_check_details d ON d.master_id = m.id
        WHERE d.conclusion_data::text ILIKE '%patuan%'
           OR d.conclusion_data::text ILIKE '%Phạm Anh Tuấn%'
           OR d.clinical_data::text ILIKE '%patuan%'
           OR d.clinical_data::text ILIKE '%Phạm Anh Tuấn%'
           OR m.xml_data ILIKE '%patuan%'
        ORDER BY m.id DESC
        LIMIT 5
    `);

    console.log('Total matches found:', res.rows.length);
    for (const r of res.rows) {
        console.log('\n=============================================================');
        console.log('ID:', r.id, '| DocNo:', r.doc_no, '| Patient:', r.patient_name);
        console.log('signature_status:', r.signature_status, '| signature_type:', r.signature_type);
        console.log('signature column:', r.signature);
        console.log('conclusion_data:', JSON.stringify(r.conclusion_data, null, 2));
        const matchCks = r.xml_data ? r.xml_data.match(/<CKS_NGUOI_KET_LUAN>([\s\S]*?)<\/CKS_NGUOI_KET_LUAN>/) : null;
        console.log('XML CKS_NGUOI_KET_LUAN:', matchCks ? matchCks[1] : 'NOT FOUND');
    }
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
