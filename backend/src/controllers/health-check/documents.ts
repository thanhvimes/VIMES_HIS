import { Request, Response } from 'express';
import { query, transaction } from '../../config/database';
import { getHealthCheckSettings } from '../../config/health-check-settings';
import { generateXmlPayload } from './xml-generator';
import { validateNewHealthCheckDocument } from '../../services/health-check-new-document-validation';
import { mergeClinicalData, mergeLabData, mergeConclusionData, formatYmdString } from '../../services/health-check-merge.service';
import { hisIntegrationController } from './his-integration';

class DocumentsController {
    
    // Helper to enrich paraclinical items with metadata from hms_fee_list
    private async enrichDocumentsMetadata(documents: any[]) {
        if (!Array.isArray(documents) || documents.length === 0) return;
        
        // Luôn đảm bảo các trường JSON (clinical_data, lab_data, conclusion_data) là object trước khi xử lý và trả về API
        for (const doc of documents) {
            if (doc) {
                if (typeof doc.clinical_data === 'string') {
                    try { doc.clinical_data = JSON.parse(doc.clinical_data); } catch { doc.clinical_data = {}; }
                }
                if (typeof doc.lab_data === 'string') {
                    try { doc.lab_data = JSON.parse(doc.lab_data); } catch { doc.lab_data = {}; }
                }
                if (typeof doc.conclusion_data === 'string') {
                    try { doc.conclusion_data = JSON.parse(doc.conclusion_data); } catch { doc.conclusion_data = {}; }
                }
            }
        }

        const serviceCodesSet = new Set<string>();
        for (const doc of documents) {
            if (doc && doc.lab_data && doc.lab_data.paraclinical_items && Array.isArray(doc.lab_data.paraclinical_items)) {
                for (const item of doc.lab_data.paraclinical_items) {
                    const code = item?.service_code || item?.code;
                    if (code) {
                        serviceCodesSet.add(String(code).trim());
                    }
                }
            }
        }
        
        const serviceCodes = Array.from(serviceCodesSet).filter(Boolean);
        if (serviceCodes.length === 0) return;
        
        try {
            const feeMetadataRes = await query(`
                SELECT TRIM(f.hfl_feeid) AS service_code, 
                       TRIM(COALESCE(p.hfl_regcode, f.hfl_regcode, f.hfl_feeid)) AS reg_code,
                       TRIM(COALESCE(f.hfl_ma_chi_so, p.hfl_ma_chi_so, p.hfl_regcode, f.hfl_regcode, f.hfl_feeid)) AS ma_chi_so,
                       TRIM(COALESCE(f.hfl_ma_chi_so, p.hfl_ma_chi_so, '')) AS hfl_ma_chi_so,
                       f.hfl_name AS service_name,
                       f.hfl_unit AS unit,
                       f.hfl_line AS line_no, 
                       TRIM(f.hfl_subitem) AS subitem,
                       p.hfl_name AS parent_name,
                       TRIM(p.hfl_feeid) AS parent_code,
                       COALESCE(p.hfl_line, f.hfl_line) AS parent_line
                FROM hms_fee_list f
                LEFT JOIN hms_fee_list p ON p.hfl_feeid = f.hfl_subitem AND UPPER(TRIM(f.hfl_subitem)) <> 'Y'
                WHERE TRIM(f.hfl_feeid) = ANY($1)
            `, [serviceCodes]);

            const metadataMap = new Map<string, any>();
            for (const row of feeMetadataRes.rows) {
                metadataMap.set(row.service_code, row);
            }

            for (const doc of documents) {
                if (doc && doc.lab_data && doc.lab_data.paraclinical_items && Array.isArray(doc.lab_data.paraclinical_items)) {
                    for (const item of doc.lab_data.paraclinical_items) {
                        if (item) {
                            const code = String(item.service_code || item.code || '').trim();
                            const meta = metadataMap.get(code);
                            if (meta) {
                                item.reg_code = meta.reg_code || item.reg_code || item.service_code;
                                item.ma_chi_so = meta.ma_chi_so || item.ma_chi_so || meta.reg_code || item.service_code;
                                item.hfl_ma_chi_so = meta.hfl_ma_chi_so || meta.ma_chi_so || item.hfl_ma_chi_so;
                                item.service_name = item.service_name || meta.service_name || '';
                                item.index_name = item.index_name || meta.service_name || item.service_name || '';
                                if (!item.unit || item.unit.toLowerCase() === 'lần') {
                                    if (meta.unit && meta.unit.toLowerCase() !== 'lần') {
                                        item.unit = meta.unit;
                                    }
                                }
                                item.line_no = meta.line_no;
                                item.subitem = meta.subitem;
                                item.parent_name = meta.parent_name || '';
                                item.parent_code = meta.parent_code || '';
                                item.parent_line = meta.parent_line;
                            }
                        }
                    }
                }
            }
        } catch (enrichErr) {
            console.error('❌ KSK Controller: Lỗi trong enrichDocumentsMetadata:', enrichErr);
        }

        // Tự động sinh XML nếu hồ sơ chưa có xml_data hoặc xml_data cũ bị lỗi/chưa theo chuẩn mới
        for (const doc of documents) {
            const xmlStr = String(doc?.xml_data || '');
            const isInvalidOrLegacyXml = !xmlStr.trim() 
                || !xmlStr.includes('XML9') 
                || !xmlStr.includes('TIEN_SU_BENH_TAT')
                || xmlStr.includes('<SOLUONGHOSO>8</SOLUONGHOSO>')
                || xmlStr.includes('<SOLUONGHOSO>7</SOLUONGHOSO>')
                || xmlStr.includes('<LOAIHOSO>XML3</LOAIHOSO>')
                || (xmlStr.includes('<KHAM_CAN_LAM_SANG>') && !xmlStr.includes('<DANH_SACH_CLS>'));

            if (doc && isInvalidOrLegacyXml && doc.signature_status !== 'Signed') {
                try {
                    const freshXml = generateXmlPayload(
                        doc.form_type || '3',
                        doc,
                        doc.clinical_data || {},
                        doc.lab_data || {},
                        doc.conclusion_data || {}
                    );
                    doc.xml_data = freshXml;
                    if (doc.id) {
                        query('UPDATE health_check_masters SET xml_data = $1 WHERE id = $2', [freshXml, doc.id]).catch(() => {});
                    }
                } catch (xmlErr) {
                    console.warn('⚠️ [enrichDocumentsMetadata] Cannot generate fallback XML for doc:', doc.id, xmlErr);
                }
            }
        }
    }

