import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHealthCheckSyncPayload } from '../src/services/health-check-sync-payload';

const header = {
    version: '1.0.6', sender_id: '8934285008135', receiver_id: 'TTYQG',
    txn_type: 'sync_checkup', msg_type: '101', data_type: 'xml/base64' as const,
    send_datetime: 1720000000000, msg_id: '8934285008135250101ABC'
};

test('data-sync payload uses Base64 string data matching EMRHub gateway specification', () => {
    const payload = buildHealthCheckSyncPayload(header, ' QUJD\nREV G ');
    assert.equal(payload.data, 'QUJDREVG');
    assert.equal(payload.signature, '');
});

test('data-sync payload rejects empty file content', () => {
    assert.throws(() => buildHealthCheckSyncPayload(header, '  '), /file_content Base64/);
});
