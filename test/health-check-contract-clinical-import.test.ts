import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });
if (process.env.DB_HOST === '192.168.0.200' || !process.env.DB_HOST) {
    process.env.DB_HOST = '14.177.232.29';
    process.env.DB_PORT = '8050';
    process.env.DB_NAME = 'vimes_ym';
}

let pool: any;
let employeesController: any;
let receptionController: any;
let testContractId: number = 0;
const testUniqueSuffix = Date.now().toString().slice(-6);

test.before(async () => {
    const dbMod = await import('../src/config/database');
    pool = dbMod.pool;
    const employeesMod = await import('../src/controllers/health-check/employees.controller');
    employeesController = employeesMod.employeesController;
    const receptionMod = await import('../src/controllers/health-check/reception.controller');
    receptionController = receptionMod.receptionController;

    // Lấy hợp đồng KSK hợp lệ để test
    const contractRes = await pool.query(`
        SELECT hec_contract_id 
        FROM hms_exm_contract 
        WHERE hec_status != 'A' 
        ORDER BY hec_contract_id DESC 
        LIMIT 1
    `);
    if (contractRes.rows.length > 0) {
        testContractId = contractRes.rows[0].hec_contract_id;
    } else {
        const anyContract = await pool.query('SELECT hec_contract_id FROM hms_exm_contract ORDER BY hec_contract_id DESC LIMIT 1');
        testContractId = anyContract.rows[0].hec_contract_id;
    }
    console.log(`[TEST SETUP] Using contract ID: ${testContractId}`);
});

test.after(async () => {
    // Dọn dẹp dữ liệu test
    if (pool && testContractId) {
        try {
            await pool.query(`
                DELETE FROM hms_exm_employee 
                WHERE hee_contract_id = $1 AND (hee_id LIKE 'CLN%' OR hee_id LIKE 'TRAD%' OR hee_id LIKE 'PHN%')
            `, [testContractId]);
        } catch (e) {
            console.error('[TEST TEARDOWN] Error cleaning up test employees:', e);
        }
        await pool.end().catch(() => {});
    }
});

