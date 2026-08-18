import test from 'node:test';
import assert from 'node:assert/strict';
import { isRetryableSyncFailure, shouldRetryStoredSyncError } from '../src/services/health-check-sync-retry';

test('retry policy retries transient gateway/network failures', () => {
    assert.equal(isRetryableSyncFailure(504, 'GATEWAY_TIMEOUT', 'gateway timeout'), true);
    assert.equal(isRetryableSyncFailure(undefined, '', 'ETIMEDOUT'), true);
    assert.equal(isRetryableSyncFailure(429, 'RATE_LIMIT', 'too many requests'), true);
});

test('retry policy does not retry permanent validation/signature failures', () => {
    assert.equal(isRetryableSyncFailure(400, 'CM_INVALID_REQUEST', 'invalid payload'), false);
    assert.equal(isRetryableSyncFailure(200, 'PS_SIGNATURE_INVALID', 'invalid signature'), false);
    assert.equal(shouldRetryStoredSyncError('[CM_INVALID_REQUEST] invalid payload'), false);
});

test('stored retry policy recognizes only transient error messages', () => {
    assert.equal(shouldRetryStoredSyncError('Lỗi kết nối cổng: 503 - Service unavailable'), true);
    assert.equal(shouldRetryStoredSyncError('Lỗi kết nối cổng: 400 - invalid payload'), true);
    assert.equal(shouldRetryStoredSyncError('[PS_SIGNATURE_INVALID] invalid signature'), false);
});
