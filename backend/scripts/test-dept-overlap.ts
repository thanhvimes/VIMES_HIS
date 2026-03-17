
import { query } from '../src/config/database';

async function testDeptOverlap() {
    const testCid = '999888777666';
    const testUser = 'tester_bot';

    try {
        console.log('--- TESTING DUPLICATE CHECK WITH DEPT OVERLAP ---');

        // Cleanup
        await query('DELETE FROM hms_exam WHERE he_patientno IN (SELECT hp_patientno FROM hms_patient WHERE hp_sin = $1)', [testCid]);
        await query('DELETE FROM hms_doc WHERE hd_patientno IN (SELECT hp_patientno FROM hms_patient WHERE hp_sin = $1)', [testCid]);
        await query('DELETE FROM hms_patient WHERE hp_sin = $1', [testCid]);

        // Find 2 different departments that use the same Room ID (Common in this DB)
        // From my previous count, Room ID 8 has 42 entries.
        const rooms = await query(`
            SELECT hrl_id, hrl_deptid 
            FROM hms_roomlist 
            WHERE hrl_id = 8 
            ORDER BY hrl_deptid ASC 
            LIMIT 2
        `);
        if (rooms.rows.length < 2) {
            console.error('Could not find overlapping room IDs for test.');
            process.exit(1);
        }
        const r1 = rooms.rows[0];
        const r2 = rooms.rows[1];
        console.log(`Test Rooms: Room ${r1.hrl_id} in Dept ${r1.hrl_deptid} AND Room ${r2.hrl_id} in Dept ${r2.hrl_deptid}`);

        // 1. Create first exam
        console.log('\n[STEP 1] Creating first exam...');
        const p1 = {
            mode: 'ADD_PATIENT',
            currentUser: testUser,
            patient: { sin: testCid, surname: 'DEPT', midName: 'OVERLAP', firstName: 'TEST', birthDate: '1990-01-01', sex: 'M' },
            doc: { telephone: '0987654321', objectId: 7, admitDept: r1.hrl_deptid },
            card: { cardNo: '' },
            exam: { roomId: r1.hrl_id, deptId: r1.hrl_deptid, examType: 'E01' }
        };
        const d1 = (await query('SELECT hms_register_patient_v2($1::jsonb) as data', [JSON.stringify(p1)])).rows[0].data;
        console.log('✔ Initial registration success.');

        // 2. Add second exam in ANOTHER dept but SAME room id
        console.log('\n[STEP 2] Adding second exam in different dept but SAME room id...');
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

        console.log('\n✅ PASS: Successfully added exams with same Room ID across different Departments.');
        process.exit(0);
    } catch (err: any) {
        console.error('FAILED:', err.message);
        process.exit(1);
    }
}
testDeptOverlap();
