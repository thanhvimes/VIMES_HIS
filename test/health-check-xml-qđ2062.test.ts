import test from 'node:test';
import assert from 'node:assert/strict';
import { findValue, generateXmlPayload, resolveHealthCheckAgeGroup } from '../src/controllers/health-check/xml-generator';
import { validateHealthCheckEnvelope } from '../src/services/health-check-xml-validation';
import { sanitizeXmlContent } from '../src/services/health-check-sync.service';

test('QĐ 2062 age group uses exact birthday boundaries', () => {
    assert.equal(resolveHealthCheckAgeGroup('legacy', '2020-08-14', '2026-08-13'), 'UNDER_6');
    assert.equal(resolveHealthCheckAgeGroup('legacy', '2020-08-13', '2026-08-13'), 'AGE_6_TO_UNDER_18');
    assert.equal(resolveHealthCheckAgeGroup('legacy', '2008-08-14', '2026-08-13'), 'AGE_6_TO_UNDER_18');
    assert.equal(resolveHealthCheckAgeGroup('legacy', '2008-08-13', '2026-08-13'), 'ADULT_18_PLUS');
});

test('legacy XML normalization classifies age by exact birthday on examination date', () => {
    const raw = '<KHAMSUCKHOE><THONGTINDONVI><MACSKCB>8934285008135</MACSKCB></THONGTINDONVI>'
        + '<THONGTINHOSO><NGAY_KHAM>20260813</NGAY_KHAM><FILEHOSO><NOIDUNGFILE>'
        + '<THONG_TIN_HANH_CHINH><NGAY_SINH>20080814</NGAY_SINH><TYPE>Adult</TYPE></THONG_TIN_HANH_CHINH>'
        + '</NOIDUNGFILE></FILEHOSO></THONGTINHOSO></KHAMSUCKHOE>';
    const normalized = sanitizeXmlContent(raw);
    assert.match(normalized, /<TYPE>Minor<\/TYPE>/);
});

test('XML TYPE follows age group instead of legacy form number when DOB is available', () => {
    const makeXml = (dob: string) => generateXmlPayload(
        'legacy-form-6',
        { patient_name: 'TEST', cccd: '012345678901', dob, created_at: '2026-08-13T00:00:00Z', doc_no: `LK-${dob}` },
        { funding_source: '9' },
        {},
        { fitness_class: '1' }
    );

    assert.match(makeXml('2022-08-14'), /<TYPE>ChildUnder<\/TYPE>/);
    assert.match(makeXml('2012-08-14'), /<TYPE>Minor<\/TYPE>/);
    assert.match(makeXml('2000-08-14'), /<TYPE>Adult<\/TYPE>/);
});

test('new three-form flow emits the correct XML TYPE for each age group', () => {
    const cases = [
        ['1', '2022-08-14', 'ChildUnder'],
        ['2', '2012-08-14', 'Minor'],
        ['3', '2000-08-14', 'Adult'],
    ] as const;
    for (const [formType, dob, expectedType] of cases) {
        const xml = generateXmlPayload(formType, { patient_name: 'TEST', cccd: '012345678901', dob, created_at: '2026-08-13T00:00:00Z', doc_no: `NEW-${formType}` }, { funding_source: '4' }, {}, { fitness_class: '1' });
        assert.match(xml, new RegExp(`<TYPE>${expectedType}<\\/TYPE>`));
        assert.equal(validateHealthCheckEnvelope(xml).valid, true);
    }
});

test('generated QĐ 2062 XML passes the Envelope structural validator', () => {
    const xml = generateXmlPayload('2', { patient_name: 'TEST', cccd: '012345678901', dob: '2010-01-01', doc_no: 'LK-STRUCT' }, { funding_source: '9' }, {}, { fitness_class: '1' });
    const result = validateHealthCheckEnvelope(xml);
    assert.equal(result.valid, true, result.errors.join('; '));
});

test('QĐ 2062 funding_source maps to NGUON_CHI_TRA without fallback', () => {
    const value = findValue('NGUON_CHI_TRA', { clinical_data: { funding_source: '4' } });
    assert.equal(value, '4');
});

