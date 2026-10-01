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
            INSERT INTO hms_patient (hp_patientno, hp_patientid, hp_surname, hp_firstname, hp_sex, hp_birthdate)
            VALUES ($1, $2, 'TEST', 'NGUYEN VAN', 'M', '1990-01-01')
        `, [testPatientNo, 'P' + testPatientNo]);

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
            SELECT hecl_phanloai, hecl_conclusion, hecl_remark, hecl_mat, hecl_tmh, hecl_theluc
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
            INSERT INTO hms_patient (hp_patientno, hp_patientid, hp_surname, hp_firstname, hp_sex)
            VALUES ($1, $2, 'TEST', 'DA DONG', 'F')
        `, [testPatientNo, 'P' + testPatientNo]);

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
        try { await query(`DELETE FROM hms_pacs_result WHERE hpr_docno = $1`, [testDocNo]); } catch {}
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
            INSERT INTO hms_patient (hp_patientno, hp_patientid, hp_surname, hp_firstname, hp_sex, hp_birthdate)
            VALUES ($1, $2, 'TEST', 'E2E CONCL', 'M', '1995-05-20')
        `, [testPatientNo, 'P' + testPatientNo]);

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
            SELECT hecl_phanloai, hecl_conclusion, hecl_mat
            FROM hms_exm_conclusion
            WHERE hecl_docno = $1
        `, [testDocNo]);
        assert.equal(conclRes.rows.length, 1);
        const concl = conclRes.rows[0];
        assert.equal(concl.hecl_phanloai, 'Loại 1');
        assert.equal(concl.hecl_conclusion, 'Đủ sức khỏe làm việc');
        assert.equal(concl.hecl_mat, 'Mắt phải 10/10, mắt trái 10/10');
    } finally {
        if (createdMasterId) {
            await query(`DELETE FROM health_check_details WHERE master_id = $1`, [createdMasterId]);
            await query(`DELETE FROM health_check_masters WHERE id = $1`, [createdMasterId]);
        }
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        try { await query(`DELETE FROM hms_pacs_result WHERE hpr_docno = $1`, [testDocNo]); } catch {}
        try { await query(`DELETE FROM hms_pacsorderline WHERE hpcl_docno = $1`, [testDocNo]); } catch {}
        try { await query(`DELETE FROM hms_pacsorder WHERE hpc_orderid = $1`, [testOrderId]); } catch {}
        try { await query(`DELETE FROM hms_testorderline WHERE hpcl_docno = $1`, [testDocNo]); } catch {}
        try { await query(`DELETE FROM hms_testorder WHERE hpc_orderid = $1`, [testOrderId]); } catch {}
        try { await query(`DELETE FROM hms_disease_hist WHERE hdh_docno = $1`, [testDocNo]); } catch {}
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);
    }
});

test('getHisPatient returns 404 when document only exists in HIS and not in health_check_masters (strictly no fallback to HIS)', async () => {
    const testDocNo = 99988804;
    const testPatientNo = 999891;

    try {
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);

        // Tạo bệnh nhân & đợt khám trên HIS
        await query(`
            INSERT INTO hms_patient (hp_patientno, hp_patientid, hp_surname, hp_firstname, hp_sex, hp_birthdate)
            VALUES ($1, $2, 'TEST', 'DOC CONCL', 'F', '1992-10-10')
        `, [testPatientNo, 'P' + testPatientNo]);

        await query(`
            INSERT INTO hms_doc (hd_docno, hd_patientno, hd_status, hd_admitdate, hd_object)
            VALUES ($1, $2, 'O', CURRENT_TIMESTAMP, 7)
        `, [testDocNo, testPatientNo]);

        // Thêm dữ liệu kết luận chuyên khoa vào hms_exm_conclusion
        await query(`
            INSERT INTO hms_exm_conclusion (
                hecl_docno, hecl_theluc, hecl_tuanhoan, hecl_hohap,
                hecl_mat, hecl_tmh, hecl_rhm, hecl_ngoai, hecl_dalieu, hecl_phukhoa,
                hecl_phanloai, hecl_conclusion, hecl_remark
            ) VALUES (
                $1, 'Thể lực tốt', 'Nhịp đều', 'Phổi trong',
                'Mắt sáng 10/10', 'TMH tốt', 'Không sâu răng', 'Không dị tật', 'Da bình thường', 'Phụ khoa bình thường',
                'Loại 2', 'Đủ sức khỏe làm việc - Lưu ý khúc xạ', 'Đeo kính khi làm việc'
            )
        `, [testDocNo]);

        // Thêm bản ghi khám vào hms_exam và cập nhật sinh hiệu
        const nextIdxRes4 = await query(`SELECT COALESCE(MAX(he_receptidx), 9000000) + 1 AS next_idx FROM hms_exam`);
        const testReceptIdx4 = parseInt(nextIdxRes4.rows[0].next_idx, 10);

        await query(`
            INSERT INTO hms_exam (
                he_docno, he_patientno, he_receptidx, he_status, he_deptid, he_roomid
            ) VALUES (
                $1, $2, $3, 'T', 'KKB', 1
            )
        `, [testDocNo, testPatientNo, testReceptIdx4]);

        // Gọi getHisPatient để tra cứu
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

        // Quy tắc mới: Tuyệt đối không fallback sang HIS, trả về 404 khi không tìm thấy trong health_check_masters
        assert.equal(resStatus, 404);
        assert.ok(resData.error.includes('health_check_masters'));
    } finally {
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);
    }
});

