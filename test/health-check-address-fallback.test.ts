import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMandatoryPortalFields } from '../src/services/health-check-mandatory-fields';
import { generateXmlPayload } from '../src/controllers/health-check/xml-generator';
import { sanitizeXmlContent } from '../src/services/health-check-sync.service';

test('1. DIA_CHI fallback: valid when address is empty but ward and province exist', () => {
    const input = {
        formType: '3',
        patientName: 'DƯƠNG THỊ LÀNH',
        gender: '2',
        dob: '1968-08-10',
        ethnic: '01',
        cccd: '037168008873',
        address: '', // empty!
        maTinhCuTru: '237',
        maXaCuTru: '23714359',
        maNgheNghiep: '1539',
        lyDoVv: 'Khám sức khỏe toàn dân',
        targetGroup: '14',
        fundingSource: '9',
        loaiHinhKcb: '01',
        ngayVao: '2026-09-13',
        fitnessClass: '1',
        clinical: {
            province_name: 'Ninh Bình',
            ward_name: 'Phường Nam Hoa Lư'
        }
    };

    const result = validateMandatoryPortalFields(input);
    assert.equal(result.valid, true, `Validation failed: ${result.errors.join('; ')}`);
    assert.equal(result.fieldErrors.address, undefined);
});

test('2. DIA_CHI fallback: valid when address is empty and resolves names from codes 37 and 14359', () => {
    const input = {
        formType: '3',
        patientName: 'NGUYỄN VĂN AN',
        gender: '1',
        dob: '1990-01-01',
        ethnic: '01',
        cccd: '037090001234',
        address: '', // empty!
        maTinhCuTru: '37',
        maXaCuTru: '14359',
        maNgheNghiep: '01',
        lyDoVv: 'Khám sức khỏe',
        targetGroup: '14',
        fundingSource: '9',
        loaiHinhKcb: '01',
        ngayVao: '2026-09-13',
        fitnessClass: '1'
    };

    const result = validateMandatoryPortalFields(input);
    assert.equal(result.valid, true, `Validation failed: ${result.errors.join('; ')}`);
});

test('3. Flexible DOB parser: handles YYYYMMDD and DD/MM/YYYY without NaN errors', () => {
    const inputYmd = {
        formType: '3',
        patientName: 'NGUYỄN VĂN B',
        gender: '1',
        dob: '19680810', // YYYYMMDD
        ethnic: '01',
        cccd: '037090001234',
        address: 'Hà Nội',
        maTinhCuTru: '01',
        maXaCuTru: '00001',
        maNgheNghiep: '01',
        lyDoVv: 'Khám sức khỏe',
        targetGroup: '14',
        fundingSource: '9',
        loaiHinhKcb: '01',
        ngayVao: '2026-09-13',
        fitnessClass: '1'
    };

    const resYmd = validateMandatoryPortalFields(inputYmd);
    assert.equal(resYmd.fieldErrors.dob, undefined);

    const inputDmy = { ...inputYmd, dob: '10/08/1968' };
    const resDmy = validateMandatoryPortalFields(inputDmy);
    assert.equal(resDmy.fieldErrors.dob, undefined);
});

test('4. Flexible CCCD: accepts clean digits with spaces, rejects invalid length', () => {
    const inputSpaces = {
        formType: '3',
        patientName: 'NGUYỄN VĂN C',
        gender: '1',
        dob: '1985-05-20',
        ethnic: '01',
        cccd: '037 168 008 873', // spaces
        address: 'Hà Nội',
        maTinhCuTru: '01',
        maXaCuTru: '00001',
        maNgheNghiep: '01',
        lyDoVv: 'Khám sức khỏe',
        targetGroup: '14',
        fundingSource: '9',
        loaiHinhKcb: '01',
        ngayVao: '2026-09-13',
        fitnessClass: '1'
    };

    const res = validateMandatoryPortalFields(inputSpaces);
    assert.equal(res.fieldErrors.cccd, undefined);

    // Invalid length (9 digits) rejected per portal QĐ 3176
    const input9 = { ...inputSpaces, cccd: '162839481' };
    const res9 = validateMandatoryPortalFields(input9);
    assert.ok(res9.fieldErrors.cccd?.includes('12 chữ số'));
});