test('QĐ 2062 new history fields are emitted in XML1', () => {
    const xml = generateXmlPayload(
        '2',
        { patient_name: 'NGUYEN VAN A', cccd: '012345678901', dob: '2010-01-01', gender: '1', doc_no: 'LK-001' },
        {
            funding_source: '5',
            extra: {
                tsbt_nghien_ruou: '1',
                tsbt_ma_benh: 'I10',
                tsbt_ma_benh_khac: 'I10;E11',
                tsbt_thai_san: '1',
                tsbt_ma_benh_thai_san: 'O24',
                tsbt_ten_thuoc_thai_san: 'Insulin 10 đơn vị',
                nhi_khoa_lam_sang_khac: 'Theo dõi thêm',
                tiem_chung_cac_loai_khac: '1',
                tiem_chung_vac_xin_khac: 'Thủy đậu, Phế cầu, HPV'
            }
        },
        {},
        { fitness_class: '2' }
    );

    assert.match(xml, /<NGUON_CHI_TRA>5<\/NGUON_CHI_TRA>/);
    assert.match(xml, /<TIEM_CHUNG_CAC_LOAI_KHAC>1<\/TIEM_CHUNG_CAC_LOAI_KHAC>/);
    assert.match(xml, /<TIEM_CHUNG_VAC_XIN_KHAC>Thủy đậu, Phế cầu, HPV<\/TIEM_CHUNG_VAC_XIN_KHAC>/);
    assert.match(xml, /<TSBT_NGHIEN_RUOU>1<\/TSBT_NGHIEN_RUOU>/);
    assert.match(xml, /<TSBT_MA_BENH_KHAC>I10;E11<\/TSBT_MA_BENH_KHAC>/);
    assert.match(xml, /<TSBT_MAC_BENH>1<\/TSBT_MAC_BENH>/);
    assert.match(xml, /<TSBT_THAI_SAN>1<\/TSBT_THAI_SAN>/);
    assert.match(xml, /<TSBT_MA_BENH_THAI_SAN>O24<\/TSBT_MA_BENH_THAI_SAN>/);
    assert.match(xml, /<TSBT_TEN_THUOC_THAI_SAN>Insulin 10 đơn vị<\/TSBT_TEN_THUOC_THAI_SAN>/);
    assert.match(xml, /<NHI_KHOA_LAM_SANG_KHAC>Theo dõi thêm<\/NHI_KHOA_LAM_SANG_KHAC>/);
});

test('PHAN_LOAI_SK correctly reflects any selected fitness class (Loại 1 đến Loại 5 & số La Mã)', () => {
    const testClasses = [
        ['1', '1'],
        ['2', '2'],
        ['3', '3'],
        ['4', '4'],
        ['5', '5'],
        ['I', '1'],
        ['II', '2'],
        ['III', '3'],
        ['IV', '4'],
        ['V', '5'],
    ];

    for (const [inputClass, expectedXml] of testClasses) {
        const xml = generateXmlPayload(
            '3',
            { patient_name: 'TEST PHAN LOAI', cccd: '012345678901', dob: '1990-01-01', doc_no: 'LK-PL' },
            {},
            {},
            { fitness_class: inputClass }
        );
        assert.match(xml, new RegExp(`<PHAN_LOAI_SK>${expectedXml}<\\/PHAN_LOAI_SK>`));
    }
});

test('Conclusion fields (CAC_VAN_DE_SUC_KHOE, KET_LUAN_BENH, CAC_BENH_TAT_NEU_CO) correctly match user inputs', () => {
    const xml = generateXmlPayload(
        '3',
        { patient_name: 'TRAN VAN B', cccd: '012345678901', dob: '1985-05-15', doc_no: 'LK-002' },
        {},
        {},
        {
            fitness_class: '3',
            diagnosis: 'I10 - Tăng huyết áp vô căn',
            cac_van_de_luu_y: 'Hạn chế làm việc trên cao và nơi có tiếng ồn lớn',
            cac_benh_tat_neu_co: 'Viêm mũi dị ứng mạn tính'
        }
    );

    assert.match(xml, /<PHAN_LOAI_SK>3<\/PHAN_LOAI_SK>/);
    assert.match(xml, /<KET_LUAN_BENH>I10 - Tăng huyết áp vô căn<\/KET_LUAN_BENH>/);
    assert.match(xml, /<CAC_VAN_DE_SUC_KHOE>Hạn chế làm việc trên cao và nơi có tiếng ồn lớn<\/CAC_VAN_DE_SUC_KHOE>/);
    assert.match(xml, /<CAC_BENH_TAT_NEU_CO>Viêm mũi dị ứng mạn tính<\/CAC_BENH_TAT_NEU_CO>/);
});

