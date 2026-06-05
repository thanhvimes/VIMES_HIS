
import { query } from '../src/config/database';
async function run() {
    const testUser = 'unit_tester';
    const roomA = 12;
    const deptId = 'KBTN';
    const cardNo = 'BH' + Date.now();
    
    console.log('1. Register BN_A with card', cardNo);
    await query(`SELECT hms_register_patient_v2($1::jsonb)`, [JSON.stringify({
        mode: 'ADD_PATIENT',
        currentUser: testUser,
        patient: { surname: 'BN_A', firstName: 'Hold', sex: 'M', createdBy: testUser },
        doc: { objectId: 'I', admitDept: deptId, createdBy: testUser },
        card: { cardNo: cardNo },
        exam: { roomId: roomA, deptId: deptId, createdBy: testUser }
    })]);

    console.log('2. Trying to register BN_B with same card');
    try {
        await query(`SELECT hms_register_patient_v2($1::jsonb)`, [JSON.stringify({
            mode: 'ADD_PATIENT',
            currentUser: testUser,
            patient: { surname: 'BN_B', firstName: 'Steal', sex: 'F', createdBy: testUser },
            doc: { objectId: 'I', admitDept: deptId, createdBy: testUser },
            card: { cardNo: cardNo },
            exam: { roomId: roomA, deptId: deptId, createdBy: testUser }
        })]);
        console.log('❌ FAIL: Should have errored');
    } catch (err: any) {
        console.log('✅ Caught expected error:', err.message);
    }
    process.exit(0);
}
run();