test('Pushback: correctly parses Roman numeral Loại IV to Loại 4, truncates >254 chars safely and maps VN specialty aliases', async () => {
    const testDocNo = 99988805;
    const testPatientNo = 999892;

    try {
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);

        await query(`
            INSERT INTO hms_patient (hp_patientno, hp_patientid, hp_surname, hp_firstname, hp_sex, hp_birthdate)
            VALUES ($1, $2, 'TEST', 'ROMAN IV', 'M', '1980-05-20')
        `, [testPatientNo, 'P' + testPatientNo]);

        await query(`
            INSERT INTO hms_doc (hd_docno, hd_patientno, hd_status, hd_admitdate, hd_object)
            VALUES ($1, $2, 'O', CURRENT_TIMESTAMP, 7)
        `, [testDocNo, testPatientNo]);

        const nextIdxRes5 = await query(`SELECT COALESCE(MAX(he_receptidx), 9000000) + 1 AS next_idx FROM hms_exam`);
        const testReceptIdx5 = parseInt(nextIdxRes5.rows[0].next_idx, 10);

        await query(`
            INSERT INTO hms_exam (he_docno, he_patientno, he_receptidx, he_status, he_deptid, he_roomid)
            VALUES ($1, $2, $3, 'O', 'KKB', 1)
        `, [testDocNo, testPatientNo, testReceptIdx5]);

        // Chuỗi siêu dài vượt 254 ký tự
        const longDiagnosis = 'Tăng huyết áp độ 2, theo dõi rối loạn chuyển hóa lipid và tim mạch mạn tính. ' + 'Chi tiết điều trị và theo dõi dài hạn. '.repeat(10);
        const longRemark = 'Bệnh nhân cần ăn nhạt tuyệt đối, uống thuốc điều trị đều đặn mỗi sáng, tập thể dục nhẹ nhàng. ' + 'Lời dặn bổ sung kéo dài. '.repeat(10);

        // Gọi pushback với phân loại 'Loại IV' và các alias tiếng Việt
        await hisIntegrationController.pushbackClinicalAndConclusion(
            { query },
            testDocNo,
            {
                examination: {
                    physical_summary: 'Thể lực trung bình, thể trạng hơi thừa cân nhẹ'
                },
                clinical_exam: {
                    tuan_hoan: 'Nhịp tim nhanh xoang',
                    ho_hap: 'Rì rào phế nang êm dịu',
                    tai_mui_hong: 'Viêm họng mạn tính',
                    rang_ham_mat: 'Sâu răng hàm số 6',
                    noi_tiet: 'Bình thường',
                    co_xuong_khop: 'Thoái hóa khớp gối nhẹ',
                    than_kinh: 'Bình thường',
                    tam_than: 'Tỉnh táo, tiếp xúc tốt',
                    da_lieu: 'Không viêm da',
                    ngoai_khoa: 'Không phát hiện bất thường'
                }
            },
            {
                fitness_class: 'Loại IV',
                diagnosis: longDiagnosis,
                cac_van_de_luu_y: longRemark
            },
            'admin',
            'Administrator'
        );

        // Kiểm tra dữ liệu trong hms_exm_conclusion
        const res = await query(`
            SELECT 
                hecl_phanloai, hecl_conclusion, hecl_remark,
                hecl_theluc, hecl_tuanhoan, hecl_hohap, hecl_tmh, hecl_rhm,
                hecl_noitiet, hecl_coxuongkhop, hecl_thankinh, hecl_tamthan,
                hecl_dalieu, hecl_ngoai
            FROM hms_exm_conclusion
            WHERE hecl_docno = $1
        `, [testDocNo]);

        assert.equal(res.rows.length, 1);
        const row = res.rows[0];

        // 1. Phân loại Loại IV phải được map thành Loại 4 (KHÔNG bị nhầm thành Loại 5)
        assert.equal(row.hecl_phanloai, 'Loại 4');

        // 2. Chuỗi dài đã được cắt an toàn <= 254 ký tự
        assert(row.hecl_conclusion.length <= 254);
        assert(row.hecl_conclusion.startsWith('Tăng huyết áp độ 2'));
        assert(row.hecl_remark.length <= 254);
        assert(row.hecl_remark.startsWith('Bệnh nhân cần ăn nhạt'));

        // 3. Các alias tiếng Việt đã được lưu chính xác vào các cột tương ứng
        assert.equal(row.hecl_theluc, 'Thể lực trung bình, thể trạng hơi thừa cân nhẹ');
        assert.equal(row.hecl_tuanhoan, 'Nhịp tim nhanh xoang');
        assert.equal(row.hecl_hohap, 'Rì rào phế nang êm dịu');
        assert.equal(row.hecl_tmh, 'Viêm họng mạn tính');
        assert.equal(row.hecl_rhm, 'Sâu răng hàm số 6');
        assert.equal(row.hecl_noitiet, 'Bình thường');
        assert.equal(row.hecl_coxuongkhop, 'Thoái hóa khớp gối nhẹ');
        assert.equal(row.hecl_thankinh, 'Bình thường');
        assert.equal(row.hecl_tamthan, 'Tỉnh táo, tiếp xúc tốt');
        assert.equal(row.hecl_dalieu, 'Không viêm da');
        assert.equal(row.hecl_ngoai, 'Không phát hiện bất thường');
    } finally {
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);
    }
});

