import { query } from '../src/config/database';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3000/api/v1/health-check-sync';

async function runTest() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 BẮT ĐẦU KIỂM THỬ BỘ LỌC ĐỒNG BỘ DỮ LIỆU HIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        // 1. Xóa dữ liệu cũ trong health_check_masters và health_check_details
        console.log('\n🧹 1. Đang xóa dữ liệu cũ trong health_check_masters và health_check_details...');
        await query('TRUNCATE TABLE health_check_details CASCADE');
        await query('TRUNCATE TABLE health_check_masters CASCADE');
        console.log('✅ Đã xóa sạch dữ liệu cũ!');

        // 2. Lấy max patient_no, doc_no, receptidx để tránh trùng lặp PK
        const maxPatientRes = await query('SELECT MAX(hp_patientno) as max_p FROM hms_patient');
        const maxDocRes = await query('SELECT MAX(hd_docno) as max_d FROM hms_doc');
        const maxExamRes = await query('SELECT MAX(he_receptidx) as max_e FROM hms_exam');
        
        let p1 = (maxPatientRes.rows[0].max_p || 95000000) + 1;
        let d1 = (maxDocRes.rows[0].max_d || 26000000) + 1;
        let nextReceptIdx = (maxExamRes.rows[0].max_e || 5000000) + 1;

        let p2 = p1 + 1;
        let d2 = d1 + 1;

        let p3 = p1 + 2;
        let d3 = d1 + 2;

        console.log(`\n📦 2. Chuẩn bị chèn 3 bệnh nhân mẫu vào HIS:`);
        console.log(`   - Bệnh nhân A: PatientNo: ${p1}, DocNo: ${d1}, Ngày khám: 2026-06-10, Công ty: COMP_A`);
        console.log(`   - Bệnh nhân B: PatientNo: ${p2}, DocNo: ${d2}, Ngày khám: 2026-06-12, Công ty: COMP_B`);
        console.log(`   - Bệnh nhân C: PatientNo: ${p3}, DocNo: ${d3}, Ngày khám: 2026-06-14, Công ty: COMP_C`);

        // Chèn Bệnh nhân A
        await query(`
            INSERT INTO hms_patient (hp_patientno, hp_patientid, hp_surname, hp_midname, hp_firstname, hp_birthdate, hp_sex, hp_sin, hp_ethnic, hp_workplaceid, hp_createddate)
            VALUES ($1, $2, 'NGUYỄN VAN', 'A', 'FILTER', '1990-05-10', 'M', '001096000001', '01', 'COMP_A', NOW())
        `, [p1, String(p1)]);
        await query(`
            INSERT INTO hms_doc (hd_patientno, hd_docno, hd_status, hd_yofage, hd_admitdate, hd_createddate)
            VALUES ($1, $2, 'O', 36, '2026-06-10 10:00:00', NOW())
        `, [p1, d1]);
        await query(`
            INSERT INTO hms_exam (he_docno, he_receptidx, he_receptno, he_deptid, he_roomid, he_patientno, he_height, he_weight, he_pulse, he_bloodpressure, he_bloodpressurex, he_examine, he_diagnostic)
            VALUES ($1, $2, 1, 'KB', 1, $3, 170, 65, 75, 120, 80, 'Khám lâm sàng tốt.', 'Đủ sức khỏe')
        `, [d1, nextReceptIdx++, p1]);

        // Chèn Bệnh nhân B
        await query(`
            INSERT INTO hms_patient (hp_patientno, hp_patientid, hp_surname, hp_midname, hp_firstname, hp_birthdate, hp_sex, hp_sin, hp_ethnic, hp_workplaceid, hp_createddate)
            VALUES ($1, $2, 'TRẦN THỊ', 'B', 'FILTER', '1992-06-12', 'F', '001096000002', '01', 'COMP_B', NOW())
        `, [p2, String(p2)]);
        await query(`
            INSERT INTO hms_doc (hd_patientno, hd_docno, hd_status, hd_yofage, hd_admitdate, hd_createddate)
            VALUES ($1, $2, 'O', 34, '2026-06-12 11:30:00', NOW())
        `, [p2, d2]);
        await query(`
            INSERT INTO hms_exam (he_docno, he_receptidx, he_receptno, he_deptid, he_roomid, he_patientno, he_height, he_weight, he_pulse, he_bloodpressure, he_bloodpressurex, he_examine, he_diagnostic)
            VALUES ($1, $2, 1, 'KB', 1, $3, 160, 50, 80, 110, 70, 'Nữ khoẻ mạnh.', 'Đủ sức khỏe')
        `, [d2, nextReceptIdx++, p2]);

        // Chèn Bệnh nhân C
        await query(`
            INSERT INTO hms_patient (hp_patientno, hp_patientid, hp_surname, hp_midname, hp_firstname, hp_birthdate, hp_sex, hp_sin, hp_ethnic, hp_workplaceid, hp_createddate)
            VALUES ($1, $2, 'PHẠM VĂN', 'C', 'FILTER', '1994-07-15', 'M', '001096000003', '01', 'COMP_C', NOW())
        `, [p3, String(p3)]);
        await query(`
            INSERT INTO hms_doc (hd_patientno, hd_docno, hd_status, hd_yofage, hd_admitdate, hd_createddate)
            VALUES ($1, $2, 'O', 32, '2026-06-14 14:00:00', NOW())
        `, [p3, d3]);
        await query(`
            INSERT INTO hms_exam (he_docno, he_receptidx, he_receptno, he_deptid, he_roomid, he_patientno, he_height, he_weight, he_pulse, he_bloodpressure, he_bloodpressurex, he_examine, he_diagnostic)
            VALUES ($1, $2, 1, 'KB', 1, $3, 175, 70, 72, 120, 80, 'Khám tổng quát tốt.', 'Đủ sức khỏe')
        `, [d3, nextReceptIdx++, p3]);

        console.log('✅ Đã tạo dữ liệu mẫu thành công trong HIS!');

        // 3. Thực hiện kiểm thử đồng bộ với các trường hợp lọc khác nhau
        console.log('\n🚀 3. Đang thực hiện kiểm thử đồng bộ API...');

        // Test Case 1: Lọc ngày 2026-06-10 (Chỉ khớp Bệnh nhân A)
        console.log('\n--- 📌 Test Case 1: Lọc ngày khám 2026-06-10 (Từ ngày: 2026-06-10, Đến ngày: 2026-06-10) ---');
        let res: any = await axios.post(`${BACKEND_URL}/documents/seed-from-his`, {
            startDate: '2026-06-10',
            endDate: '2026-06-10'
        });
        console.log(`   -> Trạng thái API: ${res.data.success ? 'Thành công' : 'Thất bại'}`);
        console.log(`   -> Số hồ sơ đồng bộ: ${res.data.count}`);
        console.log(`   -> Chi tiết: ${res.data.message}`);
        
        let dbMasterRes = await query("SELECT id, patient_name, doc_no, cccd FROM health_check_masters");
        console.log("   -> Hồ sơ lưu trong DB:");
        console.table(dbMasterRes.rows);

        // Test Case 2: Lọc công ty COMP_B (Chỉ khớp Bệnh nhân B)
        console.log('\n--- 📌 Test Case 2: Lọc theo công ty COMP_B (Không giới hạn ngày) ---');
        res = await axios.post(`${BACKEND_URL}/documents/seed-from-his`, {
            workplaceId: 'COMP_B'
        });
        console.log(`   -> Trạng thái API: ${res.data.success ? 'Thành công' : 'Thất bại'}`);
        console.log(`   -> Số hồ sơ đồng bộ: ${res.data.count}`);
        console.log(`   -> Chi tiết: ${res.data.message}`);
        
        dbMasterRes = await query("SELECT id, patient_name, doc_no, cccd FROM health_check_masters");
        console.log("   -> Hồ sơ lưu trong DB:");
        console.table(dbMasterRes.rows);

        // Test Case 3: Lọc ngày 2026-06-14 và công ty COMP_C (Chỉ khớp Bệnh nhân C)
        console.log('\n--- 📌 Test Case 3: Lọc ngày khám 2026-06-14 và công ty COMP_C ---');
        res = await axios.post(`${BACKEND_URL}/documents/seed-from-his`, {
            startDate: '2026-06-14',
            endDate: '2026-06-14',
            workplaceId: 'COMP_C'
        });
        console.log(`   -> Trạng thái API: ${res.data.success ? 'Thành công' : 'Thất bại'}`);
        console.log(`   -> Số hồ sơ đồng bộ: ${res.data.count}`);
        console.log(`   -> Chi tiết: ${res.data.message}`);
        
        dbMasterRes = await query("SELECT id, patient_name, doc_no, cccd FROM health_check_masters");
        console.log("   -> Hồ sơ lưu trong DB:");
        console.table(dbMasterRes.rows);

        // Test Case 4: Lọc khoảng rộng từ 2026-06-10 đến 2026-06-14 (Khớp cả 3 bệnh nhân)
        console.log('\n--- 📌 Test Case 4: Lọc khoảng rộng từ 2026-06-10 đến 2026-06-14 ---');
        res = await axios.post(`${BACKEND_URL}/documents/seed-from-his`, {
            startDate: '2026-06-10',
            endDate: '2026-06-14'
        });
        console.log(`   -> Trạng thái API: ${res.data.success ? 'Thành công' : 'Thất bại'}`);
        console.log(`   -> Số hồ sơ đồng bộ: ${res.data.count}`);
        console.log(`   -> Chi tiết: ${res.data.message}`);
        
        dbMasterRes = await query("SELECT id, patient_name, doc_no, cccd FROM health_check_masters");
        console.log("   -> Hồ sơ lưu trong DB:");
        console.table(dbMasterRes.rows);

        console.log('\n🎉 KIỂM THỬ BỘ LỌC ĐỒNG BỘ HIS HOÀN THÀNH THÀNH CÔNG RỰC RỠ!');
    } catch (e: any) {
        console.error('❌ Có lỗi xảy ra trong quá trình kiểm thử:', e.message);
        if (e.response) {
            console.error('   -> Phản hồi lỗi của API:', e.response.data);
        }
    } finally {
        process.exit(0);
    }
}

runTest();
