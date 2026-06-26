// ==================== HEALTH CHECK AUTO SYNC SERVICE ====================
// File: backend/src/services/health-check-sync.service.ts

import { query } from '../config/database';
import { getHealthCheckSettings, loadHealthCheckSettings } from '../config/health-check-settings';

let syncIntervalKey: NodeJS.Timeout | null = null;

/**
 * Periodically searches for signed, unsent health check documents 
 * and synchronizes them to the mock VNeID gateway portal.
 */
async function syncUnsentDocuments() {
    try {
        const settings = getHealthCheckSettings();
        if (!settings || !settings.auto_sync_enabled) {
            return;
        }

        // Query signed documents that are unsent or had previous errors
        const sql = `
            SELECT id, patient_name, doc_no, form_type, xml_data
            FROM health_check_masters
            WHERE signature_status = 'Signed' AND (send_status = 'Unsent' OR send_status = 'Error')
            LIMIT 50
        `;
        const res = await query(sql);
        if (res.rows.length === 0) {
            return;
        }

        console.log(`📡 [Auto Sync VNeID] Found ${res.rows.length} signed, unsent health check documents. Synchronizing now...`);

        const docIds = res.rows.map((row: any) => row.id);
        const transactionId = `HC-VNEID-AUTO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        // Simulate network API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update documents to Success status
        const updateSql = `
            UPDATE health_check_masters
            SET "send_status" = 'Success',
                "sent_at" = NOW(),
                "transaction_id" = $1,
                "error_message" = NULL,
                "updated_at" = NOW()
            WHERE id = ANY($2::int[])
        `;
        await query(updateSql, [transactionId, docIds]);

        console.log(`✅ [Auto Sync VNeID] Successfully synchronized ${docIds.length} documents. Transaction: ${transactionId}`);
    } catch (error: any) {
        console.error('❌ [Auto Sync VNeID] Error in auto sync background job:', error.message || error);
    }
}

/**
 * Starts the VNeID auto-sync background worker loop if enabled.
 */
export async function startHealthCheckSyncWorker() {
    // Clear existing interval if running
    if (syncIntervalKey) {
        clearInterval(syncIntervalKey);
        syncIntervalKey = null;
    }

    // Ensure settings are loaded
    let settings = getHealthCheckSettings();
    if (!settings) {
        settings = await loadHealthCheckSettings();
    }

    if (!settings) {
        console.warn('⚠️ [Auto Sync VNeID] Settings could not be loaded. Background worker will not start.');
        return;
    }

    if (!settings.auto_sync_enabled) {
        console.log('💡 [Auto Sync VNeID] Auto-sync is disabled in configuration settings.');
        return;
    }

    const intervalMinutes = settings.auto_sync_interval || 15;
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`🚀 [Auto Sync VNeID] Starting background worker loop. Interval: ${intervalMinutes} minutes.`);

    // Perform an initial scan after a short delay (e.g. 5 seconds after server boot)
    setTimeout(() => {
        syncUnsentDocuments();
    }, 5000);

    // Setup periodic scheduler loop
    syncIntervalKey = setInterval(() => {
        syncUnsentDocuments();
    }, intervalMs);
}

/**
 * Restarts the background worker (useful when configuration parameters change).
 */
export function restartHealthCheckSyncWorker() {
    console.log('🔄 [Auto Sync VNeID] Restarting background worker due to settings configuration change.');
    startHealthCheckSyncWorker();
}
