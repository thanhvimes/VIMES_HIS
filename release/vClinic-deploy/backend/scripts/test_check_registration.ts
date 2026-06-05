
import { query } from '../src/config/database';

async function testCheck() {
    console.log('🚀 TESTING hms_check_registration_v2...\n');

    const cases = [
        {
            name: 'Case 1: Thiếu roomId',
            payload: { mode: 'ADD_PATIENT', patient: { name: 'Test' }, exam: {} }
        },
        {
            name: 'Case 2: ADD_DOC với bệnh nhân không tồn tại',
            payload: { 
                mode: 'ADD_DOC', 
                patient: { patientNo: 999999 }, 
                exam: { roomId: 12, deptId: 'KBTN' } 
            }
        },
        {
            name: 'Case 3: Cảnh báo hồ sơ chưa kết thúc (ADD_DOC)',
            payload: { 
                mode: 'ADD_DOC', 
                patient: { patientNo: 251018893 }, 
                exam: { roomId: 12, deptId: 'KBTN' } 
            }
        }
    ];

    for (const c of cases) {
        console.log(`🔹 ${c.name}`);
        const res = await query(`SELECT hms_check_registration_v2($1::jsonb) as result`, [JSON.stringify(c.payload)]);
        console.log('Result:', JSON.stringify(res.rows[0].result, null, 2));
        console.log('--------------------------------------------------\n');
    }
    process.exit(0);
}

testCheck();