test('Physical exam rating KHAM_THE_LUC_PL and vitals reflect inputs', () => {
    const xml = generateXmlPayload(
        '3',
        { patient_name: 'LE VAN C', cccd: '012345678901', dob: '1995-10-10', doc_no: 'LK-003' },
        {
            examination: {
                height: '172',
                weight: '68',
                pulse: '75',
                blood_pressure: '120/80',
                bmi: '23.0'
            },
            clinical_exam: {
                kham_the_luc_pl: '2'
            }
        },
        {},
        { fitness_class: '2' }
    );

    assert.match(xml, /<CHIEU_CAO>172<\/CHIEU_CAO>/);
    assert.match(xml, /<CAN_NANG>68<\/CAN_NANG>/);
    assert.match(xml, /<CHI_SO_BMI>23.0<\/CHI_SO_BMI>/);
    assert.match(xml, /<MACH>75<\/MACH>/);
    assert.match(xml, /<HUYET_AP>120\/80<\/HUYET_AP>/);
    assert.match(xml, /<KHAM_THE_LUC_PL>2<\/KHAM_THE_LUC_PL>/);
});

test('Child Under 6 clinical exam fields map properly from state synonyms', () => {
    const xml = generateXmlPayload(
        '1',
        { patient_name: 'BE NGUYEN VAN EM', cccd: '001090123456', dob: '2023-01-01', doc_no: 'LK-CHILD' },
        {
            extra: {
                cam_nho_tut_sau: '1',
                vet_sau_mang_bam: '1',
                dh_suy_ho_hap: '1',
                nghe_tim: '1',
                khoi_bat_thuong_bung: '1',
                cq_sinh_duc_ngoai: '1',
                kham_tu_chi_khop: '1',
                kich_thuoc_dau: '1',
                vi_tri_2_mat: '1'
            },
            conclusion: {
                fitness_class: '1',
                diagnosis: 'Bình thường'
            }
        },
        {},
        {}
    );

    assert.match(xml, /<CAM_NHO_TUT_VE_SAU>1<\/CAM_NHO_TUT_VE_SAU>/);
    assert.match(xml, /<SAU_MANG_BAM_LO>1<\/SAU_MANG_BAM_LO>/);
    assert.match(xml, /<SUY_HO_HAP>1<\/SUY_HO_HAP>/);
    assert.match(xml, /<TIENG_TIM>1<\/TIENG_TIM>/);
    assert.match(xml, /<KHOI_BAT_THUONG>1<\/KHOI_BAT_THUONG>/);
    assert.match(xml, /<CO_QUAN_SINH_DUC_NGOAI>1<\/CO_QUAN_SINH_DUC_NGOAI>/);
    assert.match(xml, /<TU_CHI_KHOP>1<\/TU_CHI_KHOP>/);
    assert.match(xml, /<HINH_DANG_DAU>1<\/HINH_DANG_DAU>/);
    assert.match(xml, /<VI_TRI_HAI_MAT>1<\/VI_TRI_HAI_MAT>/);
});

test('Paraclinical discrete lab items are automatically serialized into XML11 CHI_TIET_CLS entries', () => {
    const xml = generateXmlPayload(
        '3',
        { patient_name: 'HOANG THI D', cccd: '012345678901', dob: '1988-03-03', doc_no: 'LK-LAB' },
        {},
        {
            blood_test: {
                hemoglobin: '135',
                glycemia: '5.4'
            },
            urine_test: {
                protein: 'Âm tính'
            }
        },
        { fitness_class: '1' }
    );

    assert.match(xml, /<CHI_TIET_CLS>/);
    assert.match(xml, /<MA_CHI_SO>H02<\/MA_CHI_SO>/);
    assert.match(xml, /<GIA_TRI>135<\/GIA_TRI>/);
    assert.match(xml, /<MA_CHI_SO>G01<\/MA_CHI_SO>/);
    assert.match(xml, /<GIA_TRI>5.4<\/GIA_TRI>/);
    assert.match(xml, /<MA_CHI_SO>PRO_U<\/MA_CHI_SO>/);
    assert.match(xml, /<GIA_TRI>Âm tính<\/GIA_TRI>/);
});

