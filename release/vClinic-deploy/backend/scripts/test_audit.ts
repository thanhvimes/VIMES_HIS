
import { pool } from '../src/config/database';
import AuditUtils from '../src/utils/audit';

async function testAudit() {
    console.log('🚀 TESTING Audit Log system...\n');
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. Set Context
        console.log('🔹 Setting Session Context (User: auditor, Module: TEST_MODULE)');
        await AuditUtils.setContext(client, 'auditor_test', '192.168.1.10', 'INTEGRATION_TEST');

        // 2. Perform INSERT on hms_patient (mượn bảng để test)
        console.log('🔹 Performing INSERT...');
        const insRes = await client.query(`
            INSERT INTO hms_patient (hp_surname, hp_firstname, hp_sex, hp_createdby)
            VALUES ('LOG', 'TESTER', 'M', 'system')
            RETURNING hp_patientno
        `);
        const pNo = insRes.rows[0].hp_patientno;

        // 3. Perform UPDATE
        console.log('🔹 Performing UPDATE...');
        await client.query(`
            UPDATE hms_patient 
            SET hp_firstname = 'TESTER_UPDATED', hp_midname = 'MODIFIED'
            WHERE hp_patientno = $1
        `, [pNo]);

        // 4. Perform DELETE
        console.log('🔹 Performing DELETE...');
        await client.query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [pNo]);

        await client.query('COMMIT');
        console.log('✅ Changes committed.\n');

        // 5. Verify sys_audit_log
        console.log('📊 CHECKING sys_audit_log:');
        const logs = await pool.query(`
            SELECT action, table_name, record_id, changed_fields, user_id, context_module 
            FROM sys_audit_log 
            WHERE user_id = 'auditor_test'
            ORDER BY id ASC
        `);

        logs.rows.forEach(log => {
            const actionText = log.action === 'I' ? 'INSERT' : (log.action === 'U' ? 'UPDATE' : 'DELETE');
            console.log(`- [${actionText}] Table: ${log.table_name}, ID: ${log.record_id}, Module: ${log.context_module}`);
            if (log.action === 'U') {
                console.log(`  Fields changed: ${JSON.stringify(log.changed_fields)}`);
            }
        });

    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error('❌ Test failed:', err.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

testAudit();
