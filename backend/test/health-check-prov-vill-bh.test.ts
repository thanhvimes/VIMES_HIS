import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveProvinceBhCode, resolveVillageBhCode, initAdministrativeCatalog } from '../src/services/administrative-catalog.service';
import { generateXmlPayload } from '../src/controllers/health-check/xml-generator';
import { sanitizeXmlContent } from '../src/services/health-check-sync.service';

test('Administrative Catalog Service resolves sp_id_bh and sv_id_bh accurately', async () => {
    await initAdministrativeCatalog();

    // 1. Kiểm tra resolveProvinceBhCode
    assert.equal(resolveProvinceBhCode(201), '01', 'sp_id 201 (Hà Nội) -> sp_id_bh 01');
    assert.equal(resolveProvinceBhCode(237), '37', 'sp_id 237 (Ninh Bình) -> sp_id_bh 37');
    assert.equal(resolveProvinceBhCode(279), '79', 'sp_id 279 (TP.HCM) -> sp_id_bh 79');
    assert.equal(resolveProvinceBhCode(214), '14', 'sp_id 214 (Sơn La) -> sp_id_bh 14');
    assert.equal(resolveProvinceBhCode('237'), '37', 'Chuỗi "237" -> sp_id_bh 37');
    assert.equal(resolveProvinceBhCode('01'), '01', 'Chuỗi "01" giữ nguyên 01');
    assert.equal(resolveProvinceBhCode('4'), '04', 'Chuỗi "4" pad thành 04');
    assert.equal(resolveProvinceBhCode('Ninh Bình'), '37', 'Tên "Ninh Bình" -> sp_id_bh 37');
    assert.equal(resolveProvinceBhCode('Thành phố Hà Nội'), '01', 'Tên "Thành phố Hà Nội" -> sp_id_bh 01');
    assert.equal(resolveProvinceBhCode(''), '01', 'Rỗng fallback về 01');
    assert.equal(resolveProvinceBhCode(null), '01', 'Null fallback về 01');

    // 2. Kiểm tra resolveVillageBhCode
    assert.equal(resolveVillageBhCode(23714428), '14428', 'sv_id 23714428 (Xã Nho Quan) -> sv_id_bh 14428');
    assert.equal(resolveVillageBhCode(25223839), '23839', 'sv_id 25223839 (Xã SRó) -> sv_id_bh 23839');
    assert.equal(resolveVillageBhCode(21403997), '03997', 'sv_id 21403997 (Xã Tân Yên) -> sv_id_bh 03997');
    assert.equal(resolveVillageBhCode(23799999), '14359', 'sv_id ngoại lệ 23799999 -> sv_id_bh 14359');
    assert.equal(resolveVillageBhCode('14428'), '14428', 'Chuỗi "14428" giữ nguyên 14428');
    assert.equal(resolveVillageBhCode('3997'), '03997', 'Chuỗi "3997" pad thành 03997');
    assert.equal(resolveVillageBhCode(''), '00001', 'Rỗng fallback về 00001');
    assert.equal(resolveVillageBhCode(null), '00001', 'Null fallback về 00001');
});

test('generateXmlPayload outputs sp_id_bh and sv_id_bh in MATINH_CU_TRU and MAXA_CU_TRU', async () => {
    await initAdministrativeCatalog();

    const master = {
        patient_name: 'NGUYỄN VĂN AN',
        cccd: '037090001234',
        dob: '1990-05-15',
        gender: 'Nam',
        doc_no: 'DOC-12345'
    };

    // Case A: Input with internal sp_id and sv_id
    const clinicalA = {
        hp_provid: 237,
        hp_villid: 23714428,
        address: 'Thị trấn Nho Quan, Ninh Bình',
        phone: '0912345678'
    };

    const xmlA = generateXmlPayload('3', master, clinicalA, {}, {});
    assert.match(xmlA, /<MATINH_CU_TRU>37<\/MATINH_CU_TRU>/, 'XML contains sp_id_bh 37 for Ninh Bình');
    assert.match(xmlA, /<MAXA_CU_TRU>14428<\/MAXA_CU_TRU>/, 'XML contains sv_id_bh 14428 for Nho Quan');

    // Case B: Input with string IDs and padding test
    const clinicalB = {
        matinh_cu_tru: '201',
        maxa_cu_tru: '21403997',
        address: 'Xã Tân Yên, Sơn La',
        phone: '0987654321'
    };

    const xmlB = generateXmlPayload('3', master, clinicalB, {}, {});
    assert.match(xmlB, /<MATINH_CU_TRU>01<\/MATINH_CU_TRU>/, 'XML contains sp_id_bh 01 for Hà Nội');
    assert.match(xmlB, /<MAXA_CU_TRU>03997<\/MAXA_CU_TRU>/, 'XML contains sv_id_bh 03997 for Tân Yên');
});

test('sanitizeXmlContent normalizes MATINH_CU_TRU and MAXA_CU_TRU before sending', async () => {
    await initAdministrativeCatalog();

    // Raw XML containing legacy unmapped internal IDs
    const rawXml = `<?xml version="1.0" encoding="utf-8"?>
<KHAMSUCKHOE>
	<THONGTINDONVI><MACSKCB>8934285008135</MACSKCB></THONGTINDONVI>
	<THONGTINHOSO>
		<NGAYLAP>20260824</NGAYLAP>
		<SOLUONGHOSO>1</SOLUONGHOSO>
		<DANHSACHHOSO>
			<HOSO>
				<FILEHOSO>
					<LOAIHOSO>XML1</LOAIHOSO>
					<NOIDUNGFILE>
						<THONG_TIN_HANH_CHINH>
							<HO_TEN>NGUYEN VAN B</HO_TEN>
							<SO_CCCD>037090001234</SO_CCCD>
							<MATINH_CU_TRU>237</MATINH_CU_TRU>
							<MAXA_CU_TRU>23714428</MAXA_CU_TRU>
						</THONG_TIN_HANH_CHINH>
					</NOIDUNGFILE>
				</FILEHOSO>
			</HOSO>
		</DANHSACHHOSO>
	</THONGTINHOSO>
</KHAMSUCKHOE>`;

    const processedXml = sanitizeXmlContent(rawXml);
    assert.match(processedXml, /<MATINH_CU_TRU>37<\/MATINH_CU_TRU>/, 'MATINH_CU_TRU must be converted to 37');
    assert.match(processedXml, /<MAXA_CU_TRU>14428<\/MAXA_CU_TRU>/, 'MAXA_CU_TRU must be converted to 14428');
});
