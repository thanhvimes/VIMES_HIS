import { Request, Response } from 'express';
import { query } from '../../config/database';
import SecurityUtils from '../../utils/security';
import { loadHealthCheckSettings } from '../../config/health-check-settings';
import { restartHealthCheckSyncWorker } from '../../services/health-check-sync.service';
import axios from 'axios';

export class ContractsController {
    // Lấy cấu hình liên thông VNeID
    async getSettings(req: Request, res: Response) {
        try {
            const result = await query(
                `SELECT id, vneid_url, vneid_username, vneid_password, ma_cskcb, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval, barcode_label_size_xn, barcode_label_size_ksk, barcode_show_hospital, barcode_show_date, barcode_show_sample_type, allow_unsigned_sync, barcode_zpl_template_xn, barcode_zpl_template_ksk, barcode_printer_name, reception_slip_template, use_qz_tray FROM health_check_settings LIMIT 1`
            );

            if (result.rows.length === 0) {
                return res.json({
                    vneid_url: 'https://api.emrhub.vn/api/v1',
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
                    allow_unsigned_sync: false,
                    barcode_zpl_template_xn: '^XA\n^CF0,26\n^FO30,30^FD{hospital}^FS\n^FO30,70^FD{patient}^FS\n^FO30,105^FD{test}^FS\n^FO30,140^FD{sample_type} - {date}^FS\n^BY2,2,40\n^FO30,175^BCN,,N,N\n^FD{code}^FS\n^FO30,225^FD{code}^FS\n^XZ',
                    barcode_zpl_template_ksk: '^XA\n^CF0,26\n^FO30,30^FD{hospital}^FS\n^FO30,70^FD{patient}^FS\n^FO30,105^FD{form_name}^FS\n^FO30,140^FD{info}^FS\n^BY2,2,40\n^FO30,175^BCN,,N,N\n^FD{code}^FS\n^FO30,225^FD{code}^FS\n^XZ',
                    barcode_printer_name: 'Zebra',
                    use_qz_tray: false,
                    reception_slip_template: `<div class="header">
    <div class="hospital-name">BỆNH VIỆN ĐA KHOA TỈNH NINH BÌNH</div>
    <div class="title">PHIẾU TIẾP ĐÓN</div>
</div>

<div class="divider"></div>

<table class="info-table">
    <tr>
        <td class="info-label">Số hồ sơ:</td>
        <td class="info-value" style="font-weight: bold; font-size: 15px;">{{docNo}}</td>
    </tr>
    <tr>
        <td class="info-label">Họ tên:</td>
        <td class="info-value" style="font-weight: bold; font-size: 15px;">{{name}}</td>
    </tr>
    <tr>
        <td class="info-label">Năm sinh:</td>
        <td class="info-value">{{dob}}</td>
    </tr>
    <tr>
        <td class="info-label">CCCD:</td>
        <td class="info-value">{{cardId}}</td>
    </tr>
    <tr>
        <td class="info-label">Địa chỉ:</td>
        <td class="info-value">{{address}}</td>
    </tr>
</table>

<div class="divider"></div>

<div class="barcode-section">
    <div class="barcode-container">
        <svg id="barcode"></svg>
    </div>
    <div class="barcode-time">In: {{dateStr}}</div>
</div>

<div class="divider"></div>

<table class="vitals-table">
    <tr>
        <td class="vitals-label">Cân nặng:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit">kg</td>
    </tr>
    <tr>
        <td class="vitals-label">Chiều cao:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit">cm</td>
    </tr>
    <tr>
        <td class="vitals-label">Mạch:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit">lần/phút</td>
    </tr>
    <tr>
        <td class="vitals-label">Huyết áp:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit">mmHg</td>
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

<div class="divider" style="margin-top: 15px;"></div>`
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

    // Cập nhật cấu hình liên thông VNeID
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
            allow_unsigned_sync,
            barcode_zpl_template_xn,
            barcode_zpl_template_ksk,
            barcode_printer_name,
            reception_slip_template,
            use_qz_tray
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
                        barcode_zpl_template_xn = $14,
                        barcode_zpl_template_ksk = $15,
                        barcode_printer_name = $16,
                        reception_slip_template = $17,
                        use_qz_tray = $18,
                        updated_at = NOW()
                    WHERE id = $19
                    RETURNING id
                `;
                await query(updateSql, [
                    vneid_url || 'https://api.emrhub.vn/api/v1',
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
                    barcode_zpl_template_xn || '',
                    barcode_zpl_template_ksk || '',
                    barcode_printer_name || 'Zebra',
                    reception_slip_template || '',
                    use_qz_tray === true,
                    existing.id
                ]);
            } else {
                finalPassword = vneid_password ? SecurityUtils.encrypt(vneid_password) : '';
                const insertSql = `
                    INSERT INTO health_check_settings (
                        vneid_url, vneid_username, vneid_password, ma_cskcb, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval,
                        barcode_label_size_xn, barcode_label_size_ksk, barcode_show_hospital, barcode_show_date, barcode_show_sample_type,
                        allow_unsigned_sync, barcode_zpl_template_xn, barcode_zpl_template_ksk, barcode_printer_name, reception_slip_template, use_qz_tray
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                    RETURNING id
                `;
                await query(insertSql, [
                    vneid_url || 'https://api.emrhub.vn/api/v1',
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
                    barcode_zpl_template_xn || '',
                    barcode_zpl_template_ksk || '',
                    barcode_printer_name || 'Zebra',
                    reception_slip_template || '',
                    use_qz_tray === true
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

    // Gọi ping thử kết nối tới cổng VNeID
    async testConnection(req: Request, res: Response) {
        const { vneid_url, vneid_username, vneid_password } = req.body;

        try {
            if (!vneid_url) {
                return res.status(400).json({ success: false, message: 'Thiếu địa chỉ cổng URL' });
            }

            const originUrl = vneid_url.includes('/api/v1') 
                ? vneid_url.split('/api/v1')[0] 
                : vneid_url;

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

            console.log(`📡 [VNeID Portal] Testing connection to login at: ${originUrl}/api/auth/login`);

            const loginRes = await axios.post(`${originUrl}/api/auth/login`, {
                username: vneid_username || '',
                password: testPassword
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
                    c.hec_object as object,
                    c.hec_form_type as form_type,
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
        const { code, company_id, description, contract_date, exam_date, type, object, form_type } = req.body;
        try {
            const idRes = await query(`SELECT COALESCE(MAX(hec_contract_id), 0) + 1 as next_id FROM hms_exm_contract`);
            const nextId = idRes.rows[0].next_id;

            const insertSql = `
                INSERT INTO hms_exm_contract (
                    hec_contract_id, hec_no, hec_company_id, hec_description, hec_date, hec_examdate, hec_type, hec_object, hec_form_type, hec_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'O')
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
                object ? parseInt(String(object), 10) : null,
                form_type || '2'
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
        const { code, company_id, description, contract_date, exam_date, type, object, form_type } = req.body;
        try {
            const checkStatus = await query('SELECT hec_status FROM hms_exm_contract WHERE hec_contract_id = $1', [contractId]);
            if (checkStatus.rows.length > 0 && checkStatus.rows[0].hec_status === 'A') {
                return res.status(400).json({ success: false, message: 'Gói khám đã được duyệt chốt, không thể thay đổi thông tin!' });
            }

            const updateSql = `
                UPDATE hms_exm_contract
                SET hec_no = $1,
                    hec_company_id = $2,
                    hec_description = $3,
                    hec_date = $4,
                    hec_examdate = $5,
                    hec_type = $6,
                    hec_object = $7,
                    hec_form_type = $8
                WHERE hec_contract_id = $9
            `;
            await query(updateSql, [
                code,
                String(company_id || ''),
                description || '',
                contract_date ? new Date(contract_date) : new Date(),
                exam_date ? new Date(exam_date) : null,
                type || 'DV',
                object ? parseInt(String(object), 10) : null,
                form_type || '2',
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
}

export const contractsController = new ContractsController();
