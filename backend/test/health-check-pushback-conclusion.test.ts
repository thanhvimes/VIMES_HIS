import test from 'node:test';
import assert from 'node:assert/strict';
import { query } from '../src/config/database';
import { hisIntegrationController } from '../src/controllers/health-check/his-integration';
import { documentsController } from '../src/controllers/health-check/documents';

test('pushbackClinicalAndConclusion syncs vitals, exam parts, conclusion and closes open hms_exam/hms_doc', async () => {
    // 1. Chuẩn bị dữ liệu giả lập đợt khám test trên HIS Core
    const testDocNo = 99988801;
    const testPatientNo = 999888;
    const testEmployeeId = 999888;

    try {
        // Dọn dẹp trước nếu có
        await query(`DELETE FROM hms_disease_hist WHERE hdh_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exm_employee WHERE hee_employee_id = $1`, [testEmployeeId]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);

        const nextIdxRes = await query(`SELECT COALESCE(MAX(he_receptidx), 9000000) + 1 AS next_idx FROM hms_exam`);
        const testReceptIdx = parseInt(nextIdxRes.rows[0].next_idx, 10);

        // Tạo bệnh nhân & đợt khám giả lập với trạng thái 'O' (chưa kết thúc)
        await query(`
            INSERT INTO hms_patient (hp_patientno, hp_surname, hp_firstname, hp_sex, hp_birthdate)
            VALUES ($1, 'TEST', 'NGUYEN VAN', 'M', '1990-01-01')
        `, [testPatientNo]);

        await query(`
            INSERT INTO hms_doc (hd_docno, hd_patientno, hd_status, hd_admitdate, hd_object)
            VALUES ($1, $2, 'O', CURRENT_TIMESTAMP, 7)
        `, [testDocNo, testPatientNo]);

        await query(`
            INSERT INTO hms_exam (he_docno, he_patientno, he_deptid, he_roomid, he_receptidx, he_status)
            VALUES ($1, $2, 'KKB', 1, $3, 'O')
        `, [testDocNo, testPatientNo, testReceptIdx]);

        await query(`
            INSERT INTO hms_exm_employee (hee_employee_id, hee_contract_id, hee_patientno, hee_docno, hee_status, hee_isactive)
            VALUES ($1, 1, $2, $3, 'O', 'Y')
        `, [testEmployeeId, testPatientNo, testDocNo]);

        // 2. Dữ liệu khám & kết luận từ Module KSK
        const clinicalData = {
            examination: {
                height: '170',
                weight: '65',
                bmi: '22.49',
                pulse: '75',
                blood_pressure: '120/80',
                temperature: '36.5',
                breathing_rate: '18',
                physical_summary: 'Thể lực loại 1, da niêm mạc hồng'
            },
            clinical_exam: {
                internal: 'Tim đều, T1 T2 rõ, phổi trong',
                external: 'Không sẹo mổ, tứ chi vận động tốt',
                eye: 'Thị lực 10/10 hai mắt',
                ent: 'Tai mũi họng bình thường',
                dental: 'Không sâu răng',
                dermatology: 'Không có bệnh da liễu',
                specialty_metadata: {
                    conclusion: { doctorId: 'BS_TEST', doctorName: 'Bác sĩ Test' }
                }
            },
            extra: {
                ts_ban_than: 'Khỏe mạnh',
                ts_gia_dinh: 'Bố tăng huyết áp',
                di_ung_thuoc: 'Không có'
            }
        };

        const conclusionData = {
            fitness_class: '1',
            diagnosis: 'Đủ sức khỏe làm việc',
            diagnosis_icd10: 'Z00.0',
            cac_van_de_luu_y: 'Khám sức khỏe định kỳ hàng năm',
            doctor_id: 'BS_TEST'
        };

        // 3. Thực thi hàm pushback
        const mockClient = {
            query: (sql: string, params?: any[]) => query(sql, params)
        };

        await hisIntegrationController.pushbackClinicalAndConclusion(
            mockClient,
            testDocNo,
            clinicalData,
            conclusionData,
            'BS_TEST',
            'Bác sĩ Test'
        );

        // 4. Kiểm tra dữ liệu đã đồng bộ về hms_exam
        const examRes = await query(`
            SELECT he_height, he_weight, he_bmi, he_pulse, he_bloodpressure, he_bloodpressurex,
                   he_temperature, he_breathinterval, he_examine, he_parts, he_medical,
                   he_diagnostic, he_icd10, he_remark, he_doctor, he_status
            FROM hms_exam
            WHERE he_docno = $1 AND he_receptidx = $2
        `, [testDocNo, testReceptIdx]);

        assert.equal(examRes.rows.length, 1);
        const exam = examRes.rows[0];
        assert.equal(exam.he_status, 'T');
        assert.equal(Number(exam.he_height), 170);
        assert.equal(Number(exam.he_weight), 65);
        assert.equal(exam.he_bloodpressure, 120);
        assert.equal(exam.he_bloodpressurex, 80);
        assert.equal(exam.he_diagnostic, 'Đủ sức khỏe làm việc');
        assert.equal(exam.he_icd10, 'Z00.0');
        assert.equal(exam.he_doctor, 'BS_TEST');
        assert.match(exam.he_parts, /Nội khoa: Tim đều/);
        assert.match(exam.he_parts, /Mắt: Thị lực 10\/10/);

        // 5. Kiểm tra dữ liệu đã đồng bộ về hms_doc
        const docRes = await query(`
            SELECT hd_status, hd_diagnostic, hd_conclusion, hd_icd, hd_doctor, hd_result, hd_enddate
            FROM hms_doc
            WHERE hd_docno = $1
        `, [testDocNo]);

        assert.equal(docRes.rows.length, 1);
        const doc = docRes.rows[0];
        assert.equal(doc.hd_status, 'T');
        assert.equal(doc.hd_diagnostic, 'Đủ sức khỏe làm việc');
        assert.equal(doc.hd_conclusion, 'Loại 1');
        assert.equal(doc.hd_icd, 'Z00.0');
        assert.equal(doc.hd_doctor, 'BS_TEST');
        assert.ok(doc.hd_enddate !== null);

        // 6. Kiểm tra dữ liệu đã đồng bộ về hms_exm_employee
        const empRes = await query(`
            SELECT hee_status, hee_note
            FROM hms_exm_employee
            WHERE hee_employee_id = $1
        `, [testEmployeeId]);

        assert.equal(empRes.rows.length, 1);
        const emp = empRes.rows[0];
        assert.equal(emp.hee_status, 'T');
        assert.match(emp.hee_note, /Loại 1/);
        assert.match(emp.hee_note, /Đủ sức khỏe làm việc/);

        // 7. Kiểm tra tiền sử hms_disease_hist
        const histRes = await query(`
            SELECT hdh_owner, hdh_family, hdh_drugallergy
            FROM hms_disease_hist
            WHERE hdh_docno = $1
        `, [testDocNo]);

        assert.equal(histRes.rows.length, 1);
        assert.equal(histRes.rows[0].hdh_owner, 'Khỏe mạnh');
        assert.equal(histRes.rows[0].hdh_family, 'Bố tăng huyết áp');

        // 8. Kiểm tra bảng chuyên khoa & kết luận chi tiết hms_exm_conclusion
        const conclRes = await query(`
            SELECT hecl_phanloai, hecl_conclusion, hecl_remark, hecl_mat, hecl_tmh, hecl_noi, hecl_theluc,
                   hecl_height, hecl_weight, hecl_bloodpressure, hecl_bloodpressurex
            FROM hms_exm_conclusion
            WHERE hecl_docno = $1
        `, [testDocNo]);

        assert.equal(conclRes.rows.length, 1);
        const concl = conclRes.rows[0];
        assert.equal(concl.hecl_phanloai, 'Loại 1');
        assert.equal(concl.hecl_conclusion, 'Đủ sức khỏe làm việc');
        assert.equal(concl.hecl_mat, 'Thị lực 10/10 hai mắt');
        assert.equal(concl.hecl_tmh, 'Tai mũi họng bình thường');
        assert.equal(concl.hecl_theluc, 'Thể lực loại 1, da niêm mạc hồng');
        assert.equal(Number(concl.hecl_height), 170);
        assert.equal(Number(concl.hecl_weight), 65);
        assert.equal(concl.hecl_bloodpressure, 120);
        assert.equal(concl.hecl_bloodpressurex, 80);
    } finally {
        // Dọn dẹp dữ liệu test
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_disease_hist WHERE hdh_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exm_employee WHERE hee_employee_id = $1`, [testEmployeeId]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);
    }
});

test('pushbackClinicalAndConclusion handles already closed hms_doc gracefully without errors', async () => {
    const testDocNo = 99988802;
    const testPatientNo = 999889;

    try {
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);

        const nextIdxRes = await query(`SELECT COALESCE(MAX(he_receptidx), 9000000) + 1 AS next_idx FROM hms_exam`);
        const testReceptIdx = parseInt(nextIdxRes.rows[0].next_idx, 10);

        // Đợt khám đã kết thúc ('T')
        await query(`
            INSERT INTO hms_patient (hp_patientno, hp_surname, hp_firstname, hp_sex)
            VALUES ($1, 'TEST', 'DA DONG', 'F')
        `, [testPatientNo]);

        await query(`
            INSERT INTO hms_doc (hd_docno, hd_patientno, hd_status, hd_enddate, hd_diagnostic)
            VALUES ($1, $2, 'T', CURRENT_TIMESTAMP, 'Chẩn đoán cũ')
        `, [testDocNo, testPatientNo]);

        await query(`
            INSERT INTO hms_exam (he_docno, he_patientno, he_deptid, he_roomid, he_receptidx, he_status, he_diagnostic)
            VALUES ($1, $2, 'KKB', 1, $3, 'T', 'Chẩn đoán cũ')
        `, [testDocNo, testPatientNo, testReceptIdx]);

        const mockClient = {
            query: (sql: string, params?: any[]) => query(sql, params)
        };

        // Gọi pushback khi hồ sơ đã đóng
        await hisIntegrationController.pushbackClinicalAndConclusion(
            mockClient,
            testDocNo,
            { examination: { height: '160' } },
            { fitness_class: '2', diagnosis: 'Đã khám xong' },
            'admin',
            'Admin'
        );

        // Đảm bảo không lỗi và chẩn đoán cũ của phiếu đã đóng không bị ghi đè sai
        const docRes = await query(`SELECT hd_status, hd_diagnostic FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        assert.equal(docRes.rows[0].hd_status, 'T');
        assert.equal(docRes.rows[0].hd_diagnostic, 'Chẩn đoán cũ');
    } finally {
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);
    }
});

