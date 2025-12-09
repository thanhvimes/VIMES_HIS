
import { Request, Response } from 'express';
import { query } from '../config/db';

export class ConsultationController {
  
  // 1. Lưu Phiếu Khám (Clinical Record)
  async saveClinicalRecord(req: any, res: any) {
    try {
      const data = req.body;
      
      // Nếu có ID -> Update, không có -> Create
      if (data.id) {
        const sql = `
            UPDATE "clinicalRecord" 
            SET history = $1, "clinicalExam" = $2, "initialDiagnosis" = $3, 
                conclusion = $4, "treatmentPlan" = $5, "mainDiseaseCode" = $6, "mainDiseaseName" = $7
            WHERE id = $8
            RETURNING *
        `;
        const params = [
            data.history, data.clinicalExam, data.initialDiagnosis,
            data.conclusion, data.treatmentPlan, data.mainDisease?.code, data.mainDisease?.name,
            data.id
        ];
        
        const { rows } = await query(sql, params);
        return res.json(rows[0] || data);
      } else {
        const sql = `
            INSERT INTO "clinicalRecord" 
            ("patientId", "doctorId", "doctorName", history, "clinicalExam", "initialDiagnosis", conclusion, "treatmentPlan", "mainDiseaseCode", "mainDiseaseName")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const params = [
            data.patientId, "DOC-DEFAULT", data.doctorName || "BS. Mặc định",
            data.history, data.clinicalExam, data.initialDiagnosis,
            data.conclusion, data.treatmentPlan, data.mainDisease?.code, data.mainDisease?.name
        ];
        
        const { rows } = await query(sql, params);
        return res.status(201).json(rows[0] || { ...data, id: 'MOCK-REC-ID' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Lỗi khi lưu bệnh án' });
    }
  }

  // 2. Lấy lịch sử khám của một bệnh nhân
  async getClinicalHistory(req: any, res: any) {
    try {
      const { patientId } = req.params;
      const { rows } = await query('SELECT * FROM "clinicalRecord" WHERE "patientId" = $1 ORDER BY "examDate" DESC', [patientId]);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Lỗi tải lịch sử' });
    }
  }
  
  // 3. Lấy chi tiết một phiếu khám
  async getRecordDetail(req: any, res: any) {
      const { id } = req.params;
      try {
          const { rows } = await query('SELECT * FROM "clinicalRecord" WHERE id = $1', [id]);
          if (rows.length > 0) {
              const record = rows[0];
              // Get patient info
              const patRes = await query('SELECT * FROM patient WHERE id = $1', [record.patientId]);
              // Get prescription
              const presRes = await query('SELECT * FROM prescription WHERE "clinicalRecordId" = $1', [id]);
              
              record.patient = patRes.rows[0];
              record.prescription = presRes.rows[0]; // Assuming 1 prescription per record
              
              res.json(record);
          } else {
              res.status(404).json({error: 'Not found'});
          }
      } catch (e) {
          res.json({});
      }
  }

  // 4. Lưu Đơn thuốc (Prescription)
  async savePrescription(req: any, res: any) {
    try {
      const { clinicalRecordId, patientId, items, diagnosis } = req.body;
      const totalAmount = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

      // Using raw queries for transaction logic is complex without a helper, 
      // so we simulate simplified insertion
      
      // 1. Insert Header
      const headerSql = `
        INSERT INTO prescription ("clinicalRecordId", "patientId", diagnosis, "totalAmount", status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      const { rows } = await query(headerSql, [clinicalRecordId, patientId, diagnosis, totalAmount, 'confirmed']);
      const prescriptionId = rows[0]?.id;

      if (prescriptionId) {
          // 2. Insert Items (Loop)
          for (const item of items) {
              await query(`
                INSERT INTO "prescriptionItem" ("prescriptionId", "drugId", quantity, "unitPrice", "totalPrice", morning, noon, afternoon, night, "usageNote")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              `, [prescriptionId, item.drug.id, item.quantity, item.drug.price, item.totalPrice, item.morning, item.noon, item.afternoon, item.night, item.usageNote]);
          }
      }

      res.status(201).json({ id: prescriptionId, message: "Saved" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Lỗi khi lưu đơn thuốc' });
    }
  }
}
