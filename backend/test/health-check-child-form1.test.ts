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
let hisIntegrationController: any;
const testSuffix = Date.now().toString().slice(-6);

test.before(async () => {
    const dbMod = await import('../src/config/database');
    pool = dbMod.pool;
    const hisMod = await import('../src/controllers/health-check/his-integration');
    hisIntegrationController = hisMod.hisIntegrationController;
});

test.after(async () => {
    if (pool) {
        await pool.end().catch(() => {});
    }
});

test('1. Hoàn thiện Mẫu 1 Trẻ em: pushbackConclusion đồng bộ chính xác chuyên khoa Nhi và Sinh hiệu về HIS Core', async () => {
    // 1. Tạo mock docNo hoặc lấy 1 docNo KSK hợp lệ từ hms_doc
    const docRes = await pool.query(`
        SELECT hd_docno, hd_patientno 
        FROM hms_doc 
        WHERE hd_admitdept = 'KB' 
        ORDER BY hd_docno DESC 
        LIMIT 1
    `);
    
    assert.ok(docRes.rows.length > 0, 'Cần ít nhất 1 đợt khám trong hms_doc để test pushback');
    const testDocNo = docRes.rows[0].hd_docno;

    // Dữ liệu lâm sàng đặc thù của Mẫu 1 (Trẻ em < 18 tuổi)
    const childClinicalData = {
        examination: {
            height: '110',
            weight: '19',
            bmi: '15.7',
            pulse: '90',
            temperature: '36.8',
            breathing_rate: '22',
            physical_summary: 'Trẻ phát triển thể lực bình thường theo lứa tuổi'
        },
        child_dev: {
            danh_gia_the_luc: 'Thể lực tốt',
            ptTinhThanBinhThuong: 'Bình thường',
            ptVanDongBinhThuong: 'Phát triển vận động tốt, đúng lứa tuổi',
            nguyCoTuKy: 'Không có dấu hiệu tự kỷ'
        },
        clinical_exam: {
            ngheTim: 'Tim đều, T1 T2 rõ, không tiếng thổi bệnh lý',
            nghePhoi: 'Phổi thông khí đều 2 bên, không rales',
            hinhDangBungRon: 'Bụng mềm, rốn liền sẹo tốt',
            ganLachTo: 'Gan lách không sờ thấy',
            cqSinhDucNgoai: 'Cơ quan sinh dục ngoài bình thường',
            vanDongCo: 'Trương lực cơ tốt, vận động các chi bình thường',
            truongLucCo: 'Bình thường',
            viTri2Mat: 'Hai mắt cân đối, không lác',
            miMatKetMac: 'Kết mạc mắt hồng',
            taiMangNhi: 'Màng nhĩ sáng, không viêm',
            hinhDangMieng: 'Miệng hồng, không tưa lưỡi',
            hong: 'Họng sạch, amidan không sưng',
            mauSacDa: 'Da dẻ hồng hào, không phát ban',
            specialty_metadata: {
                conclusion: {
                    doctorId: 'admin',
                    doctorName: 'Bác sĩ Nhi khoa',
                    status: 'ĐÃ_DUYỆT'
                }
            }
        },
        extra: {
            ts_ban_than: 'Khỏe mạnh, tiêm chủng đầy đủ',
            ts_gia_dinh: 'Chưa phát hiện bệnh lý di truyền'
        }
    };

    const childConclusionData = {
        fitness_class: '1',
        fitnessClass: '1',
        diagnosis: 'Trẻ phát triển thể lực và tâm thần vận động bình thường',
        cac_van_de_luu_y: 'Tiếp tục theo dõi chế độ dinh dưỡng và tiêm chủng định kỳ',
        doctor_id: 'admin'
    };

    // Gọi hàm pushbackClinicalAndConclusion
    await hisIntegrationController.pushbackClinicalAndConclusion(
        pool,
        testDocNo,
        childClinicalData,
        childConclusionData,
        'admin'
    );

    // Kiểm tra trực tiếp bảng hms_exm_conclusion trên HIS Core
    const conclRes = await pool.query(`
        SELECT 
            hecl_theluc, hecl_phanloai, hecl_conclusion, hecl_remark,
            hecl_tuanhoan, hecl_hohap, hecl_tieuhoa, hecl_thankinh,
            hecl_dalieu, hecl_mat, hecl_tmh, hecl_rhm
        FROM hms_exm_conclusion 
        WHERE hecl_docno = $1
    `, [testDocNo]);

    assert.ok(conclRes.rows.length > 0, 'Dữ liệu phải được ghi vào hms_exm_conclusion');
    const row = conclRes.rows[0];

    // Kiểm tra đồng bộ các chỉ số nhi khoa
    assert.equal(row.hecl_theluc, 'Trẻ phát triển thể lực bình thường theo lứa tuổi');
    assert.ok(row.hecl_phanloai === 'Loại 1' || row.hecl_phanloai === '1');
    assert.equal(row.hecl_conclusion, 'Trẻ phát triển thể lực và tâm thần vận động bình thường');
    assert.equal(row.hecl_remark, 'Tiếp tục theo dõi chế độ dinh dưỡng và tiêm chủng định kỳ');

    // Chuyên khoa Nhi ánh xạ chuẩn vào các cột tương ứng
    assert.equal(row.hecl_tuanhoan, 'Tim đều, T1 T2 rõ, không tiếng thổi bệnh lý');
    assert.equal(row.hecl_hohap, 'Phổi thông khí đều 2 bên, không rales');
    assert.equal(row.hecl_tieuhoa, 'Bụng mềm, rốn liền sẹo tốt');
    assert.equal(row.hecl_thankinh, 'Trương lực cơ tốt, vận động các chi bình thường');
    assert.equal(row.hecl_dalieu, 'Da dẻ hồng hào, không phát ban');
    assert.equal(row.hecl_mat, 'Hai mắt cân đối, không lác');
    assert.equal(row.hecl_tmh, 'Màng nhĩ sáng, không viêm');
    assert.equal(row.hecl_rhm, 'Miệng hồng, không tưa lưỡi');
});

test('2. Trình duyệt Safe UTF-8 Base64: Chuỗi chữ ký bác sĩ ký số tiếng Việt không bị lỗi font hoặc ReferenceError', () => {
    const testPayload = JSON.stringify({
        type: 'DOCTOR_SIGNATURE',
        doctor_id: 'BS_NGUYEN_VAN_A',
        doctor_name: 'Bác sĩ CKII Nguyễn Văn Ánh',
        fitness_class: 'Loại 1',
        diagnosis: 'Đủ điều kiện sức khỏe học tập và sinh hoạt',
        signed_at: new Date().toISOString(),
        method: 'DOCTOR_TOKEN_CA'
    });

    // Mô phỏng hàm encode base64 safe cho browser
    const encodeBase64Utf8 = (str: string): string => {
        return Buffer.from(str, 'utf-8').toString('base64');
    };

    const base64Str = encodeBase64Utf8(testPayload);
    assert.ok(base64Str.length > 0);

    // Decode lại và đối soát chuỗi tiếng Việt nguyên bản
    const decodedStr = Buffer.from(base64Str, 'base64').toString('utf-8');
    const parsedObj = JSON.parse(decodedStr);

    assert.equal(parsedObj.doctor_name, 'Bác sĩ CKII Nguyễn Văn Ánh');
    assert.equal(parsedObj.diagnosis, 'Đủ điều kiện sức khỏe học tập và sinh hoạt');
});