test('getHisPatient preserves stored KSK clinical and conclusion data untouched (no overwrite from hms_exm_conclusion)', async () => {
    const testDocNo = 99988806;
    const testPatientNo = 999893;
    let masterId: number | null = null;

    try {
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);

        // 1. Tạo dữ liệu trên HIS (đã có kết luận cũ từ HIS)
        await query(`
            INSERT INTO hms_patient (hp_patientno, hp_patientid, hp_surname, hp_firstname, hp_sex, hp_birthdate)
            VALUES ($1, $2, 'TEST', 'MASTER CONCL', 'F', '1988-08-08')
        `, [testPatientNo, 'P' + testPatientNo]);

        await query(`
            INSERT INTO hms_doc (hd_docno, hd_patientno, hd_status, hd_admitdate, hd_object)
            VALUES ($1, $2, 'O', CURRENT_TIMESTAMP, 7)
        `, [testDocNo, testPatientNo]);

        await query(`
            INSERT INTO hms_exm_conclusion (
                hecl_docno, hecl_theluc, hecl_tuanhoan, hecl_hohap,
                hecl_mat, hecl_tmh, hecl_rhm, hecl_noitiet, hecl_coxuongkhop,
                hecl_phanloai, hecl_conclusion, hecl_remark
            ) VALUES (
                $1, 'Thể lực tốt', 'Nhịp đều rõ', 'Phổi sáng',
                'Thị lực tốt 10/10', 'TMH sạch', 'Hàm răng đều', 'Nội tiết ổn định', 'Khớp vận động tốt',
                'Loại 1', 'Đủ sức khỏe làm việc xuất sắc', 'Khám định kỳ hàng năm'
            )
        `, [testDocNo]);

        // 2. Tạo bản ghi đã nhập dữ liệu KSK riêng (không bị HIS đè)
        const masterRes = await query(`
            INSERT INTO health_check_masters (
                patient_id, patient_name, dob, gender, doc_no, his_doc_no, form_type
            ) VALUES (
                $1, 'TEST MASTER CONCL', '1988-08-08', 'Nữ', $2, $2, '3'
            ) RETURNING id
        `, [String(testPatientNo), String(testDocNo)]);
        masterId = masterRes.rows[0].id;

        await query(`
            INSERT INTO health_check_details (
                master_id, clinical_data, conclusion_data
            ) VALUES (
                $1,
                $2,
                $3
            )
        `, [
            masterId,
            JSON.stringify({ examination: { height: '160', weight: '50' } }),
            JSON.stringify({ fitness_class: '1', diagnosis: '[Z00.0] Khám sức khỏe tổng quát' })
        ]);

        // 3. Gọi getHisPatient để lấy dữ liệu
        let resData: any = null;
        const mockReq: any = { params: { identifier: String(testDocNo) }, query: {} };
        const mockRes: any = {
            status: () => mockRes,
            json: (data: any) => { resData = data; return mockRes; }
        };

        await hisIntegrationController.getHisPatient(mockReq, mockRes);

        assert.equal(resData.source, 'HEALTH_CHECK_MASTER');
        assert.equal(resData.doc_no, String(testDocNo));

        // Kiểm tra dữ liệu lâm sàng trong KSK được giữ nguyên
        assert.equal(resData.clinical_data.examination.height, '160');
        assert.equal(resData.clinical_data.examination.weight, '50');

        // Kiểm tra kết luận trong KSK KHÔNG bị HIS đè
        const concl = resData.conclusion_data;
        assert.equal(concl.fitness_class, '1');
        assert.equal(concl.diagnosis, '[Z00.0] Khám sức khỏe tổng quát');

        // Xác nhận trong DB bảng health_check_details không bị UPDATE thay đổi
        const detailDb = await query(`SELECT clinical_data, conclusion_data FROM health_check_details WHERE master_id = $1`, [masterId]);
        const storedConcl = typeof detailDb.rows[0].conclusion_data === 'string' ? JSON.parse(detailDb.rows[0].conclusion_data) : detailDb.rows[0].conclusion_data;
        assert.equal(storedConcl.diagnosis, '[Z00.0] Khám sức khỏe tổng quát');
    } finally {
        if (masterId) {
            await query(`DELETE FROM health_check_details WHERE master_id = $1`, [masterId]);
            await query(`DELETE FROM health_check_masters WHERE id = $1`, [masterId]);
        }
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);
    }
});

