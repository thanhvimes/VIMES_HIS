import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMandatoryPortalFields } from '../src/services/health-check-mandatory-fields';

test('17 mandatory portal fields - valid adult health check passes completely', () => {
    const validAdult = {
        formType: '3',
        patientName: 'NGUYỄN VĂN AN',
        gender: '1',
        dob: '1990-05-15',
        ethnic: '01',
        cccd: '037090001234',
        address: 'Số 123 Phố Huế, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội',
        maTinhCuTru: '01',
        maXaCuTru: '00001',
        maNgheNghiep: '01',
        lyDoVv: 'Khám sức khỏe đi làm',
        maCskcb: '37101',
        maGtinCskcb: '8934285008135',
        targetGroup: '01',
        fundingSource: '1',
        loaiHinhKcb: '01',
        ngayVao: '2026-09-16',
        fitnessClass: '1'
    };

    const result = validateMandatoryPortalFields(validAdult);
    assert.equal(result.valid, true, `Errors found: ${result.errors.join(', ')}`);
    assert.equal(result.errors.length, 0);
    assert.equal(Object.keys(result.fieldErrors).length, 0);
});

test('17 mandatory portal fields - nested structures (master, clinical, lab, conclusion)', () => {
    const nestedData = {
        master: {
            form_type: '3',
            patient_name: 'TRẦN THỊ BÍCH',
            gender: '2',
            dob: '1995-10-20',
            cccd: '037195009876'
        },
        clinical: {
            ethnic: '01',
            address: 'Thôn 2, Xã Ninh Hiệp, Gia Lâm, Hà Nội',
            matinh_cu_tru: '01',
            maxa_cu_tru: '00123',
            ma_nghe_nghiep: '02',
            ly_do_vv: 'Khám sức khỏe định kỳ hàng năm',
            ma_cskcb: '37101',
            ma_gtin_cskcb: '8934285008135',
            target_group: '01',
            funding_source: '9',
            loai_hinh_kcb: '01',
            ngay_vao: '2026-09-16'
        },
        conclusion: {
            fitness_class: '2'
        }
    };

    const result = validateMandatoryPortalFields(nestedData);
    assert.equal(result.valid, true, `Errors: ${result.errors.join(', ')}`);
});

test('17 mandatory portal fields - checks HO_TEN requirements', () => {
    // Missing
    let res = validateMandatoryPortalFields({ patientName: '' });
    assert.ok(res.errors.some(e => e.includes('HO_TEN')));
    assert.ok(res.fieldErrors.patientName);

    // Lowercase (Must be UPPERCASE with tone marks per QĐ 3176)
    res = validateMandatoryPortalFields({ patientName: 'Nguyễn Văn An' });
    assert.ok(res.errors.some(e => e.includes('IN HOA có dấu')));
});

test('17 mandatory portal fields - checks SO_CCCD exactly 12 digits', () => {
    // 9 digits rejected
    let res = validateMandatoryPortalFields({ cccd: '123456789' });
    assert.ok(res.errors.some(e => e.includes('12 chữ số')));

    // Letters rejected
    res = validateMandatoryPortalFields({ cccd: '03709000123A' });
    assert.ok(res.errors.some(e => e.includes('12 chữ số')));
});

test('17 mandatory portal fields - checks Child form (<6 yo) requires guardian CCCD when child has no CCCD', () => {
    const childNoCccd = {
        formType: '1',
        isChild: true,
        patientName: 'LÊ BẢO NAM',
        gender: '1',
        dob: '2023-01-01',
        ethnic: '01',
        noCccd: true,
        guardianCccd: '037090005555',
        address: 'Hà Nội',
        maTinhCuTru: '01',
        maXaCuTru: '00001',
        maNgheNghiep: '00',
        lyDoVv: 'Khám sức khỏe mầm non',
        maCskcb: '37101',
        maGtinCskcb: '8934285008135',
        targetGroup: '10',
        fundingSource: '9',
        loaiHinhKcb: '01',
        ngayVao: '2026-09-16',
        childFitnessSummary: 'Phát triển thể lực và tinh thần bình thường'
    };

    const res = validateMandatoryPortalFields(childNoCccd);
    assert.equal(res.valid, true, `Errors: ${res.errors.join(', ')}`);

    // Invalid guardian CCCD
    childNoCccd.guardianCccd = '123';
    const resInvalid = validateMandatoryPortalFields(childNoCccd);
    assert.equal(resInvalid.valid, false);
    assert.ok(resInvalid.errors.some(e => e.includes('người giám hộ')));
});

test('17 mandatory portal fields - checks NGUON_CHI_TRA validity', () => {
    const base = { fundingSource: '7' };
    const res = validateMandatoryPortalFields(base);
    assert.ok(res.errors.some(e => e.includes('chỉ chấp nhận mã 1, 2, 3, 4, 5, 9')));
});

test('17 mandatory portal fields - checks PHAN_LOAI_SK for adult forms', () => {
    const base = { formType: '3', fitnessClass: '' };
    const res = validateMandatoryPortalFields(base);
    assert.ok(res.errors.some(e => e.includes('PHAN_LOAI_SK')));

    // Roman numeral conversion supported (I -> 1, II -> 2, III -> 3, IV -> 4, V -> 5)
    const roman = { formType: '3', fitnessClass: 'II' };
    const resRoman = validateMandatoryPortalFields(roman);
    assert.equal(resRoman.fieldErrors.fitnessClass, undefined);
});

test('17 mandatory portal fields - checks administrative fields (MATINH, MAXA, MA_NGHE_NGHIEP, LY_DO_VV, DOI_TUONG)', () => {
    const missingAdmin = {
        patientName: 'NGUYỄN VĂN AN',
        gender: '1',
        dob: '1990-01-01',
        cccd: '037090001234',
        address: 'Hà Nội'
        // Missing: ethnic, maTinhCuTru, maXaCuTru, maNgheNghiep, lyDoVv, targetGroup, fundingSource, ngayVao, fitnessClass
    };

    const res = validateMandatoryPortalFields(missingAdmin);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('MA_DAN_TOC')));
    assert.ok(res.errors.some(e => e.includes('MATINH_CU_TRU')));
    assert.ok(res.errors.some(e => e.includes('MAXA_CU_TRU')));
    assert.ok(res.errors.some(e => e.includes('MA_NGHE_NGHIEP')));
    assert.ok(res.errors.some(e => e.includes('LY_DO_VV')));
    assert.ok(res.errors.some(e => e.includes('DOI_TUONG')));
    assert.ok(res.errors.some(e => e.includes('NGUON_CHI_TRA')));
    assert.ok(res.errors.some(e => e.includes('NGAY_VAO')));
    assert.ok(res.errors.some(e => e.includes('PHAN_LOAI_SK')));
});

