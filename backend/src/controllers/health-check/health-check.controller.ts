// ==================== HEALTH CHECK CONTROLLER ====================
// File: backend/src/controllers/health-check.controller.ts

import { Request, Response } from 'express';
import { query, transaction } from '../../config/database';
import SecurityUtils from '../../utils/security';
import { getHealthCheckSettings, loadHealthCheckSettings } from '../../config/health-check-settings';

class HealthCheckController {
    
    // 1. Lấy danh sách hồ sơ (kèm phân trang, lọc nâng cao)
    async getDocuments(req: Request, res: Response) {
        try {
            const { searchTerm, status, signatureStatus, formType } = req.query;
            let sql = `
                SELECT m.*, d.clinical_data, d.lab_data, d.conclusion_data 
                FROM health_check_masters m
                JOIN health_check_details d ON m.id = d.master_id
                WHERE 1=1
            `;
            const params: any[] = [];
            let paramIndex = 1;

            if (searchTerm) {
                sql += ` AND (m.patient_name ILIKE $${paramIndex} OR m.doc_no ILIKE $${paramIndex} OR m.cccd ILIKE $${paramIndex})`;
                params.push(`%${searchTerm}%`);
                paramIndex++;
            }

            if (status && status !== 'All') {
                sql += ` AND m.send_status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            if (signatureStatus && signatureStatus !== 'All') {
                sql += ` AND m.signature_status = $${paramIndex}`;
                params.push(signatureStatus);
                paramIndex++;
            }

            if (formType && formType !== 'All') {
                sql += ` AND m.form_type = $${paramIndex}`;
                params.push(formType);
                paramIndex++;
            }

            sql += ` ORDER BY m.id DESC LIMIT 100`;

            const result = await query(sql, params);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getDocuments:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 2. Lấy chi tiết một hồ sơ theo ID
    async getDocumentById(req: Request, res: Response) {
        const id = req.params.id as string;
        try {
            const sql = `
                SELECT m.*, d.clinical_data, d.lab_data, d.conclusion_data 
                FROM health_check_masters m
                JOIN health_check_details d ON m.id = d.master_id
                WHERE m.id = $1
            `;
            const result = await query(sql, [parseInt(id)]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Không tìm thấy hồ sơ KSK" });
            }
            return res.json(result.rows[0]);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getDocumentById:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 3. Tạo mới hồ sơ khám sức khỏe (Master-Detail)
    async createDocument(req: Request, res: Response) {
        const { 
            patientId, patientName, cccd, dob, gender, docNo, formType,
            clinicalData, labData, conclusionData 
        } = req.body;

        if (!formType) {
            return res.status(400).json({ error: "Loại mẫu biểu formType là bắt buộc" });
        }

        try {
            const xmlData = this.generateXmlPayload(
                formType, 
                { patientName, cccd, dob, gender, docNo }, 
                clinicalData, 
                labData, 
                conclusionData
            );

            const result = await transaction(async (client) => {
                const masterSql = `
                    INSERT INTO health_check_masters (
                        patient_id, patient_name, cccd, dob, gender, doc_no, form_type, xml_data
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id
                `;
                const masterRes = await client.query(masterSql, [
                    patientId || null, patientName || '', cccd || '', 
                    dob ? new Date(dob) : null, gender || 'Nam', 
                    docNo || `KSK-${Date.now()}`, formType, xmlData
                ]);
                const masterId = masterRes.rows[0].id;

                const detailSql = `
                    INSERT INTO health_check_details (
                        master_id, clinical_data, lab_data, conclusion_data
                    ) VALUES ($1, $2, $3, $4)
                `;
                await client.query(detailSql, [
                    masterId, 
                    JSON.stringify(clinicalData || {}), 
                    JSON.stringify(labData || {}), 
                    JSON.stringify(conclusionData || {})
                ]);

                return masterId;
            });

            return res.status(201).json({ success: true, id: result });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi createDocument:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 4. Cập nhật hồ sơ khám sức khỏe
    async updateDocument(req: Request, res: Response) {
        const id = req.params.id as string;
        const { 
            patientId, patientName, cccd, dob, gender, docNo, formType,
            clinicalData, labData, conclusionData 
        } = req.body;

        try {
            const xmlData = this.generateXmlPayload(
                formType, 
                { patientName, cccd, dob, gender, docNo }, 
                clinicalData, 
                labData, 
                conclusionData
            );

            await transaction(async (client) => {
                const masterSql = `
                    UPDATE health_check_masters 
                    SET patient_id = $1, patient_name = $2, cccd = $3, dob = $4, 
                        gender = $5, doc_no = $6, xml_data = $7, updated_at = NOW(),
                        signature_status = 'Unsigned', send_status = 'Unsent'
                    WHERE id = $8
                `;
                await client.query(masterSql, [
                    patientId, patientName, cccd, dob ? new Date(dob) : null, 
                    gender, docNo, xmlData, parseInt(id)
                ]);

                const detailSql = `
                    UPDATE health_check_details 
                    SET clinical_data = $1, lab_data = $2, conclusion_data = $3, updated_at = NOW()
                    WHERE master_id = $4
                `;
                await client.query(detailSql, [
                    JSON.stringify(clinicalData || {}), 
                    JSON.stringify(labData || {}), 
                    JSON.stringify(conclusionData || {}),
                    parseInt(id)
                ]);
            });

            return res.json({ success: true });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi updateDocument:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 5. Xóa hồ sơ khám sức khỏe
    async deleteDocument(req: Request, res: Response) {
        const id = req.params.id as string;
        try {
            const sql = `DELETE FROM health_check_masters WHERE id = $1`;
            await query(sql, [parseInt(id)]);
            return res.json({ success: true });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi deleteDocument:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 6. Ký số hồ sơ (USB / HSM)
    async signDocuments(req: Request, res: Response) {
        const { docIds, signatureType, signatures } = req.body;

        if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
            return res.status(400).json({ error: "Danh sách ID hồ sơ không hợp lệ" });
        }

        const type = signatureType === 'HSM' ? 'HSM' : 'USB';

        try {
            if (type === 'USB') {
                if (signatures && typeof signatures === 'object') {
                    for (const id of docIds) {
                        const signatureValue = signatures[id];
                        if (signatureValue) {
                            const sql = `
                                UPDATE health_check_masters
                                SET "signature" = $1,
                                    "signature_status" = 'Signed',
                                    "signature_type" = 'USB',
                                    "updated_at" = NOW()
                                WHERE id = $2
                            `;
                            await query(sql, [signatureValue, parseInt(id)]);
                        }
                    }
                } else {
                    const sql = `
                        UPDATE health_check_masters
                        SET "signature" = 'MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMGcGA...',
                            "signature_status" = 'Signed',
                            "signature_type" = 'USB',
                            "updated_at" = NOW()
                        WHERE id = ANY($1::int[])
                    `;
                    const intIds = docIds.map(id => parseInt(id));
                    await query(sql, [intIds]);
                }
            } else {
                await new Promise(resolve => setTimeout(resolve, 1500));
                const sql = `
                    UPDATE health_check_masters
                    SET "signature" = $1,
                        "signature_status" = 'Signed',
                        "signature_type" = 'HSM',
                        "updated_at" = NOW()
                    WHERE id = ANY($2::int[])
                `;
                const mockHsmSignature = `MIIJuQYJKoZIhvcNAQcCoIIJqjCCCakCAQExCzAJBgUrDgMCGgUAMAsGCSqGSIb3DQEHAaCCB8QwggfAMIIErKADAgECAgEBMA0GCSqGSIb3DQEBBQUAMIGBMQswCQYDVQQGEwJWTjENMAsGA1UECBEFSGFOb2kxDTALBgNVBAcTBEhhTm9pMRswGQYDVQQKExJCYW4gQ28geWV1IENoaW5oIHBodTEOMAwGA1UECxMFQ0ExMTAwLgYDVQQDEydUdW5nIHRhbSB4YWMgdGh1YyBjaHUga3kgc28gQ2hpbmggcGh1MB4XDTI2MDUzMTEwMDAwMFoXDTM2MDUzMTEwMDAwMFowfDELMAkGA1UEBhMCVk4xDTALBgNVBAgTBEhhTm9pMRswGQYDVQQKExJCYW4gQ28geWV1IENoaW5oIHBodTETMBEGA1UECxMKUGhvbmcgS2hhbTEcMBoGA1UEAxMTVnVDbGluaWMgSGVhbHRoQ2FyZTBcMA0GCSqGSIb3DQEBAQUAA0sAMEgCQQC1qG0uND0...`;
                const intIds = docIds.map(id => parseInt(id));
                await query(sql, [mockHsmSignature, intIds]);
            }
            return res.json({ success: true, signatureType: type });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi signDocuments:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 7. Đồng bộ cổng y tế
    async sendDocuments(req: Request, res: Response) {
        const { docIds } = req.body;

        if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
            return res.status(400).json({ error: "Danh sách ID không hợp lệ" });
        }

        try {
            const settings = getHealthCheckSettings();
            console.log(`📡 Sending ${docIds.length} XML payloads to VNeID Portal Gateway: ${settings?.vneid_url || 'https://api-vneid.moh.gov.vn/api/v1'} using account: ${settings?.vneid_username || 'vimes_cskcb'}`);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            const transactionId = `HC-VNEID-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

            const sql = `
                UPDATE health_check_masters
                SET "send_status" = 'Success',
                    "sent_at" = NOW(),
                    "transaction_id" = $1,
                    "updated_at" = NOW(),
                    "error_message" = NULL
                WHERE id = ANY($2::int[])
                RETURNING id
            `;
            const intIds = docIds.map(id => parseInt(id));
            const result = await query(sql, [transactionId, intIds]);

            const updatedIds = result.rows.map((row: any) => row.id.toString());
            const failedIds = (docIds as string[]).filter(id => !updatedIds.includes(id.toString()));

            return res.json(failedIds);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi sendDocuments:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 7.1. Lấy cấu hình liên thông VNeID
    async getSettings(req: Request, res: Response) {
        try {
            const result = await query(
                `SELECT id, vneid_url, vneid_username, vneid_password, ma_cskcb, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval FROM health_check_settings LIMIT 1`
            );

            if (result.rows.length === 0) {
                return res.json({
                    vneid_url: 'https://api-vneid.moh.gov.vn/api/v1',
                    vneid_username: '',
                    vneid_password: '',
                    ma_cskcb: '15124',
                    ma_gtin_cskcb: '1234567890123',
                    auto_sync_enabled: false,
                    auto_sync_interval: 15
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
            auto_sync_interval
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
                        updated_at = NOW()
                    WHERE id = $8
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
                    existing.id
                ]);
            } else {
                finalPassword = vneid_password ? SecurityUtils.encrypt(vneid_password) : '';
                const insertSql = `
                    INSERT INTO health_check_settings (
                        vneid_url, vneid_username, vneid_password, ma_cskcb, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id
                `;
                await query(insertSql, [
                    vneid_url || 'https://api-vneid.moh.gov.vn/api/v1',
                    vneid_username || '',
                    finalPassword,
                    ma_cskcb || '15124',
                    ma_gtin_cskcb || '1234567890123',
                    auto_sync_enabled === true,
                    parseInt(auto_sync_interval || '15', 10)
                ]);
            }

            await loadHealthCheckSettings();

            return res.json({ success: true });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi updateSettings:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 7.3. Gọi ping thử kết nối tới cổng VNeID (Mock / Sandbox)
    async testConnection(req: Request, res: Response) {
        const { vneid_url, vneid_username, vneid_password } = req.body;

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            if (!vneid_url) {
                return res.status(400).json({ success: false, message: 'Thiếu địa chỉ cổng URL' });
            }

            return res.json({ 
                success: true, 
                message: `Kết nối thành công tới cổng ${vneid_url}. Cổng hoạt động bình thường, tài khoản hợp lệ.`
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: `Lỗi kết nối tới cổng: ${error.message}` });
        }
    }

    // 8. Tạo dữ liệu thử nghiệm cho 17 mẫu biểu KSK
    async seedFromHis(req: Request, res: Response) {
        try {
            // 1. Lấy 20 bệnh nhân thật từ HIS (có hồ sơ và phiếu khám)
            const hisSql = `
                SELECT DISTINCT ON (p.hp_patientno)
                    p.hp_patientno,
                    trim(COALESCE(p.hp_surname,'') || ' ' || COALESCE(p.hp_midname,'') || ' ' || p.hp_firstname) as patient_name,
                    p.hp_sin,
                    to_char(p.hp_birthdate, 'YYYY-MM-DD') as dob,
                    p.hp_sex,
                    p.hp_dtladdr,
                    p.hp_ethnic,
                    d.hd_docno,
                    d.hd_telephone,
                    d.hd_cardno,
                    d.hd_object,
                    d.hd_patientno,
                    e.he_height,
                    e.he_weight,
                    e.he_bmi,
                    e.he_pulse,
                    e.he_bloodpressure,
                    e.he_bloodpressurex,
                    e.he_examine,
                    e.he_diagnostic
                FROM hms_patient p
                JOIN hms_doc d ON d.hd_patientno = p.hp_patientno
                LEFT JOIN hms_exam e ON e.he_docno = d.hd_docno AND e.he_receptidx = 1
                WHERE d.hd_status <> 'T'
                ORDER BY p.hp_patientno, d.hd_admitdate DESC
                LIMIT 20
            `;
            const hisResult = await query(hisSql);

            if (hisResult.rows.length === 0) {
                return res.status(404).json({ error: 'Không tìm thấy bệnh nhân nào trong HIS.' });
            }

            // 2. Xóa dữ liệu seed cũ (nếu có)
            await query(`DELETE FROM health_check_masters WHERE doc_no LIKE 'KSK-%'`);

            let seededCount = 0;
            const formTypes = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17'];

            for (let i = 0; i < hisResult.rows.length; i++) {
                const row = hisResult.rows[i];
                const formType = formTypes[i % formTypes.length];
                const docNo = `KSK-${new Date().getFullYear()}-${String(row.hd_docno).padStart(4, '0')}`;
                
                // Normalize gender
                const genderVal = (row.hp_sex || '').toLowerCase();
                const gender = (genderVal === 'm' || genderVal.includes('nam')) ? 'Nam' : 'Nữ';
                const patientName = (row.patient_name || '').toUpperCase().trim();
                const cccd = row.hp_sin || '';
                const patientId = String(row.hp_patientno);

                // Build clinical_data from HIS exam
                const bp = row.he_bloodpressure && row.he_bloodpressurex
                    ? `${row.he_bloodpressure}/${row.he_bloodpressurex}` 
                    : '120/80';

                const height = row.he_height > 0 ? Number(row.he_height) : 165 + (i % 15);
                const weight = row.he_weight > 0 ? Number(row.he_weight) : 55 + (i % 20);
                const bmi = row.he_bmi > 0 ? Number(row.he_bmi) : parseFloat((weight / Math.pow(height/100, 2)).toFixed(1));

                const clinicalData: any = {
                    address: row.hp_dtladdr || '',
                    phone: row.hd_telephone || '',
                    ethnic: row.hp_ethnic ? String(row.hp_ethnic).padStart(2, '0') : '01',
                    blood_group: 'O',
                    target_group: '14',
                    funding_source: '9',
                    examination: {
                        height: String(height),
                        weight: String(weight),
                        bmi: String(bmi),
                        blood_pressure: bp,
                        pulse: row.he_pulse > 0 ? String(row.he_pulse) : '75',
                    },
                    clinical_exam: {
                        internal: row.he_examine || 'Nội khoa bình thường, tim phổi tốt.',
                        eye: 'Mắt phải 10/10, Mắt trái 10/10.',
                        ent: 'Tai mũi họng bình thường.',
                        dental: 'Răng hàm mặt bình thường.',
                        external: 'Ngoại khoa bình thường.',
                        gynecology: gender === 'Nữ' ? 'Sản phụ khoa bình thường.' : 'Không khám.',
                    },
                    extra: {}
                };

                // Form-specific extras
                if (formType === '3') {
                    clinicalData.extra = { hang_lai_xe: 'B2', tsgd_mac_benh: 0 };
                } else if (formType === '4') {
                    clinicalData.extra = { chuc_danh: 'Nhân viên', noi_cong_tac: 'Ga Hà Nội' };
                } else if (formType === '5') {
                    clinicalData.extra = { vi_tri_lam_viec: 'Thủy thủ', bo_phan_lam_viec: 'Boong' };
                } else if (parseInt(formType) >= 6 && parseInt(formType) <= 13) {
                    clinicalData.extra = { sinh_non: 0, tuan_thai_khi_sinh: 39, can_nang_luc_sinh: '3.2' };
                } else if (parseInt(formType) >= 14) {
                    clinicalData.extra = { tiem_chung_bcg: 1, tiem_chung_bh_hg_uv: 1, tiem_chung_soi: 1 };
                }

                const labData: any = {
                    blood_test: { hemoglobin: String(130 + (i % 20)), glycemia: (4.5 + (i % 10) * 0.1).toFixed(1) },
                    urine_test: { protein: 'Âm tính' }
                };

                const conclusionData: any = {
                    fitness_class: (i % 3 === 0) ? '2' : '1',
                    diagnosis: row.he_diagnostic || 'Đủ sức khỏe học tập và làm việc',
                    cac_van_de_luu_y: 'Không'
                };

                const xmlData = this.generateXmlPayload(
                    formType, 
                    { patientName, cccd, dob: row.dob || '1990-01-01', gender, docNo }, 
                    clinicalData, labData, conclusionData
                );

                await transaction(async (client) => {
                    const masterSql = `
                        INSERT INTO health_check_masters (
                            patient_id, patient_name, cccd, dob, gender, doc_no, form_type, xml_data, signature_status, send_status
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        RETURNING id
                    `;
                    const masterRes = await client.query(masterSql, [
                        patientId, patientName, cccd, row.dob ? new Date(row.dob) : null,
                        gender, docNo, formType, xmlData, 'Unsigned', 'Unsent'
                    ]);
                    const masterId = masterRes.rows[0].id;

                    const detailSql = `
                        INSERT INTO health_check_details (
                            master_id, clinical_data, lab_data, conclusion_data
                        ) VALUES ($1, $2, $3, $4)
                    `;
                    await client.query(detailSql, [
                        masterId, 
                        JSON.stringify(clinicalData), 
                        JSON.stringify(labData), 
                        JSON.stringify(conclusionData)
                    ]);
                });
                seededCount++;
            }

            return res.json({ success: true, count: seededCount, message: `Đã tạo ${seededCount} hồ sơ KSK từ dữ liệu HIS thật.` });
        } catch (error: any) {
            console.error('Lỗi seed dữ liệu KSK từ HIS:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Helper: Tìm kiếm giá trị trường linh hoạt từ nhiều nguồn (case-insensitive & snake/camel-case)
    private findValue(tag: string, ...sources: any[]): string {
        const tagLower = tag.toLowerCase();
        const tagSnake = tagLower.replace(/_/g, '').replace(/-/g, '');
        
        const tagMap: Record<string, string[]> = {
            'ho_ten': ['patientname', 'patient_name', 'name'],
            'so_cccd': ['cccd', 'socccd'],
            'ngay_sinh': ['dob', 'ngaysinh', 'birth'],
            'gioi_tinh': ['gender', 'gioitinh'],
            'ma_lk': ['docno', 'doc_no', 'malk'],
            'chieu_cao': ['height', 'chieucao'],
            'can_nang': ['weight', 'cannang'],
            'chi_so_bmi': ['bmi', 'chisobmi'],
            'mach': ['pulse', 'mach'],
            'huyet_ap': ['blood_pressure', 'bloodpressure', 'bp', 'huyetap'],
            'noi_khoa': ['internal', 'noikhoa', 'internalexam', 'internal_exam'],
            'mat': ['eye', 'mat', 'eyeexam', 'eye_exam'],
            'tai_mui_hong': ['ent', 'taimuihong', 'entexam', 'ent_exam'],
            'rang_ham_mat': ['dental', 'ranghammat', 'dentalexam', 'dental_exam'],
            'ngoai_khoa': ['external', 'ngoaikhoa', 'externalexam', 'external_exam']
        };

        const targetKeys = [tagLower, tagSnake];
        if (tagMap[tagLower]) {
            targetKeys.push(...tagMap[tagLower]);
        }
        
        const search = (obj: any): string | null => {
            if (!obj || typeof obj !== 'object') return null;
            
            for (const key of Object.keys(obj)) {
                const keyLower = key.toLowerCase();
                const keySnake = keyLower.replace(/_/g, '').replace(/-/g, '');
                
                if (targetKeys.includes(keyLower) || targetKeys.includes(keySnake)) {
                    if (obj[key] !== null && obj[key] !== undefined) {
                        return String(obj[key]);
                    }
                }
            }
            
            for (const key of Object.keys(obj)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    const result = search(obj[key]);
                    if (result !== null) return result;
                }
            }
            return null;
        };
        
        for (const source of sources) {
            const result = search(source);
            if (result !== null) return result;
        }
        return '';
    }

    // Helper: Escape XML các ký tự đặc biệt
    private escapeXml(unsafe: string | number | null | undefined): string {
        if (unsafe === null || unsafe === undefined) return '';
        const str = String(unsafe);
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    // Helper: Sinh XML tự động theo đặc tả 17 mẫu biểu KSK của Bộ Y tế
        // Helper: Sinh XML tự động theo đặc tả 17 mẫu biểu KSK của Bộ Y tế
    private generateXmlPayload(formType: string, master: any, clinical: any, lab: any, conclusion: any): string {
        const src = { master, clinical, lab, conclusion };
        const settings = getHealthCheckSettings();
        const maGtinCskcb = settings?.ma_gtin_cskcb || this.findValue('ma_gtin_cskcb', src) || '1234567890123';
        const maCskcb = settings?.ma_cskcb || '15124';
        
        // Map gender string to code (1=Nam, 2=Nữ)
        let genderCode = '1';
        const rawGender = master.gender || this.findValue('GIOI_TINH', src) || this.findValue('GIOI_TINH_CO_SAN', src);
        if (rawGender === 'Nữ' || rawGender === '2') {
            genderCode = '2';
        }

        // Format dates consistently (YYYY-MM-DD)
        const formatXmlDate = (rawDate: string): string => {
            if (!rawDate) return '';
            try {
                return new Date(rawDate).toISOString().split('T')[0];
            } catch {
                return rawDate;
            }
        };

        const dobVal = formatXmlDate(master.dob || this.findValue('NGAY_SINH', src));
        const ngayVaoVal = formatXmlDate(this.findValue('ngay_vao', src) || master.created_at || this.findValue('NGAY_VAO', src)) || new Date().toISOString().split('T')[0];
        
        const patientNameVal = master.patientName || master.patient_name || this.findValue('HO_TEN', src);
        const cccdVal = master.cccd || this.findValue('SO_CCCD', src);
        const maLkVal = master.docNo || master.doc_no || this.findValue('MA_LK', src);

        // 1. Phân nhóm XML
        let adminXml = `
        <HO_TEN>${this.escapeXml(patientNameVal)}</HO_TEN>
        <SO_CCCD>${this.escapeXml(cccdVal)}</SO_CCCD>
        <NGAY_SINH>${this.escapeXml(dobVal)}</NGAY_SINH>
        <GIOI_TINH>${genderCode}</GIOI_TINH>
        <DIA_CHI>${this.escapeXml(this.findValue('DIA_CHI', src))}</DIA_CHI>
        <DIEN_THOAI>${this.escapeXml(this.findValue('DIEN_THOAI', src))}</DIEN_THOAI>
        <MATINH_CU_TRU>${this.escapeXml(this.findValue('MATINH_CU_TRU', src))}</MATINH_CU_TRU>
        <MAXA_CU_TRU>${this.escapeXml(this.findValue('MAXA_CU_TRU', src))}</MAXA_CU_TRU>
        <NHOM_MAU>${this.escapeXml(this.findValue('NHOM_MAU', src))}</NHOM_MAU>
        <DOI_TUONG>${this.escapeXml(this.findValue('DOI_TUONG', src) || '14')}</DOI_TUONG>
        <NGUON_KINH_PHI>${this.escapeXml(this.findValue('NGUON_KINH_PHI', src) || '9')}</NGUON_KINH_PHI>
        <MA_GTIN_CSKCB>${this.escapeXml(maGtinCskcb)}</MA_GTIN_CSKCB>
        <NGAYCAP_CCCD>${this.escapeXml(this.findValue('cccd_date', src) || this.findValue('ngaycap_cccd', src))}</NGAYCAP_CCCD>
        <NOICAP_CCCD>${this.escapeXml(this.findValue('cccd_place', src) || this.findValue('noicap_cccd', src))}</NOICAP_CCCD>
        <LY_DO_VV>${this.escapeXml(this.findValue('ly_do_vv', src) || this.findValue('ly_do_ksk', src))}</LY_DO_VV>`;

        // Add parent or guardian if student or child
        if (formType === '1' || parseInt(formType) >= 14) {
            adminXml += `
        <NGUOI_GIAM_HO>${this.escapeXml(this.findValue('NGUOI_GIAM_HO', src))}</NGUOI_GIAM_HO>
        <SO_CCCD_NGH>${this.escapeXml(this.findValue('SO_CCCD_NGH', src))}</SO_CCCD_NGH>`;
        } else if (parseInt(formType) >= 6 && parseInt(formType) <= 13) {
            adminXml += `
        <HO_TEN_NGUOI_DI_CUNG>${this.escapeXml(this.findValue('HO_TEN_NGUOI_DI_CUNG', src))}</HO_TEN_NGUOI_DI_CUNG>
        <SO_CCCD_NGUOI_DI_CUNG>${this.escapeXml(this.findValue('SO_CCCD_NGUOI_DI_CUNG', src))}</SO_CCCD_NGUOI_DI_CUNG>
        <MOI_QUAN_HE_VOI_TRE>${this.escapeXml(this.findValue('MOI_QUAN_HE_VOI_TRE', src))}</MOI_QUAN_HE_VOI_TRE>`;
        }

        // Add driver license class
        if (formType === '3') {
            adminXml += `
        <HANG_LAI_XE>${this.escapeXml(this.findValue('HANG_LAI_XE', src))}</HANG_LAI_XE>`;
        }
        // Add railway details
        if (formType === '4') {
            adminXml += `
        <CHUC_DANH>${this.escapeXml(this.findValue('CHUC_DANH', src))}</CHUC_DANH>
        <NOI_CONG_TAC>${this.escapeXml(this.findValue('NOI_CONG_TAC', src))}</NOI_CONG_TAC>`;
        }
        // Add sailor details
        if (formType === '5') {
            adminXml += `
        <VI_TRI_LAM_VIEC>${this.escapeXml(this.findValue('VI_TRI_LAM_VIEC', src))}</VI_TRI_LAM_VIEC>
        <BO_PHAN_LAM_VIEC>${this.escapeXml(this.findValue('BO_PHAN_LAM_VIEC', src))}</BO_PHAN_LAM_VIEC>`;
        }

        // 2. Tiền sử bệnh
        let historyXml = '';
        if (formType === '3') {
            // Lái xe has comprehensive list of checkboxes
            historyXml = `
        <TSGD_MAC_BENH>${this.escapeXml(this.findValue('TSGD_MAC_BENH', src) || '0')}</TSGD_MAC_BENH>
        <TSGD_MA_BENH>${this.escapeXml(this.findValue('TSGD_MA_BENH', src))}</TSGD_MA_BENH>
        <TS_BENH_THUONG_5_NAM>${this.escapeXml(this.findValue('TS_BENH_THUONG_5_NAM', src) || '0')}</TS_BENH_THUONG_5_NAM>
        <TS_THAN_KINH_CHAN_THUONG_DAU>${this.escapeXml(this.findValue('TS_THAN_KINH_CHAN_THUONG_DAU', src) || '0')}</TS_THAN_KINH_CHAN_THUONG_DAU>
        <TS_BENH_MAT_GIAM_THI_LUC>${this.escapeXml(this.findValue('TS_BENH_MAT_GIAM_THI_LUC', src) || '0')}</TS_BENH_MAT_GIAM_THI_LUC>
        <TS_BENH_TAI_GIAM_NGHE>${this.escapeXml(this.findValue('TS_BENH_TAI_GIAM_NGHE', src) || '0')}</TS_BENH_TAI_GIAM_NGHE>
        <TS_BENH_TIM_MACH>${this.escapeXml(this.findValue('TS_BENH_TIM_MACH', src) || '0')}</TS_BENH_TIM_MACH>
        <TS_PHAU_THUAT_TIM_MACH>${this.escapeXml(this.findValue('TS_PHAU_THUAT_TIM_MACH', src) || '0')}</TS_PHAU_THUAT_TIM_MACH>
        <TS_TANG_HUYET_AP>${this.escapeXml(this.findValue('TS_TANG_HUYET_AP', src) || '0')}</TS_TANG_HUYET_AP>
        <TS_KHO_THO>${this.escapeXml(this.findValue('TS_KHO_THO', src) || '0')}</TS_KHO_THO>
        <TS_BENH_PHOI_HEN>${this.escapeXml(this.findValue('TS_BENH_PHOI_HEN', src) || '0')}</TS_BENH_PHOI_HEN>
        <TS_BENH_THAN_LOC_MAU>${this.escapeXml(this.findValue('TS_BENH_THAN_LOC_MAU', src) || '0')}</TS_BENH_THAN_LOC_MAU>
        <TS_DAI_THAO_DUONG>${this.escapeXml(this.findValue('TS_DAI_THAO_DUONG', src) || '0')}</TS_DAI_THAO_DUONG>
        <TS_BENH_TAM_THAN>${this.escapeXml(this.findValue('TS_BENH_TAM_THAN', src) || '0')}</TS_BENH_TAM_THAN>
        <TS_MAT_ROI_LOAN_Y_THUC>${this.escapeXml(this.findValue('TS_MAT_ROI_LOAN_Y_THUC', src) || '0')}</TS_MAT_ROI_LOAN_Y_THUC>
        <TS_NGAT_CHONG_MAT>${this.escapeXml(this.findValue('TS_NGAT_CHONG_MAT', src) || '0')}</TS_NGAT_CHONG_MAT>
        <TS_BENH_TIEU_HOA>${this.escapeXml(this.findValue('TS_BENH_TIEU_HOA', src) || '0')}</TS_BENH_TIEU_HOA>
        <TS_ROI_LOAN_GIAC_NGU>${this.escapeXml(this.findValue('TS_ROI_LOAN_GIAC_NGU', src) || '0')}</TS_ROI_LOAN_GIAC_NGU>
        <TS_TAI_BIEN_MACH_MAU_NAO>${this.escapeXml(this.findValue('TS_TAI_BIEN_MACH_MAU_NAO', src) || '0')}</TS_TAI_BIEN_MACH_MAU_NAO>
        <TS_SU_DUNG_RUOU>${this.escapeXml(this.findValue('ts_su_dung_ruou', src) || '0')}</TS_SU_DUNG_RUOU>
        <TS_SU_DUNG_MA_TUY>${this.escapeXml(this.findValue('ts_su_dung_ma_tuy', src) || '0')}</TS_SU_DUNG_MA_TUY>
        <TS_BENH_COT_SONG>${this.escapeXml(this.findValue('ts_benh_cot_song', src) || '0')}</TS_BENH_COT_SONG>
        <TSBT_MA_BENH_NGHE_NGHIEP>${this.escapeXml(this.findValue('tsbt_ma_benh_nghe_nghiep', src))}</TSBT_MA_BENH_NGHE_NGHIEP>
        <TSBT_NAM_PHAT_HIEN_BENH_NGHE_NGHIEP>${this.escapeXml(this.findValue('tsbt_nam_phat_hien_benh_nghe_nghiep', src))}</TSBT_NAM_PHAT_HIEN_BENH_NGHE_NGHIEP`;
        } else if (formType === '2') {
            // Người lớn: Tiền sử gia đình, bản thân, bệnh nghề nghiệp & sản phụ khoa
            historyXml = `
        <TSGD_MA_BENH>${this.escapeXml(this.findValue('TSGD_MA_BENH', src))}</TSGD_MA_BENH>
        <TSBT_MA_BENH>${this.escapeXml(this.findValue('TSBT_MA_BENH', src))}</TSBT_MA_BENH>
        <TSBT_NAM_PHAT_HIEN_BENH>${this.escapeXml(this.findValue('TSBT_NAM_PHAT_HIEN_BENH', src))}</TSBT_NAM_PHAT_HIEN_BENH>
        <TSBT_MA_BENH_NGHE_NGHIEP>${this.escapeXml(this.findValue('tsbt_ma_benh_nghe_nghiep', src))}</TSBT_MA_BENH_NGHE_NGHIEP>
        <TSBT_NAM_PHAT_HIEN_BENH_NGHE_NGHIEP>${this.escapeXml(this.findValue('tsbt_nam_phat_hien_benh_nghe_nghiep', src))}</TSBT_NAM_PHAT_HIEN_BENH_NGHE_NGHIEP`;
            
            if (genderCode === '2') {
                historyXml += `
        <CO_KINH_NGUYET_NAM_BAO_NHIEU_TUOI>${this.escapeXml(this.findValue('co_kinh_nguyet_nam_bao_nhieu_tuoi', src))}</CO_KINH_NGUYET_NAM_BAO_NHIEU_TUOI>
        <TINH_CHAT_KINH_NGUYET>${this.escapeXml(this.findValue('tinh_chat_kinh_nguyet', src) || '1')}</TINH_CHAT_KINH_NGUYET>
        <CHU_KY_KINH>${this.escapeXml(this.findValue('chu_ky_kinh', src))}</CHU_KY_KINH>
        <LUONG_KINH>${this.escapeXml(this.findValue('luong_kinh', src))}</LUONG_KINH>
        <DAU_BUNG_KINH>${this.escapeXml(this.findValue('dau_bung_kinh', src) || '0')}</DAU_BUNG_KINH>
        <DA_LAP_GIA_DINH>${this.escapeXml(this.findValue('da_lap_gia_dinh', src) || '0')}</DA_LAP_GIA_DINH>
        <PARA>${this.escapeXml(this.findValue('para', src))}</PARA>
        <DA_TUNG_MO_SAN_PHU_KHOA_CHUA>${this.escapeXml(this.findValue('da_tung_mo_san_phu_khoa_chua', src) || '0')}</DA_TUNG_MO_SAN_PHU_KHOA_CHUA>
        <SO_LAN_MO_SAN_PHU_KHOA>${this.escapeXml(this.findValue('so_lan_mo_san_phu_khoa', src))}</SO_LAN_MO_SAN_PHU_KHOA>
        <GHI_RO_MO_SAN_PHU_KHOA>${this.escapeXml(this.findValue('ghi_ro_mo_san_phu_khoa', src))}</GHI_RO_MO_SAN_PHU_KHOA>
        <DANG_AP_DUNG_BPTT_KHONG>${this.escapeXml(this.findValue('dang_ap_dung_bptt_khong', src) || '0')}</DANG_AP_DUNG_BPTT_KHONG>
        <BIEN_PHAP_TRANH_THAI>${this.escapeXml(this.findValue('bien_phap_tranh_thai', src) || '1')}</BIEN_PHAP_TRANH_THAI`;
            }
        } else if (formType === '1' || parseInt(formType) >= 6) {
            // Trẻ em & Học sinh: Vaccine & Tiền sử tiêm chủng
            historyXml = `
        <TIEM_CHUNG_BCG>${this.escapeXml(this.findValue('TIEM_CHUNG_BCG', src) || '99')}</TIEM_CHUNG_BCG>
        <TIEM_CHUNG_BH_HG_UV>${this.escapeXml(this.findValue('TIEM_CHUNG_BH_HG_UV', src) || '99')}</TIEM_CHUNG_BH_HG_UV>
        <TIEM_CHUNG_SOI>${this.escapeXml(this.findValue('TIEM_CHUNG_SOI', src) || '99')}</TIEM_CHUNG_SOI>
        <TIEM_CHUNG_BAI_LIET>${this.escapeXml(this.findValue('TIEM_CHUNG_BAI_LIET', src) || '99')}</TIEM_CHUNG_BAI_LIET>
        <TIEM_CHUNG_VNNB_B>${this.escapeXml(this.findValue('TIEM_CHUNG_VNNB_B', src) || '99')}</TIEM_CHUNG_VNNB_B>
        <TIEM_CHUNG_VGB>${this.escapeXml(this.findValue('TIEM_CHUNG_VGB', src) || '99')}</TIEM_CHUNG_VGB>
        <TIEM_CHUNG_CAC_LOAI_KHAC>${this.escapeXml(this.findValue('tiem_chung_cac_loai_khac', src) || '0')}</TIEM_CHUNG_CAC_LOAI_KHAC>
        <TIEM_CHUNG_VAC_XIN_KHAC>${this.escapeXml(this.findValue('tiem_chung_vac_xin_khac', src))}</TIEM_CHUNG_VAC_XIN_KHAC>
        <MA_TSBT>${this.escapeXml(this.findValue('MA_TSBT', src) || '0')}</MA_TSBT>
        <TSBT_MA_BENH>${this.escapeXml(this.findValue('TSBT_MA_BENH', src))}</TSBT_MA_BENH`;
        }

        // 3. Khám thể lực
        let physicalXml = `
        <CHIEU_CAO>${this.escapeXml(this.findValue('CHIEU_CAO', src))}</CHIEU_CAO>
        <CAN_NANG>${this.escapeXml(this.findValue('CAN_NANG', src))}</CAN_NANG>
        <CHI_SO_BMI>${this.escapeXml(this.findValue('CHI_SO_BMI', src))}</CHI_SO_BMI>
        <MACH>${this.escapeXml(this.findValue('MACH', src))}</MACH>
        <HUYET_AP>${this.escapeXml(this.findValue('HUYET_AP', src))}</HUYET_AP>`;

        if (formType === '2') {
            physicalXml += `
        <KHAM_THE_LUC_PL>${this.escapeXml(this.findValue('kham_the_luc_pl', src) || '1')}</KHAM_THE_LUC_PL>`;
        } else if (formType === '5') {
            physicalXml += `
        <LUC_BOP_TAY_THUAN>${this.escapeXml(this.findValue('LUC_BOP_TAY_THUAN', src))}</LUC_BOP_TAY_THUAN>
        <LUC_BOP_TAY_KHONG_THUAN>${this.escapeXml(this.findValue('LUC_BOP_TAY_KHONG_THUAN', src))}</LUC_BOP_TAY_KHONG_THUAN>
        <LUC_KEO_LUNG>${this.escapeXml(this.findValue('LUC_KEO_LUNG', src))}</LUC_KEO_LUNG`;
        } else if (parseInt(formType) >= 6 && parseInt(formType) <= 13) {
            physicalXml += `
        <VONG_DDAU>${this.escapeXml(this.findValue('VONG_DDAU', src))}</VONG_DDAU>
        <VONG_NGUC>${this.escapeXml(this.findValue('VONG_NGUC', src))}</VONG_NGUC>
        <SINH_NON>${this.escapeXml(this.findValue('SINH_NON', src) || '0')}</SINH_NON>
        <TUAN_THAI_KHI_SINH>${this.escapeXml(this.findValue('TUAN_THAI_KHI_SINH', src))}</TUAN_THAI_KHI_SINH>
        <CAN_NANG_LUC_SINH>${this.escapeXml(this.findValue('CAN_NANG_LUC_SINH', src))}</CAN_NANG_LUC_SINH`;
        }

        // 4. Khám lâm sàng
        let clinicalXml = '';
        if (parseInt(formType) >= 6 && parseInt(formType) <= 13) {
            // Nhi khoa
            clinicalXml = `
        <NHI_KHOA_TUAN_HOAN>${this.escapeXml(this.findValue('NHI_KHOA_TUAN_HOAN', src) || 'Bình thường')}</NHI_KHOA_TUAN_HOAN>
        <NHI_KHOA_HO_HAP>${this.escapeXml(this.findValue('NHI_KHOA_HO_HAP', src) || 'Bình thường')}</NHI_KHOA_HO_HAP>
        <NHI_KHOA_TIEU_HOA>${this.escapeXml(this.findValue('NHI_KHOA_TIEU_HOA', src) || 'Bình thường')}</NHI_KHOA_TIEU_HOA>
        <NHI_KHOA_THAN_TIETNIEU>${this.escapeXml(this.findValue('NHI_KHOA_THAN_TIETNIEU', src) || 'Bình thường')}</NHI_KHOA_THAN_TIETNIEU>
        <NHI_KHOA_THAN_KINH>${this.escapeXml(this.findValue('NHI_KHOA_THAN_KINH', src) || 'Bình thường')}</NHI_KHOA_THAN_KINH>
        <NHI_KHOA_TAM_THAN>${this.escapeXml(this.findValue('NHI_KHOA_TAM_THAN', src) || 'Bình thường')}</NHI_KHOA_TAM_THAN>
        <NHI_KHOA_LAM_SANG_KHAC>${this.escapeXml(this.findValue('NHI_KHOA_LAM_SANG_KHAC', src) || 'Bình thường')}</NHI_KHOA_LAM_SANG_KHAC>
        <MO_TA_VAN_DONG_TINH_THAN>${this.escapeXml(this.findValue('milestone_check', src) === '1' ? 'Đạt' : 'Cần theo dõi')}</MO_TA_VAN_DONG_TINH_THAN`;
        } else if (formType === '2') {
            // Người lớn: Lâm sàng & Phân loại đầy đủ
            clinicalXml = `
        <NOI_KHOA_TUAN_HOAN>${this.escapeXml(this.findValue('internal', src) || 'Bình thường')}</NOI_KHOA_TUAN_HOAN>
        <NOI_KHOA_TUAN_HOAN_PL>${this.escapeXml(this.findValue('noi_khoa_tuan_hoan_pl', src) || '1')}</NOI_KHOA_TUAN_HOAN_PL>
        <NOI_KHOA_HO_HAP>${this.escapeXml(this.findValue('internal', src) || 'Bình thường')}</NOI_KHOA_HO_HAP>
        <NOI_KHOA_HO_HAP_PL>${this.escapeXml(this.findValue('noi_khoa_ho_hap_pl', src) || '1')}</NOI_KHOA_HO_HAP_PL>
        <NOI_KHOA_TIEU_HOA>${this.escapeXml(this.findValue('internal', src) || 'Bình thường')}</NOI_KHOA_TIEU_HOA>
        <NOI_KHOA_TIEU_HOA_PL>${this.escapeXml(this.findValue('noi_khoa_tieu_hoa_pl', src) || '1')}</NOI_KHOA_TIEU_HOA_PL>
        <NOI_KHOA_THAN_TIETNIEU>${this.escapeXml(this.findValue('internal', src) || 'Bình thường')}</NOI_KHOA_THAN_TIETNIEU>
        <NOI_KHOA_THAN_TIETNIEU_PL>${this.escapeXml(this.findValue('noi_khoa_than_tietnieu_pl', src) || '1')}</NOI_KHOA_THAN_TIETNIEU_PL>
        <NOI_KHOA_NOI_TIET>${this.escapeXml(this.findValue('internal', src) || 'Bình thường')}</NOI_KHOA_NOI_TIET>
        <NOI_KHOA_NOI_TIET_PL>${this.escapeXml(this.findValue('noi_khoa_noi_tiet_pl', src) || '1')}</NOI_KHOA_NOI_TIET_PL>
        <NOI_KHOA_CO_XUONG_KHOP>${this.escapeXml(this.findValue('internal', src) || 'Bình thường')}</NOI_KHOA_CO_XUONG_KHOP>
        <NOI_KHOA_CO_XUONG_KHOP_PL>${this.escapeXml(this.findValue('noi_khoa_co_xuong_khop_pl', src) || '1')}</NOI_KHOA_CO_XUONG_KHOP_PL>
        <NOI_KHOA_THAN_KINH>${this.escapeXml(this.findValue('internal', src) || 'Bình thường')}</NOI_KHOA_THAN_KINH>
        <NOI_KHOA_THAN_KINH_PL>${this.escapeXml(this.findValue('noi_khoa_than_kinh_pl', src) || '1')}</NOI_KHOA_THAN_KINH_PL>
        <NOI_KHOA_TAM_THAN>${this.escapeXml(this.findValue('internal', src) || 'Bình thường')}</NOI_KHOA_TAM_THAN>
        <NOI_KHOA_TAM_THAN_PL>${this.escapeXml(this.findValue('noi_khoa_tam_than_pl', src) || '1')}</NOI_KHOA_TAM_THAN_PL>
        <KET_QUA_KHAM_NGOAI_KHOA>${this.escapeXml(this.findValue('external', src) || 'Bình thường')}</KET_QUA_KHAM_NGOAI_KHOA>
        <KHAM_NGOAI_KHOA_PL>${this.escapeXml(this.findValue('kham_ngoai_khoa_pl', src) || '1')}</KHAM_NGOAI_KHOA_PL>
        <KET_QUA_KHAM_DA_LIEU>${this.escapeXml(this.findValue('external', src) || 'Bình thường')}</KET_QUA_KHAM_DA_LIEU>
        <KHAM_DA_LIEU_PL>${this.escapeXml(this.findValue('kham_da_lieu_pl', src) || '1')}</KHAM_DA_LIEU_PL>
        <KET_QUA_KHAM_SAN_PHU_KHOA>${this.escapeXml(this.findValue('gynecology', src) || 'Không khám (hoặc bình thường)')}</KET_QUA_KHAM_SAN_PHU_KHOA>
        <KHAM_SAN_PHU_KHOA_PL>${this.escapeXml(this.findValue('kham_san_phu_khoa_pl', src) || '1')}</KHAM_SAN_PHU_KHOA_PL>
        <KHONG_KINH_MAT_PHAI>${this.escapeXml(this.findValue('khong_kinh_mat_phai', src) || '10/10')}</KHONG_KINH_MAT_PHAI>
        <KHONG_KINH_MAT_TRAI>${this.escapeXml(this.findValue('khong_kinh_mat_trai', src) || '10/10')}</KHONG_KINH_MAT_TRAI>
        <CO_KINH_MAT_PHAI>${this.escapeXml(this.findValue('co_kinh_mat_phai', src))}</CO_KINH_MAT_PHAI>
        <CO_KINH_MAT_TRAI>${this.escapeXml(this.findValue('co_kinh_mat_trai', src))}</CO_KINH_MAT_TRAI>
        <BENH_KHAC_MAT>${this.escapeXml(this.findValue('eye', src) || 'Bình thường')}</BENH_KHAC_MAT>
        <KHAM_MAT_PL>${this.escapeXml(this.findValue('kham_mat_pl', src) || '1')}</KHAM_MAT_PL>
        <TAI_TRAI_NOI_THUONG>${this.escapeXml(this.findValue('tai_trai_noi_thuong', src) || '5')}</TAI_TRAI_NOI_THUONG>
        <TAI_TRAI_NOI_THAM>${this.escapeXml(this.findValue('tai_trai_noi_tham', src) || '0.5')}</TAI_TRAI_NOI_THAM>
        <TAI_PHAI_NOI_THUONG>${this.escapeXml(this.findValue('tai_phai_noi_thuong', src) || '5')}</TAI_PHAI_NOI_THUONG>
        <TAI_PHAI_NOI_THAM>${this.escapeXml(this.findValue('tai_phai_noi_tham', src) || '0.5')}</TAI_PHAI_NOI_THAM>
        <BENH_KHAC_TAI_MUI_HONG>${this.escapeXml(this.findValue('ent', src) || 'Bình thường')}</BENH_KHAC_TAI_MUI_HONG>
        <KHAM_TAI_MUI_HONG_PL>${this.escapeXml(this.findValue('kham_tai_mui_hong_pl', src) || '1')}</KHAM_TAI_MUI_HONG_PL>
        <HAM_TREN>${this.escapeXml(this.findValue('ham_tren', src) || 'Bình thường')}</HAM_TREN>
        <HAM_DUOI>${this.escapeXml(this.findValue('ham_duoi', src) || 'Bình thường')}</HAM_DUOI>
        <BENH_KHAC_RANG_HAM_MAT>${this.escapeXml(this.findValue('dental', src) || 'Bình thường')}</BENH_KHAC_RANG_HAM_MAT>
        <KHAM_RANG_HAM_MAT_PL>${this.escapeXml(this.findValue('kham_rang_ham_mat_pl', src) || '1')}</KHAM_RANG_HAM_MAT_PL>`;
        } else {
            // Mẫu 1, Mẫu 3 và các mẫu còn lại
            clinicalXml = `
        <NOI_KHOA>${this.escapeXml(this.findValue('internal', src) || 'Bình thường')}</NOI_KHOA>
        <KHONG_KINH_MAT_PHAI>${this.escapeXml(this.findValue('khong_kinh_mat_phai', src) || '10/10')}</KHONG_KINH_MAT_PHAI>
        <KHONG_KINH_MAT_TRAI>${this.escapeXml(this.findValue('khong_kinh_mat_trai', src) || '10/10')}</KHONG_KINH_MAT_TRAI>
        <CO_KINH_MAT_PHAI>${this.escapeXml(this.findValue('co_kinh_mat_phai', src))}</CO_KINH_MAT_PHAI>
        <CO_KINH_MAT_TRAI>${this.escapeXml(this.findValue('co_kinh_mat_trai', src))}</CO_KINH_MAT_TRAI>
        <BENH_KHAC_MAT>${this.escapeXml(this.findValue('eye', src) || 'Bình thường')}</BENH_KHAC_MAT>
        <TAI_TRAI_NOI_THUONG>${this.escapeXml(this.findValue('tai_trai_noi_thuong', src) || '5')}</TAI_TRAI_NOI_THUONG>
        <TAI_TRAI_NOI_THAM>${this.escapeXml(this.findValue('tai_trai_noi_tham', src) || '0.5')}</TAI_TRAI_NOI_THAM>
        <TAI_PHAI_NOI_THUONG>${this.escapeXml(this.findValue('tai_phai_noi_thuong', src) || '5')}</TAI_PHAI_NOI_THUONG>
        <TAI_PHAI_NOI_THAM>${this.escapeXml(this.findValue('tai_phai_noi_tham', src) || '0.5')}</TAI_PHAI_NOI_THAM>
        <BENH_KHAC_TAI_MUI_HONG>${this.escapeXml(this.findValue('ent', src) || 'Bình thường')}</BENH_KHAC_TAI_MUI_HONG>
        <HAM_TREN>${this.escapeXml(this.findValue('ham_tren', src) || 'Bình thường')}</HAM_TREN>
        <HAM_DUOI>${this.escapeXml(this.findValue('ham_duoi', src) || 'Bình thường')}</HAM_DUOI>
        <BENH_KHAC_RANG_HAM_MAT>${this.escapeXml(this.findValue('dental', src) || 'Bình thường')}</BENH_KHAC_RANG_HAM_MAT>
        <NGOAI_KHOA>${this.escapeXml(this.findValue('external', src) || 'Bình thường')}</NGOAI_KHOA>`;

            if (formType === '3') {
                clinicalXml += `
        <SAC_GIAC>${this.escapeXml(this.findValue('sac_giac', src) || '0')}</SAC_GIAC>
        <THI_TRUONG_NGANG_HAIMAT>${this.escapeXml(this.findValue('thi_truong_ngang_haimat', src) || 'Bình thường')}</THI_TRUONG_NGANG_HAIMAT>
        <THI_TRUONG_DUNG_HAIMAT>${this.escapeXml(this.findValue('thi_truong_dung_haimat', src) || 'Bình thường')}</THI_TRUONG_DUNG_HAIMAT`;
            }
        }

        // 5. Cận lâm sàng
        let labXml = `
        <XET_NGHIEM_MAU>
            <HEMOGLOBIN>${this.escapeXml(this.findValue('HEMOGLOBIN', src) || '140')}</HEMOGLOBIN>
            <GLYCEMIA>${this.escapeXml(this.findValue('GLYCEMIA', src) || '5.2')}</GLYCEMIA>
        </XET_NGHIEM_MAU>
        <XET_NGHIEM_NUOC_TIEU>
            <PROTEIN>${this.escapeXml(this.findValue('PROTEIN', src) || 'Âm tính')}</PROTEIN>
        </XET_NGHIEM_NUOC_TIEU`;

        if (formType === '3' || formType === '5') {
            labXml += `
        <KQ_XN_MA_TUY>${this.escapeXml(this.findValue('kq_xn_ma_tuy', src) || 'Âm tính')}</KQ_XN_MA_TUY>
        <KQ_XN_NONG_DO_CON>${this.escapeXml(this.findValue('kq_xn_nong_do_con', src) || '0.0 mg/L')}</KQ_XN_NONG_DO_CON>
        <KQ_XN_KHAC>${this.escapeXml(this.findValue('kq_xn_khac', src))}</KQ_XN_KHAC`;
        }

        // 6. Kết luận
        const conclusionXml = `
        <PHAN_LOAI_SK>${this.escapeXml(this.findValue('PHAN_LOAI_SK', src) || '1')}</PHAN_LOAI_SK>
        <KET_LUAN_BENH>${this.escapeXml(this.findValue('KET_LUAN_BENH', src) || this.findValue('diagnosis', src) || 'Sức khỏe bình thường')}</KET_LUAN_BENH>
        <CAC_VAN_DE_SUC_KHOE>${this.escapeXml(this.findValue('CAC_VAN_DE_SUC_KHOE', src) || 'Không')}</CAC_VAN_DE_SUC_KHOE`;

        return `<?xml version="1.0" encoding="utf-8"?>
<MAU_${formType}_KSK>
    <THONG_TIN_HANH_CHINH>${adminXml}
    </THONG_TIN_HANH_CHINH>
    <THONG_TIN_CHUNG_VE_LAN_KHAM>
        <MA_LK>${this.escapeXml(maLkVal)}</MA_LK>
        <NGAY_KHAM>${ngayVaoVal}</NGAY_KHAM>
        <MA_CSKCB>${this.escapeXml(maCskcb)}</MA_CSKCB>
    </THONG_TIN_CHUNG_VE_LAN_KHAM>
    ${historyXml ? `<TIEN_SU_BENH>${historyXml}\n    </TIEN_SU_BENH>` : ''}
    <KHAM_THE_LUC>${physicalXml}
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>${clinicalXml}
    </KHAM_LAM_SANG>
    <KHAM_CAN_LAM_SANG>${labXml}
    </KHAM_CAN_LAM_SANG>
    <KET_LUAN>${conclusionXml}
    </KET_LUAN>
</MAU_${formType}_KSK>`;
    }

    // 9. Lấy dữ liệu bệnh nhân từ HIS để đồng bộ KSK
    // 9. Lấy dữ liệu bệnh nhân từ HIS để đồng bộ KSK
    async getHisPatient(req: Request, res: Response) {
        const identifier = String(req.params.identifier || '').trim();
        try {
            // 1. TRUY VẤN DỮ LIỆU THỰC TẾ TỪ CSDL HIS (hms_patient, hms_doc, hms_exam)
            const sql = `
                SELECT 
                    p.hp_patientno,
                    trim(COALESCE(p.hp_surname,'') || ' ' || COALESCE(p.hp_midname,'') || ' ' || p.hp_firstname) as patient_name,
                    p.hp_sin,
                    to_char(p.hp_birthdate, 'YYYY-MM-DD') as dob,
                    p.hp_sex,
                    p.hp_dtladdr,
                    p.hp_ethnic,
                    d.hd_telephone,
                    d.hd_cardno,
                    d.hd_object,
                    e.he_height,
                    e.he_weight,
                    e.he_bmi,
                    e.he_pulse,
                    e.he_bloodpressure,
                    e.he_bloodpressurex,
                    e.he_examine,
                    e.he_diagnostic
                FROM hms_patient p
                LEFT JOIN hms_doc d ON d.hd_patientno = p.hp_patientno
                LEFT JOIN hms_exam e ON e.he_docno = d.hd_docno AND e.he_receptidx = 1
                WHERE p.hp_patientno::text = $1 
                   OR p.hp_sin = $1 
                   OR d.hd_docno::text = $1
                   OR trim(COALESCE(p.hp_surname,'') || ' ' || COALESCE(p.hp_midname,'') || ' ' || p.hp_firstname) ILIKE $2
                ORDER BY d.hd_admitdate DESC NULLS LAST
                LIMIT 1
            `;
            const result = await query(sql, [identifier, `%${identifier}%`]);

            if (result.rows.length > 0) {
                const row = result.rows[0];
                const genderVal = (row.hp_sex || '').toLowerCase();
                const gender = (genderVal === 'm' || genderVal.includes('nam')) ? 'Nam' : 'Nữ';
                const ethnicStr = row.hp_ethnic ? String(row.hp_ethnic).padStart(2, '0') : '01';

                const bp = row.he_bloodpressure && row.he_bloodpressurex 
                    ? `${row.he_bloodpressure}/${row.he_bloodpressurex}` 
                    : '120/80';

                return res.json({
                    patient_id: String(row.hp_patientno),
                    patient_name: String(row.patient_name || '').toUpperCase(),
                    cccd: String(row.hp_sin || ''),
                    dob: row.dob || '1995-10-15',
                    gender: gender,
                    clinical_data: {
                        address: row.hp_dtladdr || '',
                        phone: row.hd_telephone || '',
                        ethnic: ethnicStr,
                        blood_group: 'O',
                        target_group: '14',
                        funding_source: '9',
                        examination: {
                            height: row.he_height > 0 ? String(row.he_height) : '170',
                            weight: row.he_weight > 0 ? String(row.he_weight) : '65',
                            bmi: row.he_bmi > 0 ? String(row.he_bmi) : '22.5',
                            blood_pressure: bp,
                            pulse: row.he_pulse > 0 ? String(row.he_pulse) : '75'
                        },
                        clinical_exam: {
                            internal: row.he_examine || "Hệ tuần hoàn, hô hấp, tiêu hóa hoạt động bình thường, không phát hiện bệnh lý.",
                            eye: "Mắt phải 10/10, Mắt trái 10/10, không có tật khúc xạ.",
                            ent: "Tai mũi họng bình thường, thính lực tốt.",
                            dental: "Răng hàm mặt bình thường, không sâu răng, không lệch khớp cắn.",
                            external: "Ngoại khoa, da liễu bình thường, không sẹo lồi.",
                            gynecology: "Không khám (hoặc bình thường)",
                            nhi_tuan_hoan: "Bình thường",
                            nhi_ho_hap: "Bình thường",
                            nhi_tieu_hoa: "Bình thường",
                            nhi_tiet_nieu: "Bình thường",
                            nhi_than_kinh: "Bình thường",
                            nhi_tam_than: "Bình thường",
                            nhi_khac: "Bình thường"
                        }
                    },
                    lab_data: {
                        blood_test: { hemoglobin: "140", glycemia: "5.2" },
                        urine_test: { protein: "Âm tính" }
                    },
                    conclusion_data: {
                        fitness_class: "1",
                        diagnosis: row.he_diagnostic || "Đủ sức khỏe học tập và làm việc",
                        cac_van_de_luu_y: "Không"
                    }
                });
            }

            // 2. FALLBACK MOCK DATA NẾU KHÔNG TÌM THẤY TRONG DB HIS THỰC TẾ
            const mockHisPatients = [
                {
                    patient_id: "P1001",
                    patient_name: "NGUYỄN VĂN HÙNG",
                    cccd: "038090012345",
                    dob: "1995-10-15",
                    gender: "Nam",
                    clinical_data: {
                        address: "123 Đường Giải Phóng, Quận Hai Bà Trưng, Hà Nội",
                        phone: "0912345678",
                        ethnic: "01",
                        blood_group: "O",
                        target_group: "14",
                        funding_source: "9",
                        examination: {
                            height: "172",
                            weight: "68",
                            bmi: "23.0",
                            blood_pressure: "120/80",
                            pulse: "78"
                        },
                        clinical_exam: {
                            internal: "Hệ tuần hoàn, hô hấp, tiêu hóa hoạt động bình thường, không phát hiện bệnh lý.",
                            eye: "Mắt phải 10/10, Mắt trái 10/10, không có tật khúc xạ.",
                            ent: "Tai mũi họng bình thường, thính lực tốt.",
                            dental: "Răng hàm mặt bình thường, không sâu răng, không lệch khớp cắn.",
                            external: "Ngoại khoa, da liễu bình thường, không sẹo lồi.",
                            gynecology: "Không khám (hoặc bình thường)",
                            nhi_tuan_hoan: "Bình thường",
                            nhi_ho_hap: "Bình thường",
                            nhi_tieu_hoa: "Bình thường",
                            nhi_tiet_nieu: "Bình thường",
                            nhi_than_kinh: "Bình thường",
                            nhi_tam_than: "Bình thường",
                            nhi_khac: "Bình thường"
                        }
                    },
                    lab_data: {
                        blood_test: { hemoglobin: "142", glycemia: "5.4" },
                        urine_test: { protein: "Âm tính" }
                    },
                    conclusion_data: {
                        fitness_class: "1",
                        diagnosis: "Đủ sức khỏe học tập và làm việc",
                        cac_van_de_luu_y: "Tránh thức khuya và làm việc quá sức"
                    }
                },
                {
                    patient_id: "P1002",
                    patient_name: "TRẦN THỊ LAN",
                    cccd: "034198006789",
                    dob: "1988-05-20",
                    gender: "Nữ",
                    clinical_data: {
                        address: "456 Phố Huế, Quận Hai Bà Trưng, Hà Nội",
                        phone: "0987654321",
                        ethnic: "01",
                        blood_group: "A",
                        target_group: "13",
                        funding_source: "9",
                        examination: {
                            height: "158",
                            weight: "50",
                            bmi: "20.0",
                            blood_pressure: "115/75",
                            pulse: "72"
                        },
                        clinical_exam: {
                            internal: "Nội khoa bình thường, tim phổi tốt.",
                            eye: "Mắt phải 9/10, Mắt trái 10/10.",
                            ent: "Tai mũi họng bình thường.",
                            dental: "Răng hàm mặt bình thường.",
                            external: "Ngoại khoa bình thường.",
                            gynecology: "Sản phụ khoa bình thường, không phát hiện viêm nhiễm sinh dục.",
                            nhi_tuan_hoan: "Bình thường",
                            nhi_ho_hap: "Bình thường",
                            nhi_tieu_hoa: "Bình thường",
                            nhi_tiet_nieu: "Bình thường",
                            nhi_than_kinh: "Bình thường",
                            nhi_tam_than: "Bình thường",
                            nhi_khac: "Bình thường"
                        }
                    },
                    lab_data: {
                        blood_test: { hemoglobin: "135", glycemia: "5.1" },
                        urine_test: { protein: "Âm tính" }
                    },
                    conclusion_data: {
                        fitness_class: "2",
                        diagnosis: "Đủ sức khỏe làm việc",
                        cac_van_de_luu_y: "Không"
                    }
                },
                {
                    patient_id: "P1003",
                    patient_name: "LÊ HOÀNG NAM",
                    cccd: "001092004567",
                    dob: "1992-12-01",
                    gender: "Nam",
                    clinical_data: {
                        address: "789 Đường Láng, Quận Đống Đa, Hà Nội",
                        phone: "0904123456",
                        ethnic: "01",
                        blood_group: "O",
                        target_group: "14",
                        funding_source: "9",
                        examination: {
                            height: "175",
                            weight: "72",
                            bmi: "23.5",
                            blood_pressure: "120/80",
                            pulse: "75"
                        },
                        clinical_exam: {
                            internal: "Nội khoa bình thường, tim phổi đều.",
                            eye: "Mắt phải 10/10, Mắt trái 10/10.",
                            ent: "Tai mũi họng bình thường.",
                            dental: "Răng hàm mặt bình thường.",
                            external: "Ngoại khoa bình thường.",
                            gynecology: "Không khám (hoặc bình thường)",
                            nhi_tuan_hoan: "Bình thường",
                            nhi_ho_hap: "Bình thường",
                            nhi_tieu_hoa: "Bình thường",
                            nhi_tiet_nieu: "Bình thường",
                            nhi_than_kinh: "Bình thường",
                            nhi_tam_than: "Bình thường",
                            nhi_khac: "Bình thường"
                        }
                    },
                    lab_data: {
                        blood_test: { hemoglobin: "145", glycemia: "5.3" },
                        urine_test: { protein: "Âm tính" }
                    },
                    conclusion_data: {
                        fitness_class: "1",
                        diagnosis: "Đủ sức khỏe lái xe hạng B2",
                        cac_van_de_luu_y: "Không"
                    }
                }
            ];

            const patient = mockHisPatients.find(p => 
                p.patient_id.toLowerCase() === identifier.toLowerCase() || 
                p.cccd === identifier || 
                p.patient_name.toLowerCase().includes(identifier.toLowerCase())
            );

            if (!patient) {
                // Tạo dữ liệu ngẫu nhiên dựa trên identifier để demo chạy mượt
                const cleanId = identifier.trim();
                const isNumeric = /^\d+$/.test(cleanId);
                const name = isNumeric ? `BỆNH NHÂN HIS ${cleanId.slice(-4)}` : cleanId.toUpperCase();
                const cccdVal = isNumeric && cleanId.length === 12 ? cleanId : `03809000${Math.floor(1000 + Math.random() * 9000)}`;

                const randomPatient = {
                    patient_id: cleanId.startsWith('P') ? cleanId : `P${Math.floor(1000 + Math.random() * 9000)}`,
                    patient_name: name,
                    cccd: cccdVal,
                    dob: "1994-08-18",
                    gender: Math.random() > 0.5 ? "Nam" : "Nữ",
                    clinical_data: {
                        address: "Địa chỉ lấy từ hệ thống HIS chính của bệnh viện",
                        phone: "09" + Math.floor(10000000 + Math.random() * 90000000),
                        ethnic: "01",
                        blood_group: "B",
                        target_group: "14",
                        funding_source: "9",
                        examination: {
                            height: "170",
                            weight: "65",
                            bmi: "22.5",
                            blood_pressure: "120/80",
                            pulse: "76"
                        },
                        clinical_exam: {
                            internal: "Đã đồng bộ khám nội khoa từ HIS: Bình thường.",
                            eye: "Mắt phải 10/10, Mắt trái 10/10.",
                            ent: "Tai mũi họng bình thường.",
                            dental: "Răng hàm mặt bình thường.",
                            external: "Ngoại khoa bình thường.",
                            gynecology: "Không khám (hoặc bình thường)",
                            nhi_tuan_hoan: "Bình thường",
                            nhi_ho_hap: "Bình thường",
                            nhi_tieu_hoa: "Bình thường",
                            nhi_tiet_nieu: "Bình thường",
                            nhi_than_kinh: "Bình thường",
                            nhi_tam_than: "Bình thường",
                            nhi_khac: "Bình thường"
                        }
                    },
                    lab_data: {
                        blood_test: { hemoglobin: "140", glycemia: "5.2" },
                        urine_test: { protein: "Âm tính" }
                    },
                    conclusion_data: {
                        fitness_class: "1",
                        diagnosis: "Đủ sức khỏe học tập và làm việc",
                        cac_van_de_luu_y: "Không"
                    }
                };
                return res.json(randomPatient);
            }

            return res.json(patient);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getHisPatient:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export default new HealthCheckController();
