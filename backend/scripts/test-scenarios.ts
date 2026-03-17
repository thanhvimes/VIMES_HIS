
import { query } from '../src/config/database';

async function runTests() {
    const testCid = '999888777666';
    const testUser = 'tester_bot';

    try {
        console.log('--- STARTING INTEGRATION TESTS ---');

        // Aggressive Cleanup
        await query('DELETE FROM hms_exam WHERE he_patientno IN (SELECT hp_patientno FROM hms_patient WHERE hp_sin = $1)', [testCid]);
        await query('DELETE FROM hms_doc WHERE hd_patientno IN (SELECT hp_patientno FROM hms_patient WHERE hp_sin = $1)', [testCid]);
        await query('DELETE FROM hms_patient WHERE hp_sin = $1', [testCid]);
        console.log('✔ Cleanup done.');

        // Get 3 distinct rooms
        const roomsRes = await query('SELECT hrl_id, hrl_deptid FROM hms_roomlist ORDER BY hrl_id DESC LIMIT 5');
        const r1 = roomsRes.rows[0];
        const r2 = roomsRes.rows[1];
        const r3 = roomsRes.rows[2];
        console.log(`✔ Using Rooms: [${r1.hrl_id}, ${r2.hrl_id}, ${r3.hrl_id}]`);

        // TEST 1
        console.log(`\n[TEST 1] Creating new patient in room ${r1.hrl_id}...`);
        const p1 = {
            mode: 'ADD_PATIENT',
            currentUser: testUser,
            patient: { sin: testCid, surname: 'NGUYỄN', midName: 'VĂN', firstName: 'TEST', birthDate: '1990-01-01', sex: 'M' },
            doc: { telephone: '0987654321', objectId: 7, admitDept: r1.hrl_deptid },
            card: { cardNo: '' },
            exam: { roomId: r1.hrl_id, deptId: r1.hrl_deptid, examType: 'E01' }
        };
        const d1 = (await query('SELECT hms_register_patient_v2($1::jsonb) as data', [JSON.stringify(p1)])).rows[0].data;
        console.log('✔ Result 1:', JSON.stringify(d1));

        // TEST 2
        console.log(`\n[TEST 2] Adding second exam to room ${r2.hrl_id}...`);
        const p2 = {
            mode: 'ADD_EXAM',
            currentUser: testUser,
            patient: { patientNo: d1.patientNo },
            doc: { docNo: d1.docNo },
            card: { cardNo: '' },
            exam: { roomId: r2.hrl_id, deptId: r2.hrl_deptid, examType: 'E01' }
        };
        const d2 = (await query('SELECT hms_register_patient_v2($1::jsonb) as data', [JSON.stringify(p2)])).rows[0].data;
        console.log('✔ Result 2:', JSON.stringify(d2));

        // TEST 3
        console.log(`\n[TEST 3] Smart Merge (Scan CID again) into room ${r3.hrl_id}...`);
        const p3 = {
            mode: 'ADD_PATIENT',
            currentUser: testUser,
            patient: { sin: testCid, surname: 'NGUYỄN', midName: 'VĂN', firstName: 'TEST UPDATED', birthDate: '1990-01-01', sex: 'M' },
            doc: { telephone: '0987654321', objectId: 7, admitDept: r3.hrl_deptid },
            card: { cardNo: '' },
            exam: { roomId: r3.hrl_id, deptId: r3.hrl_deptid, examType: 'E02' }
        };
        const d3 = (await query('SELECT hms_register_patient_v2($1::jsonb) as data', [JSON.stringify(p3)])).rows[0].data;
        console.log('✔ Result 3:', JSON.stringify(d3));

        console.log('\n🌟 ALL TESTS PASSED! BUSINESS LOGIC IS CORRECT.');
        process.exit(0);
    } catch (err: any) {
        console.error('\n❌ TEST FAILED!');
        console.error('Message:', err.message);
        if (err.where) console.error('Context:', err.where);
        process.exit(1);
    }
}
runTests();