test('5. Fitness class: handles "Loại I", "Loại 1", "LOẠI II" cleanly', () => {
    const base = {
        formType: '3',
        patientName: 'NGUYỄN VĂN D',
        gender: '1',
        dob: '1985-05-20',
        ethnic: '01',
        cccd: '037168008873',
        address: 'Hà Nội',
        maTinhCuTru: '01',
        maXaCuTru: '00001',
        maNgheNghiep: '01',
        lyDoVv: 'Khám sức khỏe',
        targetGroup: '14',
        fundingSource: '9',
        loaiHinhKcb: '01',
        ngayVao: '2026-09-13'
    };

    for (const pl of ['Loại I', 'loại 1', 'LOẠI II', 'Loại 3', 'IV', '5']) {
        const res = validateMandatoryPortalFields({ ...base, fitnessClass: pl });
        assert.equal(res.fieldErrors.fitnessClass, undefined, `Failed on ${pl}`);
    }
});

test('6. XML generation: automatically populates DIA_CHI when address is empty but ward and prov exist', () => {
    const xml = generateXmlPayload(
        '3',
        { patientName: 'DƯƠNG THỊ LÀNH', cccd: '037168008873', dob: '1968-08-10', gender: '2', docNo: '26434185' },
        {
            address: '',
            province_name: 'Ninh Bình',
            ward_name: 'Phường Nam Hoa Lư',
            matinh_cu_tru: '237',
            maxa_cu_tru: '23714359',
            ma_nghe_nghiep: '1539'
        },
        {},
        {
            fitness_class: '1'
        }
    );

    assert.ok(xml.includes('<DIA_CHI>Phường Nam Hoa Lư, Ninh Bình</DIA_CHI>'), 'XML contains synthesized DIA_CHI');
    assert.ok(xml.includes('<MATINH_CU_TRU>37</MATINH_CU_TRU>'), 'MATINH_CU_TRU resolved to 37');
    assert.ok(xml.includes('<HO_TEN>DƯƠNG THỊ LÀNH</HO_TEN>'), 'HO_TEN is uppercase');
});

test('7. sanitizeXmlContent: fills empty <DIA_CHI></DIA_CHI> before sending to portal', () => {
    const rawXml = `
        <THONG_TIN_HANH_CHINH>
            <HO_TEN>dương thị lành</HO_TEN>
            <MATINH_CU_TRU>237</MATINH_CU_TRU>
            <MAXA_CU_TRU>14359</MAXA_CU_TRU>
            <DIA_CHI></DIA_CHI>
            <MA_DAN_TOC></MA_DAN_TOC>
        </THONG_TIN_HANH_CHINH>
    `;

    const sanitized = sanitizeXmlContent(rawXml, '8934285008135', '37101');
    assert.ok(sanitized.includes('<HO_TEN>DƯƠNG THỊ LÀNH</HO_TEN>'), 'Auto uppercase HO_TEN');
    assert.ok(sanitized.includes('<MATINH_CU_TRU>37</MATINH_CU_TRU>'), 'Auto convert MATINH_CU_TRU to 37');
    assert.ok(sanitized.includes('<MA_DAN_TOC>01</MA_DAN_TOC>'), 'Auto fill MA_DAN_TOC to 01');
    assert.ok(!sanitized.includes('<DIA_CHI></DIA_CHI>'), 'Empty DIA_CHI was replaced');
    assert.ok(sanitized.includes('<DIA_CHI>') && sanitized.includes('</DIA_CHI>'), 'DIA_CHI has content');
});
