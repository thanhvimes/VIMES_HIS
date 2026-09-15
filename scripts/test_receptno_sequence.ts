import { pool } from '../src/config/database';

async function runTest() {
    console.log('🧪 BẮT ĐẦU KIỂM THỬ TÍNH TOÁN SỐ THỨ TỰ KHÁM (he_receptno)...\n');
    const client = await pool.connect();
    const testRoomId = 997;
    const testDeptId = 'KB';

    try {
        // Dọn dẹp dữ liệu test cũ phòng 997 ngày hôm nay
        await client.query(`
            DELETE FROM hms_exam WHERE he_roomid = $1 AND DATE(he_examdate) = CURRENT_DATE;
        `, [testRoomId]);

        // 1. Đăng ký Bệnh nhân 1 (Quầy tiếp đón)
        const p1Payload = {
            patient: { fullName: 'TEST NGUYEN VAN A', sex: 'M', birthDate: '1990-01-01', identityNo: '999000000001', phone: '0900000001' },
            doc: { objectId: '7' },
            exam: { deptId: testDeptId, roomId: testRoomId.toString() }
        };
        const res1 = await client.query(`SELECT hms_register_patient_v2($1::jsonb) as res`, [JSON.stringify(p1Payload)]);
        const r1 = res1.rows[0].res;
        console.log(`✅ BN 1 (Quầy): DocNo=${r1.docNo}, ReceptNo=${r1.receptNo}`);
        if (r1.receptNo !== 1) throw new Error(`Mong đợi STT 1 nhưng nhận được ${r1.receptNo}`);

        // 2. Đăng ký Bệnh nhân 2 (Quầy tiếp đón)
        const p2Payload = {
            patient: { fullName: 'TEST TRAN THI B', sex: 'F', birthDate: '1992-05-10', identityNo: '999000000002', phone: '0900000002' },
            doc: { objectId: '7' },
            exam: { deptId: testDeptId, roomId: testRoomId.toString() }
        };
        const res2 = await client.query(`SELECT hms_register_patient_v2($1::jsonb) as res`, [JSON.stringify(p2Payload)]);
        const r2 = res2.rows[0].res;
        console.log(`✅ BN 2 (Quầy): DocNo=${r2.docNo}, ReceptNo=${r2.receptNo}`);
        if (r2.receptNo !== 2) throw new Error(`Mong đợi STT 2 nhưng nhận được ${r2.receptNo}`);

        // 3. Đăng ký Bệnh nhân 3 (Quầy tiếp đón)
        const p3Payload = {
            patient: { fullName: 'TEST LE VAN C', sex: 'M', birthDate: '1985-08-20', identityNo: '999000000003', phone: '0900000003' },
            doc: { objectId: '7' },
            exam: { deptId: testDeptId, roomId: testRoomId.toString() }
        };
        const res3 = await client.query(`SELECT hms_register_patient_v2($1::jsonb) as res`, [JSON.stringify(p3Payload)]);
        const r3 = res3.rows[0].res;
        console.log(`✅ BN 3 (Quầy): DocNo=${r3.docNo}, ReceptNo=${r3.receptNo}`);
        if (r3.receptNo !== 3) throw new Error(`Mong đợi STT 3 nhưng nhận được ${r3.receptNo}`);

        // 4. Giả lập HỦY BỆNH NHÂN 2 (he_status = 'C')
        await client.query(`
            UPDATE hms_exam SET he_status = 'C' WHERE he_docno = $1 AND he_roomid = $2;
        `, [r2.docNo, testRoomId]);
        console.log(`🔻 Đã giả lập HỦY BỆNH NHÂN 2 (DocNo=${r2.docNo}, STT=2)`);

        // 5. Đăng ký Bệnh nhân 4 (Quầy tiếp đón) -> Phải nhận STT 4 (KHÔNG lấp lại số 2)
        const p4Payload = {
            patient: { fullName: 'TEST PHAM VAN D', sex: 'M', birthDate: '1995-12-12', identityNo: '999000000004', phone: '0900000004' },
            doc: { objectId: '7' },
            exam: { deptId: testDeptId, roomId: testRoomId.toString() }
        };
        const res4 = await client.query(`SELECT hms_register_patient_v2($1::jsonb) as res`, [JSON.stringify(p4Payload)]);
        const r4 = res4.rows[0].res;
        console.log(`✅ BN 4 (Quầy sau khi HỦY BN 2): DocNo=${r4.docNo}, ReceptNo=${r4.receptNo}`);
        if (r4.receptNo !== 4) throw new Error(`LỖI: Nhận STT ${r4.receptNo} thay vì 4. Thuật toán lấp lỗ hổng vẫn tồn tại!`);

        // 6. Đăng ký Bệnh nhân 5 (Duyệt Online) với p_receptno = 0 -> Phải tự động tăng lên STT 5
        const onlineRes = await client.query(`
            SELECT hms_insert_exam_online($1, $2, $3, $4, $5, $6, $7) as exam_idx
        `, [r4.patientNo, r4.docNo, testDeptId, testRoomId, '', 0, 'D0000031']);
        
        const checkExam5 = await client.query(`
            SELECT he_receptno FROM hms_exam WHERE he_receptidx = $1
        `, [onlineRes.rows[0].exam_idx]);
        const receptNo5 = checkExam5.rows[0].he_receptno;
        console.log(`✅ BN 5 (Duyệt Online p_receptno=0): ReceptNo=${receptNo5}`);
        if (receptNo5 !== 5) throw new Error(`LỖI Duyệt Online: Nhận STT ${receptNo5} thay vì 5!`);

        console.log('\n🎉 TẤT CẢ KIỂM THỬ XÁC NHẬN THÀNH CÔNG! SỐ THỨ TỰ TĂNG LIÊN TỤC VÀ KHÔNG BỊ NHẢY LUNG TUNG.');

        // Cleanup dữ liệu test
        await client.query(`DELETE FROM hms_exam WHERE he_roomid = $1 AND DATE(he_examdate) = CURRENT_DATE;`, [testRoomId]);
    } catch (err: any) {
        console.error('\n❌ KIỂM THỬ THẤT BẠI:', err.message || err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runTest();