    // Helper to pushback both test results and PACS (HA/TD) results back to HIS tables safely
    private async pushbackTestAndPacsResults(client: any, hisDocNo: number, paraclinicalItems: any[], clinicalData: any) {
        if (!Array.isArray(paraclinicalItems) || paraclinicalItems.length === 0) return;
        
        const specialtyMetadata = clinicalData?.clinical_exam?.specialty_metadata || {};
        const labDoctorId = specialtyMetadata.lab?.doctorId || 'admin';

        // Fetch doctor department from sys_user
        let deptId = 'CLS';
        if (labDoctorId) {
            try {
                const userRes = await client.query(`SELECT su_deptid FROM sys_user WHERE su_userid = $1`, [labDoctorId]);
                if (userRes.rows.length > 0 && userRes.rows[0].su_deptid) {
                    deptId = userRes.rows[0].su_deptid;
                }
            } catch (userErr) {
                console.warn('[HIS pushback] Failed to fetch su_deptid for:', labDoctorId, userErr);
            }
        }

        for (const item of paraclinicalItems) {
            const code = item.service_code;
            const orderId = item.order_id ? parseInt(item.order_id) : null;
            const val = String(item.value || '').trim();
            const conclusion = String(item.conclusion || '').trim();
            const description = String(item.description || '').trim();

            // Safety: Skip if all result fields are empty (do not overwrite HIS with blank values)
            if (!val && !conclusion && !description) {
                continue;
            }

            if (item.type === 'XN' && code) {
                try {
                    // Check order line existence and check if status is 'O' or 'S'
                    const statusCheck = await client.query(`
                        SELECT 1 FROM hms_testorderline l
                        JOIN hms_testorder o ON o.hpc_orderid = l.hpcl_orderid
                        WHERE l.hpcl_docno = $1 AND l.hpcl_itemid = $2
                          AND o.hpc_status IN ('O', 'S') AND l.hpcl_status IN ('O', 'S')
                    `, [hisDocNo, code]);

                    if (statusCheck.rows.length > 0) {
                        // Cập nhật kết quả xét nghiệm về hms_testorderline
                        await client.query(`
                            UPDATE hms_testorderline
                            SET hpcl_result = $1
                            WHERE hpcl_docno = $2 AND hpcl_itemid = $3
                        `, [val, hisDocNo, code]);
                    }
                } catch (pushErr) {
                    console.error(`❌ [LIMS pushback] Failed pushing item ${code} for docNo ${hisDocNo}:`, pushErr);
                }
            } else if ((item.type === 'HA' || item.type === 'TD') && orderId && code) {
                try {
                    // Check order line existence and check if status is 'O' or 'S'
                    const statusCheck = await client.query(`
                        SELECT l.hpcl_proomid FROM hms_pacsorderline l
                        JOIN hms_pacsorder o ON o.hpc_orderid = l.hpcl_orderid
                        WHERE o.hpc_orderid = $1 AND l.hpcl_itemid = $2
                          AND o.hpc_status IN ('O', 'S') AND l.hpcl_status IN ('O', 'S')
                    `, [orderId, code]);

                    if (statusCheck.rows.length > 0) {
                        const roomId = statusCheck.rows[0].hpcl_proomid || 0;

                        // A. Lookup form layout ID from hms_fee_list
                        const feeRes = await client.query(`SELECT hfl_index1 FROM hms_fee_list WHERE hfl_feeid = $1`, [code]);
                        const formLayoutId = feeRes.rows.length > 0 ? (feeRes.rows[0].hfl_index1 || 'StandardPACS') : 'StandardPACS';

                        // B. Delete and insert conclusion
                        const finalConclusion = conclusion || val || '';
                        await client.query(`DELETE FROM hms_pacs_result WHERE hpr_orderid = $1 AND hpr_itemid = $2 AND LOWER(hpr_name) = 'conclusion'`, [orderId, code]);
                        await client.query(`
                            INSERT INTO hms_pacs_result (hpr_docno, hpr_orderid, hpr_itemid, hpr_name, hpr_desc)
                            VALUES ($1, $2, $3, 'conclusion', $4)
                        `, [hisDocNo, orderId, code, finalConclusion]);

                        // C. Delete and insert remark (description) if present
                        if (item.description !== undefined) {
                            await client.query(`DELETE FROM hms_pacs_result WHERE hpr_orderid = $1 AND hpr_itemid = $2 AND LOWER(hpr_name) = 'remark'`, [orderId, code]);
                            await client.query(`
                                INSERT INTO hms_pacs_result (hpr_docno, hpr_orderid, hpr_itemid, hpr_name, hpr_desc)
                                VALUES ($1, $2, $3, 'remark', $4)
                            `, [hisDocNo, orderId, code, description]);
                        }

                        // D. Update hms_pacsorderline to status 'T'
                        await client.query(`
                            UPDATE hms_pacsorderline
                            SET hpcl_result = $1,
                                hpcl_practitioner = $2,
                                hpcl_approvalby = $3,
                                hpcl_status = 'T',
                                hpcl_date = NOW(),
                                hpcl_startdate = COALESCE(hpcl_startdate, NOW()),
                                hpcl_perform_deptid = $4,
                                hpcl_proomid = $5
                            WHERE hpcl_orderid = $6 AND hpcl_itemid = $7
                        `, [formLayoutId, labDoctorId, labDoctorId, deptId, roomId, orderId, code]);

                        // E. Update hms_pacsorder to status 'T'
                        await client.query(`
                            UPDATE hms_pacsorder
                            SET hpc_pdeptid = $1,
                                hpc_proomid = $2,
                                hpc_performdate = NOW(),
                                hpc_startdate = COALESCE(hpc_startdate, NOW()),
                                hpc_practitioner = $3,
                                hpc_approvalby = $4,
                                hpc_status = 'T'
                            WHERE hpc_orderid = $5
                        `, [deptId, roomId, labDoctorId, labDoctorId, orderId]);
                        
                        console.log(`[PACS pushback] Successfully pushed results for order ${orderId}, item ${code} back to HIS.`);
                    }
                } catch (pushErr) {
                    console.error(`❌ [PACS pushback] Failed pushing item ${code} for order ${orderId}:`, pushErr);
                }
            }
        }
    }

