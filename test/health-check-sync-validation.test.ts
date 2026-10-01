import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDocumentBeforeSync } from '../src/services/health-check-sync-validation';

const valid = { signature_status: 'Signed', send_status: 'Unsent', xml_data: '<KHAMSUCKHOE/>', signature: 'signed-value' };

test('sync validation accepts a signed unsent document with XML', () => {
    assert.equal(validateDocumentBeforeSync(valid), null);
});

test('sync validation rejects unsigned document when allow_unsigned_sync is false or omitted', () => {
    assert.equal(validateDocumentBeforeSync({ ...valid, signature_status: 'Unsigned' }), 'Hồ sơ chưa ký số, không được gửi cổng');
    assert.equal(validateDocumentBeforeSync({ ...valid, signature_status: 'Unsigned' }, { allow_unsigned_sync: false }), 'Hồ sơ chưa ký số, không được gửi cổng');
});

test('sync validation accepts unsigned document when allow_unsigned_sync is true', () => {
    assert.equal(validateDocumentBeforeSync({ ...valid, signature_status: 'Unsigned', signature: '' }, { allow_unsigned_sync: true }), null);
});

test('sync validation rejects missing XML', () => {
    assert.equal(validateDocumentBeforeSync({ ...valid, xml_data: '' }), 'Hồ sơ chưa có XML dữ liệu để gửi');
    assert.equal(validateDocumentBeforeSync({ ...valid, xml_data: '' }, { allow_unsigned_sync: true }), 'Hồ sơ chưa có XML dữ liệu để gửi');
});

test('sync validation rejects already successful document', () => {
    assert.equal(validateDocumentBeforeSync({ ...valid, send_status: 'Success' }), 'Hồ sơ đã gửi cổng thành công');
});

test('sync validation in production enforces doctor signature (Tier 1)', () => {
    assert.equal(
        validateDocumentBeforeSync(valid, { allow_unsigned_sync: false, has_doctor_sig: false }),
        'Hồ sơ chưa có chữ ký số của Bác sĩ kết luận'
    );
});

test('sync validation with auto_hsm allows unsigned document when doctor signature is present (Tier 2 auto)', () => {
    assert.equal(
        validateDocumentBeforeSync(
            { ...valid, signature_status: 'Unsigned', signature: '' },
            { allow_unsigned_sync: false, has_doctor_sig: true, auto_hsm: true }
        ),
        null
    );
});

