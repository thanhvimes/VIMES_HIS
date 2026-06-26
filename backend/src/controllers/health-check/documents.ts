import { Request, Response } from 'express';
import { query, transaction } from '../../config/database';
import { getHealthCheckSettings } from '../../config/health-check-settings';
import { generateXmlPayload } from './xml-generator';

class DocumentsController {
    
    // Helper to enrich paraclinical items with metadata from hms_fee_list
    private async enrichDocumentsMetadata(documents: any[]) {
        if (!Array.isArray(documents) || documents.length === 0) return;
        
        const serviceCodesSet = new Set<string>();
        for (const doc of documents) {
            if (doc && doc.lab_data && doc.lab_data.paraclinical_items && Array.isArray(doc.lab_data.paraclinical_items)) {
                for (const item of doc.lab_data.paraclinical_items) {
                    if (item && item.service_code) {
                        serviceCodesSet.add(String(item.service_code).trim());
                    }
                }
            }
        }
        
        const serviceCodes = Array.from(serviceCodesSet).filter(Boolean);
        if (serviceCodes.length === 0) return;
        
        try {
            const feeMetadataRes = await query(`
                SELECT TRIM(f.hfl_feeid) AS service_code, 
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
                            const code = String(item.service_code || '').trim();
                            const meta = metadataMap.get(code);
                            if (meta) {
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
    }

    // 1. Lấy danh sách hồ sơ (kèm phân trang, lọc nâng cao)
    async getDocuments(req: Request, res: Response) {
        try {
            const { searchTerm, status, signatureStatus, formType, startDate, endDate, barcodePrinted } = req.query;
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

            sql += ` ORDER BY m.id DESC LIMIT 100`;

            const result = await query(sql, params);
            await this.enrichDocumentsMetadata(result.rows);
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
        const { 
            patientId, patientName, cccd, dob, gender, docNo, formType,
            clinicalData, labData, conclusionData 
        } = req.body;

        if (!formType) {
            return res.status(400).json({ error: "Loại mẫu biểu formType là bắt buộc" });
        }

        try {
            const xmlData = generateXmlPayload(
                formType, 
                { patientName, cccd, dob, gender, docNo }, 
                clinicalData, 
                labData, 
                conclusionData
            );

            // Lấy số tiếp nhận gốc của HIS từ mã số hồ sơ KSK
            const hisDocNoStr = docNo ? docNo.split('-').pop() : '';
            let hisDocNo = hisDocNoStr ? parseInt(hisDocNoStr, 10) : null;
            if (hisDocNo && (isNaN(hisDocNo) || hisDocNo > 2147483647 || hisDocNo < -2147483648)) {
                hisDocNo = null;
            }

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

                // 2. ĐẨY NGƯỢC DỮ LIỆU VỀ CÁC BẢNG GỐC CỦA HIS (Chỉ khi hpc_status và hpcl_status thuộc nhóm O hoặc S)
                if (hisDocNo && labData?.paraclinical_items) {
                    for (const item of labData.paraclinical_items) {
                        const code = item.service_code;
                        const orderId = item.order_id ? parseInt(item.order_id) : null;

                        if (item.type === 'XN') {
                            // Kiểm tra trạng thái hpc_status và hpcl_status của Xét nghiệm
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
                                `, [item.value || '', hisDocNo, code]);
                            }
                        } else if ((item.type === 'HA' || item.type === 'TD') && orderId) {
                            // Kiểm tra trạng thái hpc_status và hpcl_status của CĐHA / TDCN
                            const statusCheck = await client.query(`
                                SELECT 1 FROM hms_pacsorderline l
                                JOIN hms_pacsorder o ON o.hpc_orderid = l.hpcl_orderid
                                WHERE o.hpc_orderid = $1 AND l.hpcl_itemid = $2
                                  AND o.hpc_status IN ('O', 'S') AND l.hpcl_status IN ('O', 'S')
                            `, [orderId, code]);

                            if (statusCheck.rows.length > 0) {
                                // Cập nhật kết luận (Conclusion/Result) của CĐHA / TDCN
                                await client.query(`
                                    UPDATE hms_pacs_result 
                                    SET hpr_desc = $1
                                    WHERE hpr_orderid = $2 
                                      AND hpr_itemid = $3 
                                      AND LOWER(hpr_name) IN ('conclusion', 'result')
                                `, [item.conclusion || item.value || '', orderId, code]);

                                // Cập nhật mô tả chi tiết (Remark) của CĐHA / TDCN nếu có
                                if (item.description !== undefined) {
                                    await client.query(`
                                        UPDATE hms_pacs_result 
                                        SET hpr_desc = $1
                                        WHERE hpr_orderid = $2 
                                          AND hpr_itemid = $3 
                                          AND LOWER(hpr_name) = 'remark'
                                    `, [item.description || '', orderId, code]);
                                }
                            }
                        }
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
        const { 
            patientId, patientName, cccd, dob, gender, docNo, formType,
            clinicalData, labData, conclusionData 
        } = req.body;