test('1. Import nhân viên KSK kèm đầy đủ Thể lực, Chuyên khoa lâm sàng và Phân loại/Kết luận', async () => {
    const testCode1 = `CLN1_${testUniqueSuffix.slice(-4)}`;
    const testCode2 = `CLN2_${testUniqueSuffix.slice(-4)}`;

    const employeesPayload = [
        {
            code: testCode1,
            name: `Nguyễn Văn Test Lâm Sàng ${testUniqueSuffix}`,
            birth_date: '15/05/1990',
            sex: 'Nam',
            doc_no: `037095${testUniqueSuffix}`,
            phone: '0912345678',
            note: 'Nhân viên test có kết quả khám',
            // Thể lực & sinh hiệu
            height: 172,
            weight: 68,
            blood_pressure: '120/80',
            pulse: 75,
            temperature: 36.5,
            respiration: 18,
            the_luc: 'Thể lực tốt',
            // Lâm sàng chuyên khoa
            noi_khoa: 'Tim đều, T1 T2 rõ, phổi trong',
            ngoai_khoa: 'Bình thường, không sẹo mổ cũ',
            da_lieu: 'Không phát hiện bệnh da liễu',
            san_phu_khoa: '',
            mat: 'Mắt phải 10/10, Mắt trái 10/10',
            tai_mui_hong: 'Màng nhĩ sáng, họng sạch',
            rang_ham_mat: 'Không sâu răng, cao răng độ 1',
            // Phân loại & kết luận
            phan_loai_sk: 'Loại 1',
            ket_luan: 'Đủ sức khỏe làm việc',
            benh_tat_luu_y: 'Duy trì chế độ dinh dưỡng hợp lý'
        },
        {
            code: testCode2,
            name: `Trần Thị Test Lâm Sàng Nữ ${testUniqueSuffix}`,
            birth_date: '20/10/1988',
            sex: 'Nữ',
            doc_no: `038188${testUniqueSuffix}`,
            phone: '0987654321',
            note: 'Nhân viên nữ test',
            // Thể lực & sinh hiệu
            height: 158,
            weight: 50,
            blood_pressure: '110/70',
            pulse: 78,
            temperature: 36.6,
            respiration: 19,
            the_luc: 'Thể lực trung bình',
            // Lâm sàng chuyên khoa
            noi_khoa: 'Tuần hoàn hô hấp bình thường',
            ngoai_khoa: 'Bình thường',
            da_lieu: 'Bình thường',
            san_phu_khoa: 'Viêm âm đạo nhẹ',
            mat: 'Mắt phải 9/10, Mắt trái 9/10',
            tai_mui_hong: 'Bình thường',
            rang_ham_mat: 'Bình thường',
            // Phân loại & kết luận
            phan_loai_sk: 'Loại 2',
            ket_luan: 'Đủ sức khỏe làm việc',
            benh_tat_luu_y: 'Điều trị viêm phụ khoa theo đơn'
        }
    ];

    let statusCode = 200;
    let jsonResponse: any = null;

    const mockReq: any = {
        params: { id: String(testContractId) },
        body: { employees: employeesPayload }
    };
    const mockRes: any = {
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(data: any) {
            jsonResponse = data;
            return this;
        }
    };

    await employeesController.importEmployees(mockReq, mockRes);
    assert.equal(statusCode, 200);
    assert.equal(jsonResponse.success, true);
    assert.equal(jsonResponse.count, 2);

    // Kiểm tra trực tiếp trên DB `hms_exm_employee`
    const dbCheck = await pool.query(`
        SELECT 
            hee_id, hee_height, hee_weight, hee_bloodpressure, hee_pulse,
            hee_temperature, hee_respiration, hee_clinical_data, hee_conclusion_data,
            hee_conclusion, hee_comment
        FROM hms_exm_employee 
        WHERE hee_contract_id = $1 AND hee_id = $2
    `, [testContractId, testCode1]);

    assert.equal(dbCheck.rows.length, 1);
    const empRow = dbCheck.rows[0];
    assert.equal(parseFloat(empRow.hee_height), 172);
    assert.equal(parseFloat(empRow.hee_weight), 68);
    assert.equal(empRow.hee_bloodpressure, '120/80');
    assert.equal(empRow.hee_pulse, 75);
    assert.equal(empRow.hee_temperature, 36.5);
    assert.equal(empRow.hee_respiration, 18);
    assert.equal(empRow.hee_conclusion, '1'); // Phân loại sức khỏe loại 1
    assert.equal(empRow.hee_comment, 'Đủ sức khỏe làm việc');

    // Kiểm tra cấu trúc JSONB
    assert.ok(empRow.hee_clinical_data);
    assert.equal(empRow.hee_clinical_data.examination.height, '172');
    assert.equal(empRow.hee_clinical_data.examination.blood_pressure, '120/80');
    assert.equal(empRow.hee_clinical_data.examination.physical_summary, 'Thể lực tốt');
    assert.equal(empRow.hee_clinical_data.clinical_exam.internal, 'Tim đều, T1 T2 rõ, phổi trong');
    assert.equal(empRow.hee_clinical_data.clinical_exam.kq_tim_mach, 'Tim đều, T1 T2 rõ, phổi trong');
    assert.equal(empRow.hee_clinical_data.clinical_exam.kq_ngoai_khoa, 'Bình thường, không sẹo mổ cũ');
    assert.equal(empRow.hee_clinical_data.clinical_exam.kq_da_lieu, 'Không phát hiện bệnh da liễu');
    assert.equal(empRow.hee_clinical_data.clinical_exam.ent, 'Màng nhĩ sáng, họng sạch');
    assert.equal(empRow.hee_clinical_data.clinical_exam.benh_tai_mui_hong, 'Màng nhĩ sáng, họng sạch');
    assert.equal(empRow.hee_clinical_data.clinical_exam.kq_tai_mui_hong, 'Màng nhĩ sáng, họng sạch');
    assert.equal(empRow.hee_clinical_data.clinical_exam.dental, 'Không sâu răng, cao răng độ 1');
    assert.equal(empRow.hee_clinical_data.clinical_exam.benh_rang_ham_mat, 'Không sâu răng, cao răng độ 1');
    assert.equal(empRow.hee_clinical_data.clinical_exam.eye, 'Mắt phải 10/10, Mắt trái 10/10');
    assert.equal(empRow.hee_clinical_data.clinical_exam.khong_kinh_mat_phai, '10/10');
    assert.equal(empRow.hee_clinical_data.clinical_exam.khong_kinh_mat_trai, '10/10');

    // Kiểm tra specialty_metadata sinh ra đúng chuẩn
    assert.ok(empRow.hee_clinical_data.specialty_metadata);
    assert.equal(empRow.hee_clinical_data.specialty_metadata.internal.status, 'ĐÃ_KHÁM');
    assert.equal(empRow.hee_clinical_data.specialty_metadata.surgery.status, 'ĐÃ_KHÁM');
    assert.equal(empRow.hee_clinical_data.specialty_metadata.ent.status, 'ĐÃ_KHÁM');
    assert.equal(empRow.hee_clinical_data.specialty_metadata.dental.status, 'ĐÃ_KHÁM');
    assert.equal(empRow.hee_clinical_data.specialty_metadata.dermatology.status, 'ĐÃ_KHÁM');
    assert.equal(empRow.hee_clinical_data.specialty_metadata.eye.status, 'ĐÃ_KHÁM');

    assert.ok(empRow.hee_conclusion_data);
    assert.equal(String(empRow.hee_conclusion_data.fitness_class), '1');
    assert.equal(empRow.hee_conclusion_data.diagnosis, 'Đủ sức khỏe làm việc');
    assert.equal(empRow.hee_conclusion_data.cac_van_de_luu_y, 'Duy trì chế độ dinh dưỡng hợp lý');

    // Kiểm tra nhân viên nữ có khám sản phụ khoa
    const dbCheckFemale = await pool.query(`
        SELECT hee_clinical_data, hee_conclusion_data
        FROM hms_exm_employee 
        WHERE hee_contract_id = $1 AND hee_id = $2
    `, [testContractId, testCode2]);
    assert.equal(dbCheckFemale.rows[0].hee_clinical_data.clinical_exam.gynecology, 'Viêm âm đạo nhẹ');
    assert.equal(String(dbCheckFemale.rows[0].hee_conclusion_data.fitness_class), '2');
});

