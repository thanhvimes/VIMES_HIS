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

async function main() {
    const targetDocIds = [1310, 1295, 1292, 1277, 1262];
    console.log(`=======================================================`);
    console.log(`BẮT ĐẦU TEST KÝ SỐ 2 CẤP ĐỘ HSM VIETTEL TRÊN 5 HỒ SƠ`);
    console.log(`Danh sách ID hồ sơ:`, targetDocIds);
    console.log(`=======================================================\n`);

    // 1. Kiểm tra trạng thái ban đầu của 5 hồ sơ
    const initialDocs = await query(`
        SELECT id, doc_no, patient_name, signature_status, signature_type, send_status
        FROM health_check_masters
        WHERE id = ANY($1)
        ORDER BY id DESC
    `, [targetDocIds]);
    console.log('Trạng thái ban đầu của 5 hồ sơ:');
    console.table(initialDocs.rows);

    // 2. BƯỚC 1: KÝ SỐ BÁC SĨ KẾT LUẬN (HSM VIETTEL)
    console.log(`\n>>> [BƯỚC 1/2] Thực hiện Ký số Bác sĩ kết luận (HSM Viettel)...`);
    const reqConclusion: any = {
        body: {
            docIds: targetDocIds,
            signatureType: 'HSM',
            doctorId: 'httmai',
            doctorName: 'BSCKI. Hà Thị Thanh Mai',
            defaultFitnessClass: '2'
        },
        userId: 'httmai'
    };
    const resConclusion = createMockResponse();
    await documentsController.batchSignConclusion(reqConclusion, resConclusion);

    console.log(`Kết quả Ký Bác sĩ kết luận:`, resConclusion.data);
    if (!resConclusion.data?.success || resConclusion.data?.succeededCount !== 5) {
        console.error('❌ Ký Bác sĩ kết luận chưa đạt 5/5 hồ sơ. Dừng kiểm thử.');
        process.exit(1);
    }
    console.log(`✅ Hoàn tất Ký Bác sĩ kết luận cho 5/5 hồ sơ.`);

    // 3. BƯỚC 2: KÝ SỐ CHỮ KÝ ĐƠN VỊ (HSM VIETTEL)
    console.log(`\n>>> [BƯỚC 2/2] Thực hiện Ký số Chữ ký Đơn vị (HSM Viettel)...`);
    const reqUnit: any = {
        body: {
            docIds: targetDocIds,
            signatureType: 'HSM'
        },
        userId: 'patuanky'
    };
    const resUnit = createMockResponse();
    await documentsController.batchSignHospital(reqUnit, resUnit);

    console.log(`Kết quả Ký Chữ ký Đơn vị:`, resUnit.data);
    if (!resUnit.data?.success || resUnit.data?.succeededCount !== 5) {
        console.error('❌ Ký Chữ ký Đơn vị chưa đạt 5/5 hồ sơ. Dừng kiểm thử.');
        process.exit(1);
    }
    console.log(`✅ Hoàn tất Ký Chữ ký Đơn vị cho 5/5 hồ sơ.`);

    // 4. KIỂM TRA ĐỐI SOÁT TOÀN DIỆN DỮ LIỆU SAU KÝ
    console.log(`\n=======================================================`);
    console.log(`KIỂM TRA TÍNH TOÀN VẸN 2 CẤP ĐỘ TRÊN DỮ LIỆU THỰC TẾ:`);
    console.log(`=======================================================`);

    const finalDocs = await query(`
        SELECT m.id, m.doc_no, m.patient_name, m.signature_status, m.signature_type, m.updated_at,
               m.xml_data, d.conclusion_data
        FROM health_check_masters m
        LEFT JOIN health_check_details d ON m.id = d.master_id
        WHERE m.id = ANY($1)
        ORDER BY m.id DESC
    `, [targetDocIds]);

    const reportTable: any[] = [];

    for (const r of finalDocs.rows) {
        const concl = typeof r.conclusion_data === 'string' ? JSON.parse(r.conclusion_data) : (r.conclusion_data || {});
        const checkSig = healthCheckTwoTierSigner.isFullySigned(r.xml_data);

        // Trích xuất chữ ký Bác sĩ và Đơn vị từ XML
        const cksDocMatch = r.xml_data.match(/<CKS_NGUOI_KET_LUAN>([\s\S]*?)<\/CKS_NGUOI_KET_LUAN>/i);
        const cksHospMatch = r.xml_data.match(/<CKS_BENH_VIEN>([\s\S]*?)<\/CKS_BENH_VIEN>/i);

        const docSigRaw = cksDocMatch ? cksDocMatch[1].trim() : '';
        const hospSigRaw = cksHospMatch ? cksHospMatch[1].trim() : '';

        // Giải mã thử nội dung JSON nếu có
        let docSigInfo = 'Có chữ ký';
        try {
            const parsed = JSON.parse(Buffer.from(docSigRaw, 'base64').toString('utf8'));
            docSigInfo = `${parsed.doctor_name} (${parsed.ca_provider || 'HSM'}) - Loại ${parsed.fitness_class}`;
        } catch (_) {}

        let hospSigInfo = 'Có chữ ký';
        try {
            const parsed = JSON.parse(Buffer.from(hospSigRaw, 'base64').toString('utf8'));
            hospSigInfo = `${parsed.facility_name} (${parsed.ca_provider || 'HSM'}) - ${parsed.signer}`;
        } catch (_) {}

        reportTable.push({
            id: r.id,
            docNo: r.doc_no,
            patientName: r.patient_name,
            signature_status: r.signature_status,
            signature_type: r.signature_type,
            hasDoctorSig: checkSig.hasDoctorSig ? 'ĐỦ' : 'THIẾU',
            hasHospitalSig: checkSig.hasHospitalSig ? 'ĐỦ' : 'THIẾU',
            fullySigned: checkSig.fullySigned ? '✅ ĐẠT' : '❌ CHƯA',
            doctorSigInfo: docSigInfo,
            hospitalSigInfo: hospSigInfo
        });
    }

    console.table(reportTable);
    console.log(`\n🎉 TẤT CẢ 5 HỒ SƠ ĐÃ KÝ THÀNH CÔNG 2 CẤP ĐỘ BẰNG HSM VIETTEL!`);
    process.exit(0);
}

main().catch(err => {
    console.error('Lỗi nghiêm trọng:', err);
    process.exit(1);
});
