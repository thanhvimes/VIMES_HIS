import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatYmdString } from '../src/services/health-check-merge.service';
import { generateXmlPayload, resolveHealthCheckAgeGroup } from '../src/controllers/health-check/xml-generator';

test('Date Parsing & Timezone Protection: formatYmdString', () => {
    // 1. Chuẩn YYYY-MM-DD
    assert.equal(formatYmdString('2001-09-02'), '2001-09-02');
    assert.equal(formatYmdString('1956-08-27'), '1956-08-27');

    // 2. Định dạng VN: DD/MM/YYYY hoặc DD-MM-YYYY
    assert.equal(formatYmdString('02/09/2001'), '2001-09-02');
    assert.equal(formatYmdString('2-9-2001'), '2001-09-02');
    assert.equal(formatYmdString('27/08/1956'), '1956-08-27');
    assert.equal(formatYmdString('27-08-1956'), '1956-08-27');

    // 3. Date Object
    const dateObj = new Date(1956, 7, 27); // 27/08/1956 local
    assert.equal(formatYmdString(dateObj), '1956-08-27');

    // 4. Null & Undefined
    assert.equal(formatYmdString(null), null);
    assert.equal(formatYmdString(''), null);
    assert.equal(formatYmdString(undefined), null);
});

test('XML Generator: <NGAY_SINH> không bị lùi 1 ngày', () => {
    const master1 = {
        patientName: 'NGUYỄN VĂN A',
        cccd: '037090001234',
        dob: '2001-09-02',
        gender: 'Nam',
        docNo: '2608220001'
    };
    const xml1 = generateXmlPayload('3', master1, {}, {}, {});
    assert.ok(xml1.includes('<NGAY_SINH>20010902</NGAY_SINH>'), 'XML phải chứa ngày sinh 20010902 chính xác, không bị lùi thành 20010901');

    const master2 = {
        patientName: 'DƯƠNG ĐÌNH GIÁP',
        cccd: '037056000001',
        dob: '1956-08-27',
        gender: 'Nam',
        docNo: '2608220002'
    };
    const xml2 = generateXmlPayload('3', master2, {}, {}, {});
    assert.ok(xml2.includes('<NGAY_SINH>19560827</NGAY_SINH>'), 'XML phải chứa ngày sinh 19560827 chính xác, không bị lùi thành 19560826');
});

test('Age Group Resolver: Tính độ tuổi chính xác từ ngày sinh YYYY-MM-DD', () => {
    const examDate = new Date(2026, 7, 22); // 22/08/2026

    // Trẻ dưới 6 tuổi
    assert.equal(resolveHealthCheckAgeGroup('1', '2022-01-01', examDate), 'UNDER_6');
    assert.equal(resolveHealthCheckAgeGroup('1', '2020-09-01', examDate), 'UNDER_6'); // 5 tuổi 11 tháng

    // Trẻ 6 đến dưới 18 tuổi
    assert.equal(resolveHealthCheckAgeGroup('2', '2020-08-01', examDate), 'AGE_6_TO_UNDER_18'); // 6 tuổi
    assert.equal(resolveHealthCheckAgeGroup('2', '2010-05-15', examDate), 'AGE_6_TO_UNDER_18'); // 16 tuổi

    // Người lớn >= 18 tuổi
    assert.equal(resolveHealthCheckAgeGroup('3', '2008-08-20', examDate), 'ADULT_18_PLUS'); // 18 tuổi 2 ngày
    assert.equal(resolveHealthCheckAgeGroup('3', '2001-09-02', examDate), 'ADULT_18_PLUS'); // 24 tuổi
    assert.equal(resolveHealthCheckAgeGroup('3', '1956-08-27', examDate), 'ADULT_18_PLUS'); // 69 tuổi
});