test('pushbackClinicalAndConclusion preserves hd_conclusion like "- [Z00.0] Loại II" without generic override', async () => {
    const testDocNo = 99988807;
    const testPatientNo = 999894;
    const mockClient = { query: (sql: string, params?: any[]) => query(sql, params) };

    try {
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);

        await query(`
            INSERT INTO hms_patient (hp_patientno, hp_patientid, hp_surname, hp_firstname, hp_sex, hp_birthdate)
            VALUES ($1, $2, 'TEST', 'CONCL PRESERVE', 'M', '1985-05-05')
        `, [testPatientNo, 'P' + testPatientNo]);

        // Đợt khám có kết luận cụ thể của bác sĩ HIS nhưng chẩn đoán tiếp đón là chung chung
        await query(`
            INSERT INTO hms_doc (hd_docno, hd_patientno, hd_status, hd_diagnostic, hd_conclusion, hd_result, hd_object)
            VALUES ($1, $2, 'T', '[Z00.0] Khám sức khỏe tổng quát', '- [Z00.0] Loại II\r\n', '2', 7)
        `, [testDocNo, testPatientNo]);

        // Gọi pushback với conclusionData rỗng hoặc chỉ có chuỗi chung chung
        await hisIntegrationController.pushbackClinicalAndConclusion(
            mockClient,
            testDocNo,
            { clinical_exam: { eye: 'Thị lực 10/10' } },
            { diagnosis: '[Z00.0] Khám sức khỏe tổng quát', fitness_class: '' },
            'BS_TEST',
            'Bác sĩ Test'
        );

        // Kiểm tra hms_exm_conclusion
        const conclRes = await query(`
            SELECT hecl_docno, hecl_conclusion, hecl_phanloai, hecl_mat
            FROM hms_exm_conclusion
            WHERE hecl_docno = $1
        `, [testDocNo]);

        assert.equal(conclRes.rows.length, 1);
        const conclRow = conclRes.rows[0];
        // Phải bảo tồn kết luận thực tế của bác sĩ: [Z00.0] Loại II (đã dọn dẹp \r\n và dấu -)
        assert.equal(conclRow.hecl_conclusion, '[Z00.0] Loại II');
        // Phải map đúng phân loại từ hd_result = '2'
        assert.equal(conclRow.hecl_phanloai, 'Loại 2');
        assert.equal(conclRow.hecl_mat, 'Thị lực 10/10');
    } finally {
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);
    }
});