test('2. getContractEmployees trả về đầy đủ cờ has_clinical_data và thông số khám', async () => {
    const testCode1 = `CLN1_${testUniqueSuffix.slice(-4)}`;

    let statusCode = 200;
    let jsonResponse: any = null;

    const mockReq: any = {
        params: { id: String(testContractId) }
    };
    const mockRes: any = {
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(data: any) {
            jsonResponse = data;
            return this;
        }
    };

    await employeesController.getContractEmployees(mockReq, mockRes);
    assert.equal(statusCode, 200);
    assert.ok(Array.isArray(jsonResponse));

    const foundEmp = jsonResponse.find((e: any) => e.code === testCode1);
    assert.ok(foundEmp);
    assert.equal(foundEmp.has_clinical_data, true);
    assert.equal(parseFloat(foundEmp.height), 172);
    assert.equal(parseFloat(foundEmp.weight), 68);
    assert.equal(foundEmp.blood_pressure, '120/80');
    assert.equal(foundEmp.conclusion, '1');
    assert.equal(foundEmp.comment, 'Đủ sức khỏe làm việc');
    assert.ok(foundEmp.clinical_data);
    assert.ok(foundEmp.conclusion_data);
});

test('3. Tiếp đón nhân viên đã import KQ lâm sàng -> tự động đẩy vào health_check_details & HIS Core', async () => {
    const testCode1 = `CLN1_${testUniqueSuffix.slice(-4)}`;

    // Lấy thông tin nhân viên vừa import
    const empRes = await pool.query(`
        SELECT * FROM hms_exm_employee 
        WHERE hee_contract_id = $1 AND hee_id = $2
    `, [testContractId, testCode1]);
    assert.equal(empRes.rows.length, 1);
    const emp = empRes.rows[0];

    // Lấy room từ hms_roomlist để tiếp đón
    const roomRes = await pool.query(`SELECT hrl_id FROM hms_roomlist WHERE hrl_active = 'Y' LIMIT 1`);
    const roomId = roomRes.rows.length > 0 ? roomRes.rows[0].hrl_id : 1;

    let statusCode = 200;
    let jsonResponse: any = null;

    const mockReq: any = {
        body: {
            employeeId: emp.hee_employee_id,
            roomId: roomId
        },
        user: { username: 'test_admin', fullName: 'Bác sĩ Quản trị' }
    };
    const mockRes: any = {
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(data: any) {
            jsonResponse = data;
            return this;
        }
    };

    await receptionController.receiveContractEmployee(mockReq, mockRes);
    assert.equal(statusCode, 200);
    assert.equal(jsonResponse.success, true);
    assert.ok(jsonResponse.docNo);

    const docNo = jsonResponse.docNo;
    console.log(`[TEST RECEPTION] Received docNo: ${docNo}`);

    // Kiểm tra bảng `health_check_details`
    const hcdCheck = await pool.query(`
        SELECT d.clinical_data, d.conclusion_data 
        FROM health_check_details d
        JOIN health_check_masters m ON m.id = d.master_id
        WHERE m.his_doc_no = $1::varchar
    `, [String(docNo)]);
    assert.equal(hcdCheck.rows.length, 1);
    assert.equal(parseFloat(hcdCheck.rows[0].clinical_data.examination.height), 172);
    assert.equal(hcdCheck.rows[0].conclusion_data.diagnosis, 'Đủ sức khỏe làm việc');

    // Kiểm tra bảng HIS Core `hms_exm_conclusion`
    const conclCheck = await pool.query(`
        SELECT 
            hecl_theluc, hecl_phanloai, hecl_conclusion, hecl_remark,
            hecl_tuanhoan, hecl_hohap, hecl_dalieu, hecl_mat, hecl_tmh, hecl_rhm
        FROM hms_exm_conclusion 
        WHERE hecl_docno = $1
    `, [docNo]);
    assert.equal(conclCheck.rows.length, 1);
    const conclRow = conclCheck.rows[0];
    assert.equal(conclRow.hecl_theluc, 'Thể lực tốt');
    assert.ok(conclRow.hecl_phanloai === 'Loại 1' || conclRow.hecl_phanloai === '1');
    assert.equal(conclRow.hecl_conclusion, 'Đủ sức khỏe làm việc');
    assert.equal(conclRow.hecl_remark, 'Duy trì chế độ dinh dưỡng hợp lý');
    assert.equal(conclRow.hecl_tuanhoan, 'Tim đều, T1 T2 rõ, phổi trong');
    assert.equal(conclRow.hecl_dalieu, 'Không phát hiện bệnh da liễu');
    assert.equal(conclRow.hecl_mat, 'Mắt phải 10/10, Mắt trái 10/10');
    assert.equal(conclRow.hecl_tmh, 'Màng nhĩ sáng, họng sạch');
    assert.equal(conclRow.hecl_rhm, 'Không sâu răng, cao răng độ 1');

    // Kiểm tra `hms_exam` trạng thái 'T'
    const examCheck = await pool.query(`
        SELECT he_status FROM hms_exam WHERE he_docno = $1
    `, [docNo]);
    assert.equal(examCheck.rows.length, 1);
    assert.equal(examCheck.rows[0].he_status, 'T');

    // Kiểm tra `hms_exm_employee` trạng thái 'T' và docno
    const empFinalCheck = await pool.query(`
        SELECT hee_status, hee_docno FROM hms_exm_employee WHERE hee_employee_id = $1
    `, [emp.hee_employee_id]);
    assert.equal(empFinalCheck.rows[0].hee_status, 'T');
    assert.equal(empFinalCheck.rows[0].hee_docno, docNo);
});

