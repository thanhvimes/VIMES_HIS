import { pool } from '../src/config/database';

interface TestResult {
    scenarioId: string;
    name: string;
    description: string;
    passed: boolean;
    expected: string;
    actual: string;
    error?: string;
}

async function runComprehensiveTests() {
    console.log('============================================================');
    console.log('🧪 BỘ KIỂM THỬ TOÀN DIỆN HÀM TÍNH SỐ THỨ TỰ KHÁM (he_receptno)');
    console.log('============================================================\n');

    const client = await pool.connect();
    const results: TestResult[] = [];

    const roomA = 997; // Room test A
    const roomB = 996; // Room test B
    const deptId = 'KB';
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    try {
        // Clear old test data for roomA and roomB on today & tomorrow
        await client.query(`
            DELETE FROM hms_exam 
            WHERE he_roomid IN ($1, $2) 
              AND DATE(he_examdate) IN ($3::date, $4::date);
        `, [roomA, roomB, todayStr, tomorrowStr]);

        // ------------------------------------------------------------------
        // TC01: Khởi tạo STT đầu ngày cho phòng trống
        // ------------------------------------------------------------------
        try {
            const res = await client.query(`SELECT hms_get_next_receptno($1, $2, $3::date) as no`, [deptId, roomA, todayStr]);
            const actual = res.rows[0].no;
            const passed = actual === 1;
            results.push({
                scenarioId: 'TC01',
                name: 'STT đầu ngày cho phòng mới',
                description: 'Khi phòng khám chưa có bệnh nhân nào trong ngày, STT tiếp theo phải bằng 1',
                passed,
                expected: '1',
                actual: actual.toString()
            });
        } catch (e: any) {
            results.push({ scenarioId: 'TC01', name: 'STT đầu ngày', description: '', passed: false, expected: '1', actual: 'ERROR', error: e.message });
        }

        // ------------------------------------------------------------------
        // TC02: Tiếp đón liên tiếp tại quầy (Tăng liên tục 1 -> 2 -> 3)
        // ------------------------------------------------------------------
        try {
            const p1 = (await client.query(`SELECT hms_register_patient_v2($1::jsonb) as res`, [JSON.stringify({
                patient: { fullName: 'TEST TC02 BN1', sex: 'M', birthDate: '1990-01-01', identityNo: '888000000001', phone: '0888000001' },
                doc: { objectId: '7' }, exam: { deptId, roomId: roomA.toString() }
            })])).rows[0].res;

            const p2 = (await client.query(`SELECT hms_register_patient_v2($1::jsonb) as res`, [JSON.stringify({
                patient: { fullName: 'TEST TC02 BN2', sex: 'F', birthDate: '1992-02-02', identityNo: '888000000002', phone: '0888000002' },
                doc: { objectId: '7' }, exam: { deptId, roomId: roomA.toString() }
            })])).rows[0].res;

            const p3 = (await client.query(`SELECT hms_register_patient_v2($1::jsonb) as res`, [JSON.stringify({
                patient: { fullName: 'TEST TC02 BN3', sex: 'M', birthDate: '1994-03-03', identityNo: '888000000003', phone: '0888000003' },
                doc: { objectId: '7' }, exam: { deptId, roomId: roomA.toString() }
            })])).rows[0].res;

            const seq = `${p1.receptNo},${p2.receptNo},${p3.receptNo}`;
            const passed = seq === '1,2,3';
            results.push({
                scenarioId: 'TC02',
                name: 'Đăng ký liên tiếp tại quầy',
                description: 'Đăng ký 3 bệnh nhân liên tiếp tại quầy, STT phải tăng tăng dần 1, 2, 3',
                passed,
                expected: '1,2,3',
                actual: seq
            });
        } catch (e: any) {
            results.push({ scenarioId: 'TC02', name: 'Đăng ký liên tiếp tại quầy', description: '', passed: false, expected: '1,2,3', actual: 'ERROR', error: e.message });
        }

        // ------------------------------------------------------------------
        // TC03: Xử lý phiếu HỦY (Không lấp lại số cũ bị hủy)
        // ------------------------------------------------------------------
        try {
            // Hủy phiếu của BN 2 (STT = 2)
            await client.query(`UPDATE hms_exam SET he_status = 'C' WHERE he_roomid = $1 AND he_receptno = 2 AND DATE(he_examdate) = $2::date`, [roomA, todayStr]);

            // Đăng ký BN 4
            const p4 = (await client.query(`SELECT hms_register_patient_v2($1::jsonb) as res`, [JSON.stringify({
                patient: { fullName: 'TEST TC03 BN4', sex: 'F', birthDate: '1996-04-04', identityNo: '888000000004', phone: '0888000004' },
                doc: { objectId: '7' }, exam: { deptId, roomId: roomA.toString() }
            })])).rows[0].res;

            const passed = p4.receptNo === 4;
            results.push({
                scenarioId: 'TC03',
                name: 'Xử lý số phiếu khi có phiếu bị HỦY',
                description: 'Khi phiếu số 2 bị hủy, bệnh nhân tiếp theo phải nhận số 4 (không lấp lại số 2)',
                passed,
                expected: '4',
                actual: p4.receptNo.toString()
            });
        } catch (e: any) {
            results.push({ scenarioId: 'TC03', name: 'Xử lý phiếu bị HỦY', description: '', passed: false, expected: '4', actual: 'ERROR', error: e.message });
        }

        // ------------------------------------------------------------------
        // TC04: Duyệt Online với p_receptno hợp lệ chưa sử dụng (Slot 10)
        // ------------------------------------------------------------------
        try {
            const examIdx = (await client.query(`
                SELECT hms_insert_exam_online(1001, 2001, $1, $2, $3, 10, 'D0000031') as idx
            `, [deptId, roomA, todayStr])).rows[0].idx;

            const rec = (await client.query(`SELECT he_receptno FROM hms_exam WHERE he_receptidx = $1`, [examIdx])).rows[0].he_receptno;
            const passed = rec === 10;
            results.push({
                scenarioId: 'TC04',
                name: 'Duyệt Online với p_receptno slot hợp lệ',
                description: 'Khi duyệt online với slot 10 chưa dùng, STT trong hms_exam phải giữ nguyên 10',
                passed,
                expected: '10',
                actual: rec.toString()
            });
        } catch (e: any) {
            results.push({ scenarioId: 'TC04', name: 'Duyệt Online slot hợp lệ', description: '', passed: false, expected: '10', actual: 'ERROR', error: e.message });
        }

        // ------------------------------------------------------------------
        // TC05: Duyệt Online trùng p_receptno đã bị chiếm (Trùng slot 4)
        // ------------------------------------------------------------------
        try {
            // Truyền slot 4 (đã bị gán cho BN 4 ở TC03) -> Phải tự động tăng thành MAX + 1 = 11
            const examIdx = (await client.query(`
                SELECT hms_insert_exam_online(1002, 2002, $1, $2, $3, 4, 'D0000031') as idx
            `, [deptId, roomA, todayStr])).rows[0].idx;

            const rec = (await client.query(`SELECT he_receptno FROM hms_exam WHERE he_receptidx = $1`, [examIdx])).rows[0].he_receptno;
            const passed = rec === 5;
            results.push({
                scenarioId: 'TC05',
                name: 'Duyệt Online bị TRÙNG slot đã cấp',
                description: 'Khi duyệt online truyền slot 4 đã có bệnh nhân, hệ thống phải tự gán số trống nhỏ nhất tiếp theo là 5',
                passed,
                expected: '5',
                actual: rec.toString()
            });
        } catch (e: any) {
            results.push({ scenarioId: 'TC05', name: 'Duyệt Online trùng slot', description: '', passed: false, expected: '11', actual: 'ERROR', error: e.message });
        }

        // ------------------------------------------------------------------
        // TC06: Duyệt Online với p_receptno = 0 hoặc NULL
        // ------------------------------------------------------------------
        try {
            const examIdx = (await client.query(`
                SELECT hms_insert_exam_online(1003, 2003, $1, $2, $3, 0, 'D0000031') as idx
            `, [deptId, roomA, todayStr])).rows[0].idx;

            const rec = (await client.query(`SELECT he_receptno FROM hms_exam WHERE he_receptidx = $1`, [examIdx])).rows[0].he_receptno;
            const passed = rec === 6;
            results.push({
                scenarioId: 'TC06',
                name: 'Duyệt Online p_receptno = 0',
                description: 'Khi p_receptno = 0, hệ thống tự động sinh số trống nhỏ nhất là 6',
                passed,
                expected: '6',
                actual: rec.toString()
            });
        } catch (e: any) {
            results.push({ scenarioId: 'TC06', name: 'Duyệt Online p_receptno=0', description: '', passed: false, expected: '12', actual: 'ERROR', error: e.message });
        }

        // ------------------------------------------------------------------
        // TC07: Đổi phòng khám tại quầy (Tính STT theo phòng mới)
        // ------------------------------------------------------------------
        try {
            // Tạo 2 bệnh nhân ở phòng B (roomB = 996) -> STT 1, 2
            await client.query(`SELECT hms_register_patient_v2($1::jsonb)`, [JSON.stringify({
                patient: { fullName: 'TEST TC07 BN B1', sex: 'M', birthDate: '1980-01-01', identityNo: '888000000010', phone: '0888000010' },
                doc: { objectId: '7' }, exam: { deptId, roomId: roomB.toString() }
            })]);
            await client.query(`SELECT hms_register_patient_v2($1::jsonb)`, [JSON.stringify({
                patient: { fullName: 'TEST TC07 BN B2', sex: 'F', birthDate: '1982-02-02', identityNo: '888000000011', phone: '0888000011' },
                doc: { objectId: '7' }, exam: { deptId, roomId: roomB.toString() }
            })]);

            // BN ở phòng A muốn chuyển sang phòng B -> Đổi phòng sang roomB
            const newRecRes = await client.query(`SELECT hms_get_next_receptno($1, $2, CURRENT_DATE) as new_no`, [deptId, roomB]);
            const newNo = newRecRes.rows[0].new_no;
            const passed = newNo === 3;
            results.push({
                scenarioId: 'TC07',
                name: 'Đổi phòng khám tại quầy',
                description: 'Chuyển bệnh nhân sang Phòng B (đang có 2 BN), STT mới gán ở Phòng B phải bằng 3',
                passed,
                expected: '3',
                actual: newNo.toString()
            });
        } catch (e: any) {
            results.push({ scenarioId: 'TC07', name: 'Đổi phòng khám', description: '', passed: false, expected: '3', actual: 'ERROR', error: e.message });
        }

        // ------------------------------------------------------------------
        // TC08: Độc lập dãy số giữa các phòng khám khác nhau
        // ------------------------------------------------------------------
        try {
            const noA = (await client.query(`SELECT hms_get_next_receptno($1, $2, CURRENT_DATE) as no`, [deptId, roomA])).rows[0].no;
            const noB = (await client.query(`SELECT hms_get_next_receptno($1, $2, CURRENT_DATE) as no`, [deptId, roomB])).rows[0].no;

            const passed = noA === 7 && noB === 3;
            results.push({
                scenarioId: 'TC08',
                name: 'Tính độc lập giữa các phòng khám',
                description: 'Phòng A (STT tiếp theo = 7) và Phòng B (STT tiếp theo = 3) hoạt động độc lập tuyệt đối',
                passed,
                expected: 'Phòng A: 7, Phòng B: 3',
                actual: `Phòng A: ${noA}, Phòng B: ${noB}`
            });
        } catch (e: any) {
            results.push({ scenarioId: 'TC08', name: 'Độc lập các phòng', description: '', passed: false, expected: 'A:13, B:3', actual: 'ERROR', error: e.message });
        }

        // ------------------------------------------------------------------
        // TC09: Độc lập dãy số giữa các ngày khác nhau (Reset theo ngày)
        // ------------------------------------------------------------------
        try {
            const noToday = (await client.query(`SELECT hms_get_next_receptno($1, $2, $3::date) as no`, [deptId, roomA, todayStr])).rows[0].no;
            const noTomorrow = (await client.query(`SELECT hms_get_next_receptno($1, $2, $3::date) as no`, [deptId, roomA, tomorrowStr])).rows[0].no;

            const passed = noToday === 7 && noTomorrow === 1;
            results.push({
                scenarioId: 'TC09',
                name: 'Tính độc lập giữa các ngày khám (Reset theo ngày)',
                description: 'Hôm nay STT tiếp theo = 7, Ngày mai chưa có ai nên STT reset về 1',
                passed,
                expected: 'Hôm nay: 7, Ngày mai: 1',
                actual: `Hôm nay: ${noToday}, Ngày mai: ${noTomorrow}`
            });
        } catch (e: any) {
            results.push({ scenarioId: 'TC09', name: 'Reset theo ngày', description: '', passed: false, expected: 'Today:13, Tomorrow:1', actual: 'ERROR', error: e.message });
        }

        // ------------------------------------------------------------------
        // TC10: Kiểm thử An toàn Đa luồng / Đăng ký đồng thời (Concurrent Race Condition Test)
        // ------------------------------------------------------------------
        try {
            console.log('⚡ Đang thực thi TC10: Giả lập 5 giao dịch đăng ký đồng thời (Concurrent Requests)...');
            const promises = Array.from({ length: 5 }).map((_, idx) => {
                const payload = {
                    patient: { fullName: `TEST CONCURRENT ${idx}`, sex: 'M', birthDate: '1990-01-01', identityNo: `8880000099${idx}`, phone: `08880099${idx}` },
                    doc: { objectId: '7' }, exam: { deptId, roomId: roomA.toString() }
                };
                return pool.query(`SELECT hms_register_patient_v2($1::jsonb) as res`, [JSON.stringify(payload)]);
            });

            const concurrentResults = await Promise.all(promises);
            const generatedNos = concurrentResults.map(r => r.rows[0].res.receptNo).sort((a, b) => a - b);
            
            // Expected numbers: 7, 8, 9, 11, 12 (10 is taken by TC04)
            const expectedSeq = [7, 8, 9, 11, 12].join(',');
            const actualSeq = generatedNos.join(',');
            const passed = actualSeq === expectedSeq;

            results.push({
                scenarioId: 'TC10',
                name: 'An toàn Đăng ký Đồng thời (Concurrent Advisory Lock)',
                description: 'Gửi 5 request đăng ký cùng lúc, tất cả số STT trả về phải duy nhất và tăng liên tục (7,8,9,11,12) bỏ qua 10',
                passed,
                expected: expectedSeq,
                actual: actualSeq
            });
        } catch (e: any) {
            results.push({ scenarioId: 'TC10', name: 'Đăng ký đồng thời', description: '', passed: false, expected: '13,14,15,16,17', actual: 'ERROR', error: e.message });
        }

        // ------------------------------------------------------------------
        // BÁO CÁO TỔNG HỢP KẾT QUẢ KIỂM THỬ
        // ------------------------------------------------------------------
        console.log('\n============================================================');
        console.log('📊 TỔNG HỢP KẾT QUẢ KIỂM THỬ CÁC KỊCH BẢN (TEST REPORT)');
        console.log('============================================================\n');

        let totalPassed = 0;
        results.forEach(r => {
            if (r.passed) totalPassed++;
            const statusSymbol = r.passed ? '✅ PASSED' : '❌ FAILED';
            console.log(`[${r.scenarioId}] ${r.name}: ${statusSymbol}`);
            console.log(`     - Mô tả: ${r.description}`);
            console.log(`     - Mong đợi: ${r.expected}`);
            console.log(`     - Thực tế : ${r.actual}`);
            if (r.error) console.log(`     - Lỗi SQL : ${r.error}`);
            console.log('------------------------------------------------------------');
        });

        console.log(`\n📌 KẾT QUẢ CHUNG: ${totalPassed}/${results.length} KỊCH BẢN ĐẠT THÀNH CÔNG (${Math.round((totalPassed/results.length)*100)}%)\n`);

        // Dọn dẹp dữ liệu test
        await client.query(`
            DELETE FROM hms_exam 
            WHERE he_roomid IN ($1, $2) 
              AND DATE(he_examdate) IN ($3::date, $4::date);
        `, [roomA, roomB, todayStr, tomorrowStr]);

        if (totalPassed !== results.length) {
            process.exit(1);
        }
    } catch (err: any) {
        console.error('❌ LỖI HỆ THỐNG TRONG QUÁ TRÌNH KIỂM THỬ:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runComprehensiveTests();
