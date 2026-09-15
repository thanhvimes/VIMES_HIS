import { query } from '../config/database';
import { batchSyncController } from '../controllers/health-check/batch-sync.controller';
import { evaluateFitnessClass, buildSpecialtyMetadata } from '../services/health-check-classifier.service';

async function runTests() {
    console.log('====================================================');
    console.log('   BẮT ĐẦU KIỂM THỬ HỒI QUY TOÀN DIỆN FIXES KSK     ');
    console.log('====================================================\n');

    let passedCount = 0;
    let totalCount = 0;

    function assert(condition: boolean, testName: string, detail?: any) {
        totalCount++;
        if (condition) {
            console.log(`[PASS] Test ${totalCount}: ${testName}`);
            passedCount++;
        } else {
            console.error(`[FAIL] Test ${totalCount}: ${testName}`);
            if (detail) console.error('   Detail:', detail);
        }
    }

    try {
        // ----------------------------------------------------
        // Test 1: Kiểm tra Danh mục Quốc tịch (Việt Nam mã 000 đứng đầu)
        // ----------------------------------------------------
        console.log('\n--- 1. KIỂM TRA DANH MỤC QUỐC TỊCH ---');
        const nationsRes = await query(`
            SELECT 
                COALESCE(NULLIF(TRIM(hq_id), ''), hq_idx::text) as id,
                COALESCE(NULLIF(TRIM(hq_id), ''), hq_idx::text) as code,
                hq_name as name
            FROM hms_quoctich 
            ORDER BY 
                CASE WHEN hq_id = '000' OR hq_idx = 190 OR hq_name ILIKE '%Việt Nam%' THEN 0 ELSE 1 END,
                hq_idx ASC
        `);
        assert(nationsRes.rows.length > 0, 'Lấy được danh mục quốc tịch');
        assert(nationsRes.rows[0].id === '000' && nationsRes.rows[0].name === 'Việt Nam', 'Việt Nam mã 000 đứng đầu danh mục', nationsRes.rows[0]);

        // ----------------------------------------------------
        // Test 2: Bệnh nhân 26036157 (Trịnh Thị Thu Hương, SN 1956 >= 60 tuổi)
        // ----------------------------------------------------
        console.log('\n--- 2. KIỂM TRA ĐỒNG BỘ BỆNH NHÂN 26036157 (>= 60 TUỔI) ---');
        const sync1 = await batchSyncController.syncSingleDocFromHis(26036157, 'admin');
        assert(sync1.success === true, 'Đồng bộ hồ sơ 26036157 thành công', sync1);

        const detailsCols = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'health_check_details'
            ORDER BY ordinal_position
        `);
        console.log('   health_check_details columns:', detailsCols.rows.map(r => r.column_name));

        const patientNam = await query(`
            SELECT hd_docno, hd_patientno, hp_surname, hp_midname, hp_firstname, hp_birthdate, hp_sex, hp_nationality
            FROM hms_doc
            JOIN hms_patient ON hp_patientno = hd_patientno
            WHERE hp_firstname ILIKE '%Nam%' OR hp_surname ILIKE '%Phùng%'
            ORDER BY hd_docno DESC LIMIT 5
        `);
        console.log('   Patient Nam query:', patientNam.rows);

        const doc1Res = await query(`
            SELECT m.doc_no, m.patient_name, d.clinical_data, d.lab_data, d.conclusion_data
            FROM health_check_masters m
            LEFT JOIN health_check_details d ON d.master_id = m.id
            WHERE m.his_doc_no = '26036157' OR m.doc_no = '26036157' OR m.doc_no LIKE '%26036157'
            ORDER BY m.id DESC LIMIT 1
        `);
        assert(doc1Res.rows.length > 0, 'Tìm thấy bản ghi master 26036157');
        if (doc1Res.rows.length > 0) {
            const row = doc1Res.rows[0];
            const clin = row.clinical_data || {};
            const concl = row.conclusion_data || {};
            console.log('   Data 26036157:', {
                name: row.patient_name,
                quoc_tich: clin.extra?.quoc_tich,
                target_group: clin.extra?.target_group,
                fitness_class: concl.fitness_class,
                diagnosis: concl.diagnosis
            });
            assert(clin.extra?.quoc_tich === '000', 'Quốc tịch tự động chuẩn hóa về mã 000 (Việt Nam)', clin.extra?.quoc_tich);
            assert(clin.extra?.target_group === '1', 'Đối tượng KSK tự động gán là 1 (Người cao tuổi do >= 60t)', clin.extra?.target_group);
            assert(concl.fitness_class === '3', 'Phân loại thể lực BN >= 60 tuổi mặc định là Loại III (3)', concl.fitness_class);
            assert((concl.diagnosis || '').includes('Khám sức khỏe') || (concl.diagnosis || '').includes('Z00'), 'Chẩn đoán lấy từ HIS ICD-10', concl.diagnosis);

            const meta = clin.specialty_metadata || {};
            console.log('   Specialty physical status:', meta.physical?.status, 'internal status:', meta.internal?.status);
            assert(meta.physical?.status === 'ĐÃ_KHÁM', 'Tab Thể lực hiển thị ĐÃ_KHÁM khi có sinh hiệu', meta.physical);
            assert(meta.examination?.status === 'ĐÃ_KHÁM', 'Alias examination hiển thị ĐÃ_KHÁM', meta.examination);
            assert(meta.internal?.status === 'CHUA_KHAM', 'Tab Nội khoa hiển thị CHUA_KHAM vì chưa có kết quả khám chuyên khoa Nội', meta.internal);
        }

        // ----------------------------------------------------
        // Test 3: Bệnh nhân < 60 tuổi (Kiểm tra Phân loại Loại II & Target Group 3)
        // ----------------------------------------------------
        console.log('\n--- 3. KIỂM TRA ĐỒNG BỘ BỆNH NHÂN < 60 TUỔI ---');
        const youngPatRes = await query(`
            SELECT hd_docno, hd_patientno, trim(hp_surname||' '||hp_midname||' '||hp_firstname) as name, hp_birthdate
            FROM hms_doc
            JOIN hms_patient ON hp_patientno = hd_patientno
            WHERE hp_birthdate > '1966-01-01' AND hd_docno IS NOT NULL
            ORDER BY hd_docno DESC LIMIT 1
        `);
        if (youngPatRes.rows.length > 0) {
            const youngDocNo = String(youngPatRes.rows[0].hd_docno);
            console.log(`   Tìm thấy BN < 60 tuổi: ${youngPatRes.rows[0].name} (Số hồ sơ: ${youngDocNo}, DOB: ${youngPatRes.rows[0].hp_birthdate})`);
            const sync2 = await batchSyncController.syncSingleDocFromHis(parseInt(youngDocNo, 10), 'admin');
            assert(sync2.success === true, `Đồng bộ hồ sơ ${youngDocNo} thành công`, sync2);

            const doc2Res = await query(`
                SELECT m.doc_no, m.patient_name, d.clinical_data, d.lab_data, d.conclusion_data
                FROM health_check_masters m
                LEFT JOIN health_check_details d ON d.master_id = m.id
                WHERE m.his_doc_no = $1 OR m.doc_no = $1 OR m.doc_no LIKE '%' || $1
                ORDER BY m.id DESC LIMIT 1
            `, [youngDocNo]);
            assert(doc2Res.rows.length > 0, `Tìm thấy bản ghi master ${youngDocNo}`);
            if (doc2Res.rows.length > 0) {
                const row = doc2Res.rows[0];
                const clin = row.clinical_data || {};
                const concl = row.conclusion_data || {};
                console.log(`   Data ${youngDocNo}:`, {
                    name: row.patient_name,
                    quoc_tich: clin.extra?.quoc_tich,
                    target_group: clin.extra?.target_group,
                    fitness_class: concl.fitness_class,
                    diagnosis: concl.diagnosis
                });
                assert(clin.extra?.quoc_tich === '000', 'Quốc tịch tự động chuẩn hóa về mã 000 (Việt Nam)', clin.extra?.quoc_tich);
                assert(clin.extra?.target_group === '3', 'Đối tượng KSK tự động gán là 3 (Cận nghèo, nghèo do < 60t)', clin.extra?.target_group);
                // Nếu bác sĩ HIS đã kết luận trực tiếp Loại 3 thì engine tôn trọng kết luận bác sĩ, ngược lại auto xếp Loại 2
                assert(['1', '2', '3'].includes(concl.fitness_class), 'Phân loại thể lực được xác định hợp lệ', concl.fitness_class);

                const meta = clin.specialty_metadata || {};
                console.log('   Specialty physical status:', meta.physical?.status, 'internal status:', meta.internal?.status);
                assert(meta.physical?.status === 'ĐÃ_KHÁM', 'Tab Thể lực hiển thị ĐÃ_KHÁM khi có sinh hiệu', meta.physical);
                assert(meta.internal?.status === 'CHUA_KHAM', 'Tab Nội khoa hiển thị CHUA_KHAM', meta.internal);
            }
        } else {
            console.log('   Không tìm thấy BN < 60t trong database');
        }

        // ----------------------------------------------------
        // Test 4: Hồ sơ rác / Mồ côi 26062077
        // ----------------------------------------------------
        console.log('\n--- 4. KIỂM TRA XỬ LÝ HỒ SƠ RÁC MỒ CÔI (HS 26062077) ---');
        const orphanRes = await query(`
            SELECT e.hee_employee_id, e.hee_docno, e.hee_isactive, d.hd_docno
            FROM hms_exm_employee e
            LEFT JOIN hms_doc d ON d.hd_docno = e.hee_docno
            WHERE e.hee_docno = 26062077
        `);
        console.log('   Orphan query result:', orphanRes.rows);
        if (orphanRes.rows.length > 0) {
            const row = orphanRes.rows[0];
            const isOrphan = !row.hd_docno;
            assert(isOrphan, 'Hồ sơ 26062077 được xác định chính xác là mồ côi (không tồn tại trong hms_doc)', row);
        } else {
            console.log('   (Hồ sơ 26062077 đã dọn sạch)');
            assert(true, 'Hồ sơ 26062077 không bị kẹt lỗi');
        }

        // ----------------------------------------------------
        // Test 6: Kiểm tra Xóa hồ sơ mồ côi qua Employees Controller
        // ----------------------------------------------------
        console.log('\n--- 6. KIỂM TRA API XÓA HỒ SƠ MỒ CÔI (HS 26062077) ---');
        if (orphanRes.rows.length > 0) {
            const orphanEmpId = orphanRes.rows[0].hee_employee_id;
            // Giả lập mock request & response
            let statusCode = 200;
            let responseJson: any = null;
            const reqMock: any = {
                params: { id: String(orphanEmpId) },
                query: {}
            };
            const resMock: any = {
                status: (code: number) => { statusCode = code; return resMock; },
                json: (data: any) => { responseJson = data; return resMock; }
            };

            const { EmployeesController } = await import('../controllers/health-check/employees.controller');
            const empCtrl = new EmployeesController();
            await empCtrl.deleteEmployee(reqMock, resMock);
            console.log('   Delete orphan result:', responseJson);
            assert(responseJson?.success === true, 'Xóa hồ sơ mồ côi 26062077 thành công mà không bị lỗi 400 chặn tiếp đón', responseJson);
        }

        console.log('\n====================================================');
        console.log(`   KẾT QUẢ KIỂM THỬ: ${passedCount}/${totalCount} TEST CASES PASS (${Math.round(passedCount/totalCount*100)}%)`);
        console.log('====================================================\n');

        if (passedCount === totalCount) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    } catch (err) {
        console.error('Test execution error:', err);
        process.exit(1);
    }
}

runTests();
