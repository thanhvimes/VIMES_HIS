import test from 'node:test';
import assert from 'node:assert/strict';
import { query } from '../src/config/database';
import { loadHealthCheckSettings, getHealthCheckSettings } from '../src/config/health-check-settings';
import { sendDocumentsToVNeID } from '../src/services/health-check-sync.service';

test('1. Database Schema: verifies all columns exist in health_check_settings and health_check_masters', async () => {
    const settingsColsRes = await query(`
        SELECT column_name, data_type, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'health_check_settings'
        AND column_name IN ('sync_target_mode', 'syt_url', 'syt_username', 'syt_password', 'syt_receiver_id', 'syt_enabled')
    `);
    const settingsColNames = settingsColsRes.rows.map(r => r.column_name);
    assert.ok(settingsColNames.includes('sync_target_mode'), 'sync_target_mode column exists in health_check_settings');
    assert.ok(settingsColNames.includes('syt_url'), 'syt_url column exists in health_check_settings');
    assert.ok(settingsColNames.includes('syt_username'), 'syt_username column exists in health_check_settings');
    assert.ok(settingsColNames.includes('syt_password'), 'syt_password column exists in health_check_settings');
    assert.ok(settingsColNames.includes('syt_receiver_id'), 'syt_receiver_id column exists in health_check_settings');
    assert.ok(settingsColNames.includes('syt_enabled'), 'syt_enabled column exists in health_check_settings');

    const mastersColsRes = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'health_check_masters'
        AND column_name IN ('syt_send_status', 'syt_sent_at', 'syt_transaction_id', 'syt_error_message', 'syt_response_log')
    `);
    const mastersColNames = mastersColsRes.rows.map(r => r.column_name);
    assert.ok(mastersColNames.includes('syt_send_status'), 'syt_send_status column exists in health_check_masters');
    assert.ok(mastersColNames.includes('syt_sent_at'), 'syt_sent_at column exists in health_check_masters');
    assert.ok(mastersColNames.includes('syt_transaction_id'), 'syt_transaction_id column exists in health_check_masters');
    assert.ok(mastersColNames.includes('syt_error_message'), 'syt_error_message column exists in health_check_masters');
    assert.ok(mastersColNames.includes('syt_response_log'), 'syt_response_log column exists in health_check_masters');
});

test('2. loadHealthCheckSettings: loads default values and preserves backward compatibility', async () => {
    const settings = await loadHealthCheckSettings();

    assert.ok(settings, 'Settings loaded successfully');
    assert.ok(['BYT_ONLY', 'BOTH', 'SYT_ONLY'].includes(settings?.sync_target_mode || 'BYT_ONLY'), 'Valid sync_target_mode');
    assert.equal(typeof settings?.syt_url, 'string', 'syt_url is string');
    assert.equal(typeof settings?.syt_receiver_id, 'string', 'syt_receiver_id is string');
});

test('3. Settings update: persists SYT configuration and target modes correctly', async () => {
    // Test updating to BOTH mode with test SYT credentials
    await query(`
        UPDATE health_check_settings 
        SET sync_target_mode = 'BOTH',
            syt_url = 'https://api-hssk.hanoi.gov.vn',
            syt_username = 'test_syt_facility',
            syt_receiver_id = 'VTS',
            syt_enabled = TRUE
        WHERE id = 1
    `);

    const updated = await loadHealthCheckSettings();

    assert.equal(updated?.sync_target_mode, 'BOTH', 'Target mode correctly updated to BOTH');
    assert.equal(updated?.syt_url, 'https://api-hssk.hanoi.gov.vn');
    assert.equal(updated?.syt_username, 'test_syt_facility');
    assert.equal(updated?.syt_receiver_id, 'VTS');
    assert.equal(updated?.syt_enabled, true);

    // Revert back to BYT_ONLY to ensure production backward compatibility
    await query(`
        UPDATE health_check_settings 
        SET sync_target_mode = 'BYT_ONLY',
            syt_enabled = FALSE
        WHERE id = 1
    `);
    const reverted = await loadHealthCheckSettings();
    assert.equal(reverted?.sync_target_mode, 'BYT_ONLY');
});

test('4. Target Mode Logic: sendDocumentsToVNeID handles non-existent or empty IDs gracefully without throwing', async () => {
    // Calling with empty array
    const emptyResult = await sendDocumentsToVNeID([]);
    assert.deepEqual(emptyResult, [], 'Empty array returns empty failed list');

    // Calling with non-existent ID
    const fakeResult = await sendDocumentsToVNeID(['999999999']);
    assert.ok(Array.isArray(fakeResult), 'Returns array of failed IDs for non-existent document');
});