test('End-to-End: documentsController.updateDocument syncs clinical vitals, lab results and closes open HIS exam', async () => {
    const testDocNo = 99988803;
    const testPatientNo = 999890;
    const testOrderId = 999890;
    let createdMasterId: number | null = null;

    try {
        // Dọn dẹp trước
        await query(`DELETE FROM hms_pacs_result WHERE hpr_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_pacsorderline WHERE hpcl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_pacsorder WHERE hpc_orderid = $1`, [testOrderId]);
        await query(`DELETE FROM hms_testorderline WHERE hpcl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_testorder WHERE hpc_orderid = $1`, [testOrderId]);
        await query(`DELETE FROM hms_disease_hist WHERE hdh_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);

        const nextIdxRes = await query(`SELECT COALESCE(MAX(he_receptidx), 9000000) + 1 AS next_idx FROM hms_exam`);
        const testReceptIdx = parseInt(nextIdxRes.rows[0].next_idx, 10);

        // 1. Tạo đợt khám và phiếu khám trên HIS Core (Status: 'O' - Đang mở)
        await query(`
            INSERT INTO hms_patient (hp_patientno, hp_surname, hp_firstname, hp_sex, hp_birthdate)
            VALUES ($1, 'TEST', 'E2E CONCL', 'M', '1995-05-20')
        `, [testPatientNo]);

        await query(`
            INSERT INTO hms_doc (hd_docno, hd_patientno, hd_status, hd_admitdate, hd_object)
            VALUES ($1, $2, 'O', CURRENT_TIMESTAMP, 7)
        `, [testDocNo, testPatientNo]);

        await query(`
            INSERT INTO hms_exam (he_docno, he_patientno, he_deptid, he_roomid, he_receptidx, he_status)
            VALUES ($1, $2, 'KKB', 1, $3, 'O')
        `, [testDocNo, testPatientNo, testReceptIdx]);

        // 2. Tạo chỉ định LIMS xét nghiệm và PACS trên HIS Core
        await query(`
            INSERT INTO hms_testorder (hpc_orderid, hpc_docno, hpc_patientno, hpc_deptid, hpc_status, hpc_orderdate)
            VALUES ($1, $2, $3, 'CLS', 'O', CURRENT_TIMESTAMP)
        `, [testOrderId, testDocNo, testPatientNo]);

        await query(`
            INSERT INTO hms_testorderline (hpcl_orderid, hpcl_docno, hpcl_itemid, hpcl_status, hpcl_result)
            VALUES ($1, $2, 'TEST_HEMO', 'O', '')
        `, [testOrderId, testDocNo]);

        await query(`
            INSERT INTO hms_pacsorder (hpc_orderid, hpc_docno, hpc_patientno, hpc_deptid, hpc_status, hpc_orderdate)
            VALUES ($1, $2, $3, 'CĐHA', 'O', CURRENT_TIMESTAMP)
        `, [testOrderId, testDocNo, testPatientNo]);

        await query(`
            INSERT INTO hms_pacsorderline (hpcl_orderid, hpcl_docno, hpcl_itemid, hpcl_proomid, hpcl_status)
            VALUES ($1, $2, 'TEST_XRAY', 101, 'O')
        `, [testOrderId, testDocNo]);

        // 3. Tạo hồ sơ KSK tương ứng trong health_check_masters
        const masterRes = await query(`
            INSERT INTO health_check_masters (patient_id, patient_name, doc_no, form_type, signature_status, send_status)
            VALUES ($1, 'TEST E2E CONCL', $2, '3', 'Unsigned', 'Unsent')
            RETURNING id
        `, [String(testPatientNo), String(testDocNo)]);
        createdMasterId = masterRes.rows[0].id;

        await query(`
            INSERT INTO health_check_details (master_id, clinical_data, lab_data, conclusion_data)
            VALUES ($1, '{}', '{}', '{}')
        `, [createdMasterId]);

        // 4. Bác sĩ thực hiện cập nhật và Kết luận KSK qua API updateDocument
        let httpStatusCode = 200;
        let httpResponse: any = null;

        const mockReq: any = {
            params: { id: String(createdMasterId) },
            body: {
                patientId: String(testPatientNo),
                patientName: 'TEST E2E CONCL',
                docNo: String(testDocNo),
                formType: '3',
                dob: '1995-05-20',
                gender: 'Nam',
                clinicalData: {
                    examination: {
                        height: '175',
                        weight: '70',
                        bmi: '22.86',
                        pulse: '72',
                        blood_pressure: '115/75',
                        temperature: '36.6',
                        breathing_rate: '16'
                    },
                    clinical_exam: {
                        internal: 'Khám tim phổi bình thường',
                        eye: 'Mắt phải 10/10, mắt trái 10/10'
                    },
                    lab: {
                        paraclinical_items: [
                            { type: 'XN', service_code: 'TEST_HEMO', value: '145' },
                            { type: 'HA', order_id: testOrderId, service_code: 'TEST_XRAY', conclusion: 'Hình ảnh phổi sáng bình thường' }
                        ]
                    },
                    conclusion: {
                        fitness_class: '1',
                        diagnosis: 'Đủ sức khỏe làm việc',
                        diagnosis_icd10: 'Z00.0',
                        doctor_id: 'BS_TRUONG_DOAN'
                    }
                }
            },
            userId: 'BS_TRUONG_DOAN',
            userName: 'Bác Sĩ Trưởng Đoàn'
        };

        const mockRes: any = {
            status(code: number) {
                httpStatusCode = code;
                return this;
            },
            json(data: any) {
                httpResponse = data;
                return this;
            }
        };

        await documentsController.updateDocument(mockReq, mockRes);

        assert.equal(httpStatusCode, 200);
        assert.equal(httpResponse.success, true);

        // 5. Kiểm tra tính toàn vẹn trên HIS Core sau khi gọi updateDocument:
        // A. Bảng hms_exam: Đã cập nhật đầy đủ và chuyển 'T'
        const examRes = await query(`
            SELECT he_height, he_weight, he_pulse, he_bloodpressure, he_bloodpressurex,
                   he_diagnostic, he_icd10, he_doctor, he_status, he_parts
            FROM hms_exam
            WHERE he_docno = $1
        `, [testDocNo]);
        assert.equal(examRes.rows.length, 1);
        const exam = examRes.rows[0];
        assert.equal(exam.he_status, 'T');
        assert.equal(Number(exam.he_height), 175);
        assert.equal(Number(exam.he_weight), 70);
        assert.equal(exam.he_bloodpressure, 115);
        assert.equal(exam.he_bloodpressurex, 75);
        assert.equal(exam.he_diagnostic, 'Đủ sức khỏe làm việc');
        assert.equal(exam.he_icd10, 'Z00.0');
        assert.equal(exam.he_doctor, 'BS_TRUONG_DOAN');
        assert.match(exam.he_parts, /Khám tim phổi bình thường/);

        // B. Bảng hms_doc: Đã cập nhật và chuyển 'T'
        const docRes = await query(`
            SELECT hd_status, hd_diagnostic, hd_conclusion, hd_icd, hd_doctor
            FROM hms_doc
            WHERE hd_docno = $1
        `, [testDocNo]);
        assert.equal(docRes.rows.length, 1);
        const doc = docRes.rows[0];
        assert.equal(doc.hd_status, 'T');
        assert.equal(doc.hd_diagnostic, 'Đủ sức khỏe làm việc');
        assert.equal(doc.hd_conclusion, 'Loại 1');
        assert.equal(doc.hd_doctor, 'BS_TRUONG_DOAN');

        // C. Bảng hms_testorderline: Đã cập nhật kết quả xét nghiệm
        const labRes = await query(`
            SELECT hpcl_result FROM hms_testorderline WHERE hpcl_docno = $1 AND hpcl_itemid = 'TEST_HEMO'
        `, [testDocNo]);
        assert.equal(labRes.rows.length, 1);
        assert.equal(labRes.rows[0].hpcl_result, '145');

        // D. Bảng hms_pacs_result: Đã cập nhật kết luận CĐHA
        const pacsRes = await query(`
            SELECT hpr_desc FROM hms_pacs_result WHERE hpr_docno = $1 AND hpr_itemid = 'TEST_XRAY' AND LOWER(hpr_name) = 'conclusion'
        `, [testDocNo]);
        assert.equal(pacsRes.rows.length, 1);
        assert.equal(pacsRes.rows[0].hpr_desc, 'Hình ảnh phổi sáng bình thường');

        // E. Bảng hms_exm_conclusion: Đã cập nhật chi tiết chuyên khoa và kết luận
        const conclRes = await query(`
            SELECT hecl_phanloai, hecl_conclusion, hecl_mat, hecl_noi, hecl_height, hecl_weight
            FROM hms_exm_conclusion
            WHERE hecl_docno = $1
        `, [testDocNo]);
        assert.equal(conclRes.rows.length, 1);
        const concl = conclRes.rows[0];
        assert.equal(concl.hecl_phanloai, 'Loại 1');
        assert.equal(concl.hecl_conclusion, 'Đủ sức khỏe làm việc');
        assert.equal(concl.hecl_mat, 'Mắt phải 10/10, mắt trái 10/10');
        assert.equal(Number(concl.hecl_height), 175);
        assert.equal(Number(concl.hecl_weight), 70);
    } finally {
        if (createdMasterId) {
            await query(`DELETE FROM health_check_details WHERE master_id = $1`, [createdMasterId]);
            await query(`DELETE FROM health_check_masters WHERE id = $1`, [createdMasterId]);
        }
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_pacs_result WHERE hpr_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_pacsorderline WHERE hpcl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_pacsorder WHERE hpc_orderid = $1`, [testOrderId]);
        await query(`DELETE FROM hms_testorderline WHERE hpcl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_testorder WHERE hpc_orderid = $1`, [testOrderId]);
        await query(`DELETE FROM hms_disease_hist WHERE hdh_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);
    }
});

test('Two-Way Sync (HIS -> KSK): getHisPatient reads clinical specialties, vitals and conclusion from hms_exm_conclusion', async () => {
    const testDocNo = 99988804;
    const testPatientNo = 999891;

    try {
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);

        // Tạo bệnh nhân & đợt khám trên HIS
        await query(`
            INSERT INTO hms_patient (hp_patientno, hp_surname, hp_firstname, hp_sex, hp_birthdate)
            VALUES ($1, 'TEST', 'DOC CONCL', 'F', '1992-10-10')
        `, [testPatientNo]);

        await query(`
            INSERT INTO hms_doc (hd_docno, hd_patientno, hd_status, hd_admitdate, hd_object)
            VALUES ($1, $2, 'O', CURRENT_TIMESTAMP, 7)
        `, [testDocNo, testPatientNo]);

        // Thêm dữ liệu kết luận chuyên khoa vào hms_exm_conclusion
        await query(`
            INSERT INTO hms_exm_conclusion (
                hecl_docno, hecl_theluc, hecl_noi, hecl_tuanhoan, hecl_hohap,
                hecl_mat, hecl_tmh, hecl_rhm, hecl_ngoai, hecl_dalieu, hecl_phukhoa,
                hecl_phanloai, hecl_conclusion, hecl_remark,
                hecl_height, hecl_weight, hecl_bmi, hecl_pulse, hecl_temperature,
                hecl_bloodpressure, hecl_bloodpressurex, hecl_breathinterval
            ) VALUES (
                $1, 'Thể lực tốt', 'Tim phổi bình thường', 'Nhịp đều', 'Phổi trong',
                'Mắt sáng 10/10', 'TMH tốt', 'Không sâu răng', 'Không dị tật', 'Da bình thường', 'Phụ khoa bình thường',
                'Loại 2', 'Đủ sức khỏe làm việc - Lưu ý khúc xạ', 'Đeo kính khi làm việc',
                162, 52, 19.81, 76, 36.5,
                110, 70, 18
            )
        `, [testDocNo]);

        // Gọi getHisPatient để lấy dữ liệu đồng bộ sang KSK
        let resStatus = 200;
        let resData: any = null;

        const mockReq: any = {
            params: {
                identifier: String(testDocNo)
            },
            query: {}
        };

        const mockRes: any = {
            status(code: number) {
                resStatus = code;
                return this;
            },
            json(data: any) {
                resData = data;
                return this;
            }
        };

        await hisIntegrationController.getHisPatient(mockReq, mockRes);

        assert.equal(resStatus, 200);
        assert.equal(resData.source, 'HIS_DIRECT');
        assert.equal(resData.doc_no, String(testDocNo));

        // Kiểm tra Sinh hiệu từ hms_exm_conclusion
        const exam = resData.clinical_data.examination;
        assert.equal(exam.height, '162');
        assert.equal(exam.weight, '52');
        assert.equal(exam.blood_pressure, '110/70');
        assert.equal(exam.pulse, '76');
        assert.equal(exam.temperature, '36.5');
        assert.equal(exam.breathing_rate, '18');
        assert.equal(exam.physical_summary, 'Thể lực tốt');

        // Kiểm tra Chuyên khoa từ hms_exm_conclusion
        const ce = resData.clinical_data.clinical_exam;
        assert.equal(ce.eye, 'Mắt sáng 10/10');
        assert.equal(ce.ent, 'TMH tốt');
        assert.equal(ce.dental, 'Không sâu răng');
        assert.equal(ce.external, 'Không dị tật');
        assert.equal(ce.dermatology, 'Da bình thường');
        assert.equal(ce.gynecology, 'Phụ khoa bình thường');
        assert.match(ce.internal, /Tim phổi bình thường/);

        // Kiểm tra Kết luận & Phân loại từ hms_exm_conclusion
        const concl = resData.conclusion_data;
        assert.equal(concl.fitness_class, '2');
        assert.equal(concl.diagnosis, 'Đủ sức khỏe làm việc - Lưu ý khúc xạ');
        assert.equal(concl.cac_van_de_luu_y, 'Đeo kính khi làm việc');
    } finally {
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);
    }
});


