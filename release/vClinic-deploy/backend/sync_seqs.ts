
import { query } from './src/config/database';

async function sync() {
    try {
        console.log("Syncing sequences...");
        
        // hms_patient
        await query(`SELECT setval('hms_patient_hp_patientno_seq', COALESCE((SELECT MAX(hp_patientno) FROM hms_patient), 0) + 1, false)`);
        
        // hms_doc
        await query(`SELECT setval('hms_doc_hd_docno_seq', COALESCE((SELECT MAX(hd_docno) FROM hms_doc), 0) + 1, false)`);
        
        // hms_card
        await query(`SELECT setval('hms_card_hc_idx_seq', COALESCE((SELECT MAX(hc_idx) FROM hms_card), 0) + 1, false)`);
        
        // hms_exam receptidx
        await query(`SELECT setval('hms_exam_he_receptidx_asq', COALESCE((SELECT MAX(he_receptidx) FROM hms_exam), 0) + 1, false)`);
        
        console.log("Success: Sequences synced.");
        process.exit(0);
    } catch (e: any) {
        console.error("Fail:", e.message);
        process.exit(1);
    }
}
sync();
