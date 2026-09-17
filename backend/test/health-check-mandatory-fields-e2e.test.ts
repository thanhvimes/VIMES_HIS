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
let documentsController: any;
let testMasterId: number | null = null;
const uniqueSuffix = Date.now().toString().slice(-6);

function mockResponse() {
    const res: any = {
        statusCode: 200,
        headers: {},
        data: null,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(payload: any) {
            this.data = payload;
            return this;
        },
        setHeader(name: string, val: any) {
            this.headers[name] = val;
            return this;
        }
    };
    return res;
}

test.before(async () => {
    const dbMod = await import('../src/config/database');
    pool = dbMod.pool;
    const docMod = await import('../src/controllers/health-check/documents');
    // documentsController is exported as an instance or class
    documentsController = (docMod as any).documentsController || new (docMod as any).DocumentsController();
});

test.after(async () => {
    if (pool && testMasterId) {
        try {
            await pool.query('DELETE FROM health_check_details WHERE master_id = $1', [testMasterId]);
            await pool.query('DELETE FROM health_check_masters WHERE id = $1', [testMasterId]);
        } catch (e) {
            console.error('Cleanup error:', e);
        }
    }
    if (pool) {
        await pool.end().catch(() => {});
    }
});

test('1. [updateDocument] Chặn kết luận khi thiếu các trường bắt buộc (isSigning: true)', async () => {
    // 1. Tạo một hồ sơ mẫu thiếu thông tin hành chính & phân loại SK
    const insertRes = await pool.query(`
        INSERT INTO health_check_masters (
            patient_id, patient_name, cccd, dob, gender, doc_no, form_type, signature_status, send_status
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, 'Unsigned', 'Unsent'
        ) RETURNING id
    `, [
        `P${uniqueSuffix}`,
        'nguyễn văn a', // Lỗi: Chưa viết IN HOA có dấu
        '123456789',    // Lỗi: CCCD chưa đủ 12 số
        '1995-01-01',
        'Nam',
        `KSK-TEST-${uniqueSuffix}`,
        '3'
    ]);

    testMasterId = insertRes.rows[0].id;

    await pool.query(`
        INSERT INTO health_check_details (master_id, clinical_data, lab_data, conclusion_data)
        VALUES ($1, $2, $3, $4)
    `, [
        testMasterId,
        JSON.stringify({ address: 'Hà Nội' }), // Thiếu: ethnic, matinh, maxa, ma_nghe, ly_do_vv, doi_tuong, nguon_chi_tra, ngay_vao
        JSON.stringify({}),
        JSON.stringify({}) // Thiếu: fitness_class
    ]);

    // 2. Thử gọi updateDocument với isSigning: true
    const req: any = {
        params: { id: String(testMasterId) },
        body: {
            patientName: 'nguyễn văn a',
            cccd: '123456789',
            dob: '1995-01-01',
            gender: 'Nam',
            formType: '3',
            isSigning: true,
            clinicalData: { address: 'Hà Nội' },
            conclusionData: {}
        },
        userId: 'test_doctor',
        userName: 'Bác sĩ Test'
    };
    const res = mockResponse();

    await documentsController.updateDocument(req, res);

    assert.equal(res.statusCode, 400, 'Phải trả về mã lỗi 400 khi thiếu trường bắt buộc');
    assert.ok(res.data?.error, 'Phải có thông báo lỗi');
    assert.ok(
        res.data.error.includes('Chưa đủ điều kiện kết luận/ký số') || 
        res.data.error.includes('bắt buộc khi khóa/ký số') ||
        res.data.error.includes('bắt buộc'),
        `Thông báo lỗi: ${res.data.error}`
    );
});

test('2. [getTwoTierSignStep1Hash] Chặn tạo hash SHA-256 Bước 1 khi hồ sơ chưa đủ 17 trường bắt buộc', async () => {
    assert.ok(testMasterId, 'Phải có testMasterId từ test trước');

    const req: any = {
        params: { id: String(testMasterId) }
    };
    const res = mockResponse();

    await documentsController.getTwoTierSignStep1Hash(req, res);

    assert.equal(res.statusCode, 400, 'Phải chặn không cho lấy hash Bước 1 khi thiếu trường bắt buộc');
    assert.ok(res.data?.details?.length > 0, 'Phải trả về danh sách chi tiết các trường thiếu');
    assert.ok(res.data.details.some((msg: string) => msg.includes('HO_TEN') || msg.includes('SO_CCCD') || msg.includes('MA_DAN_TOC')), 'Phải phát hiện đúng các trường thiếu');
});

