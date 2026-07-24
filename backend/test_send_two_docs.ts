import { query } from './src/config/database';
import { vneidSyncService } from './src/services/vneidSyncService';

async function testSendTwoDocs() {
    try {
        const docNos = [26292435, 26292434];
        console.log(`🚀 Start testing sync for 2 records: ${docNos.join(', ')}`);

        for (const docNo of docNos) {
            console.log(`\n==============================================`);
            console.log(`📡 Processing doc_no: ${docNo}`);
            
            // Check patient info in HIS
            const docRes = await query(`
                SELECT d.hd_docno, d.hd_patientno, trim(p.hp_surname||' '||p.hp_midname||' '||p.hp_firstname) as patient_name,
                       p.hp_idcardno, d.hd_telephone, p.hp_dt_didong
                FROM hms_doc d
                JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
                WHERE d.hd_docno = $1
            `, [docNo]);
            
            console.log('Patient Info in DB:', docRes.rows[0]);

            // Call vneidSyncService.syncDocumentToVneid(docNo)
            const result = await vneidSyncService.syncDocumentToVneid(docNo);
            console.log(`📊 Sync Result for ${docNo}:`, JSON.stringify(result, null, 2));
        }

        process.exit(0);
    } catch (e: any) {
        console.error('❌ Error testing sync:', e.stack || e.message);
        process.exit(1);
    }
}

testSendTwoDocs();
