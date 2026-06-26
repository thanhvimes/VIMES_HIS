import { Request, Response } from 'express';
import { query } from '../../config/database';
import SecurityUtils from '../../utils/security';
import { loadHealthCheckSettings } from '../../config/health-check-settings';
import { restartHealthCheckSyncWorker } from '../../services/health-check-sync.service';
import axios from 'axios';

class SettingsController {
    
    // 7.1. Lấy cấu hình liên thông VNeID
    async getSettings(req: Request, res: Response) {
        try {
            const result = await query(
                `SELECT id, vneid_url, vneid_username, vneid_password, ma_cskcb, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval, barcode_label_size_xn, barcode_label_size_ksk, barcode_show_hospital, barcode_show_date, barcode_show_sample_type, allow_unsigned_sync FROM health_check_settings LIMIT 1`
            );

            if (result.rows.length === 0) {
                return res.json({
                    vneid_url: 'https://api-vneid.moh.gov.vn/api/v1',
                    vneid_username: '',
                    vneid_password: '',
                    ma_cskcb: '15124',
                    ma_gtin_cskcb: '1234567890123',
                    auto_sync_enabled: false,
                    auto_sync_interval: 15,
                    barcode_label_size_xn: '50x30',
                    barcode_label_size_ksk: '50x30',
                    barcode_show_hospital: true,
                    barcode_show_date: true,
                    barcode_show_sample_type: true,
                    allow_unsigned_sync: false
                });
            }

            const row = result.rows[0];
            if (row.vneid_password) {
                row.vneid_password = '******';
            }

            return res.json(row);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getSettings:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 7.2. Cập nhật cấu hình liên thông VNeID
    async updateSettings(req: Request, res: Response) {
        const {
            vneid_url,
            vneid_username,
            vneid_password,
            ma_cskcb,
            ma_gtin_cskcb,
            auto_sync_enabled,
            auto_sync_interval,
            barcode_label_size_xn,
            barcode_label_size_ksk,
            barcode_show_hospital,
            barcode_show_date,
            barcode_show_sample_type,
            allow_unsigned_sync
        } = req.body;

        try {
            const existCheck = await query('SELECT id, vneid_password FROM health_check_settings LIMIT 1');
            
            let finalPassword = '';
            if (existCheck.rows.length > 0) {
                const existing = existCheck.rows[0];
                if (vneid_password === '******') {
                    finalPassword = existing.vneid_password;
                } else {
                    finalPassword = vneid_password ? SecurityUtils.encrypt(vneid_password) : '';
                }

                const updateSql = `
                    UPDATE health_check_settings
                    SET vneid_url = $1,
                        vneid_username = $2,
                        vneid_password = $3,
                        ma_cskcb = $4,
                        ma_gtin_cskcb = $5,
                        auto_sync_enabled = $6,
                        auto_sync_interval = $7,
                        barcode_label_size_xn = $8,
                        barcode_label_size_ksk = $9,
                        barcode_show_hospital = $10,
                        barcode_show_date = $11,
                        barcode_show_sample_type = $12,
                        allow_unsigned_sync = $13,
                        updated_at = NOW()
                    WHERE id = $14
                    RETURNING id
                `;
                await query(updateSql, [
                    vneid_url || 'https://api-vneid.moh.gov.vn/api/v1',
                    vneid_username || '',
                    finalPassword,
                    ma_cskcb || '15124',
                    ma_gtin_cskcb || '1234567890123',
                    auto_sync_enabled === true,
                    parseInt(auto_sync_interval || '15', 10),
                    barcode_label_size_xn || '50x30',
                    barcode_label_size_ksk || '50x30',
                    barcode_show_hospital !== false,
                    barcode_show_date !== false,
                    barcode_show_sample_type !== false,
                    allow_unsigned_sync === true,
                    existing.id
                ]);
            } else {
                finalPassword = vneid_password ? SecurityUtils.encrypt(vneid_password) : '';
                const insertSql = `
                    INSERT INTO health_check_settings (
                        vneid_url, vneid_username, vneid_password, ma_cskcb, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval,
                        barcode_label_size_xn, barcode_label_size_ksk, barcode_show_hospital, barcode_show_date, barcode_show_sample_type,
                        allow_unsigned_sync
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    RETURNING id
                `;
                await query(insertSql, [
                    vneid_url || 'https://api-vneid.moh.gov.vn/api/v1',
                    vneid_username || '',
                    finalPassword,
                    ma_cskcb || '15124',
                    ma_gtin_cskcb || '1234567890123',
                    auto_sync_enabled === true,
                    parseInt(auto_sync_interval || '15', 10),
                    barcode_label_size_xn || '50x30',
                    barcode_label_size_ksk || '50x30',
                    barcode_show_hospital !== false,
                    barcode_show_date !== false,
                    barcode_show_sample_type !== false,
                    allow_unsigned_sync === true
                ]);
            }

            await loadHealthCheckSettings();
            restartHealthCheckSyncWorker();

            return res.json({ success: true });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi updateSettings:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 7.3. Gọi ping thử kết nối tới cổng VNeID
    async testConnection(req: Request, res: Response) {
        const { vneid_url, vneid_username, vneid_password } = req.body;

        try {
            if (!vneid_url) {
                return res.status(400).json({ success: false, message: 'Thiếu địa chỉ cổng URL' });
            }

            const originUrl = vneid_url.includes('/api/v1') 
                ? vneid_url.split('/api/v1')[0] 
                : vneid_url;

            console.log(`📡 [VNeID Portal] Testing connection to login at: ${originUrl}/api/auth/login`);

            const loginRes = await axios.post(`${originUrl}/api/auth/login`, {
                username: vneid_username || '',
                password: vneid_password || ''
            }, {
                headers: { 'Content-Type': 'application/json', 'Accept': '*/*' },
                timeout: 8000
            }) as any;

            const token = loginRes.data?.data?.token || loginRes.data?.token || loginRes.data?.data;
            if (token) {
                return res.json({ 
                    success: true, 
                    message: `Kết nối thành công tới cổng ${vneid_url}. Cổng hoạt động bình thường, tài khoản hợp lệ.`
                });
            } else {
                return res.json({ 
                    success: false, 
                    message: `Cổng kết nối thành công nhưng không trả về mã Token xác thực. Phản hồi: ${JSON.stringify(loginRes.data)}`
                });
            }
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi testConnection:', error);
            const errMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            return res.json({ 
                success: false, 
                message: `Lỗi kết nối tới cổng: ${error.response?.status || 500} - ${errMsg}` 
            });
        }
    }

    // Lấy danh sách hợp đồng
    async getContracts(req: Request, res: Response) {
        try {
            const result = await query(`
                SELECT 
                    c.hec_contract_id as id, 
                    c.hec_no as code, 
                    COALESCE(NULLIF(TRIM(c.hec_description), ''), c.hec_no) as name,
                    to_char(c.hec_date, 'DD/MM/YYYY') as contract_date,
                    COALESCE(c.hec_status, 'O') as status,
                    (SELECT COUNT(*) FROM hms_exm_employee e WHERE e.hee_contract_id = c.hec_contract_id AND e.hee_isactive='Y') as employee_count,
                    (SELECT COUNT(*) FROM hms_exm_employee e 
                     JOIN health_check_masters m ON m.patient_id = CAST(COALESCE(e.hee_patientno, e.hee_employee_id) AS VARCHAR)
                     WHERE e.hee_contract_id = c.hec_contract_id AND e.hee_isactive='Y') as synced_count
                FROM hms_exm_contract c
                ORDER BY c.hec_contract_id DESC
            `);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getContracts:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const settingsController = new SettingsController();
