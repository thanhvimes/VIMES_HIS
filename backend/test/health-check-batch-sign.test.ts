import test from 'node:test';
import assert from 'node:assert/strict';
import { query } from '../src/config/database';
import { documentsController } from '../src/controllers/health-check/documents';
import { healthCheckTwoTierSigner } from '../src/services/health-check-two-tier-signer.service';

function createMockResponse() {
    const res: any = {
        statusCode: 200,
        data: null,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(payload: any) {
            this.data = payload;
            return this;
        }
    };
    return res;
}

test('Kiểm thử luồng ký số hàng loạt: Ký kết luận (Doctor) -> Ký đơn vị (Unit) -> Kiểm tra tính toàn vẹn 2 cấp độ', async () => {
    const testDocNos = [99992001, 99992002];
    let masterIds: number[] = [];

    try {
        // 0. Dọn dẹp dữ liệu cũ nếu có
        for (const dno of testDocNos) {
            const oldMaster = await query(`SELECT id FROM health_check_masters WHERE doc_no = $1`, [String(dno)]);
            for (const r of oldMaster.rows) {
                await query(`DELETE FROM health_check_details WHERE master_id = $1`, [r.id]);
                await query(`DELETE FROM health_check_masters WHERE id = $1`, [r.id]);
            }
        }

        // 1. Tạo 2 hồ sơ KSK thử nghiệm cho luồng ký
        for (let i = 0; i < 2; i++) {
            const dno = testDocNos[i];
            const masterRes = await query(`
                INSERT INTO health_check_masters (
                    doc_no, form_type, patient_name, dob, gender, cccd, 
                    signature_status, send_status, signature_type
                ) VALUES (
                    $1, '2', $2, '1992-05-15', 'Nam', $3,
                    'Unsigned', 'Unsent', 'HSM'
                ) RETURNING id
            `, [String(dno), `BỆNH NHÂN TEST ${i + 1}`, `00109200000${i + 1}`]);

            const mId = masterRes.rows[0].id;
            masterIds.push(mId);

            const initialClinical = {
                examination: { height: '170', weight: '65', pulse: '75', blood_pressure: '120/80' },
                specialty_metadata: {
                    internal: { status: 'ĐÃ_KHÁM' },
                    conclusion: { status: 'CHỜ_KẾT_LUẬN' }
                }
            };
            const initialLab = { paraclinical_items: [] };
            const initialConclusion = {
                fitness_class: i === 0 ? '1' : null,
                diagnosis: 'Đủ sức khỏe học tập và làm việc'
            };

            await query(`
                INSERT INTO health_check_details (
                    master_id, clinical_data, lab_data, conclusion_data
                ) VALUES ($1, $2, $3, $4)
            `, [mId, JSON.stringify(initialClinical), JSON.stringify(initialLab), JSON.stringify(initialConclusion)]);
        }

        assert.strictEqual(masterIds.length, 2, 'Phải tạo thành công 2 hồ sơ test');

        // ==========================================
        // 2. TEST: Chưa ký Bác sĩ mà gọi ký Đơn vị -> Phải từ chối hồ sơ 2 (chưa có chữ ký BS)
        // ==========================================
        const reqPrematureHosp: any = {
            body: {
                docIds: [masterIds[1]],
                signatureType: 'USB',
                signatures: { [String(masterIds[1])]: 'MOCK_HOSPITAL_SIG' }
            }
        };
        const resPremature = createMockResponse();
        await documentsController.batchSignHospital(reqPrematureHosp, resPremature);
        assert.strictEqual(resPremature.data.failedCount, 1, 'Hồ sơ chưa có chữ ký Bác sĩ phải bị từ chối ký Đơn vị');

        // ==========================================
        // 3. TEST: BATCH SIGN CONCLUSION (BÁC SĨ KẾT LUẬN)
        // ==========================================
        const reqDoc1: any = {
            body: {
                docIds: masterIds,
                signatureType: 'HSM',
                doctorId: 'BS_TEST_01',
                doctorName: 'BS. CK1 Nguyễn Văn Kết Luận',
                defaultFitnessClass: '2' // Hồ sơ 2 sẽ được gán loại 2
            },
            userId: 'BS_TEST_01'
        };
        const resDoc1 = createMockResponse();

        await documentsController.batchSignConclusion(reqDoc1, resDoc1);

        assert.strictEqual(resDoc1.statusCode, 200);
        assert.strictEqual(resDoc1.data.success, true);
        assert.strictEqual(resDoc1.data.succeededCount, 2, 'Cả 2 hồ sơ phải ký Bác sĩ kết luận thành công');
        assert.strictEqual(resDoc1.data.failedCount, 0);

        // Kiểm tra dữ liệu DB sau khi ký Bác sĩ kết luận
        for (let i = 0; i < masterIds.length; i++) {
            const mId = masterIds[i];
            const checkRes = await query(`
                SELECT m.*, d.conclusion_data, d.clinical_data
                FROM health_check_masters m
                LEFT JOIN health_check_details d ON m.id = d.master_id
                WHERE m.id = $1
            `, [mId]);

            const row = checkRes.rows[0];
            const concl = typeof row.conclusion_data === 'string' ? JSON.parse(row.conclusion_data) : row.conclusion_data;
            
            assert.strictEqual(row.signature_type, 'DOCTOR', 'Signature type phải chuyển thành DOCTOR');
            assert.strictEqual(row.signature_status, 'Unsigned', 'Signature status vẫn là Unsigned vì chưa ký Đơn vị');
            assert.ok(concl.doctor_signature, 'Phải có doctor_signature trong conclusion_data');
            assert.strictEqual(concl.doctor_name, 'BS. CK1 Nguyễn Văn Kết Luận');
            assert.strictEqual(concl.status, 'ĐÃ_DUYỆT');

            // Kiểm tra XML
            assert.ok(row.xml_data && row.xml_data.includes('<CKS_NGUOI_KET_LUAN>'), 'XML phải có thẻ CKS_NGUOI_KET_LUAN');
            const checkSig = healthCheckTwoTierSigner.isFullySigned(row.xml_data);
            assert.strictEqual(checkSig.hasDoctorSig, true, 'XML phải có chữ ký Bác sĩ');
            assert.strictEqual(checkSig.hasHospitalSig, false, 'XML chưa có chữ ký Bệnh viện');
            assert.strictEqual(checkSig.fullySigned, false, 'Chưa đủ 2 chữ ký');
        }

        // ==========================================
        // 4. TEST: BATCH SIGN HOSPITAL (CHỮ KÝ ĐƠN VỊ)
        // ==========================================
        const mockHospitalSig = 'MIIE_MOCK_HOSPITAL_SIGNATURE_BASE64_FOR_UNIT_TEST==';
        const signaturesMap: Record<string, string> = {};
        for (const mId of masterIds) {
            signaturesMap[String(mId)] = mockHospitalSig;
        }

        const reqHosp: any = {
            body: {
                docIds: masterIds,
                signatureType: 'USB',
                signatures: signaturesMap
            }
        };
        const resHosp = createMockResponse();

        await documentsController.batchSignHospital(reqHosp, resHosp);

        assert.strictEqual(resHosp.statusCode, 200);
        assert.strictEqual(resHosp.data.success, true);
        assert.strictEqual(resHosp.data.succeededCount, 2, 'Cả 2 hồ sơ phải ký Đơn vị thành công');

        // Kiểm tra dữ liệu DB sau khi ký Đơn vị
        for (const mId of masterIds) {
            const checkRes = await query(`
                SELECT m.* FROM health_check_masters m WHERE m.id = $1
            `, [mId]);

            const row = checkRes.rows[0];
            assert.strictEqual(row.signature_status, 'Signed', 'Signature status phải là Signed');
            assert.strictEqual(row.signature_type, 'USB');

            const checkSig = healthCheckTwoTierSigner.isFullySigned(row.xml_data);
            assert.strictEqual(checkSig.hasDoctorSig, true, 'XML phải có chữ ký Bác sĩ');
            assert.strictEqual(checkSig.hasHospitalSig, true, 'XML phải có chữ ký Bệnh viện');
            assert.strictEqual(checkSig.fullySigned, true, 'File XML phải đạt trạng thái đủ 2 cấp độ chữ ký số');
        }

    } finally {
        // 5. Dọn dẹp an toàn các bản ghi test
        for (const mId of masterIds) {
            await query(`DELETE FROM health_check_details WHERE master_id = $1`, [mId]);
            await query(`DELETE FROM health_check_masters WHERE id = $1`, [mId]);
        }
    }
});
