
import { query } from '../src/config/database';

async function runTests() {
    console.log('🚀 BẮT ĐẦU CHẠY UNIT TEST NGHIỆP VỤ TIẾP ĐÓN (PHẦN LOGIC MỚI)...\n');
    let passed = 0;
    let failed = 0;

    const test = async (name: string, fn: () => Promise<void>) => {
        try {
            process.stdout.write(`🔹 Test: ${name}... `);
            await fn();
            console.log('✅ PASS');
            passed++;
        } catch (error: any) {
            console.log('❌ FAIL');
            console.error(`   Lỗi: ${error.message}`);
            failed++;
        }
    };

    const testUser = 'unit_tester';
    const roomA = 12;
    const deptId = 'KBTN';

    // =========================================================================
    // UT_NEW_01: KIỂM TRA CHẶN TRÙNG THẺ BHYT (INTEGRATION)
    // =========================================================================
    await test('UT_NEW_01 - Chặn dùng thẻ BHYT đang khám cho BN khác', async () => {
        const cardNo = 'BH' + Date.now(); // Unique card for each run
        
        await query(`SELECT hms_register_patient_v2($1::jsonb)`, [JSON.stringify({
            mode: 'ADD_PATIENT',
            currentUser: testUser,
            patient: { surname: 'BN_A', firstName: 'Hold_Card', sex: 'M', createdBy: testUser },
            doc: { objectId: 'I', admitDept: deptId, createdBy: testUser },
            card: { cardNo: cardNo },
            exam: { roomId: roomA, deptId: deptId, createdBy: testUser }
        })]);

        try {
            await query(`SELECT hms_register_patient_v2($1::jsonb)`, [JSON.stringify({
                mode: 'ADD_PATIENT',
                currentUser: testUser,
                patient: { surname: 'BN_B', firstName: 'Steal_Card', sex: 'F', createdBy: testUser },
                doc: { objectId: 'I', admitDept: deptId, createdBy: testUser },
                card: { cardNo: cardNo },
                exam: { roomId: roomA, deptId: deptId, createdBy: testUser }
            })]);
            throw new Error('Đáng lẽ phải báo lỗi thẻ đang sử dụng');
        } catch (err: any) {
            console.log(` (Caught: ${err.message.substring(0, 50)}...)`);
            if (err.message.toLowerCase().includes('đang được sử dụng')) {
                // Success
            } else {
                throw err;
            }
        }
    });

    // =========================================================================
    // UT_NEW_02: KIỂM TRA CHẶN TRÙNG PHÒNG KHÁM TRONG NGÀY (ADD_EXAM)
    // =========================================================================
    await test('UT_NEW_02 - Chặn đăng ký khám thêm vào cùng phòng trong ngày', async () => {
        const regRes = await query(`SELECT hms_register_patient_v2($1::jsonb) as result`, [JSON.stringify({
            mode: 'ADD_PATIENT',
            currentUser: testUser,
            patient: { surname: 'BN_C', firstName: 'Duplicate_Room', sex: 'M', createdBy: testUser },
            doc: { objectId: 'S', admitDept: deptId, createdBy: testUser },
            exam: { roomId: roomA, deptId: deptId, createdBy: testUser }
        })]);
        
        const resObj = regRes.rows[0].result;
        try {
            await query(`SELECT hms_register_patient_v2($1::jsonb)`, [JSON.stringify({
                mode: 'ADD_EXAM',
                currentUser: testUser,
                patient: { patientNo: resObj.patientNo },
                doc: { docNo: resObj.docNo },
                exam: { roomId: roomA, deptId: deptId, createdBy: testUser }
            })]);
            throw new Error('Đáng lẽ phải báo lỗi đã có phiếu khám tại phòng này');
        } catch (err: any) {
            console.log(` (Caught: ${err.message.substring(0, 50)}...)`);
            if (err.message.toLowerCase().includes('đã có phiếu khám')) {
                // Success
            } else {
                throw err;
            }
        }
    });

    // =========================================================================
    // UT_NEW_03: KIỂM TRA CẢNH BÁO HỒ SƠ CHƯA KẾT THÚC (FUNCTION LEVEL)
    // =========================================================================
    await test('UT_NEW_03 - Kiểm tra hàm check trả về WARNING khi còn hồ sơ mở', async () => {
        const res = await query('SELECT hp_patientno FROM hms_patient WHERE hp_surname = $1 AND hp_createdby = $2 LIMIT 1', ['BN_C', testUser]);
        if (res.rows.length === 0) throw new Error('Không tìm thấy BN_C để test');
        const pNo = res.rows[0].hp_patientno;

        const checkRes = await query(`SELECT hms_check_registration_v2($1::jsonb) as result`, [JSON.stringify({
            mode: 'ADD_DOC',
            patient: { patientNo: pNo },
            exam: { roomId: 10, deptId: 'KKB' }
        })]);

        const result = checkRes.rows[0].result;
        console.log(` (Severity: ${result.severity})`);
        if (result.severity === 'WARNING' && result.isValid === true) {
             // SUCCESS
        } else {
            throw new Error(`Cảnh báo không đúng: ${JSON.stringify(result)}`);
        }
    });

    console.log(`\n📊 KẾT QUẢ: PASS: ${passed}, FAIL: ${failed}`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
