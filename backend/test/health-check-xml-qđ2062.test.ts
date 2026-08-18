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
                nhi_khoa_lam_sang_khac: 'Theo dõi thêm'
            }
        },
        {},
        { fitness_class: '2' }
    );

    assert.match(xml, /<NGUON_CHI_TRA>5<\/NGUON_CHI_TRA>/);
    assert.match(xml, /<TSBT_NGHIEN_RUOU>1<\/TSBT_NGHIEN_RUOU>/);
    assert.match(xml, /<TSBT_MA_BENH_KHAC>I10;E11<\/TSBT_MA_BENH_KHAC>/);
    assert.match(xml, /<TSBT_MAC_BENH>1<\/TSBT_MAC_BENH>/);
    assert.match(xml, /<TSBT_THAI_SAN>1<\/TSBT_THAI_SAN>/);
    assert.match(xml, /<TSBT_MA_BENH_THAI_SAN>O24<\/TSBT_MA_BENH_THAI_SAN>/);
    assert.match(xml, /<TSBT_TEN_THUOC_THAI_SAN>Insulin 10 đơn vị<\/TSBT_TEN_THUOC_THAI_SAN>/);
    assert.match(xml, /<NHI_KHOA_LAM_SANG_KHAC>Theo dõi thêm<\/NHI_KHOA_LAM_SANG_KHAC>/);
});
