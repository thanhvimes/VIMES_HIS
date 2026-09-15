import test from 'node:test';
import assert from 'node:assert/strict';
import { query } from '../src/config/database';
import { resolveProvinceBhCode, resolveVillageBhCode, initAdministrativeCatalog } from '../src/services/administrative-catalog.service';
import { generateXmlPayload } from '../src/controllers/health-check/xml-generator';
import { sanitizeXmlContent } from '../src/services/health-check-sync.service';
import { contractsController } from '../src/controllers/health-check/contracts.controller';
import { documentsController } from '../src/controllers/health-check/documents';
import { hisIntegrationController } from '../src/controllers/health-check/his-integration';

test('Full Integration: Database and HIS Catalog Integrity with Gateway XML Transformation', async () => {
    await initAdministrativeCatalog();

    // 1. Kiểm tra tính toàn vẹn của dữ liệu trong bảng sys_prov và sys_vill
    const provCheck = await query(`
        SELECT sp_id, sp_id_bh, sp_name 
        FROM sys_prov 
        WHERE sp_id IN (201, 237, 279)
        ORDER BY sp_id ASC
    `);
    assert.ok(provCheck.rows.length >= 3, 'sys_prov contains Hà Nội, Ninh Bình, TP.HCM');
    const ninhBinh = provCheck.rows.find((r: any) => r.sp_id === 237);
    assert.equal(ninhBinh?.sp_id_bh, '37', 'Ninh Bình sp_id=237 -> sp_id_bh=37');

    const villCheck = await query(`
        SELECT sv_id, sv_id_bh, sv_name 
        FROM sys_vill 
        WHERE sv_id = 23714428
        LIMIT 1
    `);
    assert.ok(villCheck.rows.length > 0, 'sys_vill contains Thị trấn Nho Quan');
    assert.equal(villCheck.rows[0]?.sv_id_bh, '14428', 'sv_id=23714428 -> sv_id_bh=14428');

    // 2. Kiểm tra quy trình tiếp nhận & lưu trữ (Database & Clinical Data)
    // Dữ liệu lưu trong clinical_data phải giữ nguyên sp_id (237) và sv_id (23714428)
    const storedClinicalData = {
        address: 'Thị trấn Nho Quan, Huyện Nho Quan, Tỉnh Ninh Bình',
        phone: '0912345678',
        ethnic: '01',
        matinh_cu_tru: '237', // Gốc HIS
        mahuyen_cu_tru: '23714',
        maxa_cu_tru: '23714428', // Gốc HIS
        cccd_date: '2021-05-10',
        cccd_place: 'Cục CSQLHC về TTXH',
        nguoi_giam_ho: 'Nguyễn Văn Bố',
        so_cccd_ngh: '037060000001',
        examination: { height: '170', weight: '65', bmi: '22.5', blood_pressure: '120/80', pulse: '75' },
        clinical_exam: { internal: 'Bình thường', eye: '10/10' },
        conclusion: { health_rating: '1', conclusion: 'Đủ sức khỏe làm việc' }
    };

    const storedMaster = {
        id: 999999,
        doc_no: '26401287',
        patient_name: 'NGUYỄN VĂN TEST',
        cccd: '037090001234',
        dob: '1995-08-20',
        gender: 'Nam'
    };

    // 3. Khi sinh XML gửi cổng (XML Generation): Phải chuyển đổi sang sp_id_bh và sv_id_bh
    const generatedXml = generateXmlPayload('2', storedMaster, storedClinicalData, {}, {});
    
    // Thẻ MATINH_CU_TRU trong XML1 phải là mã BHYT 37
    assert.match(generatedXml, /<MATINH_CU_TRU>37<\/MATINH_CU_TRU>/, 'XML contains 37 for Ninh Bình');
    // Thẻ MAXA_CU_TRU trong XML1 phải là mã BHYT 14428
    assert.match(generatedXml, /<MAXA_CU_TRU>14428<\/MAXA_CU_TRU>/, 'XML contains 14428 for Nho Quan');
    // Số CCCD và Họ tên đúng chuẩn
    assert.match(generatedXml, /<SO_CCCD>037090001234<\/SO_CCCD>/);
    assert.match(generatedXml, /<HO_TEN>NGUYỄN VĂN TEST<\/HO_TEN>/);

    // 4. Kiểm tra bộ chuẩn hóa XML Gateway (Sanitize XML Content)
    // Đảm bảo cả thẻ người giám hộ cũng được chuẩn hóa đúng mã BHYT
    const testEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<KHAMSUCKHOE>
	<THONGTINDONVI><MACSKCB>8934285008135</MACSKCB></THONGTINDONVI>
	<THONGTINHOSO>
		<DANHSACHHOSO>
			<HOSO>
				<FILEHOSO>
					<LOAIHOSO>XML1</LOAIHOSO>
					<NOIDUNGFILE>
						<THONG_TIN_HANH_CHINH>
							<MATINH_CU_TRU>237</MATINH_CU_TRU>
							<MAXA_CU_TRU>23714428</MAXA_CU_TRU>
							<MATINH_CU_TRU_NGH_BO>201</MATINH_CU_TRU_NGH_BO>
							<MAXA_CU_TRU_NGH_BO>21403997</MAXA_CU_TRU_NGH_BO>
						</THONG_TIN_HANH_CHINH>
					</NOIDUNGFILE>
				</FILEHOSO>
			</HOSO>
		</DANHSACHHOSO>
	</THONGTINHOSO>
</KHAMSUCKHOE>`;

    const sanitized = sanitizeXmlContent(testEnvelope);
    assert.match(sanitized, /<MATINH_CU_TRU>37<\/MATINH_CU_TRU>/, 'Sanitizer converts MATINH_CU_TRU to 37');
    assert.match(sanitized, /<MAXA_CU_TRU>14428<\/MAXA_CU_TRU>/, 'Sanitizer converts MAXA_CU_TRU to 14428');
    assert.match(sanitized, /<MATINH_CU_TRU_NGH_BO>01<\/MATINH_CU_TRU_NGH_BO>/, 'Sanitizer converts guardian province to 01');
    assert.match(sanitized, /<MAXA_CU_TRU_NGH_BO>03997<\/MAXA_CU_TRU_NGH_BO>/, 'Sanitizer converts guardian village to 03997');
});

test('Full Integration: Contracts cleanupUnreceivedEmployees executes without SQL column errors', async () => {
    // Kiểm tra hợp đồng ID không tồn tại
    let notFoundCode = 0;
    let notFoundData: any = null;
    await contractsController.cleanupUnreceivedEmployees(
        { params: { id: '99999999' } } as any,
        {
            status(c: number) { notFoundCode = c; return this; },
            json(d: any) { notFoundData = d; return this; }
        } as any
    );
    assert.equal(notFoundCode, 404);
    assert.equal(notFoundData.success, false);

    // Kiểm tra lấy hợp đồng thực tế từ DB để test cleanup logic
    const existingContract = await query(`
        SELECT hec_contract_id, hec_status 
        FROM hms_exm_contract 
        ORDER BY hec_contract_id DESC 
        LIMIT 1
    `);

    if (existingContract.rows.length > 0) {
        const contractId = existingContract.rows[0].hec_contract_id;
        let responseCode = 200;
        let responseData: any = null;

        await contractsController.cleanupUnreceivedEmployees(
            { params: { id: String(contractId) } } as any,
            {
                status(c: number) { responseCode = c; return this; },
                json(d: any) { responseData = d; return this; }
            } as any
        );

        assert.ok(responseCode === 200 || (responseCode === 400 && responseData.message.includes('duyệt chốt')), 
            'cleanupUnreceivedEmployees handles real DB contract smoothly without SQL errors');
    }
});

test('Full Integration: documentsController.getDocuments with examStatus InProgress/Done filters executes without SQL error', async () => {
    // 1. Test examStatus = 'InProgress' (Đang khám)
    let inProgressData: any = null;
    await documentsController.getDocuments(
        {
            query: {
                startDate: '2026-08-24',
                endDate: '2026-08-24',
                status: 'All',
                signatureStatus: 'All',
                formType: 'All',
                contractId: 'All',
                examStatus: 'InProgress',
                limit: '100',
                page: '1'
            }
        } as any,
        {
            json(d: any) { inProgressData = d; return this; },
            status(c: number) { return this; },
            setHeader(k: string, v: any) { return this; }
        } as any
    );
    assert.ok(inProgressData && Array.isArray(inProgressData), 'getDocuments returns array for examStatus=InProgress');

    // 2. Test examStatus = 'Done' (Đã kết luận)
    let doneData: any = null;
    await documentsController.getDocuments(
        {
            query: {
                startDate: '2026-08-24',
                endDate: '2026-08-24',
                status: 'All',
                signatureStatus: 'All',
                formType: 'All',
                contractId: 'All',
                examStatus: 'Done',
                limit: '100',
                page: '1'
            }
        } as any,
        {
            json(d: any) { doneData = d; return this; },
            status(c: number) { return this; },
            setHeader(k: string, v: any) { return this; }
        } as any
    );
    assert.ok(doneData && Array.isArray(doneData), 'getDocuments returns array for examStatus=Done');

    // 3. Test export all records (limit='all') for Excel Export
    let allExportData: any = null;
    await documentsController.getDocuments(
        {
            query: {
                startDate: '2026-08-01',
                endDate: '2026-08-24',
                status: 'All',
                signatureStatus: 'All',
                formType: 'All',
                contractId: 'All',
                examStatus: 'Done',
                limit: 'all'
            }
        } as any,
        {
            json(d: any) { allExportData = d; return this; },
            status(c: number) { return this; },
            setHeader(k: string, v: any) { return this; }
        } as any
    );
    assert.ok(allExportData && Array.isArray(allExportData), 'getDocuments returns full array for limit=all');
});

test('Full Integration: hisIntegrationController.getHisPatient synchronizes paraclinical deletion from HIS', async () => {
    // 1. Tạo mock record trong health_check_masters & health_check_details với paraclinical_items cũ
    const dummyCccd = '999888777666';
    const dummyDocNo = 'KSK-2026-999999';
    
    await query(`DELETE FROM health_check_masters WHERE doc_no = $1`, [dummyDocNo]);
    const mRes = await query(`
        INSERT INTO health_check_masters (patient_id, patient_name, cccd, dob, gender, doc_no, his_doc_no, form_type)
        VALUES ('999999', 'TEST DELETE SYNC', $1, '1990-01-01', 'Nam', $2, '999999', '2')
        RETURNING id
    `, [dummyCccd, dummyDocNo]);
    const masterId = mRes.rows[0].id;

    // Giả lập trước đó KSK có 2 chỉ định CLS (đã có order_id nhưng sau đó bị xóa trên HIS)
    const oldLabData = {
        blood_test: { hemoglobin: '140' },
        paraclinical_items: [
            { order_id: '999991', service_code: 'TEST_DELETED_1', service_name: 'Xét nghiệm đã xóa 1' },
            { order_id: '999992', service_code: 'TEST_DELETED_2', service_name: 'Xét nghiệm đã xóa 2' }
        ]
    };
    await query(`
        INSERT INTO health_check_details (master_id, clinical_data, lab_data, conclusion_data)
        VALUES ($1, '{}'::jsonb, $2::jsonb, '{}'::jsonb)
    `, [masterId, JSON.stringify(oldLabData)]);

    // 2. Gọi getHisPatient để kích hoạt đồng bộ
    let syncedData: any = null;
    await hisIntegrationController.getHisPatient(
        {
            params: { identifier: dummyDocNo }
        } as any,
        {
            json(d: any) { syncedData = d; return this; },
            status(c: number) { return this; }
        } as any
    );

    assert.ok(syncedData, 'getHisPatient returned data');
    assert.ok(syncedData.lab_data, 'lab_data exists');
    // Vì đợt khám 999999 không có order thật trong HIS, các dịch vụ cũ đã bị xóa khỏi HIS phải bị loại bỏ
    assert.strictEqual(
        syncedData.lab_data.paraclinical_items.length,
        0,
        'Deleted paraclinical items from HIS must be removed from paraclinical_items'
    );

    // 3. Kiểm tra trong DB health_check_details đã được tự động lưu lại
    const checkDb = await query(`SELECT lab_data FROM health_check_details WHERE master_id = $1`, [masterId]);
    const savedLabData = typeof checkDb.rows[0].lab_data === 'string' ? JSON.parse(checkDb.rows[0].lab_data) : checkDb.rows[0].lab_data;
    assert.strictEqual(
        savedLabData.paraclinical_items.length,
        0,
        'Database health_check_details.lab_data.paraclinical_items must be updated and empty'
    );

    // Dọn dẹp test data
    await query(`DELETE FROM health_check_details WHERE master_id = $1`, [masterId]);
    await query(`DELETE FROM health_check_masters WHERE id = $1`, [masterId]);
});

