import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHealthCheckSyncPayload } from '../src/services/health-check-sync-payload';

const header = {
    version: '1.0.6', sender_id: '8934285008135', receiver_id: 'TDLBYT',
    txn_type: 'sync_checkup', msg_type: '101', data_type: 'xml/base64' as const,
    send_datetime: 1720000000000, msg_id: '8934285008135250101ABC'
};

test('QĐ 2062 data-sync payload uses data.file_content object', () => {
    const payload = buildHealthCheckSyncPayload(header, ' QUJD\nREV G ');
    assert.deepEqual(payload.data, { file_content: 'QUJDREVG' });
    assert.equal(payload.signature, '');
});

test('QĐ 2062 data-sync payload rejects empty file content', () => {
    assert.throws(() => buildHealthCheckSyncPayload(header, '  '), /file_content Base64/);
});
