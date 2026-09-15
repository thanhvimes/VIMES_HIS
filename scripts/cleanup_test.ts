
import { query } from '../src/config/database';

async function cleanup() {
    console.log('🧹 CLEANING UP UNIT TEST DATA...');
    try {
        await query("DELETE FROM hms_exam WHERE he_createdby = 'unit_tester'");
        await query("DELETE FROM hms_doc WHERE hd_createdby = 'unit_tester'");
        await query("DELETE FROM hms_patient WHERE hp_createdby = 'unit_tester'");
        console.log('✅ Clean up finished');
    } catch (err) {
        console.error('❌ Clean up error:', err);
    }
    process.exit(0);
}

cleanup();
