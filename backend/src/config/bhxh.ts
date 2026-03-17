import { query } from './database';

export interface BHXHConfig {
    hhgd_url: string;
    userid: string;
    password: string;
    staffName: string;
    cccdCb: string;
}

// Biến lưu trữ cấu hình Global
let globalBHXHConfig: BHXHConfig | null = null;

/**
 * Tải cấu hình từ DB vào bộ nhớ (Chạy một lần khi khởi động Server)
 */
export async function loadBHXHConfig() {
    try {
        const result = await query(
            `SELECT hhgd_url, hhgd_userid as userid, hhgd_password as password FROM hms_hospital_gdbhyt WHERE hhgd_active = 'Y' LIMIT 1`
        );

        const configRes = await query(`SELECT user_name_check, user_check FROM hms_config LIMIT 1`);
        const staffName = configRes.rows[0]?.user_name_check || 'Cán bộ tiếp nhận';
        const cccdCb = configRes.rows[0]?.user_check || '';

        if (result.rows.length > 0) {
            globalBHXHConfig = {
                ...result.rows[0],
                staffName: staffName,
                cccdCb: cccdCb
            };
            console.log(`✅ BHXH Config & Staff (${staffName} - ${cccdCb}) loaded into memory`);
            return globalBHXHConfig;
        }
        console.warn('⚠️ No active BHXH config found in hms_hospital_gdbhyt');
        return null;
    } catch (error) {
        console.error('❌ Failed to load BHXH config:', error);
        return null;
    }
}

/**
 * Láy cấu hình từ bộ nhớ (Không gọi DB)
 */
export function getBHXHConfig() {
    return globalBHXHConfig;
}
