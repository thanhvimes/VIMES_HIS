
import { query, pool } from '../src/config/database';

async function verifyAuditIntegration() {
    console.log('🚀 VERIFYING Audit Log Integration in Registration Procedure...\n');
    
    const testUser = 'tester_audit';
    const payload = {
        mode: 'ADD_PATIENT',
        currentUser: testUser,
        patient: { surname: 'AUDIT', firstName: 'INTEGRATED', sex: 'F' },
        doc: { objectId: 'S' },
        exam: { roomId: 12, deptId: 'KBTN' }
    };

    console.log('🔹 Calling hms_register_patient_v2...');
    const res = await query(`SELECT hms_register_patient_v2($1::jsonb) as result`, [JSON.stringify(payload)]);
    const pNo = res.rows[0].result.patientNo;

    console.log('📊 Checking sys_audit_log for this action:');
    const logs = await query(`
        SELECT action, table_name, user_id, context_module 
        FROM sys_audit_log 
        WHERE user_id = $1
        ORDER BY id ASC
    `, [testUser]);

    if (logs.rows.length >= 3) {
        console.log('✅ Success! Logs found for Patient, Doc, and Exam.');
        logs.rows.forEach(l => console.log(`- [${l.action}] ${l.table_name} by ${l.user_id} (${l.context_module})`));
    } else {
        console.error('❌ Fail: Audit logs not found or incomplete.');
    }

    // Cleanup
    await query("DELETE FROM hms_exam WHERE he_createdby = $1", [testUser]);
    await query("DELETE FROM hms_doc WHERE hd_createdby = $1", [testUser]);
    await query("DELETE FROM hms_patient WHERE hp_createdby = $1", [testUser]);
    
    process.exit(0);
}

verifyAuditIntegration();
