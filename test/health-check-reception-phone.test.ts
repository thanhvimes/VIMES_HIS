import test from 'node:test';
import assert from 'node:assert/strict';
import { query } from '../src/config/database';
import { receptionController } from '../src/controllers/health-check/reception.controller';

test('KSK Reception - Receive employee and store phone into hms_doc.hd_telephone without hp_telephone error', async () => {
    const testEmployeeId = 99999977;
    const testCardId = '999999999999';
    const testPhone = '0987654321';

    // Lấy contract_id hợp lệ có sẵn
    const cRes = await query(`SELECT hec_contract_id FROM hms_exm_contract ORDER BY hec_contract_id DESC LIMIT 1`);
    assert.ok(cRes.rows.length > 0, 'Phải có ít nhất 1 hợp đồng trong DB');
    const testContractId = cRes.rows[0].hec_contract_id;

    try {
        // Dọn dẹp trước khi test
        await query(`DELETE FROM hms_exm_employee WHERE hee_employee_id = $1`, [testEmployeeId]);

        // Tạo nhân viên khám test (chưa tiếp đón, chưa có patientno)
        await query(`
            INSERT INTO hms_exm_employee (
                hee_employee_id, hee_contract_id, hee_cardid, hee_surname, hee_midname, hee_firstname,
                hee_birthdate, hee_sex, hee_phone, hee_address, hee_status, hee_isactive
            ) VALUES (
                $1, $2, $3, 'NGUYEN', 'VAN', 'TEST',
                '1995-05-15', 'M', $4, '123 Test Street, Ha Noi', 'O', 'Y'
            )
        `, [testEmployeeId, testContractId, testCardId, testPhone]);

        // Gọi API receiveContractEmployee
        let resStatus = 200;
        let resData: any = null;

        const mockReq: any = {
            body: {
                employeeId: testEmployeeId,
                deptId: 'KKB',
                roomId: 1,
                roomName: 'Phòng khám KSK Test',
                examType: 'KSK_TEST',
                examDate: '2026-08-28 08:00'
            },
            headers: {
                'x-user-id': 'admin_test'
            }
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

        await receptionController.receiveContractEmployee(mockReq, mockRes);

        console.log('Response from receiveContractEmployee:', resStatus, resData);
        assert.equal(resStatus, 200);
        assert.equal(resData.success, true);
        assert.ok(resData.docNo > 0);

        const createdDocNo = resData.docNo;

        // 1. Kiểm tra hms_doc: Số điện thoại phải được lưu vào hd_telephone
        const docRes = await query(`
            SELECT hd_docno, hd_patientno, hd_telephone, hd_status, hd_object
            FROM hms_doc
            WHERE hd_docno = $1
        `, [createdDocNo]);

        assert.equal(docRes.rows.length, 1);
        const doc = docRes.rows[0];
        assert.equal(doc.hd_telephone, testPhone);

        // 2. Kiểm tra hms_patient: Phải được tạo hợp lệ
        const patRes = await query(`
            SELECT hp_patientno, hp_surname, hp_firstname, hp_sin, hp_sex
            FROM hms_patient
            WHERE hp_patientno = $1
        `, [doc.hd_patientno]);

        assert.equal(patRes.rows.length, 1);
        assert.equal(patRes.rows[0].hp_sin, testCardId);

        // 3. Kiểm tra updateEmployee: Cập nhật SĐT mới
        const newPhone = '0912345678';
        const updateReq: any = {
            params: {
                id: String(testEmployeeId)
            },
            body: {
                name: 'NGUYEN VAN TEST EDIT',
                cardId: testCardId,
                dob: '1995-05-15',
                gender: 'Nam',
                phone: newPhone,
                address: '456 Test Street New'
            },
            headers: {
                'x-user-id': 'admin_test'
            }
        };

        let updateStatus = 200;
        let updateData: any = null;
        const updateRes: any = {
            status(code: number) {
                updateStatus = code;
                return this;
            },
            json(data: any) {
                updateData = data;
                return this;
            }
        };

        await receptionController.updateEmployee(updateReq, updateRes);
        assert.equal(updateStatus, 200);

        // Kiểm tra hd_telephone trong hms_doc đã được cập nhật sang SĐT mới
        const updatedDocRes = await query(`
            SELECT hd_telephone FROM hms_doc WHERE hd_docno = $1
        `, [createdDocNo]);
        assert.equal(updatedDocRes.rows[0].hd_telephone, newPhone);

    } finally {
        // Cleanup dữ liệu test
        const emp = await query(`SELECT hee_docno, hee_patientno FROM hms_exm_employee WHERE hee_employee_id = $1`, [testEmployeeId]);
        if (emp.rows.length > 0) {
            const docNo = emp.rows[0].hee_docno;
            const patNo = emp.rows[0].hee_patientno;
            if (docNo) {
                await query(`DELETE FROM hms_fee WHERE hfe_docno = $1`, [docNo]);
                await query(`DELETE FROM hms_testorderline WHERE hpcl_docno = $1`, [docNo]);
                await query(`DELETE FROM hms_testorder WHERE hpc_docno = $1`, [docNo]);
                await query(`DELETE FROM hms_pacsorderline WHERE hpcl_docno = $1`, [docNo]);
                await query(`DELETE FROM hms_pacsorder WHERE hpc_docno = $1`, [docNo]);
                await query(`DELETE FROM hms_exam WHERE he_docno = $1`, [docNo]);
                await query(`DELETE FROM hms_doc WHERE hd_docno = $1`, [docNo]);
            }
            if (patNo) {
                await query(`DELETE FROM hms_patient WHERE hp_patientno = $1`, [patNo]);
            }
        }
        await query(`DELETE FROM health_check_details WHERE master_id IN (SELECT id FROM health_check_masters WHERE his_employee_id = $1::varchar)`, [String(testEmployeeId)]);
        await query(`DELETE FROM health_check_masters WHERE his_employee_id = $1::varchar`, [String(testEmployeeId)]);
        await query(`DELETE FROM hms_exm_employee WHERE hee_employee_id = $1`, [testEmployeeId]);
    }
});
