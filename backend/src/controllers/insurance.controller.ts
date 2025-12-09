
import { Request, Response } from 'express';
import { query } from '../config/db';

export class InsuranceController {
  
  // 1. Lấy danh sách giấy tờ
  async getDocuments(req: any, res: any) {
    try {
      const { type } = req.query;
      let sql = 'SELECT * FROM bh_document';
      const params: any[] = [];

      // Xử lý bộ lọc
      if (type && type !== 'All') {
        sql += ' WHERE "typeCode" = $1'; // Lưu ý: Postgres thường chuyển tên cột thành chữ thường, nếu bạn tạo bảng có quote " " thì phải dùng đúng case
        params.push(type);
      }

      sql += ' ORDER BY "createdAt" DESC';

      const { rows } = await query(sql, params);

      // Map dữ liệu từ DB (snake_case hoặc tên cột trong DB) sang Frontend (camelCase)
      // Dựa trên bảng bạn cung cấp: patientname, docno, typeCode...
      const mappedDocs = rows.map(doc => ({
        id: doc.id.toString(),
        patientName: doc.patientname || 'Không tên', // DB: patientname
        yearOfBirth: 0, // Bảng bh_document không có ngày sinh, trả về mặc định
        gender: '---',  // Bảng bh_document không có giới tính, trả về mặc định
        recordNumber: doc.docno || '', // DB: docno
        docTypeCode: doc.typeCode || doc.typecode, // Xử lý case sensitivity
        docTypeName: doc.typeName || doc.typename,
        createdTime: doc.createdAt ? new Date(doc.createdAt).toLocaleString('vi-VN') : '',
        sentTime: doc.sentAt ? new Date(doc.sentAt).toLocaleString('vi-VN') : undefined,
        sendStatus: doc.sendStatus || doc.sendstatus || 'Unsent',
        signatureStatus: doc.signatureStatus || doc.signaturestatus || 'Unsigned',
        transactionId: doc.transactionId || doc.transactionid,
        xmlData: doc.xmlData || doc.xmldata,
        errorMessage: doc.errorMessage || doc.errormessage
      }));

      res.json(mappedDocs);
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500).json({ error: 'Lỗi khi tải danh sách giấy tờ (SQL Error)' });
    }
  }

  // 2. Gửi giấy tờ lên cổng (Giả lập update status)
  async sendDocuments(req: any, res: any) {
    try {
      const { docIds } = req.body; // Array of IDs (strings)

      if (!docIds || !Array.isArray(docIds)) {
        return res.status(400).json({ error: 'Danh sách ID không hợp lệ' });
      }

      const failedIds: string[] = [];

      // Xử lý từng hồ sơ (Trong thực tế có thể dùng transaction hoặc bulk update)
      for (const idStr of docIds) {
        const id = parseInt(idStr);
        if (isNaN(id)) continue;

        // Giả lập logic gửi: Random thành công/thất bại
        const isSuccess = Math.random() > 0.2; 
        
        const status = isSuccess ? 'Success' : 'Error';
        const sentAt = isSuccess ? new Date() : null;
        const transactionId = isSuccess ? `TRX-${Date.now()}` : null;
        const errorMessage = isSuccess ? null : 'Lỗi kết nối cổng';

        // Cập nhật vào DB
        const updateSql = `
          UPDATE bh_document 
          SET "sendStatus" = $1, "sentAt" = $2, "transactionId" = $3, "errorMessage" = $4
          WHERE id = $5
        `;
        
        await query(updateSql, [status, sentAt, transactionId, errorMessage, id]);

        if (!isSuccess) {
            failedIds.push(idStr);
        }
      }

      res.json(failedIds);
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500).json({ error: 'Lỗi khi gửi hồ sơ' });
    }
  }

  // 3. Ký số
  async signDocuments(req: any, res: any) {
      try {
          const { docIds } = req.body;
          if (!docIds || !Array.isArray(docIds)) {
            return res.status(400).json({ error: 'Danh sách ID không hợp lệ' });
          }

          // Chuyển mảng string ID thành mảng số để dùng trong SQL IN (...)
          // Lưu ý: với pg, ta có thể dùng cú pháp = ANY($1)
          const ids = docIds.map(id => parseInt(id)).filter(id => !isNaN(id));

          if (ids.length > 0) {
            const sql = `
                UPDATE bh_document 
                SET "signatureStatus" = 'Signed'
                WHERE id = ANY($1::int[])
            `;
            await query(sql, [ids]);
          }

          res.json({ success: true });
      } catch (error) {
          console.error('Database Error:', error);
          res.status(500).json({ error: 'Lỗi ký số' });
      }
  }
}