test('3. [applyTwoTierSignStep1] Chặn dán chữ ký Bác sĩ kết luận khi hồ sơ chưa đủ 17 trường bắt buộc', async () => {
    assert.ok(testMasterId, 'Phải có testMasterId từ test trước');

    const req: any = {
        params: { id: String(testMasterId) },
        body: {
            signatureBase64: 'MIID...FakeSignatureBase64...',
            doctorName: 'BS. Nguyễn Văn Nghiệm',
            doctorCode: 'BS01'
        }
    };
    const res = mockResponse();

    await documentsController.applyTwoTierSignStep1(req, res);

    assert.equal(res.statusCode, 400, 'Phải chặn không cho dán chữ ký Bác sĩ khi thiếu trường bắt buộc');
    assert.match(res.data.error, /Chưa đủ điều kiện kết luận\/ký số/);
});

test('4. [updateDocument -> Step 1 Sign] Bổ sung đủ và đúng 17 trường -> Cho phép kết luận và ký số Bước 1 thành công', async () => {
    assert.ok(testMasterId, 'Phải có testMasterId');

    // 1. Cập nhật đầy đủ và chuẩn 17 trường
    const validClinicalData = {
        address: 'Số 12 Phố Huế, Phường Hàng Bài, Hà Nội',
        ethnic: '01',
        matinh_cu_tru: '01',
        maxa_cu_tru: '00001',
        ma_nghe_nghiep: '01',
        ly_do_vv: 'Khám sức khỏe định kỳ',
        ma_cskcb: '37101',
        ma_gtin_cskcb: '8934285008135',
        target_group: '01',
        funding_source: '1',
        loai_hinh_kcb: '01',
        ngay_vao: '2026-09-16'
    };

    const validConclusionData = {
        fitness_class: '1',
        diagnosis: 'K00 - Sức khỏe bình thường'
    };

    const updateReq: any = {
        params: { id: String(testMasterId) },
        body: {
            patientName: 'NGUYỄN VĂN AN', // IN HOA có dấu chuẩn
            cccd: '037095001234',         // Đúng 12 số
            dob: '1995-01-01',
            gender: '1',
            formType: '3',
            isSigning: true,
            clinicalData: validClinicalData,
            conclusionData: validConclusionData
        },
        userId: 'test_doctor',
        userName: 'Bác sĩ Test'
    };
    const updateRes = mockResponse();

    await documentsController.updateDocument(updateReq, updateRes);
    assert.equal(updateRes.statusCode, 200, `Lưu thất bại: ${JSON.stringify(updateRes.data)}`);
    assert.equal(updateRes.data.success, true);

    // 2. Lấy hash Bước 1 (CKS_NGUOI_KET_LUAN)
    const hashReq: any = {
        params: { id: String(testMasterId) }
    };
    const hashRes = mockResponse();
    await documentsController.getTwoTierSignStep1Hash(hashReq, hashRes);

    assert.equal(hashRes.statusCode, 200, `Lấy hash thất bại: ${JSON.stringify(hashRes.data)}`);
    assert.equal(hashRes.data.success, true);
    assert.equal(hashRes.data.step, 1);
    assert.ok(hashRes.data.hashHex, 'Phải có hash SHA-256 Hex');
    assert.ok(hashRes.data.hashBase64, 'Phải có hash SHA-256 Base64');

    // 3. Hoàn tất dán chữ ký Bác sĩ kết luận Bước 1
    const signReq: any = {
        params: { id: String(testMasterId) },
        body: {
            signatureBase64: 'MIID+zCCAuwCCQDgBabc123DoctorSigBase64==',
            doctorName: 'BS. Nguyễn Văn Nghiệm',
            doctorCode: 'BS01'
        }
    };
    const signRes = mockResponse();
    await documentsController.applyTwoTierSignStep1(signReq, signRes);

    assert.equal(signRes.statusCode, 200, `Dán chữ ký thất bại: ${JSON.stringify(signRes.data)}`);
    assert.equal(signRes.data.success, true);
    assert.equal(signRes.data.step, 1);
    assert.equal(signRes.data.hasDoctorSig, true, 'Hồ sơ phải ghi nhận đã có chữ ký Bác sĩ kết luận');
});