        try {
            const xmlData = generateXmlPayload(
                formType, 
                { patientName, cccd, dob, gender, docNo }, 
                clinicalData, 
                labData, 
                conclusionData
            );

            // Lấy số tiếp nhận gốc của HIS từ mã số hồ sơ KSK (ví dụ: KSK-2026-12345 -> 12345)
            const hisDocNoStr = docNo ? docNo.split('-').pop() : '';
            let hisDocNo = hisDocNoStr ? parseInt(hisDocNoStr, 10) : null;
            if (hisDocNo && (isNaN(hisDocNo) || hisDocNo > 2147483647 || hisDocNo < -2147483648)) {
                hisDocNo = null;
            }

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

                // 2. ĐẨY NGƯỢC DỮ LIỆU VỀ CÁC BẢNG GỐC CỦA HIS (Chỉ khi hpc_status và hpcl_status thuộc nhóm O hoặc S)
                if (hisDocNo && labData?.paraclinical_items) {
                    for (const item of labData.paraclinical_items) {
                        const code = item.service_code;
                        const orderId = item.order_id ? parseInt(item.order_id) : null;

                        if (item.type === 'XN') {
                            // Kiểm tra trạng thái hpc_status và hpcl_status của Xét nghiệm
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
                                `, [item.value || '', hisDocNo, code]);
                            }
                        } else if ((item.type === 'HA' || item.type === 'TD') && orderId) {
                            // Kiểm tra trạng thái hpc_status và hpcl_status của CĐHA / TDCN
                            const statusCheck = await client.query(`
                                SELECT 1 FROM hms_pacsorderline l
                                JOIN hms_pacsorder o ON o.hpc_orderid = l.hpcl_orderid
                                WHERE o.hpc_orderid = $1 AND l.hpcl_itemid = $2
                                  AND o.hpc_status IN ('O', 'S') AND l.hpcl_status IN ('O', 'S')
                            `, [orderId, code]);

                            if (statusCheck.rows.length > 0) {
                                // Cập nhật kết luận (Conclusion/Result) của CĐHA / TDCN
                                await client.query(`
                                    UPDATE hms_pacs_result 
                                    SET hpr_desc = $1
                                    WHERE hpr_orderid = $2 
                                      AND hpr_itemid = $3 
                                      AND LOWER(hpr_name) IN ('conclusion', 'result')
                                `, [item.conclusion || item.value || '', orderId, code]);

                                // Cập nhật mô tả chi tiết (Remark) của CĐHA / TDCN nếu có
                                if (item.description !== undefined) {
                                    await client.query(`
                                        UPDATE hms_pacs_result 
                                        SET hpr_desc = $1
                                        WHERE hpr_orderid = $2 
                                          AND hpr_itemid = $3 
                                          AND LOWER(hpr_name) = 'remark'
                                    `, [item.description || '', orderId, code]);
                                }
                            }
                        }
                    }
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
            const { sendDocumentsToVNeID } = require('../../services/health-check-sync.service');
            const failedIds = await sendDocumentsToVNeID(docIds.map((id: any) => id.toString()));
            return res.json(failedIds);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi sendDocuments:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    async markBarcodePrinted(req: Request, res: Response) {
        const { docIds } = req.body;

        if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
            return res.status(400).json({ error: "Danh sách ID hồ sơ không hợp lệ" });
        }

        try {
            const sql = `
                UPDATE health_check_masters
                SET "barcode_printed" = 'Y',
                    "updated_at" = NOW()
                WHERE id = ANY($1::int[])
            `;
            const intIds = docIds.map(id => parseInt(id, 10));
            await query(sql, [intIds]);
            return res.json({ success: true, message: `Đã đánh dấu ${docIds.length} hồ sơ đã in code.` });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi markBarcodePrinted:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const documentsController = new DocumentsController();