test('4. Tương thích ngược: Import nhân viên truyền thống (không có KQ lâm sàng)', async () => {
    const testCodeTrad = `TRAD_${testUniqueSuffix.slice(-4)}`;

    const employeesPayload = [
        {
            code: testCodeTrad,
            name: `Bệnh Nhân Truyền Thống ${testUniqueSuffix}`,
            birth_date: '01/01/1995',
            sex: 'Nam',
            doc_no: `001095${testUniqueSuffix}`,
            phone: '0901234567',
            note: 'Chỉ có thông tin hành chính'
            // Không truyền bất kỳ trường lâm sàng/thể lực/kết luận nào
        }
    ];

    let statusCode = 200;
    let jsonResponse: any = null;

    const mockReq: any = {
        params: { id: String(testContractId) },
        body: { employees: employeesPayload }
    };
    const mockRes: any = {
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(data: any) {
            jsonResponse = data;
            return this;
        }
    };

    await employeesController.importEmployees(mockReq, mockRes);
    assert.equal(statusCode, 200);
    assert.equal(jsonResponse.success, true);

    // Kiểm tra DB
    const dbCheck = await pool.query(`
        SELECT hee_height, hee_clinical_data, hee_conclusion_data 
        FROM hms_exm_employee 
        WHERE hee_contract_id = $1 AND hee_id = $2
    `, [testContractId, testCodeTrad]);

    assert.equal(dbCheck.rows.length, 1);
    assert.equal(dbCheck.rows[0].hee_height, null);
    assert.equal(dbCheck.rows[0].hee_clinical_data, null);
    assert.equal(dbCheck.rows[0].hee_conclusion_data, null);
});

