import test from 'node:test';
import assert from 'node:assert/strict';
import { validateNewHealthCheckDocument } from '../src/services/health-check-new-document-validation';

test('new QĐ 2062 child record requires DOB and funding, but not adult classification', () => {
    assert.deepEqual(validateNewHealthCheckDocument({ formType: '1', dob: '2022-01-01', examDate: '2026-08-13', fundingSource: '4' }), []);
});

test('new QĐ 2062 school-age and adult records require health classification', () => {
    assert.equal(validateNewHealthCheckDocument({ formType: '2', dob: '2012-01-01', examDate: '2026-08-13', fundingSource: '5' }).length, 1);
    assert.deepEqual(validateNewHealthCheckDocument({ formType: '2', dob: '2012-01-01', examDate: '2026-08-13', fundingSource: '5', fitnessClass: '2' }), []);
    assert.deepEqual(validateNewHealthCheckDocument({ formType: '3', dob: '2000-01-01', examDate: '2026-08-13', fundingSource: '9', fitnessClass: '1' }), []);
});

test('new record rejects legacy form types and missing required fields', () => {
    const errors = validateNewHealthCheckDocument({ formType: '14', dob: '', fundingSource: '' });
    assert.equal(errors.length, 4);
});

test('new record rejects invalid funding and health classification codes', () => {
    const errors = validateNewHealthCheckDocument({ formType: '3', dob: '2000-01-01', examDate: '2026-08-13', fundingSource: '7', fitnessClass: 'VI' });
    assert.equal(errors.length, 2);
    assert.match(errors[0], /Nguồn chi trả không hợp lệ/);
    assert.match(errors[1], /Phân loại sức khỏe không hợp lệ/);
});

test('new record enforces form and age-group consistency at 6 and 18 boundaries', () => {
    assert.deepEqual(validateNewHealthCheckDocument({ formType: '2', dob: '2020-08-13', examDate: '2026-08-13', fundingSource: '1', fitnessClass: '1' }).slice(-1), []);
    assert.match(validateNewHealthCheckDocument({ formType: '1', dob: '2020-08-13', examDate: '2026-08-13', fundingSource: '1', fitnessClass: '1' }).at(-1) || '', /không phù hợp/);
    assert.match(validateNewHealthCheckDocument({ formType: '2', dob: '2008-08-13', examDate: '2026-08-13', fundingSource: '1', fitnessClass: '1' }).at(-1) || '', /không phù hợp/);
    assert.deepEqual(validateNewHealthCheckDocument({ formType: '3', dob: '2008-08-13', examDate: '2026-08-13', fundingSource: '1', fitnessClass: '1' }).slice(-1), []);
});

test('new record rejects a birth date after the examination date', () => {
    const errors = validateNewHealthCheckDocument({ formType: '1', dob: '2027-01-01', examDate: '2026-08-13', fundingSource: '1' });
    assert.ok(errors.some(error => /Ngày sinh không được lớn hơn ngày khám/.test(error)));
});
