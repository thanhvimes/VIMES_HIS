import { sendDocumentsToVNeID } from './src/services/health-check-sync.service';
import { query } from './src/config/database';

async function testPushTwoMasters() {
    try {
        const docIds = ['2252', '2251'];
        console.log(`🚀 Triggering sendDocumentsToVNeID for doc IDs: ${docIds.join(', ')}...`);

        const failedIds = await sendDocumentsToVNeID(docIds);
        console.log('🏁 Result failedIds:', failedIds);

        // Fetch logs for these two documents
        const res = await query(`
            SELECT id, doc_no, patient_name, send_status, error_message, vneid_response, response_log, updated_at
            FROM health_check_masters
            WHERE id IN (2252, 2251)
        `);
        console.log('📋 Updated status in DB:');
        console.dir(res.rows, { depth: null });

        process.exit(0);
    } catch (e: any) {
        console.error('❌ Error in test script:', e.stack || e.message);
        process.exit(1);
    }
}

testPushTwoMasters();