test('5. Bảo vệ chống lệch cột: Số điện thoại (0912345678) không bao giờ bị gán nhầm vào TMH hoặc chuyên khoa', async () => {
    const testCodePhone = `PHN_${testUniqueSuffix.slice(-4)}`;

    const employeesPayload = [
        {
            code: testCodePhone,
            name: `Bệnh Nhân Test Số ĐT ${testUniqueSuffix}`,
            birth_date: '15/05/1990',
            sex: 'Nam',
            doc_no: `037088${testUniqueSuffix}`,
            phone: '0912345678', // Số điện thoại có chứa chuỗi con 'ent' (di-ent-hoai)
            note: 'Kiểm tra chống nhiễm số điện thoại vào TMH',
            height: 170,
            weight: 68,
            blood_pressure: '120/80',
            pulse: 75,
            the_luc: 'Thể lực tốt',
            noi_khoa: 'Tim đều, phổi trong',
            ngoai_khoa: 'Bình thường',
            da_lieu: 'Bình thường',
            mat: 'Mắt phải 10/10, Mắt trái 10/10',
            tai_mui_hong: 'Tai mũi họng bình thường',
            rang_ham_mat: 'Không sâu răng, không viêm lợi',
            phan_loai_sk: 'Loại 1',
            ket_luan: 'Đủ sức khỏe làm việc'
        }
    ];

    let statusCode = 200;
    let jsonResponse: any = null;

    const mockReq: any = {
        params: { id: String(testContractId) },
        body: { employees: employeesPayload }
    };
    const mockRes: any = {
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(data: any) {
            jsonResponse = data;
            return this;
        }
    };

    await employeesController.importEmployees(mockReq, mockRes);
    assert.equal(statusCode, 200);
    assert.equal(jsonResponse.success, true);

    const dbCheck = await pool.query(`
        SELECT hee_phone, hee_clinical_data 
        FROM hms_exm_employee 
        WHERE hee_contract_id = $1 AND hee_id = $2
    `, [testContractId, testCodePhone]);

    assert.equal(dbCheck.rows.length, 1);
    const row = dbCheck.rows[0];

    // Số điện thoại phải nằm đúng ở trường phone
    assert.equal(row.hee_phone, '0912345678');

    // Chuyên khoa TMH TUYỆT ĐỐI không chứa số điện thoại
    const clinExam = row.hee_clinical_data.clinical_exam;
    assert.equal(clinExam.ent, 'Tai mũi họng bình thường');
    assert.equal(clinExam.benh_tai_mui_hong, 'Tai mũi họng bình thường');
    assert.equal(clinExam.kq_tai_mui_hong, 'Tai mũi họng bình thường');
    assert.notEqual(clinExam.ent, '0912345678');
    assert.notEqual(clinExam.benh_tai_mui_hong, '0912345678');

    // Các chuyên khoa khác cũng không bị nhiễm
    assert.equal(clinExam.internal, 'Tim đều, phổi trong');
    assert.equal(clinExam.kq_tim_mach, 'Tim đều, phổi trong');
    assert.equal(clinExam.kq_ngoai_khoa, 'Bình thường');
    assert.equal(clinExam.kq_da_lieu, 'Bình thường');
    assert.equal(clinExam.dental, 'Không sâu răng, không viêm lợi');
    assert.equal(clinExam.eye, 'Mắt phải 10/10, Mắt trái 10/10');

    // Metadata phải chuẩn ĐÃ_KHÁM cho cả 6 chuyên khoa của nam giới
    const meta = row.hee_clinical_data.specialty_metadata;
    assert.equal(meta.physical.status, 'ĐÃ_KHÁM');
    assert.equal(meta.internal.status, 'ĐÃ_KHÁM');
    assert.equal(meta.surgery.status, 'ĐÃ_KHÁM');
    assert.equal(meta.ent.status, 'ĐÃ_KHÁM');
    assert.equal(meta.dental.status, 'ĐÃ_KHÁM');
    assert.equal(meta.dermatology.status, 'ĐÃ_KHÁM');
    assert.equal(meta.eye.status, 'ĐÃ_KHÁM');
});

