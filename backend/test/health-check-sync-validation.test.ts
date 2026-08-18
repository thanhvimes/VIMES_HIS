import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDocumentBeforeSync } from '../src/services/health-check-sync-validation';

const valid = { signature_status: 'Signed', send_status: 'Unsent', xml_data: '<KHAMSUCKHOE/>', signature: 'signed-value' };

test('sync validation accepts a signed unsent document with XML', () => {
    assert.equal(validateDocumentBeforeSync(valid), null);
});

test('sync validation rejects unsigned document', () => {
    assert.equal(validateDocumentBeforeSync({ ...valid, signature_status: 'Unsigned' }), 'Hồ sơ chưa ký số, không được gửi cổng');
});

test('sync validation rejects missing XML or signature', () => {
    assert.equal(validateDocumentBeforeSync({ ...valid, xml_data: '' }), 'Hồ sơ chưa có XML dữ liệu để gửi');
    assert.equal(validateDocumentBeforeSync({ ...valid, signature: '' }), 'Hồ sơ thiếu chữ ký số để gửi cổng');
});

test('sync validation rejects already successful document', () => {
    assert.equal(validateDocumentBeforeSync({ ...valid, send_status: 'Success' }), 'Hồ sơ đã gửi cổng thành công');
});
