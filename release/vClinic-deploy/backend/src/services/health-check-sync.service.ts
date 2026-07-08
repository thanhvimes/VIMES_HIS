// ==================== HEALTH CHECK AUTO SYNC SERVICE ====================
// File: backend/src/services/health-check-sync.service.ts

import { query } from '../config/database';
import { getHealthCheckSettings, loadHealthCheckSettings } from '../config/health-check-settings';

import axios from 'axios';
import crypto from 'crypto';

let syncIntervalKey: NodeJS.Timeout | null = null;

/**
 * Synchronizes documents to the VNeID gateway portal.
 * Logs API request and response data to database.
 */
export async function sendDocumentsToVNeID(docIds: string[]): Promise<string[]> {
    const failedIds: string[] = [];
    try {
        const settings = getHealthCheckSettings();
        if (!settings) {
            console.error('❌ [VNeID Portal] Settings not loaded.');
            return docIds;
        }

        console.log('🔍 [VNeID Sync DEBUG] Settings loaded from DB:', {
            vneid_url: settings.vneid_url,
            vneid_username: settings.vneid_username,
            ma_cskcb: settings.ma_cskcb
        });

        const originUrl = settings.vneid_url.includes('/api/v1') 
            ? settings.vneid_url.split('/api/v1')[0] 
            : settings.vneid_url;

        console.log('🔍 [VNeID Sync DEBUG] Parsed originUrl:', originUrl);
        console.log('📡 [VNeID Sync DEBUG] Sending Auth POST request to:', `${originUrl}/api/auth/login`);

        // 1. Authenticate / Login to get token
        let token = '';
        let loginResponseLog = '';
        try {
            const loginRes: any = await axios.post(`${originUrl}/api/auth/login`, {
                username: settings.vneid_username,
                password: settings.vneid_password
            }, {
                headers: { 'Content-Type': 'application/json', 'Accept': '*/*' },
                timeout: 10000
            });
            token = loginRes.data?.data?.token || loginRes.data?.token || loginRes.data?.data;
            loginResponseLog = `Login Success: ${JSON.stringify(loginRes.data)}`;
            console.log('✅ [VNeID Sync DEBUG] Login success. Token length:', token ? token.length : 0);
        } catch (err: any) {
            const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            loginResponseLog = `Login Failed: ${err.response?.status || 500} - ${errMsg}`;
            console.error(`❌ [VNeID Portal] Login error:`, errMsg);
        }

        // 2. Loop through and push each document
        for (const docId of docIds) {
            const docQuery = await query(`SELECT id, doc_no, xml_data, patient_name FROM health_check_masters WHERE id = $1`, [parseInt(docId, 10)]);
            if (docQuery.rows.length === 0) continue;
            const doc = docQuery.rows[0];

            if (!token) {
                await query(`
                    UPDATE health_check_masters
                    SET send_status = 'Error',
                        error_message = 'Đăng nhập cổng thất bại',
                        response_log = $1,
                        updated_at = NOW()
                    WHERE id = $2
                `, [loginResponseLog, doc.id]);
                failedIds.push(docId);
                continue;
            }

            const base64Xml = Buffer.from(doc.xml_data || '').toString('base64');
            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const uuidStr = crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : crypto.randomBytes(16).toString('hex');
            const msgId = `${settings.ma_cskcb}${yy}${mm}${dd}${uuidStr}`;

            const payload = {
                header: {
                    version: "1.0.0",
                    sender_id: settings.ma_cskcb,
                    receiver_id: "TDLBYT",
                    txn_type: "sync_checkup",
                    msg_id: msgId,
                    msg_type: "101",
                    data_type: "xml/base64",
                    send_datetime: Date.now()
                },
                data: {
                    file_content: base64Xml
                }
            };

            let responseLog = '';
            let sendSuccess = false;
            let errorMsg = '';
            let transactionId = msgId;

            try {
                console.log(`📡 [VNeID Portal] Pushing document ${doc.doc_no} (BN: ${doc.patient_name})`);
                const finalPushUrl = `${originUrl}/api/v1/platform/data-sync/push`;
                console.log(`📡 [VNeID Sync DEBUG] Sending XML POST request to:`, finalPushUrl);
                console.log(`🔍 [VNeID Sync DEBUG] Request headers:`, {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token ? token.substring(0, 15) + '...' : 'none'}`,
                    'service-type': '100'
                });

                const pushRes: any = await axios.post(finalPushUrl, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'service-type': '100'
                    },
                    timeout: 15000
                });

                responseLog = JSON.stringify(pushRes.data);
                console.log('✅ [VNeID Sync DEBUG] Gateway response:', responseLog);
                const resCode = pushRes.data?.header?.res_code || pushRes.data?.res_code;

                if (pushRes.status === 200 && (resCode === 'CM_SUCCESS' || !resCode)) {
                    sendSuccess = true;
                    transactionId = pushRes.data?.header?.txn_id || pushRes.data?.txn_id || msgId;
                } else {
                    errorMsg = pushRes.data?.header?.res_msg || pushRes.data?.res_msg || 'Cổng phản hồi mã lỗi tiếp nhận';
                }
            } catch (err: any) {
                sendSuccess = false;
                const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                errorMsg = `Lỗi kết nối cổng: ${err.response?.status || 500} - ${errMsg}`;
                responseLog = `Error: ${errorMsg}`;
                console.log(`❌ [VNeID Sync DEBUG] Full push error object:`, err.response?.status, JSON.stringify(err.response?.data || {}));
                console.error(`❌ [VNeID Portal] Push error for doc ${doc.doc_no}:`, errMsg);
            }

            if (sendSuccess) {
                await query(`
                    UPDATE health_check_masters
                    SET send_status = 'Success',
                        sent_at = NOW(),
                        transaction_id = $1,
                        response_log = $2,
                        error_message = NULL,
                        updated_at = NOW()
                    WHERE id = $3
                `, [transactionId, responseLog, doc.id]);
            } else {
                await query(`
                    UPDATE health_check_masters
                    SET send_status = 'Error',
                        error_message = $1,
                        response_log = $2,
                        updated_at = NOW()
                    WHERE id = $3
                `, [errorMsg.slice(0, 500), responseLog, doc.id]);
                failedIds.push(docId);
            }
        }
    } catch (error: any) {
        console.error('❌ [VNeID Portal] sendDocumentsToVNeID unexpected error:', error);
    }
    return failedIds;
}

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
            SELECT id
            FROM health_check_masters
            WHERE signature_status = 'Signed' AND (send_status = 'Unsent' OR send_status = 'Error')
            LIMIT 50
        `;
        const res = await query(sql);
        if (res.rows.length === 0) {
            return;
        }

        console.log(`📡 [Auto Sync VNeID] Found ${res.rows.length} signed, unsent health check documents. Synchronizing now...`);

        const docIds = res.rows.map((row: any) => row.id.toString());
        await sendDocumentsToVNeID(docIds);
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
