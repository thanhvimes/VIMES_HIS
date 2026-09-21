import { Request, Response } from 'express';
import { query } from '../../config/database';
import SecurityUtils from '../../utils/security';
import { loadHealthCheckSettings } from '../../config/health-check-settings';
import { restartHealthCheckSyncWorker } from '../../services/health-check-sync.service';
import { calculateAge } from '../../services/health-check-classifier.service';
import { batchSyncController } from './batch-sync.controller';
import { hisIntegrationController } from './his-integration';
import { mergeLabData } from '../../services/health-check-merge.service';
import { generateXmlPayload } from './xml-generator';
import axios from 'axios';

export class ContractsController {
    // Lấy cấu hình liên thông VNeID
    async getSettings(req: Request, res: Response) {
        try {
            const result = await query(
                `SELECT id, vneid_url, vneid_username, vneid_password, ma_cskcb, ma_cskcb_byt, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval, barcode_label_size_xn, barcode_label_size_ksk, barcode_show_hospital, barcode_show_date, barcode_show_sample_type, allow_unsigned_sync, barcode_zpl_template_xn, barcode_zpl_template_ksk, barcode_printer_name, reception_slip_template, use_qz_tray, vneid_private_key, vneid_public_key, signature_type, hsm_url, hsm_provider, hsm_username, hsm_password, hsm_client_id, hsm_client_secret, sync_target_mode, syt_url, syt_username, syt_password, syt_receiver_id, syt_enabled FROM health_check_settings ORDER BY id ASC LIMIT 1`
            );

            if (result.rows.length === 0) {
                return res.json({
                    vneid_url: 'https://api-sandbox.emrhub.vn/api',
                    vneid_username: '8934285008135_api',
                    vneid_password: '',
                    ma_cskcb: '8934285008135',
                    ma_cskcb_byt: '37101',
                    ma_gtin_cskcb: '8934285008135',
                    auto_sync_enabled: false,
                    auto_sync_interval: 15,
                    barcode_label_size_xn: '50x30',
                    barcode_label_size_ksk: '50x30',
                    barcode_show_hospital: true,
                    barcode_show_date: true,
                    barcode_show_sample_type: true,
                    allow_unsigned_sync: false,
                    barcode_zpl_template_xn: '',
                    barcode_zpl_template_ksk: '',
                    barcode_printer_name: 'Zebra',
                    use_qz_tray: false,
                    vneid_private_key: '',
                    vneid_public_key: '',
                    reception_slip_template: `<div class="receipt-card">
    <div class="header">
        <div class="hospital-name">{{hospital}}</div>
        <div class="sub-header">KHOA KHÁM BỆNH - KHÁM SỨC KHỎE</div>
        <div class="title">PHIẾU TIẾP ĐÓN</div>
    </div>

    <div class="divider"></div>

    <table class="info-table">
        <tr>
            <td class="info-label">Số hồ sơ:</td>
            <td class="info-value"><span class="doc-badge">{{docNo}}</span></td>
        </tr>
        <tr>
            <td class="info-label">Họ và tên:</td>
            <td class="info-value name-value">{{name}}</td>
        </tr>
        <tr>
            <td class="info-label">Ngày sinh:</td>
            <td class="info-value">{{dob}}</td>
        </tr>
        <tr>
            <td class="info-label">Giới tính:</td>
            <td class="info-value">{{gender}}</td>
        </tr>
        <tr>
            <td class="info-label">Số CCCD:</td>
            <td class="info-value font-mono">{{cardId}}</td>
        </tr>
        
    </table>

    <div class="divider"></div>

    <div class="vitals-section">
        <div class="vitals-title">THÔNG TIN SINH HIỆU</div>
        <table class="vitals-table">
            <tr>
                <td class="vitals-label">Mạch:</td>
                <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
                <td class="vitals-unit">lần/phút</td>
            </tr>
            <tr>
                <td class="vitals-label">Nhiệt độ:</td>
                <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
                <td class="vitals-unit">°C</td>
            </tr>
            <tr>
                <td class="vitals-label">Huyết áp:</td>
                <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
                <td class="vitals-unit">mmHg</td>
            </tr>
            <tr>
                <td class="vitals-label">Chiều cao:</td>
                <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
                <td class="vitals-unit">cm</td>
            </tr>
            <tr>
                <td class="vitals-label">Cân nặng:</td>
                <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
                <td class="vitals-unit">kg</td>
            </tr>
            <tr>
                <td class="vitals-label">Mắt phải:</td>
                <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
                <td class="vitals-unit"></td>
            </tr>
            <tr>
                <td class="vitals-label">Mắt trái:</td>
                <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
                <td class="vitals-unit"></td>
            </tr>
        </table>
    </div>

    <div class="divider"></div>

    <div class="barcode-section">
        <div class="barcode-container">
            <svg id="barcode"></svg>
        </div>
    </div>

    <div class="divider"></div>
    <div class="footer-note">Quý khách vui lòng giữ phiếu trong suốt quá trình khám!</div>
</div>`
                });
            }

            const row = result.rows[0];
            if (row.vneid_password) {
                row.vneid_password = '******';
            }
            if (row.vneid_private_key) {
                try {
                    row.vneid_private_key = SecurityUtils.isEncrypted(row.vneid_private_key)
                        ? SecurityUtils.resolveSecret(row.vneid_private_key)
                        : SecurityUtils.decrypt(row.vneid_private_key);
                } catch (e) {
                    row.vneid_private_key = row.vneid_private_key;
                }
            }
            if (row.hsm_password) {
                row.hsm_password = '******';
            }
            if (row.hsm_client_secret) {
                row.hsm_client_secret = '******';
            }
            if (row.syt_password) {
                row.syt_password = '******';
            }

            return res.json(row);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getSettings:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Lấy danh sách nhà cung cấp từ bảng hms_sign_serverconf
    async getSigningPartners(req: Request, res: Response) {
        try {
            const result = await query(
                `SELECT sign_partner, sign_url FROM hms_sign_serverconf ORDER BY sign_partner`
            );
            return res.json({
                success: true,
                data: result.rows
            });
        } catch (error: any) {
            console.warn('⚠️ [ContractsController] Table hms_sign_serverconf query failed, using fallback:', error.message);
            return res.json({
                success: true,
                data: [
                    { sign_partner: 'BCY', sign_url: 'http://vimes.xyz:8091' },
                    { sign_partner: 'VNPT-CA', sign_url: 'http://vimes.xyz:8091' }
                ]
            });
        }
    }

    // Cập nhật cấu hình liên thông VNeID & Sở Y tế
    async updateSettings(req: Request, res: Response) {
        const {
            vneid_url,
            vneid_username,
            vneid_password,
            ma_cskcb,
            ma_cskcb_byt,
            ma_gtin_cskcb,
            auto_sync_enabled,
            auto_sync_interval,
            barcode_label_size_xn,
            barcode_label_size_ksk,
            barcode_show_hospital,
            barcode_show_date,
            barcode_show_sample_type,
            allow_unsigned_sync,
            barcode_zpl_template_xn,
            barcode_zpl_template_ksk,
            barcode_printer_name,
            reception_slip_template,
            use_qz_tray,
            vneid_private_key,
            vneid_public_key,
            signature_type,
            hsm_url,
            hsm_provider,
            hsm_username,
            hsm_password,
            hsm_client_id,
            hsm_client_secret,
            sync_target_mode,
            syt_url,
            syt_username,
            syt_password,
            syt_receiver_id,
            syt_enabled
        } = req.body;

        try {
            const existCheck = await query('SELECT id, vneid_password, vneid_private_key, hsm_password, hsm_client_secret, syt_password FROM health_check_settings ORDER BY id ASC LIMIT 1');
            
            let finalPassword = '';
            let finalPrivateKey = '';
            let finalHsmPassword = '';
            let finalHsmClientSecret = '';
            let finalSytPassword = '';

            if (existCheck.rows.length > 0) {
                const existing = existCheck.rows[0];
                if (vneid_password === '******') {
                    finalPassword = existing.vneid_password;
                } else {
                    finalPassword = vneid_password ? SecurityUtils.encrypt(vneid_password) : '';
                }

                if (vneid_private_key === '******') {
                    finalPrivateKey = existing.vneid_private_key;
                } else if (vneid_private_key) {
                    finalPrivateKey = SecurityUtils.isEncrypted(vneid_private_key)
                        ? vneid_private_key
                        : 'enc:' + SecurityUtils.encrypt(vneid_private_key);
                } else {
                    finalPrivateKey = '';
                }

                if (hsm_password === '******') {
                    finalHsmPassword = existing.hsm_password;
                } else {
                    finalHsmPassword = hsm_password ? SecurityUtils.encrypt(hsm_password) : '';
                }

                if (hsm_client_secret === '******') {
                    finalHsmClientSecret = existing.hsm_client_secret;
                } else {
                    finalHsmClientSecret = hsm_client_secret ? SecurityUtils.encrypt(hsm_client_secret) : '';
                }

                if (syt_password === '******') {
                    finalSytPassword = existing.syt_password;
                } else {
                    finalSytPassword = syt_password ? SecurityUtils.encrypt(syt_password) : '';
                }

                const updateSql = `
                    UPDATE health_check_settings
                    SET vneid_url = $1,
                        vneid_username = $2,
                        vneid_password = $3,
                        ma_cskcb = $4,
                        ma_cskcb_byt = $5,
                        ma_gtin_cskcb = $6,
                        auto_sync_enabled = $7,
                        auto_sync_interval = $8,
                        barcode_label_size_xn = $9,
                        barcode_label_size_ksk = $10,
                        barcode_show_hospital = $11,
                        barcode_show_date = $12,
                        barcode_show_sample_type = $13,
                        allow_unsigned_sync = $14,
                        barcode_zpl_template_xn = $15,
                        barcode_zpl_template_ksk = $16,
                        barcode_printer_name = $17,
                        reception_slip_template = $18,
                        use_qz_tray = $19,
                        vneid_private_key = $20,
                        vneid_public_key = $21,
                        signature_type = $22,
                        hsm_url = $23,
                        hsm_provider = $24,
                        hsm_username = $25,
                        hsm_password = $26,
                        hsm_client_id = $27,
                        hsm_client_secret = $28,
                        sync_target_mode = $29,
                        syt_url = $30,
                        syt_username = $31,
                        syt_password = $32,
                        syt_receiver_id = $33,
                        syt_enabled = $34,
                        updated_at = NOW()
                    WHERE id = $35
                    RETURNING id
                `;
                await query(updateSql, [
                    vneid_url ? vneid_url.trim() : 'https://api-sandbox.emrhub.vn/api',
                    vneid_username || '',
                    finalPassword,
                    ma_cskcb || '',
                    ma_cskcb_byt || process.env.COMPANY_ID || '',
                    ma_gtin_cskcb || '',
                    auto_sync_enabled === true,
                    parseInt(auto_sync_interval || '15', 10),
                    barcode_label_size_xn || '50x30',
                    barcode_label_size_ksk || '50x30',
                    barcode_show_hospital !== false,
                    barcode_show_date !== false,
                    barcode_show_sample_type !== false,
                    allow_unsigned_sync === true,
                    barcode_zpl_template_xn || '',
                    barcode_zpl_template_ksk || '',
                    barcode_printer_name || 'Zebra',
                    reception_slip_template || '',
                    use_qz_tray === true,
                    finalPrivateKey,
                    vneid_public_key || '',
                    signature_type || 'HSM',
                    hsm_url ? hsm_url.trim() : null,
                    hsm_provider && hsm_provider !== 'VNPT-CA' ? hsm_provider.trim() : 'BCY',
                    hsm_username || '',
                    finalHsmPassword,
                    hsm_client_id || '',
                    finalHsmClientSecret,
                    sync_target_mode || 'BYT_ONLY',
                    syt_url ? syt_url.trim() : 'https://api-hssk.hanoi.gov.vn',
                    syt_username || '',
                    finalSytPassword,
                    syt_receiver_id || 'VTS',
                    syt_enabled === true,
                    existing.id
                ]);
            } else {
                finalPassword = vneid_password ? SecurityUtils.encrypt(vneid_password) : '';
                finalPrivateKey = vneid_private_key ? SecurityUtils.encrypt(vneid_private_key) : '';
                finalHsmPassword = hsm_password ? SecurityUtils.encrypt(hsm_password) : '';
                finalHsmClientSecret = hsm_client_secret ? SecurityUtils.encrypt(hsm_client_secret) : '';
                finalSytPassword = syt_password ? SecurityUtils.encrypt(syt_password) : '';

                const insertSql = `
                    INSERT INTO health_check_settings (
                        vneid_url, vneid_username, vneid_password, ma_cskcb, ma_cskcb_byt, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval,
                        barcode_label_size_xn, barcode_label_size_ksk, barcode_show_hospital, barcode_show_date, barcode_show_sample_type,
                        allow_unsigned_sync, barcode_zpl_template_xn, barcode_zpl_template_ksk, barcode_printer_name, reception_slip_template, use_qz_tray,
                        vneid_private_key, vneid_public_key, signature_type, hsm_url, hsm_provider, hsm_username, hsm_password, hsm_client_id, hsm_client_secret,
                        sync_target_mode, syt_url, syt_username, syt_password, syt_receiver_id, syt_enabled
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34)
                    RETURNING id
                `;
                await query(insertSql, [
                    vneid_url ? vneid_url.trim() : 'https://api-sandbox.emrhub.vn/api',
                    vneid_username || '',
                    finalPassword,
                    ma_cskcb || '',
                    ma_cskcb_byt || process.env.COMPANY_ID || '',
                    ma_gtin_cskcb || '',
                    auto_sync_enabled === true,
                    parseInt(auto_sync_interval || '15', 10),
                    barcode_label_size_xn || '50x30',
                    barcode_label_size_ksk || '50x30',
                    barcode_show_hospital !== false,
                    barcode_show_date !== false,
                    barcode_show_sample_type !== false,
                    allow_unsigned_sync === true,
                    barcode_zpl_template_xn || '',
                    barcode_zpl_template_ksk || '',
                    barcode_printer_name || 'Zebra',
                    reception_slip_template || '',
                    use_qz_tray === true,
                    finalPrivateKey,
                    vneid_public_key || '',
                    signature_type || 'HSM',
                    hsm_url ? hsm_url.trim() : null,
                    hsm_provider && hsm_provider !== 'VNPT-CA' ? hsm_provider.trim() : 'BCY',
                    hsm_username || '',
                    finalHsmPassword,
                    hsm_client_id || '',
                    finalHsmClientSecret,
                    sync_target_mode || 'BYT_ONLY',
                    syt_url ? syt_url.trim() : 'https://api-hssk.hanoi.gov.vn',
                    syt_username || '',
                    finalSytPassword,
                    syt_receiver_id || 'VTS',
                    syt_enabled === true
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

    // Gọi ping thử kết nối tới Cổng Sở Y tế (HSSKĐT Hà Nội)
    async testSytConnection(req: Request, res: Response) {
        const { syt_url, syt_username, syt_password } = req.body;

        try {
            const url = (syt_url || 'https://api-hssk.hanoi.gov.vn').trim().replace(/\/+$/, '');
            const loginUrl = `${url}/api/v1/resource/authentication/login`;

            let testPassword = syt_password || '';
            if (testPassword === '******') {
                const settingsQuery = await query('SELECT syt_password FROM health_check_settings LIMIT 1');
                if (settingsQuery.rows.length > 0) {
                    const encryptedPass = settingsQuery.rows[0].syt_password;
                    if (encryptedPass) {
                        try {
                            if (SecurityUtils.isEncrypted(encryptedPass)) {
                                testPassword = SecurityUtils.resolveSecret(encryptedPass);
                            } else {
                                testPassword = SecurityUtils.decrypt(encryptedPass);
                            }
                        } catch {
                            testPassword = SecurityUtils.resolveSecret(encryptedPass);
                        }
                    }
                }
            }

            if (!syt_username || !testPassword) {
                return res.status(400).json({ success: false, message: 'Thiếu tài khoản hoặc mật khẩu Cổng Sở Y tế' });
            }

            console.log(`📡 [SYT Portal] Testing connection to login at: ${loginUrl}`);

            const loginRes = await axios.post(loginUrl, {
                username: syt_username,
                password: testPassword
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                },
                timeout: 10000
            }) as any;

            const token = loginRes.data?.access_token || loginRes.data?.token || loginRes.data?.data?.token;
            const code = loginRes.data?.code;

            if (code === 200 || token) {
                const tokenStr = typeof token === 'string' ? token : '';
                const shortToken = tokenStr.length > 20 ? `${tokenStr.substring(0, 10)}...${tokenStr.substring(tokenStr.length - 8)}` : tokenStr;
                return res.json({
                    success: true,
                    message: `🎉 Kết nối thành công! Đã đăng nhập Cổng HSSKĐT Sở Y tế Hà Nội thành công (Token: ${shortToken}). IP của hệ thống đã được cấp phép.`
                });
            } else {
                return res.json({
                    success: false,
                    message: `Cổng Sở Y tế tiếp nhận nhưng chưa trả về token hợp lệ. Mã phản hồi: ${code || 400}. Chi tiết: ${JSON.stringify(loginRes.data)}`
                });
            }
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi testSytConnection:', error);
            const errMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            let hint = '';
            if (error.response?.status === 403 || error.code === 'ECONNREFUSED' || error.message?.includes('timeout')) {
                hint = ' (Lưu ý: Sở Y tế yêu cầu IP Whitelist. Vui lòng kiểm tra IP tĩnh của máy chủ đã được Sở cấp quyền chưa).';
            }
            return res.json({
                success: false,
                message: `Lỗi kết nối tới Cổng Sở Y tế: ${error.response?.status || 500} - ${errMsg}${hint}`
            });
        }
    }

    // Gọi ping thử kết nối tới cổng VNeID
    async testConnection(req: Request, res: Response) {
        const { vneid_url, vneid_username, vneid_password } = req.body;

        try {
            if (!vneid_url) {
                return res.status(400).json({ success: false, message: 'Thiếu địa chỉ cổng URL' });
            }

            let baseUrl = vneid_url.trim().replace(/\/+$/, '');
            if (baseUrl.endsWith('/v1')) baseUrl = baseUrl.slice(0, -3);
            if (baseUrl.endsWith('/api')) baseUrl = baseUrl.slice(0, -4);
            const loginUrl = `${baseUrl}/api/auth/login`;

            let testPassword = vneid_password || '';
            if (testPassword === '******') {
                const settingsQuery = await query('SELECT vneid_password FROM health_check_settings LIMIT 1');
                if (settingsQuery.rows.length > 0) {
                    const encryptedPass = settingsQuery.rows[0].vneid_password;
                    if (encryptedPass) {
                        try {
                            if (SecurityUtils.isEncrypted(encryptedPass)) {
                                testPassword = SecurityUtils.resolveSecret(encryptedPass);
                            } else {
                                testPassword = SecurityUtils.decrypt(encryptedPass);
                            }
                        } catch {
                            testPassword = SecurityUtils.resolveSecret(encryptedPass);
                        }
                    }
                }
            }

            console.log(`📡 [VNeID Portal] Testing connection to login at: ${loginUrl}`);

            const loginRes = await axios.post(loginUrl, {
                username: vneid_username || '',
                password: testPassword
            }, {
                headers: { 
                    'Content-Type': 'application/json', 
                    'Accept': '*/*',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                },
                timeout: 8000
            }) as any;

            const token = loginRes.data?.data?.token || loginRes.data?.token || loginRes.data?.data;
            if (token) {
                const tokenStr = typeof token === 'string' ? token : JSON.stringify(token);
                const shortToken = tokenStr.length > 25 ? `${tokenStr.substring(0, 15)}...${tokenStr.substring(tokenStr.length - 10)}` : tokenStr;
                return res.json({ 
                    success: true, 
                    message: `🎉 Kết nối thành công! Đã đăng nhập và lấy Bearer Token xác thực Cổng VNeID thành công (Token: ${shortToken}, Độ dài: ${tokenStr.length} ký tự).`
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
            const { startDate, endDate } = req.query;
            let sql = `
                SELECT 
                    c.hec_contract_id as id, 
                    c.hec_no as code, 
                    COALESCE(NULLIF(TRIM(c.hec_description), ''), c.hec_no) as name,
                    c.hec_company_id as company_id,
                    to_char(c.hec_date, 'YYYY-MM-DD') as contract_date,
                    to_char(c.hec_examdate, 'YYYY-MM-DD') as exam_date,
                    c.hec_type as type,
                    COALESCE(c.hec_object, 3) as object,
                    c.hec_form_type as form_type,
                    COALESCE(c.hec_def_roomid, 22) as def_roomid,
                    COALESCE(c.hec_def_roomid, 22) as room_id,
                    c.hec_def_examtype as def_examtype,
                    (SELECT hrl_name FROM hms_roomlist r WHERE r.hrl_id = COALESCE(c.hec_def_roomid, 22) LIMIT 1) as room_name,
                    COALESCE(c.hec_status, 'O') as status,
                    (SELECT COUNT(*) FROM hms_exm_employee e WHERE e.hee_contract_id = c.hec_contract_id AND e.hee_isactive='Y') as employee_count,
                    (SELECT COUNT(*) FROM health_check_masters m 
                     WHERE m.his_contract_id = c.hec_contract_id) as synced_count
                FROM hms_exm_contract c
                WHERE 1=1
            `;

            const params: any[] = [];
            let paramIdx = 1;

            if (startDate) {
                sql += ` AND c.hec_examdate >= $${paramIdx}`;
                params.push(startDate);
                paramIdx++;
            }
            if (endDate) {
                sql += ` AND c.hec_examdate <= $${paramIdx}`;
                params.push(endDate);
                paramIdx++;
            }

            sql += ` ORDER BY c.hec_contract_id DESC`;
            const result = await query(sql, params);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getContracts:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Tạo mới hợp đồng
    async createContract(req: Request, res: Response) {
        const { code, company_id, description, contract_date, exam_date, type, object, form_type, def_roomid, room_id, def_examtype } = req.body;
        try {
            const idRes = await query(`SELECT COALESCE(MAX(hec_contract_id), 0) + 1 as next_id FROM hms_exm_contract`);
            const nextId = idRes.rows[0].next_id;

            const targetRoomId = (def_roomid !== undefined && def_roomid !== null) ? parseInt(String(def_roomid), 10) : (room_id ? parseInt(String(room_id), 10) : 22);

            const insertSql = `
                INSERT INTO hms_exm_contract (
                    hec_contract_id, hec_no, hec_company_id, hec_description, hec_date, hec_examdate, hec_type, hec_object, hec_form_type, hec_def_roomid, hec_def_examtype, hec_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'O')
                RETURNING hec_contract_id as id
            `;
            const result = await query(insertSql, [
                nextId,
                code,
                String(company_id || ''),
                description || '',
                contract_date ? new Date(contract_date) : new Date(),
                exam_date ? new Date(exam_date) : null,
                type || 'DV',
                object ? parseInt(String(object), 10) : 3, // Mặc định đối tượng 3: Miễn giảm
                form_type || '2',
                targetRoomId,
                def_examtype || 'E01'
            ]);
            return res.json({ success: true, id: result.rows[0].id });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi createContract:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Cập nhật hợp đồng
    async updateContract(req: Request, res: Response) {
        const { id } = req.params;
        const contractId = parseInt(id as string, 10);
        const { code, company_id, description, contract_date, exam_date, type, object, form_type, def_roomid, room_id, def_examtype } = req.body;
        try {
            const checkStatus = await query('SELECT hec_status FROM hms_exm_contract WHERE hec_contract_id = $1', [contractId]);
            if (checkStatus.rows.length > 0 && checkStatus.rows[0].hec_status === 'A') {
                return res.status(400).json({ success: false, message: 'Gói khám đã được duyệt chốt, không thể thay đổi thông tin!' });
            }

            const targetRoomId = (def_roomid !== undefined && def_roomid !== null) ? parseInt(String(def_roomid), 10) : (room_id ? parseInt(String(room_id), 10) : 22);

            const updateSql = `
                UPDATE hms_exm_contract
                SET hec_no = $1,
                    hec_company_id = $2,
                    hec_description = $3,
                    hec_date = $4,
                    hec_examdate = $5,
                    hec_type = $6,
                    hec_object = $7,
                    hec_form_type = $8,
                    hec_def_roomid = $9,
                    hec_def_examtype = $10
                WHERE hec_contract_id = $11
            `;
            await query(updateSql, [
                code,
                String(company_id || ''),
                description || '',
                contract_date ? new Date(contract_date) : new Date(),
                exam_date ? new Date(exam_date) : null,
                type || 'DV',
                object ? parseInt(String(object), 10) : 3, // Mặc định đối tượng 3: Miễn giảm
                form_type || '2',
                targetRoomId,
                def_examtype || 'E01',
                contractId
            ]);
            return res.json({ success: true });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi updateContract:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Cập nhật trạng thái hợp đồng
    async updateContractStatus(req: Request, res: Response) {
        const { id } = req.params;
        const { status } = req.body;
        try {
            const updateSql = `
                UPDATE hms_exm_contract
                SET hec_status = $1
                WHERE hec_contract_id = $2
            `;
            await query(updateSql, [
                status || 'O',
                parseInt(id as string, 10)
            ]);
            return res.json({ success: true });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi updateContractStatus:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Xóa hợp đồng
    async deleteContract(req: Request, res: Response) {
        const { id } = req.params;
        const contractId = parseInt(id as string, 10);
        try {
            const checkStatus = await query('SELECT hec_status FROM hms_exm_contract WHERE hec_contract_id = $1', [contractId]);
            if (checkStatus.rows.length > 0 && checkStatus.rows[0].hec_status === 'A') {
                return res.status(400).json({ success: false, message: 'Gói khám đã được duyệt chốt, không thể xóa!' });
            }
            const empCheck = await query(
                `SELECT COUNT(*) as count FROM hms_exm_employee WHERE hee_contract_id = $1 AND hee_isactive='Y'`,
                [contractId]
            );
            if (parseInt(empCheck.rows[0].count, 10) > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Đang tồn tại danh sách nhân viên trong gói khám này. Không cho phép xóa!' 
                });
            }

            await query(`DELETE FROM hms_exm_contract WHERE hec_contract_id = $1`, [contractId]);
            return res.json({ success: true });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi deleteContract:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Lấy danh sách dịch vụ trong hợp đồng
    async getContractServices(req: Request, res: Response) {
        const { id } = req.params;
        const contractId = parseInt(id as string, 10);
        try {
            const result = await query(`
                SELECT 
                    sp.hesp_servicepackage_id as id,
                    sp.hesp_itemid as item_id,
                    f.hfl_name as name,
                    f.hfl_unit as unit,
                    sp.hesp_quantity as quantity,
                    sp.hesp_unitprice as price,
                    sp.hesp_gender as gender,
                    sp.hesp_minage as min_age,
                    sp.hesp_maxage as max_age
                FROM hms_exm_servicepackage sp
                JOIN hms_fee_list f ON TRIM(f.hfl_feeid) = TRIM(sp.hesp_itemid)
                WHERE sp.hesp_contract_id = $1 AND sp.hesp_isactive = 'Y'
                ORDER BY sp.hesp_servicepackage_id ASC
            `, [contractId]);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getContractServices:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Thêm dịch vụ vào hợp đồng
    async addContractServices(req: Request, res: Response) {
        const { id } = req.params;
        const contractId = parseInt(id as string, 10);
        const { services } = req.body;
        
        try {
            const checkStatus = await query('SELECT hec_status FROM hms_exm_contract WHERE hec_contract_id = $1', [contractId]);
            if (checkStatus.rows.length > 0 && checkStatus.rows[0].hec_status === 'A') {
                return res.status(400).json({ success: false, message: 'Gói khám đã được duyệt chốt, không thể thay đổi dịch vụ!' });
            }

            const maxIdRes = await query(`SELECT COALESCE(MAX(hesp_servicepackage_id), 0) as max_id FROM hms_exm_servicepackage`);
            let currentMaxId = parseInt(maxIdRes.rows[0].max_id, 10);

            for (const s of services) {
                currentMaxId++;
                await query(`
                    INSERT INTO hms_exm_servicepackage (
                        hesp_servicepackage_id, hesp_contract_id, hesp_itemid, 
                        hesp_quantity, hesp_unitprice, hesp_gender, hesp_isactive, hesp_createddate,
                        hesp_minage, hesp_maxage
                    ) VALUES ($1, $2, $3, $4, $5, $6, 'Y', NOW(), $7, $8)
                `, [
                    currentMaxId,
                    contractId,
                    s.item_id,
                    s.quantity || 1,
                    s.price || 0,
                    s.gender || 'A',
                    s.min_age !== undefined && s.min_age !== null ? s.min_age : null,
                    s.max_age !== undefined && s.max_age !== null ? s.max_age : null
                ]);
            }
            return res.json({ success: true });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi addContractServices:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Cập nhật dịch vụ trong hợp đồng
    async updateContractService(req: Request, res: Response) {
        const { id, serviceId } = req.params;
        const contractId = parseInt(id as string, 10);
        const spId = parseInt(serviceId as string, 10);
        const { quantity, price, gender } = req.body;
        
        try {
            const checkStatus = await query('SELECT hec_status FROM hms_exm_contract WHERE hec_contract_id = $1', [contractId]);
            if (checkStatus.rows.length > 0 && checkStatus.rows[0].hec_status === 'A') {
                return res.status(400).json({ success: false, message: 'Gói khám đã được duyệt chốt, không thể thay đổi dịch vụ!' });
            }

            await query(`
                UPDATE hms_exm_servicepackage
                SET hesp_quantity = $1,
                    hesp_unitprice = $2,
                    hesp_gender = $3,
                    hesp_updateddate = NOW()
                WHERE hesp_servicepackage_id = $4 AND hesp_contract_id = $5
            `, [quantity, price, gender, spId, contractId]);
            
            return res.json({ success: true });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi updateContractService:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Xóa dịch vụ khỏi hợp đồng
    async deleteContractService(req: Request, res: Response) {
        const { id, serviceId } = req.params;
        const contractId = parseInt(id as string, 10);
        const spId = parseInt(serviceId as string, 10);
        
        try {
            const checkStatus = await query('SELECT hec_status FROM hms_exm_contract WHERE hec_contract_id = $1', [contractId]);
            if (checkStatus.rows.length > 0 && checkStatus.rows[0].hec_status === 'A') {
                return res.status(400).json({ success: false, message: 'Gói khám đã được duyệt chốt, không thể xóa dịch vụ!' });
            }

            await query(`
                UPDATE hms_exm_servicepackage
                SET hesp_isactive = 'N', hesp_updateddate = NOW()
                WHERE hesp_servicepackage_id = $1 AND hesp_contract_id = $2
            `, [spId, contractId]);
            
            return res.json({ success: true });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi deleteContractService:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Xóa dữ liệu rác (Xóa tất cả bệnh nhân chưa tiếp nhận / chưa có số hồ sơ trong hợp đồng)
    async cleanupUnreceivedEmployees(req: Request, res: Response) {
        const { id } = req.params;
        const contractId = parseInt(id as string, 10);
        
        if (isNaN(contractId)) {
            return res.status(400).json({ success: false, message: 'Mã hợp đồng không hợp lệ' });
        }

        try {
            // Kiểm tra trạng thái gói khám
            const contractRes = await query('SELECT hec_status, COALESCE(NULLIF(TRIM(hec_description), \'\'), hec_no) as name FROM hms_exm_contract WHERE hec_contract_id = $1', [contractId]);
            if (contractRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });
            }
            if (contractRes.rows[0].hec_status === 'A') {
                return res.status(400).json({ success: false, message: 'Gói khám đã được duyệt chốt, không thể xóa bệnh nhân!' });
            }

            // 1. Đếm số lượng nhân viên chưa tiếp nhận
            const countRes = await query(`
                SELECT COUNT(*) as count 
                FROM hms_exm_employee 
                WHERE hee_contract_id = $1 
                  AND (hee_docno IS NULL OR hee_docno = '' OR hee_docno = '0')
                  AND hee_isactive = 'Y'
            `, [contractId]);
            const unreceivedCount = parseInt(countRes.rows[0]?.count || '0', 10);

            if (unreceivedCount === 0) {
                return res.json({ 
                    success: true, 
                    message: 'Không có bệnh nhân chưa tiếp nhận nào trong hợp đồng này.',
                    deletedCount: 0 
                });
            }

            // 2. Dọn dẹp các bản ghi master rác chưa có doc_no trong health_check_masters / details
            await query(`
                DELETE FROM health_check_details 
                WHERE master_id IN (
                    SELECT id FROM health_check_masters 
                    WHERE his_contract_id::text = $1::text
                      AND (doc_no IS NULL OR TRIM(doc_no) = '' OR doc_no = '0' OR his_doc_no IS NULL OR TRIM(his_doc_no) = '' OR his_doc_no = '0')
                      AND (signature_status IS NULL OR signature_status <> 'Signed') 
                      AND (send_status IS NULL OR send_status <> 'Success')
                )
            `, [contractId]);

            await query(`
                DELETE FROM health_check_masters 
                WHERE his_contract_id::text = $1::text
                  AND (doc_no IS NULL OR TRIM(doc_no) = '' OR doc_no = '0' OR his_doc_no IS NULL OR TRIM(his_doc_no) = '' OR his_doc_no = '0')
                  AND (signature_status IS NULL OR signature_status <> 'Signed') 
                  AND (send_status IS NULL OR send_status <> 'Success')
            `, [contractId]);

            // 3. Vô hiệu hóa (xóa mềm) các nhân viên chưa tiếp nhận trong hms_exm_employee
            const updateRes = await query(`
                UPDATE hms_exm_employee 
                SET hee_isactive = 'N' 
                WHERE hee_contract_id = $1 
                  AND (hee_docno IS NULL OR hee_docno = '' OR hee_docno = '0')
                  AND hee_isactive = 'Y'
            `, [contractId]);

            return res.json({ 
                success: true, 
                message: `Đã xóa thành công ${updateRes.rowCount || unreceivedCount} bệnh nhân chưa tiếp nhận trong hợp đồng!`,
                deletedCount: updateRes.rowCount || unreceivedCount
            });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi cleanupUnreceivedEmployees:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Nhập hồ sơ từ HIS vào gói khám (Import HIS Docs to Contract)
    async importHisDocsToContract(req: Request, res: Response) {
        const { id } = req.params;
        const contractId = parseInt(id as string, 10);
        const { docNos, autoSyncKsk = true } = req.body;

        if (isNaN(contractId)) {
            return res.status(400).json({ success: false, message: 'Mã hợp đồng không hợp lệ' });
        }

        if (!Array.isArray(docNos) || docNos.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách số hồ sơ rỗng!' });
        }

        try {
            // Kiểm tra trạng thái gói khám
            const contractRes = await query('SELECT hec_status, hec_no FROM hms_exm_contract WHERE hec_contract_id = $1', [contractId]);
            if (contractRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });
            }
            if (contractRes.rows[0].hec_status === 'A') {
                return res.status(400).json({ success: false, message: 'Gói khám đã được duyệt chốt, không thể thêm hồ sơ!' });
            }

            const currentUser = (req as any).user?.username || (req as any).userId || 'admin';
            const results: any[] = [];
            let importedCount = 0;

            for (const rawDoc of docNos) {
                const docNo = parseInt(String(rawDoc).trim(), 10);
                if (isNaN(docNo) || docNo <= 0) continue;

                // 1. Kiểm tra xem hồ sơ có tồn tại trong hms_doc & hms_patient không
                const docRes = await query(`
                    SELECT 
                        d.hd_docno, d.hd_patientno, d.hd_admitdate,
                        p.hp_surname, p.hp_midname, p.hp_firstname,
                        to_char(p.hp_birthdate, 'YYYY-MM-DD') as birthdate,
                        p.hp_sex, p.hp_sin, to_char(p.hp_ngaycap, 'YYYY-MM-DD') as ngaycap, p.hp_noicap,
                        p.hp_provid, p.hp_distid, p.hp_villid, p.hp_dtladdr,
                        p.hp_ethnic, p.hp_occupation, p.hp_workplace,
                        d.hd_telephone
                    FROM hms_doc d
                    JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
                    WHERE d.hd_docno = $1
                `, [docNo]);

                if (docRes.rows.length === 0) {
                    results.push({ docNo, status: 'error', message: 'Không tìm thấy số hồ sơ này trên hệ thống HIS' });
                    continue;
                }

                const docData = docRes.rows[0];

                // 2. Kiểm tra xem đã có trong nhân viên của gói này chưa
                const existEmp = await query(`
                    SELECT hee_employee_id, hee_isactive, hee_docno 
                    FROM hms_exm_employee 
                    WHERE hee_contract_id = $1 AND hee_docno = $2
                `, [contractId, String(docNo)]);

                let employeeId = 0;

                if (existEmp.rows.length > 0) {
                    const row = existEmp.rows[0];
                    if (row.hee_isactive === 'N') {
                        // Kích hoạt lại
                        await query(`UPDATE hms_exm_employee SET hee_isactive = 'Y' WHERE hee_employee_id = $1`, [row.hee_employee_id]);
                    }
                    employeeId = row.hee_employee_id;
                    results.push({ docNo, status: 'exists', message: 'Hồ sơ đã có trong danh sách nhân viên của gói' });
                } else {
                    // Lấy mã lớn nhất hiện tại
                    const maxIdRes = await query(`SELECT COALESCE(MAX(NULLIF(regexp_replace(hee_employee_id::text, '[^0-9]', '', 'g'), '')::bigint), 0) as max_id FROM hms_exm_employee`);
                    employeeId = parseInt(maxIdRes.rows[0]?.max_id || '0', 10) + 1;

                    // Tính toán target_group theo tuổi
                    const age = calculateAge(docData.birthdate);
                    const targetGroup = (age !== null && age >= 60) ? '1' : '3';
                    const occNum = docData.hp_occupation ? parseInt(String(docData.hp_occupation), 10) : 1539;
                    const fullName = [docData.hp_surname, docData.hp_midname, docData.hp_firstname].filter(Boolean).join(' ') || (docData.patient_name || '');

                    await query(`
                        INSERT INTO hms_exm_employee (
                            hee_employee_id, hee_contract_id, hee_id, hee_name,
                            hee_surname, hee_midname, hee_firstname,
                            hee_birthdate, hee_sex, hee_docno, hee_phone,
                            hee_status, hee_isactive, hee_address,
                            hee_provid, hee_distid, hee_villid,
                            hee_cardid, hee_cardid_date, hee_cardid_place,
                            hee_ethnic, hee_occupation, hee_target_group,
                            hee_createdby, hee_createddate
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                            'T', 'Y', $12, $13, $14, $15, $16, $17, $18,
                            $19, $20, $21, $22, NOW()
                        )
                    `, [
                        employeeId,
                        contractId,
                        String(docData.hd_patientno || docNo),
                        fullName,
                        docData.hp_surname || '',
                        docData.hp_midname || '',
                        docData.hp_firstname || '',
                        docData.birthdate,
                        (docData.hp_sex === 'F' || docData.hp_sex === 'Nữ' || docData.hp_sex === '2') ? 'F' : 'M',
                        docNo,
                        docData.hd_telephone || '',
                        docData.hp_dtladdr || '',
                        docData.hp_provid || null,
                        docData.hp_distid || null,
                        docData.hp_villid || null,
                        docData.hp_sin || '',
                        docData.ngaycap || null,
                        docData.hp_noicap || '',
                        docData.hp_ethnic || 1,
                        occNum,
                        targetGroup,
                        currentUser
                    ]);

                    importedCount++;
                    results.push({ docNo, status: 'success', message: 'Nhập vào gói khám thành công' });
                }

                // 3. Tự động đồng bộ sang KSK VNeID nếu autoSyncKsk = true
                if (autoSyncKsk) {
                    try {
                        await batchSyncController.syncSingleDocFromHis(docNo, currentUser, 'Admin', true);
                    } catch (syncErr: any) {
                        console.warn(`⚠️ [importHisDocsToContract] Lỗi tự động sync sang KSK cho hồ sơ ${docNo}:`, syncErr.message);
                    }
                }
            }

            return res.json({
                success: true,
                message: `Đã nhập thành công ${importedCount}/${docNos.length} hồ sơ vào gói khám!`,
                importedCount,
                results
            });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi importHisDocsToContract:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Đồng bộ kết quả Cận lâm sàng từ HIS sang hồ sơ Khám sức khỏe VNeID
     * Quét tất cả nhân viên đã tiếp đón trong hợp đồng, lấy kết quả LIS & PACS từ HIS,
     * tự động merge vào health_check_details.lab_data và tái tạo XML liên thông.
     */
    async syncContractParaclinicalResults(req: Request, res: Response) {
        const { id } = req.params;
        const contractId = parseInt(id as string, 10);
        const { mode = 'missing_only' } = req.body || {}; // 'missing_only' | 'all_new'

        if (isNaN(contractId)) {
            return res.status(400).json({ success: false, message: 'Mã hợp đồng không hợp lệ' });
        }

        try {
            // 1. Kiểm tra trạng thái hợp đồng
            const contractRes = await query('SELECT hec_status, COALESCE(NULLIF(TRIM(hec_description), \'\'), hec_no) as name FROM hms_exm_contract WHERE hec_contract_id = $1', [contractId]);
            if (contractRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });
            }
            if (contractRes.rows[0].hec_status === 'A') {
                return res.status(400).json({ success: false, message: 'Gói khám đã được duyệt chốt, không thể thay đổi dữ liệu!' });
            }

            const currentUser = (req as any).user?.username || (req as any).userId || 'admin';

            // 2. Lấy danh sách nhân viên đã tiếp nhận trong hợp đồng
            const empRes = await query(`
                SELECT 
                    hee.hee_employee_id,
                    hee.hee_docno,
                    m.id as master_id,
                    m.doc_no,
                    m.form_type,
                    m.patient_name,
                    m.cccd,
                    m.dob,
                    m.gender,
                    m.signature_status,
                    m.send_status,
                    d.id as detail_id,
                    d.clinical_data,
                    d.lab_data,
                    d.conclusion_data
                FROM hms_exm_employee hee
                LEFT JOIN health_check_masters m ON (
                    (NULLIF(regexp_replace(COALESCE(hee.hee_docno, ''), '\D', '', 'g'), '')::bigint > 0 AND m.his_doc_no = hee.hee_docno::text)
                    OR m.his_employee_id = hee.hee_employee_id::text
                )
                LEFT JOIN health_check_details d ON d.master_id = m.id
                WHERE hee.hee_contract_id = $1
                  AND NULLIF(regexp_replace(COALESCE(hee.hee_docno, ''), '\D', '', 'g'), '')::bigint > 0
                  AND hee.hee_isactive = 'Y'
                ORDER BY hee.hee_employee_id ASC
            `, [contractId]);

            const receivedEmployees = empRes.rows;
            if (receivedEmployees.length === 0) {
                return res.json({
                    success: true,
                    message: 'Không có nhân viên nào đã tiếp nhận trong hợp đồng này.',
                    stats: { totalReceived: 0, updatedCount: 0, skippedAlreadyHasResults: 0, skippedNoHisResults: 0, skippedSignedOrSent: 0 }
                });
            }

            // 3. Gom danh sách docNos để batch fetch từ HIS
            const docNos = Array.from(new Set(receivedEmployees.map(r => Number(r.hee_docno)).filter(d => d > 0)));

            console.log(`🔬 [syncContractParaclinicalResults] Đang batch query kết quả CLS từ HIS cho ${docNos.length} hồ sơ hợp đồng ${contractId}...`);
            const hisClsMap = await hisIntegrationController.fetchBatchStructuredParaclinicalData(docNos);

            let updatedCount = 0;
            let skippedAlreadyHasResults = 0;
            let skippedNoHisResults = 0;
            let skippedSignedOrSent = 0;

            for (const emp of receivedEmployees) {
                const docNo = Number(emp.hee_docno);
                const hisCls = hisClsMap.get(docNo);

                // Kiểm tra xem HIS có kết quả nào không
                const hisHasItems = hisCls && Array.isArray(hisCls.paraclinical_items) && hisCls.paraclinical_items.some((i: any) => 
                    (i.value !== null && i.value !== undefined && String(i.value).trim() !== '') ||
                    (i.description !== null && i.description !== undefined && String(i.description).trim() !== '') ||
                    (i.conclusion !== null && i.conclusion !== undefined && String(i.conclusion).trim() !== '')
                );
                const hisHasQuick = !!hisCls?.hemoglobin || !!hisCls?.glycemia || !!hisCls?.protein || !!hisCls?.kqXnKhac;

                if (!hisHasItems && !hisHasQuick) {
                    skippedNoHisResults++;
                    continue;
                }

                // Nếu hồ sơ đã ký số hoặc đã gửi VNeID thành công -> Bỏ qua để đảm bảo tính pháp lý
                if (emp.signature_status === 'Signed' || emp.send_status === 'Success') {
                    skippedSignedOrSent++;
                    continue;
                }

                // Kiểm tra xem KSK hiện tại đã có kết quả chưa
                const currentLab = emp.lab_data || {};
                const currentHasItems = Array.isArray(currentLab.paraclinical_items) && currentLab.paraclinical_items.some((i: any) => 
                    (i.value !== null && i.value !== undefined && String(i.value).trim() !== '') ||
                    (i.description !== null && i.description !== undefined && String(i.description).trim() !== '') ||
                    (i.conclusion !== null && i.conclusion !== undefined && String(i.conclusion).trim() !== '')
                );
                const currentHasQuick = !!currentLab.blood_test?.hemoglobin || !!currentLab.blood_test?.glycemia || !!currentLab.urine_test?.protein || !!currentLab.kq_xn_khac;
                const currentHasAny = currentHasItems || currentHasQuick;

                // Nếu chọn mode 'missing_only' và KSK đã có kết quả đầy đủ -> Bỏ qua
                // Tuy nhiên, nếu HIS có kết quả mới mà KSK chưa có, vẫn merge vào
                if (mode === 'missing_only' && currentHasAny) {
                    // Kiểm tra xem HIS có kết quả mới nào chưa có trong currentLab không
                    let hasNewData = false;
                    if (hisCls?.hemoglobin && !currentLab.blood_test?.hemoglobin) hasNewData = true;
                    if (hisCls?.glycemia && !currentLab.blood_test?.glycemia) hasNewData = true;
                    if (hisCls?.protein && !currentLab.urine_test?.protein) hasNewData = true;
                    if (hisCls?.kqXnKhac && !currentLab.kq_xn_khac) hasNewData = true;

                    if (!hasNewData && Array.isArray(hisCls?.paraclinical_items)) {
                        for (const it of hisCls.paraclinical_items) {
                            const curIt = currentLab.paraclinical_items?.find((c: any) => c.service_code === it.service_code);
                            if (!curIt || (!curIt.value && it.value) || (!curIt.description && it.description) || (!curIt.conclusion && it.conclusion)) {
                                hasNewData = true;
                                break;
                            }
                        }
                    }

                    if (!hasNewData) {
                        skippedAlreadyHasResults++;
                        continue;
                    }
                }

                // Nếu chưa có master record -> Đồng bộ tạo mới từ HIS
                if (!emp.master_id) {
                    try {
                        const syncRes = await batchSyncController.syncSingleDocFromHis(docNo, currentUser, 'Administrator', true);
                        if (syncRes.success) {
                            updatedCount++;
                        }
                    } catch (e: any) {
                        console.warn(`⚠️ [syncContractParaclinicalResults] Lỗi tạo hồ sơ KSK cho docNo ${docNo}:`, e.message);
                    }
                    continue;
                }

                // Chuẩn bị freshLabData từ HIS
                const freshLabData: any = {
                    blood_test: {},
                    urine_test: {},
                    paraclinical_items: []
                };
                if (hisCls.hemoglobin) freshLabData.blood_test.hemoglobin = hisCls.hemoglobin;
                if (hisCls.glycemia) freshLabData.blood_test.glycemia = hisCls.glycemia;
                if (hisCls.protein) freshLabData.urine_test.protein = hisCls.protein;
                if (hisCls.kqXnKhac) freshLabData.kq_xn_khac = hisCls.kqXnKhac;
                if (Array.isArray(hisCls.paraclinical_items)) {
                    freshLabData.paraclinical_items = hisCls.paraclinical_items.map((item: any) => ({
                        ...item,
                        is_his_value: !!item.value,
                        user_edited: false
                    }));
                }

                // Sử dụng mergeLabData an toàn (bảo toàn dữ liệu bác sĩ đã sửa tay)
                const finalLab = mergeLabData(currentLab, freshLabData);

                // Tái tạo XML liên thông theo biểu mẫu tương ứng
                let xmlData = '';
                try {
                    xmlData = generateXmlPayload(
                        emp.form_type || '3',
                        {
                            patientName: emp.patient_name,
                            cccd: emp.cccd,
                            dob: emp.dob,
                            gender: emp.gender,
                            docNo: emp.doc_no
                        },
                        emp.clinical_data || {},
                        finalLab,
                        emp.conclusion_data || {}
                    );
                } catch (xmlErr: any) {
                    console.warn(`⚠️ [syncContractParaclinicalResults] Lỗi tái tạo XML cho master ${emp.master_id}:`, xmlErr.message);
                }

                // Cập nhật vào DB
                if (emp.detail_id) {
                    await query(
                        'UPDATE health_check_details SET lab_data = $1::jsonb, updated_at = NOW() WHERE id = $2',
                        [JSON.stringify(finalLab), emp.detail_id]
                    );
                } else {
                    await query(
                        'INSERT INTO health_check_details (master_id, clinical_data, lab_data, conclusion_data, created_at, updated_at) VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, NOW(), NOW())',
                        [emp.master_id, JSON.stringify(emp.clinical_data || {}), JSON.stringify(finalLab), JSON.stringify(emp.conclusion_data || {})]
                    );
                }

                if (xmlData) {
                    await query(
                        'UPDATE health_check_masters SET xml_data = $1, updated_at = NOW() WHERE id = $2',
                        [xmlData, emp.master_id]
                    );
                } else {
                    await query(
                        'UPDATE health_check_masters SET updated_at = NOW() WHERE id = $1',
                        [emp.master_id]
                    );
                }

                updatedCount++;
            }

            console.log(`✅ [syncContractParaclinicalResults] Hoàn thành: Đã cập nhật ${updatedCount} hồ sơ, bỏ qua ${skippedAlreadyHasResults} (đã có), ${skippedNoHisResults} (HIS chưa có KQ), ${skippedSignedOrSent} (đã ký/gửi).`);

            let message = '';
            if (updatedCount > 0) {
                message = `Đã đồng bộ kết quả CLS thành công cho ${updatedCount}/${receivedEmployees.length} hồ sơ!`;
                if (skippedNoHisResults > 0) message += ` (${skippedNoHisResults} hồ sơ HIS chưa có KQ)`;
                if (skippedAlreadyHasResults > 0) message += ` (${skippedAlreadyHasResults} hồ sơ đã có đủ KQ)`;
            } else if (skippedNoHisResults > 0 && skippedNoHisResults === receivedEmployees.length) {
                message = `Chưa thể đồng bộ: ${skippedNoHisResults} hồ sơ đã tiếp đón nhưng chưa có kết quả xét nghiệm/CĐHA nào trên HIS Core!`;
            } else if (skippedAlreadyHasResults > 0 && skippedAlreadyHasResults === receivedEmployees.length) {
                message = `Tất cả ${skippedAlreadyHasResults} hồ sơ đã có kết quả CLS đầy đủ, không có kết quả mới từ HIS.`;
            } else {
                message = `Đã kiểm tra ${receivedEmployees.length} hồ sơ: Cập nhật ${updatedCount}, bỏ qua ${skippedNoHisResults} (HIS chưa có KQ), ${skippedAlreadyHasResults} (đã có KQ), ${skippedSignedOrSent} (đã ký/gửi).`;
            }

            return res.json({
                success: true,
                message,
                stats: {
                    totalReceived: receivedEmployees.length,
                    updatedCount,
                    skippedAlreadyHasResults,
                    skippedNoHisResults,
                    skippedSignedOrSent
                }
            });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi syncContractParaclinicalResults:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Báo cáo tổng kết & thống kê phân loại sức khỏe đoàn khám (Enterprise Health Check Analytics)
    async getContractReportSummary(req: Request, res: Response) {
        const { id } = req.params;
        const contractId = parseInt(String(id), 10);
        if (!contractId || isNaN(contractId)) {
            return res.status(400).json({ success: false, message: 'Mã hợp đồng không hợp lệ' });
        }

        try {
            // 1. Thông tin hợp đồng
            const contractRes = await query(`
                SELECT c.hec_contract_id as id, c.hec_no as code,
                       COALESCE(NULLIF(TRIM(c.hec_description), ''), c.hec_no) as name,
                       c.hec_company_id, c.hec_date, c.hec_examdate, c.hec_status
                FROM hms_exm_contract c
                WHERE c.hec_contract_id = $1
            `, [contractId]);

            if (contractRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });
            }

            const contract = contractRes.rows[0];

            // 2. Danh sách nhân viên và chi tiết kết luận khám
            const empRes = await query(`
                SELECT 
                    e.hee_employee_id as id,
                    COALESCE(e.hee_id, e.hee_employee_id) as code,
                    trim(COALESCE(e.hee_surname,'')||' '||COALESCE(e.hee_midname,'')||' '||COALESCE(e.hee_firstname, e.hee_name, '')) as name,
                    to_char(e.hee_birthdate, 'DD/MM/YYYY') as dob,
                    e.hee_sex as gender,
                    COALESCE(e.hee_cardid, e.hee_cccd) as cccd,
                    e.hee_phone as phone,
                    e.hee_dept as dept,
                    e.hee_pos as pos,
                    e.hee_docno as doc_no,
                    e.hee_status as employee_status,
                    COALESCE(cl.hecl_phanloai, e.hee_conclusion) as phanloai,
                    cl.hecl_conclusion as conclusion,
                    cl.hecl_remark as remark,
                    cl.hecl_mat as mat,
                    cl.hecl_tmh as tmh,
                    cl.hecl_rhm as rhm,
                    cl.hecl_tuanhoan as noi,
                    cl.hecl_ngoai as ngoai,
                    e.hee_height as height,
                    e.hee_weight as weight,
                    e.hee_bmi as bmi,
                    e.hee_blood_pressure as blood_pressure,
                    m.signature_status,
                    m.send_status
                FROM hms_exm_employee e
                LEFT JOIN hms_exm_conclusion cl ON cl.hecl_docno::text = e.hee_docno
                LEFT JOIN health_check_masters m ON m.his_employee_id = e.hee_employee_id AND m.his_contract_id = $1
                WHERE e.hee_contract_id = $1 AND e.hee_isactive = 'Y'
                ORDER BY e.hee_employee_id ASC
            `, [contractId]);

            const employees = empRes.rows;
            const totalEmployees = employees.length;
            const receivedEmployees = employees.filter(e => e.doc_no && e.doc_no !== '0').length;
            const concludedEmployees = employees.filter(e => e.phanloai && e.phanloai.trim() !== '').length;
            const syncedEmployees = employees.filter(e => e.send_status === 'Success').length;

            // 3. Thống kê phân loại sức khỏe (Loại 1 -> Loại 5)
            const classificationCounts: Record<string, number> = {
                'Loại 1': 0,
                'Loại 2': 0,
                'Loại 3': 0,
                'Loại 4': 0,
                'Loại 5': 0,
                'Chưa phân loại': 0
            };

            for (const emp of employees) {
                let pl = emp.phanloai?.trim();
                if (pl === '1') pl = 'Loại 1';
                else if (pl === '2') pl = 'Loại 2';
                else if (pl === '3') pl = 'Loại 3';
                else if (pl === '4') pl = 'Loại 4';
                else if (pl === '5') pl = 'Loại 5';

                if (pl && classificationCounts[pl] !== undefined) {
                    classificationCounts[pl]++;
                } else if (emp.doc_no) {
                    classificationCounts['Chưa phân loại']++;
                }
            }

            // 4. Thống kê tỷ lệ bệnh lý thường gặp
            const pathologyStats = {
                refractiveError: employees.filter(e => e.mat && (e.mat.toLowerCase().includes('cận') || e.mat.toLowerCase().includes('loạn') || e.mat.toLowerCase().includes('viễn'))).length,
                entIssue: employees.filter(e => e.tmh && (e.tmh.toLowerCase().includes('viêm') || e.tmh.toLowerCase().includes('lệch'))).length,
                dentalIssue: employees.filter(e => e.rhm && (e.rhm.toLowerCase().includes('sâu') || e.rhm.toLowerCase().includes('viêm') || e.rhm.toLowerCase().includes('cao'))).length,
                hypertension: employees.filter(e => e.blood_pressure && (parseInt(String(e.blood_pressure).split('/')[0], 10) >= 140 || parseInt(String(e.blood_pressure).split('/')[1] || '0', 10) >= 90)).length,
                overweight: employees.filter(e => Number(e.bmi) >= 23).length
            };

            return res.json({
                success: true,
                contract,
                summary: {
                    totalEmployees,
                    receivedEmployees,
                    concludedEmployees,
                    syncedEmployees,
                    concludedRate: totalEmployees > 0 ? Math.round((concludedEmployees / totalEmployees) * 100) : 0,
                    classificationCounts,
                    pathologyStats
                },
                employees
            });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getContractReportSummary:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const contractsController = new ContractsController();