    // 1. Lấy danh sách hồ sơ (kèm phân trang, lọc nâng cao)
    // 1. Lấy danh sách hồ sơ (kèm phân trang, lọc nâng cao)
    async getDocuments(req: Request, res: Response) {
        try {
            const { 
                status, 
                signatureStatus, 
                searchTerm, 
                formType, 
                limit, 
                page, 
                startDate, 
                endDate, 
                barcodePrinted, 
                contractId,
                examStatus
            } = req.query;

            let sql = `
                SELECT m.*, 
                       COALESCE(m.created_by_name, u.su_name, m.created_by, 'Nhân viên tiếp đón') AS created_by_name,
                       d.clinical_data, d.lab_data, d.conclusion_data 
                FROM health_check_masters m
                LEFT JOIN sys_user u ON u.su_userid = m.created_by
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
                if (status === 'Unsent') {
                    sql += ` AND (m.send_status IS NULL OR m.send_status NOT IN ('Success', 'Pending'))`;
                } else {
                    sql += ` AND m.send_status = $${paramIndex}`;
                    params.push(status);
                    paramIndex++;
                }
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

            if (startDate && String(startDate).length === 10) {
                sql += ` AND m.created_at >= $${paramIndex}::timestamp`;
                params.push(`${startDate} 00:00:00`);
                paramIndex++;
            }

            if (endDate && String(endDate).length === 10) {
                sql += ` AND m.created_at <= $${paramIndex}::timestamp`;
                params.push(`${endDate} 23:59:59`);
                paramIndex++;
            }

            if (barcodePrinted && barcodePrinted !== 'All') {
                sql += ` AND m.barcode_printed = $${paramIndex}`;
                params.push(barcodePrinted);
                paramIndex++;
            }

            if (contractId && contractId !== 'All') {
                const parsedContractId = parseInt(String(contractId), 10);
                if (!isNaN(parsedContractId)) {
                    sql += ` AND m.his_contract_id = $${paramIndex}`;
                    params.push(parsedContractId);
                    paramIndex++;
                }
            }

            if (examStatus && examStatus !== 'All') {
                if (examStatus === 'Done') {
                    sql += ` AND ((d.conclusion_data->>'fitness_class' IS NOT NULL AND TRIM(d.conclusion_data->>'fitness_class') <> '') OR (d.conclusion_data->>'ket_luan_loai_suc_khoe' IS NOT NULL AND TRIM(d.conclusion_data->>'ket_luan_loai_suc_khoe') <> '') OR (d.conclusion_data->>'diagnosis' IS NOT NULL AND TRIM(d.conclusion_data->>'diagnosis') <> ''))`;
                } else if (examStatus === 'InProgress') {
                    sql += ` AND ((d.conclusion_data->>'fitness_class' IS NULL OR TRIM(d.conclusion_data->>'fitness_class') = '') AND (d.conclusion_data->>'ket_luan_loai_suc_khoe' IS NULL OR TRIM(d.conclusion_data->>'ket_luan_loai_suc_khoe') = '') AND (d.conclusion_data->>'diagnosis' IS NULL OR TRIM(d.conclusion_data->>'diagnosis') = ''))`;
                }
            }

            // Calculate total matching records count
            const countSql = `SELECT COUNT(*) FROM (${sql}) AS count_query`;
            const countRes = await query(countSql, params);
            const totalCount = parseInt(countRes.rows[0]?.count || '0', 10);

            // Dynamic limit & page calculation
            let queryLimit = 500; // default 500 records instead of 100
            if (limit) {
                if (String(limit).toLowerCase() === 'all') {
                    queryLimit = 100000;
                } else {
                    const parsedLimit = parseInt(String(limit), 10);
                    if (!isNaN(parsedLimit) && parsedLimit > 0) {
                        queryLimit = Math.min(parsedLimit, 100000);
                    }
                }
            }

            const queryPage = page ? Math.max(1, parseInt(String(page), 10) || 1) : 1;
            const offset = (queryPage - 1) * queryLimit;

            sql += ` ORDER BY m.id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(queryLimit, offset);

            const result = await query(sql, params);
            await this.enrichDocumentsMetadata(result.rows);

            res.setHeader('X-Total-Count', totalCount.toString());
            res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
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
                LEFT JOIN health_check_details d ON m.id = d.master_id
                WHERE m.id = $1
            `;
            const result = await query(sql, [parseInt(id)]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Không tìm thấy hồ sơ KSK" });
            }

            const doc = result.rows[0];
            await this.enrichDocumentsMetadata([doc]);
            return res.json(doc);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getDocumentById:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 3. Tạo mới hồ sơ khám sức khỏe (Master-Detail)
    async createDocument(req: Request, res: Response) {
        const patientId = req.body.patientId || req.body.patient_id;
        const patientName = req.body.patientName || req.body.patient_name;
        const cccd = req.body.cccd;
        const dob = req.body.dob;
        const gender = req.body.gender;
        const docNo = req.body.docNo || req.body.doc_no;
        const formType = req.body.formType || req.body.form_type;
        const clinicalData = req.body.clinicalData || req.body.clinical_data || {};
        const labData = req.body.labData || req.body.lab_data || clinicalData.lab || {};
        const conclusionData = req.body.conclusionData || req.body.conclusion_data || clinicalData.conclusion || {};

        if (!formType) {
            return res.status(400).json({ error: "Loại mẫu biểu formType là bắt buộc" });
        }

        const isSigning = !!req.body.isSigning || !!req.body.shouldSign;
        const newDocumentErrors = validateNewHealthCheckDocument({
            formType,
            dob,
            examDate: req.body.examDate || req.body.exam_date || new Date(),
            fundingSource: clinicalData?.funding_source || clinicalData?.fundingSource || req.body.fundingSource || req.body.funding_source,
            fitnessClass: conclusionData?.fitness_class || conclusionData?.fitnessClass || req.body.fitnessClass || req.body.fitness_class,
            isSigning
        });
        if (newDocumentErrors.length > 0) {
            return res.status(400).json({ error: newDocumentErrors.join('; '), details: newDocumentErrors });
        }

        const currentUserId = (req as any).userId || 'admin';
        let currentUserName = (req as any).userName || '';
        if (!currentUserName && currentUserId) {
            try {
                const uRes = await query(`SELECT su_name FROM sys_user WHERE su_userid = $1`, [currentUserId]);
                if (uRes.rows.length > 0 && uRes.rows[0].su_name) {
                    currentUserName = uRes.rows[0].su_name;
                }
            } catch {}
        }

        try {
            await this.enrichDocumentsMetadata([{ lab_data: labData }]);

            const xmlData = generateXmlPayload(
                formType, 
                { patientName, cccd, dob, gender, docNo }, 
                clinicalData, 
                labData, 
                conclusionData
            );

            // Lấy số tiếp nhận gốc của HIS từ mã số hồ sơ KSK hoặc body
            const bodyHisDocNo = req.body.his_doc_no || req.body.hisDocNo;
            const hisDocNoStr = docNo ? docNo.split('-').pop() : '';
            let hisDocNo = (bodyHisDocNo && /^\d+$/.test(String(bodyHisDocNo).trim()))
                ? parseInt(String(bodyHisDocNo).trim(), 10)
                : (hisDocNoStr && /^\d+$/.test(hisDocNoStr.trim()) ? parseInt(hisDocNoStr.trim(), 10) : null);
            if (hisDocNo && (isNaN(hisDocNo) || hisDocNo > 2147483647 || hisDocNo < -2147483648)) {
                hisDocNo = null;
            }

            const result = await transaction(async (client) => {
                // Check if doc_no already exists in health_check_masters
                const existingRes = await client.query(
                    'SELECT id, signature_status, send_status, his_doc_no FROM health_check_masters WHERE doc_no = $1 FOR UPDATE',
                    [docNo]
                );

                let masterId;
                if (existingRes.rows.length > 0) {
                    if (existingRes.rows[0].signature_status === 'Signed' || existingRes.rows[0].send_status === 'Success') {
                        const err: any = new Error('Hồ sơ đã ký số hoặc đã gửi cổng, không thể ghi đè bằng thao tác tạo mới.');
                        err.statusCode = 423;
                        throw err;
                    }
                    masterId = existingRes.rows[0].id;
                    if (!hisDocNo && existingRes.rows[0]?.his_doc_no && /^\d+$/.test(String(existingRes.rows[0].his_doc_no).trim())) {
                        hisDocNo = parseInt(String(existingRes.rows[0].his_doc_no).trim(), 10);
                    }
                    
                    // Fetch existing details with lock to perform deep merge
                    const detailRes = await client.query(
                        'SELECT clinical_data, lab_data, conclusion_data FROM health_check_details WHERE master_id = $1 FOR UPDATE',
                        [masterId]
                    );

                    let finalClinicalData = clinicalData || {};
                    let finalLabData = labData || {};
                    let finalConclusionData = conclusionData || {};

                    if (detailRes.rows.length > 0) {
                        const existingDetail = detailRes.rows[0];
                        const existingClinical = typeof existingDetail.clinical_data === 'string'
                            ? JSON.parse(existingDetail.clinical_data)
                            : (existingDetail.clinical_data || {});
                        const existingLab = typeof existingDetail.lab_data === 'string'
                            ? JSON.parse(existingDetail.lab_data)
                            : (existingDetail.lab_data || {});
                        const existingConclusion = typeof existingDetail.conclusion_data === 'string'
                            ? JSON.parse(existingDetail.conclusion_data)
                            : (existingDetail.conclusion_data || {});

                        finalClinicalData = mergeClinicalData(existingClinical, clinicalData || {});
                        finalLabData = mergeLabData(existingLab, labData || {});
                        finalConclusionData = mergeConclusionData(existingConclusion, conclusionData || {});
                    }

                    const xmlData = generateXmlPayload(
                        formType, 
                        { patientName, cccd, dob, gender, docNo }, 
                        finalClinicalData, 
                        finalLabData, 
                        finalConclusionData
                    );

                    // UPDATE existing master
                    const masterSql = `
                        UPDATE health_check_masters 
                        SET patient_id = $1, patient_name = $2, cccd = $3, dob = $4, 
                            gender = $5, xml_data = $6, updated_at = NOW(),
                            signature = NULL, signature_status = 'Unsigned', send_status = 'Unsent',
                            sent_at = NULL, transaction_id = NULL, error_message = NULL, response_log = NULL,
                            created_by = COALESCE(created_by, $8),
                            created_by_name = COALESCE(created_by_name, $9)
                        WHERE id = $7
                    `;
                    await client.query(masterSql, [
                        patientId || null, patientName || '', cccd || '', 
                        formatYmdString(dob), gender || 'Nam', 
                        xmlData, masterId, currentUserId, currentUserName
                    ]);

                    // UPDATE existing details
                    const updateDetailRes = await client.query(`
                        UPDATE health_check_details 
                        SET clinical_data = $1, lab_data = $2, conclusion_data = $3, updated_at = NOW()
                        WHERE master_id = $4
                    `, [
                        JSON.stringify(finalClinicalData), 
                        JSON.stringify(finalLabData), 
                        JSON.stringify(finalConclusionData),
                        masterId
                    ]);

                    if (updateDetailRes.rowCount === 0) {
                        await client.query(`
                            INSERT INTO health_check_details (master_id, clinical_data, lab_data, conclusion_data)
                            VALUES ($1, $2, $3, $4)
                        `, [
                            masterId,
                            JSON.stringify(finalClinicalData),
                            JSON.stringify(finalLabData),
                            JSON.stringify(finalConclusionData)
                        ]);
                    }

                    if (hisDocNo) {
                        if (finalLabData?.paraclinical_items) {
                            await this.pushbackTestAndPacsResults(client, hisDocNo, finalLabData.paraclinical_items, finalClinicalData);
                        }
                        await hisIntegrationController.pushbackClinicalAndConclusion(
                            client,
                            hisDocNo,
                            finalClinicalData,
                            finalConclusionData,
                            currentUserId,
                            currentUserName
                        );
                    }
                } else {
                    const xmlData = generateXmlPayload(
                        formType, 
                        { patientName, cccd, dob, gender, docNo }, 
                        clinicalData, 
                        labData, 
                        conclusionData
                    );

                    // INSERT new master
                    const masterSql = `
                        INSERT INTO health_check_masters (
                            patient_id, patient_name, cccd, dob, gender, doc_no, form_type, xml_data, created_by, created_by_name
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        RETURNING id
                    `;
                    const masterRes = await client.query(masterSql, [
                        patientId || null, patientName || '', cccd || '', 
                        formatYmdString(dob), gender || 'Nam', 
                        docNo || Date.now().toString(), formType, xmlData,
                        currentUserId, currentUserName
                    ]);
                    masterId = masterRes.rows[0].id;

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

                    if (hisDocNo) {
                        if (labData?.paraclinical_items) {
                            await this.pushbackTestAndPacsResults(client, hisDocNo, labData.paraclinical_items, clinicalData);
                        }
                        await hisIntegrationController.pushbackClinicalAndConclusion(
                            client,
                            hisDocNo,
                            clinicalData,
                            conclusionData,
                            currentUserId,
                            currentUserName
                        );
                    }
                }

                return masterId;
            });

            return res.status(201).json({ success: true, id: result, message: 'Đã tạo hồ sơ và đồng bộ kết quả về HIS thành công.' });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi createDocument:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 4. Cập nhật hồ sơ khám sức khỏe
    async updateDocument(req: Request, res: Response) {
        const id = req.params.id as string;
        const patientId = req.body.patientId || req.body.patient_id;
        const patientName = req.body.patientName || req.body.patient_name;
        const cccd = req.body.cccd;
        const dob = req.body.dob;
        const gender = req.body.gender;
        const docNo = req.body.docNo || req.body.doc_no;
        const formType = req.body.formType || req.body.form_type;
        const clinicalData = req.body.clinicalData || req.body.clinical_data || {};
        const labData = req.body.labData || req.body.lab_data || clinicalData.lab || {};
        const conclusionData = req.body.conclusionData || req.body.conclusion_data || clinicalData.conclusion || {};
        const isSigning = !!req.body.isSigning || !!req.body.shouldSign;

        const numId = parseInt(id, 10);
        if (isNaN(numId) || numId <= 0) {
            return res.status(400).json({ error: `Mã hồ sơ ID không hợp lệ: ${id}` });
        }

        try {
            const updateDocumentErrors = validateNewHealthCheckDocument({
                formType,
                dob,
                examDate: req.body.examDate || req.body.exam_date || new Date(),
                fundingSource: clinicalData?.funding_source || clinicalData?.fundingSource || req.body.fundingSource || req.body.funding_source,
                fitnessClass: conclusionData?.fitness_class || conclusionData?.fitnessClass || req.body.fitnessClass || req.body.fitness_class,
                isSigning,
            });
            if (updateDocumentErrors.length > 0) {
                return res.status(400).json({ error: updateDocumentErrors.join('; '), details: updateDocumentErrors });
            }

            // Check if document has already been successfully synced to VNeID
            const masterCheck = await query(`SELECT send_status, signature_status, his_doc_no FROM health_check_masters WHERE id = $1`, [numId]);
            if (masterCheck.rows.length > 0 && masterCheck.rows[0].send_status === 'Success') {
                return res.status(400).json({ error: "Hồ sơ đã gửi liên thông VNeID thành công, không thể chỉnh sửa!" });
            }

            if (masterCheck.rows.length > 0 && masterCheck.rows[0].signature_status === 'Signed') {
                return res.status(423).json({ error: 'Hồ sơ đã ký số. Phải hủy ký số trước khi chỉnh sửa.' });
            }

            // Lấy số tiếp nhận gốc của HIS từ mã số hồ sơ KSK hoặc his_doc_no
            const bodyHisDocNo = req.body.his_doc_no || req.body.hisDocNo;
            const hisDocNoStr = docNo ? docNo.split('-').pop() : '';
            let hisDocNo = (bodyHisDocNo && /^\d+$/.test(String(bodyHisDocNo).trim()))
                ? parseInt(String(bodyHisDocNo).trim(), 10)
                : (masterCheck.rows[0]?.his_doc_no && /^\d+$/.test(String(masterCheck.rows[0].his_doc_no).trim())
                    ? parseInt(String(masterCheck.rows[0].his_doc_no).trim(), 10)
                    : (hisDocNoStr && /^\d+$/.test(hisDocNoStr.trim()) ? parseInt(hisDocNoStr.trim(), 10) : null));
            if (hisDocNo && (isNaN(hisDocNo) || hisDocNo > 2147483647 || hisDocNo < -2147483648)) {
                hisDocNo = null;
            }

            const currentUserId = (req as any).userId || 'admin';
            let currentUserName = (req as any).userName || '';
            if (!currentUserName && currentUserId) {
                try {
                    const uRes = await query(`SELECT su_name FROM sys_user WHERE su_userid = $1`, [currentUserId]);
                    if (uRes.rows.length > 0 && uRes.rows[0].su_name) {
                        currentUserName = uRes.rows[0].su_name;
                    }
                } catch {}
            }

            await transaction(async (client) => {
                // 1. Fetch current detail row with lock to perform Deep Merge
                const detailRes = await client.query(
                    'SELECT clinical_data, lab_data, conclusion_data FROM health_check_details WHERE master_id = $1 FOR UPDATE',
                    [numId]
                );

                let finalClinicalData = clinicalData || {};
                let finalLabData = labData || {};
                let finalConclusionData = conclusionData || {};

                if (detailRes.rows.length > 0) {
                    const existingDetail = detailRes.rows[0];
                    const existingClinical = typeof existingDetail.clinical_data === 'string'
                        ? JSON.parse(existingDetail.clinical_data)
                        : (existingDetail.clinical_data || {});
                    const existingLab = typeof existingDetail.lab_data === 'string'
                        ? JSON.parse(existingDetail.lab_data)
                        : (existingDetail.lab_data || {});
                    const existingConclusion = typeof existingDetail.conclusion_data === 'string'
                        ? JSON.parse(existingDetail.conclusion_data)
                        : (existingDetail.conclusion_data || {});

                    finalClinicalData = mergeClinicalData(existingClinical, clinicalData || {});
                    finalLabData = mergeLabData(existingLab, labData || {});
                    finalConclusionData = mergeConclusionData(existingConclusion, conclusionData || {});
                }

                // 2. Generate XML on merged data
                await this.enrichDocumentsMetadata([{ lab_data: finalLabData }]);

                const xmlData = generateXmlPayload(
                    formType, 
                    { patientName, cccd, dob, gender, docNo }, 
                    finalClinicalData, 
                    finalLabData, 
                    finalConclusionData
                );

                const masterSql = `
                    UPDATE health_check_masters 
                    SET patient_id = $1, patient_name = $2, cccd = $3, dob = $4, 
                        gender = $5, doc_no = $6, form_type = $7, xml_data = $8, updated_at = NOW(),
                        signature = NULL, signature_status = 'Unsigned', send_status = 'Unsent',
                        sent_at = NULL, transaction_id = NULL, error_message = NULL, response_log = NULL
                    WHERE id = $9
                `;
                await client.query(masterSql, [
                    patientId, patientName, cccd, formatYmdString(dob), 
                    gender, docNo, formType, xmlData, numId
                ]);

                const detailSql = `
                    UPDATE health_check_details 
                    SET clinical_data = $1, lab_data = $2, conclusion_data = $3, updated_at = NOW()
                    WHERE master_id = $4
                `;
                const updateRes = await client.query(detailSql, [
                    JSON.stringify(finalClinicalData), 
                    JSON.stringify(finalLabData), 
                    JSON.stringify(finalConclusionData),
                    numId
                ]);

                if (updateRes.rowCount === 0) {
                    await client.query(`
                        INSERT INTO health_check_details (master_id, clinical_data, lab_data, conclusion_data)
                        VALUES ($1, $2, $3, $4)
                    `, [
                        numId,
                        JSON.stringify(finalClinicalData),
                        JSON.stringify(finalLabData),
                        JSON.stringify(finalConclusionData)
                    ]);
                }

                // 3. ĐẨY NGƯỢC DỮ LIỆU VỀ CÁC BẢNG GỐC CỦA HIS (LÂM SÀNG, SINH HIỆU, KẾT LUẬN, CLS)
                if (hisDocNo) {
                    if (finalLabData?.paraclinical_items) {
                        await this.pushbackTestAndPacsResults(client, hisDocNo, finalLabData.paraclinical_items, finalClinicalData);
                    }
                    await hisIntegrationController.pushbackClinicalAndConclusion(
                        client,
                        hisDocNo,
                        finalClinicalData,
                        finalConclusionData,
                        currentUserId,
                        currentUserName
                    );
                }
            });

            return res.json({ success: true, message: 'Đã cập nhật hồ sơ và đồng bộ kết quả về HIS thành công.' });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi updateDocument:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 5. Xóa hồ sơ khám sức khỏe
    async deleteDocument(req: Request, res: Response) {
        const id = req.params.id as string;
        try {
            const state = await query(`SELECT signature_status, send_status FROM health_check_masters WHERE id = $1`, [parseInt(id)]);
            if (state.rows[0]?.signature_status === 'Signed' || state.rows[0]?.send_status === 'Success') {
                return res.status(423).json({ error: 'Không thể xóa hồ sơ đã ký số hoặc đã gửi cổng.' });
            }
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
            const intIds = docIds.map((id: any) => parseInt(id, 10));
            if (intIds.some((id: number) => !Number.isInteger(id))) return res.status(400).json({ error: 'Danh sách ID hồ sơ không hợp lệ.' });
            const states = await query(`SELECT id, signature_status, send_status FROM health_check_masters WHERE id = ANY($1::int[])`, [intIds]);
            if (states.rows.length !== intIds.length) return res.status(404).json({ error: 'Có hồ sơ không tồn tại.' });
            if (states.rows.some((row: any) => row.send_status === 'Success')) return res.status(409).json({ error: 'Không thể ký lại hồ sơ đã gửi cổng thành công.' });
            if (states.rows.some((row: any) => row.signature_status === 'Signed')) return res.status(409).json({ error: 'Hồ sơ đã ký số. Hãy hủy ký trước khi ký lại.' });

            if (type === 'USB') {
                if (!signatures || typeof signatures !== 'object' || intIds.some((id: number) => !signatures[String(id)])) {
                    return res.status(400).json({ error: 'Thiếu dữ liệu XML đã ký cho một hoặc nhiều hồ sơ.' });
                }
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
                    return res.status(400).json({ error: 'Thiếu dữ liệu XML đã ký từ USB Token.' });
                }
            } else {
                const { getHealthCheckSettings } = require('../../config/health-check-settings');
                const { signXmlViaHisHsm } = require('../../services/his-sign.service');
                const settings = { ...getHealthCheckSettings() };
                
                if (!settings) {
                    throw new Error("Không tìm thấy cấu hình liên thông/ký số HSM.");
                }

                // Override HSM credentials with user-specific values from sys_user if configured
                const userRes = await query(
                    `SELECT su_sign_userid, su_sign_passwd, su_sign_partner FROM sys_user WHERE su_userid = $1`,
                    [(req as any).userId]
                );

                if (userRes.rows.length > 0) {
                    const userRow = userRes.rows[0];
                    if (userRow.su_sign_userid) {
                        settings.hsm_username = userRow.su_sign_userid;
                        console.log(`🔑 [HIS HSM] Sử dụng tài khoản ký HSM cá nhân của user: ${userRow.su_sign_userid}`);
                    }
                    if (userRow.su_sign_partner) {
                        settings.hsm_provider = userRow.su_sign_partner;
                        settings.hsm_client_id = userRow.su_sign_partner;
                    }
                    if (userRow.su_sign_passwd) {
                        const SecurityUtils = require('../../utils/security').default;
                        let decryptedHsmPassword = '';
                        try {
                            if (SecurityUtils.isEncrypted(userRow.su_sign_passwd)) {
                                decryptedHsmPassword = SecurityUtils.resolveSecret(userRow.su_sign_passwd);
                            } else {
                                decryptedHsmPassword = SecurityUtils.decrypt(userRow.su_sign_passwd);
                            }
                        } catch (e: any) {
                            console.warn('⚠️ Decrypting user HSM password failed, using raw:', e.message);
                            decryptedHsmPassword = SecurityUtils.resolveSecret(userRow.su_sign_passwd);
                        }
                        settings.hsm_password = decryptedHsmPassword;
                    }
                }

                console.log(`🔑 [HIS HSM] Bắt đầu ký số HSM cho danh sách hồ sơ: ${docIds.join(', ')}`);

                for (const id of docIds) {
                    const docDetail = await query(
                        `SELECT id, doc_no, xml_data, patient_name FROM health_check_masters WHERE id = $1`,
                        [parseInt(id, 10)]
                    );
                    
                    if (docDetail.rows.length === 0) {
                        throw new Error(`Không tìm thấy hồ sơ ID ${id}`);
                    }
                    
                    const doc = docDetail.rows[0];
                    if (!doc.xml_data) {
                        throw new Error(`Hồ sơ số ${doc.doc_no || id} của bệnh nhân ${doc.patient_name || ''} chưa có dữ liệu XML XML_DATA để ký.`);
                    }

                    // Perform real HSM signature
                    const signedXmlBase64 = await signXmlViaHisHsm(doc.xml_data, settings, doc.doc_no || `ksk_${id}`);
                    
                    // Wrap signature result in standard JSON format expected by sync worker
                    const signatureWrapper = JSON.stringify({
                        signed_file: {
                            file_name: `${doc.doc_no || 'document'}_signed.xml`,
                            mime_type: 'application/xml',
                            data_base64: signedXmlBase64
                        }
                    });

                    const sql = `
                        UPDATE health_check_masters
                        SET "signature" = $1,
                            "signature_status" = 'Signed',
                            "signature_type" = 'HSM',
                            "updated_at" = NOW()
                        WHERE id = $2
                    `;
                    await query(sql, [signatureWrapper, parseInt(id, 10)]);
                    console.log(`✅ [HIS HSM] Ký số HSM thành công cho hồ sơ ${doc.doc_no || id}`);
                }
            }
            return res.json({ success: true, signatureType: type });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi signDocuments:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 7. Đồng bộ cổng y tế
    async unlockDocument(req: Request, res: Response) {
        const id = parseInt(req.params.id as string, 10);
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID hồ sơ không hợp lệ.' });
        const reason = String((req.body as any)?.reason || '').trim();
        if (reason.length < 5 || reason.length > 500) return res.status(422).json({ error: 'Lý do mở khóa phải từ 5 đến 500 ký tự.' });

        try {
            await transaction(async (client) => {
                const state = await client.query(
                    `SELECT m.*, d.clinical_data, d.lab_data, d.conclusion_data
                     FROM health_check_masters m
                     LEFT JOIN health_check_details d ON d.master_id = m.id
                     WHERE m.id = $1
                     FOR UPDATE OF m`,
                    [id]
                );
                if (state.rows.length === 0) {
                    const err: any = new Error('Không tìm thấy hồ sơ.');
                    err.statusCode = 404;
                    throw err;
                }
                const doc = state.rows[0];
                if (doc.send_status === 'Success') {
                    const permissions = Array.isArray((req as any).permissions) ? (req as any).permissions : [];
                    const allowed = permissions.includes('health_check.signature.revoke') || permissions.includes('health_check.unlock') || permissions.includes('admin');
                    if (!allowed) {
                        const err: any = new Error('Hồ sơ đã gửi cổng; cần quyền thu hồi chữ ký để mở khóa.');
                        err.statusCode = 403;
                        throw err;
                    }
                }

                const unsignedXml = generateXmlPayload(
                    doc.form_type,
                    { patientId: doc.patient_id, patientName: doc.patient_name, cccd: doc.cccd, dob: doc.dob, gender: doc.gender, docNo: doc.doc_no },
                    doc.clinical_data || {}, doc.lab_data || {}, doc.conclusion_data || {}
                );
                await client.query(
                    `UPDATE health_check_masters
                     SET xml_data = $1, signature = NULL, signature_status = 'Unsigned',
                         send_status = 'Unsent', sent_at = NULL,
                         transaction_id = NULL, error_message = NULL, response_log = NULL,
                         updated_at = NOW()
                     WHERE id = $2`,
                    [unsignedXml, id]
                );
                await client.query(
                    `INSERT INTO sys_audit_log (table_name, record_id, action, old_data, new_data, changed_fields, user_id, client_ip, context_module)
                     VALUES ('health_check_masters', $1, 'U', $2::jsonb, $3::jsonb, $4::jsonb, $5, $6, 'health-check-signature')`,
                    [String(id), JSON.stringify({ signature_status: doc.signature_status, send_status: doc.send_status }), JSON.stringify({ signature_status: 'Unsigned', send_status: 'Unsent' }), JSON.stringify({ reason }), String((req as any).userId || ''), req.ip]
                );
            });
            return res.json({ success: true, message: 'Đã hủy chữ ký số và mở khóa hồ sơ.' });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ error: error.message });
        }
    }

    async sendDocuments(req: Request, res: Response) {
        const { docIds } = req.body;

        if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
            return res.status(400).json({ error: "Danh sách ID không hợp lệ" });
        }

        try {
            const { sendDocumentsToVNeID } = require('../../services/health-check-sync.service');
            const failedIds = await sendDocumentsToVNeID(docIds.map((id: any) => id.toString()));
            return res.json(failedIds);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi sendDocuments:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    async markBarcodePrinted(req: Request, res: Response) {
        const { docIds, samples } = req.body;

        if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
            return res.status(400).json({ error: "Danh sách ID hồ sơ không hợp lệ" });
        }

        try {
            // 1. Cập nhật trạng thái in master
            const sql = `
                UPDATE health_check_masters
                SET "barcode_printed" = 'Y',
                    "updated_at" = NOW()
                WHERE id = ANY($1::int[])
            `;
            const intIds = docIds.map(id => parseInt(id, 10));
            await query(sql, [intIds]);

            // 2. Gọi hàm lims_order_getsample của HIS để cập nhật thông tin giao nhận mẫu nếu có
            if (samples && Array.isArray(samples) && samples.length > 0) {
                for (const s of samples) {
                    try {
                        const callSql = `
                            SELECT lims_order_getsample(
                                $1::varchar, 
                                $2::varchar, 
                                $3::bigint, 
                                $4::bigint, 
                                $5::varchar, 
                                $6::varchar
                            )
                        `;
                        await query(callSql, [
                            s.userID ? String(s.userID) : '',
                            s.deptID ? String(s.deptID) : '',
                            s.documentNo ? Number(s.documentNo) : 0,
                            s.orderID ? Number(s.orderID) : 0,
                            s.sampleArea ? String(s.sampleArea) : '',
                            s.gateID ? String(s.gateID) : ''
                        ]);
                    } catch (dbErr: any) {
                        console.error(`❌ KSK Controller: Lỗi gọi lims_order_getsample cho order ${s.orderID}:`, dbErr.message);
                    }
                }
            }

            return res.json({ success: true, message: `Đã đánh dấu ${docIds.length} hồ sơ đã in code và cập nhật thông tin HIS.` });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi markBarcodePrinted:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Lấy danh sách chi phí dịch vụ & đơn giá bảo hiểm của bệnh nhân từ HIS Core
     */
    async getDocumentFees(req: Request, res: Response) {
        try {
            const rawId = req.params.id;
            const id = Array.isArray(rawId) ? String(rawId[0] || '') : String(rawId || '');
            if (!id) {
                return res.status(400).json({ success: false, message: 'Thiếu mã hồ sơ' });
            }

            // 1. Tìm thông tin hồ sơ trong health_check_masters
            let masterRes: any;
            if (/^\d+$/.test(id)) {
                masterRes = await query('SELECT id, doc_no, his_doc_no, patient_id, patient_name FROM health_check_masters WHERE id = $1 LIMIT 1', [parseInt(id, 10)]);
            }
            if (!masterRes || masterRes.rows.length === 0) {
                masterRes = await query('SELECT id, doc_no, his_doc_no, patient_id, patient_name FROM health_check_masters WHERE doc_no = $1 LIMIT 1', [id]);
            }

            let hisDocNo: number | null = null;
            let patientName = '';
            let docNoDisplay = '';

            if (masterRes && masterRes.rows.length > 0) {
                const master = masterRes.rows[0];
                docNoDisplay = master.doc_no;
                patientName = master.patient_name;
                if (master.his_doc_no && Number(master.his_doc_no) > 0) {
                    hisDocNo = Number(master.his_doc_no);
                } else if (master.doc_no) {
                    // Trích xuất số hồ sơ HIS từ chuỗi doc_no (VD: KSK-2026-26062886 -> 26062886)
                    const cleaned = String(master.doc_no).replace(/^.*-/, '').replace(/\D/g, '');
                    if (cleaned.length >= 4) {
                        hisDocNo = parseInt(cleaned, 10);
                    }
                }
            } else if (/^\d+$/.test(id)) {
                hisDocNo = parseInt(id, 10);
                docNoDisplay = id;
            }

            if (!hisDocNo) {
                return res.json({
                    success: true,
                    docNo: docNoDisplay || id,
                    docNoDisplay: docNoDisplay || id,
                    patientName: patientName,
                    totalInsuranceCost: 0,
                    totalServiceCost: 0,
                    totalItems: 0,
                    items: [],
                    groups: []
                });
            }

            // 2. Truy vấn chi tiết dịch vụ và đơn giá bảo hiểm từ hms_fee
            const feeSql = `
                SELECT 
                    f.hfe_fee_id AS fee_id,
                    f.hfe_docno AS doc_no,
                    f.hfe_itemid AS item_id,
                    COALESCE(NULLIF(f.hfe_desc, ''), l.hfl_name, 'Dịch vụ y tế') AS item_name,
                    COALESCE(NULLIF(f.hfe_unit, ''), l.hfl_unit, 'Lần') AS unit,
                    COALESCE(f.hfe_quantity, 1) AS quantity,
                    COALESCE(f.hfe_insprice, l.hfl_insprice, 0) AS ins_price,
                    COALESCE(f.hfe_unitprice, l.hfl_servprice, 0) AS unit_price,
                    (COALESCE(f.hfe_insprice, l.hfl_insprice, 0) * COALESCE(f.hfe_quantity, 1)) AS total_ins_cost,
                    COALESCE(f.hfe_cost, f.hfe_unitprice * f.hfe_quantity, 0) AS total_cost,
                    f.hfe_date AS fee_date,
                    f.hfe_status AS status,
                    COALESCE(g.hfg_name, 'Dịch vụ kỹ thuật & Khám') AS group_name
                FROM hms_fee f
                LEFT JOIN hms_fee_list l ON (l.hfl_feeid = f.hfe_itemid)
                LEFT JOIN hms_fee_group g ON (g.hfg_id = COALESCE(f.hfe_feegroup, l.hfl_groupid))
                WHERE f.hfe_docno = $1
                ORDER BY COALESCE(g.hfg_name, ''), f.hfe_fee_id ASC
            `;

            const feeRes = await query(feeSql, [hisDocNo]);
            const items = feeRes.rows.map((r: any) => ({
                fee_id: r.fee_id,
                doc_no: r.doc_no,
                item_id: r.item_id,
                item_name: r.item_name,
                unit: r.unit,
                quantity: parseFloat(r.quantity) || 1,
                ins_price: parseFloat(r.ins_price) || 0,
                unit_price: parseFloat(r.unit_price) || 0,
                total_ins_cost: parseFloat(r.total_ins_cost) || 0,
                total_cost: parseFloat(r.total_cost) || 0,
                fee_date: r.fee_date,
                status: r.status,
                group_name: r.group_name
            }));

            const totalInsuranceCost = items.reduce((sum: number, item: any) => sum + item.total_ins_cost, 0);
            const totalServiceCost = items.reduce((sum: number, item: any) => sum + item.total_cost, 0);

            // Phân nhóm dịch vụ
            const groupMap = new Map<string, { group_name: string; count: number; total_ins_cost: number; total_cost: number }>();
            for (const item of items) {
                const g = item.group_name || 'Dịch vụ khác';
                if (!groupMap.has(g)) {
                    groupMap.set(g, { group_name: g, count: 0, total_ins_cost: 0, total_cost: 0 });
                }
                const entry = groupMap.get(g)!;
                entry.count += 1;
                entry.total_ins_cost += item.total_ins_cost;
                entry.total_cost += item.total_cost;
            }

            return res.json({
                success: true,
                docNo: hisDocNo,
                docNoDisplay: docNoDisplay || String(hisDocNo),
                patientName: patientName,
                totalInsuranceCost,
                totalServiceCost,
                totalItems: items.length,
                items,
                groups: Array.from(groupMap.values())
            });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getDocumentFees:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async resetSyncStatus(req: Request, res: Response) {
        const { id } = req.params;
        const { reason } = req.body;
        const numId = parseInt(String(id), 10);
        if (isNaN(numId)) {
            return res.status(400).json({ error: 'Mã hồ sơ không hợp lệ.' });
        }

        try {
            await transaction(async (client) => {
                const state = await client.query(
                    `SELECT m.*, d.clinical_data, d.lab_data, d.conclusion_data 
                     FROM health_check_masters m
                     LEFT JOIN health_check_details d ON d.master_id = m.id
                     WHERE m.id = $1
                     FOR UPDATE OF m`,
                    [numId]
                );

                if (state.rows.length === 0) {
                    const err: any = new Error('Không tìm thấy hồ sơ.');
                    err.statusCode = 404;
                    throw err;
                }

                const doc = state.rows[0];

                const unsignedXml = generateXmlPayload(
                    doc.form_type,
                    { patientId: doc.patient_id, patientName: doc.patient_name, cccd: doc.cccd, dob: doc.dob, gender: doc.gender, docNo: doc.doc_no },
                    doc.clinical_data || {}, doc.lab_data || {}, doc.conclusion_data || {}
                );

                await client.query(
                    `UPDATE health_check_masters
                     SET xml_data = $1, signature = NULL, signature_status = 'Unsigned',
                         send_status = 'Unsent', sent_at = NULL,
                         transaction_id = NULL, error_message = NULL, response_log = NULL,
                         syt_send_status = 'Unsent', syt_sent_at = NULL,
                         syt_transaction_id = NULL, syt_error_message = NULL, syt_response_log = NULL,
                         updated_at = NOW()
                     WHERE id = $2`,
                    [unsignedXml, numId]
                );

                try {
                    await client.query(
                        `INSERT INTO sys_audit_log (table_name, record_id, action, old_data, new_data, changed_fields, user_id, client_ip, context_module)
                         VALUES ('health_check_masters', $1, 'U', $2::jsonb, $3::jsonb, $4::jsonb, $5, $6, 'health-check-reset-sync')`,
                        [String(numId), JSON.stringify({ signature_status: doc.signature_status, send_status: doc.send_status, syt_send_status: doc.syt_send_status }), JSON.stringify({ signature_status: 'Unsigned', send_status: 'Unsent', syt_send_status: 'Unsent' }), JSON.stringify({ reason: reason || 'Người dùng yêu cầu hủy gửi mở khóa để sửa thông tin' }), String((req as any).userId || ''), req.ip]
                    );
                } catch {}
            });

            return res.json({ success: true, message: 'Đã hủy trạng thái đồng bộ và mở khóa hồ sơ để chỉnh sửa.' });
        } catch (error: any) {
            console.error('❌ Lỗi resetSyncStatus:', error);
            return res.status(error.statusCode || 500).json({ error: error.message });
        }
    }

    async resetSyncStatusBatch(req: Request, res: Response) {
        const { docIds, reason } = req.body;
        if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
            return res.status(400).json({ error: 'Danh sách ID hồ sơ không hợp lệ.' });
        }

        try {
            const intIds = docIds.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id));
            await query(
                `UPDATE health_check_masters
                 SET signature = NULL, signature_status = 'Unsigned',
                     send_status = 'Unsent', sent_at = NULL,
                     transaction_id = NULL, error_message = NULL, response_log = NULL,
                     syt_send_status = 'Unsent', syt_sent_at = NULL,
                     syt_transaction_id = NULL, syt_error_message = NULL, syt_response_log = NULL,
                     updated_at = NOW()
                 WHERE id = ANY($1::int[])`,
                [intIds]
            );

            return res.json({ success: true, message: `Đã hủy gửi và mở khóa ${intIds.length} hồ sơ thành công.` });
        } catch (error: any) {
            console.error('❌ Lỗi resetSyncStatusBatch:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    async createFeesForDoc(req: Request, res: Response) {
        const { docNo, deptId } = req.body;
        if (!docNo) {
            return res.status(400).json({ error: 'Thiếu số hồ sơ khám (docNo).' });
        }

        const numericDocNo = Number(docNo);
        const effectiveDept = String(deptId || 'KB').trim();

        try {
            await query(`SELECT hms_fee_create($1::integer, 'ETPO', $2::varchar)`, [numericDocNo, effectiveDept]);
            return res.json({ success: true, message: 'Đã tạo lập và tính toán mục phí từ chỉ định thành công!' });
        } catch (error: any) {
            console.error('❌ Lỗi createFeesForDoc:', error);
            return res.status(500).json({ error: error.message || 'Lỗi khi gọi hms_fee_create trên HIS.' });
        }
    }
}

export const documentsController = new DocumentsController();
