
import { Request, Response } from 'express';
import { query } from '../config/db';

export class InsuranceController {
  
  // 1. Lấy danh sách hồ sơ giám định
  async getDocuments(req: any, res: any) {
    try {
      // Lấy 100 hồ sơ mới nhất
      const sql = `
        SELECT * FROM bh_document 
        ORDER BY id DESC 
        LIMIT 100
      `;
      
      const result = await query(sql);
      
      // Map dữ liệu từ DB (thường là lowercase) sang format Frontend (camelCase)
      const documents = result.rows.map((row: any) => ({
        id: row.id.toString(),
        patientId: row.patientid, // Postgres thường trả về lowercase nếu không quote lúc tạo bảng
        patientName: row.patientname,
        recordNumber: row.docno,
        // Dữ liệu giả lập cho các trường không có trong bảng bh_document
        yearOfBirth: 1990, 
        gender: 'Nam', 
        
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

      res.json(documents);
    } catch (error: any) {
      console.error('Lỗi getDocuments:', error);
      res.status(500).json({ error: 'Không thể lấy danh sách hồ sơ bảo hiểm' });
    }
  }

  // 2. Gửi hồ sơ lên cổng giám định (Giả lập)
  async sendDocuments(req: any, res: any) {
    const { docIds } = req.body; // Mảng các ID (string hoặc number)

    if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
      return res.status(400).json({ error: "Danh sách ID không hợp lệ" });
    }

    try {
      // Giả lập transaction ID từ cổng
      const transactionId = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Cập nhật trạng thái trong DB
      // Sử dụng cú pháp ANY để update nhiều dòng 1 lúc
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
      
      // Chuyển đổi docIds sang mảng số nguyên để PostgreSQL hiểu
      const intIds = docIds.map(id => parseInt(id));

      const result = await query(sql, [transactionId, intIds]);
      
      // Tìm các ID bị lỗi (không được cập nhật - có thể do ID không tồn tại)
      const updatedIds = result.rows.map((row: any) => row.id.toString());
      const failedIds = docIds.filter(id => !updatedIds.includes(id.toString()));

      // Trả về danh sách các ID bị lỗi (Frontend mong đợi mảng này rỗng nếu thành công hết)
      res.json(failedIds);

    } catch (error: any) {
      console.error('Lỗi sendDocuments:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // 3. Ký số hồ sơ (Batch)
  async signDocuments(req: any, res: any) {
    const { docIds } = req.body;

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

      res.json({ success: true });
    } catch (error: any) {
      console.error('Lỗi signDocuments:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
