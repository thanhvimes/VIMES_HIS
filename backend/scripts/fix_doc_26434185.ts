import { query, pool } from '../src/config/database';

async function fixDoc() {
    console.log('🚀 Updating document 26434185 address and XML...');
    
    // 1. Get current document
    const masterRes = await query('SELECT id, doc_no, patient_name, xml_data FROM health_check_masters WHERE doc_no = $1', ['26434185']);
    if (masterRes.rows.length === 0) {
        console.error('❌ Document 26434185 not found!');
        await pool.end();
        return;
    }
    const doc = masterRes.rows[0];
    const docId = doc.id;

    // 2. Update clinical_data in health_check_details
    const detailRes = await query('SELECT clinical_data FROM health_check_details WHERE master_id = $1', [docId]);
    const clinical = detailRes.rows[0]?.clinical_data || {};
    
    clinical.address = 'Phường Nam Hoa Lư, Ninh Bình';
    await query(
        'UPDATE health_check_details SET clinical_data = $1 WHERE master_id = $2',
        [JSON.stringify(clinical), docId]
    );
    console.log('✅ Updated health_check_details.clinical_data.address to "Phường Nam Hoa Lư, Ninh Bình"');

    // 3. Update xml_data in health_check_masters
    let xml = doc.xml_data || '';
    if (xml.includes('<DIA_CHI>')) {
        xml = xml.replace(/<DIA_CHI>(.*?)<\/DIA_CHI>/g, '<DIA_CHI>Phường Nam Hoa Lư, Ninh Bình</DIA_CHI>');
    } else if (xml.includes('</THONG_TIN_HANH_CHINH>')) {
        xml = xml.replace('</THONG_TIN_HANH_CHINH>', '\t<DIA_CHI>Phường Nam Hoa Lư, Ninh Bình</DIA_CHI>\n\t\t\t\t\t\t</THONG_TIN_HANH_CHINH>');
    }

    // Reset status to Pending and clear error_message
    await query(
        "UPDATE health_check_masters SET xml_data = $1, send_status = 'Pending', error_message = NULL, updated_at = NOW() WHERE id = $2",
        [xml, docId]
    );
    console.log('✅ Updated health_check_masters xml_data and reset send_status to Pending with cleared error');

    // 4. Verify updated state
    const verifyM = await query('SELECT id, doc_no, send_status, error_message FROM health_check_masters WHERE id = $1', [docId]);
    console.log('Verify Master:', verifyM.rows[0]);
    const verifyD = await query('SELECT clinical_data->>\'address\' as address FROM health_check_details WHERE master_id = $1', [docId]);
    console.log('Verify Detail address:', verifyD.rows[0]);

    await pool.end();
}

fixDoc().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
