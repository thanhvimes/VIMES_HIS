// ==================== INSURANCE CONTROLLER ====================
// File: backend/src/controllers/insurance.controller.ts

import { Request, Response } from 'express';
import { query } from '../../config/database';

export interface InsuranceDocument {
    id: string;
    patientId: string;
    patientName: string;
    recordNumber: string;
    yearOfBirth: number;
    gender: string;
    docTypeCode: string;
    docTypeName: string;
    xmlData: string;
    signatureStatus: string;
    sendStatus: string;
    sentTime: string | null;
    transactionId: string | null;
    errorMessage: string | null;
    createdTime: string;
}

class InsuranceController {

    // 1. Lấy danh sách hồ sơ giám định
    async getDocuments(req: Request, res: Response) {
        try {
            const sql = `
                SELECT * FROM bh_document 
                ORDER BY id DESC 
                LIMIT 100
            `;

            const result = await query(sql);

            const documents: InsuranceDocument[] = result.rows.map((row: any) => ({
                id: row.id.toString(),
                patientId: row.patientid,
                patientName: row.patientname,
                recordNumber: row.docno,
                yearOfBirth: 1990, // Placeholder
                gender: 'Nam',    // Placeholder

                docTypeCode: row.typecode,
                docTypeName: row.typename,

                xmlData: row.xmldata,

                signatureStatus: row.signaturestatus || 'Unsigned',
                sendStatus: row.sendstatus || 'Unsent',

                sentTime: row.sentat,
                transactionId: row.transactionid,
                errorMessage: row.errormessage,

                createdTime: row.createdat || new Date().toISOString()
            }));

            return res.json(documents);
        } catch (error) {
            console.error('Lỗi getDocuments:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách hồ sơ bảo hiểm' });
        }
    }

    // 2. Gửi hồ sơ lên cổng giám định
    async sendDocuments(req: Request, res: Response) {
        const { docIds } = (req as any).body;

        if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
            return res.status(400).json({ error: "Danh sách ID không hợp lệ" });
        }

        try {
            const transactionId = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            const sql = `
                UPDATE bh_document
                SET "sendstatus" = 'Success',
                    "sentat" = NOW(),
                    "transactionid" = $1,
                    "updatedat" = NOW(),
                    "errormessage" = NULL
                WHERE id = ANY($2::int[])
                RETURNING id
            `;

            const intIds = docIds.map(id => parseInt(id));
            const result = await query(sql, [transactionId, intIds]);

            const updatedIds = result.rows.map((row: any) => row.id.toString());
            const failedIds = (docIds as string[]).filter(id => !updatedIds.includes(id.toString()));

            return res.json(failedIds);

        } catch (error: any) {
            console.error('Lỗi sendDocuments:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 3. Ký số hồ sơ (Batch)
    async signDocuments(req: Request, res: Response) {
        const { docIds } = (req as any).body;

        if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
            return res.status(400).json({ error: "Danh sách ID không hợp lệ" });
        }

        try {
            const sql = `
                UPDATE bh_document
                SET "signaturestatus" = 'Signed',
                    "updatedat" = NOW()
                WHERE id = ANY($1::int[])
            `;

            const intIds = docIds.map(id => parseInt(id));
            await query(sql, [intIds]);

            return res.json({ success: true });
        } catch (error: any) {
            console.error('Lỗi signDocuments:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export default new InsuranceController();
