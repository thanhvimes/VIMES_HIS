import { query } from './src/config/database';

async function compareXml() {
    try {
        const postmanRes = await query(`SELECT xml_data FROM health_check_masters WHERE doc_no = 'POSTMAN_TEST_RECORD'`);
        const doc2252Res = await query(`SELECT xml_data FROM health_check_masters WHERE id = 2252`);

        console.log('--- POSTMAN XML ---');
        console.log(postmanRes.rows[0]?.xml_data?.substring(0, 2000));

        console.log('\n--- DOC 2252 XML ---');
        console.log(doc2252Res.rows[0]?.xml_data?.substring(0, 2000));

        process.exit(0);
    } catch (e: any) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

compareXml();
