
import { query } from '../src/config/database';

async function testSameRoomDuplicate() {
    const testCid = '999888777666';
    const testUser = 'tester_bot';

    try {
        console.log('--- TESTING DUPLICATE CHECK IN SAME ROOM ---');

        // Cleanup
        await query('DELETE FROM hms_exam WHERE he_patientno IN (SELECT hp_patientno FROM hms_patient WHERE hp_sin = $1)', [testCid]);
        await query('DELETE FROM hms_doc WHERE hd_patientno IN (SELECT hp_patientno FROM hms_patient WHERE hp_sin = $1)', [testCid]);
        await query('DELETE FROM hms_patient WHERE hp_sin = $1', [testCid]);

        const r = await query('SELECT hrl_id, hrl_deptid FROM hms_roomlist LIMIT 1');
        const r1 = r.rows[0];

        console.log('\n[STEP 1] Creating initial exam...');
        const p1 = {
            mode: 'ADD_PATIENT',
            currentUser: testUser,
            patient: { sin: testCid, surname: 'DUPE', midName: 'TEST', firstName: 'SAME', birthDate: '1990-01-01', sex: 'M' },
            doc: { telephone: '0987654321', objectId: 7, admitDept: r1.hrl_deptid },
            card: { cardNo: '' },
            exam: { roomId: r1.hrl_id, deptId: r1.hrl_deptid, examType: 'E01' }
        };
        const d1 = (await query('SELECT hms_register_patient_v2($1::jsonb) as data', [JSON.stringify(p1)])).rows[0].data;
        console.log('✔ Initial registration success.');

        // 2. Try to add SAME room in SAME dept
        console.log('\n[STEP 2] Attempting to add SAME ROOM in SAME DEPT again...');
        const p2 = {
            mode: 'ADD_EXAM',
            currentUser: testUser,
            patient: { patientNo: d1.patientNo },
            doc: { docNo: d1.docNo },
            card: { cardNo: '' },
            exam: { roomId: r1.hrl_id, deptId: r1.hrl_deptid, examType: 'E01' }
        };
        
        try {
            await query('SELECT hms_register_patient_v2($1::jsonb) as data', [JSON.stringify(p2)]);
            console.error('❌ FAIL: System allowed duplicate room in same dept!');
            process.exit(1);
        } catch (err: any) {
            console.log('✔ Correctly caught error:', err.message);
            if (err.message.includes('Đã có phiếu khám tại phòng này hôm nay')) {
                console.log('✅ PASS: Protection works correctly.');
            } else {
                console.error('❌ FAIL: Wrong error message caught.');
                process.exit(1);
            }
        }

        process.exit(0);
    } catch (err: any) {
        console.error('FAILED:', err.message);
        process.exit(1);
    }
}
testSameRoomDuplicate();