test('QĐ 2062 generates XML9 file with TIEN_SU_BENH_TAT and valid Envelope', () => {
    const xml = generateXmlPayload(
        '3',
        { patient_name: 'TRAN VAN B', cccd: '038076080237', dob: '1996-10-08', gender: '2', doc_no: '26402784' },
        {
            funding_source: '1',
            extra: {
                tsgd_mac_benh: '1',
                tsgd_ma_benh: 'I10',
                ts_tiep_xuc_lao: '0',
                ts_mac_benh: 1,
                tsbt_ma_benh: 'K29',
                ts_tang_huyet_ap: 1,
                ts_dai_thao_duong: 1,
                ts_benh_tim_mach: 1,
                ts_su_dung_ruou: 0,
                tsbt_ma_benh_khac: 'Viêm dạ dày mạn',
                tsbt_ten_thuoc_lieu_luong: 'Omeprazol 20mg'
            }
        },
        {},
        { fitness_class: '1' }
    );

    assert.match(xml, /<LOAIHOSO>XML9<\/LOAIHOSO>/);
    assert.match(xml, /<TIEN_SU_BENH_TAT>/);
    assert.match(xml, /<TSGD_MAC_BENH>1<\/TSGD_MAC_BENH>/);
    assert.match(xml, /<TSGD_MA_BENH>I10<\/TSGD_MA_BENH>/);
    assert.match(xml, /<TSBT_MAC_BENH>1<\/TSBT_MAC_BENH>/);
    assert.match(xml, /<TSBT_MA_BENH>K29<\/TSBT_MA_BENH>/);
    assert.match(xml, /<TSBT_TANG_HUYET_AP>1<\/TSBT_TANG_HUYET_AP>/);
    assert.match(xml, /<TSBT_DAI_THAO_DUONG>1<\/TSBT_DAI_THAO_DUONG>/);
    assert.match(xml, /<TSBT_BENH_TIM>1<\/TSBT_BENH_TIM>/);
    assert.match(xml, /<TSBT_MA_BENH_KHAC>Viêm dạ dày mạn<\/TSBT_MA_BENH_KHAC>/);
    assert.match(xml, /<TSBT_TEN_THUOC_LIEU_LUONG>Omeprazol 20mg<\/TSBT_TEN_THUOC_LIEU_LUONG>/);
    assert.match(xml, /<\/TIEN_SU_BENH_TAT>/);

    const validation = validateHealthCheckEnvelope(xml);
    assert.equal(validation.valid, true, validation.errors.join('; '));
});

test('SAN_KHOA and SAN_KHOA_KHONG_BT normalize invalid 0 to empty and set SAN_KHOA=1 for normal minors', () => {
    const xml = generateXmlPayload(
        '2',
        {
            patientName: 'MAI THI THANH NHAN',
            dob: '2014-05-10',
            gender: 'Nữ',
            docNo: 'KSK-2026-26040227'
        },
        {
            examination: {},
            clinical_exam: {},
            extra: {
                san_khoa: '0',
                san_khoa_khong_bt: '0' // Previously saved invalid 0 from legacy form
            }
        },
        {},
        { fitness_class: '1' }
    );

    // Must NOT contain <SAN_KHOA_KHONG_BT>0</SAN_KHOA_KHONG_BT> which portal rejects
    assert.doesNotMatch(xml, /<SAN_KHOA_KHONG_BT>0<\/SAN_KHOA_KHONG_BT>/);
    assert.match(xml, /<SAN_KHOA>1<\/SAN_KHOA>/);
    assert.match(xml, /<SAN_KHOA_KHONG_BT><\/SAN_KHOA_KHONG_BT>/);
});

test('SAN_KHOA and SAN_KHOA_KHONG_BT properly emit codes 1-5 when abnormal', () => {
    const xml = generateXmlPayload(
        '2',
        {
            patientName: 'NGUYEN GIA BAO',
            dob: '2015-08-20',
            gender: 'Nam',
            docNo: 'KSK-2026-26040228'
        },
        {
            examination: {},
            clinical_exam: {},
            extra: {
                san_khoa: '0',
                san_khoa_khong_bt: '3', // Can thiệp lúc sinh
                ma_benh_san_khoa_khong_bt: 'P07.1'
            }
        },
        {},
        { fitness_class: '1' }
    );

    assert.match(xml, /<SAN_KHOA>0<\/SAN_KHOA>/);
    assert.match(xml, /<SAN_KHOA_KHONG_BT>3<\/SAN_KHOA_KHONG_BT>/);
    assert.match(xml, /<MA_BENH_SAN_KHOA_KHONG_BT>P07\.1<\/MA_BENH_SAN_KHOA_KHONG_BT>/);
});