test('getHisPatient is strictly read-only and DOES NOT trigger pushback / UPSERT into hms_exm_conclusion or hms_exam', async () => {
    const testDocNo = 99988808;
    const testPatientNo = 999895;

    try {
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);

        await query(`
            INSERT INTO hms_patient (hp_patientno, hp_patientid, hp_surname, hp_firstname, hp_sex, hp_birthdate)
            VALUES ($1, $2, 'TEST', 'AUTO SYNC CONCL', 'F', '1992-12-12')
        `, [testPatientNo, 'P' + testPatientNo]);

        await query(`
            INSERT INTO hms_doc (hd_docno, hd_patientno, hd_status, hd_diagnostic, hd_conclusion, hd_result, hd_object)
            VALUES ($1, $2, 'T', '[Z00.0] Khám sức khỏe', '- [Z00.0] LOẠI III\r\n', '3', 7)
        `, [testDocNo, testPatientNo]);

        const nextIdxRes = await query(`SELECT COALESCE(MAX(he_receptidx), 9000000) + 1 AS next_idx FROM hms_exam`);
        const testReceptIdx = parseInt(nextIdxRes.rows[0].next_idx, 10);

        await query(`
            INSERT INTO hms_exam (he_docno, he_patientno, he_deptid, he_roomid, he_receptidx, he_status, he_parts)
            VALUES ($1, $2, 'KKB', 1, $3, 'T', 'Mắt: 9/10; TMH: Bình thường')
        `, [testDocNo, testPatientNo, testReceptIdx]);

        // Xác nhận ban đầu hms_exm_conclusion chưa hề có dòng nào cho testDocNo
        const beforeRes = await query(`SELECT 1 FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        assert.equal(beforeRes.rows.length, 0);

        // Gọi getHisPatient để tra cứu (quy tắc mới: bệnh nhân chỉ có trên HIS sẽ không tìm thấy trên KSK -> 404)
        let resStatus = 200;
        let resData: any = null;
        const mockReq: any = { params: { identifier: String(testDocNo) }, query: {} };
        const mockRes: any = {
            status: (code: number) => { resStatus = code; return mockRes; },
            json: (data: any) => { resData = data; return mockRes; }
        };

        await hisIntegrationController.getHisPatient(mockReq, mockRes);
        assert.equal(resStatus, 404);
        assert.ok(resData.error.includes('health_check_masters'));

        // Kiểm tra hms_exm_conclusion KHÔNG bị tự động ghi đè hay tạo dòng mới (Read-only)
        const afterRes = await query(`
            SELECT hecl_docno, hecl_conclusion, hecl_phanloai
            FROM hms_exm_conclusion
            WHERE hecl_docno = $1
        `, [testDocNo]);

        assert.equal(afterRes.rows.length, 0, 'getHisPatient phải là thao tác chỉ đọc, không được tự ý ghi vào hms_exm_conclusion');
    } finally {
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);
    }
});

test('pushbackClinicalAndConclusion protects other doctors rooms and past exam dates in hms_exam', async () => {
    const testDocNo = 99988809;
    const testPatientNo = 999896;

    try {
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);

        await query(`
            INSERT INTO hms_patient (hp_patientno, hp_patientid, hp_surname, hp_firstname, hp_sex, hp_birthdate)
            VALUES ($1, $2, 'TEST', 'PRESERVE DOCTOR', 'M', '1985-05-05')
        `, [testPatientNo, 'P' + testPatientNo]);

        await query(`
            INSERT INTO hms_doc (hd_docno, hd_patientno, hd_status, hd_admitdate, hd_object)
            VALUES ($1, $2, 'O', '2026-08-16 07:00:00', 7)
        `, [testDocNo, testPatientNo]);

        // Tạo phiếu khám chuyên khoa Ngoại của BS. pxthu ngày 16/08/2026 với trạng thái 'P'
        const pastExamDate = '2026-08-16 07:33:01';
        const nextIdxRes2 = await query(`SELECT COALESCE(MAX(he_receptidx), 9000000) + 1 AS next_idx FROM hms_exam`);
        const testReceptIdx2 = parseInt(nextIdxRes2.rows[0].next_idx, 10);

        await query(`
            INSERT INTO hms_exam (he_docno, he_patientno, he_deptid, he_roomid, he_receptidx, he_status, he_doctor, he_examdate, he_diagnostic, he_parts)
            VALUES ($1, $2, 'NGOAI', 202, $4, 'P', 'pxthu', $3, 'Chấn thương phần mềm', 'Khám ngoại: Vết thương xây xát nhẹ')
        `, [testDocNo, testPatientNo, pastExamDate, testReceptIdx2]);

        // Cập nhật lại he_examdate và he_diagnostic vì trigger INSERT hms_exam_trg_proc tự động gán CURRENT_TIMESTAMP và reset he_diagnostic khi INSERT
        await query(`
            UPDATE hms_exam
            SET he_examdate = $1, he_diagnostic = 'Chấn thương phần mềm'
            WHERE he_docno = $2 AND he_receptidx = $3
        `, [pastExamDate, testDocNo, testReceptIdx2]);

        // Thực hiện pushback kết luận KSK từ bác sĩ Nội khoa pdnghiep
        const clientWrapper = { query: (s: string, p?: any[]) => query(s, p) };
        await hisIntegrationController.pushbackClinicalAndConclusion(
            clientWrapper,
            testDocNo,
            {
                clinical_exam: {
                    internal: 'Nội khoa: Đau bụng thượng vị, ấn tức'
                }
            },
            {
                fitness_class: 'Loại 1',
                diagnosis: '[K29.1] Viêm dạ dày cấp tính khác'
            },
            'pdnghiep',
            'BS. Phạm Duy Nghiệp'
        );

        // Kiểm tra phiếu khám trong hms_exam:
        // 1. he_doctor vẫn phải là 'pxthu' (không bị đè thành 'pdnghiep')
        // 2. he_examdate vẫn là ngày cũ 2026-08-16 (không bị đè thành CURRENT_TIMESTAMP)
        // 3. he_diagnostic vẫn là chẩn đoán Ngoại khoa gốc
        const examRes = await query(`
            SELECT he_doctor, he_status, to_char(he_examdate, 'YYYY-MM-DD HH24:MI:SS') as exam_date, he_diagnostic, he_parts
            FROM hms_exam
            WHERE he_docno = $1 AND he_receptidx = $2
        `, [testDocNo, testReceptIdx2]);

        assert.equal(examRes.rows.length, 1);
        assert.equal(examRes.rows[0].he_doctor, 'pxthu', 'Bác sĩ gốc pxthu không được bị đè thành pdnghiep');
        assert.equal(examRes.rows[0].exam_date, pastExamDate, 'Ngày khám gốc 2026-08-16 không được bị đè thành CURRENT_TIMESTAMP');
        assert.equal(examRes.rows[0].he_diagnostic, 'Chấn thương phần mềm', 'Chẩn đoán khoa Ngoại không bị đè bởi KSK Nội khoa');

        // Trong khi đó, kết luận KSK vẫn được lưu chuẩn vào hms_exm_conclusion
        const conclRes = await query(`
            SELECT hecl_docno, hecl_phanloai, hecl_conclusion
            FROM hms_exm_conclusion
            WHERE hecl_docno = $1
        `, [testDocNo]);
        assert.equal(conclRes.rows.length, 1);
        assert.equal(conclRes.rows[0].hecl_phanloai, 'Loại 1');
        assert.equal(conclRes.rows[0].hecl_conclusion, '[K29.1] Viêm dạ dày cấp tính khác');
    } finally {
        await query(`DELETE FROM hms_exm_conclusion WHERE hecl_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [testDocNo]);
        await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [testPatientNo]);
    }
});
