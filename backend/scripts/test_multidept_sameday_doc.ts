import { pool } from '../src/config/database';

async function runMultiDeptSameDayTest() {
    console.log('============================================================');
    console.log('🧪 KIỂM THỬ: BỆNH NHÂN ĐĂNG KÝ NHIỀU KHOA TRONG NGÀY');
    console.log('👉 Yêu cầu: Giữ nguyên 1 Hồ sơ khám (hms_doc), chỉ tạo thêm Phiếu khám (hms_exam)');
    console.log('============================================================\n');

    const client = await pool.connect();
    const roomA = 997; // Phòng khám 1 (Khoa Nội - KB)
    const roomB = 996; // Phòng khám 2 (Khoa Tai Mũi Họng - TMH)
    const deptA = 'KB';
    const deptB = 'TMH';
    const identityNo = '999111222333';

    try {
        // 1. Dọn dẹp dữ liệu test cũ
        console.log('🧹 Dọn dẹp dữ liệu test cũ...');
        const oldPat = await client.query(`SELECT hp_patientno FROM hms_patient WHERE hp_sin = $1`, [identityNo]);
        if (oldPat.rows.length > 0) {
            const pNo = oldPat.rows[0].hp_patientno;
            await client.query(`DELETE FROM hms_exam WHERE he_patientno = $1`, [pNo]);
            await client.query(`DELETE FROM hms_doc WHERE hd_patientno = $1`, [pNo]);
            await client.query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [pNo]);
        }
        await client.query(`DELETE FROM hms_exam WHERE he_roomid IN ($1, $2) AND DATE(he_examdate) = CURRENT_DATE`, [roomA, roomB]);

        // 2. Lần 1: Đăng ký khám Chuyên khoa 1 (Khoa KB - Nội khoa, Phòng 997)
        console.log('\n📝 Lần 1: Đăng ký khám Chuyên khoa 1 (Khoa KB - Phòng 997)...');
        const p1Payload = {
            patient: { fullName: 'NGUYEN VAN MULTI DEPT', sex: 'M', birthDate: '1988-08-18', identityNo, phone: '0988777666' },
            doc: { objectId: '7' },
            exam: { deptId: deptA, roomId: roomA.toString() }
        };
        const res1 = await client.query(`SELECT hms_register_patient_v2($1::jsonb) as res`, [JSON.stringify(p1Payload)]);
        const r1 = res1.rows[0].res;

        console.log(`   ✅ Kết quả Lần 1:`);
        console.log(`      - Mã bệnh nhân (PatientNo) : ${r1.patientNo}`);
        console.log(`      - Mã hồ sơ (DocNo)         : ${r1.docNo}`);
        console.log(`      - Số thứ tự khám (ReceptNo): ${r1.receptNo} (Khoa ${deptA} - Phòng ${roomA})`);

        // 3. Lần 2: Đăng ký khám thêm Chuyên khoa 2 trong cùng ngày (Khoa TMH - Tai Mũi Họng, Phòng 996)
        console.log('\n📝 Lần 2: Đăng ký khám thêm Chuyên khoa 2 cùng ngày (Khoa TMH - Phòng 996)...');
        const p2Payload = {
            patient: { patientNo: r1.patientNo.toString(), fullName: 'NGUYEN VAN MULTI DEPT', identityNo },
            doc: { objectId: '7' },
            exam: { deptId: deptB, roomId: roomB.toString() }
        };
        const res2 = await client.query(`SELECT hms_register_patient_v2($1::jsonb) as res`, [JSON.stringify(p2Payload)]);
        const r2 = res2.rows[0].res;

        console.log(`   ✅ Kết quả Lần 2:`);
        console.log(`      - Mã bệnh nhân (PatientNo) : ${r2.patientNo}`);
        console.log(`      - Mã hồ sơ (DocNo)         : ${r2.docNo}`);
        console.log(`      - Số thứ tự khám (ReceptNo): ${r2.receptNo} (Khoa ${deptB} - Phòng ${roomB})`);

        // 4. Kiểm tra và Xác minh Độc lập các chỉ số DB
        console.log('\n============================================================');
        console.log('🔍 XÁC MINH CƠ SỞ DỮ LIỆU (DATABASE INTEGRITY CHECK)');
        console.log('============================================================');

        // Check số lượng hms_doc
        const docCheck = await client.query(
            `SELECT count(*) as count FROM hms_doc WHERE hd_patientno = $1 AND DATE(hd_admitdate) = CURRENT_DATE AND hd_status <> 'C'`,
            [r1.patientNo]
        );
        const docCount = parseInt(docCheck.rows[0].count);
        console.log(`1. Số lượng Hồ sơ khám (hms_doc) tạo ra trong ngày : ${docCount} (Mong đợi: 1)`);

        // Check số lượng hms_exam
        const examCheck = await client.query(
            `SELECT he_docno, he_deptid, he_roomid, he_receptno, he_receptidx 
             FROM hms_exam 
             WHERE he_docno = $1 
             ORDER BY he_receptidx ASC`,
            [r1.docNo]
        );
        console.log(`2. Số lượng Phiếu khám (hms_exam) tạo ra thuộc hồ sơ [${r1.docNo}] : ${examCheck.rows.length} (Mong đợi: 2)`);
        examCheck.rows.forEach((row, idx) => {
            console.log(`   📌 Phiếu khám ${idx + 1}: Dept=${row.he_deptid}, Room=${row.he_roomid}, ReceptNo=${row.he_receptno}, ReceptIdx=${row.he_receptidx}`);
        });

        // Assertions
        const isDocReused = (r1.docNo === r2.docNo) && (docCount === 1);
        const isExamAdded = (examCheck.rows.length === 2);
        const isPatientSame = (r1.patientNo === r2.patientNo);

        console.log('\n============================================================');
        console.log('📊 KẾT QUẢ KIỂM THỬ (TEST EVALUATION)');
        console.log('============================================================');

        if (isPatientSame) {
            console.log('✅ PASS: Cùng một Bệnh nhân (Mã BN trùng khớp)');
        } else {
            console.log('❌ FAIL: Tạo sai Bệnh nhân mới');
        }

        if (isDocReused) {
            console.log(`✅ PASS: ĐÃ TÁI SỬ DỤNG HỒ SƠ KHÁM! (DocNo = ${r1.docNo}, không tạo thêm hms_doc mới)`);
        } else {
            console.log(`❌ FAIL: Đã tạo thêm hms_doc mới! (DocNo 1 = ${r1.docNo}, DocNo 2 = ${r2.docNo})`);
        }

        if (isExamAdded) {
            console.log('✅ PASS: Đã tạo thành công 2 Phiếu khám (hms_exam) riêng biệt cho 2 khoa');
        } else {
            console.log('❌ FAIL: Số lượng phiếu khám không chính xác');
        }

        if (isPatientSame && isDocReused && isExamAdded) {
            console.log('\n🎉 KẾT LUẬN: KỊCH BẢN ĐĂNG KÝ NHIỀU KHOA TRONG NGÀY ĐẠT HOÀN HẢO!');
        } else {
            process.exit(1);
        }

        // Cleanup
        await client.query(`DELETE FROM hms_exam WHERE he_patientno = $1`, [r1.patientNo]);
        await client.query(`DELETE FROM hms_doc WHERE hd_patientno = $1`, [r1.patientNo]);
        await client.query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [r1.patientNo]);

    } catch (err: any) {
        console.error('\n❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ:', err.message || err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMultiDeptSameDayTest();
